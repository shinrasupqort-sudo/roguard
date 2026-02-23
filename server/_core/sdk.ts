import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import bcrypt from "bcryptjs";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { logAuthEvent } from "../firebase"; // write auth logs to firebase realtime database
import { isAdminEmail } from "../adminUsers";


const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

export type SessionPayload = {
  userId: number;
  email: string;
  role: string;
};

class SDKServer {
  private readonly jwtSecret: Uint8Array;

  constructor() {
    const secret = process.env.JWT_SECRET || "roguard-default-secret-change-in-production";
    this.jwtSecret = new TextEncoder().encode(secret);
  }

  private parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) {
      return new Map<string, string>();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }

  /**
   * Create a JWT session token
   */
  async createSessionToken(
    userId: number,
    email: string,
    role: string,
    options?: { expiresInMs?: number }
  ): Promise<string> {
    const expiresInMs = options?.expiresInMs ?? ONE_YEAR_MS;
    const token = await new SignJWT({
      userId,
      email,
      role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(Date.now() + expiresInMs)
      .sign(this.jwtSecret);

    return token;
  }

  /**
   * Verify a JWT token and extract payload
   */
  async verifySessionToken(token: string): Promise<SessionPayload | null> {
    try {
      const verified = await jwtVerify(token, this.jwtSecret);
      return verified.payload as SessionPayload;
    } catch {
      return null;
    }
  }

  /**
   * Hash a password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  /**
   * Verify a password against a bcrypt hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Authenticate a request by checking the session cookie
   */
  async authenticateRequest(req: Request): Promise<User | null> {
    const cookieHeader = req.headers.cookie;
    const cookies = this.parseCookies(cookieHeader);
    const sessionToken = cookies.get(COOKIE_NAME);

    if (!isNonEmptyString(sessionToken)) {
      return null;
    }

    const payload = await this.verifySessionToken(sessionToken);
    if (!payload) {
      return null;
    }

    const user = await db.getUserById(payload.userId);
    if (!user || user.isBanned) {
      return null;
    }

    return user;
  }

  /**
   * Register a new user with email and password
   */
  /**
   * Normalize emails consistently on the server side.  Trims whitespace
   * and lowercases the value so that comparisons and storage behave
   * predictably.
   */
  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  async registerUser(
    email: string,
    password: string,
    name?: string
  ): Promise<User | null> {
    const normalized = this.normalizeEmail(email);
    console.log(`[SDK] registerUser called for email=${normalized}`);

    const existingUser = await db.getUserByEmail(normalized);
    if (existingUser && existingUser.passwordHash) {
      console.log(`[SDK] registration blocked, user already exists:`, existingUser);
      return null; // User already exists with a password
    }

    const passwordHash = await this.hashPassword(password);
    // decide role depending on whether this email is in the admin list
    const isAdmin = isAdminEmail(normalized);
    const user = await db.createUser(normalized, passwordHash, name, isAdmin ? "admin" : "user");
    if (!user) {
      logAuthEvent({ action: "register", email: normalized, success: false });
      console.warn("[SDK] createUser returned null");
      throw new Error("Failed to create user (database error)");
    }

    logAuthEvent({ action: "register", userId: user.id, email: normalized, success: true });
    console.log(`[SDK] new user created:`, user);
    return user;
  }

  /**
   * Login user with email and password
   */
  async loginUser(email: string, password: string): Promise<User | null> {
    const normalized = this.normalizeEmail(email);
    console.log(`[SDK] loginUser attempt for email=${normalized}`);
    const user = await db.getUserByEmail(normalized);
    if (!user || !user.passwordHash) {
      console.log(`[SDK] login failed, user not found or no password:`, user);
      return null; // User not found or password not set
    }

    const isPasswordValid = await this.verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      logAuthEvent({ action: "login", email: normalized, success: false });
      console.log("[SDK] login failed, bad password");
      return null; // Invalid password
    }

    if (user.isBanned) {
      logAuthEvent({ action: "login", userId: user.id, email: normalized, success: false, reason: "banned" });
      console.log("[SDK] login failed, user is banned");
      return null; // User is banned
    }

    await db.updateUserLastSignedIn(user.id);
    logAuthEvent({ action: "login", userId: user.id, email: normalized, success: true });
    console.log("[SDK] login success for", user.id);
    return user;
  }

  /**
   * Create a guest user
   */
  async createGuestUser(): Promise<User | null> {
    const guestEmail = `guest_${Date.now()}_${Math.random()
      .toString(36)
      .substring(7)}@guest.local`;
    const user = await db.createUser(guestEmail, "", `Guest ${Date.now()}`);
    if (!user) {
      throw new Error("Failed to create guest user (database error)");
    }
    return user;
  }
}

export const sdk = new SDKServer();

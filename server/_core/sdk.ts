import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import bcrypt from "bcryptjs";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../db";
import * as db from "../db";
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

  async verifySessionToken(token: string): Promise<SessionPayload | null> {
    try {
      const verified = await jwtVerify(token, this.jwtSecret);
      return verified.payload as SessionPayload;
    } catch {
      return null;
    }
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

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
      return null;
    }

    const passwordHash = await this.hashPassword(password);
    const isAdmin = isAdminEmail(normalized);
    const role = isAdmin ? "admin" : "user";
    const user = await db.createUser(normalized, passwordHash, name, role as any);
    if (!user) {
      console.warn("[SDK] createUser returned null");
      throw new Error("Failed to create user (database error)");
    }

    console.log(`[SDK] new user created:`, user);
    return user;
  }

  async loginUser(email: string, password: string): Promise<User | null> {
    const normalized = this.normalizeEmail(email);
    console.log(`[SDK] loginUser attempt for email=${normalized}`);
    const user = await db.getUserByEmail(normalized);
    if (!user || !user.passwordHash) {
      console.log(`[SDK] login failed, user not found or no password:`, user);
      return null;
    }

    const isPasswordValid = await this.verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      console.log("[SDK] login failed, bad password");
      return null;
    }

    if (user.isBanned) {
      console.log("[SDK] login failed, user is banned");
      return null;
    }

    await db.updateUserLastSignedIn(user.id);
    console.log("[SDK] login success for", user.id);
    return user;
  }

  async createGuestUser(): Promise<User | null> {
    const guestEmail = `guest_${Date.now()}_${Math.random()
      .toString(36)
      .substring(7)}@guest.local`;
    const role = "user";
    const user = await db.createUser(guestEmail, "", `Guest ${Date.now()}`, role);
    if (!user) {
      throw new Error("Failed to create guest user (database error)");
    }
    return user;
  }
}

export const sdk = new SDKServer();

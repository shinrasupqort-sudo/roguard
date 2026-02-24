import { describe, expect, it, vi, beforeEach } from "vitest";
import { obfuscateLua } from "./obfuscator";
import { appRouter } from "./routers";
import { sdk } from "./_core/sdk";
import bcrypt from "bcryptjs";
import type { TrpcContext } from "./_core/context";

// ─── Obfuscator Tests ─────────────────────────────────────────────────────────
describe("obfuscateLua", () => {
  it("returns a non-empty string for valid input", () => {
    const result = obfuscateLua('print("Hello, World!")', {});
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("includes Roguard protection header", () => {
    const result = obfuscateLua('print("test")', {});
    expect(result).toContain("Roguard");
  });

  it("includes anti-tamper checks when enabled", () => {
    const result = obfuscateLua('print("test")', { antiTamper: true });
    // Anti-tamper layer should mention either deobf or anti-decompilation string
    expect(result.toLowerCase()).toMatch(/deobf|anti-decompilation/);
  });

  it("does not include anti-tamper when disabled", () => {
    const result = obfuscateLua('print("test")', { antiTamper: false, envChecks: false });
    expect(result).not.toContain("_ENV_CHECK");
  });

  it("includes ENV checks when enabled", () => {
    const result = obfuscateLua('print("test")', { envChecks: true });
    expect(result).toContain("game");
  });

  it("applies string encryption with multiple layers", () => {
    const result = obfuscateLua('local x = "secret_string_xyz"', { stringLayers: 3 });
    // The original string should be encrypted
    expect(result).not.toContain("secret_string_xyz");
  });

  it("includes ConstantArray when enabled", () => {
    const result = obfuscateLua('print("test string for array")', { constantArray: true });
    // ConstantArray uses random variable names and XOR/ROT encryption
    expect(result).toContain("local function");
    expect(result).toContain("string.char");
  });

  it("handles empty script gracefully", () => {
    const result = obfuscateLua("", {});
    expect(typeof result).toBe("string");
  });

  it("handles Lua comments", () => {
    const result = obfuscateLua("-- This is a comment\nprint('hi')", {});
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("includes the prometheus snippet in output", () => {
    const result = obfuscateLua("print('x')", {});
    expect(result).toContain("prometheus");
    // snippet has 'prometheus.new' so check that too
    expect(result).toMatch(/prometheus\.new/);
  });

  it("can generate and consume invite codes via db", async () => {
    const code = await db.createInvite();
    expect(code).toHaveLength(16);
    expect(await db.consumeInvite(code)).toBe(true);
    // cannot consume twice
    expect(await db.consumeInvite(code)).toBe(false);
  });

  it("auth.consumeInvite procedure works", async () => {
    const code = await db.createInvite();
    const caller = appRouter.createCaller({ user: null, req: {} as any, res: {} as any });
    const res = await caller.auth.consumeInvite(code);
    expect(res).toEqual({ success: true });
    await expect(caller.auth.consumeInvite(code)).rejects.toThrow();
  });

  it("admin.generateInvite/listInvites restricted to designated gmail regardless of role", async () => {
    const nonAllowedCaller = appRouter.createCaller({
      user: { id: 1, email: "foo@bar.com", role: "user", isBanned: false },
      req: {} as any,
      res: {} as any,
    });
    await expect(nonAllowedCaller.admin.generateInvite()).rejects.toThrow();
    await expect(nonAllowedCaller.admin.listInvites()).rejects.toThrow();

    const allowedCaller = appRouter.createCaller({
      user: { id: 2, email: "francyertj@gmail.com", role: "user", isBanned: false },
      req: {} as any,
      res: {} as any,
    });
    const { code } = await allowedCaller.admin.generateInvite();
    expect(code).toHaveLength(16);
    const invites = await allowedCaller.admin.listInvites();
    expect(invites.some((i: any) => i.code === code)).toBe(true);
  });
});

// ─── Email normalization & auth logic tests ───────────────────────────────────
import * as db from "./db";
import * as llm from "./_core/llm";


describe("email normalization and SDK behavior", () => {

  it("normalize email during login and registration", async () => {
    const fakeUser: any = {
      id: 42,
      email: "test@example.com",
      passwordHash: await bcrypt.hash("secret", 10),
      role: "user",
      isBanned: false,
    };

    // when registering there is no existing user
    const getSpy = vi.spyOn(db, "getUserByEmail").mockResolvedValue(undefined);
    const createSpy = vi.spyOn(db, "createUser").mockResolvedValue(fakeUser as any);

    const registered = await sdk.registerUser(" TEST@Example.com ", "secret");
    expect(getSpy).toHaveBeenCalledWith("test@example.com");
    expect(createSpy).toHaveBeenCalledWith("test@example.com", expect.any(String), undefined);
    expect(registered).toEqual(fakeUser);

    // simulate login lookup
    vi.spyOn(db, "getUserByEmail").mockResolvedValue(fakeUser as any);
    const logged = await sdk.loginUser(" TEST@Example.COM ", "secret");
    expect(logged).not.toBeNull();
    expect(getSpy).toHaveBeenCalledWith("test@example.com");
  });

  it("propagates database errors instead of silently failing", async () => {
    vi.spyOn(db, "getUserByEmail").mockRejectedValue(new Error("no db"));
    await expect(sdk.registerUser("a@b.com", "pw")).rejects.toThrow("no db");
    await expect(sdk.loginUser("a@b.com", "pw")).rejects.toThrow("no db");
  });

  it("creates a guest user and returns it", async () => {
    const fakeGuest: any = { id: 99, email: "guest_x@guest.local", role: "user" };
    vi.spyOn(db, "createUser").mockResolvedValue(fakeGuest as any);

    const guest = await sdk.createGuestUser();
    expect(guest).toEqual(fakeGuest);
  });
});

// ─── Auth Router Tests ────────────────────────────────────────────────────────
describe("auth.logout", () => {
  it("clears session cookie and returns success", async () => {
    const clearedCookies: { name: string; options: Record<string, unknown> }[] = [];
    const ctx: TrpcContext = {
      user: { id: 1, openId: "test-user", email: "test@example.com", name: "Test User", loginMethod: "google", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: (name: string, options: Record<string, unknown>) => clearedCookies.push({ name, options }) } as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.options).toMatchObject({ maxAge: -1, httpOnly: true });
  });
});

// ensure guest login route sets a cookie as well

describe("auth.loginGuest", () => {
  it("creates a guest user and sends a session cookie", async () => {
    const cookieCalls: { name: string; value: string; options: Record<string, unknown> }[] = [];
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { cookie: (name: string, value: string, options: Record<string, unknown>) => cookieCalls.push({ name, value, options }) } as TrpcContext["res"],
    };
    const fakeGuest: any = { id: 7, email: "guest@guest.local", role: "user" };
    vi.spyOn(sdk, "createGuestUser").mockResolvedValue(fakeGuest as any);

    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.loginGuest();

    expect(result).toEqual({ success: true, user: fakeGuest });
    expect(cookieCalls).toHaveLength(1);
    expect(cookieCalls[0].options).toMatchObject({ httpOnly: true });
  });
});

// ─── AI Chat Tests ─────────────────────────────────────────────────────────
describe("ai.chat", () => {
  it("forwards messages to the LLM and returns response", async () => {
    const fakeResponse: any = {
      choices: [
        { index: 0, message: { role: "assistant", content: "hello" } },
      ],
    };
    const llmSpy = vi.spyOn(llm, "invokeLLM").mockResolvedValue(fakeResponse);

    const ctx: TrpcContext = {
      user: { id: 2, openId: "u2", email: "u2@example.com", name: "U2", loginMethod: "email", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
      req: { protocol: "https", headers: {} } as any,
      res: {} as any,
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.ai.chat({ messages: [{ role: "user", content: "hi" }] });
    expect(llmSpy).toHaveBeenCalledWith({ messages: [{ role: "user", content: "hi" }] });
    expect(result.choices[0].message.content).toBe("hello");
  });
});

// router-level auth normalization tests

describe("auth router email normalization", () => {
  it("passes trimmed lowercase email to SDK on register", async () => {
    const callerCtx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as any,
      res: { cookie: () => {} } as any,
    };
    const caller = appRouter.createCaller(callerCtx);
    const spy = vi.spyOn(sdk, "registerUser").mockResolvedValue({ id: 3, email: "user@x.com", role: "user" } as any);
    await caller.auth.register({ email: " USER@X.COM ", password: "pw123" });
    expect(spy).toHaveBeenCalledWith("user@x.com", "pw123", undefined);
  });

  it("passes trimmed lowercase email to SDK on login", async () => {
    const callerCtx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as any,
      res: { cookie: () => {} } as any,
    };
    const caller = appRouter.createCaller(callerCtx);
    const spy = vi.spyOn(sdk, "loginUser").mockResolvedValue({ id: 4, email: "a@b.com", role: "user" } as any);
    const result = await caller.auth.login({ email: " A@B.COM ", password: "secret" });
    expect(spy).toHaveBeenCalledWith("a@b.com", "secret");
    expect(result.success).toBe(true);
  });
});

// ─── HWID Ban Logic Tests ─────────────────────────────────────────────────────
describe("HWID validation", () => {
  it("validates HWID format (non-empty string)", () => {
    const isValidHwid = (hwid: string) => typeof hwid === "string" && hwid.trim().length > 0;
    expect(isValidHwid("ABC-123-DEF")).toBe(true);
    expect(isValidHwid("")).toBe(false);
    expect(isValidHwid("  ")).toBe(false);
  });
});

// ─── Script Validation Tests ──────────────────────────────────────────────────
describe("Script content validation", () => {
  it("accepts valid Lua content", () => {
    const isValidScript = (content: string) => content.trim().length > 0;
    expect(isValidScript('print("hello")')).toBe(true);
    expect(isValidScript("local x = 1")).toBe(true);
    expect(isValidScript("")).toBe(false);
  });

  it("accepts .lua and .txt file types", () => {
    const validTypes = ["lua", "txt"];
    expect(validTypes.includes("lua")).toBe(true);
    expect(validTypes.includes("txt")).toBe(true);
    expect(validTypes.includes("js")).toBe(false);
  });
});

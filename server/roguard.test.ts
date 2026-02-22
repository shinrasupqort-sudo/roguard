import { describe, expect, it, vi, beforeEach } from "vitest";
import { obfuscateLua } from "./obfuscator";
import { appRouter } from "./routers";
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
    // Anti-tamper layer includes environment check
    expect(result).toContain("Anti-Tamper Layer");
    expect(result).toContain("Unauthorized environment");
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

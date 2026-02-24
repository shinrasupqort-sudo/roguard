// In-memory replacement for the previous MySQL/Drizzle database.
// All data lives in volatile JS objects; nothing is persisted, and
// Firebase is no longer required.  This allows the application to
// function without any external database at all.

export type User = {
  id: number;
  email: string;
  passwordHash: string | null;
  name?: string | null;
  avatar?: string | null;
  loginMethod: string;
  hwid?: string | null;
  role: "user" | "admin";
  isBanned: boolean;
  banReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
};

let nextUserId = 1;
const users: User[] = [];

export async function createUser(
  email: string,
  passwordHash: string,
  name?: string,
  role: "user" | "admin" = "user"
): Promise<User | undefined> {
  const norm = email.toLowerCase();
  if (users.find((u) => u.email === norm && u.passwordHash)) {
    return undefined; // already exists with a password
  }
  const user: User = {
    id: nextUserId++,
    email: norm,
    passwordHash,
    name: name ?? null,
    avatar: null,
    loginMethod: "email",
    hwid: null,
    role,
    isBanned: false,
    banReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  users.push(user);
  return user;
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const norm = email.toLowerCase();
  return users.find((u) => u.email === norm);
}

export async function getUserById(id: number): Promise<User | undefined> {
  return users.find((u) => u.id === id);
}

export async function getAllUsers(limit = 50, offset = 0) {
  return users.slice(offset, offset + limit);
}

export async function updateUserHwid(userId: number, hwid: string) {
  const u = await getUserById(userId);
  if (u) {
    u.hwid = hwid;
    u.updatedAt = new Date();
  }
}

export async function updateUserLastSignedIn(userId: number) {
  const u = await getUserById(userId);
  if (u) {
    u.lastSignedIn = new Date();
    u.updatedAt = new Date();
  }
}

export async function banUser(userId: number, reason: string) {
  const u = await getUserById(userId);
  if (u) {
    u.isBanned = true;
    u.banReason = reason;
    u.updatedAt = new Date();
  }
}

export async function unbanUser(userId: number) {
  const u = await getUserById(userId);
  if (u) {
    u.isBanned = false;
    u.banReason = null;
    u.updatedAt = new Date();
  }
}

export async function updateUserRole(userId: number, role: "user" | "admin") {
  const u = await getUserById(userId);
  if (u) {
    u.role = role;
    u.updatedAt = new Date();
  }
}

// invite codes (one‑time use)
export type Invite = { code: string; used: boolean; createdAt: Date };
const invites: Invite[] = [];

export async function createInvite(): string {
  // 16 alphanumeric characters
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let code;
  do {
    code = "";
    for (let i = 0; i < 16; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  } while (invites.find(i => i.code === code));

  invites.push({ code, used: false, createdAt: new Date() });
  return code;
}

export async function consumeInvite(code: string): boolean {
  const inv = invites.find(i => i.code === code);
  if (!inv || inv.used) return false;
  inv.used = true;
  return true;
}

export async function listInvites() {
  return invites;
}

// stubs for the remaining exports - simply no-ops or empty results
export async function createAlert() {}
export async function createExecutorLog() {}
export async function createHwidBan() {}
export async function createRemoteLoader() {}
export async function createScript() {}
export async function deleteRemoteLoader() {}
export async function deleteScript() {}
export async function getAllExecutorLogs() { return []; }
export async function getDashboardStats() { return {}; }
export async function getExecutorLogs() { return []; }
export async function getExecutorLogStats() { return { total: 0, success: 0, errors: 0, blocked: 0, bypass: 0 }; }
export async function getHwidBans() { return []; }
export async function getRemoteLoaderByKey() { return null; }
export async function getScriptById() { return null; }
export async function getTopScripts() { return []; }
export async function getUnreadAlertCount() { return 0; }
export async function getUserAlerts() { return []; }
export async function getUserRemoteLoaders() { return []; }
export async function getUserScripts() { return []; }
export async function getUserSettings() { return null; }
export async function isHwidBanned() { return false; }
export async function markAlertRead() {}
export async function markAllAlertsRead() {}
export async function removeHwidBan() {}
export async function updateRemoteLoader() {}
export async function updateScriptObfuscated() {}
export async function updateUserSettings() {}
export async function incrementRemoteLoaderExecution() {}
export async function incrementScriptExecution() {}

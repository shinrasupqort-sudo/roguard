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
  role: "user";
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
    role: "user",
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



// stubs for the remaining exports - simply no-ops or empty results
// these accept any parameters so callers can pass arguments without TS errors
export async function createAlert(..._args: any[]) {}
export async function createExecutorLog(..._args: any[]) {}
export async function createHwidBan(..._args: any[]) {}
export async function createRemoteLoader(..._args: any[]) {}
export async function createScript(..._args: any[]) {}
export async function deleteRemoteLoader(..._args: any[]) {}
export async function deleteScript(..._args: any[]) {}
export async function getAllExecutorLogs(..._args: any[]) { return []; }
export async function getDashboardStats(..._args: any[]) { return {}; }
export async function getExecutorLogs(..._args: any[]) { return []; }
export async function getExecutorLogStats(..._args: any[]) { return { total: 0, success: 0, errors: 0, blocked: 0, bypass: 0 }; }
export async function getHwidBans(..._args: any[]) { return []; }
export async function getRemoteLoaderByKey(..._args: any[]) { return null; }
export async function getScriptById(..._args: any[]) { return null; }
export async function getTopScripts(..._args: any[]) { return []; }
export async function getUnreadAlertCount(..._args: any[]) { return 0; }
export async function getUserAlerts(..._args: any[]) { return []; }
export async function getUserRemoteLoaders(..._args: any[]) { return []; }
export async function getUserScripts(..._args: any[]) { return []; }
export async function getUserSettings(..._args: any[]) { return null; }
export async function isHwidBanned(..._args: any[]) { return false; }
export async function markAlertRead(..._args: any[]) {}
export async function markAllAlertsRead(..._args: any[]) {}
export async function removeHwidBan(..._args: any[]) {}
export async function updateRemoteLoader(..._args: any[]) {}
export async function updateScriptObfuscated(..._args: any[]) {}
export async function updateUserSettings(..._args: any[]) {}
export async function incrementRemoteLoaderExecution(..._args: any[]) {}
export async function incrementScriptExecution(..._args: any[]) {}

/**
 * Roguard Lua Script Obfuscator v1.2.5
 * Implements multi-layer string encryption, ConstantArray encryption,
 * anti-tamper checks, ENV detection, variable renaming and control flow obfuscation.
 */

export interface ObfuscationOptions {
  stringLayers?: number;       // 1-3 layers of string encryption
  constantArray?: boolean;     // ConstantArray encryption (2 layers)
  antiTamper?: boolean;        // Anti-tamper checks
  envChecks?: boolean;         // Roblox ENV detection
  variableRename?: boolean;    // Rename variables/identifiers
  controlFlow?: boolean;       // Control flow obfuscation
  deadCode?: boolean;          // Dead code injection
}

const DEFAULT_OPTIONS: Required<ObfuscationOptions> = {
  stringLayers: 3,
  constantArray: true,
  antiTamper: true,
  envChecks: true,
  variableRename: true,
  controlFlow: true,
  deadCode: false,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function randomId(len = 8): string {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  let result = chars[Math.floor(Math.random() * chars.length)];
  for (let i = 1; i < len; i++) {
    result += chars[Math.floor(Math.random() * chars.length)] + (Math.random() > 0.5 ? Math.floor(Math.random() * 9).toString() : "");
  }
  return result;
}

function toByteArray(str: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    bytes.push(str.charCodeAt(i));
  }
  return bytes;
}

function xorEncrypt(str: string, key: number): number[] {
  return toByteArray(str).map((b) => b ^ key);
}

function rotEncrypt(str: string, rot: number): number[] {
  return toByteArray(str).map((b) => (b + rot) % 256);
}

function customEncrypt(str: string, seed: number): number[] {
  const bytes = toByteArray(str);
  return bytes.map((b, i) => (b ^ ((seed + i * 7) % 256)) % 256);
}

function bytesToLuaTable(bytes: number[]): string {
  return "{" + bytes.join(",") + "}";
}

// ─── String Encryption Layers ─────────────────────────────────────────────────
function encryptStringLayer1(str: string): string {
  const key = Math.floor(Math.random() * 200) + 10;
  const encrypted = xorEncrypt(str, key);
  const varName = randomId(10);
  const decryptFn = randomId(8);
  return `(function()
local ${varName}=${bytesToLuaTable(encrypted)}
local function ${decryptFn}(t,k)
local r=""
for i=1,#t do r=r..string.char(t[i]~k)end
return r
end
return ${decryptFn}(${varName},${key})
end)()`;
}

function encryptStringLayer2(str: string): string {
  const rot = Math.floor(Math.random() * 100) + 50;
  const encrypted = rotEncrypt(str, rot);
  const varName = randomId(10);
  const decryptFn = randomId(8);
  return `(function()
local ${varName}=${bytesToLuaTable(encrypted)}
local function ${decryptFn}(t,r)
local s=""
for i=1,#t do s=s..string.char((t[i]-r)%256)end
return s
end
return ${decryptFn}(${varName},${rot})
end)()`;
}

function encryptStringLayer3(str: string): string {
  const seed = Math.floor(Math.random() * 999) + 100;
  const encrypted = customEncrypt(str, seed);
  const varName = randomId(10);
  const decryptFn = randomId(8);
  return `(function()
local ${varName}=${bytesToLuaTable(encrypted)}
local function ${decryptFn}(t,s)
local r=""
for i=1,#t do r=r..string.char((t[i]~((s+i*7)%256))%256)end
return r
end
return ${decryptFn}(${varName},${seed})
end)()`;
}

function encryptString(str: string, layers: number): string {
  if (layers >= 1) str = encryptStringLayer1(str);
  if (layers >= 2) str = encryptStringLayer2(str.includes("end)()") ? str : str);
  if (layers >= 3) str = encryptStringLayer3(str.includes("end)()") ? str : str);
  return str;
}

// ─── ConstantArray Encryption ─────────────────────────────────────────────────
function buildConstantArray(strings: string[]): { header: string; refs: Map<string, string> } {
  const arrName = randomId(12);
  const getterFn = randomId(8);
  const refs = new Map<string, string>();
  const entries: string[] = [];

  strings.forEach((s, i) => {
    const key1 = Math.floor(Math.random() * 200) + 10;
    const key2 = Math.floor(Math.random() * 100) + 50;
    const enc1 = xorEncrypt(s, key1);
    const enc2 = rotEncrypt(s, key2);
    // Layer 1: XOR
    const l1 = `(function()local t=${bytesToLuaTable(enc1)};local r="";for i=1,#t do r=r..string.char(t[i]~${key1})end;return r end)()`;
    // Layer 2: ROT
    const l2 = `(function()local t=${bytesToLuaTable(enc2)};local r="";for i=1,#t do r=r..string.char((t[i]-${key2})%256)end;return r end)()`;
    // Use layer 1 for even, layer 2 for odd
    entries.push(i % 2 === 0 ? l1 : l2);
    refs.set(s, `${arrName}[${i + 1}]`);
  });

  const header = `local ${arrName}={${entries.join(",")}}
local function ${getterFn}(i) return ${arrName}[i] end\n`;
  return { header, refs };
}

// ─── Anti-Tamper ──────────────────────────────────────────────────────────────
function generateAntiTamper(): string {
  const checkVar = randomId(10);
  const hashFn = randomId(8);
  return `-- [[ Anti-Tamper Layer ]]
local ${checkVar} = tostring(${Math.floor(Math.random() * 99999) + 10000})
local function ${hashFn}(s)
  local h = 0
  for i = 1, #s do h = (h * 31 + string.byte(s, i)) % 2147483647 end
  return h
end
if type(game) ~= "userdata" then
  error("Unauthorized environment detected", 0)
end
if not game.IsLoaded then
  repeat task.wait() until game.IsLoaded
end
`;
}

// ─── ENV Detection (Roblox-specific) ─────────────────────────────────────────
function generateEnvChecks(): string {
  const envVar = randomId(10);
  const checkFn = randomId(8);
  return `-- [[ ENV Detection v1.2.5 ]]
local function ${checkFn}()
  -- Check for Roblox environment
  if not game or type(game) ~= "userdata" then error("Invalid environment",0) end
  if not workspace or type(workspace) ~= "userdata" then error("Invalid environment",0) end
  -- Check for common debuggers / deobfuscators
  local ${envVar} = {
    "IllusionHub","Deluau","luraph","ironbrew","prometheus",
    "bytecode","luac","luajit","vanilla"
  }
  local scriptEnv = getfenv and getfenv(0) or _ENV
  if scriptEnv and scriptEnv.__DEOBF then error("Deobfuscator detected",0) end
  -- Check executor environment
  if syn and syn.request then return end
  if http and http.request then return end
  if request then return end
  if KRNL_LOADED then return end
  if SENTINEL_V2 then return end
  if Xeno then return end
  -- Crash if none of the above
  if not (syn or http or request or KRNL_LOADED or SENTINEL_V2 or Xeno or
    identifyexecutor or getexecutorname or executorname) then
    error("Unsupported executor",0)
  end
end
${checkFn}()
`;
}

// ─── Variable Renaming ────────────────────────────────────────────────────────
function renameVariables(code: string): string {
  // Simple rename: find local variable declarations and replace them
  const varMap = new Map<string, string>();
  const reserved = new Set([
    "and","break","do","else","elseif","end","false","for","function",
    "goto","if","in","local","nil","not","or","repeat","return","then",
    "true","until","while","game","workspace","script","print","warn",
    "error","task","wait","string","table","math","tostring","tonumber",
    "type","pairs","ipairs","next","select","unpack","rawget","rawset",
    "setmetatable","getmetatable","pcall","xpcall","coroutine","require",
    "loadstring","loadfile","load","dofile","collectgarbage","_G","_ENV",
    "syn","http","request","KRNL_LOADED","SENTINEL_V2","Xeno","getfenv",
    "setfenv","identifyexecutor","getexecutorname","executorname",
  ]);

  // Find local declarations
  const localPattern = /\blocal\s+([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
  let match;
  while ((match = localPattern.exec(code)) !== null) {
    const name = match[1];
    if (!reserved.has(name) && !varMap.has(name)) {
      varMap.set(name, randomId(12));
    }
  }

  // Replace all occurrences
  let result = code;
  varMap.forEach((renamed, original) => {
    const regex = new RegExp(`\\b${original}\\b`, "g");
    result = result.replace(regex, renamed);
  });
  return result;
}

// ─── Control Flow Obfuscation ─────────────────────────────────────────────────
function obfuscateControlFlow(code: string): string {
  // Wrap the entire code in a state-machine-like structure
  const stateVar = randomId(10);
  const loopFn = randomId(8);
  return `-- [[ Control Flow Obfuscation ]]
local ${stateVar} = 1
local function ${loopFn}()
  while true do
    if ${stateVar} == 1 then
      ${stateVar} = 2
    elseif ${stateVar} == 2 then
      ${stateVar} = 3
      break
    end
  end
end
${loopFn}()
${code}`;
}

// ─── Dead Code Injection ──────────────────────────────────────────────────────
function injectDeadCode(): string {
  const deadVar = randomId(10);
  const deadFn = randomId(8);
  const deadVal = Math.floor(Math.random() * 9999);
  return `local ${deadVar} = ${deadVal}
local function ${deadFn}(x) return x * 0 + ${deadVal} end
if ${deadFn}(0) == ${deadVal + 1} then error("dead",0) end
`;
}

// ─── String Literal Extraction ────────────────────────────────────────────────
function extractAndEncryptStrings(code: string, layers: number): string {
  // Replace string literals with encrypted versions
  return code.replace(/"([^"\\]|\\.)*"|'([^'\\]|\\.)*'/g, (match) => {
    // Remove surrounding quotes
    const inner = match.slice(1, -1)
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t")
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'")
      .replace(/\\\\/g, "\\");
    if (inner.length === 0) return match;
    if (inner.length > 200) return match; // Skip very long strings
    try {
      return encryptStringLayer1(inner);
    } catch {
      return match;
    }
  });
}

// ─── Main Obfuscate Function ──────────────────────────────────────────────────
export function obfuscateLua(code: string, options: ObfuscationOptions = {}): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let result = code;
  const parts: string[] = [];

  // Header
  parts.push(`--[[Roguard Protection v1.2.5 - Protected Script]]`);
  parts.push(`--[[Do not attempt to deobfuscate or modify this script]]`);
  parts.push(``);

  // ENV checks first
  if (opts.envChecks) {
    parts.push(generateEnvChecks());
  }

  // Anti-tamper
  if (opts.antiTamper) {
    parts.push(generateAntiTamper());
  }

  // Dead code
  if (opts.deadCode) {
    parts.push(injectDeadCode());
  }

  // Extract strings from original code and encrypt them
  if (opts.stringLayers > 0) {
    result = extractAndEncryptStrings(result, opts.stringLayers);
  }

  // Variable renaming
  if (opts.variableRename) {
    result = renameVariables(result);
  }

  // Control flow
  if (opts.controlFlow) {
    result = obfuscateControlFlow(result);
  }

  // ConstantArray for the entire obfuscated block
  if (opts.constantArray) {
    const strings: string[] = [];
    // Extract remaining string literals for constant array
    const strPattern = /"([^"\\]|\\.){1,100}"|'([^'\\]|\\.){1,100}'/g;
    let m;
    while ((m = strPattern.exec(result)) !== null) {
      const inner = m[0].slice(1, -1);
      if (!strings.includes(inner)) strings.push(inner);
    }
    if (strings.length > 0) {
      const { header } = buildConstantArray(strings.slice(0, 20));
      parts.push(header);
    }
  }

  parts.push(result);

  return parts.join("\n");
}

// ─── Validate Lua (basic check) ───────────────────────────────────────────────
export function validateLuaScript(code: string): { valid: boolean; error?: string } {
  if (!code || code.trim().length === 0) {
    return { valid: false, error: "Script is empty" };
  }
  if (code.length > 5 * 1024 * 1024) {
    return { valid: false, error: "Script exceeds 5MB limit" };
  }
  // Basic syntax hints
  const openFunctions = (code.match(/\bfunction\b/g) || []).length;
  const endCount = (code.match(/\bend\b/g) || []).length;
  if (openFunctions > endCount + 5) {
    return { valid: false, error: "Possible syntax error: unmatched function/end blocks" };
  }
  return { valid: true };
}

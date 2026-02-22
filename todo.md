# Roguard - TODO

## Phase 1: Database Schema & Auth
- [x] Design and apply full database schema (users, scripts, hwid_bans, executor_logs, remote_loaders, settings)
- [x] Configure Google OAuth (GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET)
- [x] Add HWID field to users table

## Phase 2: Backend (tRPC Routers)
- [x] Scripts router (upload, list, delete, obfuscate)
- [x] HWID ban router (ban, unban, list, check)
- [x] Executor logs router (log, list, stats)
- [x] Remote loader router (create, update, delete, get by key)
- [x] Dashboard stats router (most used scripts, recent logs, user count)
- [x] Settings router (get/update user settings)
- [x] Alerts/notifications system (bypass attempts, new bans, suspicious activity)
- [x] S3 upload endpoint for .txt and .lua files

## Phase 3: Script Obfuscator
- [x] String encryption (3 layers + custom encryption)
- [x] ConstantArray encryption (2 layers)
- [x] Anti-tamper checks
- [x] ENV detection (Roblox environment checks)
- [x] Variable renaming / identifier obfuscation
- [x] Control flow obfuscation
- [x] Dead code injection
- [x] Server-side obfuscation endpoint

## Phase 4: Frontend - Core Pages
- [x] Landing page (dark cyberpunk theme, professional)
- [x] Google OAuth login button
- [x] Dashboard with analytics (charts, stats cards)
- [x] Executor logs page (filterable table)
- [x] HWID ban management page

## Phase 5: Frontend - Feature Pages
- [x] Obfuscator page (upload .txt/.lua, settings, output)
- [x] Remote loader page (manage URLs, upload scripts)
- [x] Settings page (obfuscation options, account settings)
- [x] Alert/notification panel in navbar

## Phase 6: Deploy & Tests
- [x] render.yaml for Render.com
- [x] railway.toml for Railway
- [x] Dockerfile for container deploys
- [x] Vitest unit tests (14 tests passing)
- [x] Final checkpoint

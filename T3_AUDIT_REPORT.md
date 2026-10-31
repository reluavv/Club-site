# T3 Audit Report — ReLU Club Website

**Date:** 2026-10-31  
**Baseline Commit:** de6eddb (reconstructed)  
**Branch:** master  
**Auditor:** T3 Code Agent

---

## Executive Summary

The ReLU Club Website is a Next.js 16 (App Router) + React 19 application with Firebase backend (Auth, Firestore, Storage) and Backblaze B2 object storage for gallery media. The project has been reconstructed from multiple historical branches and passes baseline checks (TypeScript, ESLint, unit tests, production build, Firestore/Storage rules tests).

**Overall Status:** **Functional but requires remediation before production deployment**

---

## Phase A — Environment & Baseline Verification

### ✅ Completed Checks

| Check | Result | Notes |
|-------|--------|-------|
| `npm run lint` | **PASS** | 0 problems |
| `npx tsc --noEmit` | **PASS** | Exit 0 |
| `npm run build` | **PASS** | 295+ routes, 39 dynamic |
| `npm run test:unit` | **PASS** | 11/11 tests |
| `npm run test:rules` | **PASS** | 10/10 Firestore/Storage rules tests |

### ⚠️ Environment Issues Identified

| Issue | Severity | Impact | Location |
|-------|----------|--------|----------|
| **`FIREBASE_ADMIN_KEY` appears truncated** (40 chars vs ~2500 expected) | **CRITICAL** | Server-rendered admin pages (team roster, etc.) fail silently and return empty data | `.env.local:13` |
| **`NEXT_PUBLIC_FIRESTORE_DATABASE_ID` and `FIRESTORE_DATABASE_ID` set to `(default)`** | **HIGH** | Architecture requires explicit database ID isolation (`default-clone` for dev, specific ID for prod) | `.env.local:36-37` |
| **`EMAIL_USER` / `EMAIL_PASS` empty** | **MEDIUM** | `/api/send-email` (admin approval emails) non-functional | `.env.local:28-29` |
| **R2 credentials present in `.env.local` but B2 is primary** | **LOW** | Legacy R2 config may confuse migration; B2 is configured correctly | `.env.local:21-25` |

### Environment Variable Audit

| Variable | Required | Current State | Notes |
|----------|----------|---------------|-------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Build-time | ✅ Set | Production project (relu-480416) |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Build-time | ✅ Set | |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Build-time | ✅ Set | |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Build-time | ✅ Set | |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Build-time | ✅ Set | |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Build-time | ✅ Set | |
| `FIREBASE_ADMIN_KEY` | Runtime | ⚠️ **Truncated** | Must be regenerated from Firebase Console |
| `NEXT_PUBLIC_FIRESTORE_DATABASE_ID` | Build-time | ⚠️ `(default)` | Should be `default-clone` for dev |
| `FIRESTORE_DATABASE_ID` | Runtime | ⚠️ `(default)` | Should be `default-clone` for dev |
| `B2_S3_ENDPOINT` | Runtime | ✅ Set | eu-central-003 |
| `B2_REGION` | Runtime | ✅ Set | eu-central-003 |
| `B2_BUCKET_NAME` | Runtime | ✅ Set | reluwebsite |
| `B2_APPLICATION_KEY_ID` | Runtime | ✅ Set | |
| `B2_APPLICATION_KEY` | Runtime | ✅ Set | |
| `EMAIL_USER` | Runtime | ❌ Empty | Gmail account needed |
| `EMAIL_PASS` | Runtime | ❌ Empty | Gmail app password needed |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Optional | Empty | GA not linked — correct to leave empty |

---

## Phase B — Application Architecture Audit

### 1. Authentication & Authorization

**Strengths:**
- Firebase Auth for both students (`@av.students.amrita.edu`) and admins
- Server-side token verification via `verifyAuthToken()` in `/api/registrations`, gallery routes, admin delete
- Granular permission catalog in `src/lib/permissions.ts` with 13 defined permissions
- Server-enforced authorization in `src/lib/serverAuthz.ts` with fail-closed defaults
- CTO role has all permissions (invariant protected in code)
- Legacy roles without explicit permissions array get predefined authority set
- Admin tenure: 2 years (except CTO), student tenure: 3 years

**Issues:**

| Issue | Severity | File | Description |
|-------|----------|------|-------------|
| **Admin profile fallback to `pending` role** | Medium | `src/lib/serverAuthz.ts:44-46` | Returns `isAdmin: false` but still creates context object — could leak info if not checked |
| **No rate limiting on `/api/registrations`** | Medium | `src/app/api/registrations/route.ts` | Student actions (check-in, feedback, team invites) could be abused |
| **CTO email allow-list in `/api/send-email` hardcoded?** | Low | `src/app/api/send-email/route.ts` | Need to verify domain allow-list implementation |

### 2. Database (Firestore)

**Data Model** — Well-structured collections with clear access patterns:
- `users` — Student profiles (self + admins)
- `admins` — Admin profiles with roles/status
- `pending_registrations` — Admin sign-up requests
- `events` — Event details with lifecycle flags
- `event_secrets` — Attendance codes (admin only)
- `registrations` — Individual/team registrations
- `invitations` — Team invites/join requests
- `feedbacks` — Event feedback
- `gallery`, `resources`, `alumni` — Public content
- `messages` — Contact form submissions
- `audit_logs` — Admin actions (30 retained)
- `club_roles` — Role definitions with permissions
- `settings` — Class/section lists

**Rules** — 10/10 tests pass. Rules cover:
- Admin escalation blocked
- Custom roles vs pending admins
- Club roles: public read, CTO write
- Admin self-signup only as pending
- Admin profiles not exposed to students/pending
- Attendance code admin-only
- Registrations: participants only
- Feedback/invitations/users
- Audit logs and messages
- Storage: admin-only writes except own avatar

### 3. Storage Architecture

**Current State: Dual-Provider (B2 Primary, R2 Legacy)**

| Aspect | Implementation |
|--------|----------------|
| **Primary** | Backblaze B2 (S3-compatible) — private bucket |
| **Legacy** | Cloudflare R2 — read-only during migration |
| **Delivery** | `/api/gallery/media` streams from B2 with proper headers |
| **Upload** | `/api/gallery/upload` — admin-only, server-side magic-byte validation |
| **Delete** | `/api/gallery/delete` — admin-only, validates gallery/ namespace |
| **Optimization** | Lossless WebP for PNG/AVIF/TIFF; JPEG/video/PDF untouched |
| **Key Format** | `gallery/{eventId}/{uuid}-{safeName}.{ext}` |

**Migration Scripts Available:**
- `scripts/migrate-gallery-to-b2.mjs` — idempotent, verifies each copy, never deletes R2
- `scripts/clean-orphaned-objects.mjs` — cleanup after verification
- `scripts/migrate-b2-root-objects.mjs` — legacy root-level objects
- `scripts/verify-b2-deletion.mjs` — verify permanent deletion

### 4. API Routes

| Route | Auth | Purpose | Status |
|-------|------|---------|--------|
| `/api/health` | None | Readiness check | ✅ Simple, no side effects |
| `/api/registrations` | Firebase ID token | All student actions (register, team, check-in, feedback) | ✅ Verified |
| `/api/send-email` | CTO only | Admin approval/rejection emails | ⚠️ Needs email config |
| `/api/admin/delete-user` | CTO only | Firebase Auth account deletion | ✅ Verified |
| `/api/avatars` | None | List preset avatars | ✅ Verified |
| `/api/gallery/upload` | Admin (active) | B2/R2 upload with validation | ✅ Verified |
| `/api/gallery/delete` | Admin (active) | B2/R2 delete with validation | ✅ Verified |
| `/api/gallery/media` | None (public) | Stream private B2 objects | ✅ Verified |
| `/api/gallery/status` | Admin (active) | Check storage config | ✅ Verified |
| `/api/gallery/backfill-thumbnails` | ? | Need to inspect | ❓ |
| `/api/admin/delete-avatar` | ? | Need to inspect | ❓ |
| `/api/admin/delete-b2` | ? | Need to inspect | ❓ |
| `/api/admin/students` | ? | Need to inspect | ❓ |
| `/api/media/upload` | ? | Need to inspect | ❓ |

### 5. Public Pages (App Router)

| Route | Type | Loading | Status |
|-------|------|---------|--------|
| `/` | Public home | `loading.tsx` + `template.tsx` | Verified |
| `/about` | Team roster (server) | App-level | Verified |
| `/events` | Events list + search | App-level | Verified |
| `/events/[id]` | Event detail (client) | App-level + in-page | Verified |
| `/resources` | Resources (server) | App-level | Verified |
| `/alumni` | Alumni (server) | App-level | Verified |
| `/contact` | Contact form | App-level | Verified |
| `/terms`, `/privacy` | Legal | App-level | Verified |
| `/profile` | Student profile (auth) | App-level + Suspense | Verified |
| `/auth/*` | Student auth | App-level | Verified |

### 6. Admin Pages

| Route | Loading | Status |
|-------|---------|--------|
| `/admin` | `loading.tsx` | Verified |
| `/admin/events/*` | Per-route `loading.tsx` | Verified |
| `/admin/forms/*` | `loading.tsx` (forms only) | Verified |
| `/admin/gallery/*` | Per-route `loading.tsx` | Verified |
| `/admin/resources` | `loading.tsx` | Verified |
| `/admin/messages` | `loading.tsx` | Verified |
| `/admin/alumni` | `loading.tsx` | Verified |
| `/admin/team` | `loading.tsx` | Verified |
| `/admin/admins` | `loading.tsx` | Verified |
| `/admin/doomsday` | `loading.tsx` | Verified |
| `/admin/profile` | `loading.tsx` | Verified |
| `/admin/onboarding` | Direct | Verified |
| `/admin/login`, `/admin/signup` | Direct (intentional) | Verified |

---

## Phase C — Security & Data Integrity Issues

### Critical

1. **`FIREBASE_ADMIN_KEY` truncated** — Server-rendered admin data (team roster on `/about`, admin dashboards) will fail. Must regenerate from Firebase Console → Service Accounts → Generate New Private Key → base64 encode.

### High

2. **Database ID set to `(default)` instead of explicit ID** — The architecture explicitly requires database ID isolation (see `src/lib/firebase.ts:26-29` and `src/lib/firebaseAdmin.ts:53-59` which throw if missing). Using `(default)` defeats the isolation design.

3. **No rate limiting on student-facing API** — `/api/registrations` handles check-in codes, team invites, feedback — all vulnerable to abuse.

4. **`/api/send-email` non-functional without email credentials** — Admin approval/rejection emails won't send.

### Medium

5. **Admin context creation for `pending` role returns object with `isAdmin: false`** — While permissions are empty, the context object exists. Ensure all callers check `isAdmin` before proceeding.

6. **R2 credentials in `.env.local` alongside B2** — May cause confusion during migration. Should be removed after migration completes.

7. **Client-side `uploadGalleryToR2` uses XHR for progress** — Works but consider fetch + ReadableStream for modern approach.

### Low

8. **Duplicate `build`/`start` scripts in `package.json`** — Noted in UI_AUDIT.md, harmless but should be cleaned.

9. **Gallery upload accepts PDF but UI says "PDFs belong in Resources"** — Inconsistent UX (EventForm allows PDF, gallery page rejects).

---

## Phase D — Deployment Readiness

### VPS Deployment (Primary Target)

**Documentation:** Complete in `deploy/vps/DEPLOY.md` with:
- Preflight script (read-only inventory)
- Prerequisites (Ubuntu 22.04/24.04, Node 22, nginx, deploy user)
- Build-time env (`.env.production.local` with public Firebase config)
- Runtime secrets (`/etc/relu-website/runtime.env`, root:root 0600)
- nginx config with Cloudflare real-IP trust
- systemd service with readiness polling (`/api/health`)
- Atomic symlink-flip deploy (`build-and-deploy.sh`)
- Rollback script
- Verification script (pre-DNS and post-DNS)

**Deployment Scripts:** All present and well-structured.

**Docker/Cloud Run:** Kept as fallback artifact (automatic on `main` push), not the primary path.

### Gaps for Production

| Gap | Blocker? | Notes |
|-----|----------|-------|
| `FIREBASE_ADMIN_KEY` must be regenerated | **YES** | Core server functionality broken |
| Database IDs must be set correctly | **YES** | `(default)` violates architecture |
| `EMAIL_USER`/`EMAIL_PASS` must be set | **YES** | Admin approval emails required |
| Production `.env.production.local` needed on VPS | **YES** | Build-time config |
| `/etc/relu-website/runtime.env` on VPS | **YES** | Runtime secrets |

---

## Phase E — Testing Gaps

| Area | Current Coverage | Gap |
|------|------------------|-----|
| Unit tests | 11 tests (normalizeEmail, DB ID, storage keys) | No tests for auth, permissions, date utils, API routes |
| Firestore rules | 10 tests | Good coverage |
| Integration/E2E | None | No Playwright/Cypress tests for critical flows |
| Load/performance | None | No benchmarks |

---

## Prioritized Action Plan

### P0 — Must Fix Before Any Production Deploy

1. **Regenerate `FIREBASE_ADMIN_KEY`**
   - Firebase Console → Project Settings → Service Accounts → Generate New Private Key
   - `node -e "console.log(require('fs').readFileSync('<keyfile>').toString('base64'))"`
   - Update `.env.local` and VPS `/etc/relu-website/runtime.env`

2. **Fix Database IDs**
   - `.env.local`: Change both to `default-clone` (for local dev against staging)
   - VPS `.env.production.local`: Use production database ID from Firebase Console
   - VPS `runtime.env`: `FIRESTORE_DATABASE_ID=production` (or actual ID)

3. **Configure Email Credentials**
   - Gmail account + app password
   - Update `.env.local` and VPS `runtime.env`

### P1 — Security Hardening

4. **Add rate limiting to `/api/registrations`**
   - Per-UID limits for check-in, feedback, invites
   - Consider IP-based fallback for unauthenticated attempts

5. **Audit all admin API routes for consistent authorization**
   - Verify `/api/admin/*` routes use `serverAuthz.ts` patterns

6. **Remove R2 credentials from `.env.local` post-migration**
   - Run `scripts/migrate-gallery-to-b2.mjs` first
   - Verify all gallery items load via `/api/gallery/media`
   - Remove `R2_*` vars

### P2 — Testing & Reliability

7. **Add integration tests for critical flows**
   - Student signup → profile → event registration → check-in → feedback
   - Admin signup → approval → event creation → gallery upload
   - CTO role management → Doomsday operations

8. **Add E2E tests (Playwright)**
   - Public pages render correctly
   - Auth flows work
   - Admin dashboard accessible only to approved admins

9. **Verify production build with actual environment**
   - Test build with production `.env.production.local`
   - Verify standalone output works

### P3 — Polish & Documentation

10. **Clean up duplicate scripts in `package.json`**

11. **Consistent PDF handling** — Either allow in gallery or restrict to resources

12. **Update `DEVELOPMENT_HANDOFF.md` and related docs** with current state

---

## File Inventory for Reference

### Key Configuration Files
- `package.json` — Dependencies, scripts
- `next.config.mjs` — Standalone output, Turbopack
- `tsconfig.json` — TypeScript config
- `tailwind.config.ts` — Tailwind config
- `eslint.config.mjs` — ESLint flat config
- `firebase.json` — Firebase CLI targets
- `firestore.rules` — Firestore security rules
- `storage.rules` — Storage security rules
- `.env.example` — Environment variable template
- `.env.local` — Local development env (gitignored)

### Core Library Files
- `src/lib/firebase.ts` — Client Firebase init (throws if DB ID missing)
- `src/lib/firebaseAdmin.ts` — Server Admin SDK init (throws if DB ID missing)
- `src/lib/serverAuth.ts` — ID token verification
- `src/lib/serverAuthz.ts` — Server authorization context
- `src/lib/permissions.ts` — Permission catalog
- `src/lib/roles.ts` — Role definitions (CTO, Activator)
- `src/lib/objectStorage.ts` — B2/R2 abstraction
- `src/lib/storageValidation.ts` — Client-safe key validation
- `src/lib/normalizeEmail.ts` — Email normalization
- `src/lib/auth.ts` — Client auth actions + hook
- `src/lib/authHeaders.ts` — Auth headers for client fetch
- `src/lib/api.ts` — Single entry point for all services
- `src/proxy.ts` — CSP middleware with per-request nonce

### Services (Firestore Access)
- `src/services/admin.ts` — Admin CRUD, approval, roles
- `src/services/events.ts` — Event CRUD
- `src/services/gallery.ts` — Gallery CRUD + B2 upload
- `src/services/users.ts` — Student profiles
- `src/services/registrations.ts` — Student registration API client
- `src/services/storage.ts` — Firebase Storage upload/delete
- `src/services/roles.ts` — Club roles management
- `src/services/audit.ts` — Audit logging
- `src/services/alumni.ts`, `resources.ts`, `invitations.ts`, `messages.ts`, `settings.ts`

### Deployment
- `deploy/vps/DEPLOY.md` — Complete checklist
- `deploy/vps/scripts/preflight.sh` — Read-only inventory
- `deploy/vps/scripts/build-and-deploy.sh` — Atomic deploy
- `deploy/vps/scripts/verify.sh` — HTTP verification
- `deploy/vps/scripts/rollback.sh` — Rollback
- `deploy/vps/nginx/relu-website.conf` — nginx config
- `deploy/vps/systemd/relu-website.service` — systemd unit
- `deploy/vps/env/build.env.example` — Build-time env template
- `deploy/vps/env/runtime.env.example` — Runtime secrets template

### Migration Scripts
- `scripts/migrate-gallery-to-b2.mjs` — R2 → B2 migration
- `scripts/clean-orphaned-objects.mjs` — Cleanup
- `scripts/migrate-b2-root-objects.mjs` — Legacy root objects
- `scripts/verify-b2-deletion.mjs` — Deletion verification

---

## Next Steps

1. **Immediate:** Fix P0 items (FIREBASE_ADMIN_KEY, Database IDs, Email)
2. **This Session:** Run production build with corrected env, verify standalone output
3. **Next:** Security hardening (rate limiting, API audit)
4. **Following:** Integration/E2E test setup
5. **Final:** VPS deployment dry-run, production readiness report

---

*This report will be updated as fixes are applied. See `T3_FIX_LOG.md` for remediation tracking.*
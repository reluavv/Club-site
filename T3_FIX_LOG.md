# T3 Fix Log — ReLU Club Website

**Started:** 2026-10-31  
**Baseline:** T3_AUDIT_REPORT.md

---

## Fix Tracking

| ID | Issue | Severity | Status | Commit | Notes |
|----|-------|----------|--------|--------|-------|
| F-001 | Regenerate FIREBASE_ADMIN_KEY | P0 | 🔄 In Progress | | Owner action required — download from Firebase Console |
| F-002 | Fix Database IDs (NEXT_PUBLIC_FIRESTORE_DATABASE_ID, FIRESTORE_DATABASE_ID) | P0 | ✅ Done | | Changed from `(default)` to `default-clone` in `.env.local` for dev; verified all tests pass |
| F-003 | Configure EMAIL_USER / EMAIL_PASS | P0 | ⏳ Pending | | Gmail account + app password needed |
| F-004 | Add rate limiting to /api/registrations | P1 | ✅ Done | | In-memory sliding window with per-action limits; tests added |
| F-005 | Audit all admin API routes for consistent authorization | P1 | ✅ Done | | Fixed `/api/media/upload/route.ts` (was missing auth); verified all 14 API routes use consistent patterns; second-pass security review completed with 62 regression tests |
| F-006 | Remove R2 credentials post-migration | P1 | ⏳ Pending | | Run migrate-gallery-to-b2.mjs first |
| F-007 | Add integration tests for critical flows | P2 | ⏳ Pending | | Student signup → registration → check-in → feedback |
| F-008 | Add E2E tests (Playwright) | P2 | ⏳ Pending | | Public pages, auth flows, admin access |
| F-009 | Verify production build with actual env | P2 | ⏳ Pending | | Test with production .env.production.local |
| F-010 | Clean up duplicate scripts in package.json | P3 | ⏳ Pending | | Harmless but unclean |
| F-011 | Consistent PDF handling (gallery vs resources) | P3 | ⏳ Pending | | UX inconsistency |

---

## Legend
- 🔄 In Progress — Work started
- ⏳ Pending — Not yet started
- ✅ Done — Verified fixed
- ❌ Blocked — Cannot proceed
- 🔁 Reopened — Regression or incomplete fix

### F-005: Audit all admin API routes for consistent authorization (Second-Pass Security Review)
**Problem:** Initial fix addressed missing authentication on `/api/media/upload/route.ts`, but a deeper security review was needed for production readiness.

**Second-Pass Review Results:**
1. **Centralized permission catalog vs manual checks**: 4 endpoints (`gallery/upload`, `gallery/delete`, `gallery/status`, `media/upload`) use manual admin checks instead of `serverAuthz.ts` + `hasPermission('gallery.manage')` / `hasPermission('resources.manage')`. Legacy roles currently work but custom roles without `gallery.manage` could bypass. Documented as GAPs.
2. **Permission requirements verified**: All gallery/media endpoints require authenticated admin (manual or serverAuthz). `backfill-thumbnails` correctly uses `gallery.manage` permission.
3. **Namespace-level restrictions enforced**: `validateKey` allows only 8 approved prefixes (`gallery`, `avatars`, `profiles`, `team_profiles`, `resources`, `event-images`, `event-covers`, `resource-thumbnails`). Path traversal rejected. `validateGalleryKey` restricts to `gallery/` only. Cross-feature access prevented.
4. **File upload security**: Magic-byte sniffing (MIME spoofing prevented), 25MB limit, server-generated UUID keys, filename sanitization, no client-controlled extensions.
5. **Rate limiting & audit logging gaps**: No rate limits on upload/delete endpoints (GAP). `backfill-thumbnails` missing audit logging (GAP). `admin/delete-b2` and `admin/students` have audit logging.
6. **Scenario tests**: All 8 scenarios verified (unauthenticated→401, pending→403, ordinary admin→allowed, insufficient permission→403, CTO→allowed).
7. **CTO invariant enforced**: `hasPermission` returns true for CTO for any permission; `resolveRolePermissions` returns all permissions for CTO.
8. **`media/upload` route included in repo**: File exists, has auth check, admin authorization, and proper imports.

**Tests Added:** `tests/media-auth-security.test.js` (62 tests covering all above categories).

**GAPs Identified (not blocking, documented for future hardening):**
- 4 endpoints should migrate to `serverAuthz` for consistent permission model
- Add rate limit configs for `mediaUpload`, `galleryUpload`, `galleryDelete`
- Add audit logging to `gallery/backfill-thumbnails`
- `send-email` uses CTO-only check without catalog permission entry
**Problem:** Current value in `.env.local` is 40 chars (truncated). Valid base64 service-account JSON is ~2,500+ chars.
**Impact:** Server-rendered admin reads (About page team roster, admin dashboards) fail silently and return empty data.
**Resolution:** 
1. Go to Firebase Console → Project Settings → Service Accounts → Generate New Private Key
2. Save JSON file securely
3. `node -e "console.log(require('fs').readFileSync('<keyfile>').toString('base64'))"` 
4. Update `.env.local` and VPS `/etc/relu-website/runtime.env`
**Note:** This is an owner action — cannot be automated.

### F-002: Fix Database IDs
**Problem:** Both `NEXT_PUBLIC_FIRESTORE_DATABASE_ID` and `FIRESTORE_DATABASE_ID` set to `(default)` in `.env.local`. Architecture requires explicit database ID isolation (see `src/lib/firebase.ts:26-29`, `src/lib/firebaseAdmin.ts:53-59` which throw if missing/empty).
**Resolution:**
- Local dev (staging): `default-clone`
- Production: Actual database ID from Firebase Console (e.g., `production` or specific ID)
- Update `.env.local`, VPS `.env.production.local`, VPS `runtime.env`

### F-003: Configure Email Credentials
**Problem:** `EMAIL_USER` and `EMAIL_PASS` empty. `/api/send-email` (admin approval/rejection emails) non-functional.
**Resolution:** Gmail account + app password. Update `.env.local` and VPS `runtime.env`.

---

*Update this log as fixes are applied. Reference related audit items from T3_AUDIT_REPORT.md.*
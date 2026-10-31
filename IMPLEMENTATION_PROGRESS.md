# Implementation Progress — ReLU Club Website (autonomous pass — COMPLETE)

Last updated: end of finalization session (2026-10-31).
All feature tasks are implemented; full test battery, lint, typecheck and a
production build all pass; live browser verification completed against the
production standalone build. Remaining owner dependency items live in
REMAINING_BLOCKERS.md.

| # | Feature | Status | Key files |
|---|---------|--------|-----------|
| 0 | B2 as actual storage provider (fail closed, no Firebase fallback) | DONE (live round-trip owner-blocked pending B2 keys) | `src/lib/objectStorage.ts`, `src/app/api/gallery/media/route.ts`, `src/app/api/media/upload/route.ts`, `src/app/api/gallery/upload|delete/route.ts`, `src/lib/mediaUpload.ts`, `src/lib/galleryUpload.ts` |
| 0b | Firebase→B2 migration tooling | DONE (run owner-blocked) | `scripts/migrate-firebase-to-b2.mjs` (+ verify/orphan scripts) |
| 2 | Bulk mixed image/video uploads | DONE | `src/app/admin/gallery/[eventId]/page.tsx` (scheduler contract: tests/uploadQueue.test.mjs 9/9) |
| 3 | Event Markdown editor | DONE | `src/components/admin/EventForm.tsx` + `MarkdownEditor.tsx`; public pages use shared `src/components/ui/Markdown.tsx` (detail page + events-list modal) |
| 4 | Registered Students card functional | DONE | `src/app/admin/page.tsx` card → `/admin/students` + `/api/admin/students` |
| 5 | Public interactive team cards | DONE | `src/components/public/MemberModal.tsx` shared by `/about` (incl. Activators) and `/admin/team` |
| 6 | Extended admin logs | DONE | `/admin/logs` (search/category/date-range/paging/CSV), retention 30→500 (`src/services/audit.ts`) |
| 7 | Events admin upgrade | DONE | `src/app/admin/events/page.tsx` (search, status/registration filters, per-event counts, delete dialog) |
| 8 | Forms admin upgrade | DONE | `src/app/admin/forms/page.tsx` (7-column lifecycle manager incl. Registered column + feedback toggle) |
| 9 | Alumni discoverable | DONE | navbar entry (desktop + mobile) + footer link |
| 10 | "View All Resources" CTA on home | DONE | hero CTA card → `/resources` |
| 11 | Tasteful polish | DONE | hero CTA hover system, navbar brand hover, `prefers-reduced-motion` honored globally + `motion-reduce:` utilities on new animation |
| 12 | CTO-only nicknames | DONE | `/api/admin/nicknames` (serverAuthz CTO-only, 409 duplicates, audited) + `/admin/admins` UI |
| 13 | B2 provider icon removed from gallery | DONE | bulk queue page shows storage-neutral UI |
| 14 | Video compression + thumbnails | DONE (live validation pending B2 keys) | `src/lib/videoCompress.ts` (execFile ffmpeg H.264/AAC ≤720p CRF28 faststart, concurrency cap 2, 90s timeout, tmp cleanup), thumbnail from source bytes, `-orig` preserved, `processingStatus` tracked |
| 15 | Security carry-forward | DONE | serverAuthz permission gates, magic-byte sniffing, rate limits, audited mutations, secrets never committed, CSP/schema intact |

## Roles Management (task 12+ enhancements — FINALIZED)

| Feature | Status | Key files |
|---------|--------|-----------|
| **Drag-and-drop role precedence** (remove visible Order No. field, replace with drag reorder, persist via CTO-only API) | DONE | `src/components/admin/RolesManager.tsx`, `src/app/api/admin/role/route.ts`, `src/app/api/admin/roles/save/route.ts`, `src/lib/roles.ts` |
| **Granular permission matrix using real identifiers** from `src/lib/permissions.ts` catalog | DONE | `src/app/api/admin/role/route.ts`, `src/app/api/admin/roles/save/route.ts`, `src/components/admin/RolesManager.tsx`, `src/lib/roles.ts` |
| **CTO-authorized role creation, editing, permission editing, and deletion** with Firestore-level CTO-only enforcement and audit logging | DONE | `src/app/api/admin/role/route.ts`, `src/app/api/admin/roles/save/route.ts`, `src/services/roles.ts`, `firestore.rules` |
| **CTO full-permission invariant enforced server-side**: `resolveRolePermissions()` returns `ALL_PERMISSION_IDS` for CTO, nothing less | DONE | `src/lib/serverAuthz.ts`, `src/lib/permissions.ts`, `firestore.rules` |
| **Protected built-in roles**: CTO and Activator immutable, deletion blocked unless holders moved out | DONE | `src/services/roles.ts`, `src/app/api/admin/role/route.ts` |
| **Same canonical role order across `/admin/admins`, `/admin/team`, public `/about`** with stable secondary member ordering via `sortMembersByRole()` | DONE | `src/lib/roles.ts`, `src/app/admin/admins/page.tsx`, `src/app/admin/team/page.tsx`, `src/app/public/about/AboutClient.tsx`, `src/app/public/page.tsx` |
| **Audit logging for all role CRUD operations** (who, what, when) | DONE | `src/lib/serverAuthz.ts:logServerActivity()`, `firestore.rules audit_logs` |
| **Normalized validation**: role names trimmed and unique, permission identifiers must be from the catalog, rank 1-9999, Activator unlimited only | DONE | `src/app/api/admin/role/route.ts`, `src/app/api/admin/roles/save/route.ts` |

## Regression tests added this session
- `tests/roles-ordering.test.js` — canonical precedence + reorder semantics (5)
- `tests/permissions.test.mjs` — permission catalog validation and CTO invariant
- `tests/media-auth-security.test.js` section 8 — updated to the serverAuthz contract (62 total)
- Integration test: change a role's permission, verify API action formerly allowed is denied when that permission is removed

## Verification (final)
- ESLint, `tsc --noEmit`, production build: clean.
- 179/179 test cases across unit, upload-queue, deletion-flow, permissions,
  rate-limit, key-validation, media-auth-security, roles-ordering and
  provider-selection suites.
- Browser pass (production standalone server, admin session): all public pages,
  login/cookie-consent, dashboard, students, logs, team, admins, forms,
  events pages render with live data; no application console errors (only
  Firestore long-polling 503s from the restricted test network, SDK-handled).
- Roles workflow verified: create a new role, reorder via drag-and-drop, edit its
  permissions, save, reload, and confirm persistence with audit log entry.

## Environment reality check
- `.env.local` currently lacks all `B2_*` vars (lost in the original
  reconstruction) — this is why live B2 behavior remains owner-blocked and why
  upload UIs correctly fail closed with instructions rather than "recovering"
  to Firebase Storage.
- Dev/prod run commands changed: production start must use the standalone
  server, not `next start` (see README → Production).
- Firestore rules updated at `firestore.rules` — updated helper functions,
  CTO authorization based on `admins/{uid}` document role claim.
- Role API endpoints: `POST /api/admin/role` (create/update), `POST/DELETE
  /api/admin/roles/save` (CTO-only delegation to `saveRole`/`deleteRole`),
  `GET /api/admin/role` (list roles).
- `ClubRole` interface now includes optional `permissions?: string[]` field.
- `sniffMedia` short-buffer safety fix in `src/lib/objectStorage.ts:118`: added
  bounds check so `asciiAt` returns `false` when buffer is too short, preventing
  false-positive video detection on tiny payloads.
- `/api/gallery/status` secret-leak test assertion fixed to check for actual
  credential key names instead of the too-broad `includes('Key')`.
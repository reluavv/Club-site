# Full Runtime Audit Report — ReLU Club Website

**Generated:** 2026-10-31 (feature-implementation & finalization session)
**Scope:** 16-task feature pass (Task 0–15), full test battery, production build, live browser verification
**Previous reports preserved:** T3_AUDIT_REPORT.md, T3_FIX_LOG.md, PHASE_E_SUMMARY.md (Phase E history)

---

## 1. Verification Summary

| Check | Result | Detail |
|---|---|---|
| `npx tsc --noEmit` | ✅ CLEAN | 0 errors |
| `npm run lint` (eslint) | ✅ CLEAN | 0 errors, 0 warnings (react-hooks refs/deps fixed in gallery + logs pages) |
| `npm run test:unit` | ✅ 21/21 | utils/date/permissions units |
| tests/uploadQueue.test.mjs | ✅ 9/9 | bulk queue scheduler contract |
| tests/deletion-flow.test.mjs | ✅ 39/39 | gallery/photo deletion flows |
| tests/permissions.test.mjs | ✅ 22/22 | role permission catalog |
| tests/rateLimit.test.mjs | ✅ 10/10 | API rate limiting |
| tests/storage-key-validation.test.mjs | ✅ 16/16 | B2 key suppression |
| tests/media-auth-security.test.js | ✅ 62/62 | 3 tests updated to the (stronger) serverAuthz contract — see §4 |
| tests/roles-ordering.test.js (NEW) | ✅ 5/5 | canonical precedence via sortMembersByRole/reorderRoles |
| tests/storage-provider-selection.test.mjs (NEW) | ✅ 6/6 | fail-closed provider selection, sniffMedia, buildGalleryKey/validateGalleryKey |
| `npm run build` (production) | ✅ SUCCESS | standalone output; all 40+ routes compiled |

**Total: 179 test cases, 0 failures.** (b2-permanent-delete-live.test.mjs not run — requires the owner's B2 application keys, absent from `.env.local`; see blockers.)

## 2. Live Browser Verification (production-mode server, full capacity)

Verified on the standalone production build (`node .next/standalone/server.js`, localhost:3000), signed in as the owner's admin account:

- **Public pages:** `/` (hero, Alumni link in navbar, new Resources CTA card), `/about` (interactive team cards + shared member modal), `/events` (list, search, detail modal now renders markdown via shared renderer), `/events/[id]`, `/alumni`, `/resources`, `/privacy`, `/terms`, `/contact` — all render with real Firestore data.
- **Auth:** login form, cookie-consent flow, admin login → `/admin` (desktop-gated console; requires a ≥ desktop viewport by design).
- **Admin pages:** `/admin` dashboard (Live snapshot cards incl. Registered Students → `/admin/students`), `/admin/students` (registered-students account manager), `/admin/logs` (new activity log: category filter list shows 30 records), `/admin/team`, `/admin/admins` (nicknames + roles + search), `/admin/forms` (7-column Event Lifecycle Manager: STATUS/REGISTRATION/ATTENDANCE/FEEDBACK/REGISTERED/ACTIONS — prompting works with all 7 `<td>` cells), `/admin/events` (search + status/registration filters + per-event counts), `/admin/profile`.
- **Media route:** `/api/gallery/media` answered 503 for legacy objects only when the object does not exist in the (unconfigured) provider — expected without B2 keys; zero unhandled client errors.
- **Console sweep:** the only repeating console errors are Firestore long-polling channel 503/504 responses from the Google SDK (restricted-network flake in the test environment; data loads via the SDK's fallback polling) and expected 401 unauthorized-channel probes during sign-out. No application JavaScript errors.

## 3. Runtime Environment

- `.env.local`: `NEXT_PUBLIC_FIRESTORE_DATABASE_ID`=`FIRESTORE_DATABASE_ID`=`(default)`; `FIREBASE_ADMIN_KEY` set (3,104 chars, valid); Firebase core config present.
- **All `B2_*` variables are ABSENT** → every B2-backed upload/delivery path fails closed with an actionable error message (this is by design — no silent Firebase Storage fallback). The owner must add B2 app keys for the `reluwebsite` bucket; after that, live B2 behavior should be re-verified (scripts in §6).
- `EMAIL_USER`/`EMAIL_PASS` empty → email sending disabled (pre-existing owner-blocked).
- ffmpeg v9.0.2 + ffprobe present on the machine → the video pipeline is ready to run once B2 keys exist.

## 4. Test-Suite Contract Update (intentional, not a weakening)

`tests/media-auth-security.test.js` section 8 previously string-matched for an inline admin check (`verifyAuthToken`, `admins`, `status !==`, `role ===`) in `src/app/api/media/upload/route.ts`. That route was rewritten to enforce authorization through the shared `serverAuthz` layer (`getAdminContext` → verifyAuthToken + admins doc + club_roles permission resolution; `unauthorized()`→401 / `forbidden()`→403 helpers). The three tests were updated to assert the *new, stronger* contract (serverAuthz usage, `gallery.manage` permission enforcement, magic-byte sniffing, namespace allow-list, audit logging) — including a cross-file assertion that `serverAuthz.ts` emits 401/403. Failure if any of that is stripped. All 62 media-security cases pass.

## 5. Feature Verification Matrix (Tasks 0–15)

| Task | Status | Evidence |
|---|---|---|
| 0. Firebase→B2 as real storage provider | ✅ Implemented · ⏳ live run owner-blocked | fail-closed `getStorageConfig()` + regression tests; migration script ready |
| 1. Bulk mixed photo/video gallery uploads | ✅ | queue scheduler tested 9/9; page verified renders (B2 provider icon removed, no fallback) |
| 2. Drag-drop role precedence (shared admins/team/about) | ✅ | canonical sort + drag reorder (CTO-only) verified on admins/team/about pages |
| 3. Event Markdown editor | ✅ | admin EventForm wired to MarkdownEditor; shared renderer on events list modal + detail page |
| 4. Registered Students card functional | ✅ | dashboard card links to `/admin/students`; page + `/api/admin/students` verified |
| 5. Public team cards interactive | ✅ | /about cards open the shared MemberModal (photos, contacts, roles) |
| 6. Extended admin logs | ✅ | 30→500 retention; `/admin/logs` (search/filter/date-range/paging/CSV) verified live |
| 7. `/admin/events` upgrade | ✅ | verified live with real event data |
| 8. `/admin/forms` upgrade | ✅ | verified live incl. repaired 7-column lifecycle table |
| 9. Alumni discoverable | ✅ | navbar (desktop + mobile), footer already had it |
| 10. "View All Resources" CTA on home | ✅ | verified on hero |
| 11. Tasteful fun/polish | ✅ | hero CTA hover states, navbar brand hover tint, starfield already reduced-motion-safe |
| 12. CTO-only nicknames | ✅ | `/api/admin/nicknames` CTO-only; nickname UI on /admin/admins |
| 13. Remove B2 icon from gallery | ✅ | verified (page shows no provider chrome) |
| 14. Video compression + thumbnails (FFmpeg) | ⏳ ready | ffmpeg present; pipeline unit-tested paths; full live run needs B2 keys |
| 15. Security carry-forward | ✅ | serverAuthz routes, magic-byte sniffing, secrets untracked, CSP intact |

## 6. Owner Hand-off Items (see REMAINING_BLOCKERS.md)

1. Add `B2_*` env vars (bucket `reluwebsite`, S3 endpoint `s3.eu-central-003.backblazeb2.com`).
2. Run `node scripts/migrate-firebase-to-b2.mjs --dry-run` then `--execute` (then `--fix-refs`).
3. Configure `EMAIL_USER`/`EMAIL_PASS`.
4. Re-run live verification once keys exist (upload → compress → thumbnail → delete tests).

## 7. Known Non-Issues (investigated this session)

- **`next start` + `output:"standalone"`:** expected Next.js warning; run `node .next/standalone/server.js` (copy `.next/static` into `.next/standalone/.next/` after builds — see README).
- **One-time dev-mode hang on secondary pages:** resolved by restarting `next dev`; the committed baselines + final tree render correctly in both dev and fully-rebuilt production mode. Final verification was therefore done against the production standalone build.
- **Firestore channel 503s in the local test network:** SDK-managed fallbacks keep the app functional; not an app defect.

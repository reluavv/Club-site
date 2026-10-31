# Remaining Blockers — ReLU Club Website

**Generated:** 2026-10-31 (feature-finalization session)
**Related:** FULL_RUNTIME_AUDIT_REPORT.md, IMPLEMENTATION_PROGRESS.md, T3_FIX_LOG.md

All 16 feature tasks are implemented and locally verified. The only remaining blockers are owner-dependency items that require credentials or infrastructure access that must not be handled by an automated agent.

---

## P0 — Owner must supply before go-live

| ID | Blocker | Detail | Resolution |
|----|---------|--------|------------|
| **O-001** | **Backblaze B2 application keys missing (all `B2_*` env vars)** | Storage uploads/delivery fail closed with an actionable message by design (no Firebase fallback).Bucket: `reluwebsite`, S3 endpoint `s3.eu-central-003.backblazeb2.com`. | In Backblaze → App Keys, create a key scoped to `reluwebsite`. Without printing them in chat or committing them, set `B2_S3_ENDPOINT`, `B2_REGION` (`eu-central-003`), `B2_BUCKET_NAME`, `B2_APPLICATION_KEY_ID`, `B2_APPLICATION_KEY` in `.env.local` (and the VPS runtime env). Then run the verification tests below. |
| **O-002** | **Firebase → B2 bulk migration not yet run** | Live objects still only exist in Firebase Storage; new uploads go to B2 once O-001 is fixed. | `node scripts/migrate-firebase-to-b2.mjs --dry-run` → review, then run with `--execute`, then `--fix-refs` to rewrite Firestore `users.photoURL`/team/gallery references to `/api/gallery/media?key=…`. Script is idempotent/resumable and never deletes originals. |
| **O-003** | **EMAIL_USER / EMAIL_PASS empty** | Approval/rejection and notification emails disabled. | Gmail app password in `.env.local` + VPS runtime env (do not commit). |

## P1 — Verify after O-001

| ID | Blocker | Detail | Resolution |
|----|---------|--------|------------|
| **O-004** | **Live B2 round-trip not exercised** | `tests/b2-permanent-delete-live.test.mjs` cannot run without real keys; video compress→thumbnail→upload→delete flow not exercised against the real bucket. | After O-001: `node --test tests/b2-permanent-delete-live.test.mjs`, then upload one video + one image via `/admin/gallery/[eventId]` and confirm compression, poster thumbnail, `-orig` retention and delete cleanup. |
| **O-005** | **Legacy R2 credentials can be retired** | B2 is primary; R2 kept only as migration fallback. | After O-002 succeeds: remove R2 vars from `.env.local`/runtime env, then delete `src/lib/r2.ts` (legacy helper retained for the migration carve-out). |

## P2 / P3 — Optional enhancements (unchanged from Phase E)

- Integration tests for signup→registration→check-in→feedback (F-007) / Playwright E2E (F-008).
- Production-host environment verification with final VPS runtime env (F-009).
- `package.json` script dedupe (F-010), PDF UX standardization (F-011).

## Environment notes

- `next dev` runs normally; production start **must** use `node .next/standalone/server.js` with `.next/static` copied into `.next/standalone/.next/` (see README).
- ffmpeg/ffprobe (v9.0.2) present — video pipeline activates automatically once B2 keys exist.

## Publication checklist (all local checks already green)

1. O-001–O-003 resolved.
2. `npm run lint && npx tsc --noEmit && npm run test:unit` (baseline: green).
3. Full-suite run incl. `b2-permanent-delete-live` (baseline: green after keys).
4. Deploy per README deployment section.

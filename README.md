# ReLU Club Website

Website and admin portal for ReLU (Refining Logic and Unleashing AI), the AI/ML and DSA student club at Amrita Vishwa Vidyapeetham, Amaravathi.

Students use it to sign up with their college email, register for events (solo or as a team), check in at events and give feedback. Club admins use the `/admin` portal to run events, attendance, the gallery, resources, alumni and the team list.

Built with Next.js 16 (App Router), TypeScript, Tailwind CSS and Firebase (Auth, Firestore, Storage). Deployed on Google Cloud Run.

## Running locally

Requires Node.js 22 (firebase-admin needs it).

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

The site runs at http://localhost:3000. Ask the CTO for the Firebase config, the service account key and the mail credentials. Never commit `.env.local`.

Other scripts:

```bash
npm run lint
npm run build
```

## Project layout

```
src/
  app/
    (public)/     public site: home, about, events, resources, alumni, contact, profile, auth
    admin/        admin portal
    api/          server routes (registrations, send-email, admin/delete-user, avatars)
  components/     UI, grouped into admin/, layout/, public/ and ui/
  services/       Firestore and Storage access, one file per area
  lib/            Firebase setup, auth helpers, the @/lib/api entry point, small utilities
  types/          shared TypeScript types
public/           static images and the preset avatars
firestore.rules   Firestore security rules
storage.rules     Storage security rules
```

Pages import data functions from `@/lib/api`, which re-exports every service and the shared types.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for roles, the data model and how registrations, attendance and feedback work.

## Deployment

The site is deployed to Cloud Run with Cloud Build (`cloudbuild.yaml`), run by hand. The `NEXT_PUBLIC_FIREBASE_*` values for the live project and `EMAIL_USER` are passed as `--substitutions` (for example `_NEXT_PUBLIC_FIREBASE_PROJECT_ID=relu-480416`); the Gmail app password is read by Cloud Run from the `email-pass` secret in Secret Manager.

```bash
gcloud builds submit --config cloudbuild.yaml .
```

Security rules are deployed separately with the Firebase CLI:

```bash
firebase deploy --only firestore:rules,storage
```

When a change touches both the app and the rules, deploy the app first and the rules second.

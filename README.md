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

The site runs at http://localhost:3000. For day-to-day work, point `.env.local` at staging (see below). Never commit `.env.local`.

Other scripts:

```bash
npm run lint
npm run build
```

## Working with staging

There are two Firebase projects:

- `relu-480416`: the live site on Cloud Run, with real student data.
- `relu-staging`: test data only. The Vercel deployment (and every PR preview) uses it, and so should local development.

### Getting access

Each person uses their own Google account; nobody shares a key file. The CTO adds you in the Firebase console for **relu-staging** under Project settings → Users and permissions (Viewer to look around, Editor to develop). Access is removed the same way when someone leaves. Only add people to `relu-staging`, never to the live project.

### Local setup

1. Sign in once with your Google account (this is what the server code uses instead of a key):

   ```bash
   gcloud auth application-default login
   gcloud auth application-default set-quota-project relu-staging
   ```

2. Put this in `.env.local`. These Firebase web values are public; they are already in the staging site's pages.

   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC25fTy1CbcVIEgjlKsFg3wII3C4hZaPWE
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=relu-staging.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=relu-staging
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=relu-staging.firebasestorage.app
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=806203876489
   NEXT_PUBLIC_FIREBASE_APP_ID=1:806203876489:web:6338ebdf6c7a20ab56d258
   FIREBASE_ADMIN_KEY=
   EMAIL_USER=
   EMAIL_PASS=
   ```

   Leave `FIREBASE_ADMIN_KEY` empty so your own login is used, and the email values empty so local runs never send mail.

3. `npm run dev`. Sign in with a staging test account (ask the CTO) or sign up a new one.

### Trying rule changes

Run `npm run test:rules` (local emulators, no access needed), then deploy to staging before the live project:

```bash
firebase deploy --only firestore:rules,storage --project relu-staging
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

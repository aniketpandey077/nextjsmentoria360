# Firestore security rules

Approve/reject join requests uses **`/api/join-requests`** (Firebase Admin SDK on the server), so it works even before you update rules.

## Firebase Admin env vars

If you see `Missing FIREBASE_ADMIN_* env vars`:

1. In `.env.local`, wrap `FIREBASE_ADMIN_PRIVATE_KEY` in **double quotes** (one line, `\n` between lines).
2. Restart dev server: stop `npm run dev`, then start again.
3. Or download your service account JSON from Firebase Console and save it as `firebase-admin.json` in the project root (gitignored).

For all other client reads/writes, deploy rules:

## Option A — Firebase Console

1. Open [Firebase Console](https://console.firebase.google.com/) → **project-main-cms**
2. **Firestore Database** → **Rules**
3. Paste the contents of `firestore.rules` from this repo
4. **Publish**

## Option B — Firebase CLI

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules --project project-main-cms
```

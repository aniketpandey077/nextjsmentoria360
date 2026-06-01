# Firestore security rules

Approve/reject join requests uses **`/api/join-requests`** (Firebase Admin SDK on the server), so it works even before you update rules.

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

# Firebase Cloud Function — firebaseVerify

Firebase Cloud Function to verify Firebase ID tokens and upsert users into Supabase.

## How it works

- Exposes an HTTP function `firebaseVerify`.
- Accepts a Firebase ID token in `Authorization: Bearer <token>` or `body.idToken`.
- Verifies the token with Firebase Admin SDK.
- Attempts to upsert the user into the `users` table in Supabase using the service role key.

## Required environment variables (for upsert)

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Optional environment variable for Firebase Admin

- `FIREBASE_SERVICE_ACCOUNT_JSON` — put the JSON content of the service account here if you want explicit initialization. When deployed to Firebase/GCP you may not need this (ADC will be used).

## Deploy (PowerShell examples)

Install dependencies (local / CI):
```powershell
npm --prefix .\functions install
```

Login and select Firebase project:
```powershell
npx firebase login
npx firebase use --add
```

Deploy the function with Firebase CLI:
```powershell
npx firebase deploy --only functions:firebaseVerify
```

## Notes

- Use Firebase Console or `gcloud` to set production secrets. Never commit `SUPABASE_SERVICE_ROLE_KEY`.
- CORS is restricted by default to your frontend domains. Edit `functions/index.js` to add more allowed origins if needed.
- After deploy, point your frontend to the function URL (or proxy through your backend). The function accepts a Bearer token or a JSON body with `idToken`.
Firebase Cloud Function to verify Firebase ID tokens and upsert users into Supabase.

How it works:
- Exposes an HTTP function `firebaseVerify`.
- Accepts a Firebase ID token in Authorization: Bearer <token> or body.idToken.
- Verifies the token with Firebase Admin SDK.
- Attempts to upsert the user into the `users` table in Supabase using the service role key.

Environment variables required for upsert (only required if you want server-side upsert):
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY

If you want Firebase Admin to be initialized with a service account JSON, set:
- FIREBASE_SERVICE_ACCOUNT_JSON (JSON string)

Deploy:
- Use the Firebase CLI. See `package.json` scripts for a convenience deploy command.

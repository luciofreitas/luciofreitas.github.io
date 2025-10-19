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

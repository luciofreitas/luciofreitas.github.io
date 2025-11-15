# Webhook test harness

This folder contains a small harness to test the Supabase webhook endpoint implemented in `backend/index.js`.

Files:

- `webhook-harness.js` — sends a fake `user` payload (create + update) to the webhook URL and inspects the `users` table for changes.

How to run

1. Ensure your backend server is running (by default it listens on `http://localhost:3001`).
2. Ensure `backend/.env` contains the required environment variables (at minimum `DATABASE_URL` for DB checks and `SUPABASE_WEBHOOK_KEY` if the server enforces it). Example:

```
DATABASE_URL=...
SUPABASE_WEBHOOK_KEY=...
SUPABASE_WEBHOOK_AUTO_CREATE=true   # optional for testing creation
SUPABASE_WEBHOOK_FORCE_SYNC=false   # optional
```

3. From the `backend` folder run:

```powershell
node tests/webhook-harness.js
```

The script will:

- POST a `created` payload to `/api/auth/supabase-webhook`.
- Query the database to see if a row was created.
- POST an `updated` payload with a later timestamp.
- Query the database again to check whether name/photo were updated.

Notes

- If the server is not running the script will show connection errors for the webhook.
- If `SUPABASE_WEBHOOK_AUTO_CREATE` is not enabled on the server, the create test will be a no-op and you will see "No row found" in the output.
- The harness does not modify or delete rows; it uses a unique test email and auth_id per run.

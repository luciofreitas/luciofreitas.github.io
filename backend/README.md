Backend (local dev)

This is a tiny local dev backend used by the frontend during development. It reads fallback JSON from `../data` and stores simple users in `users.json`.

Run locally:

```powershell
cd backend
npm install
npm start
```

Smoke test:

```powershell
cd backend
npm run smoke
```

Ports:
- http://localhost:3001

Notes:
- `server.js` is the canonical entrypoint. `index.js` is a shim that requires `server.js` so `npm start` works when the package main is `index.js`.

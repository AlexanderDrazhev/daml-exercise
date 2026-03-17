# Backend

NestJS app that proxies requests to the Daml HTTP JSON API and exposes REST endpoints for the UI (users, bank, accounts, contracts). It also stores app users and account/transaction records in MongoDB.

## Run

```bash
npm install
npm run start:dev
```

Runs on port 4000 by default. All routes are under `/api` (e.g. `/api/health`, `/api/users`, `/api/bank/party`).

## Environment

Create a `.env` file (see `.env.example`).

- `PORT` – server port (default 4000)
- `MONGODB_URI` – MongoDB connection string (default `mongodb://localhost:27017/create-daml-app`)
- `DAML_JSON_API_URL` – Daml HTTP JSON API URL (default `http://127.0.0.1:7575`)
- `DAML_LEDGER_ID` – ledger id (default `create-daml-app-sandbox`)
- `DAML_JWT_SECRET` – secret used to build JWTs for the Daml API (default `secret`)
- `DAML_PACKAGE_ID` – optional; set if you need to override the package ID used for template IDs

MongoDB must be running before you start the backend.

## Build

```bash
npm run build
```

Output in `dist/`. Run with `node dist/main.js`.

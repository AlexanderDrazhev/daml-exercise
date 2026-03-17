# create-daml-app

Daml app with a React UI and a NestJS backend that talks to the Daml ledger. Users get accounts (created by the bank), can deposit, withdraw, and transfer to users they follow. The bank can transfer between any two customers.

## What you need

- [Node.js](https://nodejs.dev) (v18+)
- [Daml](https://docs.daml.com) (SDK installed and on PATH)
- MongoDB (for user list and account/transaction records)

## Run order

Start everything in this order. If you see "Gateway Timeout" in the UI, one of the services below is not running or not ready yet.

1. **MongoDB**  
   Start MongoDB (e.g. `mongod`, or `brew services start mongodb-community` on macOS).

2. **Daml**  
   From the project root:
   ```bash
   daml start
   ```
   Wait until the JSON API is ready. This builds the Daml code, runs the sandbox, and runs the HTTP JSON API on port 7575.

3. **Backend**  
   In another terminal:
   ```bash
   cd backend && npm install && npm run start:dev
   ```
   Wait until it logs that the Nest application has started. It listens on port 4000 by default. Set `MONGODB_URI` in `backend/.env` if MongoDB is not at `mongodb://localhost:27017`. Copy `backend/.env.example` to `backend/.env` if you haven’t.

4. **UI**  
   In a third terminal:
   ```bash
   cd ui && npm install && npm run dev
   ```
   Open http://localhost:3000. The UI proxies `/api` to the backend and uses the Daml codegen in `ui/daml.js`.

## Scripts from project root

- `npm run start:backend` – start backend (from root)
- `npm run start:ui` – start UI (from root)
- `daml start` – must be run separately; keep it running while you use the app

## Users and “The Network”

The list of users (for following and transfers) comes from the backend’s MongoDB, not from the ledger. When someone logs in, the UI registers them via `POST /api/users/register`. Log in as Alice, Bob, and Charlie at least once so they appear under “The Network”.

## Template ID / package ID errors

If you see errors about template ID or package not found, the backend’s package ID may not match the ledger. After running `daml start`, the codegen in `ui/daml.js/create-daml-app-0.1.0` has a `packageId` export. Set `DAML_PACKAGE_ID` in `backend/.env` to that value and restart the backend.

## Build for production

```bash
daml build
daml codegen js .daml/dist/create-daml-app-0.1.0.dar -o ui/daml.js
cd backend && npm run build
cd ui && npm run build
```

The UI build is in `ui/dist`. The backend runs with `node dist/main.js` from the `backend` directory.

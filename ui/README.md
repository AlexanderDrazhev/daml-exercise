# UI

React app (Vite). Talks to the backend at `/api` (proxied in dev). Uses Daml codegen from `daml.js/create-daml-app-0.1.0`.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000. The Vite config proxies `/api` to the backend (default `http://localhost:4000`).

## Build

```bash
npm run build
```

Output in `dist/`. The root README describes the full run order (Daml, backend, then UI).

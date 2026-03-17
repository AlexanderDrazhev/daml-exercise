/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_LEDGER_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

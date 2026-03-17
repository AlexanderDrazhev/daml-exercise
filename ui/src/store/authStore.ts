import { create } from "zustand";
import { persist } from "zustand/middleware";
import Credentials from "../Credentials";
import { authConfig } from "../config";
import { damlHubLogout } from "@daml/hub-react";

const STORAGE_NAME = "create-daml-app-auth";

type Stored = {
  party: string;
  token: string;
  userId: string;
  primaryParty: string;
  publicParty?: string;
};

function toCredentials(stored: Stored): Credentials {
  const publicParty = stored.publicParty;
  return {
    party: stored.party,
    token: stored.token,
    user: { userId: stored.userId, primaryParty: stored.primaryParty },
    publicParty,
    getPublicParty: () => ({
      usePublicParty: () => publicParty,
      setup: () => {},
    }),
  };
}

function isStored(value: unknown): value is Stored {
  return (
    value != null &&
    typeof value === "object" &&
    typeof (value as Stored).party === "string" &&
    typeof (value as Stored).token === "string" &&
    typeof (value as Stored).userId === "string" &&
    typeof (value as Stored).primaryParty === "string"
  );
}

interface AuthState {
  stored: Stored | null;
  credentials: Credentials | undefined;
  login: (creds: Credentials) => void;
  logout: () => void;
  syncCredentialsFromStored: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      stored: null,
      credentials: undefined,

      login: (creds) => {
        const stored: Stored = {
          party: creds.party,
          token: creds.token,
          userId: creds.user.userId,
          primaryParty: creds.user.primaryParty ?? creds.party,
          publicParty: creds.publicParty,
        };
        if (authConfig.provider === "none" && creds.publicParty != null) {
          set({ credentials: creds, stored });
        } else {
          set({ credentials: creds, stored: null });
        }
      },

      logout: () => {
        if (authConfig.provider === "daml-hub") {
          damlHubLogout();
        }
        set({ credentials: undefined, stored: null });
      },

      syncCredentialsFromStored: () => {
        const { stored } = get();
        const credentials =
          stored && isStored(stored) ? toCredentials(stored) : undefined;
        set({ credentials });
      },
    }),
    {
      name: STORAGE_NAME,
      partialize: (authState) =>
        authConfig.provider === "none" ? { stored: authState.stored } : {},
    },
  ),
);

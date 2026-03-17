import React, { useCallback } from 'react';
import Credentials, { PublicParty } from '../../../Credentials';
import { Button } from '../../ui/Button';
import Ledger from "@daml/ledger";
import { usersApi } from "../../../api/usersApi";
import {
  DamlHubLogin as DamlHubLoginBtn,
  usePublicParty,
} from "@daml/hub-react";
import { authConfig, Insecure } from "../../../config";
import { getErrorMessage } from "../../../utils/getErrorMessage";

const RECENT_USERS_KEY = "create-daml-app-recent-users";
const RECENT_USERS_MAX = 10;

function getRecentUsers(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_USERS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch (error: unknown) {
    console.warn("Failed to load recent users from storage:", getErrorMessage(error));
    return [];
  }
}

function addRecentUser(username: string): void {
  const recent = getRecentUsers();
  const next = [username, ...recent.filter((name) => name !== username)].slice(0, RECENT_USERS_MAX);
  try {
    localStorage.setItem(RECENT_USERS_KEY, JSON.stringify(next));
  } catch (error: unknown) {
    console.warn("Failed to save recent users to storage:", getErrorMessage(error));
  }
}

type Props = {
  onLogin: (credentials: Credentials) => void;
};

function LoginScreen({ onLogin }: Props) {
  const login = useCallback(
    async (credentials: Credentials) => {
      onLogin(credentials);
    },
    [onLogin],
  );

  const wrap = (component: React.ReactNode) => (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 rounded-lg border bg-card p-6 shadow-sm">
        <div className="flex flex-col items-center gap-2 text-center">
          <a
            href="https://www.daml.com/developers"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2"
          >
            <img src="/daml.svg" alt="Daml" className="h-10 w-10" />
            <span className="text-2xl font-bold text-primary">
              Create Daml App
            </span>
          </a>
        </div>
        <div className="test-select-login-screen">{component}</div>
      </div>
    </div>
  );

  function InsecureLogin({ auth }: { auth: Insecure }) {
    const [username, setUsername] = React.useState("");
    const [submitting, setSubmitting] = React.useState(false);
    const recentUsers = getRecentUsers();

    const handleSubmit = async (event: React.FormEvent) => {
      event.preventDefault();
      const name = username.trim();
      if (!name) return;
      setSubmitting(true);
      try {
        const token = auth.makeToken(name);
        const ledger = new Ledger({ token });
        const primaryParty: string = await auth.userManagement
          .primaryParty(name, ledger)
          .catch((error: unknown) => {
            const errorMsg =
              error instanceof Error ? error.toString() : JSON.stringify(error);
            alert(`Failed to sign in as '${name}':\n${errorMsg}`);
            throw error;
          });

        const publicParty: string = await auth.userManagement
          .publicParty(name, ledger)
          .catch((error: unknown) => {
            const errorMsg =
              error instanceof Error ? error.toString() : JSON.stringify(error);
            alert(
              `Failed to find public party for '${name}' (needed for network list):\n${errorMsg}`,
            );
            throw error;
          });

        const getPublicParty = (): PublicParty => ({
          usePublicParty: () => publicParty,
          setup: () => {},
        });

        addRecentUser(name);
        await usersApi.register(primaryParty, name, name).catch((error: unknown) => {
          console.warn("Failed to register user in app list:", getErrorMessage(error));
        });

        await login({
          user: { userId: name, primaryParty },
          party: primaryParty,
          token: auth.makeToken(name),
          publicParty,
          getPublicParty,
        });
      } finally {
        setSubmitting(false);
      }
    };

    return wrap(
      <>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Username (e.g. Alice, Bob, Charlie, Alex)"
            value={username}
            className="test-select-username-field w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            onChange={(event) => setUsername(event.target.value)}
            disabled={submitting}
          />
          <Button
            type="submit"
            className="test-select-login-button w-full"
            disabled={submitting}
          >
            {submitting ? "Please wait..." : "Sign in"}
          </Button>
        </form>
        {recentUsers.length > 0 && (
          <div className="text-muted-foreground mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
            <span>Quick sign in:</span>
            {recentUsers.map((recentUsername) => (
              <Button
                key={recentUsername}
                variant="outline"
                className="text-xs"
                onClick={() => setUsername(recentUsername)}
              >
                {recentUsername}
              </Button>
            ))}
          </div>
        )}
      </>,
    );
  }

  function DamlHubLogin() {
    return wrap(
      <div className="flex justify-center">
        <DamlHubLoginBtn
        onLogin={creds => {
          if (creds) {
            usersApi.register(creds.party, creds.partyName, creds.partyName).catch((error: unknown) => {
              console.warn("Failed to register user in app list:", getErrorMessage(error));
            });
            login({
              party: creds.party,
              user: { userId: creds.partyName, primaryParty: creds.party },
              token: creds.token,
              getPublicParty: () => ({
                usePublicParty: () => usePublicParty(),
                setup: () => {},
              }),
            });
          }
        }}
        options={{
          method: {
            button: {
              render: () => <Button className="w-full">Log in with Daml Hub</Button>,
            },
          },
        }}
      />
      </div>,
    );
  }

  return authConfig.provider === "none" ? (
    <InsecureLogin auth={authConfig} />
  ) : authConfig.provider === "daml-hub" ? (
    <DamlHubLogin />
  ) : (
    <div>Invalid configuration.</div>
  );
}

export default LoginScreen;

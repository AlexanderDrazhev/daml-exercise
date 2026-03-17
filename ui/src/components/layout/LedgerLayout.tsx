import React from "react";
import DamlHub, { isRunningOnHub, usePublicParty, usePublicToken } from "@daml/hub-react";
import Credentials from "../../Credentials";
import { userContext, publicContext } from "../../contexts/ledgerContext";
import MainScreen from "../features/main/MainScreen";
import { LoadingScreen } from "./LoadingScreen";

type LedgerWithChildren = React.ComponentType<
  React.ComponentProps<typeof userContext.DamlLedger> & { children?: React.ReactNode }
>;
type DamlHubWithChildren = React.ComponentType<
  React.ComponentProps<typeof DamlHub> & { children?: React.ReactNode }
>;

const UserLedger = userContext.DamlLedger as LedgerWithChildren;
const PublicLedger = publicContext.DamlLedger as LedgerWithChildren;
const DamlHubWithChildren = DamlHub as DamlHubWithChildren;

interface LedgerLayoutProps {
  credentials: Credentials;
  onLogout: () => void;
}

function PublicPartyLedger({ children }: { children: React.ReactNode }) {
  const publicToken = usePublicToken();
  const publicParty = usePublicParty();
  if (publicToken && publicParty) {
    return (
      <PublicLedger token={publicToken.token} party={publicParty}>
        {children}
      </PublicLedger>
    );
  }
  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoadingScreen message="Loading..." />
    </div>
  );
}

export function LedgerLayout({ credentials, onLogout }: LedgerLayoutProps) {
  const Wrap = ({ children }: { children: React.ReactNode }) =>
    isRunningOnHub() ? (
      <DamlHubWithChildren token={credentials.token}>
        <PublicPartyLedger>{children}</PublicPartyLedger>
      </DamlHubWithChildren>
    ) : (
      <div>{children}</div>
    );

  return (
    <Wrap>
      <UserLedger
        token={credentials.token}
        party={credentials.party}
        user={credentials.user}
      >
        <MainScreen
          credentials={credentials}
          getPublicParty={credentials.getPublicParty}
          onLogout={onLogout}
        />
      </UserLedger>
    </Wrap>
  );
}

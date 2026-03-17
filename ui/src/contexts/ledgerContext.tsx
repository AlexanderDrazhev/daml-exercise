import { createLedgerContext } from "@daml/react";
import { isRunningOnHub } from "@daml/hub-react";

export const userContext = createLedgerContext();
export const publicContext = isRunningOnHub()
  ? createLedgerContext()
  : userContext;

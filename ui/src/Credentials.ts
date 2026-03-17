import { User } from "@daml/ledger";

export type PublicParty = {
  usePublicParty: () => string | undefined;
  setup: () => void;
};

export type Credentials = {
  party: string;
  token: string;
  user: User;
  publicParty?: string;
  getPublicParty: () => PublicParty;
};

export default Credentials;

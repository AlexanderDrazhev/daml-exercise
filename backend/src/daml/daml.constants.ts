export const PACKAGE_ID =
  process.env.DAML_PACKAGE_ID ||
  '1b874ff35495732b2d6712a9d64ecfd7cc6512f6af6b9911eddffb9f4965d338';

export const TEMPLATE_IDS = {
  User: `${PACKAGE_ID}:User:User`,
  Alias: `${PACKAGE_ID}:User:Alias`,
  HelloWorld: `${PACKAGE_ID}:HelloWorld:HelloWorld`,
  Factory: `${PACKAGE_ID}:Bank:Factory`,
  Account: `${PACKAGE_ID}:Bank:Account`,
  Transaction: `${PACKAGE_ID}:Bank:Transaction`,
  TransferRequest: `${PACKAGE_ID}:Bank:TransferRequest`,
} as const;

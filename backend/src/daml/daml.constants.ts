import * as fs from 'fs';
import * as path from 'path';

/** Read package ID from UI codegen so backend matches the deployed DAR (run after daml build / daml codegen js). */
function readPackageIdFromCodegen(): string | null {
  try {
    const codegenPath = path.join(
      __dirname,
      '..',
      '..',
      '..',
      'ui',
      'daml.js',
      'create-daml-app-0.1.0',
      'lib',
      'index.js',
    );
    const content = fs.readFileSync(codegenPath, 'utf-8');
    const match = content.match(
      /exports\.packageId\s*=\s*['"]([a-f0-9]{64})['"]/,
    );
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

export const PACKAGE_ID =
  process.env.DAML_PACKAGE_ID ||
  readPackageIdFromCodegen() ||
  '4db4fba41f80b4b12bd2eed6475dc9cf7519d80156a817052ff7742014d8ab77';

export const TEMPLATE_IDS = {
  User: `${PACKAGE_ID}:User:User`,
  Alias: `${PACKAGE_ID}:User:Alias`,
  HelloWorld: `${PACKAGE_ID}:HelloWorld:HelloWorld`,
  Factory: `${PACKAGE_ID}:Bank:Factory`,
  Account: `${PACKAGE_ID}:Bank:Account`,
  Transaction: `${PACKAGE_ID}:Bank:Transaction`,
  TransferRequest: `${PACKAGE_ID}:Bank:TransferRequest`,
  PaymentRequest: `${PACKAGE_ID}:Bank:PaymentRequest`,
  BankNotice: `${PACKAGE_ID}:Bank:BankNotice`,
  BankCustomerNotification: `${PACKAGE_ID}:Bank:BankCustomerNotification`,
} as const;

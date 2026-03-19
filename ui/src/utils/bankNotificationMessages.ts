import dayjs from 'dayjs';

/** Payload shape from on-ledger `BankCustomerNotification` (JSON API). */
export type BankCustomerNotificationPayload = {
  category: string;
  amount: string;
  balanceAfter?: string | null;
  counterparty?: string | null;
  createdAt: unknown;
};

/**
 * JSON API may send Daml `Time` as `{ microseconds: string }` or as an ISO-8601 string.
 */
function parseLedgerTime(createdAt: unknown): dayjs.Dayjs | null {
  if (createdAt == null) return null;

  if (typeof createdAt === 'string') {
    const trimmed = createdAt.trim();
    if (!trimmed) return null;
    const d = dayjs(trimmed);
    return d.isValid() ? d : null;
  }

  if (typeof createdAt === 'object' && createdAt !== null && 'microseconds' in createdAt) {
    try {
      const micros = BigInt(
        String((createdAt as { microseconds: string | number }).microseconds),
      );
      const ms = Number(micros / 1000n);
      const d = dayjs(ms);
      return d.isValid() ? d : null;
    } catch {
      return null;
    }
  }

  if (typeof createdAt === 'number' && Number.isFinite(createdAt)) {
    const d = dayjs(createdAt > 1e14 ? createdAt / 1000 : createdAt);
    return d.isValid() ? d : null;
  }

  return null;
}

/** Date + time for notification copy (e.g. 17/04/2023 14:30). */
function formatDamlDateTime(createdAt: unknown): string {
  const d = parseLedgerTime(createdAt);
  if (!d) return '';
  return d.format('DD/MM/YYYY HH:mm');
}

/** Date + time for tables (transactions, etc.); em dash if missing (e.g. old contracts). */
export function formatLedgerDateTimeForUi(createdAt: unknown): string {
  const d = parseLedgerTime(createdAt);
  if (!d) return '—';
  return d.format('DD/MM/YYYY HH:mm');
}

function formatMoney(amount: string): string {
  const n = Number(amount);
  if (Number.isNaN(n)) return amount;
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function shortParty(p: string): string {
  return p.length > 24 ? `${p.slice(0, 16)}…` : p;
}

/** Turn structured ledger fields into user-facing sentences (bank → customer). */
export function formatBankCustomerNotification(
  payload: BankCustomerNotificationPayload,
  partyToAlias: Map<string, string>,
): string {
  const date = formatDamlDateTime(payload.createdAt);
  const when = date || 'an unknown time';
  const amt = formatMoney(payload.amount);
  const balRaw = payload.balanceAfter;
  const bal =
    balRaw != null && balRaw !== ''
      ? formatMoney(String(balRaw))
      : null;
  const cpParty = payload.counterparty;
  const cp =
    cpParty && typeof cpParty === 'string'
      ? partyToAlias.get(cpParty) ?? shortParty(cpParty)
      : 'the recipient';

  switch (payload.category) {
    case 'Deposit':
      return bal != null
        ? `You deposited ${amt} into your account on ${when}. Current balance is ${bal}.`
        : `You deposited ${amt} into your account on ${when}.`;
    case 'Withdraw':
      return bal != null
        ? `You have withdrawn ${amt} on ${when}. Current balance is ${bal}.`
        : `You have withdrawn ${amt} on ${when}.`;
    case 'TransferOut':
    case 'BankTransferOut':
      return bal != null
        ? `You have transferred ${amt} to ${cp} on ${when}. Current balance is ${bal}.`
        : `You have transferred ${amt} to ${cp} on ${when}.`;
    case 'TransferIn':
    case 'BankTransferIn':
      return bal != null
        ? `You received ${amt} from ${cp} on ${when}. Current balance is ${bal}.`
        : `You received ${amt} from ${cp} on ${when}.`;
    case 'BillPayment':
      return `Your bill payment of ${amt} on ${when} has been successful.`;
    default:
      return `${payload.category}: ${amt}${date ? ` (${date})` : ''}`;
  }
}

export function notificationCreatedAtMicros(createdAt: unknown): bigint {
  if (typeof createdAt === 'object' && createdAt !== null && 'microseconds' in createdAt) {
    try {
      return BigInt(
        String((createdAt as { microseconds: string | number }).microseconds),
      );
    } catch {
      return 0n;
    }
  }
  const d = parseLedgerTime(createdAt);
  if (!d) return 0n;
  return BigInt(d.valueOf()) * 1000n;
}

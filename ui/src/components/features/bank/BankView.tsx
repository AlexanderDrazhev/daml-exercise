import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '../../ui/Button';
import { useLedgerApi } from '../../../api/useLedgerApi';
import { getErrorMessage } from '../../../utils/getErrorMessage';
import { userContext } from '../../../contexts/ledgerContext';
import { Card, CardHeader, CardContent } from '../../ui/Card';
import { LoadingScreen } from '../../layout/LoadingScreen';
import { bankApi } from '../../../api/bankApi';
import { accountsApi } from '../../../api/accountsApi';
import {
  paymentRequestStatusApi,
  type PaymentRequestStatusType,
} from '../../../api/paymentRequestStatusApi';
import {
  formatBankCustomerNotification,
  formatLedgerDateTimeForUi,
  notificationCreatedAtMicros,
  type BankCustomerNotificationPayload,
} from '../../../utils/bankNotificationMessages';

interface BankViewProps {
  token: string;
  myFollowing?: string[];
  partyToAlias?: Map<string, string>;
}

interface PaymentRequestItem {
  contractId: string;
  payload: {
    creditor: string;
    payer: string;
    amount: string;
    message?: string | null;
    requestId: string;
  };
}

export default function BankView({ token, myFollowing = [], partyToAlias = new Map() }: BankViewProps) {
  const ledgerApi = useLedgerApi(token);
  const party = userContext.useParty();
  const [account, setAccount] = useState<{
    contractId: string;
    balance: string;
    following: string[];
  } | null>(null);
  const [transactions, setTransactions] = useState<
    Array<{
      contractId?: string;
      owner?: string;
      amount: string;
      transactionType: string;
      counterparty?: string;
      createdAt?: unknown;
    }>
  >([]);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);
  const [bankParty, setBankParty] = useState<string | null>(null);
  const [customerParties, setCustomerParties] = useState<string[]>([]);
  const [bankTransferFrom, setBankTransferFrom] = useState('');
  const [bankTransferTo, setBankTransferTo] = useState('');
  const [bankTransferAmount, setBankTransferAmount] = useState('');
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequestItem[]>(
    [],
  );
  const [requestPayer, setRequestPayer] = useState('');
  const [requestAmount, setRequestAmount] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [bankAnnouncement, setBankAnnouncement] = useState('');
  const [bankAnnouncementDraft, setBankAnnouncementDraft] = useState('');
  const [paymentRequestStatusMap, setPaymentRequestStatusMap] = useState<
    Record<string, PaymentRequestStatusType>
  >({});
  const [bankInboxEntries, setBankInboxEntries] = useState<
    Array<{ contractId: string; payload: BankCustomerNotificationPayload }>
  >([]);

  const load = useCallback(() => {
    if (!ledgerApi) return;
    setLoading(true);
    setLoadError(null);
    const ensureBankParty = (): Promise<string> =>
      bankParty
        ? Promise.resolve(bankParty)
        : bankApi.getBankParty().then((partyId) => {
            setBankParty(partyId);
            return partyId;
          });
    ensureBankParty().then((bankPartyId) => {
      const isBank = party === bankPartyId;
      if (isBank) {
        return Promise.all([
          Promise.resolve(null as { contractId: string; payload?: unknown } | null),
          ledgerApi.query('Transaction'),
          ledgerApi.query('Account'),
        ]).then(([_, txList, accountList]) => {
          setAccount(null);
          setPaymentRequests([]);
          setPaymentRequestStatusMap({});
          setBankInboxEntries([]);
          const list = (txList ?? []) as unknown as Array<{
            contractId: string;
            payload: {
              owner?: string;
              amount: string;
              transactionType: string;
              counterparty?: string;
              createdAt?: unknown;
            };
          }>;
          setTransactions(
            list
              .map((contract) => ({
                contractId: contract.contractId,
                owner: contract.payload.owner,
                amount: contract.payload.amount,
                transactionType: contract.payload.transactionType,
                counterparty: contract.payload.counterparty,
                createdAt: contract.payload.createdAt,
              }))
              .sort((a, b) => {
                const tb = notificationCreatedAtMicros(b.createdAt);
                const ta = notificationCreatedAtMicros(a.createdAt);
                if (tb !== ta) return tb > ta ? 1 : -1;
                return (
                  Number(b.amount) - Number(a.amount) ||
                  (b.transactionType || '').localeCompare(a.transactionType || '')
                );
              }),
          );
          const owners = [...new Set((accountList ?? []).map((contract) => (contract.payload as { owner: string }).owner))].sort();
          setCustomerParties(owners);
          void bankApi
            .getAnnouncement()
            .then(({ message }) => {
              setBankAnnouncement(message);
              if (party === bankPartyId) setBankAnnouncementDraft(message);
            })
            .catch(() => {});
        });
      }
      return Promise.all([
        ledgerApi.fetchByKey('Account', { _1: bankPartyId, _2: party }),
        ledgerApi.query('Transaction', { owner: party }),
        ledgerApi.query('PaymentRequest'),
        ledgerApi.query('BankCustomerNotification'),
      ]).then(([acc, txList, prList, notifList]) => {
        setBankParty(bankPartyId);
        const accountPayload = acc?.payload as
          | { owner: string; balance: string; following: string[] }
          | undefined;
        if (accountPayload) {
          setAccount({
            contractId: (acc as { contractId: string }).contractId,
            balance: accountPayload.balance,
            following: accountPayload.following ?? [],
          });
        } else {
          setAccount(null);
        }
        setCustomerParties([]);
        const list = (txList ?? []) as unknown as Array<{
          contractId: string;
          payload: {
            amount: string;
            transactionType: string;
            counterparty?: string;
            createdAt?: unknown;
          };
        }>;
        setTransactions(
          list
            .map((contract) => ({
              contractId: contract.contractId,
              amount: contract.payload.amount,
              transactionType: contract.payload.transactionType,
              counterparty: contract.payload.counterparty,
              createdAt: contract.payload.createdAt,
            }))
            .sort((a, b) => {
              const tb = notificationCreatedAtMicros(b.createdAt);
              const ta = notificationCreatedAtMicros(a.createdAt);
              if (tb !== ta) return tb > ta ? 1 : -1;
              return (
                Number(b.amount) - Number(a.amount) ||
                (b.transactionType || '').localeCompare(a.transactionType || '')
              );
            }),
        );
        const requests: PaymentRequestItem[] = (prList ?? []).map(
          (c: { contractId: string; payload: Record<string, unknown> }) => ({
            contractId: c.contractId,
            payload: {
              creditor: c.payload.creditor as string,
              payer: c.payload.payer as string,
              amount: String(c.payload.amount),
              message: c.payload.message as string | null | undefined,
              requestId: (c.payload.requestId as string) ?? '',
            },
          }),
        );
        setPaymentRequests(requests);
        const rawNotifs = (notifList ?? []) as Array<{
          contractId: string;
          payload: Record<string, unknown>;
        }>;
        const mine = rawNotifs.filter(
          (row) => (row.payload.recipient as string) === party,
        );
        mine.sort((a, b) => {
          const tb = notificationCreatedAtMicros(b.payload.createdAt);
          const ta = notificationCreatedAtMicros(a.payload.createdAt);
          return tb > ta ? 1 : tb < ta ? -1 : 0;
        });
        setBankInboxEntries(
          mine.map((row) => ({
            contractId: row.contractId,
            payload: {
              category: String(row.payload.category ?? ''),
              amount: String(row.payload.amount ?? ''),
              balanceAfter: (row.payload.balanceAfter as string | null | undefined) ?? null,
              counterparty: (row.payload.counterparty as string | null | undefined) ?? null,
              createdAt: row.payload.createdAt,
            },
          })),
        );
        return paymentRequestStatusApi
          .getStatusMap(requests.map((r) => r.contractId))
          .then(setPaymentRequestStatusMap)
          .catch(() => setPaymentRequestStatusMap({}))
          .then(() =>
            bankApi
              .getAnnouncement()
              .then(({ message }) => {
                setBankAnnouncement(message);
                if (party === bankPartyId) setBankAnnouncementDraft(message);
              })
              .catch(() => {}),
          );
      });
    })
      .catch((error: unknown) => {
        const message = getErrorMessage(error);
        console.error("Failed to load account:", message);
        setLoadError(message);
        setAccount(null);
        setTransactions([]);
        setCustomerParties([]);
        setPaymentRequests([]);
        setPaymentRequestStatusMap({});
        setBankInboxEntries([]);
      })
      .finally(() => setLoading(false));
  }, [ledgerApi, party, bankParty]);

  useEffect(() => {
    load();
  }, [load]);

  const requestAccount = async () => {
    setActing(true);
    try {
      await bankApi.createAccount(party);
      load();
    } catch (error: unknown) {
      alert(`Failed to request account: ${getErrorMessage(error)}`);
    } finally {
      setActing(false);
    }
  };

  const syncFollowing = async () => {
    if (!ledgerApi || !account || acting) return;
    const next = [...new Set(myFollowing)];
    if (
      next.length === account.following.length &&
      next.every((partyId, index) => account.following[index] === partyId)
    ) {
      return;
    }
    setActing(true);
    try {
      await ledgerApi.exercise('Account', account.contractId, 'UpdateFollowing', {
        newFollowing: next,
      });
      load();
    } catch (error: unknown) {
      console.warn("Sync following failed:", getErrorMessage(error));
    } finally {
      setActing(false);
    }
  };

  useEffect(() => {
    if (!account) return;
    syncFollowing();
  }, [account?.contractId, myFollowing.join(','), account?.following?.join(',')]);

  const deposit = async () => {
    const amount = parseFloat(depositAmount);
    if (!ledgerApi || !account || Number.isNaN(amount) || amount <= 0) return;
    setActing(true);
    try {
      await ledgerApi.exercise('Account', account.contractId, 'Deposit', {
        amount: String(amount),
      });
      await accountsApi.record(party, amount, "Deposit").catch((error: unknown) => {
        console.warn("Failed to record deposit in backend:", getErrorMessage(error));
      });
      setDepositAmount('');
      load();
    } catch (error: unknown) {
      alert(`Deposit failed: ${getErrorMessage(error)}`);
    } finally {
      setActing(false);
    }
  };

  const withdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!ledgerApi || !account || Number.isNaN(amount) || amount <= 0) return;
    setActing(true);
    try {
      await ledgerApi.exercise('Account', account.contractId, 'Withdraw', {
        amount: String(amount),
      });
      await accountsApi.record(party, -amount, "Withdraw").catch((error: unknown) => {
        console.warn("Failed to record withdrawal in backend:", getErrorMessage(error));
      });
      setWithdrawAmount('');
      load();
    } catch (error: unknown) {
      alert(`Withdraw failed: ${getErrorMessage(error)}`);
    } finally {
      setActing(false);
    }
  };

  const transfer = async () => {
    const amount = parseFloat(transferAmount);
    if (
      !ledgerApi ||
      !account ||
      !transferTo ||
      Number.isNaN(amount) ||
      amount <= 0
    ) {
      return;
    }
    setActing(true);
    try {
      const result = await ledgerApi.exercise(
        'Account',
        account.contractId,
        'CreateTransferRequest',
        { recipient: transferTo, amount: String(amount), isBillPayment: false },
      );
      const requestCid = (result as { exerciseResult: string }).exerciseResult;
      await bankApi.executeTransfer(requestCid);
      setTransferTo('');
      setTransferAmount('');
      load();
    } catch (error: unknown) {
      alert(`Transfer failed: ${getErrorMessage(error)}`);
    } finally {
      setActing(false);
    }
  };

  const createPaymentRequest = async () => {
    const amount = parseFloat(requestAmount);
    if (!ledgerApi || !bankParty || !requestPayer || Number.isNaN(amount) || amount <= 0) return;
    setActing(true);
    try {
      await ledgerApi.create('PaymentRequest', {
        creditor: party,
        payer: requestPayer,
        amount: String(amount),
        bank: bankParty,
        message: requestMessage.trim() || null,
        requestId: crypto.randomUUID(),
      });
      setRequestPayer('');
      setRequestAmount('');
      setRequestMessage('');
      load();
    } catch (error: unknown) {
      alert(`Failed to create request: ${getErrorMessage(error)}`);
    } finally {
      setActing(false);
    }
  };

  const payPaymentRequest = async (
    request: {
      contractId: string;
      payload: { creditor: string; payer: string; amount: string };
    },
  ) => {
    if (!ledgerApi || !account || !bankParty || acting) return;
    const amount = parseFloat(request.payload.amount);
    if (Number.isNaN(amount) || amount <= 0) return;
    const creditor = request.payload.creditor;
    setActing(true);
    try {
      let accountCid = account.contractId;
      if (!account.following.includes(creditor)) {
        await ledgerApi.exercise('Account', account.contractId, 'UpdateFollowing', {
          newFollowing: [...account.following, creditor],
        });
        const acc = await ledgerApi.fetchByKey('Account', { _1: bankParty, _2: party });
        if (!acc) throw new Error('Account not found after update');
        accountCid = acc.contractId;
      }
      const result = await ledgerApi.exercise('Account', accountCid, 'CreateTransferRequest', {
        recipient: creditor,
        amount: request.payload.amount,
        isBillPayment: true,
      });
      const transferRequestCid = (result as { exerciseResult: string }).exerciseResult;
      await bankApi.executeTransfer(transferRequestCid);
      await paymentRequestStatusApi.recordStatus(request.contractId, 'paid');
      load();
    } catch (error: unknown) {
      alert(`Pay failed: ${getErrorMessage(error)}`);
    } finally {
      setActing(false);
    }
  };

  const declinePaymentRequest = async (contractId: string) => {
    if (acting) return;
    setActing(true);
    try {
      await paymentRequestStatusApi.recordStatus(contractId, 'declined');
      load();
    } catch (error: unknown) {
      alert(`Decline failed: ${getErrorMessage(error)}`);
    } finally {
      setActing(false);
    }
  };

  const cancelPaymentRequest = async (contractId: string) => {
    if (acting) return;
    setActing(true);
    try {
      await paymentRequestStatusApi.recordStatus(contractId, 'canceled');
      load();
    } catch (error: unknown) {
      alert(`Cancel failed: ${getErrorMessage(error)}`);
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <LoadingScreen message="Loading account…" className="min-h-[200px]" />
        </CardContent>
      </Card>
    );
  }

  const isBank =
    (bankParty !== null && party === bankParty) ||
    partyToAlias.get(party) === 'Bank';

  const runBankTransfer = async () => {
    const amount = parseFloat(bankTransferAmount);
    if (!bankTransferFrom || !bankTransferTo || Number.isNaN(amount) || amount <= 0) return;
    setActing(true);
    try {
      await bankApi.bankTransfer(bankTransferFrom, bankTransferTo, String(amount));
      setBankTransferFrom('');
      setBankTransferTo('');
      setBankTransferAmount('');
      load();
    } catch (error: unknown) {
      alert(`Transfer failed: ${getErrorMessage(error)}`);
    } finally {
      setActing(false);
    }
  };

  const saveBankAnnouncement = async () => {
    if (acting) return;
    setActing(true);
    try {
      await bankApi.updateAnnouncement(bankAnnouncementDraft);
      const { message } = await bankApi.getAnnouncement();
      setBankAnnouncement(message);
      setBankAnnouncementDraft(message);
    } catch (error: unknown) {
      alert(`Failed to save bank notice: ${getErrorMessage(error)}`);
    } finally {
      setActing(false);
    }
  };

  const bankNoticeSection =
    isBank ? (
      <div className="rounded-md border border-border bg-muted/40 p-3 text-sm space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Bank notice (on-ledger; everyone sees this in the app)
        </p>
        <textarea
          className="w-full min-h-[72px] rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          value={bankAnnouncementDraft}
          onChange={(event) => setBankAnnouncementDraft(event.target.value)}
          disabled={acting}
          maxLength={2000}
          placeholder="Welcome text, tips, maintenance notes…"
        />
        <Button size="sm" onClick={saveBankAnnouncement} disabled={acting}>
          Save notice
        </Button>
      </div>
    ) : bankAnnouncement.trim() ? (
      <div className="rounded-md border border-border bg-muted/40 p-3 text-sm">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
          Bank notice (from ledger)
        </p>
        <p className="text-foreground whitespace-pre-wrap">{bankAnnouncement}</p>
      </div>
    ) : null;

  if (!account) {
    return (
      <Card>
        <CardHeader
          title="Bank account"
          subheader={isBank ? 'You are the bank' : 'Only the bank can create accounts'}
        />
        <CardContent className="space-y-4">
          {loadError && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">
              <p>{loadError}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => { setLoadError(null); load(); }}
              >
                Retry
              </Button>
            </div>
          )}
          {bankNoticeSection}
          {isBank ? (
            <>
              <p className="text-muted-foreground text-sm">
                You create accounts for other users when they request one. View all customer transactions and transfer between customers below.
              </p>
              {customerParties.length >= 2 && (
                <div className="flex flex-wrap gap-2 items-end">
                  <label className="flex flex-col gap-1">
                    <span className="text-muted-foreground text-sm">From</span>
                    <select
                      className="w-40 rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                      value={bankTransferFrom}
                      onChange={(event) => setBankTransferFrom(event.target.value)}
                      disabled={acting}
                    >
                      <option value="">Select customer</option>
                      {customerParties.map((partyId) => (
                        <option key={partyId} value={partyId}>
                          {partyToAlias.get(partyId) ?? partyId}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-muted-foreground text-sm">To</span>
                    <select
                      className="w-40 rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                      value={bankTransferTo}
                      onChange={(event) => setBankTransferTo(event.target.value)}
                      disabled={acting}
                    >
                      <option value="">Select customer</option>
                      {customerParties.map((partyId) => (
                        <option key={partyId} value={partyId}>
                          {partyToAlias.get(partyId) ?? partyId}
                        </option>
                      ))}
                    </select>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Amount"
                    className="w-28 rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                    value={bankTransferAmount}
                    onChange={(event) => setBankTransferAmount(event.target.value)}
                    disabled={acting}
                  />
                  <Button
                    onClick={runBankTransfer}
                    disabled={acting || !bankTransferFrom || !bankTransferTo || !bankTransferAmount}
                  >
                    {acting ? 'Transferring…' : 'Transfer'}
                  </Button>
                </div>
              )}
              <div>
                <h3 className="text-sm font-medium text-foreground mb-2">All customer transactions</h3>
                <div className="overflow-x-auto rounded-md border border-border">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="text-left text-muted-foreground border-b border-border bg-muted/30">
                        <th className="py-2 px-3 font-medium whitespace-nowrap">Date &amp; time</th>
                        <th className="py-2 px-3 font-medium">Customer</th>
                        <th className="py-2 px-3 font-medium">Transaction</th>
                        <th className="py-2 px-3 font-medium text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-3 px-3 text-muted-foreground">
                            No transactions yet.
                          </td>
                        </tr>
                      ) : (
                        transactions.map((transaction, index) => (
                          <tr
                            key={transaction.contractId ?? `tx-${index}`}
                            className="border-b border-border/80 last:border-0"
                          >
                            <td className="py-2 px-3 align-top text-muted-foreground tabular-nums whitespace-nowrap">
                              {formatLedgerDateTimeForUi(transaction.createdAt)}
                            </td>
                            <td className="py-2 px-3 align-top text-foreground">
                              {transaction.owner != null
                                ? partyToAlias.get(transaction.owner) ?? transaction.owner
                                : '—'}
                            </td>
                            <td className="py-2 px-3 align-top">
                              {transaction.transactionType}
                              {transaction.counterparty != null && transaction.counterparty !== ''
                                ? ` ${Number(transaction.amount) >= 0 ? 'from' : 'to'} ${partyToAlias.get(transaction.counterparty) ?? transaction.counterparty}`
                                : ''}
                            </td>
                            <td
                              className={`py-2 px-3 align-top text-right tabular-nums whitespace-nowrap ${
                                Number(transaction.amount) >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}
                            >
                              {Number(transaction.amount) >= 0 ? '+' : ''}
                              {transaction.amount}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="text-muted-foreground text-sm mb-4">
                Request an account; the bank will create it for you.
              </p>
              <Button onClick={requestAccount} disabled={acting}>
                {acting ? 'Requesting…' : 'Request account'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  const followedParties = myFollowing.filter((partyId) => partyId !== party);

  return (
    <Card>
      <CardHeader title="Bank account" subheader="Balance and transactions" />
      <CardContent className="space-y-4">
        {bankNoticeSection}
        {bankInboxEntries.length > 0 && (
          <div className="rounded-md border border-border bg-card p-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Messages from your bank
            </p>
            <ul className="space-y-2 text-sm text-foreground list-none pl-0">
              {bankInboxEntries.map(({ contractId, payload }) => (
                <li
                  key={contractId}
                  className="rounded-md bg-muted/50 px-3 py-2 border border-border/60"
                >
                  {formatBankCustomerNotification(payload, partyToAlias)}
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="text-2xl font-semibold text-foreground">
          Balance: <span className="test-select-account-balance">{account.balance}</span>
        </p>

        <div className="flex flex-wrap gap-2 items-end">
          <label className="flex flex-col gap-1">
            <span className="text-muted-foreground text-sm">Deposit</span>
            <input
              type="number"
              min="0"
              step="0.01"
              className="w-32 rounded-md border border-input bg-background px-2 py-1.5 text-sm"
              value={depositAmount}
              onChange={(event) => setDepositAmount(event.target.value)}
              disabled={acting}
            />
          </label>
          <Button onClick={deposit} disabled={acting || !depositAmount}>
            Deposit
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 items-end">
          <label className="flex flex-col gap-1">
            <span className="text-muted-foreground text-sm">Withdraw</span>
            <input
              type="number"
              min="0"
              step="0.01"
              className="w-32 rounded-md border border-input bg-background px-2 py-1.5 text-sm"
              value={withdrawAmount}
              onChange={(event) => setWithdrawAmount(event.target.value)}
              disabled={acting}
            />
          </label>
          <Button onClick={withdraw} disabled={acting || !withdrawAmount}>
            Withdraw
          </Button>
        </div>

        {followedParties.length > 0 && (
          <div className="flex flex-wrap gap-2 items-end">
            <label className="flex flex-col gap-1">
              <span className="text-muted-foreground text-sm">Transfer to (followed)</span>
              <select
                className="w-40 rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                value={transferTo}
                onChange={(event) => setTransferTo(event.target.value)}
                disabled={acting}
              >
                <option value="">Select user</option>
                {followedParties.map((partyId) => (
                  <option key={partyId} value={partyId}>
                    {partyToAlias.get(partyId) ?? partyId}
                  </option>
                ))}
              </select>
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Amount"
              className="w-28 rounded-md border border-input bg-background px-2 py-1.5 text-sm"
              value={transferAmount}
              onChange={(event) => setTransferAmount(event.target.value)}
              disabled={acting}
            />
            <Button
              onClick={transfer}
              disabled={acting || !transferTo || !transferAmount}
            >
              Transfer
            </Button>
          </div>
        )}

        {followedParties.length > 0 && (
          <div className="flex flex-wrap gap-2 items-end">
            <label className="flex flex-col gap-1">
              <span className="text-muted-foreground text-sm">Request payment from</span>
              <select
                className="w-40 rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                value={requestPayer}
                onChange={(event) => setRequestPayer(event.target.value)}
                disabled={acting}
              >
                <option value="">Select user</option>
                {followedParties.map((partyId) => (
                  <option key={partyId} value={partyId}>
                    {partyToAlias.get(partyId) ?? partyId}
                  </option>
                ))}
              </select>
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Amount"
              className="w-28 rounded-md border border-input bg-background px-2 py-1.5 text-sm"
              value={requestAmount}
              onChange={(event) => setRequestAmount(event.target.value)}
              disabled={acting}
            />
            <input
              type="text"
              placeholder="Message (optional)"
              className="w-40 rounded-md border border-input bg-background px-2 py-1.5 text-sm"
              value={requestMessage}
              onChange={(event) => setRequestMessage(event.target.value)}
              disabled={acting}
            />
            <Button
              onClick={createPaymentRequest}
              disabled={acting || !requestPayer || !requestAmount}
            >
              Request payment
            </Button>
          </div>
        )}

        {paymentRequests.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-foreground mb-2">
              Payment requests
            </h3>
            <ul className="divide-y divide-border text-sm space-y-2">
              {paymentRequests
                .filter(
                  (r) =>
                    r.payload.creditor === party &&
                    !paymentRequestStatusMap[r.contractId],
                )
                .map((request) => (
                  <li
                    key={request.contractId}
                    className="py-2 flex flex-wrap items-center justify-between gap-2"
                  >
                    <span>
                      Request <strong>{request.payload.amount}</strong> from{' '}
                      {partyToAlias.get(request.payload.payer) ??
                        request.payload.payer}
                      {request.payload.message
                        ? ` — ${request.payload.message}`
                        : ''}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => cancelPaymentRequest(request.contractId)}
                      disabled={acting}
                    >
                      Cancel request
                    </Button>
                  </li>
                ))}
              {paymentRequests
                .filter(
                  (r) =>
                    r.payload.payer === party &&
                    !paymentRequestStatusMap[r.contractId],
                )
                .map((request) => (
                  <li
                    key={request.contractId}
                    className="py-2 flex flex-wrap items-center justify-between gap-2"
                  >
                    <span>
                      <strong>
                        {partyToAlias.get(request.payload.creditor) ??
                          request.payload.creditor}
                      </strong>{' '}
                      requests <strong>{request.payload.amount}</strong>
                      {request.payload.message
                        ? ` — ${request.payload.message}`
                        : ''}
                    </span>
                    <span className="flex gap-1">
                      <Button
                        size="sm"
                        onClick={() => payPaymentRequest(request)}
                        disabled={acting}
                      >
                        Pay
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          declinePaymentRequest(request.contractId)
                        }
                        disabled={acting}
                      >
                        Decline
                      </Button>
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        )}

        <div>
          <h3 className="text-sm font-medium text-foreground mb-2">Your transactions</h3>
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border bg-muted/30">
                  <th className="py-2 px-3 font-medium whitespace-nowrap">Date &amp; time</th>
                  <th className="py-2 px-3 font-medium">Transaction</th>
                  <th className="py-2 px-3 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-3 px-3 text-muted-foreground">
                      No transactions yet.
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction, index) => (
                    <tr
                      key={transaction.contractId ?? `tx-${index}`}
                      className="border-b border-border/80 last:border-0"
                    >
                      <td className="py-2 px-3 align-top text-muted-foreground tabular-nums whitespace-nowrap">
                        {formatLedgerDateTimeForUi(transaction.createdAt)}
                      </td>
                      <td className="py-2 px-3 align-top">
                        {transaction.transactionType}
                        {transaction.counterparty != null && transaction.counterparty !== ''
                          ? ` ${Number(transaction.amount) >= 0 ? 'from' : 'to'} ${partyToAlias.get(transaction.counterparty) ?? transaction.counterparty}`
                          : ''}
                      </td>
                      <td
                        className={`py-2 px-3 align-top text-right tabular-nums whitespace-nowrap ${
                          Number(transaction.amount) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {Number(transaction.amount) >= 0 ? '+' : ''}
                        {transaction.amount}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '../../ui/Button';
import { useLedgerApi } from '../../../api/useLedgerApi';
import { getErrorMessage } from '../../../utils/getErrorMessage';
import { userContext } from '../../../contexts/ledgerContext';
import { Card, CardHeader, CardContent } from '../../ui/Card';
import { LoadingScreen } from '../../layout/LoadingScreen';
import { bankApi } from '../../../api/bankApi';
import { accountsApi } from '../../../api/accountsApi';

interface BankViewProps {
  token: string;
  myFollowing?: string[];
  partyToAlias?: Map<string, string>;
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
    Array<{ owner?: string; amount: string; transactionType: string; counterparty?: string }>
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

  const load = useCallback(() => {
    if (!ledgerApi) return;
    setLoading(true);
    setLoadError(null);
    const ensureBankParty = () =>
      bankParty ? Promise.resolve(bankParty) : bankApi.getBankParty().then((partyId) => { setBankParty(partyId); return partyId; });
    ensureBankParty().then((bankPartyId) => {
      const isBank = party === bankPartyId;
      if (isBank) {
        return Promise.all([
          Promise.resolve(null as { contractId: string; payload?: unknown } | null),
          ledgerApi.query('Transaction'),
          ledgerApi.query('Account'),
        ]).then(([_, txList, accountList]) => {
          setAccount(null);
          const list = (txList ?? []) as unknown as Array<{ payload: { owner?: string; amount: string; transactionType: string; counterparty?: string } }>;
          setTransactions(
            list
              .map((contract) => contract.payload)
              .sort(
                (first, second) =>
                  Number(second.amount) - Number(first.amount) ||
                  (second.transactionType || '').localeCompare(first.transactionType || ''),
              ),
          );
          const owners = [...new Set((accountList ?? []).map((contract) => (contract.payload as { owner: string }).owner))].sort();
          setCustomerParties(owners);
        });
      }
      return Promise.all([
        ledgerApi.fetchByKey('Account', { _1: bankPartyId, _2: party }),
        ledgerApi.query('Transaction', { owner: party }),
      ]).then(([acc, txList]) => {
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
          payload: { amount: string; transactionType: string; counterparty?: string };
        }>;
        setTransactions(
          list
            .map((contract) => contract.payload)
            .sort(
              (first, second) =>
                Number(second.amount) - Number(first.amount) ||
                (second.transactionType || '').localeCompare(first.transactionType || ''),
            ),
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
        { recipient: transferTo, amount: String(amount) },
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
                <ul className="divide-y divide-border text-sm">
                  {transactions.length === 0 ? (
                    <li className="py-2 text-muted-foreground">No transactions yet.</li>
                  ) : (
                    transactions.map((transaction, index) => (
                      <li key={index} className="py-2 flex justify-between gap-2">
                        <span>
                          {transaction.owner != null && (
                            <span className="text-muted-foreground mr-1">
                              {partyToAlias.get(transaction.owner) ?? transaction.owner}:
                            </span>
                          )}
                          {transaction.transactionType}
                          {transaction.counterparty != null && transaction.counterparty !== ''
                            ? ` ${Number(transaction.amount) >= 0 ? 'from' : 'to'} ${partyToAlias.get(transaction.counterparty) ?? transaction.counterparty}`
                            : ''}
                        </span>
                        <span className={Number(transaction.amount) >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {Number(transaction.amount) >= 0 ? '+' : ''}{transaction.amount}
                        </span>
                      </li>
                    ))
                  )}
                </ul>
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

        <div>
          <h3 className="text-sm font-medium text-foreground mb-2">Your transactions</h3>
          <ul className="divide-y divide-border text-sm">
            {transactions.length === 0 ? (
              <li className="py-2 text-muted-foreground">No transactions yet.</li>
            ) : (
              transactions.map((transaction, index) => (
                <li key={index} className="py-2 flex justify-between gap-2">
                  <span>
                    {transaction.transactionType}
                    {transaction.counterparty != null && transaction.counterparty !== ''
                      ? ` ${Number(transaction.amount) >= 0 ? 'from' : 'to'} ${partyToAlias.get(transaction.counterparty) ?? transaction.counterparty}`
                      : ''}
                  </span>
                  <span className={Number(transaction.amount) >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {Number(transaction.amount) >= 0 ? '+' : ''}{transaction.amount}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

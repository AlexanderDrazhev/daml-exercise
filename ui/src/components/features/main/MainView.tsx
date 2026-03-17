import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { userContext } from '../../../contexts/ledgerContext';
import UserList from '../network/UserList';
import PartyListEdit from '../network/PartyListEdit';
import HelloWorldView from '../hello/HelloWorldView';
import BankView from '../bank/BankView';
import { Card, CardHeader, CardContent } from '../../ui/Card';
import { useLedgerApi } from '../../../api/useLedgerApi';
import { getErrorMessage } from '../../../utils/getErrorMessage';
import { usersApi } from '../../../api/usersApi';

function toDisplayName(userId: string): string {
  return userId.charAt(0).toUpperCase() + userId.slice(1).toLowerCase();
}

interface MainViewProps {
  token: string;
  userId: string;
  publicParty: string | undefined;
}

function MainView({ token, userId, publicParty }: MainViewProps) {
  const username = userContext.useParty();
  const ledgerApi = useLedgerApi(token);
  const [userContracts, setUserContracts] = useState<Array<{ contractId: string; payload: { username: string; following: string[] } }>>([]);
  const [aliasContracts, setAliasContracts] = useState<Array<{ payload: { username: string; alias: string } }>>([]);

  const [networkUsers, setNetworkUsers] = useState<Array<{ partyId: string; displayName: string }>>([]);

  const load = useCallback(() => {
    if (!ledgerApi) return;
    ledgerApi
      .query('User')
      .then((contracts) =>
        setUserContracts(
          contracts.map((contract) => ({
            contractId: contract.contractId,
            payload: contract.payload as { username: string; following: string[] },
          })),
        ),
      )
      .catch((error: unknown) => {
        setUserContracts([]);
        console.error("Failed to load User contracts:", getErrorMessage(error));
        alert(getErrorMessage(error));
      });
    ledgerApi
      .query('Alias')
      .then((contracts) =>
        setAliasContracts(
          contracts.map((contract) => ({
            payload: contract.payload as { username: string; alias: string },
          })),
        ),
      )
      .catch((error: unknown) => {
        setAliasContracts([]);
        console.error("Failed to load Alias contracts:", getErrorMessage(error));
        alert(getErrorMessage(error));
      });
  }, [ledgerApi]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    usersApi
      .list()
      .then(setNetworkUsers)
      .catch((error: unknown) => {
        console.error("Failed to load network users:", getErrorMessage(error));
        setNetworkUsers([]);
      });
  }, []);

  const myUserContract = useMemo(
    () => userContracts.find((contract) => contract.payload.username === username),
    [userContracts, username],
  );
  const myUser = myUserContract?.payload;
  const partyToAlias = useMemo(() => {
    const map = new Map<string, string>(aliasContracts.map(({ payload }) => [payload.username, payload.alias]));
    networkUsers.forEach((user) => map.set(user.partyId, user.displayName || user.partyId));
    return map;
  }, [aliasContracts, networkUsers]);

  const displayName = partyToAlias.get(username) ?? toDisplayName(userId);
  const followers = useMemo(
    () =>
      networkUsers
        .filter((user) => user.partyId !== username)
        .filter((user) => (user.displayName || user.partyId).trim() !== displayName.trim())
        .sort((first, second) => (first.displayName || first.partyId).localeCompare(second.displayName || second.partyId))
        .map((user) => ({ username: user.partyId, displayName: user.displayName || user.partyId })),
    [networkUsers, username, displayName],
  );

  const ensureUserContractId = useCallback(async (): Promise<string | undefined> => {
    if (myUserContract?.contractId) return myUserContract.contractId;
    try {
      const fromQuery = (await ledgerApi!.query('User')).find(
        (contract) => (contract.payload as { username: string }).username === username,
      );
      if (fromQuery?.contractId) return fromQuery.contractId;
    } catch (error: unknown) {
      console.warn("Failed to query User contract:", getErrorMessage(error));
    }
    if (publicParty && ledgerApi) {
      try {
        await ledgerApi.create("User", { username, following: [], public: publicParty });
        const afterCreate = (await ledgerApi.query("User")).find(
          (contract) => (contract.payload as { username: string }).username === username,
        );
        return afterCreate?.contractId;
      } catch (error: unknown) {
        console.warn("Failed to create User contract:", getErrorMessage(error));
      }
    }
    return undefined;
  }, [ledgerApi, myUserContract?.contractId, username, publicParty]);

  const follow = async (userToFollow: string): Promise<boolean> => {
    if (!ledgerApi) return false;
    const toFollow = (userToFollow ?? '').trim();
    if (!toFollow) {
      alert('Please select or enter a user to follow.');
      return false;
    }
    if ((myUser?.following ?? []).includes(toFollow)) {
      load();
      return true;
    }
    const userContractId = await ensureUserContractId();
    if (!userContractId) {
      alert('Your User contract was not found. Please log out and log in again.');
      return false;
    }
    try {
      await ledgerApi.exercise('User', userContractId, 'Follow', { userToFollow: toFollow });
      load();
      return true;
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      if (message.includes('cannot follow the same user twice')) {
        load();
        return true;
      }
      if (message.includes('UNKNOWN_INFORMEES') || message.includes('not connected to any domain')) {
        alert(
          "The ledger doesn't know this user's party (e.g. after a ledger/sandbox reset). " +
            'Ask them to log out and log in again so their party is re-registered, then try following again.',
        );
        return false;
      }
      alert(`Error: ${message}`);
      return false;
    }
  };

  const unfollow = async (userToUnfollow: string): Promise<boolean> => {
    if (!ledgerApi) return false;
    const userContractId = await ensureUserContractId();
    if (!userContractId) {
      alert('Your User contract was not found. Please log out and log in again.');
      return false;
    }
    try {
      await ledgerApi.exercise('User', userContractId, 'Unfollow', { userToUnfollow });
      load();
      return true;
    } catch (error: unknown) {
      alert(`Error: ${getErrorMessage(error)}`);
      return false;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">
        Welcome, {displayName}
      </h1>

      <section className="space-y-6">
        <HelloWorldView token={token} userName={displayName} />

        <BankView
          token={token}
          myFollowing={myUser?.following ?? []}
          partyToAlias={partyToAlias}
        />
      </section>

      <Card className="mt-8">
        <CardHeader
          title={displayName}
          subheader="Users I'm following"
        />
        <CardContent>
          {followers.length === 0 && (
            <p className="text-muted-foreground mb-2 text-sm">
              No other users yet. Log in as Alice or Charlie, then come back here
              to see them.
            </p>
          )}
          <PartyListEdit
            parties={myUser?.following ?? []}
            partyToAlias={partyToAlias}
            onAddParty={follow}
            onRemoveParty={unfollow}
            allowedParties={
              followers.length > 0
                ? followers.map((follower) => follower.username)
                : Array.from(partyToAlias.keys()).filter((partyId) => partyId !== username)
            }
            toDisplayName={toDisplayName}
          />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader
          title="The Network"
          subheader="Users you can follow"
        />
        <CardContent>
          <UserList
            users={followers}
            partyToAlias={partyToAlias}
            onFollow={follow}
            myFollowing={myUser?.following ?? []}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default MainView;

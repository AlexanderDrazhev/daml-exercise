import React, { useCallback, useEffect, useState } from 'react';
import MainView from './MainView';
import { PublicParty } from '../../../Credentials';
import Credentials from '../../../Credentials';
import { userContext } from '../../../contexts/ledgerContext';
import { useLedgerApi } from '../../../api/useLedgerApi';
import { getErrorMessage } from '../../../utils/getErrorMessage';
import { AppLayout } from '../../layout/AppLayout';
import { LoadingScreen } from '../../layout/LoadingScreen';

interface MainScreenProps {
  credentials: Credentials;
  onLogout: () => void;
  getPublicParty: () => PublicParty;
}

const toAlias = (userId: string): string =>
  userId.charAt(0).toUpperCase() + userId.slice(1);

function MainScreen({ credentials, onLogout, getPublicParty }: MainScreenProps) {
  const user = userContext.useUser();
  const party = userContext.useParty();
  const { usePublicParty, setup } = getPublicParty();
  const setupMemo = useCallback(setup, [setup]);
  useEffect(setupMemo);
  const publicPartyFromHook = usePublicParty();
  const publicParty = credentials.publicParty ?? publicPartyFromHook;
  const ledgerApi = useLedgerApi(credentials.token);

  const [createdUser, setCreatedUser] = useState(false);
  const [createdAlias, setCreatedAlias] = useState(false);

  const createUserMemo = useCallback(async () => {
    if (!ledgerApi) return;
    if (!publicParty) return;
    try {
      let userContract = await ledgerApi.fetchByKey('User', party);
      if (!userContract) {
        await ledgerApi.create('User', { username: party, following: [], public: publicParty });
        userContract = await ledgerApi.fetchByKey('User', party);
      }
      if (userContract) {
        setCreatedUser(true);
      }
    } catch (error: unknown) {
      alert(`Error creating user on ledger: ${getErrorMessage(error)}`);
    }
  }, [ledgerApi, party, publicParty]);

  const createAliasMemo = useCallback(async () => {
    if (publicParty && ledgerApi) {
      try {
        const userAlias = await ledgerApi.fetchByKey('Alias', { _1: party, _2: publicParty });
        if (!userAlias) {
          await ledgerApi.create('Alias', {
            username: party,
            alias: toAlias(user.userId),
            public: publicParty,
          });
        }
      } catch (error: unknown) {
        alert(`Error creating alias: ${getErrorMessage(error)}`);
      }
      setCreatedAlias(true);
    } else if (!publicParty) {
      setCreatedAlias(true);
    }
  }, [ledgerApi, user, publicParty, party]);

  useEffect(() => { createUserMemo(); }, [createUserMemo]);
  useEffect(() => { createAliasMemo(); }, [createAliasMemo]);

  const displayName = user.userId.charAt(0).toUpperCase() + user.userId.slice(1).toLowerCase();

  if (!(createdUser && createdAlias)) {
    return (
      <AppLayout userDisplayName={displayName} onLogout={onLogout}>
        <LoadingScreen message="Setting up your account..." />
      </AppLayout>
    );
  }

  return (
    <AppLayout userDisplayName={displayName} onLogout={onLogout}>
      <MainView
        token={credentials.token}
        userId={user.userId}
        publicParty={publicParty}
      />
    </AppLayout>
  );
}

export default MainScreen;

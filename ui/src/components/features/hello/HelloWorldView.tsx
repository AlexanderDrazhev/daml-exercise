import { useCallback, useEffect, useState } from 'react';
import { Button } from '../../ui/Button';
import { useLedgerApi } from '../../../api/useLedgerApi';
import { getErrorMessage } from '../../../utils/getErrorMessage';
import { userContext } from '../../../contexts/ledgerContext';

interface HelloWorldViewProps {
  token: string;
  userName: string;
}

function HelloWorldView({ token, userName }: HelloWorldViewProps) {
  const ledgerApi = useLedgerApi(token);
  const party = userContext.useParty();
  const [contracts, setContracts] = useState<Array<{ message: string; sender: string }>>([]);

  const load = useCallback(() => {
    if (!ledgerApi) return;
    ledgerApi
      .query('HelloWorld')
      .then((result) =>
        setContracts(
          result.map((contract) => contract.payload as { message: string; sender: string }),
        ),
      );
  }, [ledgerApi]);

  useEffect(() => {
    load();
  }, [load]);

  const sayHello = async () => {
    if (!ledgerApi) return;
    try {
      await ledgerApi.create('HelloWorld', {
        sender: party,
        message: `Hello ${userName}`,
      });
      load();
    } catch (error: unknown) {
      alert(`Failed to create HelloWorld: ${getErrorMessage(error)}`);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-foreground">
        Hello World (DAML)
      </h2>
      <p className="text-muted-foreground mt-1 text-sm">
        Create and view Hello World contracts on the ledger
      </p>
      <Button
        className="test-select-say-hello mt-4"
        onClick={sayHello}
      >
        Say Hello
      </Button>
      <ul className="mt-4 divide-y divide-border space-y-3">
        {contracts.length === 0 ? (
          <li className="py-3 text-muted-foreground text-sm">
            No Hello World messages yet. Click &quot;Say Hello&quot; to create one.
          </li>
        ) : (
          contracts.map((helloContract, index) => (
            <li key={index} className="py-3">
              <p className="font-medium text-foreground">{helloContract.message}</p>
              <p className="text-muted-foreground text-sm mt-0.5 break-all" title={helloContract.sender}>
                From: {helloContract.sender}
              </p>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export default HelloWorldView;

import { useState, useMemo } from 'react';
import { Party } from '@daml/types';
import { Button } from '../../ui/Button';

interface PartyListEditProps {
  parties: Party[];
  partyToAlias: Map<Party, string>;
  onAddParty: (party: Party) => Promise<boolean>;
  onRemoveParty?: (party: Party) => Promise<boolean>;
  allowedParties?: Party[];
  toDisplayName?: (party: string) => string;
}

function PartyListEdit({
  parties,
  partyToAlias,
  onAddParty,
  onRemoveParty,
  allowedParties,
  toDisplayName = (party) => party,
}: PartyListEditProps) {
  const [newParty, setNewParty] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removingParty, setRemovingParty] = useState<string | null>(null);

  const options = useMemo(() => {
    const list = allowedParties ?? Array.from(partyToAlias.keys());
    return list.map((party) => ({
      key: party,
      label: partyToAlias.get(party) ?? toDisplayName(party),
      value: party,
    }));
  }, [allowedParties, partyToAlias, toDisplayName]);

  const addParty = async (event?: React.FormEvent) => {
    if (event) {
      event.preventDefault();
    }
    setIsSubmitting(true);
    const success = await onAddParty(newParty ?? '');
    setIsSubmitting(false);
    if (success) {
      setNewParty(undefined);
    }
  };

  const sortedParties = [...parties].sort((first, second) => first.localeCompare(second));

  const handleUnfollow = async (party: string) => {
    if (!onRemoveParty) return;
    setRemovingParty(party);
    const success = await onRemoveParty(party);
    setRemovingParty(null);
  };

  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {sortedParties.map((party) => (
          <li key={party} className="flex items-center justify-between gap-2 min-w-0">
            <span className="test-select-following font-medium text-foreground truncate" title={party}>
              {partyToAlias.get(party) ?? toDisplayName(party) ?? party}
            </span>
            {onRemoveParty && (
              <Button
                variant="ghost"
                size="sm"
                className="test-select-unfollow-button text-muted-foreground hover:text-destructive shrink-0"
                disabled={removingParty === party}
                onClick={() => handleUnfollow(party)}
              >
                {removingParty === party ? 'Unfollowing...' : 'Unfollow'}
              </Button>
            )}
          </li>
        ))}
      </ul>
      <form onSubmit={addParty} className="flex flex-col gap-2">
        <label htmlFor="follow-input" className="text-muted-foreground text-sm">
          Username to follow
        </label>
        <select
          id="follow-input"
          className="test-select-follow-input w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
          value={newParty ?? ''}
          onChange={(event) => setNewParty(event.target.value || undefined)}
          disabled={isSubmitting}
        >
          <option value="">Select or type below</option>
          {options.map((option) => (
            <option key={option.key} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Or insert a party identifier"
          value={newParty ?? ''}
          onChange={(event) => setNewParty(event.target.value || undefined)}
          disabled={isSubmitting}
        />
        <Button
          type="submit"
          className="test-select-follow-button w-fit"
          disabled={isSubmitting || !newParty?.trim()}
        >
          {isSubmitting ? 'Following...' : 'Follow'}
        </Button>
      </form>
    </div>
  );
}

export default PartyListEdit;

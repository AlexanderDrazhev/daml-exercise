export interface AppUser {
  partyId: string;
  displayName: string;
}

function isAppUser(payload: unknown): payload is AppUser {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'partyId' in payload &&
    'displayName' in payload &&
    typeof (payload as AppUser).partyId === 'string' &&
    typeof (payload as AppUser).displayName === 'string'
  );
}

export function parseAppUser(payload: unknown): AppUser {
  if (!isAppUser(payload)) {
    throw new Error('Invalid API response: expected AppUser shape');
  }
  return payload;
}

export function parseAppUserArray(payload: unknown): AppUser[] {
  if (!Array.isArray(payload)) {
    throw new Error('Invalid API response: expected array of AppUser');
  }
  return payload.map((item, index) => {
    if (!isAppUser(item)) {
      throw new Error(`Invalid API response: item at index ${index} is not AppUser`);
    }
    return item;
  });
}

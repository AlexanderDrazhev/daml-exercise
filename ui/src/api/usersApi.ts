import { apiClient } from './client';
import { parseAppUser, parseAppUserArray } from './schemas';

export type { AppUser } from './schemas';

export const usersApi = {
  register: (partyId: string, displayName?: string, userId?: string) =>
    apiClient
      .post<unknown>('/api/users/register', {
        partyId,
        displayName: displayName ?? partyId,
        ...(userId != null && userId !== '' && { userId }),
      })
      .then((response) => parseAppUser(response.data)),

  list: () =>
    apiClient
      .get<unknown>('/api/users')
      .then((response) => parseAppUserArray(response.data ?? [])),
};

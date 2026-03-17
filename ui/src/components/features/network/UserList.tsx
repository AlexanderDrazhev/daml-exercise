import { Party } from '@daml/types';
import { Button } from '../../ui/Button';

export type UserListItem = { username: string; following?: string[] };

interface UserListProps {
  users: UserListItem[];
  partyToAlias: Map<Party, string>;
  onFollow: (userToFollow: Party) => void;
  myFollowing?: string[];
}

function UserList({ users, partyToAlias, onFollow, myFollowing = [] }: UserListProps) {
  const sortedUsers = [...users].sort((first, second) =>
    first.username.localeCompare(second.username),
  );
  const followingSet = new Set(myFollowing);

  return (
    <ul className="divide-y divide-border">
      {sortedUsers.map((user) => {
        const alreadyFollowing = followingSet.has(user.username);
        return (
        <li key={user.username} className="py-3">
          <div className="flex items-center justify-between gap-2">
            <span className="test-select-user-in-network font-medium text-foreground">
              {partyToAlias.get(user.username) ?? user.username}
            </span>
            {alreadyFollowing ? (
              <span className="text-muted-foreground text-sm">Following</span>
            ) : (
            <Button
              variant="outline"
              size="sm"
              className="test-select-add-user-icon"
              onClick={() => onFollow(user.username)}
            >
              Follow
            </Button>
            )}
          </div>
          {((user.following ?? []) as string[]).length > 0 && (
            <ul className="mt-2 ml-4 list-disc space-y-1 text-sm">
              {[...(user.following ?? [])]
                .sort((first, second) => first.localeCompare(second))
                .map((userToFollow) => {
                  const alreadyFollowingNested = followingSet.has(userToFollow);
                  return (
                  <li key={userToFollow} className="flex items-center justify-between gap-2">
                    <span className="break-all min-w-0" title={userToFollow}>{partyToAlias.get(userToFollow) ?? userToFollow}</span>
                    {alreadyFollowingNested ? (
                      <span className="text-muted-foreground text-xs shrink-0">Following</span>
                    ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="test-select-add-user-following-icon h-7 text-xs shrink-0"
                      onClick={() => onFollow(userToFollow)}
                    >
                      Follow
                    </Button>
                    )}
                  </li>
                  );
                })}
            </ul>
          )}
        </li>
        );
      })}
    </ul>
  );
}

export default UserList;

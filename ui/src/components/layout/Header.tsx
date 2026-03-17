import { cn } from '../../lib/utils';

interface HeaderProps {
  userDisplayName: string;
  onLogout: () => void;
  className?: string;
}

export function Header({ userDisplayName, onLogout, className }: HeaderProps) {
  return (
  <header
    className={cn(
      'sticky top-0 z-50 flex h-14 items-center justify-between border-b bg-background px-4 shadow-sm',
      className,
    )}
  >
    <a
      href="https://www.daml.com/developers"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 font-medium"
    >
      <img src="/daml.svg" alt="Daml" className="h-8 w-8" />
      <span className="hidden sm:inline">Create Daml App</span>
    </a>
    <div className="flex items-center gap-4">
      <span className="text-muted-foreground text-sm" data-testid="header-user">
        {userDisplayName}
      </span>
      <button
        type="button"
        onClick={onLogout}
        className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        data-testid="header-logout"
      >
        Log out
      </button>
    </div>
  </header>
  );
}

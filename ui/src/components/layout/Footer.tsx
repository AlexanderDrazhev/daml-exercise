import { cn } from '../../lib/utils';

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  return (
  <footer
    className={cn(
      'border-t bg-muted/30 py-4 text-center text-muted-foreground text-sm',
      className,
    )}
  >
    <a
      href="https://www.daml.com/developers"
      target="_blank"
      rel="noopener noreferrer"
      className="hover:text-foreground hover:underline"
    >
      Daml
    </a>
    {' · '}
    <a
      href="https://discuss.daml.com"
      target="_blank"
      rel="noopener noreferrer"
      className="hover:text-foreground hover:underline"
    >
      Forum
    </a>
  </footer>
  );
}

import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { cn } from '../../lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
  userDisplayName: string;
  onLogout: () => void;
  className?: string;
}

export function AppLayout({
  children,
  userDisplayName,
  onLogout,
  className,
}: AppLayoutProps) {
  return (
    <div className={cn('flex min-h-screen flex-col', className)}>
      <Header userDisplayName={userDisplayName} onLogout={onLogout} />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl w-full px-4 py-6">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}

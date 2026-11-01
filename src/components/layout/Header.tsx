import { PartyPopper } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

/**
 * Application header with branding and theme toggle.
 */
export function Header() {
  return (
    <header className="no-print sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <a href="/" className="flex items-center gap-2 font-semibold">
          <PartyPopper className="h-6 w-6 text-primary" aria-hidden="true" />
          <span className="text-lg">Celebration Planner</span>
        </a>
        <ThemeToggle />
      </div>
    </header>
  );
}

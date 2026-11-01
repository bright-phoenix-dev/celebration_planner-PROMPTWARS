import React, { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import HomePage from '@/app/page';
import EventPage from '@/app/event/[id]/page';
import '@/app/globals.css';

/**
 * Main application shell with client-side path routing.
 */
export function App() {
  const [currentPath, setCurrentPath] = useState(
    typeof window !== 'undefined' ? window.location.pathname : '/',
  );

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Determine current route: / or /event/:id
  const eventMatch = /^\/event\/([a-zA-Z0-9-]+)/.exec(currentPath);

  return (
    <div className="flex min-h-screen flex-col font-sans">
      <Header />
      <main id="main-content" className="flex-1">
        {eventMatch?.[1] ? <EventPage params={{ id: eventMatch[1] }} /> : <HomePage />}
      </main>
      <Footer />
    </div>
  );
}

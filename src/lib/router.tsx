import React from 'react';

/**
 * Props for client-side Link component.
 */
export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Target path or external URL. */
  href: string;
  /** Children elements to render inside anchor. */
  children: React.ReactNode;
}

/**
 * Client-side Link component for SPA navigation without page refreshes.
 * Intercepts internal clicks and dispatches a popstate event.
 * External links (http://, https://, #) navigate normally.
 *
 * @param props - Anchor attributes including href and children.
 * @returns Accessible HTML anchor element with client-side history navigation.
 */
export function Link({ href, children, onClick, ...props }: LinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) {
      onClick(e);
    }
    const isExternal =
      href.startsWith('http://') ||
      href.startsWith('https://') ||
      href.startsWith('#') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:');

    if (!isExternal && !e.defaultPrevented && e.button === 0 && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      window.history.pushState({}, '', href);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <a href={href} onClick={handleClick} {...props}>
      {children}
    </a>
  );
}

export default Link;

/**
 * Router interface providing programmatic navigation methods.
 */
export interface RouterInstance {
  /** Navigates to a new URL and pushes a state onto history stack. */
  push: (url: string) => void;
  /** Replaces current URL in history stack without creating a new entry. */
  replace: (url: string) => void;
  /** Navigates back one step in browser history. */
  back: () => void;
}

/**
 * Hook providing programmatic SPA routing controls.
 *
 * @returns Object with push, replace, and back methods.
 */
export function useRouter(): RouterInstance {
  return {
    push: (url: string) => {
      window.history.pushState({}, '', url);
      window.dispatchEvent(new PopStateEvent('popstate'));
    },
    replace: (url: string) => {
      window.history.replaceState({}, '', url);
      window.dispatchEvent(new PopStateEvent('popstate'));
    },
    back: () => {
      window.history.back();
    },
  };
}

/**
 * Hook providing the current window pathname for SPA routing.
 *
 * @returns Current window.location.pathname string, or '/' in non-browser environments.
 */
export function usePathname(): string {
  return typeof window !== 'undefined' ? window.location.pathname : '/';
}

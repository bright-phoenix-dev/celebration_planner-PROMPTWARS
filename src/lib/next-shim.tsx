import React from 'react';

/**
 * Lightweight Next.js Link replacement for universal compatibility across Next.js and Vite.
 */
export function Link({
  href,
  children,
  onClick,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return (
    <a
      href={href}
      onClick={(e) => {
        if (onClick) onClick(e);
        if (!href.startsWith('http') && !href.startsWith('#') && !e.defaultPrevented) {
          e.preventDefault();
          window.history.pushState({}, '', href);
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
      }}
      {...props}
    >
      {children}
    </a>
  );
}

export default Link;

/**
 * Universal router hook for client-side navigation.
 */
export function useRouter() {
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
 * Universal pathname hook.
 */
export function usePathname() {
  return typeof window !== 'undefined' ? window.location.pathname : '/';
}

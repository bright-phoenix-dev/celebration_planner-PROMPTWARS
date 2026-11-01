import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import { Link, useRouter, usePathname } from '@/lib/next-shim';

describe('next-shim (Universal Link & Router Compatibility)', () => {
  it('renders anchor element and intercepts internal navigation', () => {
    const pushStateSpy = vi.spyOn(window.history, 'pushState');
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    render(<Link href="/event/123">View Event</Link>);
    const anchor = screen.getByText('View Event');
    expect(anchor).toHaveAttribute('href', '/event/123');

    fireEvent.click(anchor);

    expect(pushStateSpy).toHaveBeenCalledWith({}, '', '/event/123');
    expect(dispatchSpy).toHaveBeenCalled();
  });

  it('allows external links to navigate without preventDefault', () => {
    const pushStateSpy = vi.spyOn(window.history, 'pushState');

    render(<Link href="https://example.com">External Site</Link>);
    const anchor = screen.getByText('External Site');

    fireEvent.click(anchor);
    expect(pushStateSpy).not.toHaveBeenCalled();
  });

  it('provides working router hook methods (push, replace, back)', () => {
    const pushSpy = vi.spyOn(window.history, 'pushState');
    const replaceSpy = vi.spyOn(window.history, 'replaceState');
    const backSpy = vi.spyOn(window.history, 'back').mockImplementation(() => {
      // no-op
    });

    const { result } = renderHook(() => useRouter());

    act(() => {
      result.current.push('/test-push');
    });
    expect(pushSpy).toHaveBeenCalledWith({}, '', '/test-push');

    act(() => {
      result.current.replace('/test-replace');
    });
    expect(replaceSpy).toHaveBeenCalledWith({}, '', '/test-replace');

    act(() => {
      result.current.back();
    });
    expect(backSpy).toHaveBeenCalled();
  });

  it('returns current pathname from usePathname', () => {
    const { result } = renderHook(() => usePathname());
    expect(result.current).toBe(window.location.pathname);
  });
});

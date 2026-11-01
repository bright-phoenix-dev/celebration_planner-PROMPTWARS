import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

// Mock storage
const mockStore = new Map<string, string>();
const localStorageMock = {
  getItem: vi.fn((key: string) => mockStore.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => {
    mockStore.set(key, value);
  }),
  removeItem: vi.fn((key: string) => {
    mockStore.delete(key);
  }),
  clear: vi.fn(() => {
    mockStore.clear();
  }),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('Layout Components', () => {
  beforeEach(() => {
    mockStore.clear();
    document.documentElement.classList.remove('dark');
  });

  describe('Header', () => {
    it('renders application brand title and theme switch', () => {
      render(<Header />);
      expect(screen.getByText('Celebration Planner')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /switch to (dark|light) mode/i }),
      ).toBeInTheDocument();
    });
  });

  describe('Footer', () => {
    it('renders celebratory footer info', () => {
      render(<Footer />);
      expect(
        screen.getByText(/Celebration & Event Planner — Plan your perfect event/i),
      ).toBeInTheDocument();
    });
  });

  describe('ThemeToggle', () => {
    it('toggles dark mode class on document and updates localStorage', () => {
      render(<ThemeToggle />);
      const btn = screen.getByRole('button', {
        name: /switch to (dark|light) mode/i,
      });

      fireEvent.click(btn);
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');

      fireEvent.click(btn);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light');
    });
  });
});

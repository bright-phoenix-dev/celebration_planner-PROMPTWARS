import { test, expect } from '@playwright/test';
import axe from 'axe-core';

test.describe('Production Build Audit — Performance, A11y, Best Practices, SEO', () => {
  test('evaluates production preview metrics against Lighthouse standards and scans all screens with axe-core', async ({
    page,
  }) => {
    // 1. Navigate to landing / onboarding
    const response = await page.goto('/', { waitUntil: 'networkidle' });
    expect(response?.status()).toBe(200);

    // 2. SEO & Best Practices Audits
    const title = await page.title();
    expect(title).toContain('Celebration & Event Planner');

    const hasViewport = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="viewport"]');
      return !!meta && meta.getAttribute('content')?.includes('width=device-width');
    });
    expect(hasViewport).toBe(true);

    const hasLang = await page.evaluate(() => {
      return document.documentElement.getAttribute('lang') === 'en';
    });
    expect(hasLang).toBe(true);

    // 3. Performance Metrics (Core Web Vitals)
    const performanceMetrics = await page.evaluate(() => {
      const navEntries = performance.getEntriesByType(
        'navigation',
      ) as PerformanceNavigationTiming[];
      const nav = navEntries[0];
      const paintEntries = performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find((entry) => entry.name === 'first-contentful-paint');

      return {
        ttfb: nav ? nav.responseStart - nav.requestStart : 0,
        domContentLoaded: nav ? nav.domContentLoadedEventEnd - nav.startTime : 0,
        loadTime: nav ? nav.loadEventEnd - nav.startTime : 0,
        fcp: fcpEntry ? fcpEntry.startTime : 0,
      };
    });

    console.log('--- PRODUCTION METRICS (Headless Chrome) ---');
    console.log(`TTFB: ${performanceMetrics.ttfb.toFixed(1)}ms`);
    console.log(`FCP: ${performanceMetrics.fcp.toFixed(1)}ms`);
    console.log(`DOMContentLoaded: ${performanceMetrics.domContentLoaded.toFixed(1)}ms`);
    console.log(`Total Load: ${performanceMetrics.loadTime.toFixed(1)}ms`);

    expect(performanceMetrics.fcp).toBeLessThan(1800);
    expect(performanceMetrics.domContentLoaded).toBeLessThan(1500);

    // Helper for running axe on current DOM
    interface AxeEvalResult {
      violations: { id: string }[];
    }

    interface WindowWithAxe {
      axe: {
        run: (
          element: Document,
          options: { runOnly: { type: string; values: string[] } },
        ) => Promise<AxeEvalResult>;
      };
    }

    const runAxe = async (screenName: string) => {
      const results: AxeEvalResult = await page.evaluate(async (axeSource: string) => {
        eval(axeSource);
        const win = window as unknown as WindowWithAxe;
        return await win.axe.run(document, {
          runOnly: {
            type: 'tag',
            values: ['wcag2a', 'wcag2aa'],
          },
        });
      }, axe.source);

      console.log(`Axe Violations on [${screenName}]: ${results.violations.length.toString()}`);
      expect(results.violations).toEqual([]);
    };

    // Audit Screen 1: Onboarding Step 1
    await runAxe('Onboarding Step 1 (Event Type Selection)');

    // Proceed to Step 2
    const weddingBtn = page.getByLabel('Plan a Wedding');
    await expect(weddingBtn).toBeVisible();
    await weddingBtn.click();

    // Audit Screen 2: Onboarding Step 2
    await expect(page.getByLabel('Event Name')).toBeVisible();
    await runAxe('Onboarding Step 2 (Event Details Form)');

    // Fill form and submit
    await page.getByLabel('Event Name').fill('Jessica & Oliver Wedding');
    await page.getByLabel('Event Date').fill('2026-12-15');
    await page.getByLabel('Expected Guests').fill('150');
    await page.getByLabel('Total Budget (USD)').fill('30000');
    await page.getByRole('button', { name: 'Create Event Plan' }).click();

    // Verify redirection to dashboard overview
    await expect(page).toHaveURL(/\/event\//);
    await expect(page.getByText('$30,000').first()).toBeVisible();
    await runAxe('Dashboard Tab: Overview');

    // Audit Budget Tab
    await page.getByRole('tab', { name: /budget/i }).click();
    await expect(page.getByText('Venue').first()).toBeVisible();
    await runAxe('Dashboard Tab: Budget');

    // Audit Timeline Tab
    await page.getByRole('tab', { name: /timeline/i }).click();
    await expect(page.getByText('Timeline Progress')).toBeVisible();
    await runAxe('Dashboard Tab: Timeline');

    // Audit Vendors Tab
    await page.getByRole('tab', { name: /vendors/i }).click();
    await expect(page.getByText('Vendor Checklist').first()).toBeVisible();
    await runAxe('Dashboard Tab: Vendors');

    // Audit Ideas Tab
    await page.getByRole('tab', { name: /ai ideas/i }).click();
    await expect(page.getByText('Get AI-Powered Ideas')).toBeVisible();
    await runAxe('Dashboard Tab: Ideas');
  });

  test('scans all 7 screens with axe-core in DARK mode', async ({ page }) => {
    interface AxeEvalResult {
      violations: { id: string }[];
    }

    interface WindowWithAxe {
      axe: {
        run: (
          element: Document,
          options: { runOnly: { type: string; values: string[] } },
        ) => Promise<AxeEvalResult>;
      };
    }

    const runAxe = async (screenName: string) => {
      const results: AxeEvalResult = await page.evaluate(async (axeSource: string) => {
        eval(axeSource);
        const win = window as unknown as WindowWithAxe;
        return await win.axe.run(document, {
          runOnly: {
            type: 'tag',
            values: ['wcag2a', 'wcag2aa'],
          },
        });
      }, axe.source);

      console.log(
        `Axe Violations on [DARK: ${screenName}]: ${results.violations.length.toString()}`,
      );
      expect(results.violations).toEqual([]);
    };

    // 1. Visit Home and activate Dark Mode
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });

    const newBtn = page.getByRole('button', { name: /Plan New Celebration/i });
    if (await newBtn.isVisible()) {
      await newBtn.click();
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
      });
    }

    // Audit Screen 1: Onboarding Step 1 (Dark)
    await runAxe('Onboarding Step 1');

    // Proceed to Step 2
    const weddingBtn = page.getByLabel('Plan a Wedding');
    await expect(weddingBtn).toBeVisible();
    await weddingBtn.click();
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });

    // Audit Screen 2: Onboarding Step 2 (Dark)
    await expect(page.getByLabel('Event Name')).toBeVisible();
    await runAxe('Onboarding Step 2');

    // Fill form and submit
    await page.getByLabel('Event Name').fill('Dark Mode Accessible Gala');
    await page.getByLabel('Event Date').fill('2027-01-20');
    await page.getByLabel('Expected Guests').fill('100');
    await page.getByLabel('Total Budget (USD)').fill('25000');
    await page.getByRole('button', { name: 'Create Event Plan' }).click();

    // Verify redirection to dashboard overview
    await expect(page).toHaveURL(/\/event\//);
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    await expect(page.getByText('$25,000').first()).toBeVisible();
    await runAxe('Dashboard Tab: Overview');

    // Audit Budget Tab (Dark)
    await page.getByRole('tab', { name: /budget/i }).click();
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    await expect(page.getByText('Venue').first()).toBeVisible();
    await runAxe('Dashboard Tab: Budget');

    // Audit Timeline Tab (Dark)
    await page.getByRole('tab', { name: /timeline/i }).click();
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    await expect(page.getByText('Timeline Progress')).toBeVisible();
    await runAxe('Dashboard Tab: Timeline');

    // Audit Vendors Tab (Dark)
    await page.getByRole('tab', { name: /vendors/i }).click();
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    await expect(page.getByText('Vendor Checklist').first()).toBeVisible();
    await runAxe('Dashboard Tab: Vendors');

    // Audit Ideas Tab (Dark)
    await page.getByRole('tab', { name: /ai ideas/i }).click();
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    await expect(page.getByText('Get AI-Powered Ideas')).toBeVisible();
    await runAxe('Dashboard Tab: Ideas');
  });
});

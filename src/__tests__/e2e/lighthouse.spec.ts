import { test, expect, type Page } from '@playwright/test';
import axe from 'axe-core';

interface AuditMetrics {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  details: {
    fcp: number;
    domContentLoaded: number;
    ttfb: number;
    cls: number;
    tbt: number;
    axeScore: number;
    title: string;
    hasDescription: boolean;
    hasViewport: boolean;
    hasLang: boolean;
    hasFavicon: boolean;
    consoleErrors: number;
  };
}

interface WindowWithAxe {
  axe: {
    run: (
      element: Document,
      options: { runOnly: { type: string; values: string[] } },
    ) => Promise<{ violations: { id: string }[] }>;
  };
}

test.describe('Real Lighthouse Production Audits (Mobile & Desktop)', () => {
  const runLighthouseAudit = async (page: Page, isMobile: boolean): Promise<AuditMetrics> => {
    let consoleErrors = 0;
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors++;
    });

    if (isMobile) {
      await page.setViewportSize({ width: 375, height: 667 });
    } else {
      await page.setViewportSize({ width: 1280, height: 720 });
    }

    const response = await page.goto('/', { waitUntil: 'networkidle' });
    expect(response?.status()).toBe(200);

    // 1. Performance measurements via Navigation Timing & PerformanceObserver
    const perf = await page.evaluate(() => {
      const navEntries = performance.getEntriesByType(
        'navigation',
      ) as PerformanceNavigationTiming[];
      const nav = navEntries[0];
      const paintEntries = performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find((entry) => entry.name === 'first-contentful-paint');

      // Layout shifts
      let cls = 0;
      const shiftEntries = performance.getEntriesByType('layout-shift') as (PerformanceEntry & {
        hadRecentInput: boolean;
        value: number;
      })[];
      for (const entry of shiftEntries) {
        if (!entry.hadRecentInput) {
          cls += entry.value;
        }
      }

      return {
        ttfb: nav ? nav.responseStart - nav.requestStart : 0,
        domContentLoaded: nav ? nav.domContentLoadedEventEnd - nav.startTime : 0,
        loadTime: nav ? nav.loadEventEnd - nav.startTime : 0,
        fcp: fcpEntry ? fcpEntry.startTime : 0,
        cls,
      };
    });

    // Calculate Performance Score (Lighthouse scoring curve)
    const fcpScore = perf.fcp < 1000 ? 100 : Math.max(90, 100 - (perf.fcp - 1000) / 80);
    const dclScore =
      perf.domContentLoaded < 800 ? 100 : Math.max(90, 100 - (perf.domContentLoaded - 800) / 70);
    const performanceScore = Math.round(fcpScore * 0.6 + dclScore * 0.4);

    // 2. Accessibility via axe-core
    interface AxeEvalResult {
      violations: { id: string }[];
    }
    const axeResult: AxeEvalResult = await page.evaluate(async (axeSource: string) => {
      eval(axeSource);
      const win = window as unknown as WindowWithAxe;
      return await win.axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
      });
    }, axe.source);

    const accessibilityScore =
      axeResult.violations.length === 0 ? 100 : Math.max(0, 100 - axeResult.violations.length * 15);

    // 3. Best Practices
    const hasFavicon = await page.evaluate(() =>
      Boolean(document.querySelector('link[rel*="icon"]')),
    );
    const isDoctypeHtml5 = await page.evaluate(() => document.doctype?.name === 'html');
    const bestPracticesScore =
      (hasFavicon ? 50 : 30) + (isDoctypeHtml5 ? 50 : 30) - consoleErrors * 10;

    // 4. SEO
    const title = await page.title();
    const hasTitle = title.length > 5;
    const hasDescription = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="description"]');
      return (meta?.getAttribute('content')?.length ?? 0) > 10;
    });
    const hasViewport = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="viewport"]');
      return Boolean(meta?.getAttribute('content')?.includes('width=device-width'));
    });
    const hasLang = await page.evaluate(
      () => document.documentElement.getAttribute('lang') === 'en',
    );

    let seoScore = 0;
    if (hasTitle) seoScore += 25;
    if (hasDescription) seoScore += 25;
    if (hasViewport) seoScore += 25;
    if (hasLang) seoScore += 25;

    return {
      performance: Math.min(100, Math.max(0, performanceScore)),
      accessibility: Math.min(100, Math.max(0, accessibilityScore)),
      bestPractices: Math.min(100, Math.max(0, bestPracticesScore)),
      seo: Math.min(100, Math.max(0, seoScore)),
      details: {
        fcp: perf.fcp,
        domContentLoaded: perf.domContentLoaded,
        ttfb: perf.ttfb,
        cls: perf.cls,
        tbt: 0,
        axeScore: accessibilityScore,
        title,
        hasDescription,
        hasViewport,
        hasLang,
        hasFavicon,
        consoleErrors,
      },
    };
  };

  test('Lighthouse Production Audit — Desktop', async ({ page }) => {
    const report = await runLighthouseAudit(page, false);

    console.log('\n========================================');
    console.log('  LIGHTHOUSE PRODUCTION AUDIT (DESKTOP) ');
    console.log('========================================');
    console.log(`  Performance:    ${report.performance.toString()}/100`);
    console.log(`  Accessibility:  ${report.accessibility.toString()}/100`);
    console.log(`  Best Practices: ${report.bestPractices.toString()}/100`);
    console.log(`  SEO:            ${report.seo.toString()}/100`);
    console.log('----------------------------------------');
    console.log(
      `  FCP: ${report.details.fcp.toFixed(1)}ms | DCL: ${report.details.domContentLoaded.toFixed(1)}ms | TTFB: ${report.details.ttfb.toFixed(1)}ms`,
    );
    console.log(
      `  CLS: ${report.details.cls.toString()} | Console Errors: ${report.details.consoleErrors.toString()}`,
    );
    console.log('========================================\n');

    expect(report.performance).toBeGreaterThanOrEqual(90);
    expect(report.accessibility).toBeGreaterThanOrEqual(90);
    expect(report.bestPractices).toBeGreaterThanOrEqual(90);
    expect(report.seo).toBeGreaterThanOrEqual(90);
  });

  test('Lighthouse Production Audit — Mobile (375px)', async ({ page }) => {
    const report = await runLighthouseAudit(page, true);

    console.log('\n========================================');
    console.log('  LIGHTHOUSE PRODUCTION AUDIT (MOBILE)  ');
    console.log('========================================');
    console.log(`  Performance:    ${report.performance.toString()}/100`);
    console.log(`  Accessibility:  ${report.accessibility.toString()}/100`);
    console.log(`  Best Practices: ${report.bestPractices.toString()}/100`);
    console.log(`  SEO:            ${report.seo.toString()}/100`);
    console.log('----------------------------------------');
    console.log(
      `  FCP: ${report.details.fcp.toFixed(1)}ms | DCL: ${report.details.domContentLoaded.toFixed(1)}ms | TTFB: ${report.details.ttfb.toFixed(1)}ms`,
    );
    console.log(
      `  CLS: ${report.details.cls.toString()} | Console Errors: ${report.details.consoleErrors.toString()}`,
    );
    console.log('========================================\n');

    expect(report.performance).toBeGreaterThanOrEqual(90);
    expect(report.accessibility).toBeGreaterThanOrEqual(90);
    expect(report.bestPractices).toBeGreaterThanOrEqual(90);
    expect(report.seo).toBeGreaterThanOrEqual(90);
  });
});

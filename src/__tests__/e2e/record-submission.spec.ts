import { test, expect } from '@playwright/test';
import * as path from 'path';

test.describe('Submission Visual Artifacts & Recording', () => {
  const screenshotsDir = path.resolve(process.cwd(), 'submission/screenshots');

  test('captures complete demo video and light/dark/mobile screenshots', async ({ browser }) => {
    // Context 1: Video recording in Light Mode
    const context = await browser.newContext({
      recordVideo: {
        dir: path.resolve(process.cwd(), 'submission/recordings'),
        size: { width: 1280, height: 720 },
      },
      viewport: { width: 1280, height: 720 },
      colorScheme: 'light',
    });

    const page = await context.newPage();

    // 1. Light Mode - Screen 1: Onboarding
    await page.goto('/');
    const newBtn = page.getByRole('button', { name: /Plan New Celebration/i });
    if (await newBtn.isVisible()) {
      await newBtn.click();
    }
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(screenshotsDir, '01-onboarding-light.png') });

    // Step 2: Form
    await page.getByLabel('Plan a Wedding').click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(screenshotsDir, '02-onboarding-form-light.png') });

    // Fill form
    await page.getByLabel('Event Name').fill('Emma & Liam Dream Wedding');
    await page.getByLabel('Event Date').fill('2027-06-18');
    await page.getByLabel('Expected Guests').fill('120');
    await page.getByLabel('Total Budget (USD)').fill('35000');
    await page.getByRole('button', { name: 'Create Event Plan' }).click();

    await expect(page).toHaveURL(/\/event\//);
    await page.waitForTimeout(600);

    // Screen 3: Overview Light
    await page.screenshot({ path: path.join(screenshotsDir, '03-dashboard-overview-light.png') });

    // Screen 4: Budget Light
    await page.getByRole('tab', { name: /budget/i }).click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(screenshotsDir, '04-dashboard-budget-light.png') });

    // Screen 5: Timeline Light
    await page.getByRole('tab', { name: /timeline/i }).click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(screenshotsDir, '05-dashboard-timeline-light.png') });

    // Screen 6: Vendors Light
    await page.getByRole('tab', { name: /vendors/i }).click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(screenshotsDir, '06-dashboard-vendors-light.png') });

    // Screen 7: Ideas Light
    await page.getByRole('tab', { name: /ai ideas/i }).click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(screenshotsDir, '07-dashboard-ideas-light.png') });

    // Close page and context to finalize the video
    await page.close();
    await context.close();

    // Context 2: Dark Mode screenshots
    const darkContext = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      colorScheme: 'dark',
    });
    const darkPage = await darkContext.newPage();

    // Ensure dark class is applied
    await darkPage.goto('/');
    await darkPage.evaluate(() => {
      document.documentElement.classList.add('dark');
    });

    const newBtnDark = darkPage.getByRole('button', { name: /Plan New Celebration/i });
    if (await newBtnDark.isVisible()) {
      await newBtnDark.click();
    }
    await darkPage.waitForTimeout(400);
    await darkPage.screenshot({ path: path.join(screenshotsDir, '01-onboarding-dark.png') });

    await darkPage.getByLabel('Plan a Wedding').click();
    await darkPage.waitForTimeout(400);
    await darkPage.screenshot({ path: path.join(screenshotsDir, '02-onboarding-form-dark.png') });

    await darkPage.getByLabel('Event Name').fill('Emma & Liam Dream Wedding (Dark Mode)');
    await darkPage.getByLabel('Event Date').fill('2027-06-18');
    await darkPage.getByLabel('Expected Guests').fill('120');
    await darkPage.getByLabel('Total Budget (USD)').fill('35000');
    await darkPage.getByRole('button', { name: 'Create Event Plan' }).click();

    await expect(darkPage).toHaveURL(/\/event\//);
    await darkPage.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    await darkPage.waitForTimeout(400);
    await darkPage.screenshot({
      path: path.join(screenshotsDir, '03-dashboard-overview-dark.png'),
    });

    await darkPage.getByRole('tab', { name: /budget/i }).click();
    await darkPage.waitForTimeout(400);
    await darkPage.screenshot({ path: path.join(screenshotsDir, '04-dashboard-budget-dark.png') });

    await darkPage.getByRole('tab', { name: /timeline/i }).click();
    await darkPage.waitForTimeout(400);
    await darkPage.screenshot({
      path: path.join(screenshotsDir, '05-dashboard-timeline-dark.png'),
    });

    await darkPage.getByRole('tab', { name: /vendors/i }).click();
    await darkPage.waitForTimeout(400);
    await darkPage.screenshot({ path: path.join(screenshotsDir, '06-dashboard-vendors-dark.png') });

    await darkPage.getByRole('tab', { name: /ai ideas/i }).click();
    await darkPage.waitForTimeout(400);
    await darkPage.screenshot({ path: path.join(screenshotsDir, '07-dashboard-ideas-dark.png') });

    await darkPage.close();
    await darkContext.close();

    // Context 3: Mobile Viewport (375x667)
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 667 },
      isMobile: true,
      hasTouch: true,
    });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto('/');

    const newBtnMobile = mobilePage.getByRole('button', { name: /Plan New Celebration/i });
    if (await newBtnMobile.isVisible()) {
      await newBtnMobile.click();
    }
    await mobilePage.waitForTimeout(400);
    await mobilePage.screenshot({ path: path.join(screenshotsDir, '01-mobile-onboarding.png') });

    await mobilePage.getByLabel('Plan a Birthday').click();
    await mobilePage.getByLabel('Event Name').fill('Alex 30th Birthday');
    await mobilePage.getByLabel('Event Date').fill('2026-12-10');
    await mobilePage.getByLabel('Expected Guests').fill('40');
    await mobilePage.getByLabel('Total Budget (USD)').fill('4000');
    await mobilePage.getByRole('button', { name: 'Create Event Plan' }).click();

    await expect(mobilePage).toHaveURL(/\/event\//);
    await mobilePage.waitForTimeout(400);
    await mobilePage.screenshot({
      path: path.join(screenshotsDir, '02-mobile-dashboard-overview.png'),
    });

    await mobilePage.getByRole('tab', { name: /budget/i }).click();
    await mobilePage.waitForTimeout(400);
    await mobilePage.screenshot({
      path: path.join(screenshotsDir, '03-mobile-dashboard-budget.png'),
    });

    await mobilePage.getByRole('tab', { name: /timeline/i }).click();
    await mobilePage.waitForTimeout(400);
    await mobilePage.screenshot({
      path: path.join(screenshotsDir, '04-mobile-dashboard-timeline.png'),
    });

    await mobilePage.getByRole('tab', { name: /vendors/i }).click();
    await mobilePage.waitForTimeout(400);
    await mobilePage.screenshot({
      path: path.join(screenshotsDir, '05-mobile-dashboard-vendors.png'),
    });

    await mobilePage.getByRole('tab', { name: /ai ideas/i }).click();
    await mobilePage.waitForTimeout(400);
    await mobilePage.screenshot({
      path: path.join(screenshotsDir, '06-mobile-dashboard-ideas.png'),
    });

    await mobilePage.close();
    await mobileContext.close();
  });
});

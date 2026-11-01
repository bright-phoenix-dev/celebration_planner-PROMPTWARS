import { test } from '@playwright/test';
import path from 'path';

const artifactDir = 'C:/Users/mukho/.gemini/antigravity/brain/6842ffe3-952e-472d-b06c-b5893c7ab8aa';

test('capture complete visual screenshots for all key user journeys', async ({ page }) => {
  // Set viewport
  await page.setViewportSize({ width: 1280, height: 900 });

  // 1. Onboarding Step 1 (Event Type selection)
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.screenshot({
    path: path.join(artifactDir, '01-onboarding-step1.png'),
    fullPage: true,
  });

  // 2. Select Wedding -> Step 2 Details Form
  await page.getByLabel('Plan a Wedding').click();
  await page.waitForTimeout(300);
  await page.screenshot({
    path: path.join(artifactDir, '02-onboarding-step2.png'),
    fullPage: true,
  });

  // Fill in form details
  await page.getByLabel('Event Name').fill('Sarah & Michael Dream Wedding');
  await page.getByLabel('Event Date').fill('2026-11-20');
  await page.getByLabel('Expected Guests').fill('175');
  await page.getByLabel('Total Budget (USD)').fill('35000');
  await page.waitForTimeout(300);

  // 3. Submit to Dashboard
  await page.getByRole('button', { name: 'Create Event Plan' }).click();
  await page.waitForURL(/\/event\//);
  await page.waitForTimeout(600);

  // Screenshot Overview Tab
  await page.screenshot({
    path: path.join(artifactDir, '03-dashboard-overview.png'),
    fullPage: true,
  });

  // 4. Budget Tab
  await page.getByRole('tab', { name: /budget/i }).click();
  await page.waitForTimeout(400);

  // Edit Venue to demonstrate over-budget alert
  const editVenueBtn = page.locator('button').filter({ hasText: '$0' }).first();
  if (await editVenueBtn.isVisible()) {
    await editVenueBtn.click();
    const input = page.locator('input[type="number"]').first();
    await input.fill('12000');
    await page.getByLabel('Save').click();
    await page.waitForTimeout(300);
  }

  await page.screenshot({
    path: path.join(artifactDir, '04-dashboard-budget.png'),
    fullPage: true,
  });

  // 5. Timeline Tab
  await page.getByRole('tab', { name: /timeline/i }).click();
  await page.waitForTimeout(400);
  // Toggle first task to show progress
  const firstTask = page.locator('button[aria-label*="Mark complete"]').first();
  if (await firstTask.isVisible()) {
    await firstTask.click();
    await page.waitForTimeout(200);
  }
  await page.screenshot({
    path: path.join(artifactDir, '05-dashboard-timeline.png'),
    fullPage: true,
  });

  // 6. Vendors Tab
  await page.getByRole('tab', { name: /vendors/i }).click();
  await page.waitForTimeout(400);
  // Expand details for first vendor
  const expandBtn = page.locator('button[aria-label*="Expand details"]').first();
  if (await expandBtn.isVisible()) {
    await expandBtn.click();
    await page.waitForTimeout(200);
  }
  await page.screenshot({
    path: path.join(artifactDir, '06-dashboard-vendors.png'),
    fullPage: true,
  });

  // 7. AI Ideas Tab
  await page.getByRole('tab', { name: /ai ideas/i }).click();
  await page.waitForTimeout(400);
  await page.getByLabel('Theme / Style').fill('Enchanted Forest Whimsical');
  await page.getByLabel('Desired Vibe').fill('Warm, candlelit, magical');
  await page.screenshot({
    path: path.join(artifactDir, '07-dashboard-ideas.png'),
    fullPage: true,
  });
});

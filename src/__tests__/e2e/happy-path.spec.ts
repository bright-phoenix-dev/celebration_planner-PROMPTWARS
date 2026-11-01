import { test, expect } from '@playwright/test';

test.describe('Celebration & Event Planner Happy Path', () => {
  test('creates a celebration event, verifies all 4 tabs, and tests ideas flow', async ({
    page,
  }) => {
    // 1. Visit Home / Onboarding
    await page.goto('/');

    // 2. Select Event Type: Wedding
    const weddingBtn = page.getByLabel('Plan a Wedding');
    await expect(weddingBtn).toBeVisible();
    await weddingBtn.click();

    // 3. Fill in Details
    await page.getByLabel('Event Name').fill('Jessica & Oliver Wedding');
    await page.getByLabel('Event Date').fill('2026-12-15');
    await page.getByLabel('Expected Guests').fill('150');
    await page.getByLabel('Total Budget (USD)').fill('30000');

    // 4. Submit
    await page.getByRole('button', { name: 'Create Event Plan' }).click();

    // 5. Verify redirection to event dashboard
    await expect(page).toHaveURL(/\/event\//);
    await expect(page.getByRole('heading', { level: 1 }).first()).toContainText(
      'Jessica & Oliver Wedding',
    );

    // 6. Verify Overview metrics
    await expect(page.getByText('$30,000').first()).toBeVisible();

    // 7. Verify Budget Tab
    await page.getByRole('tab', { name: /budget/i }).click();
    await expect(page.getByText('Venue').first()).toBeVisible();
    await expect(page.getByText('Catering').first()).toBeVisible();

    // 8. Verify Timeline Tab
    await page.getByRole('tab', { name: /timeline/i }).click();
    await expect(page.getByText('Timeline Progress')).toBeVisible();

    // 9. Verify Vendors Tab
    await page.getByRole('tab', { name: /vendors/i }).click();
    await expect(page.getByText('Vendor Checklist').first()).toBeVisible();

    // 10. Verify AI Ideas Tab & Form
    await page.getByRole('tab', { name: /ai ideas/i }).click();
    await expect(page.getByText('Get AI-Powered Ideas')).toBeVisible();
    await expect(page.getByLabel('Theme / Style')).toBeVisible();
  });
});

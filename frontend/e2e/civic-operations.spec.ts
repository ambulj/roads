import { expect, test } from '@playwright/test';

test.describe('Civic operations safeguards', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTitle(/Active Persona/)).toBeVisible();
  });

  test('switches to the analyst persona and blocks intervention commitment', async ({ page }) => {
    await page.getByTitle(/Active Persona/).click();
    await page.getByRole('button', { name: /Read-Only Analyst/ }).click();
    await expect(page.getByText('Privileges for Read-Only Analyst')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByText('Municipal Identity & Role Switcher')).toBeHidden();

    await page.getByTitle(/Simulate What-If Actions/).click();
    await page.getByRole('button', { name: /Commit to Live Operations Directive/ }).click();
    await expect(page.getByText('Insufficient Permissions')).toBeVisible();
  });

  test('runs a deterministic monsoon drill through its playback controls', async ({ page }) => {
    await page.getByTitle(/Live Telemetry Active/).click();
    await expect(page.getByText('Deterministic Scenario Runner')).toBeVisible();
    await page.getByRole('button', { name: /Play Scenario/ }).click();
    await expect(page.getByRole('button', { name: /Pause Drill/ })).toBeVisible();
    await page.getByTitle('Reset Scenario to T+0').click();
    await expect(page.getByText('Step 1 of 4')).toBeVisible();
  });

  test('global shell routes, search, and navigation collapse remain operable', async ({ page }) => {
    await page.getByTitle('Toggle navigation sidebar').click();
    await expect(page.getByTitle('Expand sidebar (S)')).toBeVisible();
    await page.getByTitle('Expand sidebar (S)').click();
    await page.getByRole('button', { name: 'RoadSaarthi command center' }).click();
    await expect(page).toHaveURL(/#\/command/);
    await page.getByTitle(/Search buses, roads, hazards/).click();
    await expect(page.getByText(/Command Palette|Search Command Center/i).first()).toBeVisible();
    await page.keyboard.press('Escape');
    await page.getByTitle('Decision analytics').click();
    await expect(page).toHaveURL(/#\/analytics/);
  });
});

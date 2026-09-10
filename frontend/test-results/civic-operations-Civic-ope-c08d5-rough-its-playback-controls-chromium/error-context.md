# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: civic-operations.spec.ts >> Civic operations safeguards >> runs a deterministic monsoon drill through its playback controls
- Location: e2e\civic-operations.spec.ts:21:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:4173/
Call log:
  - navigating to "http://127.0.0.1:4173/", waiting until "load"

```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test';
  2  | 
  3  | test.describe('Civic operations safeguards', () => {
  4  |   test.beforeEach(async ({ page }) => {
> 5  |     await page.goto('/');
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:4173/
  6  |     await expect(page.getByTitle(/Active Persona/)).toBeVisible();
  7  |   });
  8  | 
  9  |   test('switches to the analyst persona and blocks intervention commitment', async ({ page }) => {
  10 |     await page.getByTitle(/Active Persona/).click();
  11 |     await page.getByRole('button', { name: /Read-Only Analyst/ }).click();
  12 |     await expect(page.getByText('Privileges for Read-Only Analyst')).toBeVisible();
  13 |     await page.keyboard.press('Escape');
  14 |     await expect(page.getByText('Municipal Identity & Role Switcher')).toBeHidden();
  15 | 
  16 |     await page.getByTitle(/Simulate What-If Actions/).click();
  17 |     await page.getByRole('button', { name: /Commit to Live Operations Directive/ }).click();
  18 |     await expect(page.getByText('Insufficient Permissions')).toBeVisible();
  19 |   });
  20 | 
  21 |   test('runs a deterministic monsoon drill through its playback controls', async ({ page }) => {
  22 |     await page.getByTitle(/Live Telemetry Active/).click();
  23 |     await expect(page.getByText('Deterministic Scenario Runner')).toBeVisible();
  24 |     await page.getByRole('button', { name: /Play Scenario/ }).click();
  25 |     await expect(page.getByRole('button', { name: /Pause Drill/ })).toBeVisible();
  26 |     await page.getByTitle('Reset Scenario to T+0').click();
  27 |     await expect(page.getByText('Step 1 of 4')).toBeVisible();
  28 |   });
  29 | 
  30 |   test('global shell routes, search, and navigation collapse remain operable', async ({ page }) => {
  31 |     await page.getByTitle('Toggle navigation sidebar').click();
  32 |     await expect(page.getByTitle('Expand sidebar (S)')).toBeVisible();
  33 |     await page.getByTitle('Expand sidebar (S)').click();
  34 |     await page.getByRole('button', { name: 'RoadSaarthi command center' }).click();
  35 |     await expect(page).toHaveURL(/#\/command/);
  36 |     await page.getByTitle(/Search buses, roads, hazards/).click();
  37 |     await expect(page.getByText(/Command Palette|Search Command Center/i).first()).toBeVisible();
  38 |     await page.keyboard.press('Escape');
  39 |     await page.getByTitle('Decision analytics').click();
  40 |     await expect(page).toHaveURL(/#\/analytics/);
  41 |   });
  42 | });
  43 | 
```
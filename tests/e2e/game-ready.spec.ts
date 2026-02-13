import { expect, test } from '@playwright/test';

test('game reaches deterministic ready state and matches screenshot', async ({ page }) => {
  await page.goto('/?testMode=1&seed=123');

  await page.waitForFunction(() => (window as Window & { __GAME_READY__?: boolean }).__GAME_READY__ === true);

  await expect(page).toHaveScreenshot('game-ready.png', {
    fullPage: true,
    animations: 'disabled'
  });
});

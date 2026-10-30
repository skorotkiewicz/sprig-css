import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';

const recipes = JSON.parse(await readFile(new URL('../../data/recipes.json', import.meta.url), 'utf8'));
const css = await readFile(new URL('../../dist/sprig.css', import.meta.url), 'utf8');
const axe = page => new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
async function mountRecipe(page, id, enhance = true) {
  const recipe = recipes.find(item => item.id === id);
  await page.goto('/examples/starter.html');
  await page.setContent(`<!doctype html><html lang="en"><head><title>Recipe test</title><style>${css}</style></head><body>${recipe.html.includes('<main') ? recipe.html : `<main>${recipe.html}</main>`}</body></html>`);
  if (enhance && recipe.js) await page.addScriptTag({ content: recipe.js });
}

for (const theme of ['light', 'dark']) {
  test(`gallery renders and passes automated accessibility checks in ${theme}`, async ({ page }, testInfo) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.emulateMedia({ colorScheme: theme });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Good HTML. Great by nature.' })).toBeVisible();
    await expect(page.locator('#garden-submit')).toBeEnabled();
    const results = await axe(page);
    expect(results.violations).toEqual([]);
    expect(errors).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath(`sprig-${theme}.png`), fullPage: true });
  });
}

test('demo form validates locally without sending requests or storing entered data', async ({ page }) => {
  await page.goto('/');
  const requests = [];
  page.on('request', request => requests.push(request.url()));
  await page.getByRole('button', { name: 'Count me in' }).click();
  await expect(page.locator('#garden-email')).toBeFocused();
  await expect(page.locator('#garden-status')).toBeEmpty();
  await page.getByLabel('Your email', { exact: true }).fill('gardener@example.org');
  await page.getByRole('button', { name: 'Count me in' }).click();
  await expect(page.getByRole('status').first()).toContainText('nothing was sent or stored');
  expect(requests).toEqual([]);
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain('gardener@example.org');
});

test('native disclosure, modal focus, escape, return focus and close action work', async ({ page }) => {
  await page.goto('/');
  const details = page.locator('details').filter({ has: page.getByText('Does this need JavaScript?', { exact: true }) });
  await details.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(details).toHaveAttribute('open', '');
  const trigger = page.getByRole('button', { name: 'Open a little window' });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Hello, breathing room.' });
  await expect(dialog).toBeVisible();
  await expect(page.getByRole('button', { name: 'Back to the garden' })).toBeFocused();
  // Native sequential focus may visit browser chrome between wrapping; background controls remain inert.
  await page.locator('#garden-email').evaluate(input => input.focus());
  await expect(page.getByRole('button', { name: 'Back to the garden' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#garden-email')).not.toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Back to the garden' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.getByRole('button', { name: 'Back to the garden' }).click();
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test('native popover stays closed until invoked and supports dismissal', async ({ page }) => {
  await page.goto('/');
  const popover = page.locator('#garden-note');
  await expect(popover).not.toBeVisible();
  await page.getByRole('button', { name: 'A small observation' }).click();
  await expect(popover).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(popover).not.toBeVisible();
  await page.getByRole('button', { name: 'A small observation' }).click();
  await page.getByRole('button', { name: 'Got it', exact: true }).click();
  await expect(popover).not.toBeVisible();
});

test('theme control persists explicit choices and respects the OS in system mode', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await expect(page.locator('html')).not.toHaveAttribute('data-theme');
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'dark');
  await page.locator('#theme-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'light');
  await page.reload();
  await expect(page.locator('#theme-toggle')).toHaveText('Theme: light');
  await page.locator('#theme-toggle').click();
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'dark');
  await page.locator('#theme-toggle').click();
  await expect(page.locator('html')).not.toHaveAttribute('data-theme');
});

test('skip navigation is revealed and transfers focus to main content', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  const box = await page.locator('.skip-link').boundingBox();
  expect(box.y).toBeGreaterThanOrEqual(0);
  await page.keyboard.press('Enter');
  expect(await page.evaluate(() => document.activeElement.id)).toBe('main');
});

for (const width of [320, 390, 768, 1440]) {
  test(`gallery and guide reflow at ${width}px without page-level overflow`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    for (const url of ['/', '/docs/guide.html', '/examples/starter.html']) {
      await page.goto(url);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), url).toBe(true);
    }
    if (width === 390) {
      await page.goto('/');
      await page.screenshot({ path: testInfo.outputPath('sprig-mobile.png'), fullPage: true });
    }
  });
}

test('guide and starter pass automated accessibility checks', async ({ page }) => {
  for (const url of ['/docs/guide.html', '/examples/starter.html']) {
    await page.goto(url);
    expect((await axe(page)).violations, url).toEqual([]);
  }
});

test('without JavaScript the form cannot submit and the popover has a disclosure fallback', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4174/');
  await expect(page.locator('#garden-submit')).toBeDisabled();
  await expect(page.locator('#popover-trigger')).toBeHidden();
  await page.locator('#popover-fallback summary').click();
  await expect(page.locator('#popover-fallback p')).toBeVisible();
  await context.close();
});

test('reduced motion suppresses busy animation and RTL layout remains usable', async ({ page }) => {
  await page.goto('/');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('#garden-submit').evaluate(button => button.setAttribute('aria-busy', 'true'));
  const duration = await page.locator('#garden-submit').evaluate(button => getComputedStyle(button, '::after').animationDuration);
  expect(parseFloat(duration)).toBeLessThan(.001);
  await page.locator('html').evaluate(html => html.dir = 'rtl');
  await page.setViewportSize({ width: 390, height: 900 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await expect(page.locator('#garden-email')).toBeVisible();
});

for (const recipe of recipes) {
  test(`recipe ${recipe.id} renders with named controls and no automated a11y violations`, async ({ page }) => {
    await mountRecipe(page, recipe.id);
    expect((await axe(page)).violations).toEqual([]);
  });
}

test('modal recipe opens, closes and restores focus', async ({ page }) => {
  await mountRecipe(page, 'modal-dialog');
  await page.locator('#packing-open').click();
  await expect(page.locator('#packing-dialog')).toBeVisible();
  await expect(page.locator('#packing-close')).toBeFocused();
  await page.locator('#packing-close').click();
  await expect(page.locator('#packing-open')).toBeFocused();
});

test('validation recipe clears stale errors and restores them on invalid submission', async ({ page }) => {
  await mountRecipe(page, 'validation-error');
  await expect(page.locator('#validation-email')).toHaveAttribute('aria-invalid', 'true');
  await page.locator('#validation-email').fill('valid@example.org');
  await expect(page.locator('#validation-email-error')).toBeHidden();
  await page.locator('#validation-submit').click();
  await expect(page.locator('#validation-status')).toContainText('Nothing was sent');
  await page.locator('#validation-email').fill('');
  await page.locator('#validation-submit').click();
  await expect(page.locator('#validation-email')).toBeFocused();
  await expect(page.locator('#validation-email-error')).toHaveText('Enter your email address.');
});

test('empty state recipe adds text safely, cancels, and restores focus', async ({ page }) => {
  await mountRecipe(page, 'empty-state');
  await page.locator('#notes-add').click();
  await expect(page.locator('#notes-text')).toBeFocused();
  await page.locator('#notes-text').fill('<strong>A tiny idea</strong>');
  await page.getByRole('button', { name: 'Save note on this page' }).click();
  await expect(page.locator('#notes-empty')).toBeHidden();
  await expect(page.locator('#notes-list li')).toHaveText('<strong>A tiny idea</strong>');
  await expect(page.locator('#notes-list strong')).toHaveCount(0);
  await expect(page.locator('#notes-add')).toBeFocused();
  await page.locator('#notes-add').click();
  await page.locator('#notes-cancel').click();
  await expect(page.locator('#notes-form')).toBeHidden();
});

test('local preview serves public routes but not private files or unsupported methods', async ({ request }) => {
  expect((await request.get('/')).status()).toBe(200);
  expect((await request.get('/dist/sprig.css')).headers()['content-type']).toContain('text/css');
  for (const url of ['/.git/config', '/package.json', '/node_modules/@playwright/test/package.json', '/site/../.git/config', '/%2e%2e/.git/config']) expect((await request.get(url)).status(), url).toBe(404);
  expect((await request.post('/')).status()).toBe(405);
});

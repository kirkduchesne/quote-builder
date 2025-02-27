// Requires an externally supplied Playwright runtime and a running application.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('dialog', dialog => dialog.accept());
    await page.goto(process.env.QUOTE_TEST_URL || 'http://localhost:8504');
    await page.getByText('Reusable service templates', { exact: true }).click();
    await page.getByLabel('Template name', { exact: true }).fill('Sample service');
    await page.getByLabel('Template description', { exact: true }).fill('Sample consultation');
    await page.getByLabel('Template unit price (USD)').fill('50');
    await page.getByRole('button', { name: 'Save template', exact: true }).click();
    await page.getByRole('button', { name: 'Use template Sample service', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('dl dd:last-child').textContent === '$50.00');
    await page.getByRole('button', { name: 'Save draft', exact: true }).click();
    await page.getByLabel('Template name', { exact: true }).fill('Unfinished template');
    await page.getByRole('button', { name: 'New quote', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('dl dd:last-child').textContent === '$0.00');
    assert.equal(await page.getByLabel('Template name', { exact: true }).inputValue(), 'Unfinished template');
    await page.getByLabel('Saved drafts', { exact: true }).selectOption({ label: 'Untitled quote' });
    await page.waitForFunction(() => document.querySelector('dl dd:last-child').textContent === '$50.00');
    assert.equal(await page.getByLabel('Template name', { exact: true }).inputValue(), 'Unfinished template');
    await page.getByLabel('Template description', { exact: true }).fill('Retained after storage fails');
    await page.getByLabel('Template unit price (USD)').fill('12');
    await page.evaluate(() => { Storage.prototype.setItem = function () { throw new Error('quota'); }; });
    await page.getByRole('button', { name: 'Save template', exact: true }).click();
    await page.getByRole('button', { name: 'New quote', exact: true }).click();
    assert(await page.getByRole('button', { name: 'Use template Unfinished template', exact: true }).isVisible());
    assert.deepEqual(errors, []);
    console.log('PASS template insertion, draft switches preserve unfinished and session-only templates');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });

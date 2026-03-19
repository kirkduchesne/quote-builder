const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage();
    page.on('dialog', dialog => dialog.accept());
    await page.goto(process.env.QUOTE_TEST_URL || 'http://localhost:8604');
    await page.getByLabel('Quote name', { exact: true }).fill('Sample archived quote');
    await page.getByRole('button', { name: 'Save draft', exact: true }).click();
    await page.getByLabel('Quote notes').fill('Unsaved notes stay');
    await page.getByRole('button', { name: 'Archive current draft', exact: true }).click();
    assert.equal(await page.getByLabel('Quote notes').inputValue(), 'Unsaved notes stay');
    await page.getByRole('button', { name: 'Save draft', exact: true }).click();
    await page.getByRole('button', { name: 'New quote', exact: true }).click();
    await page.waitForFunction(() => document.getElementById('quote-name').value === 'Untitled quote');
    assert.equal(await page.locator('#draft-picker option').count(), 1);
    await page.getByLabel('Draft visibility', { exact: true }).selectOption('archived');
    await page.getByLabel('Saved drafts', { exact: true }).selectOption({ label: 'Sample archived quote' });
    await page.waitForFunction(() => document.getElementById('notes').value === 'Unsaved notes stay');
    await page.reload();
    assert(await page.getByText('Current draft is archived.', { exact: false }).isVisible());
    await page.getByText('Import or export quote backups', { exact: true }).click();
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export saved drafts', exact: true }).click();
    const file = await (await download).path();
    const contents = JSON.parse(require('node:fs').readFileSync(file, 'utf8'));
    assert.equal(contents.drafts[0].name, 'Sample archived quote');
    await page.getByRole('button', { name: 'Unarchive all drafts', exact: true }).click();
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('quote-builder-organization-v1')).archivedIds), []);
    await page.getByRole('button', { name: 'Archive current draft', exact: true }).click();
    await page.getByRole('button', { name: 'Delete draft', exact: true }).click();
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('quote-builder-organization-v1')).archivedIds), []);
    console.log('PASS archive persistence, filters, retained edits, inclusive backup and cleanup');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });

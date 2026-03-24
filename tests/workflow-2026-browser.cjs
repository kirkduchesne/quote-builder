const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage();
    let confirmations = 0;
    page.on('dialog', dialog => { confirmations++; dialog.dismiss(); });
    await page.goto(process.env.QUOTE_TEST_URL || 'http://localhost:8604');
    await page.getByLabel('Description', { exact: true }).fill('Sample line');
    await page.getByLabel('Unit price (USD)', { exact: true }).fill('25');
    await page.getByRole('button', { name: 'Add item', exact: true }).click();
    await page.getByLabel('Quantity', { exact: true }).fill('2');
    await page.getByRole('button', { name: 'Edit Sample line', exact: true }).click();
    assert.equal(confirmations, 1);
    assert.equal(await page.getByLabel('Quantity', { exact: true }).inputValue(), '2');
    await page.getByRole('button', { name: 'Cancel line', exact: true }).click();
    await page.getByRole('button', { name: 'Edit Sample line', exact: true }).click();
    await page.getByLabel('Description', { exact: true }).fill('');
    await page.getByLabel('Unit price (USD)', { exact: true }).fill('');
    await page.getByRole('button', { name: 'Edit Sample line', exact: true }).click();
    assert.equal(confirmations, 2);
    assert.equal(await page.getByLabel('Description', { exact: true }).inputValue(), '');
    console.log('PASS complete unfinished-line replacement confirmation');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });

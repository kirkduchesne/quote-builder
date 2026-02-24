const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    let accept = false;
    page.on('dialog', dialog => accept ? dialog.accept() : dialog.dismiss());
    await page.goto(process.env.QUOTE_TEST_URL || 'http://localhost:8604');
    await page.getByText('Reusable service templates', { exact: true }).click();
    await page.getByText('Import or export service templates', { exact: true }).click();
    const upload = raw => page.getByLabel('Import service-template backup', { exact: true }).setInputFiles({ name: 'templates.json', mimeType: 'application/json', buffer: Buffer.from(raw) });
    const template = { id: 1, name: 'Sample review', description: 'Review work', quantity: 1, cents: 1500 };
    const backup = JSON.stringify({ kind: 'quote-builder-templates', version: 1, templates: [template] });
    await upload(backup);
    await page.waitForFunction(() => !document.getElementById('template-backup').disabled);
    assert.equal(await page.evaluate(() => localStorage.getItem('quote-builder-templates-v1')), null);
    await upload('{');
    await page.getByText('Template backup could not be read:', { exact: false }).waitFor();
    await upload(JSON.stringify({ kind: 'quote-builder', version: 1, drafts: [] }));
    await page.getByText('This is not a supported service-template backup.', { exact: false }).waitFor();
    assert.equal(await page.evaluate(() => localStorage.getItem('quote-builder-templates-v1')), null);
    assert.deepEqual(errors, []);
    console.log('PASS template backup cancellation and rejected formats');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });

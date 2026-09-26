const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage();
    let accept = true;
    page.on('dialog', (dialog) =>
      accept ? dialog.accept() : dialog.dismiss()
    );
    await page.goto(process.env.QUOTE_TEST_URL || 'http://localhost:8504');
    await page
      .getByLabel('Quote name', { exact: true })
      .fill('Sample estimate');
    await page.getByRole('button', { name: 'Save draft', exact: true }).click();
    await page
      .getByText('Import or export quote backups', { exact: true })
      .click();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export saved drafts' }).click();
    const download = await downloadPromise;
    const stream = await download.createReadStream();
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    const bytes = Buffer.concat(chunks);
    assert.equal(JSON.parse(bytes).drafts[0].name, 'Sample estimate');
    await page
      .getByLabel('Import quote backup', { exact: true })
      .setInputFiles({
        name: 'backup.json',
        mimeType: 'application/json',
        buffer: bytes,
      });
    await page.waitForFunction(
      () => document.querySelector('#draft-picker').options.length === 3
    );
    const names = await page.locator('#draft-picker option').allTextContents();
    assert(names.includes('Sample estimate (import 1)'));
    const saved = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('quote-builder-drafts-v1'))
    );
    assert.equal(new Set(saved.drafts.map((d) => d.id)).size, 2);
    accept = false;
    await page.getByLabel('Quote name', { exact: true }).fill('Unsaved edit');
    await page
      .getByLabel('Import quote backup', { exact: true })
      .setInputFiles({
        name: 'backup.json',
        mimeType: 'application/json',
        buffer: bytes,
      });
    await page.waitForTimeout(100);
    assert.equal(
      await page.getByLabel('Quote name', { exact: true }).inputValue(),
      'Unsaved edit'
    );
    assert.equal(await page.locator('#draft-picker option').count(), 3);
    await page
      .getByLabel('Import quote backup', { exact: true })
      .setInputFiles({
        name: 'broken.json',
        mimeType: 'application/json',
        buffer: Buffer.from('{}'),
      });
    await page.getByText(/Backup could not be read:/).waitFor();
    assert.equal(await page.locator('#draft-picker option').count(), 3);
    await page.evaluate(() =>
      localStorage.setItem('quote-builder-drafts-v1', 'external update')
    );
    await page.getByRole('button', { name: 'Save draft', exact: true }).click();
    assert.equal(
      await page.evaluate(() =>
        localStorage.getItem('quote-builder-drafts-v1')
      ),
      'external update'
    );
    const fresh = await browser.newPage();
    fresh.on('dialog', (d) => d.accept());
    await fresh.goto(process.env.QUOTE_TEST_URL || 'http://localhost:8504');
    await fresh
      .getByText('Import or export quote backups', { exact: true })
      .click();
    const sameId = {
      kind: 'quote-builder',
      version: 1,
      drafts: [
        {
          id: 'first',
          name: 'Imported quote',
          reference: 'IMPORT',
          notes: 'Imported notes',
          discount: 0,
          items: [
            { id: 1, description: 'Imported line', quantity: 2, cents: 1234 },
          ],
        },
      ],
    };
    await fresh
      .getByLabel('Import quote backup', { exact: true })
      .setInputFiles({
        name: 'same-id.json',
        mimeType: 'application/json',
        buffer: Buffer.from(JSON.stringify(sameId)),
      });
    await fresh.waitForFunction(
      () => document.querySelector('#quote-name').value === 'Imported quote'
    );
    assert.equal(
      await fresh.getByLabel('Quote notes').inputValue(),
      'Imported notes'
    );
    assert.equal(await fresh.locator('dl dd').last().textContent(), '$24.68');
    await fresh
      .getByRole('button', { name: 'Save draft', exact: true })
      .click();
    assert.deepEqual(
      await fresh.evaluate(
        () => JSON.parse(localStorage.getItem('quote-builder-drafts-v1')).drafts
      ),
      sameId.drafts
    );
    const delayed = await browser.newPage();
    delayed.on('dialog', (d) => d.accept());
    await delayed.goto(process.env.QUOTE_TEST_URL || 'http://localhost:8504');
    await delayed
      .getByText('Import or export quote backups', { exact: true })
      .click();
    await delayed.evaluate(() => {
      const original = File.prototype.text;
      File.prototype.text = function () {
        return new Promise((resolve) => {
          window.releaseBackup = () => original.call(this).then(resolve);
        });
      };
    });
    await delayed
      .getByLabel('Import quote backup', { exact: true })
      .setInputFiles({
        name: 'delayed.json',
        mimeType: 'application/json',
        buffer: Buffer.from(JSON.stringify(sameId)),
      });
    assert(
      await delayed
        .getByLabel('Import quote backup', { exact: true })
        .isDisabled()
    );
    await delayed
      .getByLabel('Quote name', { exact: true })
      .fill('Saved while reading');
    await delayed
      .getByRole('button', { name: 'Save draft', exact: true })
      .click();
    await delayed.evaluate(() => window.releaseBackup());
    await delayed.waitForFunction(
      () =>
        JSON.parse(localStorage.getItem('quote-builder-drafts-v1')).drafts
          .length === 2
    );
    assert.equal(await delayed.locator('#draft-picker option').count(), 3);
    assert(
      !(await delayed
        .getByLabel('Import quote backup', { exact: true })
        .isDisabled())
    );
    console.log(
      'PASS backup download, collision-safe import, cancellation, invalid files, stale-write preservation'
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

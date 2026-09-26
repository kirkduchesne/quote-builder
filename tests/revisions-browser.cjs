const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('dialog', (d) => d.accept());
    await page.goto(process.env.QUOTE_TEST_URL || 'http://localhost:8604');
    await page
      .getByLabel('Quote name', { exact: true })
      .fill('Sample revision quote');
    await page
      .getByLabel('Description', { exact: true })
      .fill('Original service');
    await page.getByLabel('Unit price (USD)', { exact: true }).fill('12.35');
    await page.getByRole('button', { name: 'Add item', exact: true }).click();
    await page.getByRole('button', { name: 'Save draft', exact: true }).click();
    await page.getByText('Saved revision history', { exact: true }).click();
    await page
      .getByRole('button', { name: 'Capture saved quote', exact: true })
      .click();
    await page
      .getByRole('button', {
        name: 'Rename revision Sample revision quote',
        exact: true,
      })
      .click();
    await page
      .getByLabel('Revision label', { exact: true })
      .fill('Before changes');
    await page
      .getByRole('button', { name: 'Save revision label', exact: true })
      .click();
    await page.getByLabel('Quote notes').fill('Later notes');
    await page.getByRole('button', { name: 'Save draft', exact: true }).click();
    await page
      .getByRole('button', {
        name: 'Restore revision Before changes as new quote',
        exact: true,
      })
      .click();
    await page.waitForFunction(
      () => document.getElementById('notes').value === '',
    );
    assert.equal(await page.getByLabel('Quote notes').inputValue(), '');
    assert.equal(
      await page.getByLabel('Quote name', { exact: true }).inputValue(),
      'Sample revision quote (copy)',
    );
    await page
      .getByLabel('Saved drafts', { exact: true })
      .selectOption({ label: 'Sample revision quote' });
    await page
      .getByRole('button', { name: 'Delete draft', exact: true })
      .click();
    assert(
      await page
        .getByText('Source quote is no longer saved.', { exact: false })
        .isVisible(),
    );
    const download = page.waitForEvent('download');
    await page
      .getByRole('button', {
        name: 'Export revision Before changes',
        exact: true,
      })
      .click();
    assert.equal(
      (await download).suggestedFilename(),
      'quote-builder-drafts.json',
    );
    await page.reload();
    await page.getByText('Saved revision history', { exact: true }).click();
    await page
      .getByRole('button', {
        name: 'Restore revision Before changes as new quote',
        exact: true,
      })
      .click();
    await page.waitForFunction(
      () => document.getElementById('notes').value === '',
    );
    assert.equal(await page.getByLabel('Quote notes').inputValue(), '');
    await page
      .getByRole('button', {
        name: 'Delete revision Before changes',
        exact: true,
      })
      .click();
    assert(
      await page
        .getByText('No revisions captured yet.', { exact: true })
        .isVisible(),
    );
    await page
      .getByRole('button', { name: 'Capture saved quote', exact: true })
      .focus();
    await page.keyboard.press('Enter');
    const restore = page
      .getByRole('button', { name: /Restore revision .* as new quote/ })
      .first();
    await restore.focus();
    await page.keyboard.press('Enter');
    await page.waitForFunction(
      () => document.activeElement.id === 'quote-name',
    );
    const sources = await page.evaluate(() =>
      JSON.parse(
        localStorage.getItem('quote-builder-revisions-v1'),
      ).revisions.map((r) => r.quote.id),
    );
    const selected = await page
      .getByLabel('Saved drafts', { exact: true })
      .inputValue();
    assert(!sources.includes(selected));
    await page
      .getByRole('button', { name: 'Duplicate quote', exact: true })
      .click();
    await page.waitForFunction(() =>
      document.getElementById('draft-picker').value.startsWith('copy-'),
    );
    const capturedSource = await page
      .getByLabel('Saved drafts', { exact: true })
      .inputValue();
    await page
      .getByRole('button', { name: 'Capture saved quote', exact: true })
      .click();
    await page
      .getByRole('button', { name: 'Delete draft', exact: true })
      .click();
    await page
      .getByRole('button', { name: 'Duplicate quote', exact: true })
      .click();
    await page.waitForFunction(
      (id) =>
        document.getElementById('draft-picker').value.startsWith('copy-') &&
        document.getElementById('draft-picker').value !== id,
      capturedSource,
    );
    assert.notEqual(
      await page.getByLabel('Saved drafts', { exact: true }).inputValue(),
      capturedSource,
    );
    const failed = await browser.newPage();
    failed.on('dialog', (dialog) => dialog.accept());
    failed.on('pageerror', (error) => errors.push(error.message));
    await failed.goto(process.env.QUOTE_TEST_URL || 'http://localhost:8604');
    await failed
      .getByRole('button', { name: 'Save draft', exact: true })
      .click();
    await failed.evaluate(() => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (key === 'quote-builder-revisions-v1') throw new Error('quota');
        return original.call(this, key, value);
      };
    });
    await failed.getByText('Saved revision history', { exact: true }).click();
    await failed
      .getByRole('button', { name: 'Capture saved quote', exact: true })
      .click();
    await failed
      .getByText('Revision changes are only in this session.', { exact: false })
      .waitFor();
    await failed
      .getByRole('button', {
        name: 'Rename revision Untitled quote',
        exact: true,
      })
      .click();
    await failed
      .getByLabel('Revision label', { exact: true })
      .fill('Session recovery');
    await failed
      .getByRole('button', { name: 'Save revision label', exact: true })
      .click();
    assert.equal(
      await failed.evaluate(() =>
        localStorage.getItem('quote-builder-revisions-v1'),
      ),
      null,
    );
    assert(
      await failed.evaluate(() => {
        const event = new Event('beforeunload', { cancelable: true });
        window.dispatchEvent(event);
        return event.defaultPrevented;
      }),
    );
    const sessionDownload = failed.waitForEvent('download');
    await failed
      .getByRole('button', {
        name: 'Export revision Session recovery',
        exact: true,
      })
      .click();
    const exported = JSON.parse(
      require('node:fs').readFileSync(
        await (await sessionDownload).path(),
        'utf8',
      ),
    );
    assert.equal(exported.drafts.length, 1);
    await failed
      .getByRole('button', { name: 'Delete draft', exact: true })
      .click();
    await failed
      .getByRole('button', { name: 'Save draft', exact: true })
      .click();
    assert.notEqual(
      await failed.getByLabel('Saved drafts', { exact: true }).inputValue(),
      exported.drafts[0].id,
    );
    await failed.close();
    const corrupt = await browser.newPage();
    corrupt.on('pageerror', (error) => errors.push(error.message));
    await corrupt.addInitScript(() =>
      localStorage.setItem('quote-builder-revisions-v1', '{'),
    );
    await corrupt.goto(process.env.QUOTE_TEST_URL || 'http://localhost:8604');
    await corrupt
      .getByRole('button', { name: 'Save draft', exact: true })
      .click();
    await corrupt.getByText('Saved revision history', { exact: true }).click();
    await corrupt
      .getByRole('button', { name: 'Capture saved quote', exact: true })
      .click();
    await corrupt
      .getByText('Revision changes are only in this session.', { exact: false })
      .waitFor();
    assert.equal(
      await corrupt.evaluate(() =>
        localStorage.getItem('quote-builder-revisions-v1'),
      ),
      '{',
    );
    await corrupt.close();
    const unavailable = await browser.newPage();
    unavailable.on('pageerror', (error) => errors.push(error.message));
    await unavailable.addInitScript(() =>
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new Error('unavailable');
        },
      }),
    );
    await unavailable.goto(
      process.env.QUOTE_TEST_URL || 'http://localhost:8604',
    );
    await unavailable.getByLabel('Quote name', { exact: true }).waitFor();
    await unavailable
      .getByText('Saved revision history', { exact: true })
      .click();
    await unavailable
      .getByText('Revision storage could not be read.', { exact: false })
      .waitFor();
    await unavailable.close();
    assert.deepEqual(errors, []);
    console.log(
      'PASS revision capture, rename, immutable restore, deleted-source recovery, export, reload and deletion',
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

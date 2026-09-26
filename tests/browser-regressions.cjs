// Run with Playwright available externally and the app listening on QUOTE_TEST_URL.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage();
    page.on('dialog', (dialog) => dialog.accept());
    await page.goto(process.env.QUOTE_TEST_URL || 'http://localhost:8504');
    await page.getByRole('button', { name: 'Save draft', exact: true }).click();
    await page.evaluate(() => {
      window.restoreStorage = Storage.prototype.setItem;
      Storage.prototype.setItem = function () {
        throw new Error('full');
      };
    });
    await page.getByLabel('Quote name', { exact: true }).fill('Session quote');
    await page.getByRole('button', { name: 'Save draft', exact: true }).click();
    assert(
      (await page.getByRole('status').first().textContent()).includes(
        'session only'
      )
    );
    const unloadBlocked = () =>
      page.evaluate(
        () =>
          !window.dispatchEvent(new Event('beforeunload', { cancelable: true }))
      );
    assert(await unloadBlocked());
    await page.evaluate(() => {
      Storage.prototype.setItem = window.restoreStorage;
    });
    await page
      .getByRole('button', { name: 'Delete draft', exact: true })
      .click();
    await page
      .getByRole('status')
      .first()
      .filter({ hasText: 'Draft deleted.' })
      .waitFor();
    assert.equal(await unloadBlocked(), false);
    assert.deepEqual(
      await page.evaluate(
        () => JSON.parse(localStorage.getItem('quote-builder-drafts-v1')).drafts
      ),
      []
    );
    console.log('PASS recovered storage deletion clears unload warning');
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(process.env.QUOTE_TEST_URL || 'http://localhost:8504');
    await page
      .getByLabel('Quote name', { exact: true })
      .fill('  Padded quote  ');
    await page.getByLabel('Description', { exact: true }).fill('Service');
    await page.getByLabel('Unit price (USD)', { exact: true }).fill('10');
    await page.getByRole('button', { name: 'Add item', exact: true }).click();
    await page.getByRole('button', { name: 'Save draft', exact: true }).click();
    await page
      .getByRole('status')
      .first()
      .filter({ hasText: 'Draft saved' })
      .waitFor();
    const unloadBlocked = () =>
      page.evaluate(
        () =>
          !window.dispatchEvent(new Event('beforeunload', { cancelable: true }))
      );
    assert.equal(
      await unloadBlocked(),
      false,
      'trimmed saved name must not remain dirty'
    );
    assert.equal(
      await page.evaluate(
        () =>
          JSON.parse(localStorage.getItem('quote-builder-drafts-v1')).drafts[0]
            .name
      ),
      'Padded quote'
    );
    await page
      .getByRole('button', { name: 'Edit Service', exact: true })
      .click();
    await page.getByLabel('Description', { exact: true }).fill('');
    await page.getByLabel('Unit price (USD)', { exact: true }).fill('');
    assert(
      await page
        .getByRole('button', { name: 'Save draft', exact: true })
        .isDisabled()
    );
    assert(
      await page
        .getByRole('button', { name: 'Print quote', exact: true })
        .isDisabled()
    );
    assert(
      await unloadBlocked(),
      'cleared edit fields must retain dirty state'
    );
    let prompted = false;
    page.once('dialog', (dialog) => {
      prompted = true;
      return dialog.dismiss();
    });
    await page.getByRole('button', { name: 'New quote', exact: true }).click();
    assert(prompted, 'leaving a cleared edit must ask before discarding');
    assert(
      await page
        .getByRole('button', { name: 'Cancel line', exact: true })
        .isVisible()
    );
    await page
      .getByRole('button', { name: 'Cancel line', exact: true })
      .click();
    await page.waitForFunction(() =>
      window.dispatchEvent(new Event('beforeunload', { cancelable: true }))
    );
    assert.equal(await unloadBlocked(), false);
    console.log(
      'PASS cleared editing guards and normalized saved-name dirty state'
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

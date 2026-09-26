const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 900 },
    });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('dialog', (d) => d.accept());
    await page.goto(process.env.QUOTE_TEST_URL || 'http://localhost:8504');
    await page
      .getByLabel('Quote name', { exact: true })
      .fill('Sample website estimate');
    await page.getByLabel('Reference', { exact: true }).fill('SAMPLE-2026');
    async function add(description, quantity, price) {
      await page.getByLabel('Description', { exact: true }).fill(description);
      await page.getByLabel('Quantity', { exact: true }).fill(quantity);
      await page.getByLabel('Unit price (USD)', { exact: true }).fill(price);
      await page.getByRole('button', { name: 'Add item', exact: true }).click();
    }
    await add('Sample layout work', '2', '125');
    await add('Sample review session', '1', '75');
    await page
      .getByRole('button', {
        name: 'Duplicate line 2: Sample review session',
        exact: true,
      })
      .click();
    assert.equal(await page.locator('#quote-workspace > ul > li').count(), 3);
    await page
      .getByRole('button', { name: 'Move line 3 up', exact: true })
      .click();
    await page
      .getByRole('button', { name: 'Edit Sample layout work', exact: true })
      .click();
    await page.getByLabel('Description', { exact: true }).press('Escape');
    assert.equal(
      await page.getByLabel('Description', { exact: true }).inputValue(),
      '',
    );
    await page.getByLabel('Discount (%)').fill('10');
    await page
      .getByLabel('Quote notes')
      .fill(
        'Example project only.\nScope and timing to be agreed before work starts.',
      );
    await page.getByRole('button', { name: 'Save draft', exact: true }).click();
    await page.getByLabel('Quote name', { exact: true }).blur();
    await page.getByText('Saved revision history', { exact: true }).click();
    await page
      .getByRole('button', { name: 'Capture saved quote', exact: true })
      .click();
    await page.getByText('Saved revision history', { exact: true }).click();
    await page.screenshot({
      path: path.join(__dirname, '../docs/preview.png'),
      fullPage: true,
    });
    await page.setViewportSize({ width: 375, height: 812 });
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await page.screenshot({
      path: '/tmp/quote-builder-2026-mobile.png',
      fullPage: true,
    });
    await page.evaluate(() => {
      window.print = () => {
        window.printCalled = true;
      };
    });
    await page
      .getByRole('button', { name: 'Print quote', exact: true })
      .focus();
    await page.keyboard.press('Enter');
    assert(await page.evaluate(() => window.printCalled));
    await page.emulateMedia({ media: 'print' });
    assert(
      !(await page
        .getByRole('button', { name: 'Add item', exact: true })
        .isVisible()),
    );
    assert(
      await page
        .getByRole('heading', { name: 'Sample website estimate', exact: true })
        .isVisible(),
    );
    assert(
      await page
        .getByRole('heading', { name: 'Notes', exact: true })
        .isVisible(),
    );
    assert(await page.getByText('(10%)', { exact: true }).isVisible());
    assert.deepEqual(errors, []);
    console.log(
      'PASS duplicate/reorder, Escape, saved sample screenshot, mobile overflow, keyboard print and print-only details',
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

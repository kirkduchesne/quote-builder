const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 794, height: 1123 },
    });
    await page.goto(process.env.QUOTE_TEST_URL || 'http://localhost:8604');
    await page.getByLabel('Quote name', { exact: true }).fill('N'.repeat(80));
    await page.getByLabel('Reference', { exact: true }).fill('R'.repeat(80));
    await page.getByLabel('Description', { exact: true }).fill('D'.repeat(120));
    await page
      .getByLabel('Unit price (USD)', { exact: true })
      .fill('999999.99');
    await page.getByRole('button', { name: 'Add item', exact: true }).click();
    await page.getByLabel('Quote notes').fill('T'.repeat(1000));
    await page.getByRole('button', { name: 'Save draft', exact: true }).click();
    await page
      .getByRole('button', { name: 'Archive current draft', exact: true })
      .click();
    await page.emulateMedia({ media: 'print' });
    assert(
      await page.getByText('Service estimate', { exact: true }).isVisible(),
    );
    assert(await page.getByText('Quantity:', { exact: true }).isVisible());
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    assert(
      !(await page
        .getByRole('button', { name: 'Unarchive current draft', exact: true })
        .isVisible()),
    );
    assert(await page.getByText('Line total:', { exact: true }).isVisible());
    const heading = await page
      .getByRole('heading', { name: 'N'.repeat(80), exact: true })
      .boundingBox();
    assert(heading.x + heading.width <= 794);
    console.log(
      'PASS maximum names, references, descriptions and notes stay inside print viewport',
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

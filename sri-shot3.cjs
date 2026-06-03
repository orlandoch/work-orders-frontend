const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  
  // Login
  await page.goto('http://localhost:5174/#/login');
  await page.waitForTimeout(2000);
  await page.fill('#email', 'admin@wom.test');
  await page.fill('#pv_id_2', 'password');
  await page.click('button:has-text("Ingresar")');
  await page.waitForTimeout(3000);
  
  // Route to an invoice that has payments - no SRI found, but let's check for payments
  await page.goto('http://localhost:5174/#/invoices/20');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/tmp/invoice-20-content.png', fullPage: true });
  
  // Let's also check the invoice's HTML structure
  const bodyHtml = await page.locator('body').innerHTML();
  // Save the HTML for inspection
  require('fs').writeFileSync('/tmp/invoice-20-html.html', bodyHtml.substring(0, 10000));
  console.log('Invoice HTML saved (first 10k chars)');
  
  // Check if detailed page shows payments section
  const paySection = page.locator('text=Pagos');
  console.log(`Payments text found: ${await paySection.count()}`);
  
  // Also check mobile layout by resizing viewport
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/tmp/invoice-20-mobile.png', fullPage: true });
  console.log('Mobile screenshot: /tmp/invoice-20-mobile.png');
  
  // Go back to list view in mobile
  await page.goto('http://localhost:5174/#/invoices');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/tmp/invoices-list-mobile.png', fullPage: true });
  
  // Now check if items table desktop works
  const itemsTable = page.locator('.items-table, table.items-table');
  console.log(`Items tables: ${await itemsTable.count()}`);
  
  await browser.close();
  console.log('Done');
})();

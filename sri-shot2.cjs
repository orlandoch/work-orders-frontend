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
  
  // Go to Invoices list
  await page.goto('http://localhost:5174/#/invoices');
  await page.waitForTimeout(3000);
  
  // Take the full list screenshot
  await page.screenshot({ path: '/tmp/invoices-list-desktop.png', fullPage: true });
  console.log('Screenshot: /tmp/invoices-list-desktop.png');
  
  // Get invoice IDs visible
  const links = page.locator('a[href*="/invoices/"]');
  const count = await links.count();
  console.log(`Found ${count} invoice links`);
  
  // Try to find invoice rows in the table and get IDs
  const rows = page.locator('table tbody tr, .p-datatable-tbody tr');
  const rowCount = await rows.count();
  console.log(`Table rows: ${rowCount}`);
  
  // Navigate through visible IDs
  for (const id of [1, 2, 3, 5, 10, 15, 22, 25, 30]) {
    await page.goto(`http://localhost:5174/#/invoices/${id}`);
    await page.waitForTimeout(2000);
    const sri = page.locator('text=Documento Electrónico SRI');
    const sriCount = await sri.count();
    const payCount = await page.locator('text=Pagos').count();
    
    if (sriCount > 0 || payCount > 0) {
      console.log(`Invoice ${id}: SRI=${sriCount} Payments=${payCount}`);
      await page.screenshot({ path: `/tmp/invoice-${id}-full.png`, fullPage: true });
      
      if (sriCount > 0) {
        // Try to expand accordion
        const history = page.locator('text=Historial de Comunicación con SRI');
        if (await history.count() > 0) {
          await history.first().click();
          await page.waitForTimeout(1000);
          await page.screenshot({ path: `/tmp/invoice-${id}-sri-expanded.png` });
          console.log(`  SRI expanded screenshot taken`);
        }
      }
      
      break;
    }
  }
  
  await browser.close();
  console.log('Done');
})();

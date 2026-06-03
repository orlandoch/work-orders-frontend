const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  
  await page.goto('http://localhost:5174/#/login');
  await page.waitForTimeout(3000);
  
  await page.screenshot({ path: '/tmp/login-page.png' });
  console.log('Login page screenshot');
  
  // Take HTML snapshot to see form fields
  const html = await page.content();
  const loginInputs = await page.locator('input').all();
  console.log(`Found ${loginInputs.length} inputs`);
  for (const inp of loginInputs) {
    const name = await inp.getAttribute('name');
    const type = await inp.getAttribute('type');
    const placeholder = await inp.getAttribute('placeholder');
    const id = await inp.getAttribute('id');
    console.log(`  input: name=${name} type=${type} placeholder=${placeholder} id=${id}`);
  }
  
  // Try filling by position
  if (loginInputs.length >= 2) {
    await loginInputs[0].fill('admin@wom.test');
    await loginInputs[1].fill('password');
    
    // Click submit
    const buttons = await page.locator('button').all();
    console.log(`Found ${buttons.length} buttons`);
    for (const btn of buttons) {
      const text = await btn.textContent();
      console.log(`  button: "${text?.trim()}"`);
    }
    
    // Try clicking submit button
    if (buttons.length > 0) {
      await buttons[buttons.length - 1].click();
    }
    
    await page.waitForTimeout(4000);
  }
  
  // Check if we're still on login
  const currentUrl = page.url();
  console.log(`URL after login: ${currentUrl}`);
  
  if (currentUrl.includes('login')) {
    console.log('Login failed or no redirect');
    await page.screenshot({ path: '/tmp/login-failed.png' });
  } else {
    // Navigate to invoices
    await page.goto('http://localhost:5174/#/invoices/20');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/tmp/invoice-20-after-login.png', fullPage: true });
    
    // Find SRI
    const sri = page.locator('text=Documento Electrónico SRI');
    console.log(`SRI sections: ${await sri.count()}`);
    
    if (await sri.count() > 0) {
      await sri.first().scrollIntoViewIfNeeded();
      await page.screenshot({ path: '/tmp/invoice-20-sri-view.png' });
      
      const history = page.locator('text=Historial de Comunicación con SRI');
      console.log(`History accordions: ${await history.count()}`);
      if (await history.count() > 0) {
        await history.first().click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: '/tmp/invoice-20-sri-expanded.png' });
      }
    }
    
    // Also screenshot the list page for desktop
    await page.goto('http://localhost:5174/#/invoices');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/tmp/invoices-list-desktop.png', fullPage: true });
  }
  
  await browser.close();
  console.log('Complete');
})();

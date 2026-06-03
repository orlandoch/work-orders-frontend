const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });

  // ==================== DESKTOP TEST ====================
  const page = await context.newPage();
  
  // Login
  await page.goto('http://localhost:5174/#/login');
  await page.waitForTimeout(2000);
  await page.fill('#email', 'admin@wom.test');
  await page.fill('#pv_id_2', 'password');
  await page.click('button:has-text("Ingresar")');
  await page.waitForTimeout(3000);
  
  // Go to an invoice that exists
  await page.goto('http://localhost:5174/#/invoices/1');
  await page.waitForTimeout(3000);
  
  // Check what we have
  const body = page.locator('body');
  const text = await body.textContent();
  
  if (text?.includes('Cargando') || text?.includes('404') || text?.includes('No encontrada')) {
    await page.goto('http://localhost:5174/#/invoices/20');
    await page.waitForTimeout(3000);
  }
  
  // Now inject mock SRI data via the page console
  await page.evaluate(() => {
    // The Vue app should be mounted - we can find and modify the reactive state
    // But first, let's just inject HTML to see how the SRI section would render
    // Actually, let's look at the rendered HTML structure
    console.log('Document HTML:', document.querySelector('#app')?.innerHTML?.substring(0, 500));
  });
  
  // Take a screenshot anyway
  await page.screenshot({ path: '/tmp/invoice-1-desktop.png', fullPage: true });
  
  // ==================== TEST SRI LOG SECTION OVERFLOW (DESKTOP) ====================
  // Let's create a standalone test page that mimics the SRI logs DataTable
  await page.goto('about:blank');
  await page.setContent(`
    <div style="max-width: 800px; margin: 20px auto; font-family: system-ui;">
      <div style="border: 1px solid #ccc; border-radius: 8px; padding: 16px;">
        <h3 style="margin:0 0 12px">Documento Electrónico SRI</h3>
        
        <div style="margin-bottom: 12px; display: flex; flex-wrap: wrap; gap: 8px;">
          <button style="padding: 4px 12px; background: #f59e0b; color: #fff; border: none; border-radius: 4px;">Reenviar al SRI</button>
          <button style="padding: 4px 12px; background: transparent; border: 1px solid #ccc; border-radius: 4px;">📋 Clave: 12345678901234567890</button>
        </div>
        
        <div style="border: 1px solid #ddd; border-radius: 6px; overflow: hidden;">
          <div style="background: #f5f5f5; padding: 10px 16px; font-size: 14px; font-weight: 600; border-bottom: 1px solid #ddd; cursor: pointer;">
            ▼ Historial de Comunicación con SRI
          </div>
          
          <!-- Scenario with overflow-x-auto -->
          <div style="overflow-x: auto; padding: 8px;">
            <table style="width: 100%; border-collapse: collapse; min-width: 440px; table-layout: auto;">
              <thead>
                <tr>
                  <th style="min-width: 140px; background: #eee; padding: 6px; text-align: left; font-size: 12px; text-transform: uppercase;">Fecha</th>
                  <th style="min-width: 100px; background: #eee; padding: 6px; text-align: left; font-size: 12px; text-transform: uppercase;">Acción</th>
                  <th style="min-width: 200px; background: #eee; padding: 6px; text-align: left; font-size: 12px; text-transform: uppercase;">Mensaje</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding: 6px; border-bottom: 1px solid #eee; white-space: nowrap; font-size: 12px;">2026-05-20 10:30:00</td>
                  <td style="padding: 6px; border-bottom: 1px solid #eee;"><span style="background: #3b82f6; color: white; padding: 2px 6px; border-radius: 4px; font-size: 11px;">Envío</span></td>
                  <td style="padding: 6px; border-bottom: 1px solid #eee; font-size: 13px; word-break: break-word; max-width: 400px;">
                    <span style="display: flex; align-items: center; gap: 4px;">
                      <span>El contribuyente con RUC 1791234567001 identificado como EMPRESA EJEMPLO S.A. no se encuentra autorizado para la emisión de comprobantes electrónicos en el ambiente de producción. Favor revisar el estado del contribuyente en el SRI. Este es un mensaje de error muy largo para probar el desbordamiento del contenido en la tabla SRI.</span>
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 6px; border-bottom: 1px solid #eee; white-space: nowrap; font-size: 12px;">2026-05-20 10:31:00</td>
                  <td style="padding: 6px; border-bottom: 1px solid #eee;"><span style="background: #22c55e; color: white; padding: 2px 6px; border-radius: 4px; font-size: 11px;">Recepción</span></td>
                  <td style="padding: 6px; border-bottom: 1px solid #eee; font-size: 13px; word-break: break-word;">
                    <span style="display: flex; align-items: center; gap: 4px;">
                      <span>✅</span>
                      <span>AUTORIZADO</span>
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <div style="margin-top: 8px; font-size: 11px; color: #888;">
          ℹ️ Última actualización: 2026-05-20 10:31
        </div>
      </div>
    </div>
  `);
  
  await page.screenshot({ path: '/tmp/sri-sim-overflowx-auto.png' });
  console.log('Scenario A (overflow-x-auto): /tmp/sri-sim-overflowx-auto.png');
  
  // ==================== TEST 2: WITH TABLE-LAYOUT FIXED ====================
  await page.goto('about:blank');
  await page.setContent(`
    <div style="max-width: 800px; margin: 20px auto; font-family: system-ui;">
      <div style="border: 1px solid #ccc; border-radius: 8px; padding: 16px;">
        <h3 style="margin:0 0 12px">Documento Electrónico SRI</h3>
        
        <div style="margin-bottom: 12px; display: flex; flex-wrap: wrap; gap: 8px;">
          <button style="padding: 4px 12px; background: #f59e0b; color: #fff; border: none; border-radius: 4px;">Reenviar al SRI</button>
          <button style="padding: 4px 12px; background: transparent; border: 1px solid #ccc; border-radius: 4px;">📋 Clave: 12345678901234567890</button>
        </div>
        
        <div style="border: 1px solid #ddd; border-radius: 6px; overflow: hidden;">
          <div style="background: #f5f5f5; padding: 10px 16px; font-size: 14px; font-weight: 600; border-bottom: 1px solid #ddd; cursor: pointer;">
            ▼ Historial de Comunicación con SRI
          </div>
          
          <!-- NO overflow-x-auto, just table-layout fixed -->
          <div style="padding: 8px;">
            <table style="width: 100%; border-collapse: collapse; table-layout: fixed;">
              <colgroup>
                <col style="width: 130px">
                <col style="width: 80px">
                <col>
              </colgroup>
              <thead>
                <tr>
                  <th style="background: #eee; padding: 6px; text-align: left; font-size: 12px; text-transform: uppercase;">Fecha</th>
                  <th style="background: #eee; padding: 6px; text-align: left; font-size: 12px; text-transform: uppercase;">Acción</th>
                  <th style="background: #eee; padding: 6px; text-align: left; font-size: 12px; text-transform: uppercase;">Mensaje</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding: 6px; border-bottom: 1px solid #eee; white-space: nowrap; font-size: 12px;">2026-05-20 10:30:00</td>
                  <td style="padding: 6px; border-bottom: 1px solid #eee;"><span style="background: #3b82f6; color: white; padding: 2px 6px; border-radius: 4px; font-size: 11px;">Envío</span></td>
                  <td style="padding: 6px; border-bottom: 1px solid #eee; font-size: 13px; word-break: break-word;">
                    <span style="display: flex; align-items: center; gap: 4px;">
                      <span>El contribuyente con RUC 1791234567001 identificado como EMPRESA EJEMPLO S.A. no se encuentra autorizado para la emisión de comprobantes electrónicos en el ambiente de producción. Favor revisar el estado del contribuyente en el SRI. Este es un mensaje de error muy largo para probar el desbordamiento del contenido en la tabla SRI.</span>
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 6px; border-bottom: 1px solid #eee; white-space: nowrap; font-size: 12px;">2026-05-20 10:31:00</td>
                  <td style="padding: 6px; border-bottom: 1px solid #eee;"><span style="background: #22c55e; color: white; padding: 2px 6px; border-radius: 4px; font-size: 11px;">Recepción</span></td>
                  <td style="padding: 6px; border-bottom: 1px solid #eee; font-size: 13px; word-break: break-word;">
                    <span style="display: flex; align-items: center; gap: 4px;">
                      <span>✅</span>
                      <span>AUTORIZADO</span>
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <div style="margin-top: 8px; font-size: 11px; color: #888;">
          ℹ️ Última actualización: 2026-05-20 10:31
        </div>
      </div>
    </div>
  `);
  
  await page.screenshot({ path: '/tmp/sri-sim-table-layout-fixed.png' });
  console.log('Scenario B (table-layout fixed): /tmp/sri-sim-table-layout-fixed.png');
  
  await browser.close();
  console.log('Done');
})();

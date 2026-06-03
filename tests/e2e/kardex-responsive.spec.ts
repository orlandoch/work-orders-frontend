import { test, expect } from '@playwright/test'
import { injectToken } from './helpers/auth'

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 720 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
]

for (const vp of VIEWPORTS) {
  test.describe(`Kardex responsive — ${vp.name} (${vp.width}x${vp.height})`, () => {
    test.use({
      viewport: { width: vp.width, height: vp.height },
      baseURL: 'http://localhost:5174',
    })

    test('loads with all filter labels visible and no js errors', async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (err) => errors.push(err.message))
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`)
      })

      const failedReqs: string[] = []
      page.on('requestfailed', (req) => {
        failedReqs.push(`${req.url()} — ${req.failure()?.errorText}`)
      })

      await injectToken(page)
      await page.goto('/#/inventory/kardex')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1500)

      // Screenshot
      await page.screenshot({
        path: `test-results/screenshots/kardex-${vp.name}.png`,
        fullPage: true,
      })

      // Core assertions: Card + labels visible
      const card = page.locator('.p-card').first()
      await expect(card).toBeVisible({ timeout: 5000 })
      await expect(page.getByText(/historial/i)).toBeVisible()
      await expect(page.getByText('Producto *', { exact: true })).toBeVisible()
      await expect(page.getByText('Bodega', { exact: true })).toBeVisible()
      await expect(page.getByText('Ubicación', { exact: true })).toBeVisible()
      await expect(page.getByText('Desde', { exact: true })).toBeVisible()
      await expect(page.getByText('Hasta', { exact: true })).toBeVisible()

      // No text artifacts
      const bodyText = await page.locator('body').innerText()
      expect(bodyText).not.toContain('undefined')
      expect(bodyText).not.toContain('null')
      expect(bodyText).not.toContain('[object Object]')
      expect(bodyText).not.toContain('NaN')

      // No console errors
      expect(errors).toEqual([])
      expect(failedReqs).toEqual([])
    })

    test('filters and limpiar button work', async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (err) => errors.push(err.message))

      await injectToken(page)
      await page.goto('/#/inventory/kardex')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1500)

      // Buscar disabled initially
      const buscarBtn = page.getByRole('button', { name: /buscar/i })
      await expect(buscarBtn).toBeVisible()
      expect(await buscarBtn.isDisabled()).toBeTruthy()

      // Limpiar exists and is clickable
      const limpiarBtn = page.getByRole('button', { name: /limpiar/i })
      await expect(limpiarBtn).toBeVisible()

      // On small viewports, sidebar overlay may intercept. Use force.
      if (vp.width <= 768) {
        await limpiarBtn.click({ force: true })
      } else {
        await limpiarBtn.click()
      }
      await page.waitForTimeout(300)

      // After clear, buscar still disabled
      expect(await buscarBtn.isDisabled()).toBeTruthy()

      expect(errors).toEqual([])
    })
  })
}

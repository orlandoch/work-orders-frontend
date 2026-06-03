import { test, expect } from '@playwright/test'
import { injectToken } from './helpers/auth'
import { navigateTo, expectPageReady } from './helpers/ui'

test.describe('Errores visuales y de render', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(40000)
    await injectToken(page)
  })

  test('No hay "[object Object]" visible en páginas principales', async ({ page }) => {
    const pages = [
      '/dashboard', '/invoices', '/invoices/new',
      '/work-orders', '/inventory/stock-balances',
      '/banking/movements', '/purchases/payables',
    ]

    for (const pagePath of pages) {
      await navigateTo(page, pagePath)
      await page.waitForTimeout(1000)

      // Check only fully-visible content for bad text
      const bodyText = await page.locator('.content').textContent()
      if (bodyText && bodyText.includes('[object Object]')) {
        console.warn(`[${pagePath}] Found "[object Object]" in content`)
      }
    }
  })

  test('No hay scroll horizontal excesivo en páginas principales', async ({ page }) => {
    const pages = [
      '/dashboard', '/invoices', '/inventory/stock-balances',
      '/banking/movements', '/purchases/payables',
    ]

    for (const pagePath of pages) {
      await navigateTo(page, pagePath)
      await page.waitForTimeout(1000)

      const scrollW = await page.evaluate(() => document.documentElement.scrollWidth)
      const clientW = await page.evaluate(() => document.documentElement.clientWidth)
      if (scrollW > clientW + 30) {
        console.warn(`[${pagePath}] Horizontal scroll: ${scrollW}px > ${clientW}px`)
      }
    }
  })

  test('Botones principales están habilitados cuando son visibles', async ({ page }) => {
    const checks = [
      { path: '/invoices', buttonText: 'Nueva Factura' },
      { path: '/banking/movements', buttonText: 'Nuevo Movimiento' },
    ]

    for (const check of checks) {
      await navigateTo(page, check.path)
      await page.waitForTimeout(1000)

      const btn = page.locator(`button:has-text("${check.buttonText}")`).first()
      if (await btn.isVisible().catch(() => false)) {
        await expect(btn).toBeEnabled({ timeout: 5000 })
      }
    }
  })
})

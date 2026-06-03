import { test, expect } from '@playwright/test'
import { login } from './helpers/auth'

const mobileRoutes = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/invoices', label: 'Facturas' },
  { path: '/invoices/new', label: 'Nueva Factura' },
  { path: '/inventory/kardex', label: 'Kardex' },
  { path: '/inventory/stock-balances', label: 'Saldos Stock' },
  { path: '/inventory/adjustments/create', label: 'Ajustes' },
  { path: '/purchases/receipts/create', label: 'Recepción Compra' },
  { path: '/banking/accounts', label: 'Cuentas Bancarias' },
  { path: '/banking/movements', label: 'Movimientos Bancarios' },
  { path: '/banking/movements/create', label: 'Nuevo Movimiento' },
  { path: '/banking/reconciliations', label: 'Conciliaciones' },
]

test.describe('Mobile smoke test (390×844)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await login(page)
  })

  for (const route of mobileRoutes) {
    test(`${route.path} — carga sin overflow`, async ({ page }) => {
      await page.goto(route.path)
      await page.waitForLoadState('networkidle')

      // Not a blank page
      await expect(page.locator('.main-content')).toBeVisible()
      await expect(page.locator('.topbar')).toBeVisible()

      // Title in topbar
      const title = page.locator('.topbar h2')
      await expect(title).toBeVisible()

      // No horizontal overflow
      const hasOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth
      )
      expect(hasOverflow).toBe(false)

      // No critical console errors
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      const seriousErrors = errors.filter(e =>
        !e.includes('favicon') &&
        !e.includes('Failed to load resource: the server responded with a status of 404')
      )
      expect(seriousErrors.length).toBe(0)
    })
  }
})

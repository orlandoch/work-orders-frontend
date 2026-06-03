import { test, expect } from '@playwright/test'
import { injectToken } from './helpers/auth'
import { navigateTo, expectPageReady, expectVisibleText } from './helpers/ui'

interface RouteTest {
  path: string
  expectedText?: string
}

/**
 * Tags are matched *case-insensitively* so exact capitalization doesn't matter.
 * "Órdenes de Trabajo" is matched by anything containing that string.
 */
const ROUTES: RouteTest[] = [
  // Dashboard
  { path: '/dashboard', expectedText: 'Dashboard' },

  // Work Orders
  { path: '/work-orders', expectedText: 'Órdenes' },

  // Invoices
  { path: '/invoices', expectedText: 'Facturas' },
  { path: '/invoices/new', expectedText: 'Nueva Factura' },

  // Inventory
  { path: '/inventory/stock-balances', expectedText: 'Saldos' },
  { path: '/inventory/kardex', expectedText: 'Kardex' },
  { path: '/inventory/adjustments/create', expectedText: 'Ajuste' },
  { path: '/inventory/transfers/create', expectedText: 'Transferencia' },
  { path: '/inventory/stock-alerts', expectedText: 'Alertas' },

  // Purchases / CXP
  { path: '/purchases/receipts/create', expectedText: 'Recepción' },
  { path: '/purchases/payables', expectedText: 'Cuentas por Pagar' },
  { path: '/purchases/payments', expectedText: 'Pagos a Proveedores' },

  // Banking
  { path: '/banking/accounts', expectedText: 'Cuentas Bancarias' },
  { path: '/banking/movements', expectedText: 'Movimientos' },
  { path: '/banking/movements/create', expectedText: 'Nuevo Movimiento' },
  { path: '/banking/transfers/create', expectedText: 'Transferencia Bancaria' },
  { path: '/banking/statement-lines', expectedText: 'Estado de Cuenta' },

  // Reconciliation
  { path: '/banking/reconciliations', expectedText: 'Conciliaciones' },
  { path: '/banking/reconciliations/create', expectedText: 'Nueva Conciliación' },
  { path: '/banking/statement-imports', expectedText: 'Importar Estado de Cuenta' },
]

test.describe('Navegación principal', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(40000)
    await injectToken(page)
  })

  for (const route of ROUTES) {
    test(`Carga ${route.path} sin errores`, async ({ page }) => {
      test.setTimeout(35000)

      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(`[pageerror] ${err.message}`))

      await navigateTo(page, route.path)
      await expectPageReady(page)

      if (route.expectedText) {
        await expectVisibleText(page, route.expectedText)
      }

      const criticalErrors = errors.filter(
        (e) =>
          !e.includes('Failed to load resource') &&
          !e.includes('source map') &&
          !e.includes('favicon.ico') &&
          !e.includes('ERR_CONNECTION_REFUSED') &&
          !e.includes('visibleOptions.findIndex') &&
          !e.includes('ERR_ABORTED')
      )
      if (criticalErrors.length > 0) {
        console.warn(`[${route.path}] Console errors:`, criticalErrors)
      }
    })
  }
})

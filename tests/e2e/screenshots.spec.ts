import { test } from '@playwright/test'
import { injectToken } from './helpers/auth'
import { navigateTo, takeDebugScreenshot } from './helpers/ui'

test.describe('Screenshots de páginas principales', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(40000)
    await injectToken(page)
  })

  const pages = [
    { name: 'dashboard', path: '/dashboard' },
    { name: 'work-orders', path: '/work-orders' },
    { name: 'invoices-list', path: '/invoices' },
    { name: 'invoice-new', path: '/invoices/new' },
    { name: 'stock-balances', path: '/inventory/stock-balances' },
    { name: 'kardex', path: '/inventory/kardex' },
    { name: 'adjustment-create', path: '/inventory/adjustments/create' },
    { name: 'transfer-create', path: '/inventory/transfers/create' },
    { name: 'stock-alerts', path: '/inventory/stock-alerts' },
    { name: 'receipt-create', path: '/purchases/receipts/create' },
    { name: 'payables', path: '/purchases/payables' },
    { name: 'payments', path: '/purchases/payments' },
    { name: 'bank-accounts', path: '/banking/accounts' },
    { name: 'bank-movements', path: '/banking/movements' },
    { name: 'bank-movement-create', path: '/banking/movements/create' },
    { name: 'bank-transfer-create', path: '/banking/transfers/create' },
    { name: 'statement-lines', path: '/banking/statement-lines' },
    { name: 'reconciliations', path: '/banking/reconciliations' },
    { name: 'reconciliation-create', path: '/banking/reconciliations/create' },
    { name: 'statement-imports', path: '/banking/statement-imports' },
  ]

  for (const p of pages) {
    test(`Screenshot ${p.name}`, async ({ page }) => {
      await navigateTo(page, p.path)
      await page.waitForTimeout(1500)
      await takeDebugScreenshot(page, p.name)
    })
  }
})

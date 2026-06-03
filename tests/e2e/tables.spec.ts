import { test, expect } from '@playwright/test'
import { injectToken } from './helpers/auth'
import { navigateTo, expectPageReady } from './helpers/ui'

test.describe('Tablas y detalle', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(40000)
    await injectToken(page)
  })

  test('Listado de Facturas — DataTable visible', async ({ page }) => {
    await navigateTo(page, '/invoices')
    await expectPageReady(page)

    // Look for any PrimeVue DataTable
    const table = page.locator('.p-datatable-wrapper, .p-datatable table, table, .p-dataview')
    await expect(table.first()).toBeVisible({ timeout: 5000 })
  })

  test('Saldos de Inventario — DataTable visible', async ({ page }) => {
    await navigateTo(page, '/inventory/stock-balances')
    await expectPageReady(page)

    const table = page.locator('.p-datatable-wrapper, .p-datatable table, table')
    await expect(table.first()).toBeVisible({ timeout: 5000 })
  })

  test('Kardex — DataTable visible', async ({ page }) => {
    await navigateTo(page, '/inventory/kardex')
    await expectPageReady(page)

    const table = page.locator('.p-datatable-wrapper, .p-datatable table, table')
    await expect(table.first()).toBeVisible({ timeout: 5000 })
  })

  test('Cuentas por Pagar — DataTable visible', async ({ page }) => {
    await navigateTo(page, '/purchases/payables')
    await expectPageReady(page)

    const table = page.locator('.p-datatable-wrapper, .p-datatable table, table')
    await expect(table.first()).toBeVisible({ timeout: 5000 })
  })

  test('Pagos a Proveedores — DataTable visible', async ({ page }) => {
    await navigateTo(page, '/purchases/payments')
    await expectPageReady(page)

    const table = page.locator('.p-datatable-wrapper, .p-datatable table, table')
    await expect(table.first()).toBeVisible({ timeout: 5000 })
  })

  test('Movimientos Bancarios — DataTable visible', async ({ page }) => {
    await navigateTo(page, '/banking/movements')
    await expectPageReady(page)

    const table = page.locator('.p-datatable-wrapper, .p-datatable table, table')
    await expect(table.first()).toBeVisible({ timeout: 5000 })
  })

  test('Conciliaciones — DataTable visible', async ({ page }) => {
    await navigateTo(page, '/banking/reconciliations')
    await expectPageReady(page)

    const table = page.locator('.p-datatable-wrapper, .p-datatable table, table')
    await expect(table.first()).toBeVisible({ timeout: 5000 })
  })
})

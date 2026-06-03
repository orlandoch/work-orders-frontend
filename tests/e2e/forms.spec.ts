import { test, expect } from '@playwright/test'
import { injectToken } from './helpers/auth'
import { navigateTo, expectPageReady } from './helpers/ui'

test.describe('Formularios principales', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(40000)
    await injectToken(page)
  })

  test('Nueva Factura — página renderiza', async ({ page }) => {
    await navigateTo(page, '/invoices/new')
    await expectPageReady(page)

    // The page header should show the title
    const title = page.locator('.topbar h2')
    await expect(title).toBeVisible({ timeout: 5000 })

    // Page should have at least one input-like element (form or table)
    const inputs = page.locator('input, .p-inputnumber-input, select, .p-dropdown, textarea')
    await expect(inputs.first()).toBeAttached({ timeout: 5000 })
    const inputCount = await inputs.count()
    expect(inputCount).toBeGreaterThan(0)
  })

  test('Ajuste de Inventario — página renderiza', async ({ page }) => {
    await navigateTo(page, '/inventory/adjustments/create')
    await expectPageReady(page)

    const title = page.locator('.topbar h2')
    await expect(title).toBeVisible({ timeout: 5000 })

    const inputs = page.locator('input, .p-inputnumber-input, select, .p-dropdown, textarea')
    await expect(inputs.first()).toBeAttached({ timeout: 5000 })
    const inputCount = await inputs.count()
    expect(inputCount).toBeGreaterThan(0)
  })

  test('Transferencia de Inventario — página renderiza', async ({ page }) => {
    await navigateTo(page, '/inventory/transfers/create')
    await expectPageReady(page)

    const title = page.locator('.topbar h2')
    await expect(title).toBeVisible({ timeout: 5000 })

    const inputs = page.locator('input, .p-inputnumber-input, select, .p-dropdown, textarea')
    await expect(inputs.first()).toBeAttached({ timeout: 5000 })
    const inputCount = await inputs.count()
    expect(inputCount).toBeGreaterThan(0)
  })

  test('Recepción de Compra — página renderiza', async ({ page }) => {
    await navigateTo(page, '/purchases/receipts/create')
    await expectPageReady(page)

    const title = page.locator('.topbar h2')
    await expect(title).toBeVisible({ timeout: 5000 })

    const inputs = page.locator('input, .p-inputnumber-input, select, .p-dropdown, textarea')
    await expect(inputs.first()).toBeAttached({ timeout: 5000 })
    const inputCount = await inputs.count()
    expect(inputCount).toBeGreaterThan(0)
  })

  test('Movimiento Bancario — página renderiza', async ({ page }) => {
    await navigateTo(page, '/banking/movements/create')
    await expectPageReady(page)

    const title = page.locator('.topbar h2')
    await expect(title).toBeVisible({ timeout: 5000 })

    const inputs = page.locator('input, .p-inputnumber-input, select, .p-dropdown, textarea')
    await expect(inputs.first()).toBeAttached({ timeout: 5000 })
    const inputCount = await inputs.count()
    expect(inputCount).toBeGreaterThan(0)
  })

  test('Transferencia Bancaria — página renderiza', async ({ page }) => {
    await navigateTo(page, '/banking/transfers/create')
    await expectPageReady(page)

    const title = page.locator('.topbar h2')
    await expect(title).toBeVisible({ timeout: 5000 })

    const inputs = page.locator('input, .p-inputnumber-input, select, .p-dropdown, textarea')
    await expect(inputs.first()).toBeAttached({ timeout: 5000 })
    const inputCount = await inputs.count()
    expect(inputCount).toBeGreaterThan(0)
  })

  test('Nueva Conciliación — página renderiza', async ({ page }) => {
    await navigateTo(page, '/banking/reconciliations/create')
    await expectPageReady(page)

    const title = page.locator('.topbar h2')
    await expect(title).toBeVisible({ timeout: 5000 })

    const inputs = page.locator('input, .p-inputnumber-input, select, .p-dropdown, textarea')
    await expect(inputs.first()).toBeAttached({ timeout: 5000 })
    const inputCount = await inputs.count()
    expect(inputCount).toBeGreaterThan(0)
  })

  test('Importar Estado de Cuenta — página renderiza', async ({ page }) => {
    await navigateTo(page, '/banking/statement-imports')
    await expectPageReady(page)

    const title = page.locator('.topbar h2')
    await expect(title).toBeVisible({ timeout: 5000 })

    const inputs = page.locator('input, .p-inputnumber-input, select, .p-dropdown, .p-fileupload')
    await expect(inputs.first()).toBeAttached({ timeout: 5000 })
    const inputCount = await inputs.count()
    expect(inputCount).toBeGreaterThan(0)
  })
})

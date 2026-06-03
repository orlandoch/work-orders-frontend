import { test, expect } from '@playwright/test'
import { login } from './helpers/auth'

test.describe('MainLayout - Responsive layout global', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('Desktop 1280×720 — sidebar visible, colapsable, sin overflow', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Sidebar visible
    await expect(page.locator('.sidebar')).toBeVisible()

    // Main content starts at margin-left (expanded = 260px)
    const main = page.locator('.main-content')
    await expect(main).toBeVisible()

    // No horizontal overflow
    const overflowW = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
    expect(overflowW).toBe(true)

    // Collapse sidebar
    await page.locator('.toggle-btn').click()
    await page.waitForTimeout(300)
    // Still visible, just thinner
    await expect(page.locator('.sidebar')).toBeVisible()
    // No overflow after collapse
    const overflowAfter = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
    expect(overflowAfter).toBe(true)
  })

  test('Tablet 768×1024 — sidebar colapsado, sin overflow', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Sidebar thinner (always collapsed on tablet)
    const sidebar = page.locator('.sidebar')
    await expect(sidebar).toBeVisible()

    // No horizontal overflow
    const overflowW = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
    expect(overflowW).toBe(true)
  })

  test('Mobile 390×844 — sidebar oculto, hamburger, drawer funcional', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Sidebar desktop hidden
    await expect(page.locator('.sidebar')).not.toBeVisible()

    // Hamburger visible
    const hamburger = page.locator('.hamburger-btn')
    await expect(hamburger).toBeVisible()

    // No horizontal overflow
    const overflowW = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
    expect(overflowW).toBe(true)

    // Drawer opens on hamburger click
    await hamburger.click()
    await page.waitForTimeout(300)
    await expect(page.locator('.mobile-drawer')).toBeVisible()

    // Expandir grupo Inventario primero
    await page.locator('.drawer-group-header').filter({ hasText: 'Inventario' }).click()
    await page.waitForTimeout(200)

    // Navegar desde el drawer — Kardex
    const kardexLink = page.locator('.drawer-item').filter({ hasText: 'Kardex' })
    await expect(kardexLink).toBeVisible()
    await kardexLink.click()
    await page.waitForLoadState('networkidle')

    // Drawer should close after navigation
    await expect(page.locator('.mobile-drawer')).not.toBeVisible()

    // No overflow on kardex
    const overflowKardex = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
    expect(overflowKardex).toBe(true)
    expect(page.url()).toContain('/inventory/kardex')

    // Abrir drawer de nuevo y navegar a Facturación → Facturas
    await page.locator('.hamburger-btn').click()
    await page.waitForTimeout(300)
    // Expandir grupo Facturación
    await page.locator('.drawer-group-header').filter({ hasText: 'Facturación' }).click()
    await page.waitForTimeout(200)
    const facturasLink = page.locator('.drawer-item').filter({ hasText: 'Facturas' })
    await expect(facturasLink).toBeVisible()
    await facturasLink.click()
    await page.waitForLoadState('networkidle')
    await expect(page.locator('.mobile-drawer')).not.toBeVisible()

    // No overflow
    const overflowFacturas = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
    expect(overflowFacturas).toBe(true)
    expect(page.url()).toContain('/invoices')
  })
})

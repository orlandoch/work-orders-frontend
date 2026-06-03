import { test } from '@playwright/test'
import { login } from './helpers/auth'

async function screenshot(page: any, name: string) {
  await page.screenshot({ path: `tests/e2e/screenshots/${name}`, fullPage: false })
}

test.describe('Layout screenshots', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('layout-desktop-expanded', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await screenshot(page, 'layout-desktop-expanded.png')
  })

  test('layout-desktop-collapsed', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await page.locator('.toggle-btn').click()
    await page.waitForTimeout(300)
    await screenshot(page, 'layout-desktop-collapsed.png')
  })

  test('layout-tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await screenshot(page, 'layout-tablet.png')
  })

  test('layout-mobile-closed', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await screenshot(page, 'layout-mobile-closed.png')
  })

  test('layout-mobile-drawer', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await page.locator('.hamburger-btn').click()
    await page.waitForTimeout(400)
    await screenshot(page, 'layout-mobile-drawer.png')
  })

  test('layout-mobile-kardex', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/inventory/kardex')
    await page.waitForLoadState('networkidle')
    await screenshot(page, 'layout-mobile-kardex.png')
  })

  test('mobile-dashboard', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await screenshot(page, 'mobile-dashboard.png')
  })

  test('mobile-invoices', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/invoices')
    await page.waitForLoadState('networkidle')
    await screenshot(page, 'mobile-invoices.png')
  })

  test('mobile-banking-movements', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/banking/movements')
    await page.waitForLoadState('networkidle')
    await screenshot(page, 'mobile-banking-movements.png')
  })
})

import { test, expect } from '@playwright/test'

/**
 * Helper: set up mock auth via route interception.
 * API calls through Vite proxy (/api/*) are intercepted and return fake data.
 * Source files (/src/api/) are excluded.
 */
async function setupMobileAuth(page: any) {
  await page.setViewportSize({ width: 390, height: 844 })

  // Intercept backend API calls through Vite proxy
  await page.route(
    (url) => url.href.includes('/api/') && !url.href.includes('/src/api/'),
    async (route) => {
      const reqUrl = route.request().url()
      const method = route.request().method()

      if (reqUrl.includes('/api/me')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { id: 999, name: 'E2E Test', email: 'e2e@test.com', token: 'e2e-dummy-token', all_permissions: ['*'] },
          }),
        })
        return
      }
      if (reqUrl.includes('/api/login')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { id: 999, name: 'E2E Test', email: 'e2e@test.com', token: 'e2e-dummy-token' },
          }),
        })
        return
      }
      if (method === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [], meta: { total: 0 } }) })
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: {} }) })
      }
    }
  )

  // Navigate to app — will land on login since no token yet
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(300)

  // Inject auth data with proper permissions upfront
  // IMPORTANT: set permissions BEFORE reload so Vue reads them on mount
  // hasPermission() does perms.includes(name) — exact match, so we need explicit entries
  await page.evaluate(() => {
    localStorage.setItem('token', 'e2e-dummy-token')
    localStorage.setItem('user', JSON.stringify({ id: 999, name: 'E2E Test', email: 'e2e@test.com', roles: [] }))
    localStorage.setItem('permissions', JSON.stringify([
      'dashboard.view',
      'work-orders.view',
      'stock.view',
      'invoices.view',
      'invoices.create',
      'purchases.view',
      'banking.view',
      'banking.create',
      'banking.edit',
      'reports.view',
      'admin.view',
      'roles.view',
      'users.view',
    ]))
  })

  // Reload — now /api/me will respond with success and app will route to dashboard
  await page.reload()
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(500)
}

test.describe('Mobile drawer apariencia (390×844)', () => {
  test.beforeEach(async ({ page }) => {
    await setupMobileAuth(page)
  })

  test('Drawer se ve full-screen oscuro sin bordes blancos', async ({ page }) => {
    const hamburger = page.locator('.hamburger-btn')
    await expect(hamburger).toBeVisible({ timeout: 10000 })

    // Click hamburger → drawer opens
    await hamburger.click()
    await page.waitForTimeout(400)

    // Drawer visible
    const drawer = page.locator('.p-drawer.mobile-drawer')
    await expect(drawer).toBeVisible()

    // 1. Drawer ocupa ~100vw de ancho
    const drawerBox = await drawer.boundingBox()
    expect(drawerBox).not.toBeNull()
    expect(drawerBox!.width).toBeGreaterThanOrEqual(388)

    // 2. Drawer empieza en x=0 (pega al borde izquierdo)
    expect(drawerBox!.x).toBeCloseTo(0, 0)

    // 3. Drawer ocupa alto completo
    expect(drawerBox!.height).toBeGreaterThanOrEqual(800)

    // 4. Fondo oscuro del drawer raíz
    const bg = await drawer.evaluate(el => getComputedStyle(el).backgroundColor)
    expect(bg).toBe('rgb(30, 41, 59)')

    // 5. Fondo oscuro del contenido
    const content = drawer.locator('.p-drawer-content')
    const contentBg = await content.evaluate(el => getComputedStyle(el).backgroundColor)
    expect(contentBg).toBe('rgb(30, 41, 59)')

    // 6. Sin padding en el content
    const contentPadding = await content.evaluate(el => getComputedStyle(el).padding)
    expect(contentPadding).toBe('0px')

    // 7. Header oculto (display: none via CSS)
    const headerDisplay = await page.evaluate(() => {
      const h = document.querySelector('.p-drawer.mobile-drawer .p-drawer-header')
      if (!h) return 'not-found'
      return window.getComputedStyle(h).display
    })
    expect(headerDisplay).toBe('none')

    // 8. Nav visible
    const drawerNav = page.locator('.drawer-nav')
    await expect(drawerNav).toBeVisible()

    // 9. Sin overflow horizontal global
    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
    expect(hasOverflow).toBe(false)

    // 10. Primer grupo visible sin scroll
    const firstGroup = drawerNav.locator('.drawer-group-header').first()
    await expect(firstGroup).toBeVisible()
  })

  test('Navegación desde drawer y reapertura', async ({ page }) => {
    const hamburger = page.locator('.hamburger-btn')
    await expect(hamburger).toBeVisible({ timeout: 10000 })
    await hamburger.click()
    await page.waitForTimeout(400)

    // Expandir Inventario
    await page.locator('.drawer-group-header').filter({ hasText: 'Inventario' }).click()
    await page.waitForTimeout(200)

    // Click Kardex
    const kardexLink = page.locator('.drawer-item').filter({ hasText: 'Kardex' })
    await expect(kardexLink).toBeVisible()
    await kardexLink.click()
    await page.waitForTimeout(1000)

    // Drawer cerrado después de navegar
    await expect(page.locator('.p-drawer.mobile-drawer')).not.toBeVisible()
    expect(page.url()).toContain('/kardex')

    // Debug: check document state
    console.log('After nav - url:', page.url())
    const hasHb = await page.evaluate(() => !!document.querySelector('.hamburger-btn'))
    console.log('After nav - hasHamburger:', hasHb)

    // Reabrir drawer — debe seguir oscuro
    await page.locator('.hamburger-btn').click()
    await page.waitForTimeout(500)

    const drawerVisible = await page.evaluate(() => {
      const d = document.querySelector('.p-drawer.mobile-drawer')
      if (!d) return 'no-drawer-element'
      return window.getComputedStyle(d).display !== 'none'
    })
    console.log('Drawer visible after reopen:', drawerVisible)

    const drawer = page.locator('.p-drawer.mobile-drawer')
    await expect(drawer).toBeVisible()
    const bg = await drawer.evaluate(el => getComputedStyle(el).backgroundColor)
    expect(bg).toBe('rgb(30, 41, 59)')

    // Debug: check drawer content
    const groupTexts = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.drawer-group-header')).map(el => el.textContent)
    })
    console.log('All group texts:', JSON.stringify(groupTexts))

    // Expandir Facturación
    await page.locator('.drawer-group-header').filter({ hasText: 'Facturación' }).click()
    await page.waitForTimeout(200)

    // Click Facturas
    const facturasLink = page.locator('.drawer-item').filter({ hasText: 'Facturas' })
    await expect(facturasLink).toBeVisible()
    await facturasLink.click()
    await page.waitForTimeout(1000)

    // Drawer cerrado
    await expect(drawer).not.toBeVisible()
    expect(page.url()).toContain('/invoices')
  })

  test('Screenshot drawer full-screen', async ({ page }) => {
    await page.locator('.hamburger-btn').click()
    await page.waitForTimeout(400)
    await page.screenshot({ path: 'tests/e2e/screenshots/mobile-menu-fullscreen.png' })
  })

  test('Screenshot drawer con grupos expandidos', async ({ page }) => {
    await page.locator('.hamburger-btn').click()
    await page.waitForTimeout(300)

    // Expand several groups
    await page.locator('.drawer-group-header').filter({ hasText: 'Inventario' }).click()
    await page.waitForTimeout(150)
    await page.locator('.drawer-group-header').filter({ hasText: 'Facturación' }).click()
    await page.waitForTimeout(150)
    await page.locator('.drawer-group-header').filter({ hasText: 'Bancos / Caja' }).click()
    await page.waitForTimeout(150)

    await page.screenshot({ path: 'tests/e2e/screenshots/mobile-menu-groups-expanded.png' })
  })
})

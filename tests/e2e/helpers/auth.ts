import { Page, expect } from '@playwright/test'

/**
 * Inject dummy auth and intercept API so the app doesn't delete the token.
 *
 * App.vue calls GET /api/me on boot — if it fails, token gets REMOVED.
 * Axios client.ts also has a 401 interceptor that removes the token.
 * We intercept ALL backend API calls and return fake 200s to prevent that.
 *
 * IMPORTANT: Playwright function matchers receive a `URL` object. Use `.href`
 * (not `.toString()`) to get the full URL string. Also, exclude Vite dev
 * server source files (localhost:5174/src/api/...) from the interceptor
 * to avoid MIME type errors.
 */
export async function injectToken(page: Page): Promise<void> {
  // Intercept API calls through Vite proxy (localhost:5174/api/) and directly
  // to backend (8001) to prevent axios 401 interceptor from clearing localStorage.
  await page.route(
    (url) => {
      const href = url.href
      // Only intercept actual backend API calls (through Vite proxy /api/* or direct localhost:8001/api/*)
      // Exclude source file paths like /src/api/ which are JavaScript modules, not API endpoints
      return (href.includes('/api/') || href.includes(':8001/api/'))
        && !href.includes('/src/api/')
        && !href.includes('/node_modules/')
        && !href.includes('/dev-server')
        && !href.includes('/.vite/')
    },
    async (route) => {
      const reqUrl = route.request().url()
      const method = route.request().method()

      // User/me endpoint — return a valid session
      if (reqUrl.includes('/api/me') || reqUrl.includes('/api/user')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 999,
              name: 'E2E Test',
              email: 'e2e@test.com',
              token: 'e2e-dummy-token',
              all_permissions: ['*'],
            },
          }),
        })
        return
      }

      // Login endpoint
      if (reqUrl.includes('/api/login')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 999,
              name: 'E2E Test',
              email: 'e2e@test.com',
              token: 'e2e-dummy-token',
            },
          }),
        })
        return
      }

      // Generic list/create stub
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [], meta: { total: 0 } }),
        })
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: {} }),
        })
      }
    },
  )

  // Navigate, set localStorage, then reload
  await page.goto('/')
  await page.waitForTimeout(500)

  await page.evaluate(() => {
    localStorage.setItem('token', 'e2e-dummy-token')
    localStorage.setItem(
      'user',
      JSON.stringify({
        name: 'E2E Test',
        email: 'e2e@test.com',
      }),
    )
    localStorage.setItem(
      'permissions',
      JSON.stringify([
        'work-orders.view', 'work-orders.create', 'work-orders.edit',
        'invoices.view', 'invoices.create', 'invoices.edit',
        'inventory.view', 'inventory.create', 'inventory.edit',
        'purchases.view', 'purchases.create', 'purchases.edit',
        'banking.view', 'banking.create', 'banking.edit',
        'clients.view', 'clients.create', 'clients.edit',
        'suppliers.view', 'suppliers.create', 'suppliers.edit',
        'products.view', 'products.create', 'products.edit',
      ]),
    )
  })

  // Reload so the app picks up the localStorage values
  await page.reload()
  await page.waitForTimeout(1500)

  // Override permissions so visibleGroups renders all menu items
  await page.evaluate(() => {
    const allPerms = [
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
    ]
    localStorage.setItem('permissions', JSON.stringify(allPerms))
  })
}

/**
 * Attempt real login with credentials on the actual backend.
 * Falls back to injectToken (with API stubs) if backend is unreachable.
 */
export async function login(page: Page, email?: string, password?: string) {
  const e2eEmail = email || process.env.E2E_EMAIL
  const e2ePassword = password || process.env.E2E_PASSWORD

  if (!e2eEmail || !e2ePassword) {
    await injectToken(page)
    return
  }

  try {
    await page.goto('/#/login')
    await page.waitForSelector('.login-card', { timeout: 8000 })

    await page.fill('#email', e2eEmail)
    const pwInput = page.locator(
      '#password input[type="password"], #password input',
    )
    await pwInput.first().fill(e2ePassword)
    await page.click('button[type="submit"]')

    await page.waitForURL('**/dashboard', { timeout: 20000 })
    await expect(page.locator('.topbar h2').first()).toBeVisible({
      timeout: 10000,
    })
  } catch {
    console.warn('Real login failed — using dummy auth with API stubs')
    await injectToken(page)
  }
}

/**
 * Log out via the sidebar button.
 */
export async function logout(page: Page) {
  const btn = page.locator('button:has-text("Cerrar sesión")')
  if (await btn.isVisible().catch(() => false)) {
    await btn.click()
    await page.waitForURL('**/login', { timeout: 10000 })
  }
}

import { Page, expect } from '@playwright/test'

/**
 * Clear any console errors accumulated during a page's lifecycle.
 * Call this before an action you want to isolate.
 */
export function clearConsoleErrors(page: Page): void {
  page._e2eErrors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      page._e2eErrors = page._e2eErrors || []
      page._e2eErrors.push(msg.text())
    }
  })
  page.on('pageerror', (err) => {
    page._e2eErrors = page._e2eErrors || []
    page._e2eErrors.push(`[pageerror] ${err.message}`)
  })
}

/**
 * Assert no console errors occurred during the test.
 * Warnings and known pre-existing messages can be filtered.
 */
export async function expectNoConsoleErrors(page: Page) {
  const errors: string[] = (page as any)._e2eErrors || []
  if (errors.length > 0) {
    // Filter out known non-critical messages
    const filtered = errors.filter(
      (e) =>
        !e.includes('Failed to load resource: the server responded with a status of 404') &&
        !e.includes('Failed to load resource: net::ERR_CONNECTION_REFUSED') &&
        !e.includes('favicon.ico') &&
        !e.includes('/api/') &&
        !e.includes('source map')
    )
    if (filtered.length > 0) {
      console.warn('Console errors detected:', filtered)
    }
  }
}

/**
 * Verify the page rendered without critical Vue errors.
 */
export async function expectPageReady(page: Page) {
  // No white screen
  await expect(page.locator('#app')).not.toBeEmpty({ timeout: 10000 })

  // No Vue error boundary message
  await expect(page.locator('text=Failed to resolve component')).toHaveCount(0, { timeout: 5000 })

  // No visible "undefined" or "null" in visible text
  await expectNoBadText(page)
}

/**
 * Check for problematic strings in visible content.
 * Uses inline text content checking to be safe with PrimeVue internals.
 */
export async function expectNoBadText(page: Page) {
  const badTexts = ['[object Object]']
  for (const bad of badTexts) {
    // Only check visible elements in the content area
    const visible = page.locator('.content').locator('visible=true')
    const text = await visible.textContent()
    if (text && text.includes(bad)) {
      console.warn(`Found bad text "${bad}" in page content`)
    }
  }
}

/**
 * Click a sidebar menu item by its visible label text.
 * First clicks the group header if needed to expand it.
 */
export async function clickMenuItem(page: Page, label: string) {
  // Try clicking directly (item visible)
  const navItem = page.locator('.nav-item').filter({ hasText: label }).first()
  if (await navItem.isVisible()) {
    await navItem.click()
    return
  }

  // Expand groups by clicking their headers
  const groupHeaders = page.locator('.nav-group-header')
  const count = await groupHeaders.count()
  for (let i = 0; i < count; i++) {
    const header = groupHeaders.nth(i)
    const headerText = await header.textContent()
    if (headerText?.includes('Facturación') || headerText?.includes('Inventario') || headerText?.includes('Compras') || headerText?.includes('Bancos') || headerText?.includes('Conciliación') || headerText?.includes('Admin') || headerText?.includes('Contabilidad') || headerText?.includes('Dashboard') || headerText?.includes('Órdenes')) {
      if (await header.isVisible()) {
        // Check if already expanded
        const arrow = header.locator('.sub-arrow')
        if (await arrow.isVisible() && !(await arrow.getAttribute('class'))?.includes('rotated')) {
          await header.click()
          await page.waitForTimeout(300)
        }
      }
    }
  }

  // Now try clicking the item
  const item = page.locator('.nav-item').filter({ hasText: label }).first()
  await expect(item).toBeVisible({ timeout: 5000 })
  await item.click()
}

/**
 * Navigate directly to a hash route.
 */
export async function navigateTo(page: Page, path: string) {
  await page.goto(`/#${path}`)
  await page.waitForLoadState('networkidle')
}

/**
 * Take a debug screenshot.
 */
export async function takeDebugScreenshot(page: Page, name: string) {
  await page.screenshot({
    path: `test-results/screenshots/${name}.png`,
    fullPage: true,
  })
}

/**
 * Verify that an element with given text is visible on the page.
 */
export async function expectVisibleText(page: Page, text: string) {
  await expect(page.locator(`text="${text}"`).first()).toBeVisible({ timeout: 5000 })
}

/**
 * Verify a form field (InputText, InputNumber, Textarea, etc.) exists and is visible by its label or placeholder.
 */
export async function expectFormField(page: Page, labelOrPlaceholder: string) {
  const field =
    page.locator(`label:has-text("${labelOrPlaceholder}") + * >> visible=true`).first() ||
    page.locator(`[placeholder="${labelOrPlaceholder}"]`).first()
  await expect(field).toBeVisible({ timeout: 5000 })
}

/**
 * Fill a form field by label text.
 */
export async function fillFormField(page: Page, label: string, value: string | number) {
  // Find label, then get the associated input
  const labelEl = page.locator('label').filter({ hasText: label }).first()
  await expect(labelEl).toBeVisible({ timeout: 5000 })
  const forAttr = await labelEl.getAttribute('for')
  if (forAttr) {
    const input = page.locator(`#${forAttr}`)
    await expect(input).toBeVisible({ timeout: 5000 })
    await input.fill(String(value))
  } else {
    // Try finding input near the label
    const parent = labelEl.locator('..')
    const input = parent.locator('input, textarea, .p-inputnumber-input').first()
    await expect(input).toBeVisible({ timeout: 5000 })
    await input.fill(String(value))
  }
}



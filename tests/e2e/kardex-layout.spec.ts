/**
 * Diagnóstico visual de la pantalla Kardex (/inventory/kardex).
 *
 * OBJETIVO: Solo diagnosticar — NO corregir nada.
 * - Simular navegación por menú lateral (mouse real)
 * - Simular interacción con filtros (producto, bodega, fechas, botón consultar)
 * - Detectar overflow, solapamientos, elementos fuera de viewport
 * - Reportar errores de consola/red
 * - Tomar screenshots en cada etapa
 */
import { test, expect, Page } from '@playwright/test'
import { injectToken } from './helpers/auth'

const SCREENSHOT_DIR = 'test-results/screenshots'

// ─── Helpers de layout ────────────────────────────────────────────

async function detectOverflow(page: Page) {
  return page.evaluate(() => {
    const dw = document.documentElement.scrollWidth
    const cw = document.documentElement.clientWidth
    const dh = document.documentElement.scrollHeight
    const ch = document.documentElement.clientHeight
    return {
      horizontalOverflow: dw > cw,
      verticalOverflow: dh > ch,
      scrollWidth: dw,
      clientWidth: cw,
      scrollHeight: dh,
      clientHeight: ch,
    }
  })
}

async function detectOverlapping(page: Page, selector: string) {
  return page.evaluate((sel) => {
    const els = document.querySelectorAll(sel)
    const boxes: { tag: string; id: string; cls: string; rect: DOMRect; text: string }[] = []
    els.forEach((el) => {
      const rect = el.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        boxes.push({
          tag: el.tagName,
          id: el.id,
          cls: el.className?.toString?.()?.substring(0, 60) || '',
          rect: { top: rect.top, left: rect.left, bottom: rect.bottom, right: rect.right, width: rect.width, height: rect.height } as any,
          text: (el as HTMLElement).innerText?.substring(0, 30) || '',
        })
      }
    })
    const overlaps: { a: string; b: string; overlapPct: number }[] = []
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i].rect as any
        const b = boxes[j].rect as any
        const overlapX = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left))
        const overlapY = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top))
        if (overlapX > 0 && overlapY > 0) {
          const overlapArea = overlapX * overlapY
          const minArea = Math.min(a.width * a.height, b.width * b.height)
          const pct = Math.round((overlapArea / minArea) * 100)
          if (pct > 10) {
            overlaps.push({
              a: `${boxes[i].tag}#${boxes[i].id}.${boxes[i].cls} "${boxes[i].text}"`,
              b: `${boxes[j].tag}#${boxes[j].id}.${boxes[j].cls} "${boxes[j].text}"`,
              overlapPct: pct,
            })
          }
        }
      }
    }
    return overlaps
  }, selector)
}

async function detectOutOfViewport(page: Page, selector: string) {
  return page.evaluate((sel) => {
    const els = document.querySelectorAll(sel)
    const out: { tag: string; id: string; cls: string; rect: any; direction: string }[] = []
    const vw = window.innerWidth
    const vh = window.innerHeight
    els.forEach((el) => {
      const rect = el.getBoundingClientRect()
      if (rect.width === 0 && rect.height === 0) return // hidden
      const dirs: string[] = []
      if (rect.left < 0) dirs.push('left')
      if (rect.top < 0) dirs.push('top')
      if (rect.right > vw) dirs.push('right')
      if (rect.bottom > vh) dirs.push('bottom')
      if (dirs.length > 0) {
        out.push({
          tag: el.tagName,
          id: el.id,
          cls: el.className?.toString?.()?.substring(0, 60) || '',
          rect: { top: rect.top, left: rect.left, bottom: rect.bottom, right: rect.right, width: rect.width, height: rect.height },
          direction: dirs.join(', '),
        })
      }
    })
    return out
  }, selector)
}

async function detectBadTexts(page: Page) {
  return page.evaluate(() => {
    const body = document.body.innerText || ''
    const found: string[] = []
    if (body.includes('undefined')) found.push('undefined')
    if (body.includes('null') && !body.includes('nullish') && !body.includes('nullable')) found.push('null')
    if (body.includes('[object Object]')) found.push('[object Object]')
    if (body.includes('NaN')) found.push('NaN')
    return found
  })
}

interface ElementReportItem {
  selector: string
  visible: boolean
  inViewport: boolean
  rect: string
  notes: string
}

async function reportElement(page: Page, label: string, selector: string): Promise<ElementReportItem> {
  const el = page.locator(selector).first()
  const visible = await el.isVisible().catch(() => false)
  if (!visible) {
    return { selector: label, visible: false, inViewport: false, rect: 'N/A', notes: 'No visible' }
  }
  const box = await el.boundingBox()
  if (!box) {
    return { selector: label, visible: true, inViewport: false, rect: 'N/A', notes: 'No boundingBox' }
  }
  const vw = 1280
  const vh = 720
  const inVp = box.x >= 0 && box.y >= 0 && box.x + box.width <= vw && box.y + box.height <= vh
  return {
    selector: label,
    visible,
    inViewport: inVp,
    rect: `(${Math.round(box.x)}, ${Math.round(box.y)}) ${Math.round(box.width)}x${Math.round(box.height)}`,
    notes: inVp ? 'OK' : `Fuera: x=${Math.round(box.x)} y=${Math.round(box.y)} right=${Math.round(box.x + box.width)} bottom=${Math.round(box.y + box.height)} (vw=${vw} vh=${vh})`,
  }
}

// ─── ELEMENTOS A INSPECCIONAR ─────────────────────────────────────

const KARDEX_ELEMENTS = [
  { label: 'Contenedor principal', selector: '.kardex-page, [class*="kardex"], .p-dataview, main, .layout-main, .main-content' },
  { label: 'Título', selector: '.topbar h2, h2, h1' },
  { label: 'Filtros contenedor', selector: '.kardex-filters, .filters, [class*="filter"], .p-toolbar, .flex.gap-2, .flex-wrap' },
  { label: 'Selector producto', selector: '[id*="product"], [aria-label*="producto" i], .p-select, [class*="producto"]' },
  { label: 'Selector bodega', selector: '[id*="warehouse"], [id*="bodega"], [aria-label*="bodega" i], [aria-label*="warehouse" i]' },
  { label: 'Fecha desde', selector: '[id*="date-from"], [id*="fecha_desde"], [aria-label*="desde" i], .p-datepicker' },
  { label: 'Fecha hasta', selector: '[id*="date-to"], [id*="fecha_hasta"], [aria-label*="hasta" i]' },
  { label: 'Botón consultar', selector: 'button:has-text("Consultar"), button:has-text("Buscar"), button:has-text("Filtrar"), button:has-text("Ver")' },
  { label: 'Botón limpiar', selector: 'button:has-text("Limpiar"), button:has-text("Clear")' },
  { label: 'Tabla resultados', selector: '.p-datatable, table, .p-dataview-content, [class*="table"]' },
  { label: 'Estado vacío', selector: '.p-datatable-empty, .p-empty, [class*="empty"], .p-dataview-emptymessage, td:has-text("No hay")' },
]

// ─── TEST PRINCIPAL ───────────────────────────────────────────────

test.describe('Diagnóstico visual Kardex', () => {
  test.setTimeout(120000)

  test('Kardex — layout, interacción y diagnóstico completo', async ({ page }) => {
    // ── Recolectar errores ─────────────────────────────────────
    const consoleErrors: { type: string; text: string; url?: string }[] = []
    const networkErrors: { url: string; status: number; method: string }[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push({ type: msg.type(), text: msg.text().substring(0, 200) })
      }
    })
    page.on('response', (resp) => {
      const status = resp.status()
      if (status >= 400) {
        networkErrors.push({
          url: resp.url().substring(0, 150),
          status,
          method: resp.request().method(),
        })
      }
    })

    // ── 1. Inyectar auth ──────────────────────────────────────
    await injectToken(page)

    // ── 2. Navegar por menú lateral ───────────────────────────
    // Primero tomamos screenshot del dashboard para ver el sidebar
    await page.screenshot({ path: `${SCREENSHOT_DIR}/kardex-paso0-dashboard.png`, fullPage: false })

    // Estrategia: buscar todos los enlaces del sidebar
    const sidebarLinks = page.locator('.sidebar a, aside a, .p-panelmenu a, .p-panelmenu span, nav a, [class*="menu"] a, .layout-menu a, .p-menuitem-link')
    const linkCount = await sidebarLinks.count()
    console.log(`🔗 Enlaces en sidebar: ${linkCount}`)

    // Listar textos de enlaces del sidebar
    const linkTexts: string[] = []
    for (let i = 0; i < Math.min(linkCount, 30); i++) {
      const txt = await sidebarLinks.nth(i).innerText().catch(() => '')
      if (txt.trim()) linkTexts.push(txt.trim())
    }
    console.log(`📝 Textos sidebar: ${linkTexts.join(' | ')}`)

    // Buscar específicamente el enlace "Inventario" en el menú
    const menuItems = page.locator('.p-panelmenu-header-link, .p-panelmenu-header a, .p-menuitem-text, .sidebar a, .p-panelmenu span, .layout-menu a')
    const menuCount = await menuItems.count()
    console.log(`🔗 Items de menú: ${menuCount}`)

    // Intentar encontrar "Inventario"
    let menuClicked = false
    for (let i = 0; i < menuCount; i++) {
      const txt = await menuItems.nth(i).innerText().catch(() => '')
      if (txt.trim() === 'Inventario' || txt.trim().includes('Inventario')) {
        console.log(`🎯 Click en menú item [${i}]: "${txt}"`)
        await menuItems.nth(i).hover()
        await page.waitForTimeout(300)
        await menuItems.nth(i).click()
        await page.waitForTimeout(800)
        menuClicked = true
        break
      }
    }

    if (!menuClicked) {
      console.log('⚠️  Menú "Inventario" no encontrado por texto exacto — buscando con contains')
      const invAny = page.locator('text=Inventario').first()
      if (await invAny.isVisible().catch(() => false)) {
        await invAny.hover()
        await page.waitForTimeout(200)
        await invAny.click()
        await page.waitForTimeout(800)
        menuClicked = true
        console.log('✅ Click en Inventario (contains)')
      }
    }

    if (menuClicked) {
      // Ahora buscar "Kardex" en el submenú expandido
      await page.waitForTimeout(500)
      await page.screenshot({ path: `${SCREENSHOT_DIR}/kardex-paso1-submenu.png`, fullPage: false })
      
      const subItems = page.locator('.p-panelmenu-content a, .p-panelmenu-content span, .p-menuitem-link, .sidebar a, .layout-menu a, .p-panelmenu-item a')
      const subCount = await subItems.count()
      console.log(`🔗 Items en submenú expandido: ${subCount}`)
      
      for (let i = 0; i < subCount; i++) {
        const txt = await subItems.nth(i).innerText().catch(() => '')
        if (txt.trim() === 'Kardex' || txt.trim().includes('Kardex')) {
          console.log(`🎯 Click en submenú [${i}]: "${txt}"`)
          const box = await subItems.nth(i).boundingBox()
          if (box) {
            await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
            await page.waitForTimeout(200)
            await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
            await page.waitForTimeout(1500)
          } else {
            await subItems.nth(i).click()
            await page.waitForTimeout(1500)
          }
          break
        }
      }
    }

    // Verificar URL alcanzada
    let currentUrl = page.url()
    console.log(`📍 URL alcanzada: ${currentUrl}`)

    // Si no llegamos a kardex, intentar fallback por URL directa
    if (!currentUrl.includes('kardex')) {
      console.log('⚠️  No se pudo navegar por menú — usando URL directa')
      await page.goto('/#/inventory/kardex')
      await page.waitForTimeout(1500)
      currentUrl = page.url()
      console.log(`📍 URL (fallback): ${currentUrl}`)
    }

    // ── 3. Screenshot inicial ─────────────────────────────────
    await page.screenshot({ path: `${SCREENSHOT_DIR}/kardex-inicial.png`, fullPage: false })
    console.log('📸 Screenshot: kardex-inicial.png')
    await page.screenshot({ path: `${SCREENSHOT_DIR}/kardex-inicial-fullpage.png`, fullPage: true })
    console.log('📸 Screenshot: kardex-inicial-fullpage.png')

    // ── 4. Reporte de elementos ───────────────────────────────
    const elementReports: ElementReportItem[] = []
    for (const el of KARDEX_ELEMENTS) {
      const report = await reportElement(page, el.label, el.selector)
      elementReports.push(report)
    }

    // ── 5. Detectar overflow ──────────────────────────────────
    const overflow = await detectOverflow(page)

    // ── 6. Detectar solapamientos entre inputs/selects ───────
    const overlaps = await detectOverlapping(page, 'input, .p-select, .p-dropdown, .p-datepicker, .p-inputnumber, select, textarea, button, label, .p-button')

    // ── 7. Elementos fuera de viewport ────────────────────────
    const outOfViewport = await detectOutOfViewport(page, 'input, .p-select, .p-dropdown, .p-datepicker, .p-inputnumber, select, button, .p-button, label, .p-datatable, table, h2, h1, .p-toolbar')

    // ── 8. Textos problemáticos ──────────────────────────────
    const badTexts = await detectBadTexts(page)

    // ── 9. SIMULAR INTERACCIONES ─────────────────────────────

    // 9a. Mover mouse hacia selector de producto
    const productSelect = page.locator('[id*="product"], [class*="product"], [aria-label*="producto" i]').first()
    if (await productSelect.isVisible().catch(() => false)) {
      const box = await productSelect.boundingBox()
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
        await page.waitForTimeout(300)
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
        await page.waitForTimeout(500)

        // 9b. Si hay opciones en dropdown, seleccionar primera
        const option = page.locator('.p-select-option, .p-dropdown-item, .p-select-item, .p-dropdown-option, li[role="option"]').first()
        if (await option.isVisible().catch(() => false)) {
          await option.hover()
          await page.waitForTimeout(200)
          await option.click()
          await page.waitForTimeout(300)
          console.log('✅ Producto seleccionado')
        } else {
          console.log('⚠️  Dropdown abierto sin opciones visibles (datos simulados vacíos)')
        }
      }
    } else {
      console.log('⚠️  Selector de producto no visible')
    }

    // 9c. Mover mouse hacia selector de bodega
    const warehouseSelect = page.locator('[id*="warehouse"], [id*="bodega"], [aria-label*="bodega" i]').first()
    if (await warehouseSelect.isVisible().catch(() => false)) {
      const box = await warehouseSelect.boundingBox()
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
        await page.waitForTimeout(200)
        // Click y selección si hay opciones
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
        await page.waitForTimeout(400)
        const opt2 = page.locator('.p-select-option, .p-dropdown-item, .p-select-item, li[role="option"]').first()
        if (await opt2.isVisible().catch(() => false)) {
          await opt2.hover()
          await page.waitForTimeout(200)
          await opt2.click()
          await page.waitForTimeout(300)
          console.log('✅ Bodega seleccionada')
        } else {
          console.log('⚠️  Bodega dropdown sin opciones')
        }
      }
    } else {
      console.log('⚠️  Selector de bodega no visible')
    }

    // 9d. Fecha desde — mover mouse, click, escribir
    const dateFrom = page.locator('[id*="date-from"], [id*="fecha_desde"], input[type="date"], input[placeholder*="desde" i], input[placeholder*="from" i], .p-datepicker input').first()
    if (await dateFrom.isVisible().catch(() => false)) {
      const box = await dateFrom.boundingBox()
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
        await page.waitForTimeout(200)
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
        await page.waitForTimeout(200)
        await dateFrom.fill('2026-01-01')
        await page.waitForTimeout(300)
        console.log('✅ Fecha desde: 2026-01-01')
      }
    } else {
      console.log('⚠️  Campo fecha desde no visible')
    }

    // 9e. Fecha hasta
    const dateTo = page.locator('[id*="date-to"], [id*="fecha_hasta"], input[type="date"], input[placeholder*="hasta" i], input[placeholder*="to" i], .p-datepicker input').last()
    if (await dateTo.isVisible().catch(() => false)) {
      const box = await dateTo.boundingBox()
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
        await page.waitForTimeout(200)
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
        await page.waitForTimeout(200)
        await dateTo.fill('2026-12-31')
        await page.waitForTimeout(300)
        console.log('✅ Fecha hasta: 2026-12-31')
      }
    } else {
      console.log('⚠️  Campo fecha hasta no visible')
    }

    // 9f. Botón consultar
    const searchBtn = page.locator('button').filter({ hasText: /Consultar|Buscar|Filtrar|Ver/i }).first()
    if (await searchBtn.isVisible().catch(() => false)) {
      const box = await searchBtn.boundingBox()
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
        await page.waitForTimeout(200)
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
        await page.waitForTimeout(1500)
        console.log('✅ Click en botón consultar')
      }
    } else {
      console.log('⚠️  Botón consultar no visible')
    }

    // ── 10. Screenshot post-interacción ───────────────────────
    await page.screenshot({ path: `${SCREENSHOT_DIR}/kardex-interaccion.png`, fullPage: false })
    console.log('📸 Screenshot: kardex-interaccion.png')
    await page.screenshot({ path: `${SCREENSHOT_DIR}/kardex-interaccion-fullpage.png`, fullPage: true })
    console.log('📸 Screenshot: kardex-interaccion-fullpage.png')

    // ── 11. Re-evaluar layout post-interacción ────────────────
    const overflow2 = await detectOverflow(page)
    const overlaps2 = await detectOverlapping(page, 'input, .p-select, .p-dropdown, .p-datepicker, .p-inputnumber, select, textarea, button, label, .p-button')
    const outOfViewport2 = await detectOutOfViewport(page, 'input, .p-select, .p-dropdown, .p-datepicker, .p-inputnumber, select, button, .p-button, label, .p-datatable, table, h2, h1, .p-toolbar')

    // ── 12. IMÁGENES: kardex-inicial.png ─────────────────────
    await test.step('Verificar kardex-inicial.png existe', async () => {
      // Adjuntar como artifact
      await test.info().attach('kardex-inicial', {
        path: `${SCREENSHOT_DIR}/kardex-inicial.png`,
        contentType: 'image/png',
      })
      await test.info().attach('kardex-interaccion', {
        path: `${SCREENSHOT_DIR}/kardex-interaccion.png`,
        contentType: 'image/png',
      })
    })

    // ── 13. Assertions suaves para el informe ────────────────
    // No hacemos fail del test — es diagnóstico
    // Solo registramos todo en el reporte

    // ── IMPRIMIR INFORME ───────────────────────────────────────
    console.log('\n' + '='.repeat(70))
    console.log('📋 INFORME DE DIAGNÓSTICO VISUAL — KARDEX')
    console.log('='.repeat(70))

    console.log(`\n📍 Ruta: ${currentUrl}`)

    console.log(`\n📊 OVERFLOW:`)
    console.log(`   Horizontal: ${overflow.horizontalOverflow ? '⚠️ SÍ' : '✅ No'} (${overflow.scrollWidth}px > ${overflow.clientWidth}px)`)
    console.log(`   Vertical:   ${overflow.verticalOverflow ? '⚠️ SÍ' : '✅ No'} (${overflow.scrollHeight}px > ${overflow.clientHeight}px)`)

    if (overflow2.horizontalOverflow) {
      console.log(`   Post-interacción: ⚠️ Horizontal overflow: ${overflow2.scrollWidth}px > ${overflow2.clientWidth}px`)
    }

    console.log(`\n🔍 ELEMENTOS REPORTADOS:`)
    for (const r of elementReports) {
      console.log(`   ${r.visible ? '✅' : '❌'} ${r.selector}: visible=${r.visible} inViewport=${r.inViewport} rect=${r.rect} | ${r.notes}`)
    }

    if (overlaps.length > 0) {
      console.log(`\n⚠️ SOLAPAMIENTOS (pre-interacción):`)
      for (const o of overlaps) {
        console.log(`   ${o.a} ↔ ${o.b} (${o.overlapPct}%)`)
      }
    } else {
      console.log(`\n✅ Sin solapamientos significativos`)
    }

    if (outOfViewport.length > 0) {
      console.log(`\n⚠️ ELEMENTOS FUERA DE VIEWPORT:`)
      for (const o of outOfViewport) {
        console.log(`   ${o.tag}#${o.id} → ${o.direction} rect=(${Math.round(o.rect.left)},${Math.round(o.rect.top)}) ${Math.round(o.rect.width)}x${Math.round(o.rect.height)}`)
      }
    } else {
      console.log(`\n✅ Todos los elementos dentro del viewport`)
    }

    if (outOfViewport2.length > 0) {
      console.log(`\n⚠️ POST-INTERACCIÓN — Fuera de viewport:`)
      for (const o of outOfViewport2) {
        console.log(`   ${o.tag}#${o.id} → ${o.direction}`)
      }
    }

    if (badTexts.length > 0) {
      console.log(`\n❌ TEXTOS PROBLEMÁTICOS: ${badTexts.join(', ')}`)
    } else {
      console.log(`\n✅ Sin textos problemáticos (undefined, null, [object Object], NaN)`)
    }

    console.log(`\n📡 CONSOLA — Errores (${consoleErrors.length}):`)
    for (const e of consoleErrors.slice(0, 15)) {
      console.log(`   ❌ ${e.text.substring(0, 200)}`)
    }
    if (consoleErrors.length > 15) {
      console.log(`   ... y ${consoleErrors.length - 15} más`)
    }

    console.log(`\n📡 RED — Errores HTTP (${networkErrors.length}):`)
    const uniqueErrors = new Map<string, number>()
    for (const e of networkErrors) {
      const key = `${e.status} ${e.method} ${e.url}`
      uniqueErrors.set(key, (uniqueErrors.get(key) || 0) + 1)
    }
    for (const [key, count] of uniqueErrors) {
      console.log(`   ${count > 1 ? `(${count}x)` : ''} ${key}`)
    }

    // ── VEREDICTO ──────────────────────────────────────────────
    const hasLayoutIssues =
      overflow.horizontalOverflow ||
      overlaps.length > 0 ||
      outOfViewport.length > 0 ||
      badTexts.length > 0 ||
      consoleErrors.filter(e => !e.text.includes('ERR_ABORTED') && !e.text.includes('source map')).length > 0

    console.log(`\n🎯 VEREDICTO:`)
    if (hasLayoutIssues) {
      console.log('   ⚠️ La pantalla Kardex tiene problemas visuales que requieren atención.')
    } else {
      console.log('   ✅ La pantalla Kardex se ve correctamente sin problemas visuales detectados.')
    }
    console.log('='.repeat(70) + '\n')

    // Adjuntar todo como artifacts
    await test.info().attach('informe-completo', {
      body: JSON.stringify({
        url: currentUrl,
        overflow_pre: overflow,
        overflow_post: overflow2,
        elements: elementReports,
        overlaps_pre: overlaps,
        overlaps_post: overlaps2,
        outOfViewport_pre: outOfViewport,
        outOfViewport_post: outOfViewport2,
        badTexts,
        consoleErrors: consoleErrors.slice(0, 20),
        networkErrors: [...uniqueErrors.entries()].map(([k, c]) => ({ count: c, detail: k })),
      }, null, 2),
      contentType: 'application/json',
    })

    // Verificaciones suaves (no detienen el test)
    expect(overflow.horizontalOverflow, 'Overflow horizontal detectado').toBeFalsy()
    expect(badTexts.length, `Textos problemáticos: ${badTexts.join(', ')}`).toBe(0)
  })
})

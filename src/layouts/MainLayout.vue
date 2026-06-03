<template>
  <div class="layout">
    <!-- DESKTOP SIDEBAR (≥ 1024px) -->
    <aside class="sidebar" :class="[collapsed ? 'collapsed' : '', { 'sidebar-hidden': isSmallScreen }]">
      <div class="sidebar-header">
        <template v-if="!collapsed">
          <i class="pi pi-wrench" style="font-size: 1.5rem; color: #6366f1;"></i>
          <span class="sidebar-title">WorkOrders</span>
        </template>
        <Button :icon="collapsed ? 'pi pi-angle-double-right' : 'pi pi-angle-double-left'" text
          @click="collapsed = !collapsed" class="toggle-btn" />
      </div>
      <nav class="sidebar-nav">
        <template v-for="group in visibleGroups" :key="group.label">
          <!-- Collapsed mode: show group icon + flyout on hover -->
          <template v-if="collapsed">
            <div class="nav-collapsed-group"
              @mouseenter="onGroupEnter(group.label)"
              @mouseleave="onGroupLeave">
              <div class="nav-group-icon">
                <i :class="group.icon"></i>
              </div>
              <div v-if="hoveredGroup === group.label" class="collapsed-flyout"
                @mouseenter="onFlyoutEnter"
                @mouseleave="onFlyoutLeave">
                <div class="flyout-header">
                  <i :class="group.icon"></i>
                  <span>{{ group.label }}</span>
                </div>
                <router-link v-for="item in group.items" :key="item.to" :to="item.to"
                  class="flyout-item" :class="{ active: isActive(item.to) }"
                  @click="hoveredGroup = null">
                  <i :class="item.icon"></i>
                  <span>{{ item.label }}</span>
                </router-link>
              </div>
            </div>
          </template>
          <!-- Normal mode -->
          <template v-else>
            <div class="nav-group-header" @click="toggleGroup(group.label)"
              :class="{ 'group-active': group.items.some(i => isActive(i.to)) }">
              <i :class="group.icon" class="nav-group-icon-left"></i>
              <span class="nav-group-label">{{ group.label }}</span>
              <i class="pi pi-chevron-down sub-arrow" :class="{ rotated: isGroupExpanded(group.label) }"></i>
            </div>
            <template v-if="isGroupExpanded(group.label)">
              <router-link v-for="item in group.items" :key="item.to" :to="item.to"
                class="nav-item" :class="{ active: isActive(item.to) }">
                <i :class="item.icon"></i>
                <span>{{ item.label }}</span>
              </router-link>
            </template>
          </template>
        </template>
      </nav>
      <div class="sidebar-footer" v-if="!collapsed">
        <div class="user-info">
          <i class="pi pi-user"></i>
          <span>{{ userName }}</span>
        </div>
        <div class="user-roles" v-if="userRoles.length">
          <Tag v-for="r in userRoles" :key="r" :value="r" severity="info" size="small" rounded />
        </div>
        <Button label="Cerrar sesión" icon="pi pi-sign-out" text @click="logout" size="small" />
      </div>
    </aside>

    <!-- MOBILE/TABLET DRAWER (< 1024px) —— same nav tree -->
    <Drawer v-model:visible="mobileMenuOpen" :dismissable="true" position="left" class="mobile-drawer">
      <template #container>
        <div class="drawer-inner">
          <div class="drawer-header">
            <div class="drawer-header-left">
              <i class="pi pi-wrench" style="font-size: 1.5rem; color: #6366f1;"></i>
              <span class="sidebar-title">WorkOrders</span>
            </div>
            <button class="drawer-close-btn" @click="mobileMenuOpen = false" aria-label="Cerrar menú">
              <i class="pi pi-times"></i>
            </button>
          </div>
          <nav class="drawer-nav">
            <template v-for="group in visibleGroups" :key="group.label">
              <div class="drawer-group-header" @click="toggleGroup(group.label)"
                :class="{ 'group-active': group.items.some(i => isActive(i.to)) }">
                <i :class="group.icon" class="nav-group-icon-left"></i>
                <span class="nav-group-label">{{ group.label }}</span>
                <i class="pi pi-chevron-down sub-arrow" :class="{ rotated: isGroupExpanded(group.label) }"></i>
              </div>
              <template v-if="isGroupExpanded(group.label)">
                <router-link v-for="item in group.items" :key="item.to" :to="item.to"
                  class="drawer-item" :class="{ active: isActive(item.to) }"
                  @click="mobileMenuOpen = false">
                  <i :class="item.icon"></i>
                  <span>{{ item.label }}</span>
                </router-link>
              </template>
            </template>
          </nav>
        </div>
      </template>
    </Drawer>

    <!-- MAIN CONTENT -->
    <main class="main-content" :class="mainContentClasses">
      <header class="topbar">
        <div class="topbar-left">
          <Button
            v-if="isSmallScreen"
            icon="pi pi-bars"
            text
            @click="mobileMenuOpen = true"
            class="hamburger-btn p-mr-2"
          />
          <h2>{{ currentPageTitle }}</h2>
        </div>
      </header>
      <div class="content">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Drawer from 'primevue/drawer'
import { hasAnyPermission } from '@/api/client'

const router = useRouter()
const route = useRoute()

const collapsed = ref(false)

// Mobile/tablet breakpoints
const mobileMenuOpen = ref(false)

// Reactivos a resize vía evento en window — sin depender de setup timing
const vw = ref(0)

onMounted(() => {
  const updateVw = () => { vw.value = window.innerWidth }
  updateVw()
  window.addEventListener('resize', updateVw)
})

const isSmallScreen = computed(() => (vw.value > 0 ? vw.value : window.innerWidth) < 1024)

const userName = computed(() => {
  try { return JSON.parse(localStorage.getItem('user') || '{}').name || 'Usuario' }
  catch { return 'Usuario' }
})

const userRoles = computed(() => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    return user.roles?.map((r: any) => r.name) || []
  } catch { return [] }
})

const pageTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  clients: 'Clientes',
  suppliers: 'Proveedores',
  products: 'Productos',
  categories: 'Categorías',
  locations: 'Ubicaciones',
  stock: 'Stock Actual',
  'stock/movements': 'Movimientos de Stock',
  'stock/alerts': 'Alertas de Stock',
  'work-orders': 'Órdenes de Trabajo',
  users: 'Usuarios',
  roles: 'Roles',
  permissions: 'Permisos',
  calendar: 'Calendario',
  invoices: 'Facturas',
  'invoices/new': 'Nueva Factura',
  bank: 'Bancos',
  banking: 'Bancos',
  purchases: 'Compras',
  inventory: 'Inventario',
  reconciliation: 'Conciliación',
  'inventory/stock-balances': 'Saldos de Inventario',
  'inventory/kardex': 'Kardex',
  'inventory/adjustments/create': 'Ajuste de Inventario',
  'inventory/transfers/create': 'Transferencia de Inventario',
  'inventory/stock-alerts': 'Alertas de Stock',
  'purchases/receipts/create': 'Recepción de Compra',
  'purchases/payables': 'Cuentas por Pagar',
  'purchases/payments': 'Pagos a Proveedores',
  'banking/accounts': 'Cuentas Bancarias',
  'banking/movements': 'Movimientos Bancarios',
  'banking/movements/create': 'Nuevo Movimiento',
  'banking/transfers/create': 'Transferencia Bancaria',
  'banking/statement-lines': 'Líneas de Estado de Cuenta',
  'banking/reconciliations': 'Conciliaciones',
  'banking/reconciliations/create': 'Nueva Conciliación',
  'banking/statement-imports': 'Importar Estado de Cuenta',
}
const currentPageTitle = computed(() => {
  // Try exact path match first
  if (pageTitles[route.path.replace(/^\//, '')]) return pageTitles[route.path.replace(/^\//, '')]
  // Check accounting routes
  if (route.path.includes('accounting/chart-of-accounts')) return 'Plan de Cuentas'
  if (route.path.includes('accounting/journal-entries')) return 'Asientos Contables'
  if (route.path.includes('banking/movements') && route.params.id) return 'Detalle de Movimiento Bancario'
  if (route.path.includes('banking/reconciliations') && route.params.id) return 'Detalle de Conciliación'
  if (route.path.includes('banking/reconciliations')) return 'Conciliaciones Bancarias'
  if (route.path.includes('banking/statement-imports')) return 'Importar Estado de Cuenta'
  if (route.path.includes('banking/statement-lines')) return 'Líneas de Estado de Cuenta'
  if (route.path.includes('banking/transfers')) return 'Transferencia Bancaria'
  if (route.path.includes('banking/movements')) return 'Movimientos Bancarios'
  if (route.path.includes('banking/accounts')) return 'Cuentas Bancarias'
  if (route.path.match(/^\/invoices\/\d+$/) && !route.path.endsWith('/edit')) return 'Detalle de Factura'
  if (route.path.match(/^\/invoices\/\d+\/edit$/)) return 'Editar Factura'
  if (route.path.includes('inventory/stock-balances')) return 'Saldos de Inventario'
  if (route.path.includes('inventory/kardex')) return 'Kardex'
  if (route.path.includes('inventory/adjustments')) return 'Ajuste de Inventario'
  if (route.path.includes('inventory/transfers')) return 'Transferencia de Inventario'
  if (route.path.includes('purchases/payables')) return 'Cuentas por Pagar'
  if (route.path.includes('purchases/payments')) return 'Pagos a Proveedores'
  if (route.path.includes('purchases/receipts')) return 'Recepción de Compra'
  // Fall back to first segment
  const segment = route.path.split('/')[1]
  return pageTitles[segment] || 'WorkOrders'
})

function isActive(path: string) {
  return route.path === path
}

function isRouteMatch(itemPath: string, currentPath: string): boolean {
  // Exact match or nested (e.g., /work-orders matches /work-orders/new)
  if (currentPath === itemPath) return true
  if (itemPath !== '/' && currentPath.startsWith(itemPath + '/')) return true
  return false
}

/** Permission key for each menu route — checks if user can see it */
function can(path: string): boolean {
  const permMap: Record<string, string[]> = {
    '/dashboard': ['dashboard.view'],
    '/work-orders': ['work-orders.view'],
    '/stock': ['stock.view'],
    '/stock/movements': ['stock.view'],
    '/stock/alerts': ['stock.alerts'],
    '/products': ['products.view'],
    '/categories': ['categories.view'],
    '/locations': ['locations.view'],
    '/clients': ['clients.view'],
    '/suppliers': ['suppliers.view'],
    '/calendar': ['calendar.view'],
    '/users': ['users.view'],
    '/roles': ['roles.view'],
    '/settings': ['settings.view'],
    '/invoices': ['invoices.view'],
    '/invoices/new': ['invoices.create'],
  }
  const perms = permMap[path]
  if (!perms) return true // routes without explicit perms are visible
  return hasAnyPermission(perms)
}

interface NavItem {
  to: string
  icon: string
  label: string
  children?: NavItem[]
  expanded?: boolean
}

interface NavGroup {
  label: string
  icon: string
  items: NavItem[]
  expanded?: boolean
}

// Track expanded state separately so template mutations are reactive
const expandedGroups = ref<Record<string, boolean>>({})
const hoveredGroup = ref<string | null>(null)
let hoverTimeout: ReturnType<typeof setTimeout> | null = null

function onGroupEnter(label: string) {
  if (hoverTimeout) clearTimeout(hoverTimeout)
  hoveredGroup.value = label
}

function onGroupLeave() {
  hoverTimeout = setTimeout(() => {
    hoveredGroup.value = null
  }, 250)
}

function onFlyoutEnter() {
  if (hoverTimeout) clearTimeout(hoverTimeout)
}

function onFlyoutLeave() {
  hoveredGroup.value = null
}

function toggleGroup(label: string) {
  expandedGroups.value[label] = !expandedGroups.value[label]
}

function isGroupExpanded(label: string): boolean {
  return !!expandedGroups.value[label]
}

const allGroups: NavGroup[] = [
  {
    label: 'Dashboard', icon: 'pi pi-home',
    items: [
      { to: '/dashboard', icon: 'pi pi-home', label: 'Dashboard' },
    ]
  },
  {
    label: 'Terceros', icon: 'pi pi-users',
    items: [
      { to: '/clients', icon: 'pi pi-user', label: 'Clientes' },
      { to: '/suppliers', icon: 'pi pi-truck', label: 'Proveedores' },
    ]
  },
  {
    label: 'Órdenes', icon: 'pi pi-clipboard',
    items: [
      { to: '/work-orders', icon: 'pi pi-list', label: 'Todas las Órdenes' },
      { to: '/work-orders/new', icon: 'pi pi-plus', label: 'Nueva Orden' },
      { to: '/calendar', icon: 'pi pi-calendar', label: 'Calendario' },
    ]
  },
  {
    label: 'Facturación', icon: 'pi pi-file',
    items: [
      { to: '/invoices', icon: 'pi pi-credit-card', label: 'Facturas' },
      { to: '/invoices/new', icon: 'pi pi-plus', label: 'Nueva Factura' },
    ]
  },
  {
    label: 'Inventario', icon: 'pi pi-warehouse',
    items: [
      { to: '/products', icon: 'pi pi-box', label: 'Productos' },
      { to: '/categories', icon: 'pi pi-tags', label: 'Categorías' },
      { to: '/locations', icon: 'pi pi-map-marker', label: 'Ubicaciones' },
      { to: '/brands', icon: 'pi pi-tag', label: 'Marcas' },
      { to: '/stock', icon: 'pi pi-box', label: 'Stock Actual' },
      { to: '/stock/movements', icon: 'pi pi-arrow-right-arrow-left', label: 'Movimientos' },

      { to: '/assets', icon: 'pi pi-cog', label: 'Activos' },
      { to: '/inventory/stock-balances', icon: 'pi pi-chart-bar', label: 'Saldos de Inventario' },
      { to: '/inventory/kardex', icon: 'pi pi-book', label: 'Kardex' },
      { to: '/inventory/adjustments/create', icon: 'pi pi-pencil', label: 'Ajustes' },
      { to: '/inventory/transfers/create', icon: 'pi pi-arrow-right-arrow-left', label: 'Transferencias' },
      { to: '/inventory/stock-alerts', icon: 'pi pi-bell', label: 'Alertas de Stock' },
    ]
  },
  {
    label: 'Compras / CXP', icon: 'pi pi-shopping-cart',
    items: [
      { to: '/purchases/receipts/create', icon: 'pi pi-plus', label: 'Recepción de Compra' },
      { to: '/purchases/payables', icon: 'pi pi-credit-card', label: 'Cuentas por Pagar' },
      { to: '/purchases/payments', icon: 'pi pi-dollar', label: 'Pagos' },
    ]
  },
  {
    label: 'Contabilidad', icon: 'pi pi-book',
    items: [
      { to: '/accounting/chart-of-accounts', icon: 'pi pi-sitemap', label: 'Plan de Cuentas' },
      { to: '/accounting/journal-entries', icon: 'pi pi-file-edit', label: 'Asientos Contables' },
    ]
  },
  {
    label: 'Bancos / Caja', icon: 'pi pi-bank',
    items: [
      { to: '/banking/accounts', icon: 'pi pi-building', label: 'Cuentas' },
      { to: '/banking/movements', icon: 'pi pi-list', label: 'Movimientos' },
      { to: '/banking/movements/create', icon: 'pi pi-plus-circle', label: 'Nuevo Movimiento' },
      { to: '/banking/transfers/create', icon: 'pi pi-arrow-right-arrow-left', label: 'Transferencias' },
    ]
  },
  {
    label: 'Conciliación', icon: 'pi pi-check-circle',
    items: [
      { to: '/banking/statement-lines', icon: 'pi pi-file', label: 'Estados de Cuenta' },
      { to: '/banking/reconciliations', icon: 'pi pi-check-square', label: 'Conciliaciones' },
      { to: '/banking/reconciliations/create', icon: 'pi pi-plus', label: 'Nueva Conciliación' },
      { to: '/banking/statement-imports', icon: 'pi pi-upload', label: 'Importar CSV' },
    ]
  },
  {
    label: 'Admin', icon: 'pi pi-cog',
    items: [
      { to: '/users', icon: 'pi pi-cog', label: 'Usuarios' },
      { to: '/roles', icon: 'pi pi-shield', label: 'Roles' },
      { to: '/settings', icon: 'pi pi-wrench', label: 'Configuración' },
      { to: '/price-lists', icon: 'pi pi-tags', label: 'Listas de Precios' },
    ]
  },
]

// Open group whose route is active on first load
function autoOpenActiveGroup() {
  for (const g of allGroups) {
    if (g.items.some(i => isRouteMatch(i.to, route.path))) {
      expandedGroups.value[g.label] = true
      break
    }
  }
}
autoOpenActiveGroup()

const visibleGroups = computed(() => {
  const raw = localStorage.getItem('permissions')
  const hasPerms = raw ? JSON.parse(raw).length > 0 : false
  if (!hasPerms) return allGroups
  return allGroups.filter(group => group.items.some(item => can(item.to)))
})

function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  localStorage.removeItem('permissions')
  router.push('/login')
}

// Close drawer on route change (mobile + tablet)
watch(() => route.path, () => {
  if (isSmallScreen.value) mobileMenuOpen.value = false
})

// Main content classes — reactive to viewport + collapsed state
const mainContentClasses = computed(() => ({
  'sidebar-expanded': !isSmallScreen.value && !collapsed.value,
  'sidebar-collapsed': !isSmallScreen.value && collapsed.value,
  'sidebar-mobile': isSmallScreen.value,
}))
</script>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
  overflow-x: hidden;
}
.sidebar {
  width: 260px;
  background: #1e293b;
  color: #e2e8f0;
  display: flex;
  flex-direction: column;
  transition: width 0.2s ease;
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  z-index: 100;
}
.sidebar.collapsed { width: 64px; }
.sidebar.sidebar-hidden { display: none; }
.sidebar-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border-bottom: 1px solid #334155;
}
.sidebar-title { font-weight: 700; font-size: 1rem; white-space: nowrap; }
.toggle-btn { margin-left: auto; color: #e2e8f0; }
.sidebar-nav {
  flex: 1;
  padding: 0.25rem 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  overflow-y: auto;
}
.nav-collapsed-group {
  position: relative;
  padding: 0.375rem 0;
  display: flex;
  justify-content: center;
}

/* Flyout cuando la sidebar está colapsada */
.collapsed-flyout {
  position: absolute;
  left: calc(100% + 4px);
  top: 0;
  min-width: 220px;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 0.5rem;
  padding: 0.375rem 0;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  z-index: 200;
}
.flyout-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.55rem 0.75rem;
  color: #cbd5e1;
  font-size: 0.85rem;
  font-weight: 600;
  border-bottom: 1px solid #334155;
  margin-bottom: 0.125rem;
}
.flyout-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.45rem 0.75rem;
  color: #94a3b8;
  text-decoration: none;
  font-size: 0.813rem;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.15s;
}
.flyout-item:hover { background: #334155; color: #e2e8f0; }
.flyout-item.active { background: #6366f1; color: #fff; }
.flyout-item i { font-size: 0.95rem; min-width: 18px; text-align: center; }

.sidebar.collapsed .sidebar-nav {
  overflow: visible;
}
.nav-group-icon {
  padding: 0.35rem;
  border-radius: 0.5rem;
  color: #64748b;
  font-size: 1.1rem;
  cursor: default;
  display: flex;
  align-items: center;
  justify-content: center;
}
.nav-group-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.55rem 0.75rem;
  border-radius: 0.5rem;
  color: #cbd5e1;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  margin-top: 0.125rem;
  border-top: 1px solid #334155;
}
.nav-group-header:hover { background: #334155; color: #f1f5f9; }
.nav-group-header.group-active { color: #a5b4fc; }
.nav-group-icon-left { font-size: 1.1rem; min-width: 20px; text-align: center; }
.nav-group-label { flex: 1; }
.sub-arrow { font-size: 0.75rem; transition: transform 0.2s; color: #64748b; }
.sub-arrow.rotated { transform: rotate(180deg); }
.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.45rem 0.75rem 0.45rem 2.75rem;
  border-radius: 0.5rem;
  color: #94a3b8;
  text-decoration: none;
  transition: all 0.15s;
  font-size: 0.813rem;
  white-space: nowrap;
  cursor: pointer;
}
.nav-item:hover { background: #334155; color: #e2e8f0; }
.nav-item.active { background: #6366f1; color: #fff; }
.nav-item i { font-size: 0.95rem; min-width: 18px; text-align: center; }
.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid #334155;
  font-size: 0.8rem;
}
.user-info { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
.user-roles { display: flex; flex-wrap: wrap; gap: 0.25rem; margin-bottom: 0.5rem; }

/* =============== MAIN CONTENT =============== */
.main-content {
  flex: 1;
  min-height: 100vh;
  min-width: 0;
  display: flex;
  flex-direction: column;
  transition: margin-left 0.2s ease;
  /* Desktop expanded (default) */
  margin-left: 260px;
}
.main-content.sidebar-collapsed { margin-left: 64px; }
/* .main-content.sidebar-tablet removed — tablet behaves like mobile */
.main-content.sidebar-mobile { margin-left: 0; }

/* =============== TOPBAR =============== */
.topbar {
  background: #fff;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  z-index: 50;
}
.topbar-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}
.topbar h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.hamburger-btn { color: #475569; }

.content { padding: 1.5rem; flex: 1; min-width: 0; overflow-x: hidden; }

/* =============== DRAWER MOBILE =============== */
.mobile-drawer {
  /* Already set by PrimeVue inline, override via deep */
}
/* Mobile/tablet (< 1024px): full-screen drawer sin bordes blancos — safe area incluida */
@media (max-width: 1023px) {
  :deep(.mobile-drawer) {
    width: 100dvw !important;
    max-width: 100dvw !important;
    height: 100dvh !important;
    min-height: 100dvh !important;
    border-radius: 0 !important;
    border: none !important;
    margin: 0 !important;
    box-shadow: none !important;
    background: #1e293b !important;
    /* Safe area en el root — así las "orejas" (notch/home indicator) heredan el fondo oscuro */
    padding: env(safe-area-inset-top, 0px) 0 env(safe-area-inset-bottom, 0px) !important;
    overscroll-behavior: none !important;
    -webkit-overflow-scrolling: touch;
  }
  :deep(.mobile-drawer.p-drawer) {
    background: #1e293b !important;
  }
  :deep(.mobile-drawer .p-drawer-mask) {
    background: rgba(0, 0, 0, 0.5);
    overscroll-behavior: none !important;
  }
  .drawer-inner {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    background: #1e293b;
    /* SIN safe area padding — ya lo tiene el root .mobile-drawer */
  }
  .drawer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.875rem 1.25rem;
    background: #1e293b;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    /* Touch target decente */
    min-height: 52px;
  }
  .drawer-header-left {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .drawer-close-btn {
    background: transparent;
    border: none;
    color: #94a3b8;
    font-size: 1.35rem;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s, color 0.15s;
    /* Touch area amplio */
    min-width: 44px;
    min-height: 44px;
  }
  .drawer-close-btn:hover,
  .drawer-close-btn:active {
    background: rgba(255,255,255,0.08);
    color: #e2e8f0;
  }
  :deep(.mobile-drawer .p-drawer-content) {
    padding: 0 !important;
    overflow-y: auto !important;
    background: #1e293b !important;
    border-radius: 0 !important;
    border: none !important;
    flex: 1;
    overscroll-behavior: none !important;
  }
  /* PrimeVue no renderiza .p-drawer-header cuando se usa #container slot, pero por si acaso */
  :deep(.mobile-drawer .p-drawer-header) {
    display: none !important;
  }
}
/* Drawer estilos — aplican siempre que el drawer está abierto (mobile y tablet) */
  .drawer-nav {
    background: #1e293b;
    flex: 1;
    color: #e2e8f0;
    padding: 0.25rem 0;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
  .drawer-group-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.7rem 1rem;
    border-radius: 0;
    color: #cbd5e1;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;
    white-space: nowrap;
    border-top: 1px solid rgba(255,255,255,0.06);
    -webkit-tap-highlight-color: transparent;
  }
  .drawer-group-header:hover,
  .drawer-group-header:active { background: rgba(255,255,255,0.06); }
  .drawer-group-header.group-active { color: #a5b4fc; }
  .drawer-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.65rem 1rem 0.65rem 2.75rem;
    border-radius: 0;
    color: #94a3b8;
    text-decoration: none;
    transition: background 0.15s;
    font-size: 0.875rem;
    white-space: nowrap;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    min-height: 44px;
  }
  .drawer-item:hover,
  .drawer-item:active { background: rgba(255,255,255,0.06); color: #e2e8f0; }
  .drawer-item.active { background: #6366f1; color: #fff; }
  .drawer-item i { font-size: 1rem; min-width: 20px; text-align: center; }

/* =============== RESPONSIVE OVERRIDES =============== */
@media (max-width: 1023px) {
  .main-content {
    margin-left: 0 !important;
  }
  .topbar {
    padding: 0.75rem 1rem;
  }
  .topbar h2 {
    font-size: 1rem;
  }
  .content {
    padding: 1rem;
  }
}

/* Tablet now uses drawer like mobile — no forced margin */
</style>

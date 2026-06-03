# work-orders-frontend — Frontend SPA (Vue 3 + PrimeVue)

Interfaz de usuario para el ERP **work-orders**. SPA (Single Page Application) construida con Vue 3, TypeScript y PrimeVue 4, que consume la API REST del backend Laravel.

## Stack Técnico

| Componente | Versión |
|---|---|
| Vue | ^3.5.32 |
| TypeScript | ~6.0.2 |
| PrimeVue | ^4.5.5 |
| PrimeFlex | ^4.0.0 |
| PrimeIcons | ^7.0.0 |
| Pinia (State Management) | ^3.0.4 |
| Vue Router | ^4.6.4 |
| Axios (HTTP Client) | ^1.15.2 |
| Tailwind CSS | ^4.2.4 |
| Vite | ^8.0.10 |
| Dayjs | ^1.11.20 |
| @primeuix/themes | ^2.0.3 |

**Testing:**
- Playwright (E2E)
- vue-tsc (type-checking)

## Estado Actual

**En desarrollo activo.** La mayoría de los módulos del backend tienen su interfaz correspondiente. Algunas funcionalidades (especialmente en inventario avanzado y bancos) están en fase de implementación/pruebas.

## Requisitos

- Node.js 20+
- NPM
- Backend `work-orders` corriendo (puerto 8001 por defecto)

## Instalación y Ejecución

```bash
# 1. Clonar
git clone https://github.com/orlandoch/work-orders-frontend.git
cd work-orders-frontend

# 2. Instalar dependencias
npm install

# 3. Configurar entorno
cp .env.example .env
# Editar VITE_API_BASE_URL=http://localhost:8001/api

# 4. Iniciar dev server
npm run dev
# Por defecto en http://localhost:5174

# 5. (Opcional) Tests E2E
npm run test:e2e
npm run test:e2e:headed  # Con navegador visible
```

## Arquitectura

```
src/
├── api/                          # Módulos de API (Axios por recurso)
│   ├── client.ts                 # Cliente Axios con interceptors (auth, errores)
│   ├── types.ts                  # Tipos/Interfaces compartidos
│   ├── index.ts                  # Re-exportaciones
│   ├── bankingService.ts         # API de bancos
│   ├── chartOfAccounts.ts        # API de contabilidad
│   ├── inventoryService.ts       # API de inventario
│   ├── journalEntries.ts         # API de asientos contables
│   ├── priceLists.ts             # API de listas de precios
│   └── purchaseService.ts        # API de compras
├── components/                   # Componentes reutilizables
│   ├── MachineUsageSection.vue   # Sección de uso de máquinas en WO
│   ├── MaterialsSection.vue      # Sección de materiales en WO
│   ├── OrderInvoicing.vue        # Facturación desde WO
│   ├── OrderPricing.vue          # Precios en WO
│   ├── PhotoUploader.vue         # Subida de fotos polimórfica
│   ├── WorkOrderResources.vue    # Recursos de WO (miembros, adjuntos)
│   └── WorkOrderTimeline.vue     # Timeline de WO
├── composables/                  # Composables (lógica reactiva reutilizable)
│   ├── useAttachments.ts         # Manejo de adjuntos
│   ├── useClientSearch.ts        # Búsqueda de clientes
│   ├── useCostSummary.ts         # Resumen de costos
│   ├── useInvoiceCalculations.ts # Cálculos de facturación
│   ├── useMembers.ts             # Manejo de miembros
│   ├── useProductSearch.ts       # Búsqueda de productos
│   ├── useRounding.ts            # Redondeo contable
│   ├── useSriDetail.ts           # Detalle SRI
│   ├── useStatusTransitions.ts   # Transiciones de estado WO
│   ├── useWorkOrderAttachments.ts# Adjuntos de WO
│   ├── useWorkOrderComments.ts   # Comentarios de WO
│   └── workOrderTypes.ts         # Tipos relacionados a WO
├── layouts/
│   └── MainLayout.vue            # Layout principal (sidebar + topbar + drawer)
├── pages/                        # Páginas del SPA (una por ruta)
│   ├── LoginPage.vue             # Login
│   ├── DashboardPage.vue         # Dashboard principal
│   ├── accounting/               # Contabilidad
│   │   ├── ChartOfAccountsListPage.vue
│   │   └── JournalEntriesListPage.vue
│   ├── assets/
│   │   └── AssetFormPage.vue     # Formulario de activos
│   ├── banking/                  # Bancos
│   │   ├── MovementDetailPage.vue
│   │   └── MovementsPage.vue
│   ├── calendar/
│   │   └── CalendarPage.vue      # Calendario de eventos
│   ├── clients/
│   │   └── ClientsListPage.vue   # Lista de clientes
│   ├── inventory/                # Inventario
│   │   ├── CreateAdjustmentPage.vue
│   │   ├── CreateTransferPage.vue
│   │   ├── KardexPage.vue
│   │   └── StockAlertsPage.vue
│   ├── invoices/                 # Facturación
│   │   ├── InvoiceDetailPage.vue
│   │   ├── InvoiceFormPage.vue
│   │   └── InvoicesListPage.vue
│   ├── price-lists/
│   │   └── PriceListsListPage.vue
│   ├── products/                 # Productos
│   │   ├── ProductFormPage.vue
│   │   └── ProductsListPage.vue
│   ├── purchases/                # Compras
│   │   └── CreateReceiptPage.vue
│   ├── roles/
│   │   └── RolePermissionsPage.vue
│   ├── settings/
│   │   ├── SettingsPage.vue
│   │   └── SriSettings.vue
│   ├── stock/                    # Stock (legacy / en transición)
│   │   ├── StockAlertsPage.vue
│   │   └── StockMovementsPage.vue
│   ├── suppliers/
│   │   └── SuppliersListPage.vue
│   └── work-orders/              # Órdenes de Trabajo
│       ├── WorkOrderDetailPage.vue
│       ├── WorkOrderFormPage.vue
│       └── WorkOrdersListPage.vue
├── router/
│   └── index.ts                  # Configuración de rutas
├── utils/
│   ├── parseApiError.ts          # Parseo de errores API
│   └── ...                       # Utilidades adicionales
├── App.vue                       # Componente raíz
├── main.ts                       # Punto de entrada
└── style.css                     # Estilos globales

tests/
└── e2e/                          # Tests E2E con Playwright
    ├── auth.ts                   # Helper de autenticación
    ├── ui.ts                     # Helper de UI
    ├── forms.spec.ts             # Tests de formularios
    ├── navigation.spec.ts        # Tests de navegación
    ├── tables.spec.ts            # Tests de tablas
    ├── layout-screenshots.spec.ts
    ├── mainlayout-responsive.spec.ts
    ├── kardex-layout.spec.ts
    ├── kardex-responsive.spec.ts
    ├── mobile-menu-appearance.spec.ts
    ├── mobile-smoke.spec.ts
    ├── primeflex-impact.spec.ts
    ├── screenshots.spec.ts
    ├── visual-errors.spec.ts
    └── screenshots/              # Screenshots de referencia
```

## Rutas del Frontend

| Ruta | Página | Módulo |
|---|---|---|
| `/login` | LoginPage | Auth |
| `/` | DashboardPage | Dashboard |
| `/work-orders` | WorkOrdersListPage | Work Orders |
| `/work-orders/new` | WorkOrderFormPage | Work Orders |
| `/work-orders/:id` | WorkOrderDetailPage | Work Orders |
| `/work-orders/:id/edit` | WorkOrderFormPage | Work Orders |
| `/clients` | ClientsListPage | Clientes |
| `/suppliers` | SuppliersListPage | Proveedores |
| `/products` | ProductsListPage | Productos |
| `/products/new` | ProductFormPage | Productos |
| `/products/:id/edit` | ProductFormPage | Productos |
| `/inventory/kardex` | KardexPage | Inventario |
| `/inventory/adjustments/new` | CreateAdjustmentPage | Inventario |
| `/inventory/transfers/new` | CreateTransferPage | Inventario |
| `/inventory/stock-alerts` | StockAlertsPage | Inventario |
| `/invoices` | InvoicesListPage | Facturación |
| `/invoices/new` | InvoiceFormPage | Facturación |
| `/invoices/:id` | InvoiceDetailPage | Facturación |
| `/invoices/:id/edit` | InvoiceFormPage | Facturación |
| `/price-lists` | PriceListsListPage | Listas de Precios |
| `/purchases/receipts/new` | CreateReceiptPage | Compras |
| `/accounting/chart-of-accounts` | ChartOfAccountsListPage | Contabilidad |
| `/accounting/journal-entries` | JournalEntriesListPage | Contabilidad |
| `/assets/new` | AssetFormPage | Activos |
| `/banking/movements` | MovementsPage | Bancos |
| `/calendar` | CalendarPage | Calendario |
| `/settings` | SettingsPage | Configuración |
| `/settings/sri` | SriSettings | SRI |
| `/roles/:id/permissions` | RolePermissionsPage | Roles |
| `/stock/movements` | StockMovementsPage | Stock (legacy) |
| `/stock/alerts` | StockAlertsPage | Stock (legacy) |

## Funcionalidades Implementadas

- Dashboard con cards informativos
- CRUD completo de Work Orders con timeline, miembros, adjuntos, comentarios
- Pricing y costos en Work Orders
- Facturación desde Work Orders (generación de factura + envío SRI)
- Uso de máquinas con tarifas por hora
- Materiales asignados a Work Orders
- CRUD de clientes, proveedores, productos
- Subida de fotos polimórfica (productos, work orders)
- Listas de precios múltiples
- Kardex de inventario con filtros responsive
- Ajustes y transferencias de inventario
- Alertas de stock bajo mínimo
- Contabilidad: plan de cuentas, asientos contables
- Movimientos bancarios
- Calendario de eventos
- Roles y permisos
- Configuración general y SRI
- Layout responsive (desktop, tablet, mobile)
- Pruebas E2E con Playwright

## Dependencias UI Notables

- **PrimeVue 4**: Componentes UI (DataTable, Dialog, Form, etc.)
- **PrimeFlex**: Grid responsive (clases `p-col-*`)
- **PrimeIcons**: Iconografía
- **Tailwind CSS**: Estilos utilitarios
- **Aura Theme**: Tema visual de PrimeVue (@primeuix/themes)

## Bugs Conocidos / Reparados

*(A completar de forma incremental)*

---

## Historial de Cambios

*(A partir del próximo commit, cada cambio se documentará aquí como append con fecha, descripción y hash del commit.)*

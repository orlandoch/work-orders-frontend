import { createRouter, createWebHashHistory } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import LoginPage from '@/pages/LoginPage.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: LoginPage,
    },
    {
      path: '/',
      component: MainLayout,
      redirect: '/dashboard',
      children: [
        { path: 'dashboard', name: 'Dashboard', component: () => import('@/pages/DashboardPage.vue') },

        // Clients
        { path: 'clients', name: 'Clients', component: () => import('@/pages/clients/ClientsListPage.vue') },
        { path: 'clients/new', name: 'ClientNew', component: () => import('@/pages/clients/ClientFormPage.vue') },
        { path: 'clients/:id', name: 'ClientDetail', component: () => import('@/pages/clients/ClientDetailPage.vue') },
        { path: 'clients/:id/edit', name: 'ClientEdit', component: () => import('@/pages/clients/ClientFormPage.vue') },

        // Suppliers
        { path: 'suppliers', name: 'Suppliers', component: () => import('@/pages/suppliers/SuppliersListPage.vue') },
        { path: 'suppliers/new', name: 'SupplierNew', component: () => import('@/pages/suppliers/SupplierFormPage.vue') },
        { path: 'suppliers/:id', name: 'SupplierDetail', component: () => import('@/pages/suppliers/SupplierDetailPage.vue') },
        { path: 'suppliers/:id/edit', name: 'SupplierEdit', component: () => import('@/pages/suppliers/SupplierFormPage.vue') },

        // Products
        { path: 'products', name: 'Products', component: () => import('@/pages/products/ProductsListPage.vue') },
        { path: 'products/new', name: 'ProductNew', component: () => import('@/pages/products/ProductFormPage.vue') },
        { path: 'products/:id/edit', name: 'ProductEdit', component: () => import('@/pages/products/ProductFormPage.vue') },

        // Categories
        { path: 'categories', name: 'Categories', component: () => import('@/pages/categories/CategoriesListPage.vue') },
        { path: 'categories/new', name: 'CategoryNew', component: () => import('@/pages/categories/CategoryFormPage.vue') },
        { path: 'categories/:id/edit', name: 'CategoryEdit', component: () => import('@/pages/categories/CategoryFormPage.vue') },

        // Locations
        { path: 'locations', name: 'Locations', component: () => import('@/pages/locations/LocationsListPage.vue') },
        { path: 'locations/new', name: 'LocationNew', component: () => import('@/pages/locations/LocationFormPage.vue') },
        { path: 'locations/:id/edit', name: 'LocationEdit', component: () => import('@/pages/locations/LocationFormPage.vue') },

        // Assets
        { path: 'assets', name: 'Assets', component: () => import('@/pages/assets/AssetsListPage.vue') },
        { path: 'assets/new', name: 'AssetNew', component: () => import('@/pages/assets/AssetFormPage.vue') },
        { path: 'assets/:id/edit', name: 'AssetEdit', component: () => import('@/pages/assets/AssetFormPage.vue') },
        { path: 'assets/:id', redirect: to => ({ path: `/assets/${to.params.id}/edit` }) },

        // Brands
        { path: 'brands', name: 'Brands', component: () => import('@/pages/brands/BrandsListPage.vue') },        // Stock
        { path: 'stock', name: 'Stock', component: () => import('@/pages/stock/StockListPage.vue') },
        { path: 'stock/movements', name: 'StockMovements', component: () => import('@/pages/stock/StockMovementsPage.vue') },
        { path: 'stock/alerts', name: 'StockAlerts', component: () => import('@/pages/stock/StockAlertsPage.vue') },

        // Work Orders
        { path: 'work-orders', name: 'WorkOrders', component: () => import('@/pages/work-orders/WorkOrdersListPage.vue') },
        { path: 'work-orders/new', name: 'WorkOrderNew', component: () => import('@/pages/work-orders/WorkOrderFormPage.vue') },
        { path: 'work-orders/:id', name: 'WorkOrderDetail', component: () => import('@/pages/work-orders/WorkOrderDetailPage.vue') },
        { path: 'work-orders/:id/edit', name: 'WorkOrderEdit', component: () => import('@/pages/work-orders/WorkOrderFormPage.vue') },

        // Admin
        { path: 'users', name: 'Users', component: () => import('@/pages/users/UsersListPage.vue') },
        { path: 'users/new', name: 'UserNew', component: () => import('@/pages/users/UserFormPage.vue') },
        { path: 'users/:id/edit', name: 'UserEdit', component: () => import('@/pages/users/UserFormPage.vue') },
        { path: 'roles', name: 'Roles', component: () => import('@/pages/roles/RolesListPage.vue') },
        { path: 'roles/new', name: 'RoleNew', component: () => import('@/pages/roles/RoleFormPage.vue') },
        { path: 'roles/:id/edit', name: 'RoleEdit', component: () => import('@/pages/roles/RoleFormPage.vue') },
        { path: 'roles/:id/permissions', name: 'RolePermissions', component: () => import('@/pages/roles/RolePermissionsPage.vue') },

        // Invoices
        { path: 'invoices', name: 'Invoices', component: () => import('@/pages/invoices/InvoicesListPage.vue') },
        { path: 'invoices/new', name: 'InvoiceNew', component: () => import('@/pages/invoices/InvoiceFormPage.vue') },
        { path: 'invoices/:id', name: 'InvoiceDetail', component: () => import('@/pages/invoices/InvoiceDetailPage.vue') },
        { path: 'invoices/:id/edit', name: 'InvoiceEdit', component: () => import('@/pages/invoices/InvoiceFormPage.vue') },

        // Calendar
        { path: 'calendar', name: 'Calendar', component: () => import('@/pages/calendar/CalendarPage.vue') },

        // Settings
        { path: 'settings', name: 'Settings', component: () => import('@/pages/settings/SettingsPage.vue') },

        // Price Lists
        { path: 'price-lists', name: 'PriceLists', component: () => import('@/pages/price-lists/PriceListsListPage.vue') },
        { path: 'price-lists/new', name: 'PriceListNew', component: () => import('@/pages/price-lists/PriceListFormPage.vue') },
        { path: 'price-lists/:id/edit', name: 'PriceListEdit', component: () => import('@/pages/price-lists/PriceListFormPage.vue') },

        // Accounting
        { path: 'accounting/chart-of-accounts', name: 'ChartOfAccounts', component: () => import('@/pages/accounting/ChartOfAccountsListPage.vue') },
        { path: 'accounting/chart-of-accounts/new', name: 'ChartOfAccountNew', component: () => import('@/pages/accounting/ChartOfAccountFormPage.vue') },
        { path: 'accounting/chart-of-accounts/:id/edit', name: 'ChartOfAccountEdit', component: () => import('@/pages/accounting/ChartOfAccountFormPage.vue') },
        { path: 'accounting/journal-entries', name: 'JournalEntries', component: () => import('@/pages/accounting/JournalEntriesListPage.vue') },
        { path: 'accounting/journal-entries/new', name: 'JournalEntryNew', component: () => import('@/pages/accounting/JournalEntryFormPage.vue') },
        { path: 'accounting/journal-entries/:id/edit', name: 'JournalEntryEdit', component: () => import('@/pages/accounting/JournalEntryFormPage.vue') },

        // Inventory (new module)
        { path: 'inventory/stock-balances', name: 'InventoryStockBalances', component: () => import('@/pages/inventory/StockBalancesPage.vue') },
        { path: 'inventory/kardex', name: 'InventoryKardex', component: () => import('@/pages/inventory/KardexPage.vue') },
        { path: 'inventory/adjustments/create', name: 'InventoryAdjustmentCreate', component: () => import('@/pages/inventory/CreateAdjustmentPage.vue') },
        { path: 'inventory/transfers/create', name: 'InventoryTransferCreate', component: () => import('@/pages/inventory/CreateTransferPage.vue') },
        { path: 'inventory/stock-alerts', name: 'InventoryStockAlerts', component: () => import('@/pages/inventory/StockAlertsPage.vue') },

        // Purchases (new module)
        { path: 'purchases/receipts/create', name: 'PurchaseReceiptCreate', component: () => import('@/pages/purchases/CreateReceiptPage.vue') },
        { path: 'purchases/payables', name: 'PurchasePayables', component: () => import('@/pages/purchases/PayablesPage.vue') },
        { path: 'purchases/payments', name: 'PurchasePayments', component: () => import('@/pages/purchases/PaymentsPage.vue') },

        // Banking (new module)
        { path: 'banking/accounts', name: 'BankAccounts', component: () => import('@/pages/banking/AccountsPage.vue') },
        { path: 'banking/movements', name: 'BankMovements', component: () => import('@/pages/banking/MovementsPage.vue') },
        { path: 'banking/movements/create', name: 'BankMovementCreate', component: () => import('@/pages/banking/CreateMovementPage.vue') },
        { path: 'banking/movements/:id', name: 'BankMovementDetail', component: () => import('@/pages/banking/MovementDetailPage.vue') },
        { path: 'banking/transfers/create', name: 'BankTransferCreate', component: () => import('@/pages/banking/CreateTransferPage.vue') },

        // Reconciliation (new module)
        { path: 'banking/statement-lines', name: 'StatementLines', component: () => import('@/pages/reconciliation/StatementLinesPage.vue') },
        { path: 'banking/reconciliations', name: 'Reconciliations', component: () => import('@/pages/reconciliation/ReconciliationsPage.vue') },
        { path: 'banking/reconciliations/create', name: 'ReconciliationCreate', component: () => import('@/pages/reconciliation/CreateReconciliationPage.vue') },
        { path: 'banking/reconciliations/:id', name: 'ReconciliationDetail', component: () => import('@/pages/reconciliation/ReconciliationDetailPage.vue') },
        { path: 'banking/statement-imports', name: 'StatementImports', component: () => import('@/pages/reconciliation/StatementImportsPage.vue') },
      ],
    },
  ],
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.name !== 'Login' && !token) next({ name: 'Login' })
  else if (to.name === 'Login' && token) next({ name: 'Dashboard' })
  else next()
})

export default router

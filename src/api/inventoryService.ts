import api from '@/api/client'

export interface StockBalanceParams {
  product_id?: number
  warehouse_id?: number
  warehouse_location_id?: number
  only_available?: boolean
  below_minimum?: boolean
  per_page?: number
  page?: number
  [key: string]: any
}

export function getStockBalances(params: StockBalanceParams = {}) {
  return api.get('/inventory/stock-balances', { params })
}

export function getKardex(params: {
  product_id: number
  warehouse_id?: number
  warehouse_location_id?: number
  from?: string
  to?: string
  per_page?: number
  page?: number
}) {
  return api.get('/inventory/kardex', { params })
}

export function createInventoryAdjustment(payload: any) {
  return api.post('/inventory/adjustments', payload)
}

export function createInventoryTransfer(payload: any) {
  return api.post('/inventory/transfers', payload)
}

export function getProducts(params: { search?: string; per_page?: number; page?: number } = {}) {
  return api.get('/products', { params })
}

export function getSuppliers(params: { search?: string; per_page?: number; page?: number } = {}) {
  return api.get('/suppliers', { params })
}

export function getWarehouses(params: { per_page?: number } = {}) {
  return api.get('/warehouses', { params })
}

export function getWarehouseLocations(params: { warehouse_id?: number; per_page?: number } = {}) {
  return api.get('/warehouse-locations', { params })
}

export function getChartOfAccounts(params: { search?: string; per_page?: number; page?: number } = {}) {
  return api.get('/chart-of-accounts', { params })
}

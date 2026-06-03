import api from '@/api/client'

export interface PriceList {
  id: number
  name: string
  code: string
  is_default: boolean
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface ProductPrice {
  id?: number
  product_id: number
  price_list_id: number
  price_without_tax: number
  price_with_tax: number
  price_list?: PriceList
}

export async function getPriceLists(): Promise<PriceList[]> {
  const res = await api.get('/price-lists')
  const raw = res?.data
  const list = Array.isArray(raw?.data) ? raw.data : (Array.isArray(raw) ? raw : [])
  return list
}

export async function getPriceList(id: number): Promise<PriceList> {
  const res = await api.get(`/price-lists/${id}`)
  return res?.data?.data
}

export async function createPriceList(data: Partial<PriceList>): Promise<PriceList> {
  const res = await api.post('/price-lists', data)
  return res?.data?.data
}

export async function updatePriceList(id: number, data: Partial<PriceList>): Promise<PriceList> {
  const res = await api.put(`/price-lists/${id}`, data)
  return res?.data?.data
}

export async function deletePriceList(id: number): Promise<void> {
  await api.delete(`/price-lists/${id}`)
}

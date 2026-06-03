import api from '@/api/client'

export function getPayables(params: {
  supplier_id?: number
  status?: string
  only_pending?: boolean
  due_from?: string
  due_to?: string
  per_page?: number
  page?: number
} = {}) {
  return api.get('/purchases/payables', { params })
}

export function getPayable(id: number) {
  return api.get(`/purchases/payables/${id}`)
}

export function updatePayable(id: number, payload: { due_date?: string; description?: string; payment_terms_days?: number }) {
  return api.put(`/purchases/payables/${id}`, payload)
}

export function createPayablePayment(accountPayableId: number, payload: {
  payment_date: string
  amount: number
  method: string
  reference?: string
  bank_account_id?: number
  notes?: string
}) {
  return api.post(`/purchases/payables/${accountPayableId}/payments`, payload)
}

export function getPayments(params: {
  account_payable_id?: number
  per_page?: number
  page?: number
} = {}) {
  return api.get('/purchases/payments', { params })
}

export function cancelPayment(paymentId: number, payload: { reason: string }) {
  return api.post(`/purchases/payments/${paymentId}/cancel`, payload)
}

export function createPurchaseReceipt(payload: any) {
  return api.post('/inventory/purchase-receipts', payload)
}

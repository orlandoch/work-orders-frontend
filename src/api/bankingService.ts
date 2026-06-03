import api from '@/api/client'

export function getBankAccounts(params: {
  search?: string
  is_active?: boolean
  per_page?: number
  page?: number
} = {}) {
  return api.get('/banking/bank-accounts', { params })
}

export function getBankAccount(id: number) {
  return api.get(`/banking/bank-accounts/${id}`)
}

export function createBankAccount(payload: any) {
  return api.post('/banking/bank-accounts', payload)
}

export function updateBankAccount(id: number, payload: any) {
  return api.put(`/banking/bank-accounts/${id}`, payload)
}

export function getBankMovements(params: {
  bank_account_id?: number
  type?: string
  direction?: string
  status?: string
  movement_from?: string
  movement_to?: string
  only_manual?: boolean
  only_transfers?: boolean
  has_journal_entry?: boolean
  per_page?: number
  page?: number
} = {}) {
  return api.get('/banking/movements', { params })
}

export function getBankMovement(id: number) {
  return api.get(`/banking/movements/${id}`)
}

export function createBankMovement(payload: {
  bank_account_id: number
  type: string
  amount: number
  movement_date: string
  description: string
  notes?: string
  create_journal_entry?: boolean
  chart_of_account_id?: number
}) {
  return api.post('/banking/movements', payload)
}

export function reverseBankMovement(id: number, payload: { reason: string }) {
  return api.post(`/banking/movements/${id}/reverse`, payload)
}

export function createBankTransfer(payload: {
  from_bank_account_id: number
  to_bank_account_id: number
  amount: number
  transfer_date: string
  description?: string
  reference?: string
  notes?: string
  create_journal_entry?: boolean
}) {
  return api.post('/banking/transfers', payload)
}

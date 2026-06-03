import api from '@/api/client'

// ─── Statement Lines ──────────────────────

export function getStatementLines(params: {
  bank_account_id?: number
  direction?: string
  is_reconciled?: boolean
  statement_from?: string
  statement_to?: string
  reference?: string
  per_page?: number
  page?: number
} = {}) {
  return api.get('/banking/statement-lines', { params })
}

export function getStatementLine(id: number) {
  return api.get(`/banking/statement-lines/${id}`)
}

export function createStatementLine(payload: {
  bank_account_id: number
  statement_date: string
  description: string
  amount: number
  direction: string
  reference?: string
  notes?: string
}) {
  return api.post('/banking/statement-lines', payload)
}

export function updateStatementLine(id: number, payload: any) {
  return api.put(`/banking/statement-lines/${id}`, payload)
}

export function deleteStatementLine(id: number) {
  return api.delete(`/banking/statement-lines/${id}`)
}

// ─── Reconciliations ──────────────────────

export function getReconciliations(params: {
  bank_account_id?: number
  status?: string
  per_page?: number
  page?: number
} = {}) {
  return api.get('/banking/reconciliations', { params })
}

export function getReconciliation(id: number) {
  return api.get(`/banking/reconciliations/${id}`)
}

export function createReconciliation(payload: {
  bank_account_id: number
  period_start: string
  period_end: string
  statement_balance: number
  notes?: string
}) {
  return api.post('/banking/reconciliations', payload)
}

export function matchReconciliation(periodId: number, payload: {
  bank_movement_id: number
  bank_statement_line_id: number
  notes?: string
}) {
  return api.post(`/banking/reconciliations/${periodId}/match`, payload)
}

export function unmatchReconciliation(periodId: number, lineId: number) {
  return api.post(`/banking/reconciliations/${periodId}/unmatch/${lineId}`)
}

export function recalculateReconciliation(periodId: number) {
  return api.post(`/banking/reconciliations/${periodId}/recalculate`)
}

export function markReconciledReconciliation(periodId: number) {
  return api.post(`/banking/reconciliations/${periodId}/mark-reconciled`)
}

export function closeReconciliation(periodId: number) {
  return api.post(`/banking/reconciliations/${periodId}/close`)
}

export function getReconciliationSuggestions(periodId: number) {
  return api.get(`/banking/reconciliations/${periodId}/suggestions`)
}

export function acceptReconciliationSuggestion(periodId: number, payload: {
  bank_movement_id: number
  bank_statement_line_id: number
  notes?: string
}) {
  return api.post(`/banking/reconciliations/${periodId}/accept-suggestion`, payload)
}

// ─── Statement Imports ────────────────────

export function previewStatementImport(formData: FormData) {
  return api.post('/banking/statement-imports/preview', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export function confirmStatementImport(importId: number, payload: { skip_duplicates?: boolean }) {
  return api.post(`/banking/statement-imports/${importId}/confirm`, payload)
}

export function getStatementImports(params: {
  bank_account_id?: number
  status?: string
  per_page?: number
  page?: number
} = {}) {
  return api.get('/banking/statement-imports', { params })
}

export function getStatementImport(id: number) {
  return api.get(`/banking/statement-imports/${id}`)
}

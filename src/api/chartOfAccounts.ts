import apiClient from './client'
import type { PaginatedResponse } from './types'

export interface ChartOfAccount {
  id: number
  code: string
  name: string
  type: 'asset' | 'liability' | 'equity' | 'income' | 'expense' | 'cost'
  normal_balance: 'debit' | 'credit'
  level: number
  parent_id: number | null
  parent?: { id: number; code: string; name: string } | null
  is_active: boolean
  created_at: string
}

export interface ChartOfAccountInput {
  code: string
  name: string
  type: string
  normal_balance: string
  level: number
  parent_id: number | null
  is_active: boolean
}

export async function getChartOfAccounts(params?: Record<string, any>): Promise<PaginatedResponse<ChartOfAccount>> {
  const res = await apiClient.get('/chart-of-accounts', { params })
  return res.data
}

export async function getAllAccounts(): Promise<{ success: boolean; data: ChartOfAccount[] }> {
  const res = await apiClient.get('/chart-of-accounts/all')
  return res.data
}

export async function getChartOfAccount(id: number): Promise<{ success: boolean; data: ChartOfAccount }> {
  const res = await apiClient.get(`/chart-of-accounts/${id}`)
  return res.data
}

export async function createChartOfAccount(data: ChartOfAccountInput): Promise<{ success: boolean; data: ChartOfAccount }> {
  const res = await apiClient.post('/chart-of-accounts', data)
  return res.data
}

export async function updateChartOfAccount(id: number, data: Partial<ChartOfAccountInput>): Promise<{ success: boolean; data: ChartOfAccount }> {
  const res = await apiClient.put(`/chart-of-accounts/${id}`, data)
  return res.data
}

export async function deleteChartOfAccount(id: number): Promise<{ success: boolean }> {
  const res = await apiClient.delete(`/chart-of-accounts/${id}`)
  return res.data
}

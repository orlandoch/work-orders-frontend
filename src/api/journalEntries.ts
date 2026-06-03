import apiClient from './client'
import type { PaginatedResponse } from './types'
import type { ChartOfAccount } from './chartOfAccounts'

export interface JournalEntryLine {
  id?: number
  chart_of_account_id: number
  chart_of_account?: ChartOfAccount
  debit: number
  credit: number
  description: string | null
}

export interface JournalEntry {
  id: number
  code: string
  description: string
  date: string
  type: string
  reference_type: string | null
  reference_id: number | null
  created_by: number | null
  creator?: { id: number; name: string }
  status: 'draft' | 'posted'
  lines: JournalEntryLine[]
  total_debit?: number
  total_credit?: number
  is_balanced?: boolean
  created_at: string
}

export interface JournalEntryInput {
  description: string
  date: string
  type: string
  lines: {
    chart_of_account_id: number
    debit: number
    credit: number
    description: string | null
  }[]
}

export async function getJournalEntries(params?: Record<string, any>): Promise<PaginatedResponse<JournalEntry>> {
  const res = await apiClient.get('/journal-entries', { params })
  return res.data
}

export async function getJournalEntry(id: number): Promise<{ success: boolean; data: JournalEntry }> {
  const res = await apiClient.get(`/journal-entries/${id}`)
  return res.data
}

export async function createJournalEntry(data: JournalEntryInput): Promise<{ success: boolean; data: JournalEntry }> {
  const res = await apiClient.post('/journal-entries', data)
  return res.data
}

export async function updateJournalEntry(id: number, data: JournalEntryInput): Promise<{ success: boolean; data: JournalEntry }> {
  const res = await apiClient.put(`/journal-entries/${id}`, data)
  return res.data
}

export async function deleteJournalEntry(id: number): Promise<{ success: boolean }> {
  const res = await apiClient.delete(`/journal-entries/${id}`)
  return res.data
}

export async function postJournalEntry(id: number): Promise<{ success: boolean; data: JournalEntry }> {
  const res = await apiClient.post(`/journal-entries/${id}/post`)
  return res.data
}

import api from './client'
import type { ApiResponse } from './types'

export interface EmissionPoint {
  id: number
  establishment_id: number
  code: string
  name: string | null
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface Establishment {
  id: number
  code: string
  name: string
  address: string | null
  is_active: boolean
  emission_points?: EmissionPoint[]
  created_at?: string
  updated_at?: string
}

export async function getEstablishments(params?: Record<string, any>): Promise<ApiResponse<Establishment[]>> {
  const { data } = await api.get('/establishments', { params })
  return data
}

export async function getEstablishment(id: number): Promise<ApiResponse<Establishment>> {
  const { data } = await api.get(`/establishments/${id}`)
  return data
}

export async function createEstablishment(payload: Partial<Establishment>): Promise<ApiResponse<Establishment>> {
  const { data } = await api.post('/establishments', payload)
  return data
}

export async function updateEstablishment(id: number, payload: Partial<Establishment>): Promise<ApiResponse<Establishment>> {
  const { data } = await api.put(`/establishments/${id}`, payload)
  return data
}

export async function deleteEstablishment(id: number): Promise<void> {
  await api.delete(`/establishments/${id}`)
}

export async function createEmissionPoint(establishmentId: number, payload: Partial<EmissionPoint>): Promise<ApiResponse<EmissionPoint>> {
  const { data } = await api.post(`/establishments/${establishmentId}/emission-points`, payload)
  return data
}

export async function updateEmissionPoint(establishmentId: number, id: number, payload: Partial<EmissionPoint>): Promise<ApiResponse<EmissionPoint>> {
  const { data } = await api.put(`/establishments/${establishmentId}/emission-points/${id}`, payload)
  return data
}

export async function deleteEmissionPoint(establishmentId: number, id: number): Promise<void> {
  await api.delete(`/establishments/${establishmentId}/emission-points/${id}`)
}

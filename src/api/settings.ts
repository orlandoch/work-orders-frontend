import api from './client'

export interface SettingEntry {
  id: number
  key: string
  value: any
  type: string
  label: string | null
  description: string | null
  sort_order: number
}

export interface SettingsGrouped {
  [group: string]: SettingEntry[]
}

export async function fetchSettings(): Promise<SettingsGrouped> {
  const { data } = await api.get('/settings')
  return data.data
}

export async function updateSettings(settings: Record<string, any>): Promise<SettingsGrouped> {
  const { data } = await api.put('/settings', { settings })
  return data.data
}

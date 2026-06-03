export interface WorkOrderStatus {
  id: number
  name: string
  slug: string
  code?: string
  color: string
}

export interface WorkOrderResponse {
  id: number
  type: 'client' | 'production'
  title: string
  description: string
  notes: string
  priority: string
  status_id: number
  status: WorkOrderStatus
  client_id: number | null
  client?: {
    id: number
    full_name: string
    [key: string]: unknown
  }
  location_id: number | null
  scheduled_date: string | null
  product_id: number | null
  product?: {
    id: number
    name: string
    cost_price: number
    type: string
    [key: string]: unknown
  }
  produced_quantity: number | null
  serial_numbers: string[] | null
  members?: WorkOrderMember[]
  attachments?: unknown[]
  created_at: string
  [key: string]: unknown
}

export interface ContactInfo {
  phone?: string
  email?: string
  address?: string
}

export interface WorkOrderFormData {
  type: 'client' | 'production'
  title: string
  description: string
  notes: string
  priority: string
  scheduled_date: string | null
  client_id: number | null
  location_id: number | null
  status_id: number | null
  product_id: number | null
  produced_quantity: number | null
  serial_numbers: string[]
  contract_id: number | null
  billing_basis: string
  billing_mode: string
  members: WorkOrderMember[]
  materials: WorkOrderMaterial[]
  machine_usages: WorkOrderMachineUsage[]
}

export interface WorkOrderMember {
  user_id: number
  is_leader: boolean
}

export interface WorkOrderMaterial {
  product_id: number
  estimated_quantity: number
  real_quantity: number
  waste_quantity: number
  estimated_unit_cost: number
  real_unit_cost: number
}

export interface WorkOrderMachineUsage {
  machine_id: number
  quantity: number
  cost_per_unit: number
}

export interface Location {
  id: number
  name: string
}

export interface Contract {
  id: number
  name?: string
  description?: string
  status?: string
}

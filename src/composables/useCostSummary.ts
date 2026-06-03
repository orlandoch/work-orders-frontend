import { computed, type ComputedRef } from 'vue'

interface Material {
  real_unit_cost?: number
  real_quantity?: number
  waste_quantity?: number
}

interface MachineUsage {
  cost_per_unit?: number
  quantity?: number
}

interface CostableOrder {
  materials?: Material[]
  machine_usages?: MachineUsage[]
  produced_quantity?: number
}

export function useCostSummary(order: { value: CostableOrder | null }): {
  materialCost: ComputedRef<number>
  machineCost: ComputedRef<number>
  totalCost: ComputedRef<number>
  unitCost: ComputedRef<number>
} {
  const materialCost = computed(() => {
    return (order.value?.materials || []).reduce((sum, m) => {
      const qty = (m.real_quantity ?? 0) - (m.waste_quantity ?? 0)
      return sum + (m.real_unit_cost ?? 0) * qty
    }, 0)
  })

  const machineCost = computed(() => {
    return (order.value?.machine_usages || []).reduce((sum, m) => {
      return sum + (m.cost_per_unit ?? 0) * (m.quantity ?? 0)
    }, 0)
  })

  const totalCost = computed(() => materialCost.value + machineCost.value)

  const unitCost = computed(() =>
    order.value?.produced_quantity
      ? totalCost.value / order.value.produced_quantity
      : 0,
  )

  return { materialCost, machineCost, totalCost, unitCost }
}

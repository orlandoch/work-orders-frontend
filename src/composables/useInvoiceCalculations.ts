import { computed, type ComputedRef, type Ref } from 'vue'

export interface InvoiceItem {
  id?: number
  quantity: number
  unit_price: number
  discount?: number
  total?: number
  iva_sri_code?: string
  iva?: { id: number; percentage: number; code: string; sri_percentage_code?: string }
  iva_id?: number
  iva_label?: string
  product?: { id: number; name: string }
  description?: string
}

export interface SubtotalGroup {
  label: string
  base: number
}

export interface UseInvoiceCalculationsReturn {
  subtotal: ComputedRef<number>
  totalDescuento: ComputedRef<number>
  ivaAmount: ComputedRef<number>
  total: ComputedRef<number>
  subtotalesPorIva: ComputedRef<SubtotalGroup[]>
  formatMoney: (amount: number) => string
}

/**
 * Cálculos reutilizables para facturas: subtotales, IVA, descuentos.
 * @param items Ref reactiva a un array de InvoiceItem (invoice.items)
 */
export function useInvoiceCalculations(items: Ref<InvoiceItem[]>): UseInvoiceCalculationsReturn {
  const IVA_LABELS: Record<string, string> = {
    '0': '0%',
    '2': '12%',
    '4': '15%',
    '5': '5%',
  }

  const IVA_PCT_BY_CODE: Record<string, number> = {
    '0': 0,
    '2': 12,
    '4': 15,
    '5': 5,
  }

  function sriCode(item: InvoiceItem): string {
    return (item.iva_sri_code || item.iva?.sri_percentage_code || '4').toString()
  }

  function lineTotal(item: InvoiceItem): number {
    const qty = Number(item.quantity ?? 1)
    const price = Number(item.unit_price ?? 0)
    const disc = Number(item.discount ?? 0)
    return qty * price - disc
  }

  const subtotal = computed(() =>
    items.value.reduce((sum, item) => sum + lineTotal(item), 0),
  )

  const totalDescuento = computed(() =>
    items.value.reduce((sum, item) => sum + Number(item.discount ?? 0), 0),
  )

  const ivaAmount = computed(() =>
    items.value.reduce((sum, item) => {
      const pct = IVA_PCT_BY_CODE[sriCode(item)] ?? 15
      return sum + lineTotal(item) * pct / 100
    }, 0),
  )

  const total = computed(() => subtotal.value + ivaAmount.value)

  const subtotalesPorIva = computed<SubtotalGroup[]>(() => {
    const grupos: Record<string, SubtotalGroup> = {}
    for (const item of items.value) {
      const code = sriCode(item)
      if (!grupos[code]) {
        grupos[code] = { label: IVA_LABELS[code] || `${code}%`, base: 0 }
      }
      grupos[code].base += lineTotal(item)
    }
    return Object.values(grupos)
  })

  function formatMoney(val: number | string): string {
    return Number(val).toFixed(2)
  }

  return {
    subtotal,
    totalDescuento,
    ivaAmount,
    total,
    subtotalesPorIva,
    formatMoney,
  }
}

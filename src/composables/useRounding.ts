import { type Ref, unref } from 'vue'

/** Tipos de redondeo para precios/productos */
export type RoundingMode = 'half_up' | 'half_down' | 'half_even' | 'ceil' | 'floor'

/**
 * Utilidades de redondeo y precio IVA.
 * Acepta valores planos o refs para reactividad.
 */
export function useRounding(
  decimalPlaces?: number | Ref<number>,
  mode?: RoundingMode | Ref<RoundingMode>,
) {
  function round(value: number, decimals?: number | Ref<number>, roundMode?: RoundingMode | Ref<RoundingMode>): number {
    const d = decimals !== undefined ? unref(decimals) : unref(decimalPlaces ?? 2)
    const m = roundMode !== undefined ? unref(roundMode) : unref(mode ?? 'half_up')
    const factor = Math.pow(10, d)
    let result: number
    switch (m) {
      case 'half_up':
        result = Math.round(value * factor) / factor; break
      case 'half_down': {
        const f = Math.floor(value * factor) / factor
        result = (value - f) === 0.5 / factor ? f : Math.round(value * factor) / factor
        break
      }
      case 'half_even': {
        const sc = value * factor
        const fl = Math.floor(sc)
        result = (sc - fl) === 0.5
          ? (fl % 2 === 0 ? fl / factor : (fl + 1) / factor)
          : Math.round(sc) / factor
        break
      }
      case 'ceil': result = Math.ceil(value * factor) / factor; break
      case 'floor': result = Math.floor(value * factor) / factor; break
      default: result = Math.round(value * factor) / factor
    }
    return result
  }

  function computePriceWithTax(withoutTax: number, ivaPct: number): number {
    return round(withoutTax * (1 + ivaPct / 100))
  }

  function computePriceWithoutTax(withTax: number, ivaPct: number): number {
    const rounded = round(withTax)
    return ivaPct > 0 ? rounded / (1 + ivaPct / 100) : rounded
  }

  function formatMoney(val: number | string): string {
    return Number(val).toFixed(unref(decimalPlaces ?? 2))
  }

  return { round, computePriceWithTax, computePriceWithoutTax, formatMoney }
}

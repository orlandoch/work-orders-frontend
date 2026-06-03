<template>
  <Tag
    :value="label"
    :severity="severity"
    class="text-xs"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Tag from 'primevue/tag'

const props = defineProps<{
  value: string
  map?: Record<string, string>
}>()

const labels: Record<string, string> = props.map || {
  active: 'Activo', posted: 'Contabilizado', draft: 'Borrador',
  reconciled: 'Conciliado', closed: 'Cerrado', in_progress: 'En progreso',
  pending: 'Pendiente', cancelled: 'Anulado', completed: 'Completado',
  paid: 'Pagado', partial: 'Parcial',
  income: 'Ingreso', expense: 'Egreso',
  manual_income: 'Ingreso manual', manual_expense: 'Egreso manual',
  supplier_payment: 'Pago proveedor', transfer_in: 'Transferencia entra', transfer_out: 'Transferencia sale',
  previewed: 'Previsualizado', imported: 'Importado', imported_with_errors: 'Importado con errores',
  valid: 'Válido', invalid: 'Inválido', duplicate: 'Duplicado', skipped: 'Omitido',
  adjustment_positive: 'Ajuste positivo', adjustment_negative: 'Ajuste negativo',
  purchase_reception: 'Recepción compra',
}

const severity = computed(() => {
  const sev: Record<string, string> = {
    active: 'success', posted: 'info', reconciled: 'success', closed: 'contrast',
    in_progress: 'warn', draft: 'secondary', pending: 'warn', cancelled: 'danger',
    completed: 'success', paid: 'success', partial: 'warn', imported: 'info',
    previewed: 'info', valid: 'success', duplicate: 'warn', invalid: 'danger',
    skipped: 'secondary', income: 'success', expense: 'danger',
    manual_income: 'success', manual_expense: 'danger',
    adjustment_positive: 'success', adjustment_negative: 'danger',
  }
  return sev[props.value] || 'info'
})

const label = computed(() => labels[props.value] || props.value)
</script>

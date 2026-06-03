<template>
  <Card>
    <template #title>
      <span class="flex items-center gap-2">
        <i class="pi pi-wallet"></i>
        Abonos
      </span>
    </template>
    <template #content>
      <div v-if="paymentsData" class="grid grid-cols-3 gap-4 mb-4">
        <div class="bg-blue-50 rounded p-3 text-center">
          <div class="text-xs text-gray-500">Total orden</div>
          <div class="text-lg font-bold text-gray-800">${{ paymentsData.total_amount.toFixed(2) }}</div>
        </div>
        <div class="bg-green-50 rounded p-3 text-center">
          <div class="text-xs text-gray-500">Abonado</div>
          <div class="text-lg font-bold text-green-600">${{ paymentsData.total_paid.toFixed(2) }}</div>
        </div>
        <div class="bg-purple-50 rounded p-3 text-center">
          <div class="text-xs text-gray-500">Saldo</div>
          <div class="text-lg font-bold" :class="saldoClass">${{ paymentsData.balance.toFixed(2) }}</div>
        </div>
      </div>

      <DataTable :value="paymentsData?.payments || []" size="small" stripedRows class="text-xs w-full">
        <Column field="payment_date" header="Fecha">
          <template #body="s">{{ s.data.payment_date }}</template>
        </Column>
        <Column field="payment_method" header="Método">
          <template #body="s">
            <Tag :value="methodLabel(s.data.payment_method)" :severity="methodSeverity(s.data.payment_method)" />
          </template>
        </Column>
        <Column field="reference" header="Ref." />
        <Column field="amount" header="Monto" class="text-right">
          <template #body="s">${{ Number(s.data.amount).toFixed(2) }}</template>
        </Column>
        <Column header="" class="w-12">
          <template #body="s">
            <Button icon="pi pi-trash" text rounded severity="danger" size="small"
              @click="confirmDelete(s.data)" />
          </template>
        </Column>
      </DataTable>

      <div v-if="!paymentsData?.payments?.length" class="text-gray-400 text-sm py-3 text-center">
        Sin abonos registrados
      </div>

      <div class="mt-3 pt-3 border-t flex items-end gap-3">
        <div class="flex-1">
          <label class="text-xs text-gray-500 block mb-1">Monto</label>
          <InputNumber v-model="form.amount" :min="0" :max="remaining" :step="0.01" placeholder="0.00"
            class="w-full" inputClass="text-sm" />
        </div>
        <div class="w-36">
          <label class="text-xs text-gray-500 block mb-1">Método</label>
          <Select v-model="form.payment_method" :options="methods" optionLabel="label" optionValue="value"
            class="w-full" />
        </div>
        <div class="w-36">
          <label class="text-xs text-gray-500 block mb-1">Ref.</label>
          <InputText v-model="form.reference" placeholder="Opcional" class="w-full text-sm" />
        </div>
        <div>
          <Button label="Registrar abono" icon="pi pi-plus" size="small" :loading="saving"
            :disabled="!form.amount || form.amount <= 0" @click="submit" />
        </div>
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import api from '@/api/client'

const toast = useToast()

const props = defineProps<{
  workOrderId: number
}>()

const paymentsData = ref<any>(null)
const loading = ref(false)
const saving = ref(false)
const form = ref({
  amount: null as number | null,
  payment_date: new Date().toISOString().split('T')[0],
  payment_method: 'cash',
  reference: '',
})

const methods = [
  { label: 'Efectivo', value: 'cash' },
  { label: 'Transferencia', value: 'transfer' },
  { label: 'Cheque', value: 'check' },
  { label: 'Tarjeta', value: 'card' },
]

const remaining = computed(() => {
  if (!paymentsData.value) return 0
  return Math.max(0, paymentsData.value.balance)
})

const saldoClass = computed(() => {
  if (!paymentsData.value) return 'text-gray-800'
  return paymentsData.value.balance <= 0 ? 'text-green-600' : 'text-amber-600'
})

function methodLabel(m: string) {
  return methods.find(x => x.value === m)?.label || m
}
function methodSeverity(m: string) {
  const map: Record<string, string> = { cash: 'info', transfer: 'success', check: 'warn', card: 'contrast' }
  return map[m] || 'info'
}

async function fetchPayments() {
  loading.value = true
  try {
    const res = await api.get(`/work-orders/${props.workOrderId}/payments`)
    paymentsData.value = res.data.data
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar abonos', life: 5000 })
  } finally {
    loading.value = false
  }
}

async function submit() {
  if (!form.value.amount || form.value.amount <= 0) return
  saving.value = true
  try {
    const payload = { ...form.value, payment_date: form.value.payment_date || new Date().toISOString().split('T')[0] }
    await api.post(`/work-orders/${props.workOrderId}/payments`, payload)
    toast.add({ severity: 'success', summary: 'Abono registrado', life: 3000 })
    form.value.amount = null
    form.value.reference = ''
    await fetchPayments()
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'Error al registrar', life: 5000 })
  } finally {
    saving.value = false
  }
}

async function confirmDelete(payment: any) {
  if (!confirm('¿Eliminar este abono?')) return
  try {
    await api.delete(`/payments/${payment.id}`)
    toast.add({ severity: 'success', summary: 'Abono eliminado', life: 3000 })
    await fetchPayments()
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar abono', life: 5000 })
  }
}

watch(() => props.workOrderId, () => fetchPayments(), { immediate: true })
</script>

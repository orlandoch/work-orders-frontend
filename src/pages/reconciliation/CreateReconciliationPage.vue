<template>
  <div>
    <Card>
      <template #title>Nuevo Período de Conciliación</template>
      <template #content>
        <div class="grid p-fluid">
          <div class="col-12">
            <label>Cuenta Bancaria *</label>
            <BankAccountSelect v-model="form.bank_account_id" />
            <small v-if="errors.bank_account_id" class="p-error">{{ errors.bank_account_id }}</small>
          </div>
          <div class="col-12 md:col-4">
            <label>Inicio *</label>
            <DatePicker v-model="form.period_start" dateFormat="yy-mm-dd" class="w-full" />
          </div>
          <div class="col-12 md:col-4">
            <label>Fin *</label>
            <DatePicker v-model="form.period_end" dateFormat="yy-mm-dd" class="w-full" />
          </div>
          <div class="col-12 md:col-4">
            <label>Saldo Estado Cuenta *</label>
            <InputNumber v-model="form.statement_balance" mode="currency" currency="USD" locale="es-US" class="w-full" :invalid="!!errors.statement_balance" />
            <small v-if="errors.statement_balance" class="p-error">{{ errors.statement_balance }}</small>
          </div>
          <div class="col-12">
            <label>Notas</label>
            <Textarea v-model="form.notes" rows="2" />
          </div>
        </div>

        <div class="flex gap-2 mt-3">
          <Button label="Crear Período" icon="pi pi-check" :loading="saving" @click="save" />
          <Button label="Cancelar" severity="secondary" @click="$router.back()" />
        </div>

        <Message v-if="result" severity="success" class="mt-3">
          Período creado. ID: {{ result.reconciliation_period_id }}, Saldo apertura: ${{ Number(result.opening_balance).toFixed(2) }}
        </Message>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { createReconciliation } from '@/api/reconciliationService'
import BankAccountSelect from '@/components/BankAccountSelect.vue'
import { useToast } from 'primevue/usetoast'
import { useRouter } from 'vue-router'
import Card from 'primevue/card'
import DatePicker from 'primevue/datepicker'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import Message from 'primevue/message'

const toast = useToast()
const router = useRouter()
const saving = ref(false)
const result = ref<any>(null)

const form = reactive({
  bank_account_id: null as number | null,
  period_start: new Date().toISOString().substring(0, 10) as string,
  period_end: null as string | null,
  statement_balance: null as number | null,
  notes: '',
})
const errors = reactive<Record<string, string>>({})

async function save() {
  Object.keys(errors).forEach(k => delete errors[k])
  if (!form.bank_account_id) { errors.bank_account_id = 'Requerido'; return }
  if (!form.period_start) { toast.add({ severity: 'warn', summary: 'Fecha inicio requerida', life: 3000 }); return }
  if (!form.period_end) { toast.add({ severity: 'warn', summary: 'Fecha fin requerida', life: 3000 }); return }
  if (form.statement_balance === null) { errors.statement_balance = 'Requerido'; return }

  saving.value = true
  result.value = null
  try {
    const res = await createReconciliation({
      bank_account_id: form.bank_account_id,
      period_start: form.period_start,
      period_end: form.period_end,
      statement_balance: form.statement_balance,
      notes: form.notes || undefined,
    })
    result.value = res.data?.data || res.data
    toast.add({ severity: 'success', summary: 'Período creado', detail: `ID: ${result.value?.reconciliation_period_id}`, life: 4000 })
  } catch (e: any) {
    const data = e.response?.data
    if (data?.errors) for (const [k, msgs] of Object.entries(data.errors)) errors[k] = (msgs as string[]).join(', ')
    toast.add({ severity: 'error', summary: 'Error', detail: data?.message || 'Error', life: 4000 })
  } finally {
    saving.value = false
  }
}
</script>

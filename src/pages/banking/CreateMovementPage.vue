<template>
  <div>
    <Card>
      <template #title>Crear Movimiento Bancario Manual</template>
      <template #content>
        <div class="grid p-fluid">
          <div class="col-12 md:col-6">
            <label>Cuenta Bancaria *</label>
            <BankAccountSelect v-model="form.bank_account_id" />
            <small v-if="errors.bank_account_id" class="p-error">{{ errors.bank_account_id }}</small>
          </div>
          <div class="col-12 md:col-6">
            <label>Tipo *</label>
            <Select v-model="form.type" :options="typeOptions" optionLabel="label" optionValue="value" class="w-full" />
          </div>
          <div class="col-12 md:col-4">
            <label>Monto *</label>
            <InputNumber v-model="form.amount" :min="0.01" mode="currency" currency="USD" locale="es-US" class="w-full" :invalid="!!errors.amount" />
            <small v-if="errors.amount" class="p-error">{{ errors.amount }}</small>
          </div>
          <div class="col-12 md:col-4">
            <label>Fecha *</label>
            <DatePicker v-model="form.movement_date" dateFormat="yy-mm-dd" class="w-full" />
          </div>
          <div class="col-12 md:col-4 flex align-items-center">
            <Checkbox v-model="form.create_journal_entry" binary />
            <label class="ml-1">Crear asiento contable</label>
          </div>
          <div class="col-12">
            <label>Descripción *</label>
            <InputText v-model="form.description" :invalid="!!errors.description" />
            <small v-if="errors.description" class="p-error">{{ errors.description }}</small>
          </div>
          <div class="col-12">
            <label>Notas</label>
            <Textarea v-model="form.notes" rows="2" />
          </div>
          <div v-if="form.create_journal_entry" class="col-12 md:col-6">
            <label>Cuenta Contable (contrapartida) *</label>
            <ChartOfAccountSelect v-model="form.chart_of_account_id" />
          </div>
        </div>

        <div class="flex gap-2 mt-3">
          <Button label="Guardar Movimiento" icon="pi pi-check" :loading="saving" @click="save" />
          <Button label="Cancelar" severity="secondary" @click="$router.back()" />
        </div>

        <Message v-if="result" severity="success" class="mt-3">
          Movimiento #{{ result.bank_movement_id }} creado. Saldo: ${{ Number(result.balance_after).toFixed(2) }}
          <template v-if="result.journal_entry_id"> | Asiento: {{ result.journal_entry_id }}</template>
        </Message>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { createBankMovement } from '@/api/bankingService'
import BankAccountSelect from '@/components/BankAccountSelect.vue'
import ChartOfAccountSelect from '@/components/ChartOfAccountSelect.vue'
import { useToast } from 'primevue/usetoast'
import Card from 'primevue/card'
import Select from 'primevue/select'
import InputNumber from 'primevue/inputnumber'
import DatePicker from 'primevue/datepicker'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import Message from 'primevue/message'

const toast = useToast()
const saving = ref(false)
const result = ref<any>(null)

const typeOptions = [
  { label: 'Ingreso Manual', value: 'manual_income' },
  { label: 'Egreso Manual', value: 'manual_expense' },
]

const form = reactive({
  bank_account_id: null as number | null,
  type: 'manual_income',
  amount: null as number | null,
  movement_date: new Date().toISOString().substring(0, 10) as string,
  description: '',
  notes: '',
  create_journal_entry: false,
  chart_of_account_id: null as number | null,
})

const errors = reactive<Record<string, string>>({})

async function save() {
  Object.keys(errors).forEach(k => delete errors[k])
  if (!form.bank_account_id) { errors.bank_account_id = 'Requerido'; return }
  if (!form.amount || form.amount <= 0) { errors.amount = 'Monto inválido'; return }
  if (!form.description) { errors.description = 'Descripción requerida'; return }
  if (!form.movement_date) { toast.add({ severity: 'warn', summary: 'Fecha requerida', life: 3000 }); return }

  saving.value = true
  result.value = null
  try {
    const payload: any = {
      bank_account_id: form.bank_account_id,
      type: form.type,
      amount: form.amount,
      movement_date: form.movement_date,
      description: form.description,
    }
    if (form.notes) payload.notes = form.notes
    if (form.create_journal_entry) {
      payload.create_journal_entry = true
      payload.chart_of_account_id = form.chart_of_account_id
    }

    const res = await createBankMovement(payload)
    result.value = res.data?.data || res.data
    toast.add({ severity: 'success', summary: 'Movimiento creado', life: 3000 })
  } catch (e: any) {
    const data = e.response?.data
    if (data?.errors) for (const [k, msgs] of Object.entries(data.errors)) errors[k] = (msgs as string[]).join(', ')
    toast.add({ severity: 'error', summary: 'Error', detail: data?.message || 'Error', life: 4000 })
  } finally {
    saving.value = false
  }
}
</script>

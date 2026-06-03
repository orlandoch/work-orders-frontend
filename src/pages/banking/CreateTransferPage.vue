<template>
  <div>
    <Card>
      <template #title>Transferencia Bancaria</template>
      <template #content>
        <div class="grid p-fluid">
          <div class="col-12 md:col-6">
            <label>Cuenta Origen *</label>
            <BankAccountSelect v-model="form.from_bank_account_id" placeholder="Cuenta origen" />
            <small v-if="errors.from_bank_account_id" class="p-error">{{ errors.from_bank_account_id }}</small>
          </div>
          <div class="col-12 md:col-6">
            <label>Cuenta Destino *</label>
            <BankAccountSelect v-model="form.to_bank_account_id" placeholder="Cuenta destino" />
            <small v-if="errors.to_bank_account_id" class="p-error">{{ errors.to_bank_account_id }}</small>
          </div>
          <div class="col-12 md:col-4">
            <label>Monto *</label>
            <InputNumber v-model="form.amount" :min="0.01" mode="currency" currency="USD" locale="es-US" class="w-full" :invalid="!!errors.amount" />
            <small v-if="errors.amount" class="p-error">{{ errors.amount }}</small>
          </div>
          <div class="col-12 md:col-4">
            <label>Fecha *</label>
            <DatePicker v-model="form.transfer_date" dateFormat="yy-mm-dd" class="w-full" />
          </div>
          <div class="col-12 md:col-4 flex align-items-center">
            <Checkbox v-model="form.create_journal_entry" binary />
            <label class="ml-1">Crear asiento contable</label>
          </div>
          <div class="col-12">
            <label>Descripción</label>
            <InputText v-model="form.description" />
          </div>
          <div class="col-12 md:col-6">
            <label>Referencia</label>
            <InputText v-model="form.reference" />
          </div>
          <div class="col-12 md:col-6">
            <label>Notas</label>
            <Textarea v-model="form.notes" rows="2" />
          </div>
        </div>

        <div class="flex gap-2 mt-3">
          <Button label="Realizar Transferencia" icon="pi pi-send" :loading="saving" @click="save" />
          <Button label="Cancelar" severity="secondary" @click="$router.back()" />
        </div>

        <Message v-if="result" severity="success" class="mt-3">
          Transferencia completada. Origen ID: {{ result.from_movement_id }}, Destino ID: {{ result.to_movement_id }}
          <template v-if="result.from_journal_entry_id"> | Asiento origen: {{ result.from_journal_entry_id }}, Asiento destino: {{ result.to_journal_entry_id }}</template>
        </Message>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { createBankTransfer } from '@/api/bankingService'
import BankAccountSelect from '@/components/BankAccountSelect.vue'
import { useToast } from 'primevue/usetoast'
import Card from 'primevue/card'
import InputNumber from 'primevue/inputnumber'
import DatePicker from 'primevue/datepicker'
import Checkbox from 'primevue/checkbox'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import Message from 'primevue/message'

const toast = useToast()
const saving = ref(false)
const result = ref<any>(null)

const form = reactive({
  from_bank_account_id: null as number | null,
  to_bank_account_id: null as number | null,
  amount: null as number | null,
  transfer_date: new Date().toISOString().substring(0, 10) as string,
  description: '',
  reference: '',
  notes: '',
  create_journal_entry: false,
})

const errors = reactive<Record<string, string>>({})

async function save() {
  Object.keys(errors).forEach(k => delete errors[k])
  if (!form.from_bank_account_id) { errors.from_bank_account_id = 'Requerido'; return }
  if (!form.to_bank_account_id) { errors.to_bank_account_id = 'Requerido'; return }
  if (form.from_bank_account_id === form.to_bank_account_id) {
    toast.add({ severity: 'warn', summary: 'Origen y destino deben ser distintos', life: 3000 }); return
  }
  if (!form.amount || form.amount <= 0) { errors.amount = 'Monto inválido'; return }
  if (!form.transfer_date) { toast.add({ severity: 'warn', summary: 'Fecha requerida', life: 3000 }); return }

  saving.value = true
  result.value = null
  try {
    const payload: any = {
      from_bank_account_id: form.from_bank_account_id,
      to_bank_account_id: form.to_bank_account_id,
      amount: form.amount,
      transfer_date: form.transfer_date,
    }
    if (form.description) payload.description = form.description
    if (form.reference) payload.reference = form.reference
    if (form.notes) payload.notes = form.notes
    if (form.create_journal_entry) payload.create_journal_entry = true

    const res = await createBankTransfer(payload)
    result.value = res.data?.data || res.data
    toast.add({ severity: 'success', summary: 'Transferencia realizada', life: 3000 })
  } catch (e: any) {
    const data = e.response?.data
    if (data?.errors) for (const [k, msgs] of Object.entries(data.errors)) errors[k] = (msgs as string[]).join(', ')
    toast.add({ severity: 'error', summary: 'Error', detail: data?.message || 'Error', life: 4000 })
  } finally {
    saving.value = false
  }
}
</script>

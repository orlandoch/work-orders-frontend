<template>
  <Dialog :visible="visible" @update:visible="$emit('update:visible', $event)" header="Registrar Pago" :modal="true" style="width:500px">
    <div class="grid p-fluid">
      <div class="col-12">
        <label>Cuenta por Pagar</label>
        <InputText :value="payable?.supplier_name + ' - $' + Number(payable?.balance || 0).toFixed(2)" disabled class="w-full" />
      </div>
      <div class="col-12">
        <label>Monto *</label>
        <InputNumber v-model="form.amount" :min="0.01" :max="Number(payable?.balance || 0)" mode="currency" currency="USD" locale="es-US" class="w-full" :invalid="!!errors.amount" />
        <small v-if="errors.amount" class="p-error">{{ errors.amount }}</small>
      </div>
      <div class="col-12 md:col-6">
        <label>Fecha *</label>
        <DatePicker v-model="form.payment_date" dateFormat="yy-mm-dd" class="w-full" />
      </div>
      <div class="col-12 md:col-6">
        <label>Método *</label>
        <Select v-model="form.method" :options="['efectivo','cheque','transferencia','tarjeta','otro']" class="w-full" />
      </div>
      <div class="col-12">
        <label>Banco / Caja</label>
        <BankAccountSelect v-model="form.bank_account_id" />
      </div>
      <div class="col-12">
        <label>Referencia</label>
        <InputText v-model="form.reference" />
      </div>
      <div class="col-12">
        <label>Notas</label>
        <Textarea v-model="form.notes" rows="2" />
      </div>
    </div>

    <template #footer>
      <Button label="Cancelar" severity="secondary" @click="$emit('update:visible', false)" />
      <Button label="Registrar Pago" icon="pi pi-check" :loading="saving" @click="save" />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { createPayablePayment } from '@/api/purchaseService'
import BankAccountSelect from '@/components/BankAccountSelect.vue'
import { useToast } from 'primevue/usetoast'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import DatePicker from 'primevue/datepicker'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'

const props = defineProps<{
  visible: boolean
  payable: any
}>()

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'saved'): void
}>()

const toast = useToast()
const saving = ref(false)

const form = reactive({
  amount: null as number | null,
  payment_date: null as string | null,
  method: 'transferencia',
  reference: '',
  bank_account_id: null as number | null,
  notes: '',
})

const errors = reactive<Record<string, string>>({})

watch(() => props.visible, (val) => {
  if (val && props.payable) {
    form.amount = Number(props.payable.balance)
    form.payment_date = new Date().toISOString().substring(0, 10)
    form.method = 'transferencia'
    form.reference = ''
    form.bank_account_id = null
    form.notes = ''
    Object.keys(errors).forEach(k => delete errors[k])
  }
})

async function save() {
  Object.keys(errors).forEach(k => delete errors[k])
  if (!form.amount || form.amount <= 0) { errors.amount = 'Monto inválido'; return }
  if (!form.payment_date) { toast.add({ severity: 'warn', summary: 'Fecha requerida', life: 3000 }); return }

  saving.value = true
  try {
    await createPayablePayment(props.payable.id, {
      payment_date: form.payment_date,
      amount: form.amount,
      method: form.method,
      reference: form.reference || undefined,
      bank_account_id: form.bank_account_id || undefined,
      notes: form.notes || undefined,
    })
    toast.add({ severity: 'success', summary: 'Pago registrado', life: 3000 })
    emit('saved')
  } catch (e: any) {
    const data = e.response?.data
    if (data?.errors) {
      for (const [k, msgs] of Object.entries(data.errors))
        errors[k] = (msgs as string[]).join(', ')
    }
    toast.add({ severity: 'error', summary: 'Error', detail: data?.message || 'Error al pagar', life: 4000 })
  } finally {
    saving.value = false
  }
}
</script>

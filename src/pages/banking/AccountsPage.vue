<template>
  <div>
    <Card>
      <template #title>
        <div class="flex justify-content-between align-items-center">
          <span>Cuentas Bancarias / Caja</span>
          <Button label="Nueva Cuenta" icon="pi pi-plus" size="small" @click="openCreate" />
        </div>
      </template>
      <template #content>
        <DataTable :value="items" :loading="loading" paginator :rows="15" stripedRows emptyMessage="Sin cuentas registradas">
          <Column field="name" header="Nombre" />
          <Column field="bank_name" header="Banco" />
          <Column field="account_number" header="Número" />
          <Column field="account_type" header="Tipo">
            <template #body="{ data }"><StatusChip :value="data.account_type" /></template>
          </Column>
          <Column field="initial_balance" header="Saldo Inicial">
            <template #body="{ data }">${{ Number(data.initial_balance).toFixed(2) }}</template>
          </Column>
          <Column field="current_balance" header="Saldo Actual">
            <template #body="{ data }"><span class="font-bold">${{ Number(data.current_balance).toFixed(2) }}</span></template>
          </Column>
          <Column field="is_default" header="Default">
            <template #body="{ data }"><i :class="data.is_default ? 'pi pi-check text-primary' : ''" /></template>
          </Column>
          <Column field="is_active" header="Activa">
            <template #body="{ data }"><i :class="data.is_active ? 'pi pi-check text-green-500' : 'pi pi-times text-red-500'" /></template>
          </Column>
          <Column header="Acción" style="width:120px">
            <template #body="{ data }">
              <Button icon="pi pi-pencil" text rounded size="small" @click="openEdit(data)" />
              <Button icon="pi pi-list" text rounded size="small" @click="$router.push('/banking/movements?bank_account_id=' + data.id)" />
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <Dialog v-model:visible="formDialog" :header="editing ? 'Editar Cuenta' : 'Nueva Cuenta'" :modal="true" style="width:550px">
      <div class="grid p-fluid">
        <div class="col-12 md:col-6">
          <label>Nombre *</label>
          <InputText v-model="form.name" :invalid="!!errors.name" class="w-full" />
          <small v-if="errors.name" class="p-error">{{ errors.name }}</small>
        </div>
        <div class="col-12 md:col-6">
          <label>Banco</label>
          <InputText v-model="form.bank_name" class="w-full" />
        </div>
        <div class="col-12 md:col-6">
          <label>Número Cuenta</label>
          <InputText v-model="form.account_number" class="w-full" />
        </div>
        <div class="col-12 md:col-6">
          <label>Tipo</label>
          <Select v-model="form.account_type" :options="['current','savings','cash']" class="w-full" />
        </div>
        <div class="col-12 md:col-6">
          <label>Cuenta Contable</label>
          <ChartOfAccountSelect v-model="form.chart_of_account_id" />
        </div>
        <div class="col-12 md:col-6">
          <label>Saldo Inicial</label>
          <InputNumber v-model="form.initial_balance" mode="currency" currency="USD" locale="es-US" class="w-full" />
        </div>
        <div class="col-6 flex align-items-center">
          <Checkbox v-model="form.is_default" binary />
          <label class="ml-1">Default</label>
        </div>
        <div class="col-6 flex align-items-center">
          <Checkbox v-model="form.is_active" binary />
          <label class="ml-1">Activa</label>
        </div>
        <div class="col-12">
          <label>Moneda</label>
          <InputText v-model="form.currency" class="w-full" />
        </div>
        <div class="col-12">
          <label>Notas</label>
          <Textarea v-model="form.notes" rows="2" />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" @click="formDialog = false" />
        <Button label="Guardar" icon="pi pi-check" :loading="saving" @click="save" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { getBankAccounts, createBankAccount, updateBankAccount } from '@/api/bankingService'
import ChartOfAccountSelect from '@/components/ChartOfAccountSelect.vue'
import StatusChip from '@/components/StatusChip.vue'
import { useToast } from 'primevue/usetoast'
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import InputNumber from 'primevue/inputnumber'
import Checkbox from 'primevue/checkbox'
import Textarea from 'primevue/textarea'

const toast = useToast()
const loading = ref(false)
const saving = ref(false)
const items = ref<any[]>([])
const formDialog = ref(false)
const editing = ref(false)
const editId = ref<number | null>(null)

const form = reactive({
  name: '', bank_name: '', account_number: '', account_type: 'current',
  chart_of_account_id: null as number | null, currency: 'USD',
  initial_balance: 0, is_default: false, is_active: true, notes: '',
})
const errors = reactive<Record<string, string>>({})

async function load() {
  loading.value = true
  try {
    const res = await getBankAccounts({ per_page: 50 })
    items.value = res.data?.data || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.name = ''; form.bank_name = ''; form.account_number = ''
  form.account_type = 'current'; form.chart_of_account_id = null
  form.currency = 'USD'; form.initial_balance = 0
  form.is_default = false; form.is_active = true; form.notes = ''
  Object.keys(errors).forEach(k => delete errors[k])
}

function openCreate() {
  editing.value = false; editId.value = null; resetForm(); formDialog.value = true
}

function openEdit(data: any) {
  editing.value = true; editId.value = data.id; resetForm()
  form.name = data.name; form.bank_name = data.bank_name || ''
  form.account_number = data.account_number || ''
  form.account_type = data.account_type || 'current'
  form.chart_of_account_id = data.chart_of_account_id
  form.currency = data.currency || 'USD'
  form.initial_balance = Number(data.initial_balance || 0)
  form.is_default = !!data.is_default; form.is_active = !!data.is_active
  form.notes = data.notes || ''
  formDialog.value = true
}

async function save() {
  Object.keys(errors).forEach(k => delete errors[k])
  if (!form.name) { errors.name = 'Nombre requerido'; return }

  saving.value = true
  try {
    const payload = { ...form }
    if (editing.value && editId.value) {
      await updateBankAccount(editId.value, payload)
      toast.add({ severity: 'success', summary: 'Cuenta actualizada', life: 3000 })
    } else {
      await createBankAccount(payload)
      toast.add({ severity: 'success', summary: 'Cuenta creada', life: 3000 })
    }
    formDialog.value = false
    load()
  } catch (e: any) {
    const data = e.response?.data
    if (data?.errors) for (const [k, msgs] of Object.entries(data.errors)) errors[k] = (msgs as string[]).join(', ')
    toast.add({ severity: 'error', summary: 'Error', detail: data?.message || 'Error', life: 4000 })
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

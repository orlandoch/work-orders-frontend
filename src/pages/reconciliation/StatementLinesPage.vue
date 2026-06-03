<template>
  <div>
    <Card>
      <template #title>
        <div class="flex justify-content-between align-items-center">
          <span>Líneas de Estado de Cuenta</span>
          <Button label="Nueva Línea" icon="pi pi-plus" size="small" @click="openCreate" />
        </div>
      </template>
      <template #content>
        <div class="grid p-fluid mb-3">
          <div class="col-6 md:col-2">
            <BankAccountSelect v-model="filters.bank_account_id" placeholder="Cuenta" />
          </div>
          <div class="col-6 md:col-2">
            <Select v-model="filters.direction" :options="dirOptions" placeholder="Dir." showClear class="w-full" />
          </div>
          <div class="col-6 md:col-2">
            <Select v-model="filters.is_reconciled" :options="recOptions" placeholder="Conciliado" showClear class="w-full" />
          </div>
          <div class="col-6 md:col-2">
            <DatePicker v-model="filters.statement_from" dateFormat="yy-mm-dd" placeholder="Desde" class="w-full" />
          </div>
          <div class="col-6 md:col-2">
            <DatePicker v-model="filters.statement_to" dateFormat="yy-mm-dd" placeholder="Hasta" class="w-full" />
          </div>
          <div class="col-6 md:col-2">
            <InputText v-model="filters.reference" placeholder="Referencia" @input="debounceLoad" />
          </div>
        </div>

        <DataTable :value="items" :loading="loading" paginator :rows="20" stripedRows
          :totalRecords="totalRecords" :lazy="true" @page="onPage"
          emptyMessage="Sin líneas de estado de cuenta">
          <Column field="bank_account_name" header="Cuenta" />
          <Column field="statement_date" header="Fecha">
            <template #body="{ data }">{{ data.statement_date?.substring(0,10) }}</template>
          </Column>
          <Column field="description" header="Descripción" />
          <Column field="amount" header="Monto">
            <template #body="{ data }">${{ Number(data.amount).toFixed(2) }}</template>
          </Column>
          <Column field="direction" header="Dir.">
            <template #body="{ data }"><StatusChip :value="data.direction" /></template>
          </Column>
          <Column field="reference" header="Referencia" />
          <Column field="is_reconciled" header="Conciliada">
            <template #body="{ data }">
              <i :class="data.is_reconciled ? 'pi pi-check-circle text-green-500' : 'pi pi-circle text-gray-400'" />
            </template>
          </Column>
          <Column header="Acción" style="width:100px">
            <template #body="{ data }">
              <Button icon="pi pi-pencil" text rounded size="small" :disabled="data.is_reconciled" @click="openEdit(data)" />
              <Button icon="pi pi-trash" text rounded size="small" severity="danger" :disabled="data.is_reconciled" @click="confirmDelete(data)" />
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <Dialog v-model:visible="formDialog" :header="editing ? 'Editar Línea' : 'Nueva Línea'" :modal="true" style="width:500px">
      <div class="grid p-fluid">
        <div class="col-12">
          <label>Cuenta *</label>
          <BankAccountSelect v-model="form.bank_account_id" />
          <small v-if="errors.bank_account_id" class="p-error">{{ errors.bank_account_id }}</small>
        </div>
        <div class="col-12 md:col-6">
          <label>Fecha *</label>
          <DatePicker v-model="form.statement_date" dateFormat="yy-mm-dd" class="w-full" />
        </div>
        <div class="col-12 md:col-6">
          <label>Dirección *</label>
          <Select v-model="form.direction" :options="['income','expense']" class="w-full" />
        </div>
        <div class="col-12">
          <label>Descripción</label>
          <InputText v-model="form.description" class="w-full" />
        </div>
        <div class="col-12 md:col-6">
          <label>Monto *</label>
          <InputNumber v-model="form.amount" :min="0.01" mode="currency" currency="USD" locale="es-US" class="w-full" :invalid="!!errors.amount" />
          <small v-if="errors.amount" class="p-error">{{ errors.amount }}</small>
        </div>
        <div class="col-12 md:col-6">
          <label>Referencia</label>
          <InputText v-model="form.reference" class="w-full" />
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

    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { getStatementLines, createStatementLine, updateStatementLine, deleteStatementLine } from '@/api/reconciliationService'
import BankAccountSelect from '@/components/BankAccountSelect.vue'
import StatusChip from '@/components/StatusChip.vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import Card from 'primevue/card'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import InputText from 'primevue/inputtext'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import ConfirmDialog from 'primevue/confirmdialog'

const toast = useToast()
const confirm = useConfirm()
const loading = ref(false)
const saving = ref(false)
const items = ref<any[]>([])
const totalRecords = ref(0)
const page = ref(1)
const formDialog = ref(false)
const editing = ref(false)
const editId = ref<number | null>(null)

const filters = reactive({
  bank_account_id: null as number | null,
  direction: null as string | null,
  is_reconciled: null as string | null,
  statement_from: null as string | null,
  statement_to: null as string | null,
  reference: '',
})

const form = reactive({
  bank_account_id: null as number | null,
  statement_date: new Date().toISOString().substring(0, 10) as string,
  description: '',
  amount: null as number | null,
  direction: 'income',
  reference: '',
  notes: '',
})
const errors = reactive<Record<string, string>>({})

const dirOptions = [
  { label: 'Ingreso', value: 'income' },
  { label: 'Egreso', value: 'expense' },
]
const recOptions = [
  { label: 'Conciliada', value: 'true' },
  { label: 'No conciliada', value: 'false' },
]

let debounceTimer: ReturnType<typeof setTimeout> | null = null
function debounceLoad() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(load, 300)
}

function onPage(event: any) { page.value = event.page + 1; load() }

async function load() {
  loading.value = true
  try {
    const params: any = { per_page: 20, page: page.value }
    if (filters.bank_account_id) params.bank_account_id = filters.bank_account_id
    if (filters.direction) params.direction = filters.direction
    if (filters.is_reconciled !== null) params.is_reconciled = filters.is_reconciled === 'true'
    if (filters.statement_from) params.statement_from = filters.statement_from
    if (filters.statement_to) params.statement_to = filters.statement_to
    if (filters.reference) params.reference = filters.reference

    const res = await getStatementLines(params)
    items.value = res.data?.data || []
    totalRecords.value = res.data?.meta?.total || 0
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.bank_account_id = null; form.statement_date = new Date().toISOString().substring(0, 10)
  form.description = ''; form.amount = null; form.direction = 'income'
  form.reference = ''; form.notes = ''
  Object.keys(errors).forEach(k => delete errors[k])
}

function openCreate() { editing.value = false; editId.value = null; resetForm(); formDialog.value = true }

function openEdit(data: any) {
  editing.value = true; editId.value = data.id; resetForm()
  form.bank_account_id = data.bank_account_id
  form.statement_date = data.statement_date?.substring(0, 10) || ''
  form.description = data.description || ''
  form.amount = Number(data.amount)
  form.direction = data.direction
  form.reference = data.reference || ''
  form.notes = data.notes || ''
  formDialog.value = true
}

async function save() {
  Object.keys(errors).forEach(k => delete errors[k])
  if (!form.bank_account_id) { errors.bank_account_id = 'Requerido'; return }
  if (!form.amount || form.amount <= 0) { errors.amount = 'Monto inválido'; return }
  if (!form.statement_date) { toast.add({ severity: 'warn', summary: 'Fecha requerida', life: 3000 }); return }

  saving.value = true
  try {
    const payload: any = { ...form }
    if (editing.value && editId.value) {
      await updateStatementLine(editId.value, payload)
      toast.add({ severity: 'success', summary: 'Línea actualizada', life: 3000 })
    } else {
      await createStatementLine(payload)
      toast.add({ severity: 'success', summary: 'Línea creada', life: 3000 })
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

function confirmDelete(data: any) {
  confirm.require({
    message: `¿Eliminar línea "${data.description || data.reference || '#' + data.id}"?`,
    header: 'Confirmar eliminación',
    icon: 'pi pi-exclamation-triangle',
    accept: async () => {
      try {
        await deleteStatementLine(data.id)
        toast.add({ severity: 'success', summary: 'Línea eliminada', life: 3000 })
        load()
      } catch (e: any) {
        toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'Error', life: 4000 })
      }
    }
  })
}

onMounted(load)
</script>

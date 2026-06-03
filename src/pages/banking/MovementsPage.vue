<template>
  <div>
    <Card>
      <template #title>
        <div class="flex justify-content-between align-items-center">
          <span>Movimientos Bancarios</span>
          <div class="flex gap-2">
            <Button label="Nuevo Movimiento" icon="pi pi-plus" size="small" @click="$router.push('/banking/movements/create')" />
            <Button label="Transferencia" icon="pi pi-arrow-right-arrow-left" size="small" severity="warn" @click="$router.push('/banking/transfers/create')" />
          </div>
        </div>
      </template>
      <template #content>
        <div class="grid p-fluid mb-3">
          <div class="col-6 md:col-2">
            <BankAccountSelect v-model="filters.bank_account_id" placeholder="Cuenta" />
          </div>
          <div class="col-6 md:col-2">
            <Select v-model="filters.type" :options="typeOptions" placeholder="Tipo" showClear class="w-full" />
          </div>
          <div class="col-6 md:col-2">
            <Select v-model="filters.direction" :options="dirOptions" placeholder="Dir." showClear class="w-full" />
          </div>
          <div class="col-6 md:col-2">
            <Select v-model="filters.status" :options="statusOptions" placeholder="Estado" showClear class="w-full" />
          </div>
          <div class="col-6 md:col-2">
            <DatePicker v-model="filters.movement_from" dateFormat="yy-mm-dd" placeholder="Desde" class="w-full" />
          </div>
          <div class="col-6 md:col-2">
            <DatePicker v-model="filters.movement_to" dateFormat="yy-mm-dd" placeholder="Hasta" class="w-full" />
          </div>
        </div>

        <DataTable :value="items" :loading="loading" paginator :rows="20" stripedRows
          :totalRecords="totalRecords" :lazy="true" @page="onPage"
          emptyMessage="Sin movimientos bancarios">
          <Column field="movement_date" header="Fecha">
            <template #body="{ data }">{{ data.movement_date?.substring(0,10) }}</template>
          </Column>
          <Column field="bank_account_name" header="Cuenta" />
          <Column field="type" header="Tipo">
            <template #body="{ data }"><StatusChip :value="data.type" /></template>
          </Column>
          <Column field="direction" header="Dir.">
            <template #body="{ data }"><StatusChip :value="data.direction" /></template>
          </Column>
          <Column field="amount" header="Monto">
            <template #body="{ data }">
              <span :class="data.direction === 'income' ? 'text-green-600' : 'text-red-600'" class="font-bold">
                ${{ Number(data.amount).toFixed(2) }}
              </span>
            </template>
          </Column>
          <Column field="balance_before" header="Saldo Antes">
            <template #body="{ data }">${{ Number(data.balance_before).toFixed(2) }}</template>
          </Column>
          <Column field="balance_after" header="Saldo Después">
            <template #body="{ data }">${{ Number(data.balance_after).toFixed(2) }}</template>
          </Column>
          <Column field="description" header="Descripción" />
          <Column field="reference" header="Referencia" />
          <Column field="status" header="Estado">
            <template #body="{ data }"><StatusChip :value="data.status" /></template>
          </Column>
          <Column header="Acción" style="width:120px">
            <template #body="{ data }">
              <Button icon="pi pi-eye" text rounded severity="info" v-tooltip.left="'Ver detalle'" @click="$router.push('/banking/movements/'+data.id)" />
              <Button v-if="data.status === 'posted' && (data.type === 'manual_income' || data.type === 'manual_expense')"
                icon="pi pi-undo" text rounded size="small" severity="danger"
                @click="confirmReverse(data)" />
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <Dialog v-model:visible="reverseDialog" header="Reversar Movimiento" :modal="true" style="width:400px">
      <div class="grid p-fluid">
        <div class="col-12">
          <p><strong>Movimiento:</strong> {{ reverseTarget?.description }} (${{ Number(reverseTarget?.amount || 0).toFixed(2) }})</p>
        </div>
        <div class="col-12">
          <label>Motivo *</label>
          <Textarea v-model="reverseReason" rows="3" :invalid="!reverseReason" />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" @click="reverseDialog = false" />
        <Button label="Confirmar Reverso" icon="pi pi-undo" severity="danger" :loading="reversing" @click="doReverse" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { getBankMovements, reverseBankMovement } from '@/api/bankingService'
import BankAccountSelect from '@/components/BankAccountSelect.vue'
import StatusChip from '@/components/StatusChip.vue'
import { useToast } from 'primevue/usetoast'
import Card from 'primevue/card'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Textarea from 'primevue/textarea'

const toast = useToast()
const loading = ref(false)
const items = ref<any[]>([])
const totalRecords = ref(0)
const page = ref(1)
const reverseDialog = ref(false)
const reversing = ref(false)
const reverseReason = ref('')
const reverseTarget = ref<any>(null)

const filters = reactive({
  bank_account_id: null as number | null,
  type: null as string | null,
  direction: null as string | null,
  status: null as string | null,
  movement_from: null as string | null,
  movement_to: null as string | null,
})

const typeOptions = [
  { label: 'Manual Income', value: 'manual_income' },
  { label: 'Manual Expense', value: 'manual_expense' },
  { label: 'Supplier Payment', value: 'supplier_payment' },
  { label: 'Transfer In', value: 'transfer_in' },
  { label: 'Transfer Out', value: 'transfer_out' },
]
const dirOptions = [
  { label: 'Ingreso', value: 'income' },
  { label: 'Egreso', value: 'expense' },
]
const statusOptions = [
  { label: 'Posted', value: 'posted' },
  { label: 'Reversed', value: 'reversed' },
]

function onPage(event: any) { page.value = event.page + 1; load() }

async function load() {
  loading.value = true
  try {
    const params: any = { per_page: 20, page: page.value }
    if (filters.bank_account_id) params.bank_account_id = filters.bank_account_id
    if (filters.type) params.type = filters.type
    if (filters.direction) params.direction = filters.direction
    if (filters.status) params.status = filters.status
    if (filters.movement_from) params.movement_from = filters.movement_from
    if (filters.movement_to) params.movement_to = filters.movement_to

    const res = await getBankMovements(params)
    items.value = res.data?.data || []
    totalRecords.value = res.data?.meta?.total || 0
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function confirmReverse(data: any) {
  reverseTarget.value = data
  reverseReason.value = ''
  reverseDialog.value = true
}

async function doReverse() {
  if (!reverseReason.value) return
  reversing.value = true
  try {
    await reverseBankMovement(reverseTarget.value.id, { reason: reverseReason.value })
    toast.add({ severity: 'success', summary: 'Movimiento reversado', life: 3000 })
    reverseDialog.value = false
    load()
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'Error', life: 4000 })
  } finally {
    reversing.value = false
  }
}

onMounted(load)
</script>

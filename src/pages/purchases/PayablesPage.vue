<template>
  <div>
    <Card>
      <template #title>Cuentas por Pagar</template>
      <template #content>
        <div class="grid p-fluid mb-3">
          <div class="col-6 md:col-3">
            <SupplierSelect v-model="filters.supplier_id" placeholder="Proveedor" />
          </div>
          <div class="col-6 md:col-2">
            <Select v-model="filters.status" :options="statusOptions" placeholder="Estado" showClear class="w-full" />
          </div>
          <div class="col-6 md:col-2 flex align-items-center">
            <Checkbox v-model="filters.only_pending" binary />
            <label class="ml-1">Solo pendientes</label>
          </div>
          <div class="col-6 md:col-2">
            <DatePicker v-model="filters.due_from" dateFormat="yy-mm-dd" placeholder="Vence desde" class="w-full" />
          </div>
          <div class="col-6 md:col-2">
            <DatePicker v-model="filters.due_to" dateFormat="yy-mm-dd" placeholder="Vence hasta" class="w-full" />
          </div>
        </div>

        <DataTable :value="items" :loading="loading" paginator :rows="15" stripedRows
          :totalRecords="totalRecords" :lazy="true" @page="onPage"
          emptyMessage="Sin cuentas por pagar">
          <Column field="supplier_name" header="Proveedor" />
          <Column field="total_amount" header="Monto">
            <template #body="{ data }">${{ Number(data.total_amount).toFixed(2) }}</template>
          </Column>
          <Column field="balance" header="Saldo">
            <template #body="{ data }"><span class="font-bold">${{ Number(data.balance).toFixed(2) }}</span></template>
          </Column>
          <Column field="status" header="Estado">
            <template #body="{ data }"><StatusChip :value="data.status" /></template>
          </Column>
          <Column field="due_date" header="Vence">
            <template #body="{ data }">{{ data.due_date?.substring(0,10) || '-' }}</template>
          </Column>
          <Column field="description" header="Descripción" />
          <Column field="created_at" header="Creado">
            <template #body="{ data }">{{ data.created_at?.substring(0,10) }}</template>
          </Column>
          <Column header="Acción" style="width:160px">
            <template #body="{ data }">
              <Button label="Pagar" icon="pi pi-dollar" size="small" @click="openPayment(data)" />
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <PayPaymentDialog v-model:visible="showPaymentDialog" :payable="selectedPayable" @saved="onPaymentSaved" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { getPayables } from '@/api/purchaseService'
import SupplierSelect from '@/components/SupplierSelect.vue'
import StatusChip from '@/components/StatusChip.vue'
import PayPaymentDialog from './PayPaymentDialog.vue'
import Card from 'primevue/card'
import Select from 'primevue/select'
import Checkbox from 'primevue/checkbox'
import DatePicker from 'primevue/datepicker'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'

interface Payable {
  id: number
  supplier_name: string
  total_amount: number
  balance: number
  status: string
  due_date: string
  description: string
  created_at: string
}

const items = ref<Payable[]>([])
const loading = ref(false)
const totalRecords = ref(0)
const page = ref(1)
const showPaymentDialog = ref(false)
const selectedPayable = ref<Payable | null>(null)

const filters = reactive({
  supplier_id: null as number | null,
  status: null as string | null,
  only_pending: false,
  due_from: null as string | null,
  due_to: null as string | null,
})

const statusOptions = [
  { label: 'Pendiente', value: 'pending' },
  { label: 'Pagada', value: 'paid' },
  { label: 'Cancelada', value: 'cancelled' },
]

function onPage(event: any) { page.value = event.page + 1; load() }

async function load() {
  loading.value = true
  try {
    const params: any = { per_page: 15, page: page.value }
    if (filters.supplier_id) params.supplier_id = filters.supplier_id
    if (filters.status) params.status = filters.status
    if (filters.only_pending) params.only_pending = true
    if (filters.due_from) params.due_from = filters.due_from
    if (filters.due_to) params.due_to = filters.due_to

    const res = await getPayables(params)
    items.value = res.data?.data || []
    totalRecords.value = res.data?.meta?.total || 0
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function openPayment(payable: Payable) {
  selectedPayable.value = payable
  showPaymentDialog.value = true
}

function onPaymentSaved() {
  showPaymentDialog.value = false
  load()
}

onMounted(load)
</script>

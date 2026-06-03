<template>
  <div>
    <Card>
      <template #title>Pagos a Proveedores</template>
      <template #content>
        <DataTable :value="items" :loading="loading" paginator :rows="15" stripedRows
          :totalRecords="totalRecords" :lazy="true" @page="onPage"
          emptyMessage="Sin pagos registrados">
          <Column field="supplier_name" header="Proveedor" />
          <Column field="account_payable_id" header="CXP #" />
          <Column field="bank_account_name" header="Banco/Caja" />
          <Column field="payment_date" header="Fecha Pago">
            <template #body="{ data }">{{ data.payment_date?.substring(0,10) }}</template>
          </Column>
          <Column field="amount" header="Monto">
            <template #body="{ data }">${{ Number(data.amount).toFixed(2) }}</template>
          </Column>
          <Column field="method" header="Método" />
          <Column field="reference" header="Referencia" />
          <Column field="status" header="Estado">
            <template #body="{ data }"><StatusChip :value="data.status" /></template>
          </Column>
          <Column header="Asiento">
            <template #body="{ data }">{{ data.journal_entry_id || '-' }}</template>
          </Column>
          <Column header="Acción" style="width:80px">
            <template #body="{ data }">
              <Button v-if="data.status !== 'cancelled'" label="Anular" icon="pi pi-times" severity="danger" size="small" @click="confirmCancel(data)" />
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <Dialog v-model:visible="cancelDialog" header="Anular Pago" :modal="true" style="width:400px">
      <div class="grid p-fluid">
        <div class="col-12">
          <label>Motivo de anulación *</label>
          <Textarea v-model="cancelReason" rows="3" :invalid="!cancelReason" />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" @click="cancelDialog = false" />
        <Button label="Confirmar Anulación" icon="pi pi-check" severity="danger" :loading="cancelling" @click="doCancel" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getPayments, cancelPayment } from '@/api/purchaseService'
import StatusChip from '@/components/StatusChip.vue'
import { useToast } from 'primevue/usetoast'
import Card from 'primevue/card'
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
const cancelDialog = ref(false)
const cancelling = ref(false)
const cancelReason = ref('')
const selectedPayment = ref<any>(null)

function onPage(event: any) { page.value = event.page + 1; load() }

async function load() {
  loading.value = true
  try {
    const res = await getPayments({ per_page: 15, page: page.value })
    items.value = res.data?.data || []
    totalRecords.value = res.data?.meta?.total || 0
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function confirmCancel(payment: any) {
  selectedPayment.value = payment
  cancelReason.value = ''
  cancelDialog.value = true
}

async function doCancel() {
  if (!cancelReason.value) return
  cancelling.value = true
  try {
    await cancelPayment(selectedPayment.value.id, { reason: cancelReason.value })
    toast.add({ severity: 'success', summary: 'Pago anulado', life: 3000 })
    cancelDialog.value = false
    load()
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'Error', life: 4000 })
  } finally {
    cancelling.value = false
  }
}

onMounted(load)
</script>

<template>
  <div>
    <Card>
      <template #title>
        <div class="flex justify-content-between align-items-center">
          <span>Conciliaciones Bancarias</span>
          <Button label="Nueva Conciliación" icon="pi pi-plus" size="small" @click="$router.push('/banking/reconciliations/create')" />
        </div>
      </template>
      <template #content>
        <div class="grid p-fluid mb-3">
          <div class="col-6 md:col-3">
            <BankAccountSelect v-model="filters.bank_account_id" placeholder="Cuenta" />
          </div>
          <div class="col-6 md:col-2">
            <Select v-model="filters.status" :options="statusOptions" placeholder="Estado" showClear class="w-full" />
          </div>
        </div>

        <DataTable :value="items" :loading="loading" paginator :rows="15" stripedRows
          :totalRecords="totalRecords" :lazy="true" @page="onPage"
          emptyMessage="Sin períodos de conciliación">
          <Column field="bank_account_name" header="Cuenta" />
          <Column field="period_start" header="Inicio">
            <template #body="{ data }">{{ data.period_start?.substring(0,10) }}</template>
          </Column>
          <Column field="period_end" header="Fin">
            <template #body="{ data }">{{ data.period_end?.substring(0,10) }}</template>
          </Column>
          <Column field="opening_balance" header="Saldo Apertura">
            <template #body="{ data }">${{ Number(data.opening_balance).toFixed(2) }}</template>
          </Column>
          <Column field="closing_balance" header="Saldo Cierre">
            <template #body="{ data }">${{ Number(data.closing_balance).toFixed(2) }}</template>
          </Column>
          <Column field="statement_balance" header="Saldo Estado">
            <template #body="{ data }">${{ Number(data.statement_balance).toFixed(2) }}</template>
          </Column>
          <Column field="difference" header="Diferencia">
            <template #body="{ data }">
              <span :class="Number(data.difference) === 0 ? 'text-green-600' : 'text-red-600'">
                ${{ Number(data.difference).toFixed(2) }}
              </span>
            </template>
          </Column>
          <Column field="status" header="Estado">
            <template #body="{ data }"><StatusChip :value="data.status" /></template>
          </Column>
          <Column header="Acción" style="width:100px">
            <template #body="{ data }">
              <Button icon="pi pi-eye" text rounded size="small"
                @click="$router.push('/banking/reconciliations/' + data.id)" />
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { getReconciliations } from '@/api/reconciliationService'
import BankAccountSelect from '@/components/BankAccountSelect.vue'
import StatusChip from '@/components/StatusChip.vue'
import Card from 'primevue/card'
import Select from 'primevue/select'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'

const loading = ref(false)
const items = ref<any[]>([])
const totalRecords = ref(0)
const page = ref(1)

const filters = reactive({
  bank_account_id: null as number | null,
  status: null as string | null,
})

const statusOptions = [
  { label: 'Borrador', value: 'draft' },
  { label: 'En progreso', value: 'in_progress' },
  { label: 'Conciliado', value: 'reconciled' },
  { label: 'Cerrado', value: 'closed' },
]

function onPage(event: any) { page.value = event.page + 1; load() }

async function load() {
  loading.value = true
  try {
    const params: any = { per_page: 15, page: page.value }
    if (filters.bank_account_id) params.bank_account_id = filters.bank_account_id
    if (filters.status) params.status = filters.status

    const res = await getReconciliations(params)
    items.value = res.data?.data || []
    totalRecords.value = res.data?.meta?.total || 0
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

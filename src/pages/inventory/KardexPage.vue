<template>
  <div>
    <Card>
      <template #title>Kardex - Historial de Movimientos</template>
      <template #content>
        <!-- Fila 1: Producto + Bodega + Ubicación -->
        <!-- 1 col en mobile, 2 en tablet, 3 en desktop -->
        <div class="grid formgrid p-fluid">
          <div class="field col-12 md:col-6 lg:col-4">
            <label for="kardex-product">Producto *</label>
            <BankingProductSelect
              id="kardex-product"
              v-model="filters.product_id"
            />
          </div>
          <div class="field col-12 md:col-6 lg:col-4">
            <label for="kardex-warehouse">Bodega</label>
            <WarehouseSelect
              id="kardex-warehouse"
              v-model="filters.warehouse_id"
            />
          </div>
          <div class="field col-12 md:col-6 lg:col-4">
            <label for="kardex-location">Ubicación</label>
            <WarehouseLocationSelect
              id="kardex-location"
              v-model="filters.warehouse_location_id"
              :warehouse-id="filters.warehouse_id"
            />
          </div>
        </div>

        <!-- Fila 2: Fechas + Botones -->
        <div class="grid formgrid p-fluid mt-2">
          <div class="field col-12 md:col-6 lg:col-4">
            <label for="kardex-from">Desde</label>
            <DatePicker
              id="kardex-from"
              v-model="filters.from"
              dateFormat="yy-mm-dd"
            />
          </div>
          <div class="field col-12 md:col-6 lg:col-4">
            <label for="kardex-to">Hasta</label>
            <DatePicker
              id="kardex-to"
              v-model="filters.to"
              dateFormat="yy-mm-dd"
            />
          </div>
          <div
            class="field col-12 md:col-6 lg:col-4 flex align-items-end"
          >
            <div class="flex flex-column md:flex-row gap-2 w-full">
              <Button
                label="Buscar"
                icon="pi pi-search"
                @click="load"
                :disabled="!filters.product_id"
                class="flex-1"
              />
              <Button
                label="Limpiar"
                severity="secondary"
                @click="clearFilters"
                class="flex-1"
              />
            </div>
          </div>
        </div>

        <!-- Tabla con scroll horizontal interno para mobile -->
        <div class="overflow-auto mt-3">
          <DataTable
            :value="items"
            :loading="loading"
            paginator
            :rows="20"
            stripedRows
            :totalRecords="totalRecords"
            :lazy="true"
            @page="onPage"
            emptyMessage="Seleccione un producto para ver el kardex"
            scrollable
            scrollHeight="flex"
          >
            <Column field="created_at" header="Fecha">
              <template #body="{ data }">{{
                formatDate(data.created_at)
              }}</template>
            </Column>
            <Column field="movement_type" header="Tipo Mov." />
            <Column field="quantity_in" header="Entrada">
              <template #body="{ data }">{{
                data.quantity_in > 0 ? data.quantity_in : '-'
              }}</template>
            </Column>
            <Column field="quantity_out" header="Salida">
              <template #body="{ data }">{{
                data.quantity_out > 0 ? data.quantity_out : '-'
              }}</template>
            </Column>
            <Column field="unit_cost" header="Costo Unit.">
              <template #body="{ data }">{{ fmt(data.unit_cost) }}</template>
            </Column>
            <Column field="total_cost" header="Costo Total">
              <template #body="{ data }">{{ fmt(data.total_cost) }}</template>
            </Column>
            <Column field="balance_quantity" header="Saldo Cant.">
              <template #body="{ data }"
                ><span class="font-bold">{{ data.balance_quantity }}</span></template
              >
            </Column>
            <Column field="balance_value" header="Saldo Valor">
              <template #body="{ data }"
                ><span class="font-bold">{{ fmt(data.balance_value) }}</span></template
              >
            </Column>
            <Column field="reference" header="Referencia" />
          </DataTable>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { getKardex } from '@/api/inventoryService'
import BankingProductSelect from '@/components/BankingProductSelect.vue'
import WarehouseSelect from '@/components/WarehouseSelect.vue'
import WarehouseLocationSelect from '@/components/WarehouseLocationSelect.vue'
import Card from 'primevue/card'
import DatePicker from 'primevue/datepicker'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

interface KardexEntry {
  id: number
  created_at: string
  movement_type: string
  quantity_in: number
  quantity_out: number
  unit_cost: number
  total_cost: number
  balance_quantity: number
  balance_value: number
  reference: string
}

const items = ref<KardexEntry[]>([])
const loading = ref(false)
const totalRecords = ref(0)
const page = ref(1)

const filters = reactive({
  product_id: null as number | null,
  warehouse_id: null as number | null,
  warehouse_location_id: null as number | null,
  from: null as string | null,
  to: null as string | null,
})

function onPage(event: any) {
  page.value = event.page + 1
  load()
}

async function load() {
  if (!filters.product_id) return
  loading.value = true
  try {
    const params: any = { product_id: filters.product_id, per_page: 20, page: page.value }
    if (filters.warehouse_id) params.warehouse_id = filters.warehouse_id
    if (filters.warehouse_location_id) params.warehouse_location_id = filters.warehouse_location_id
    if (filters.from) params.from = filters.from
    if (filters.to) params.to = filters.to

    const res = await getKardex(params)
    items.value = res.data?.data || []
    totalRecords.value = res.data?.meta?.total || 0
  } catch (e: any) {
    console.error('Error loading kardex', e)
  } finally {
    loading.value = false
  }
}

function clearFilters() {
  filters.product_id = null
  filters.warehouse_id = null
  filters.warehouse_location_id = null
  filters.from = null
  filters.to = null
  items.value = []
  totalRecords.value = 0
  page.value = 1
}

function formatDate(d: string) {
  if (!d) return '-'
  return d.substring(0, 10)
}

function fmt(val: number | string) {
  const n = Number(val)
  return isNaN(n) ? '-' : '$ ' + n.toFixed(2)
}

onMounted(() => {
  const url = new URL(window.location.href)
  const pid = url.searchParams.get('product_id')
  if (pid) {
    filters.product_id = Number(pid)
    load()
  }
})
</script>

<template>
  <div>
    <Card>
      <template #title>
        <div class="flex justify-content-between align-items-center">
          <span>Stock - Saldos de Inventario</span>
          <div class="flex gap-2">
            <Button label="Ajuste" icon="pi pi-plus" severity="warn" size="small" @click="$router.push('/inventory/adjustments/create')" />
            <Button label="Transferencia" icon="pi pi-arrow-right-arrow-left" size="small" @click="$router.push('/inventory/transfers/create')" />
          </div>
        </div>
      </template>
      <template #content>
        <div class="grid p-fluid mb-3">
          <div class="col-12 md:col-3">
            <InputText v-model="filters.product_search" placeholder="Buscar producto..." @input="debounceLoad" />
          </div>
          <div class="col-6 md:col-2">
            <WarehouseSelect v-model="filters.warehouse_id" placeholder="Bodega" />
          </div>
          <div class="col-6 md:col-2">
            <WarehouseLocationSelect v-model="filters.warehouse_location_id" :warehouse-id="filters.warehouse_id" placeholder="Ubicación" />
          </div>
          <div class="col-6 md:col-2">
            <Checkbox v-model="filters.only_available" binary />
            <label class="ml-1">Solo disponible</label>
          </div>
          <div class="col-6 md:col-2">
            <Checkbox v-model="filters.below_minimum" binary />
            <label class="ml-1">Bajo mínimo</label>
          </div>
        </div>

        <DataTable :value="items" :loading="loading" paginator :rows="20" stripedRows
          :totalRecords="totalRecords" :lazy="true" @page="onPage"
          sortField="product_name" :sortOrder="1"
          emptyMessage="Sin saldos de inventario">
          <Column field="product_name" header="Producto" sortable />
          <Column field="warehouse_name" header="Bodega" />
          <Column field="location_name" header="Ubicación" />
          <Column field="quantity" header="Cantidad" sortable>
            <template #body="{ data }"><span class="font-bold">{{ data.quantity }}</span></template>
          </Column>
          <Column field="reserved" header="Reservado" />
          <Column field="available" header="Disponible">
            <template #body="{ data }">
              <Tag :value="data.available" :severity="data.available > 0 ? 'success' : 'danger'" />
            </template>
          </Column>
          <Column field="average_cost" header="Costo Prom.">
            <template #body="{ data }">{{ fmt(data.average_cost) }}</template>
          </Column>
          <Column field="total_cost" header="Costo Total">
            <template #body="{ data }">{{ fmt(data.total_cost) }}</template>
          </Column>
          <Column field="min_stock" header="Stock Min" />
          <Column field="max_stock" header="Stock Max" />
          <Column header="Acción">
            <template #body="{ data }">
              <Button icon="pi pi-book" text rounded size="small"
                @click="$router.push('/inventory/kardex?product_id=' + data.product_id)" />
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { getStockBalances } from '@/api/inventoryService'
import WarehouseSelect from '@/components/WarehouseSelect.vue'
import WarehouseLocationSelect from '@/components/WarehouseLocationSelect.vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Checkbox from 'primevue/checkbox'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'

interface StockItem {
  id: number
  product_id: number
  product_name: string
  warehouse_name: string
  location_name: string
  quantity: number
  reserved: number
  available: number
  average_cost: number
  total_cost: number
  min_stock: number
  max_stock: number
}

const items = ref<StockItem[]>([])
const loading = ref(false)
const totalRecords = ref(0)
const page = ref(1)

const filters = reactive({
  product_search: '',
  warehouse_id: null as number | null,
  warehouse_location_id: null as number | null,
  only_available: false,
  below_minimum: false,
})

let debounceTimer: ReturnType<typeof setTimeout> | null = null
function debounceLoad() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(load, 300)
}

function onPage(event: any) {
  page.value = event.page + 1
  load()
}

async function load() {
  loading.value = true
  try {
    const params: any = { per_page: 20, page: page.value }
    if (filters.product_search) params.product_search = filters.product_search
    if (filters.warehouse_id) params.warehouse_id = filters.warehouse_id
    if (filters.warehouse_location_id) params.warehouse_location_id = filters.warehouse_location_id
    if (filters.only_available) params.only_available = true
    if (filters.below_minimum) params.below_minimum = true

    const res = await getStockBalances(params)
    items.value = res.data?.data || []
    totalRecords.value = res.data?.meta?.total || res.data?.total || items.value.length
  } catch (e: any) {
    console.error('Error loading stock balances', e)
  } finally {
    loading.value = false
  }
}

function fmt(val: number | string) {
  const n = Number(val)
  return isNaN(n) ? '-' : '$ ' + n.toFixed(2)
}

onMounted(load)
</script>

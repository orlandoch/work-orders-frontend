<template>
  <div>
    <Card>
      <template #title>Alertas de Stock</template>
      <template #content>
        <div v-if="!endpointExists" class="text-center text-gray-500 py-4">
          <p><i class="pi pi-info-circle mr-2" />El endpoint de alertas de stock no está disponible.</p>
          <p class="text-sm">Puedes usar <router-link to="/inventory/stock-balances">Saldos de Inventario</router-link> y filtrar por productos con bajo stock.</p>
        </div>

        <template v-else>
          <div class="grid mb-3">
            <div class="col-12 md:col-4"><Dropdown v-model="filters.warehouse_id" :options="warehouses" optionLabel="name" optionValue="id" placeholder="Todas las bodegas" class="w-full" @change="load" /></div>
            <div class="col-12 md:col-2"><Checkbox v-model="filters.only_below_min" binary /><label class="ml-2">Solo bajo mínimo</label></div>
            <div class="col-12 md:col-4"><Button icon="pi pi-refresh" label="Recargar" severity="secondary" @click="load" /></div>
          </div>

          <DataTable :value="items" :loading="loading" paginator :rows="15" stripedRows emptyMessage="Sin alertas de stock">
            <Column field="product.name" header="Producto" sortable />
            <Column field="product.sku" header="SKU" />
            <Column field="warehouse.name" header="Bodega" sortable />
            <Column field="quantity" header="Stock Actual" sortable>
              <template #body="{ data }"><span :class="Number(data.quantity) <= Number(data.min_quantity) ? 'text-red-600 font-bold' : ''">{{ Number(data.quantity).toFixed(2) }}</span></template>
            </Column>
            <Column field="min_quantity" header="Mínimo" sortable>
              <template #body="{ data }">{{ Number(data.min_quantity || 0).toFixed(2) }}</template>
            </Column>
            <Column header="Diferencia" sortable>
              <template #body="{ data }">
                <span :class="difference(data) < 0 ? 'text-red-600 font-bold' : 'text-green-600'">{{ Number(difference(data)).toFixed(2) }}</span>
              </template>
            </Column>
            <Column header="Estado">
              <template #body="{ data }">
                <Tag v-if="Number(data.quantity) <= Number(data.min_quantity)" severity="danger" value="Crítico" />
                <Tag v-else-if="Number(data.quantity) <= Number(data.min_quantity) * 1.3" severity="warn" value="Bajo" />
                <Tag v-else severity="success" value="Normal" />
              </template>
            </Column>
            <Column header="">
              <template #body="{ data }">
                <Button icon="pi pi-book" text rounded severity="info" v-tooltip.left="'Ver Kardex'" @click="$router.push('/inventory/kardex?product_id='+data.product_id)" />
              </template>
            </Column>
          </DataTable>
        </template>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getStockBalances } from '@/api/inventoryService'
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Dropdown from 'primevue/dropdown'
import Checkbox from 'primevue/checkbox'
import { parseApiError } from '@/utils/parseApiError'
import { useToast } from 'primevue/usetoast'
import Toast from 'primevue/toast'

const toast = useToast()
const loading = ref(false)
const items = ref<any[]>([])
const endpointExists = ref(true)
const warehouses = ref<any[]>([])
const filters = ref({ warehouse_id: null, only_below_min: true })

function difference(row: any): number {
  return Number(row.quantity || 0) - Number(row.min_quantity || 0)
}

async function loadStockAlerts() {
  loading.value = true
  try {
    // Try dedicated endpoint first
    const api = (await import('@/api/client')).default
    const resp = await api.get('/product-stock-alerts?per_page=100')
    items.value = resp.data?.data?.data || resp.data?.data || []
    return
  } catch {
    // Fallback: filter from stock-balances
  }
}

async function load() {
  loading.value = true
  try {
    const params: any = { per_page: 100 }
    if (filters.value.warehouse_id) params.warehouse_id = filters.value.warehouse_id

    const res = await getStockBalances(params)
    let data = res.data?.data || res.data || []

    // If it's paginated, extract
    if (Array.isArray(data)) {
      // Already array
    } else if (data.data) {
      data = data.data
    }

    if (filters.value.only_below_min) {
      data = data.filter((d: any) => Number(d.quantity) <= Number(d.min_quantity))
    }

    items.value = data
  } catch (e: any) {
    if (e?.response?.status === 404) {
      endpointExists.value = false
      items.value = []
    } else {
      const parsed = parseApiError(e)
      toast.add({ severity: 'error', summary: 'Error', detail: parsed.message, life: 4000 })
    }
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  load()
})
</script>

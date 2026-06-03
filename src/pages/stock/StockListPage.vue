<template>
  <div>
    <DataTable :value="items" :loading="loading" paginator :rows="15" stripedRows>
      <Column field="product.name" header="Producto" />
      <Column field="product.sku" header="SKU" />
      <Column field="location.name" header="Ubicación" />
      <Column field="quantity" header="Cantidad" />
      <Column field="reserved_quantity" header="Reservado" />
      <Column header="Disponible"><template #body="{data}">{{ data.quantity - data.reserved_quantity }}</template></Column>
      <Column field="batch_number" header="Lote" />
      <Column field="expiration_date" header="Vence"><template #body="{data}">{{ data.expiration_date || '-' }}</template></Column>
    </DataTable>
    <Toast />
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/api/client'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'

const items = ref([])
const loading = ref(false)
const toast = useToast()

onMounted(async () => {
  loading.value = true
  try {
    const { data } = await api.get('/material-stock')
    items.value = data.data.data
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'Error' })
  } finally {
    loading.value = false
  }
})
</script>

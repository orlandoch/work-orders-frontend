<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-bold text-gray-900">Listas de Precios</h1>
      <Button label="Nueva Lista" icon="pi pi-plus" @click="$router.push('/price-lists/new')" />
    </div>

    <Message v-if="error" severity="error" closable @close="error = ''">{{ error }}</Message>

    <DataTable :value="lists" :loading="loading" stripedRows paginator :rows="20">
      <Column field="name" header="Nombre" sortable />
      <Column field="code" header="Código" sortable />
      <Column field="is_default" header="Default" sortable>
        <template #body="{ data }">
          <Tag v-if="data.is_default" severity="info" value="Sí" />
          <span v-else class="text-gray-400">—</span>
        </template>
      </Column>
      <Column field="is_active" header="Activo" sortable>
        <template #body="{ data }">
          <Tag v-if="data.is_active" severity="success" value="Sí" />
          <Tag v-else severity="danger" value="No" />
        </template>
      </Column>
      <Column :exportable="false" header="Acciones">
        <template #body="{ data }">
          <Button icon="pi pi-pencil" severity="warn" rounded size="small" class="mr-1" @click="$router.push(`/price-lists/${data.id}/edit`)" />
          <Button icon="pi pi-trash" severity="danger" rounded size="small" @click="confirmDelete(data)" />
        </template>
      </Column>
    </DataTable>

    <Dialog v-model:visible="showDelete" header="Eliminar" modal :style="{ width: '95vw', maxWidth: '400px' }" :breakpoints="{ '768px': '95vw' }">
      <p class="text-sm text-gray-600">¿Eliminar lista de precios <strong>{{ deleting?.name }}</strong>?</p>
      <div class="flex justify-end gap-2 mt-4">
        <Button label="Cancelar" severity="secondary" text @click="showDelete = false" />
        <Button label="Eliminar" severity="danger" @click="doDelete" />
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import { useToast } from 'primevue/usetoast'
import { getPriceLists, deletePriceList, type PriceList } from '@/api/priceLists'

const toast = useToast()
const lists = ref<PriceList[]>([])
const loading = ref(true)
const error = ref('')
const showDelete = ref(false)
const deleting = ref<PriceList | null>(null)

onMounted(async () => {
  try {
    lists.value = await getPriceLists()
  } catch {
    error.value = 'Error al cargar listas de precios'
  } finally {
    loading.value = false
  }
})

function confirmDelete(pl: PriceList) {
  deleting.value = pl
  showDelete.value = true
}

async function doDelete() {
  if (!deleting.value?.id) return
  try {
    await deletePriceList(deleting.value.id)
    lists.value = lists.value.filter(l => l.id !== deleting.value!.id)
    toast.add({ severity: 'success', summary: 'Lista eliminada', life: 3000 })
  } catch {
    error.value = 'Error al eliminar'
  } finally {
    showDelete.value = false
    deleting.value = null
  }
}
</script>

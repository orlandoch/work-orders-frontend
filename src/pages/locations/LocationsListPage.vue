<template>
  <div>
    <div class="page-header"><Button label="Nueva Ubicación" icon="pi pi-plus" @click="$router.push('/locations/new')" /></div>
    <DataTable :value="items" :loading="loading" paginator :rows="15" stripedRows>
      <Column field="name" header="Nombre" sortable />
      <Column field="code" header="Código" />
      <Column field="type" header="Tipo" />
      <Column field="parent.name" header="Padre" />
      <Column header="Activo"><template #body="{data}"><i :class="data.is_active ? 'pi pi-check text-green-500' : 'pi pi-times text-red-400'"></i></template></Column>
      <Column header="" body-style="text-align:right">
        <template #body="{data}"><Button icon="pi pi-pencil" text rounded @click="$router.push(`/locations/${data.id}/edit`)" /><Button icon="pi pi-trash" text rounded severity="danger" @click="del(data)" /></template>
      </Column>
    </DataTable>
    <ConfirmDialog /><Toast />
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/api/client'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import ConfirmDialog from 'primevue/confirmdialog'
import Toast from 'primevue/toast'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'

const items = ref([])
const loading = ref(false)
const confirm = useConfirm()
const toast = useToast()

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/locations')
    items.value = data.data.data
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'Error' })
  } finally {
    loading.value = false
  }
}

function del(c: any) {
  confirm.require({
    message: `¿Eliminar ${c.name}?`,
    header: 'Confirmar',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await api.delete(`/locations/${c.id}`)
        toast.add({ severity: 'success', summary: 'Eliminado', life: 3000 })
        load()
      } catch (e: any) {
        toast.add({ severity: 'error', summary: 'Error' })
      }
    }
  })
}

onMounted(load)
</script>
<style scoped>
.page-header { display: flex; justify-content: flex-end; margin-bottom: 1rem; }
</style>

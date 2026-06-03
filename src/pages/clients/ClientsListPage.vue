<template>
  <div>
    <div class="page-header"><Button label="Nuevo Cliente" icon="pi pi-plus" @click="$router.push('/clients/new')" /></div>
    <DataTable scrollable scrollHeight="flex" :value="items" :loading="loading" paginator :rows="15" stripedRows
      @row-click="goDetail">
      <Column field="full_name" header="Nombre" sortable />
      <Column field="document_number" header="Documento" />
      <Column header="Contacto">
        <template #body="{data}">
          <div v-if="data.contact_details?.length" class="text-sm">
            <div v-for="cd in data.contact_details.filter((d:any)=>d.type==='phone' && d.is_primary)" :key="cd.id">
              <i class="pi pi-phone mr-1 text-gray-400" />{{ cd.value }}
            </div>
            <div v-for="cd in data.contact_details.filter((d:any)=>d.type==='email' && d.is_primary)" :key="cd.id" class="text-gray-500">
              <i class="pi pi-envelope mr-1 text-gray-400" />{{ cd.value }}
            </div>
          </div>
          <span v-else class="text-gray-400 text-sm">—</span>
        </template>
      </Column>
      <Column header="Activo">
        <template #body="{data}"><i :class="data.is_active ? 'pi pi-check text-green-500' : 'pi pi-times text-red-400'"></i></template>
      </Column>
      <Column header="" body-style="text-align:right; min-width: 130px">
        <template #body="{data}">
          <Button icon="pi pi-eye" text rounded severity="info" v-tooltip.top="'Ver'" @click.stop="goDetail(data)" />
          <Button icon="pi pi-pencil" text rounded @click.stop="$router.push(`/clients/${data.id}/edit`)" />
          <Button icon="pi pi-trash" text rounded severity="danger" @click.stop="del(data)" />
        </template>
      </Column>
    </DataTable>
    <ConfirmDialog /><Toast />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api/client'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import ConfirmDialog from 'primevue/confirmdialog'
import Toast from 'primevue/toast'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'

const router = useRouter()
const items = ref<any[]>([])
const loading = ref(false)
const confirm = useConfirm()
const toast = useToast()

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/clients')
    items.value = data.data.data || []
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'Error' })
  } finally { loading.value = false }
}

function goDetail(event: any) {
  const data = event.data || event
  router.push(`/clients/${data.id}`)
}

function del(c: any) {
  confirm.require({
    message: `¿Eliminar a ${c.full_name}?`,
    header: 'Confirmar',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try { await api.delete(`/clients/${c.id}`); toast.add({ severity: 'success', summary: 'Eliminado', life: 3000 }); load() }
      catch (e: any) { toast.add({ severity: 'error', summary: 'Error' }) }
    }
  })
}

onMounted(load)
</script>
<style scoped>
.page-header { display: flex; justify-content: flex-end; margin-bottom: 1rem; }

/* Desktop: row-click affordance */
@media (hover: hover) {
  .p-datatable :deep(.p-datatable-tbody tr) {
    cursor: pointer;
  }
  .p-datatable :deep(.p-datatable-tbody tr:hover) {
    background-color: var(--p-surface-100) !important;
  }
}
</style>

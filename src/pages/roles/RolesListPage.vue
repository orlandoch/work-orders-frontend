<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">Roles</h1>
      <Button label="Nuevo Rol" icon="pi pi-plus" @click="router.push('/roles/new')" />
    </div>
    <DataTable :value="items" :loading="loading" paginator :rows="15" stripedRows>
      <Column field="name" header="Nombre" sortable />
      <Column field="description" header="Descripción" />
      <Column header="Permisos">
        <template #body="{data}">
          <Tag v-for="p in data.permissions?.slice(0,4)" :key="p.id" :value="labelPerm(p.name)" class="mr-1" />
          <span v-if="data.permissions?.length > 4" class="text-muted-sm">+{{ data.permissions.length - 4 }} más</span>
        </template>
      </Column>
      <Column header="Acciones" body-style="text-align:right" style="width: 140px;">
        <template #body="{data}">
          <Button icon="pi pi-shield" text rounded size="small" @click="router.push(`/roles/${data.id}/permissions`)" v-tooltip.left="'Permisos'" />
          <Button icon="pi pi-pencil" text rounded size="small" @click="router.push(`/roles/${data.id}/edit`)" v-tooltip.left="'Editar'" />
          <Button icon="pi pi-trash" text rounded severity="danger" size="small" @click="del(data)" v-tooltip.left="'Eliminar'" />
        </template>
      </Column>
    </DataTable>
    <ConfirmDialog />
    <Toast />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api/client'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import ConfirmDialog from 'primevue/confirmdialog'

const router = useRouter()
const items = ref([])
const loading = ref(false)
const toast = useToast()
const confirm = useConfirm()

function labelPerm(name: string): string {
  const parts = name.split('.')
  const map: Record<string, string> = {
    view: 'Ver', create: 'Crear', edit: 'Editar', delete: 'Eliminar',
    manage: 'Gestionar', issue: 'Emitir', pay: 'Cobrar', cancel: 'Anular',
    start: 'Iniciar', complete: 'Completar', alerts: 'Alertas',
  }
  return map[parts[1]] || parts[1]
}

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/roles')
    items.value = data.data.data
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar roles', life: 3000 })
  } finally {
    loading.value = false
  }
}

function del(r: any) {
  confirm.require({
    message: `¿Eliminar el rol "${r.name}"?\nEsta acción no se puede deshacer.`,
    header: 'Confirmar',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await api.delete(`/roles/${r.id}`)
        toast.add({ severity: 'success', summary: 'Eliminado', detail: 'Rol eliminado', life: 3000 })
        load()
      } catch {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el rol', life: 3000 })
      }
    }
  })
}

onMounted(() => load())
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.page-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}
.mr-1 { margin-right: 0.25rem; }
.text-muted-sm { font-size: 0.75rem; color: #94a3b8; }
</style>

<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">Usuarios</h1>
      <Button label="Nuevo Usuario" icon="pi pi-plus" @click="router.push('/users/new')" />
    </div>

    <DataTable :value="items" :loading="loading" paginator :rows="15" stripedRows>
      <Column field="name" header="Nombre" sortable />
      <Column field="email" header="Email" />
      <Column header="Roles">
        <template #body="{ data }">
          <Tag v-for="r in data.roles" :key="r.id" :value="r.name" class="role-tag" />
          <span v-if="!data.roles?.length" style="color: #94a3b8;">Sin rol</span>
        </template>
      </Column>
      <Column field="created_at" header="Creado">
        <template #body="{ data }">
          {{ data.created_at?.substring(0, 10) }}
        </template>
      </Column>
      <Column header="Acciones" body-style="text-align: right;" style="width: 100px;">
        <template #body="{ data }">
          <Button icon="pi pi-pencil" text rounded size="small" @click="router.push(`/users/${data.id}/edit`)" v-tooltip.left="'Editar'" />
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
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import api from '@/api/client'

const router = useRouter()
const items = ref([])
const loading = ref(false)
const toast = useToast()
const confirm = useConfirm()

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/users')
    items.value = data.data.data
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar usuarios', life: 3000 })
  } finally {
    loading.value = false
  }
}

function del(user: any) {
  confirm.require({
    message: `¿Eliminar a ${user.name}?`,
    header: 'Confirmar',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await api.delete(`/users/${user.id}`)
        toast.add({ severity: 'success', summary: 'Eliminado', detail: 'Usuario eliminado', life: 3000 })
        load()
      } catch {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar', life: 3000 })
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
.role-tag {
  margin-right: 0.25rem;
  margin-bottom: 0.25rem;
}
</style>

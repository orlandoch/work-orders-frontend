<template>
  <div>
    <div class="page-header"><Button label="Nueva Categoría" icon="pi pi-plus" @click="$router.push('/categories/new')" /></div>
    <DataTable :value="items" :loading="loading" paginator :rows="20" stripedRows>
      <Column field="id" header="ID" sortable style="width:60px" />
      <Column header="Nombre">
        <template #body="{data}">
          <span :style="{ marginLeft: (treeDepth(data) * 20) + 'px', fontWeight: treeDepth(data) === 0 ? '600' : '400' }">
            <i v-if="treeDepth(data) > 0" class="pi pi-arrow-right text-xs text-gray-300 mr-1" />
            {{ data.name }}
          </span>
        </template>
      </Column>
      <Column header="Ruta">
        <template #body="{data}">
          <span class="text-sm text-gray-500">{{ breadcrumb(data) }}</span>
        </template>
      </Column>
      <Column field="code" header="Código" style="width:80px" />
      <Column header="Activo">
        <template #body="{data}">
          <i v-if="data.is_active" class="pi pi-check-circle text-green-500" />
          <i v-else class="pi pi-times-circle text-red-300" />
        </template>
      </Column>
      <Column header="" body-style="text-align:right">
        <template #body="{data}">
          <Button icon="pi pi-pencil" text rounded @click="$router.push(`/categories/${data.id}/edit`)" />
          <Button icon="pi pi-trash" text rounded severity="danger" @click="del(data)" />
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
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'

const router = useRouter()
const confirm = useConfirm()
const toast = useToast()
const loading = ref(false)
const items = ref<any[]>([])

function buildTree(cats: any[], parentId: number | null = null): any[] {
  const result: any[] = []
  for (const c of cats) {
    if (c.parent_id === parentId) {
      result.push(c)
      result.push(...buildTree(cats, c.id))
    }
  }
  return result
}

let allCats: any[] = []

function treeDepth(cat: any): number {
  let depth = 0
  let pid = cat.parent_id
  while (pid) {
    depth++
    const parent = allCats.find(c => c.id === pid)
    pid = parent?.parent_id ?? null
  }
  return depth
}

function breadcrumb(cat: any): string {
  const parts: string[] = [cat.name]
  let pid = cat.parent_id
  while (pid) {
    const parent = allCats.find(c => c.id === pid)
    if (parent) {
      parts.unshift(parent.name)
      pid = parent.parent_id
    } else break
  }
  return parts.join(' → ')
}

onMounted(async () => {
  loading.value = true
  try {
    const { data: res } = await api.get('/product-categories?per_page=200')
    allCats = res?.data?.data || []
    items.value = buildTree(allCats, null)
  } catch {}
  loading.value = false
})

async function del(c: any) {
  confirm.require({
    message: `Eliminar categoría "${c.name}"?`,
    header: 'Confirmar',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Cancelar',
    acceptLabel: 'Eliminar',
    accept: async () => {
      try {
        await api.delete(`/product-categories/${c.id}`)
        items.value = items.value.filter(i => i.id !== c.id)
        toast.add({ severity: 'success', summary: 'Eliminada', life: 3000 })
      } catch {
        toast.add({ severity: 'error', summary: 'Error al eliminar', life: 3000 })
      }
    }
  })
}
</script>

<style scoped>
:deep(.p-datatable) {
  font-size: 0.9rem;
}
</style>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { DataTableRowSelectEvent } from 'primevue/datatable'
import BrandDialog from './BrandDialog.vue'

const brands = ref<any[]>([])
const loading = ref(false)
const showDialog = ref(false)
const editingBrand = ref<any>(null)

async function loadBrands() {
  loading.value = true
  try {
    const token = localStorage.getItem('token')
    const res = await fetch('/api/brands', {
      headers: { Authorization: `Bearer ${token}` }
    })
    const json = await res.json()
    brands.value = json.data || []
  } finally {
    loading.value = false
  }
}

function openNew() {
  editingBrand.value = null
  showDialog.value = true
}

function openEdit(brand: any) {
  editingBrand.value = { ...brand }
  showDialog.value = true
}

async function deleteBrand(brand: any) {
  if (!confirm(`¿Eliminar "${brand.name}"?`)) return
  const token = localStorage.getItem('token')
  const res = await fetch(`/api/brands/${brand.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  })
  if (res.ok) {
    await loadBrands()
  } else {
    const json = await res.json()
    alert(json.message || 'Error al eliminar')
  }
}

function onSaved() {
  showDialog.value = false
  loadBrands()
}

onMounted(loadBrands)
</script>

<template>
  <div class="p-4">
    <div class="flex justify-content-between align-items-center mb-3">
      <h1 class="text-2xl font-bold m-0">Marcas</h1>
      <Button label="Nueva Marca" icon="pi pi-plus" @click="openNew" />
    </div>

    <DataTable :value="brands" :loading="loading" stripedRows responsiveLayout="scroll" paginator :rows="20">
      <Column field="id" header="ID" sortable style="width:80px" />
      <Column field="name" header="Nombre" sortable />
      <Column header="Acciones" style="width:120px">
        <template #body="{ data }">
          <Button icon="pi pi-pencil" class="p-button-rounded p-button-text p-mr-1" @click="openEdit(data)" />
          <Button icon="pi pi-trash" class="p-button-rounded p-button-text p-button-danger" @click="deleteBrand(data)" />
        </template>
      </Column>
    </DataTable>

    <BrandDialog :visible="showDialog" :brand="editingBrand" @close="showDialog = false" @saved="onSaved" />
  </div>
</template>

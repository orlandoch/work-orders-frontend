<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-bold">Equipos</h1>
      <div class="flex items-center gap-2">
        <Button label="Tipos de Activo" icon="pi pi-tag" severity="secondary" @click="showAssetTypesManager" />
        <Button label="Unidades de Medida" icon="pi pi-ruler" severity="secondary" @click="showWorkUnitsManager" />
        <Button label="Marcas" icon="pi pi-star" severity="secondary" @click="showBrandsManager" />
        <Button label="Nuevo Equipo" icon="pi pi-plus" @click="$router.push('/assets/new')" />
      </div>
    </div>

    <DataTable :value="assets" :loading="loading" stripedRows paginator :rows="20"
      sortField="name" :sortOrder="1">
      <Column field="code" header="Código" sortable style="min-width:80px" />
      <Column field="name" header="Nombre" sortable style="min-width:160px" />
      <Column header="Tipo" style="width:100px">
        <template #body="s">
          <Tag :value="s.data.asset_type?.name || s.data.asset_type_code" :severity="typeSeverity(s.data.asset_type_code)" />
        </template>
      </Column>
      <Column header="Marca" style="width:120px">
        <template #body="s">{{ s.data.brand_relation?.name || s.data.brand || '—' }}</template>
      </Column>
      <Column header="Costo x Unidad" style="width:100px">
        <template #body="s">${{ Number(s.data.cost_per_unit).toFixed(2) }}</template>
      </Column>
      <Column header="U. Medida" style="width:80px">
        <template #body="s">{{ s.data.work_unit?.abbreviation || '—' }}</template>
      </Column>
      <Column header="En OT" style="width:60px" sortable :sortField="'work_order_compatible'">
        <template #body="s">
          <i :class="s.data.work_order_compatible ? 'pi pi-check text-green-500' : 'pi pi-times text-red-300'"></i>
        </template>
      </Column>
      <Column header="Activo" style="width:60px">
        <template #body="s">
          <i :class="s.data.is_active ? 'pi pi-check text-green-500' : 'pi pi-times text-red-300'"></i>
        </template>
      </Column>
      <Column header="" style="width:60px">
        <template #body="s">
          <Button icon="pi pi-pencil" text rounded size="small"
            @click="$router.push(`/assets/${s.data.id}/edit`)" v-tooltip.left="'Editar'" />
        </template>
      </Column>
    </DataTable>

    <!-- Brands Manager Dialog -->
    <Dialog v-model:visible="brandsDialog" header="Administrar Marcas" :modal="true" style="width:600px">
      <div class="mb-3 flex gap-2">
        <InputText v-model="newBrandInput" class="flex-1" placeholder="Nueva marca..." @keydown.enter="addBrand" />
        <Button label="Agregar" @click="addBrand" :loading="addingBrand" />
      </div>
      <DataTable :value="brandsList" size="small" stripedRows>
        <Column field="name" header="Nombre" />
        <Column header="" style="width:50px">
          <template #body="s">
            <Button icon="pi pi-trash" text rounded size="small" severity="danger"
              @click="deleteBrand(s.data)" :disabled="s.data.asset_count > 0"
              v-tooltip.left="s.data.asset_count > 0 ? 'Tiene equipos asociados' : 'Eliminar'" />
          </template>
        </Column>
      </DataTable>
    </Dialog>

    <!-- Asset Types Manager Dialog -->
    <Dialog v-model:visible="typesDialog" header="Administrar Tipos de Activo" :modal="true" style="width:700px">
      <div class="mb-3 grid grid-cols-3 gap-2">
        <InputText v-model="newTypeCode" placeholder="Código (machine, tool...)" />
        <InputText v-model="newTypeName" placeholder="Nombre (Máquina, Herramienta...)" />
        <Button label="Agregar" @click="addAssetType" :loading="addingType" />
      </div>
      <DataTable :value="assetTypesList" size="small" stripedRows>
        <Column field="code" header="Código" />
        <Column field="name" header="Nombre" />
        <Column field="description" header="Descripción" />
        <Column header="Activo" style="width:60px">
          <template #body="s">
            <i :class="s.data.is_active ? 'pi pi-check text-green-500' : 'pi pi-times text-red-300'"></i>
          </template>
        </Column>
        <Column header="" style="width:50px">
          <template #body="s">
            <Button icon="pi pi-trash" text rounded size="small" severity="danger"
              @click="deleteAssetType(s.data)"
              :disabled="s.data.asset_count > 0"
              v-tooltip.left="s.data.asset_count > 0 ? 'Tiene equipos asociados' : 'Eliminar'" />
          </template>
        </Column>
      </DataTable>
    </Dialog>

    <!-- Work Units Manager Dialog -->
    <Dialog v-model:visible="workUnitsDialog" header="Administrar Unidades de Medida" :modal="true" style="width:600px">
      <div class="mb-3 grid grid-cols-3 gap-2">
        <InputText v-model="newUnitCode" placeholder="Código (hour)" />
        <InputText v-model="newUnitName" placeholder="Nombre (Hora)" />
        <InputText v-model="newUnitAbbr" placeholder="Abrev. (h)" />
      </div>
      <div class="mb-3 flex gap-2">
        <InputText v-model="newUnitDesc" class="flex-1" placeholder="Descripción (opcional)" />
        <Button label="Agregar" @click="addWorkUnit" :loading="addingUnit" />
      </div>
      <DataTable :value="workUnitsList" size="small" stripedRows>
        <Column field="code" header="Código" />
        <Column field="name" header="Nombre" />
        <Column field="abbreviation" header="Abrev." />
        <Column field="description" header="Descripción" />
        <Column header="" style="width:50px">
          <template #body="s">
            <Button icon="pi pi-trash" text rounded size="small" severity="danger"
              @click="deleteWorkUnit(s.data)"
              :disabled="s.data.asset_count > 0"
              v-tooltip.left="s.data.asset_count > 0 ? 'Tiene equipos asociados' : 'Eliminar'" />
          </template>
        </Column>
      </DataTable>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import api from '@/api/client'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'

const toast = useToast()

const loading = ref(false)
const assets = ref<any[]>([])

const typeSeverities: Record<string, string> = {
  machine: 'info',
  tool: 'warn',
  vehicle: 'success',
  furniture: 'contrast',
  computer: 'help',
  other: 'secondary',
}

function typeSeverity(t: string) { return typeSeverities[t] || 'secondary' }

async function fetchData() {
  loading.value = true
  try {
    const res = await api.get('/machines?per_page=100')
    const raw = res.data.data || res.data || []
    assets.value = Array.isArray(raw) ? raw : (raw.data || [])
  } catch { /* ignore */ }
  finally { loading.value = false }
}

// ── Brands Manager ──
const brandsDialog = ref(false)
const brandsList = ref<any[]>([])
const newBrandInput = ref('')
const addingBrand = ref(false)

async function showBrandsManager() {
  const res = await api.get('/brands')
  brandsList.value = res.data.data || []
  // count assets per brand
  for (const b of brandsList.value) {
    b.asset_count = assets.value.filter(a => a.brand_id === b.id).length
  }
  newBrandInput.value = ''
  brandsDialog.value = true
}

async function addBrand() {
  if (!newBrandInput.value.trim()) return
  addingBrand.value = true
  try {
    const res = await api.post('/brands', { name: newBrandInput.value })
    brandsList.value.push({ ...res.data.data, asset_count: 0 })
    newBrandInput.value = ''
    toast.add({ severity: 'success', summary: 'Creado', detail: 'Marca agregada', life: 3000 })
  } catch (err: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: err.response?.data?.message || 'Error', life: 5000 })
  } finally { addingBrand.value = false }
}

async function deleteBrand(b: any) {
  try {
    await api.delete(`/brands/${b.id}`)
    brandsList.value = brandsList.value.filter(x => x.id !== b.id)
    toast.add({ severity: 'success', summary: 'Eliminado', detail: 'Marca eliminada', life: 3000 })
  } catch (err: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: err.response?.data?.message || 'Error', life: 5000 })
  }
}

// ── Asset Types Manager ──
const typesDialog = ref(false)
const assetTypesList = ref<any[]>([])
const newTypeCode = ref('')
const newTypeName = ref('')
const addingType = ref(false)

async function showAssetTypesManager() {
  const res = await api.get('/asset-types')
  assetTypesList.value = res.data.data || []
  for (const t of assetTypesList.value) {
    t.asset_count = assets.value.filter(a => a.asset_type_code === t.code).length
  }
  newTypeCode.value = ''
  newTypeName.value = ''
  typesDialog.value = true
}

async function addAssetType() {
  if (!newTypeCode.value.trim() || !newTypeName.value.trim()) return
  addingType.value = true
  try {
    const res = await api.post('/asset-types', {
      code: newTypeCode.value,
      name: newTypeName.value,
    })
    assetTypesList.value.push({ ...res.data.data, asset_count: 0 })
    newTypeCode.value = ''
    newTypeName.value = ''
    toast.add({ severity: 'success', summary: 'Creado', detail: 'Tipo agregado', life: 3000 })
  } catch (err: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: err.response?.data?.message || 'Error', life: 5000 })
  } finally { addingType.value = false }
}

async function deleteAssetType(t: any) {
  try {
    await api.delete(`/asset-types/${t.id}`)
    assetTypesList.value = assetTypesList.value.filter(x => x.id !== t.id)
    toast.add({ severity: 'success', summary: 'Eliminado', detail: 'Tipo eliminado', life: 3000 })
  } catch (err: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: err.response?.data?.message || 'Error', life: 5000 })
  }
}

// ── Work Units Manager ──
const workUnitsDialog = ref(false)
const workUnitsList = ref<any[]>([])
const newUnitCode = ref('')
const newUnitName = ref('')
const newUnitAbbr = ref('')
const newUnitDesc = ref('')
const addingUnit = ref(false)

async function showWorkUnitsManager() {
  const res = await api.get('/work-units')
  workUnitsList.value = res.data.data || []
  for (const u of workUnitsList.value) {
    u.asset_count = assets.value.filter(a => a.work_unit_id === u.id).length
  }
  newUnitCode.value = ''
  newUnitName.value = ''
  newUnitAbbr.value = ''
  newUnitDesc.value = ''
  workUnitsDialog.value = true
}

async function addWorkUnit() {
  if (!newUnitCode.value.trim() || !newUnitName.value.trim() || !newUnitAbbr.value.trim()) return
  addingUnit.value = true
  try {
    const res = await api.post('/work-units', {
      code: newUnitCode.value,
      name: newUnitName.value,
      abbreviation: newUnitAbbr.value,
      description: newUnitDesc.value,
    })
    workUnitsList.value.push({ ...res.data.data, asset_count: 0 })
    newUnitCode.value = ''
    newUnitName.value = ''
    newUnitAbbr.value = ''
    newUnitDesc.value = ''
    toast.add({ severity: 'success', summary: 'Creado', detail: 'Unidad agregada', life: 3000 })
  } catch (err: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: err.response?.data?.message || 'Error', life: 5000 })
  } finally { addingUnit.value = false }
}

async function deleteWorkUnit(u: any) {
  try {
    await api.delete(`/work-units/${u.id}`)
    workUnitsList.value = workUnitsList.value.filter(x => x.id !== u.id)
    toast.add({ severity: 'success', summary: 'Eliminado', detail: 'Unidad eliminada', life: 3000 })
  } catch (err: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: err.response?.data?.message || 'Error', life: 5000 })
  }
}

onMounted(fetchData)
</script>

<template>
  <div v-if="title">
    <div class="flex items-center gap-3 mb-4">
      <Button icon="pi pi-arrow-left" text rounded @click="$router.push('/assets')" />
      <h1 class="text-xl font-bold">{{ title }}</h1>
      <Button v-if="isEdit" label="Guardar" icon="pi pi-check" @click="save" :loading="saving" class="ml-auto" />
      <Button v-if="!isEdit" label="Crear" icon="pi pi-plus" @click="save" :loading="saving" class="ml-auto" />
    </div>

    <Card>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Code -->
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Código *</label>
            <InputText v-model="form.code" class="w-full" :class="{ 'p-invalid': errors.code }" placeholder="EQ-001" />
            <small v-if="errors.code" class="text-red-500">{{ errors.code }}</small>
          </div>
          <!-- Name -->
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
            <InputText v-model="form.name" class="w-full" :class="{ 'p-invalid': errors.name }" placeholder="Nombre del equipo" />
            <small v-if="errors.name" class="text-red-500">{{ errors.name }}</small>
          </div>
          <!-- Asset type (from table) -->
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Tipo de Activo *</label>
            <Select v-model="form.asset_type_code" :options="assetTypes" optionLabel="name" optionValue="code"
              class="w-full" placeholder="Seleccionar tipo" />
          </div>
          <!-- Subtype -->
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Subtipo</label>
            <InputText v-model="form.type" class="w-full" placeholder="plotter, laser, cnc..." />
          </div>
          <!-- Brand -->
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Marca *</label>
            <div class="flex gap-2">
              <Select v-model="form.brand_id" :options="brands" optionLabel="name" optionValue="id"
                class="flex-1" placeholder="Seleccionar marca" :filter="true" appendTo="self" />
              <Button icon="pi pi-plus" text rounded size="small" @click="openBrandDialog" v-tooltip.left="'Nueva marca'" />
            </div>
          </div>
          <!-- Model -->
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Modelo</label>
            <InputText v-model="form.model" class="w-full" placeholder="Modelo" />
          </div>
          <!-- Serial -->
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">N° Serie</label>
            <InputText v-model="form.serial_number" class="w-full" placeholder="Número de serie" />
          </div>
          <!-- Work unit -->
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Unidad de Medida</label>
            <div class="flex gap-2">
              <Select v-model="form.work_unit_id" :options="workUnits" optionLabel="name" optionValue="id"
                class="flex-1" placeholder="Seleccionar unidad" :filter="true" appendTo="self" showClear />
              <Button icon="pi pi-plus" text rounded size="small" @click="openWorkUnitDialog" v-tooltip.left="'Nueva unidad'" />
            </div>
          </div>
          <!-- Cost per unit -->
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Costo por Unidad ($)</label>
            <InputNumber v-model="form.cost_per_unit" :min="0" :step="0.5" class="w-full" placeholder="0.00" />
          </div>
          <!-- Base price -->
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Precio Base ($)</label>
            <InputNumber v-model="form.base_price" :min="0" class="w-full" placeholder="0.00" />
          </div>
          <!-- Min units -->
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Unidades Mínimas</label>
            <InputNumber v-model="form.min_units" :min="0" :step="0.5" class="w-full" placeholder="0" />
          </div>
          <!-- Toggles -->
          <div class="flex flex-col gap-3 mt-3">
            <div class="flex items-center gap-2">
              <InputSwitch v-model="form.is_active" />
              <label class="text-sm">Activo</label>
            </div>
            <div class="flex items-center gap-2">
              <InputSwitch v-model="form.work_order_compatible" />
              <label class="text-sm">Disponible en órdenes de trabajo</label>
            </div>
          </div>
        </div>

        <!-- Description -->
        <div class="mt-4">
          <label class="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
          <Textarea v-model="form.description" rows="3" class="w-full" placeholder="Descripción del equipo..." />
        </div>
      </template>
    </Card>

    <!-- Quick brand dialog -->
    <Dialog v-model:visible="brandDialogVisible" header="Nueva Marca" :modal="true" :closable="true" :style="{ width: '95vw', maxWidth: '400px' }" :breakpoints="{ '768px': '95vw' }">
      <div class="flex flex-col gap-3">
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
          <InputText v-model="newBrandName" class="w-full" placeholder="Nombre de la marca" @keydown.enter="saveNewBrand" autofocus />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" text @click="brandDialogVisible = false" />
        <Button label="Guardar" @click="saveNewBrand" :loading="savingBrand" />
      </template>
    </Dialog>

    <!-- Quick work unit dialog -->
    <Dialog v-model:visible="workUnitDialogVisible" header="Nueva Unidad de Medida" :modal="true" :closable="true" :style="{ width: '95vw', maxWidth: '450px' }" :breakpoints="{ '768px': '95vw' }">
      <div class="grid grid-cols-2 gap-3">
        <div class="col-span-2">
          <label class="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
          <InputText v-model="newWorkUnit.name" class="w-full" placeholder="Ej: Hora" @keydown.enter="saveNewWorkUnit" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Código *</label>
          <InputText v-model="newWorkUnit.code" class="w-full" placeholder="hour" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Abreviatura *</label>
          <InputText v-model="newWorkUnit.abbreviation" class="w-full" placeholder="h" />
        </div>
        <div class="col-span-2">
          <label class="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
          <InputText v-model="newWorkUnit.description" class="w-full" placeholder="Opcional" />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" text @click="workUnitDialogVisible = false" />
        <Button label="Guardar" @click="saveNewWorkUnit" :loading="savingWorkUnit" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import api from '@/api/client'
import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import InputSwitch from 'primevue/inputswitch'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import Dialog from 'primevue/dialog'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const isEdit = computed(() => route.params.id && route.params.id !== 'new')
const title = computed(() => isEdit.value ? 'Editar Equipo' : 'Nuevo Equipo')

const saving = ref(false)
const errors = ref<Record<string, string>>({})
const brands = ref<any[]>([])
const assetTypes = ref<any[]>([])
const workUnits = ref<any[]>([])

// Quick create dialogs
const brandDialogVisible = ref(false)
const newBrandName = ref('')
const savingBrand = ref(false)

const workUnitDialogVisible = ref(false)
const newWorkUnit = ref({ code: '', name: '', abbreviation: '', description: '' })
const savingWorkUnit = ref(false)

const form = ref({
  code: '',
  name: '',
  asset_type_code: 'machine',
  type: '',
  brand_id: null as number | null,
  model: '',
  serial_number: '',
  description: '',
  base_price: 0,
  cost_per_unit: 0,
  min_units: 0,
  work_unit_id: null as number | null,
  is_active: true,
  work_order_compatible: true,
})

async function fetchData() {
  try {
    const [brandRes, typeRes, unitRes] = await Promise.all([
      api.get('/brands'),
      api.get('/asset-types'),
      api.get('/work-units'),
    ])
    brands.value = brandRes.data.data || []
    assetTypes.value = typeRes.data.data || []
    workUnits.value = unitRes.data.data || []
  } catch { /* ignore */ }
}

async function fetchAsset() {
  if (!isEdit.value) return
  try {
    const res = await api.get(`/machines/${route.params.id}`)
    const data = res.data.data
    if (data) Object.assign(form.value, data)
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el equipo', life: 5000 })
  }
}

async function save() {
  errors.value = {}
  if (!form.value.code || !form.value.name) {
    if (!form.value.code) errors.value.code = 'Requerido'
    if (!form.value.name) errors.value.name = 'Requerido'
    return
  }

  saving.value = true
  try {
    if (isEdit.value) {
      await api.put(`/machines/${route.params.id}`, form.value)
      toast.add({ severity: 'success', summary: 'Guardado', detail: 'Equipo actualizado', life: 3000 })
    } else {
      const res = await api.post('/machines', form.value)
      toast.add({ severity: 'success', summary: 'Creado', detail: 'Equipo creado correctamente', life: 3000 })
      router.replace(`/assets/${res.data.data.id}/edit`)
    }
  } catch (err: any) {
    const msg = err.response?.data?.message || 'Error al guardar'
    toast.add({ severity: 'error', summary: 'Error', detail: msg, life: 5000 })
    if (err.response?.data?.errors) {
      Object.entries(err.response.data.errors).forEach(([k, v]) => {
        errors.value[k] = (v as string[])[0]
      })
    }
  } finally {
    saving.value = false
  }
}

function openBrandDialog() {
  newBrandName.value = ''
  brandDialogVisible.value = true
}

async function saveNewBrand() {
  if (!newBrandName.value.trim()) return
  savingBrand.value = true
  try {
    const res = await api.post('/brands', { name: newBrandName.value })
    brands.value.push(res.data.data)
    form.value.brand_id = res.data.data.id
    brandDialogVisible.value = false
    toast.add({ severity: 'success', summary: 'Creado', detail: 'Marca agregada', life: 3000 })
  } catch (err: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: err.response?.data?.message || 'Error', life: 5000 })
  } finally {
    savingBrand.value = false
  }
}

function openWorkUnitDialog() {
  newWorkUnit.value = { code: '', name: '', abbreviation: '', description: '' }
  workUnitDialogVisible.value = true
}

async function saveNewWorkUnit() {
  if (!newWorkUnit.value.code || !newWorkUnit.value.name || !newWorkUnit.value.abbreviation) {
    toast.add({ severity: 'warn', summary: 'Campos requeridos', detail: 'Código, nombre y abreviatura son obligatorios', life: 4000 })
    return
  }
  savingWorkUnit.value = true
  try {
    const res = await api.post('/work-units', newWorkUnit.value)
    workUnits.value.push(res.data.data)
    form.value.work_unit_id = res.data.data.id
    workUnitDialogVisible.value = false
    toast.add({ severity: 'success', summary: 'Creado', detail: 'Unidad agregada', life: 3000 })
  } catch (err: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: err.response?.data?.message || 'Error', life: 5000 })
  } finally {
    savingWorkUnit.value = false
  }
}

onMounted(() => {
  fetchData()
  fetchAsset()
})
</script>

<template>
  <div>
    <div class="page-header"><Button label="Nuevo Movimiento" icon="pi pi-plus" @click="showDialog=true" /></div>
    <DataTable :value="items" :loading="loading" paginator :rows="15" stripedRows>
      <Column field="created_at" header="Fecha"><template #body="{data}">{{ $dayjs(data.created_at).format('DD/MM/YYYY HH:mm') }}</template></Column>
      <Column field="product.name" header="Producto" />
      <Column field="product.sku" header="SKU" />
      <Column field="type" header="Tipo"><template #body="{data}"><Tag :value="data.type" :severity="data.type==='in'?'success':data.type==='out'?'danger':'warn'"/></template></Column>
      <Column field="quantity" header="Cantidad" />
      <Column field="location.name" header="Ubicación" />
      <Column field="reason" header="Motivo" />
    </DataTable>

    <Dialog v-model:visible="showDialog" header="Nuevo Movimiento" modal :style="{width:'95vw',maxWidth:'500px'}" :breakpoints="{ '768px': '95vw' }">
      <form @submit.prevent="save" class="form-grid">
        <div class="field"><label>Producto *</label><Select v-model="form.product_id" :options="products" optionLabel="name" optionValue="id" filter class="w-full" required/></div>
        <div class="field"><label>Tipo *</label><Select v-model="form.type" :options="['in','out','transfer','adjustment']" class="w-full"/></div>
        <div class="field"><label>Cantidad *</label><InputNumber v-model="form.quantity" :min="0.001" class="w-full" required/></div>
        <div class="field"><label>Costo Unit.</label><InputNumber v-model="form.unit_cost" mode="currency" currency="USD" class="w-full"/></div>
        <div class="field"><label>Ubicación</label><Select v-model="form.location_id" :options="locs" optionLabel="name" optionValue="id" class="w-full" placeholder="Sel."/></div>
        <div class="field full-width"><label>Motivo</label><InputText v-model="form.reason" class="w-full"/></div>
      </form>
      <template #footer><Button label="Cancelar" severity="secondary" @click="showDialog=false"/><Button label="Guardar" :loading="saving" @click="save"/></template>
    </Dialog>
    <Toast />
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/api/client'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'

const items = ref([])
const loading = ref(false)
const showDialog = ref(false)
const saving = ref(false)
const toast = useToast()
const products = ref([])
const locs = ref([])
const form = ref({ product_id: null, type: 'in', quantity: 0, unit_cost: 0, location_id: null, reason: '' })

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/stock-movements')
    items.value = data.data.data
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'Error' })
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  try {
    if (form.value.quantity <= 0) throw new Error('Cantidad inválida')
    await api.post('/stock-movements', form.value)
    showDialog.value = false
    toast.add({ severity: 'success', summary: 'Movimiento registrado', life: 3000 })
    load()
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || e.message })
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  load()
  try {
    const { data } = await api.get('/products?per_page=100')
    products.value = data.data.data
  } catch {}
  try {
    const { data } = await api.get('/locations?per_page=100')
    locs.value = data.data.data
  } catch {}
})
</script>
<style scoped>
.page-header { display: flex; justify-content: flex-end; margin-bottom: 1rem; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.full-width { grid-column: 1 / -1; }
.field label { display: block; margin-bottom: 0.375rem; font-size: 0.875rem; font-weight: 500; }
</style>

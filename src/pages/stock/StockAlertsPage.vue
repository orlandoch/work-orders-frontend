<template>
  <div>
    <div class="page-header"><Button label="Nueva Alerta" icon="pi pi-plus" @click="showDialog=true" /></div>
    <DataTable :value="items" :loading="loading" paginator :rows="15" stripedRows>
      <Column field="product.name" header="Producto" />
      <Column field="product.sku" header="SKU" />
      <Column field="type" header="Tipo"><template #body="{data}"><Tag :value="data.type"/></template></Column>
      <Column field="threshold" header="Umbral" />
      <Column header="Activo"><template #body="{data}"><i :class="data.is_active ? 'pi pi-check text-green-500' : 'pi pi-times text-red-400'"></i></template></Column>
      <Column field="last_triggered_at" header="Última Alerta"><template #body="{data}">{{ data.last_triggered_at ? $dayjs(data.last_triggered_at).format('DD/MM/YYYY') : '-' }}</template></Column>
      <Column header="" body-style="text-align:right">
        <template #body="{data}"><Button icon="pi pi-trash" text rounded severity="danger" @click="del(data)" /></template>
      </Column>
    </DataTable>

    <Dialog v-model:visible="showDialog" header="Nueva Alerta" modal :style="{width:'95vw',maxWidth:'450px'}" :breakpoints="{ '768px': '95vw' }">
      <form @submit.prevent="save" class="form-grid">
        <div class="field full-width"><label>Producto *</label><Select v-model="form.product_id" :options="products" optionLabel="name" optionValue="id" filter class="w-full" required/></div>
        <div class="field"><label>Tipo *</label><Select v-model="form.type" :options="['min_stock','max_stock','expiration']" class="w-full"/></div>
        <div class="field"><label>Umbral *</label><InputNumber v-model="form.threshold" :min="0" class="w-full" required/></div>
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
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

const items = ref([])
const loading = ref(false)
const showDialog = ref(false)
const saving = ref(false)
const toast = useToast()
const confirm = useConfirm()
const products = ref([])
const form = ref({ product_id: null, type: 'min_stock', threshold: 0 })

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/product-stock-alerts')
    items.value = data.data.data
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error' })
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  try {
    await api.post('/product-stock-alerts', form.value)
    showDialog.value = false
    toast.add({ severity: 'success', summary: 'Alerta creada', life: 3000 })
    load()
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'Error' })
  } finally {
    saving.value = false
  }
}

function del(c: any) {
  confirm.require({
    message: '¿Eliminar alerta?',
    header: 'Confirmar',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await api.delete(`/product-stock-alerts/${c.id}`)
        toast.add({ severity: 'success', summary: 'Eliminado', life: 3000 })
        load()
      } catch (e: any) {
        toast.add({ severity: 'error', summary: 'Error' })
      }
    }
  })
}

onMounted(async () => {
  load()
  try {
    const { data } = await api.get('/products?per_page=100')
    products.value = data.data.data
  } catch {}
})
</script>
<style scoped>
.page-header { display: flex; justify-content: flex-end; margin-bottom: 1rem; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.full-width { grid-column: 1 / -1; }
.field label { display: block; margin-bottom: 0.375rem; font-size: 0.875rem; font-weight: 500; }
</style>

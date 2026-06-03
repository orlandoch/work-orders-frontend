<template>
  <div>
    <div class="page-header"><Button label="Nuevo Evento" icon="pi pi-plus" @click="showDialog=true" /></div>
    <DataTable :value="items" :loading="loading" paginator :rows="25" stripedRows>
      <Column field="title" header="Título" sortable />
      <Column field="start" header="Inicio"><template #body="{data}">{{ $dayjs(data.start).format('DD/MM/YYYY HH:mm') }}</template></Column>
      <Column field="end" header="Fin"><template #body="{data}">{{ data.end ? $dayjs(data.end).format('DD/MM/YYYY HH:mm') : '-' }}</template></Column>
      <Column field="is_all_day" header="Todo el día"><template #body="{data}"><i :class="data.is_all_day ? 'pi pi-check text-green-500' : ''"/></template></Column>
      <Column header="" body-style="text-align:right">
        <template #body="{data}"><Button icon="pi pi-pencil" text rounded @click="edit(data)" /><Button icon="pi pi-trash" text rounded severity="danger" @click="del(data)" /></template>
      </Column>
    </DataTable>

    <Dialog v-model:visible="showDialog" :header="editing?'Editar Evento':'Nuevo Evento'" modal :style="{width:'95vw',maxWidth:'450px'}" :breakpoints="{ '768px': '95vw' }">
      <div class="form-grid">
        <div class="field full-width"><label>Título *</label><InputText v-model="form.title" class="w-full" required/></div>
        <div class="field"><label>Inicio *</label><Calendar v-model="form.start" showTime hourFormat="24" class="w-full" required/></div>
        <div class="field"><label>Fin</label><Calendar v-model="form.end" showTime hourFormat="24" class="w-full" /></div>
        <div class="field"><label>Todo el día</label><ToggleSwitch v-model="form.is_all_day" /></div>
        <div class="field"><label>Color</label><ColorPicker v-model="form.color" class="w-full" /></div>
        <div class="field full-width"><label>Descripción</label><Textarea v-model="form.description" rows="2" class="w-full"/></div>
      </div>
      <template #footer><Button label="Cancelar" severity="secondary" @click="closeDialog"/><Button label="Guardar" :loading="saving" @click="save"/></template>
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
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Calendar from 'primevue/calendar'
import ToggleSwitch from 'primevue/toggleswitch'
import ColorPicker from 'primevue/colorpicker'
import Textarea from 'primevue/textarea'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

const items = ref([])
const loading = ref(false)
const showDialog = ref(false)
const saving = ref(false)
const toast = useToast()
const confirm = useConfirm()
const editing = ref(false)
const form = ref({ title: '', description: '', start: null, end: null, is_all_day: false, color: '#6366f1' })

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/calendar-events')
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
    if (editing.value) {
      await api.put(`/calendar-events/${form.value.id}`, form.value)
    } else {
      await api.post('/calendar-events', form.value)
    }
    closeDialog()
    toast.add({ severity: 'success', summary: 'Evento guardado', life: 3000 })
    load()
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'Error' })
  } finally {
    saving.value = false
  }
}

function edit(e: any) {
  editing.value = true
  form.value = {
    id: e.id,
    title: e.title,
    description: e.description || '',
    start: new Date(e.start),
    end: e.end ? new Date(e.end) : null,
    is_all_day: e.is_all_day,
    color: e.color || '#6366f1',
  }
  showDialog.value = true
}

function closeDialog() {
  showDialog.value = false
  editing.value = false
  form.value = { title: '', description: '', start: null, end: null, is_all_day: false, color: '#6366f1' }
}

function del(c: any) {
  confirm.require({
    message: `¿Eliminar evento ${c.title}?`,
    header: 'Confirmar',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await api.delete(`/calendar-events/${c.id}`)
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
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.full-width { grid-column: 1 / -1; }
.field label { display: block; margin-bottom: 0.375rem; font-size: 0.875rem; font-weight: 500; }
</style>

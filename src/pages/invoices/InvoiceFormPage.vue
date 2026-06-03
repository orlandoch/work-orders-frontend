<template>
  <div>
    <!-- Header -->
    <div class="flex align-items-center justify-content-between mb-4">
      <h3 class="text-lg font-semibold m-0">{{ editMode ? 'Editar' : 'Nueva' }} Factura</h3>
      <router-link to="/invoices">
        <Button label="Volver" icon="pi pi-arrow-left" text size="small" />
      </router-link>
    </div>

    <!-- Form Fields -->
    <Card class="mb-4">
      <template #title>Datos de la Factura</template>
      <template #content>
        <div class="grid formgrid p-fluid">
          <div class="field col-12 md:col-6 lg:col-4">
            <label>Cliente *</label>
            <Select
              v-model="form.client_id"
              :options="clients"
              optionLabel="name"
              optionValue="id"
              placeholder="Seleccionar cliente"
              :disabled="!editMode"
              class="w-full"
            />
          </div>
          <div class="field col-12 md:col-6 lg:col-4">
            <label>IVA</label>
            <Select
              v-model="form.iva_id"
              :options="ivas"
              optionLabel="name"
              optionValue="id"
              placeholder="Seleccionar IVA"
              class="w-full"
            />
          </div>
          <div class="field col-12 md:col-6 lg:col-4">
            <label>Fecha de Emisión *</label>
            <InputText type="date" v-model="form.issue_date" class="w-full" />
          </div>
          <div class="field col-12 md:col-6 lg:col-4">
            <label>Fecha de Vencimiento</label>
            <InputText type="date" v-model="form.due_date" class="w-full" />
          </div>
          <div class="field col-12">
            <label>Notas</label>
            <Textarea v-model="form.notes" rows="3" class="w-full" />
          </div>
        </div>
      </template>
    </Card>

    <!-- Items -->
    <Card class="mb-4">
      <template #title>Items</template>
      <template #content>
        <!-- Desktop: DataTable -->
        <div class="hidden md:block">
          <DataTable :value="form.items" scrollable scrollHeight="flex" class="mb-2" size="small">
            <Column field="description" header="Descripción">
              <template #body="slotProps">
                <InputText v-model="slotProps.data.description" placeholder="Descripción" class="w-full" />
              </template>
            </Column>
            <Column header="Cantidad" style="min-width: 100px">
              <template #body="slotProps">
                <InputNumber v-model="slotProps.data.quantity" :min="0.001" :step="1" :minFractionDigits="2" class="w-full" />
              </template>
            </Column>
            <Column header="Precio Unitario" style="min-width: 120px">
              <template #body="slotProps">
                <InputNumber v-model="slotProps.data.unit_price" :min="0" :step="0.5" :minFractionDigits="2" class="w-full" @update:modelValue="recalc" />
              </template>
            </Column>
            <Column header="Total" style="min-width: 90px">
              <template #body="slotProps">
                <span class="font-semibold text-right w-full block">${{ itemTotal(slotProps.data).toFixed(2) }}</span>
              </template>
            </Column>
            <Column style="width: 3rem">
              <template #body="slotProps">
                <Button icon="pi pi-trash" text severity="danger" size="small" @click="removeItem(slotProps.index)" :disabled="form.items.length <= 1" />
              </template>
            </Column>
          </DataTable>
        </div>

        <!-- Mobile: Cards -->
        <div class="block md:hidden">
          <div
            v-for="(item, idx) in form.items"
            :key="idx"
            class="surface-card border-1 surface-border border-round p-3 mb-2"
          >
            <div class="field col-12">
              <label>Descripción</label>
              <InputText v-model="item.description" placeholder="Descripción" class="w-full" />
            </div>
            <div class="grid formgrid p-fluid">
              <div class="field col-6">
                <label>Cantidad</label>
                <InputNumber v-model="item.quantity" :min="0.001" :step="1" :minFractionDigits="2" class="w-full" />
              </div>
              <div class="field col-6">
                <label>P. Unitario</label>
                <InputNumber v-model="item.unit_price" :min="0" :step="0.5" :minFractionDigits="2" class="w-full" @update:modelValue="recalc" />
              </div>
            </div>
            <div class="flex align-items-center justify-content-between">
              <span class="font-semibold">Total: ${{ itemTotal(item).toFixed(2) }}</span>
              <Button icon="pi pi-trash" text severity="danger" size="small" @click="removeItem(idx)" :disabled="form.items.length <= 1" />
            </div>
          </div>
        </div>

        <Button label="Agregar Item" icon="pi pi-plus" text size="small" @click="addItem" />
      </template>
    </Card>

    <!-- Summary -->
    <Card class="mb-4 ml-auto" style="max-width: 400px">
      <template #content>
        <div class="flex justify-content-between py-1">
          <span class="text-color-secondary">Subtotal:</span>
          <span class="font-semibold">${{ subtotal.toFixed(2) }}</span>
        </div>
        <div class="flex justify-content-between py-1">
          <span class="text-color-secondary">IVA ({{ ivaPercentage }}%):</span>
          <span class="font-semibold">${{ ivaAmount.toFixed(2) }}</span>
        </div>
        <div class="flex justify-content-between pt-2 mt-2 border-top-2 surface-border font-bold text-lg">
          <span>Total:</span>
          <span>${{ total.toFixed(2) }}</span>
        </div>
      </template>
    </Card>

    <!-- Actions -->
    <div class="flex gap-2 justify-content-end">
      <Button
        :label="editMode ? 'Actualizar' : 'Guardar'"
        icon="pi pi-check"
        @click="save"
        :loading="saving"
      />
    </div>

    <Toast />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Toast from 'primevue/toast'
import api from '@/api/client'

const router = useRouter()
const route = useRoute()
const toast = useToast()

const editMode = computed(() => !!route.params.id)
const saving = ref(false)
const clients = ref([])
const ivas = ref([])

const form = ref({
  client_id: null,
  iva_id: null,
  issue_date: new Date().toISOString().split('T')[0],
  due_date: '',
  notes: '',
  items: [{ description: '', quantity: 1, unit_price: 0 }],
})

function addItem() {
  form.value.items.push({ description: '', quantity: 1, unit_price: 0 })
}

function removeItem(idx: number) {
  if (form.value.items.length > 1) {
    form.value.items.splice(idx, 1)
  }
}

function itemTotal(item: any): number {
  return (item.quantity || 0) * (item.unit_price || 0)
}

const subtotal = computed(() => {
  return form.value.items.reduce((sum, item) => sum + itemTotal(item), 0)
})

const ivaPercentage = computed(() => {
  if (!form.value.iva_id) return 0
  const iva = ivas.value.find((i: any) => i.id === form.value.iva_id)
  return iva ? Number(iva.percentage) : 0
})

const ivaAmount = computed(() => {
  return subtotal.value * ivaPercentage.value / 100
})

const total = computed(() => {
  return subtotal.value + ivaAmount.value
})

function recalc() {
  // reactivity handles it
}

async function loadClients() {
  try {
    const res = await api.get('/clients', { params: { per_page: 100 } })
    const raw = res.data.data.data || res.data.data || []
    clients.value = raw.map((c: any) => ({
      ...c,
      name: [c.first_name, c.last_name].filter(Boolean).join(' ')
    }))
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar clientes', life: 3000 })
  }
}

async function loadIvas() {
  try {
    const res = await api.get('/ivas')
    ivas.value = res.data.data || []
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar IVAs', life: 3000 })
  }
}

async function loadInvoice() {
  if (!editMode.value) return
  try {
    const res = await api.get(`/invoices/${route.params.id}`)
    const inv = res.data.data
    form.value = {
      client_id: inv.client_id,
      iva_id: inv.iva_id,
      issue_date: inv.issue_date,
      due_date: inv.due_date || '',
      notes: inv.notes || '',
      items: inv.items.map((i: any) => ({
        description: i.description,
        quantity: i.quantity,
        unit_price: i.unit_price,
      })),
    }
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la factura', life: 3000 })
  }
}

async function save() {
  if (!form.value.client_id) {
    toast.add({ severity: 'warn', summary: 'Validación', detail: 'Seleccione un cliente', life: 3000 })
    return
  }
  if (!form.value.issue_date) {
    toast.add({ severity: 'warn', summary: 'Validación', detail: 'Ingrese fecha de emisión', life: 3000 })
    return
  }
  if (form.value.items.some((i: any) => !i.description)) {
    toast.add({ severity: 'warn', summary: 'Validación', detail: 'Complete la descripción de todos los items', life: 3000 })
    return
  }

  saving.value = true
  try {
    const payload = {
      ...form.value,
      due_date: form.value.due_date || null,
      items: form.value.items.filter((i: any) => i.description.trim() && i.quantity > 0),
    }

    if (editMode.value) {
      await api.put(`/invoices/${route.params.id}`, payload)
      toast.add({ severity: 'success', summary: 'Actualizada', detail: 'Factura actualizada', life: 2000 })
    } else {
      await api.post('/invoices', payload)
      toast.add({ severity: 'success', summary: 'Creada', detail: 'Factura creada', life: 2000 })
    }

    setTimeout(() => router.push('/invoices'), 1500)
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'Error al guardar', life: 3000 })
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadClients()
  loadIvas()
  loadInvoice()
})
</script>

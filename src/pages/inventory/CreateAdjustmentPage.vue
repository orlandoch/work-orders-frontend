<template>
  <div>
    <Card>
      <template #title>Crear Ajuste de Inventario</template>
      <template #content>
        <div class="grid p-fluid">
          <div class="col-12 md:col-4">
            <label for="type">Tipo de Ajuste *</label>
            <Select v-model="form.type" :options="typeOptions" optionLabel="label" optionValue="value" />
            <small v-if="errors.type" class="p-error">{{ errors.type }}</small>
          </div>
          <div class="col-12 md:col-8">
            <label for="description">Descripción *</label>
            <InputText id="description" v-model="form.description" :invalid="!!errors.description" />
            <small v-if="errors.description" class="p-error">{{ errors.description }}</small>
          </div>
          <div class="col-12">
            <label for="notes">Notas</label>
            <Textarea id="notes" v-model="form.notes" rows="2" />
          </div>
        </div>

        <Divider />
        <h3>Líneas de Ajuste</h3>

        <div v-for="(line, idx) in form.lines" :key="idx" class="grid p-fluid mb-2 border-1 border-round p-2">
          <div class="col-12 md:col-3">
            <label>Producto *</label>
            <BankingProductSelect v-model="line.product_id" />
            <small v-if="lineErrors[idx]?.product_id" class="p-error">{{ lineErrors[idx].product_id }}</small>
          </div>
          <div class="col-6 md:col-2">
            <label>Bodega</label>
            <WarehouseSelect v-model="line.warehouse_id" />
          </div>
          <div class="col-6 md:col-2">
            <label>Ubicación</label>
            <WarehouseLocationSelect v-model="line.warehouse_location_id" :warehouse-id="line.warehouse_id" />
          </div>
          <div class="col-4 md:col-1">
            <label>Cantidad *</label>
            <InputNumber v-model="line.quantity" :min="0" :invalid="!!lineErrors[idx]?.quantity" class="w-full" />
          </div>
          <div class="col-4 md:col-2">
            <label>Costo Unit. {{ form.type === 'adjustment_positive' ? '*' : '(solo lectura)' }}</label>
            <InputNumber v-model="line.unit_cost" :disabled="form.type !== 'adjustment_positive'" :min="0" mode="currency" currency="USD" locale="es-US" class="w-full" />
          </div>
          <div class="col-2 md:col-1 flex align-items-end">
            <Button icon="pi pi-trash" severity="danger" text @click="removeLine(idx)" />
          </div>
        </div>

        <Button label="Agregar línea" icon="pi pi-plus" severity="secondary" @click="addLine" class="mb-3" />

        <div class="flex gap-2 mt-3">
          <Button label="Guardar Ajuste" icon="pi pi-check" :loading="saving" @click="save" />
          <Button label="Cancelar" severity="secondary" @click="$router.back()" />
        </div>

        <Message v-if="result" severity="success" class="mt-3">
          Ajuste creado. ID: {{ result.movement_id }}, Número: {{ result.number }}, Status: {{ result.status }}
        </Message>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { createInventoryAdjustment } from '@/api/inventoryService'
import BankingProductSelect from '@/components/BankingProductSelect.vue'
import WarehouseSelect from '@/components/WarehouseSelect.vue'
import WarehouseLocationSelect from '@/components/WarehouseLocationSelect.vue'
import { useToast } from 'primevue/usetoast'
import Card from 'primevue/card'
import Select from 'primevue/select'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Divider from 'primevue/divider'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'
import Message from 'primevue/message'

const toast = useToast()
const saving = ref(false)
const result = ref<any>(null)

const typeOptions = [
  { label: 'Ajuste Positivo (entrada)', value: 'adjustment_positive' },
  { label: 'Ajuste Negativo (salida)', value: 'adjustment_negative' },
]

interface Line {
  product_id: number | null
  warehouse_id: number | null
  warehouse_location_id: number | null
  quantity: number | null
  unit_cost: number | null
}

const form = reactive({
  type: 'adjustment_positive',
  description: '',
  notes: '',
  lines: [] as Line[],
})

const errors = reactive<Record<string, string>>({})
const lineErrors = reactive<Record<number, Record<string, string>>>({})

function addLine() {
  form.lines.push({ product_id: null, warehouse_id: null, warehouse_location_id: null, quantity: null, unit_cost: null })
}

function removeLine(idx: number) {
  form.lines.splice(idx, 1)
}

addLine()

async function save() {
  // clear
  Object.keys(errors).forEach(k => delete errors[k])
  for (const k of Object.keys(lineErrors)) delete lineErrors[Number(k)]

  // validate
  if (!form.type) { errors.type = 'Tipo requerido'; return }
  if (!form.description) { errors.description = 'Descripción requerida'; return }
  if (form.lines.length === 0) { toast.add({ severity: 'warn', summary: 'Agregue al menos una línea', life: 3000 }); return }

  saving.value = true
  result.value = null
  try {
    const payload = {
      type: form.type,
      description: form.description,
      notes: form.notes || undefined,
      lines: form.lines.map(l => ({
        product_id: l.product_id,
        warehouse_id: l.warehouse_id,
        warehouse_location_id: l.warehouse_location_id,
        quantity: l.quantity,
        unit_cost: l.unit_cost || undefined,
      })),
    }
    const res = await createInventoryAdjustment(payload)
    result.value = res.data?.data || res.data
    toast.add({ severity: 'success', summary: 'Ajuste creado', detail: `ID: ${result.value?.movement_id}`, life: 4000 })
  } catch (e: any) {
    const data = e.response?.data
    if (data?.errors) {
      for (const [k, msgs] of Object.entries(data.errors)) {
        if (k.startsWith('lines.')) {
          const parts = k.split('.')
          const idx = parseInt(parts[1])
          const field = parts[2]
          if (!isNaN(idx)) {
            if (!lineErrors[idx]) lineErrors[idx] = {}
            lineErrors[idx][field] = (msgs as string[]).join(', ')
          }
        } else {
          errors[k] = (msgs as string[]).join(', ')
        }
      }
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: data?.message || 'Error al guardar', life: 4000 })
    }
  } finally {
    saving.value = false
  }
}
</script>

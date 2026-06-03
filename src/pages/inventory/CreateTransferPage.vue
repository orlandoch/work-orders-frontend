<template>
  <div>
    <Card>
      <template #title>Transferencia de Inventario</template>
      <template #content>
        <div class="grid p-fluid">
          <div class="col-12">
            <label for="desc">Descripción *</label>
            <InputText id="desc" v-model="form.description" :invalid="!!errors.description" />
            <small v-if="errors.description" class="p-error">{{ errors.description }}</small>
          </div>
        </div>

        <Divider />
        <h3>Líneas de Transferencia</h3>

        <div v-for="(line, idx) in form.lines" :key="idx" class="grid p-fluid mb-2 border-1 border-round p-2">
          <div class="col-12 md:col-2">
            <label>Producto *</label>
            <BankingProductSelect v-model="line.product_id" />
          </div>
          <div class="col-6 md:col-2">
            <label>Bodega Origen *</label>
            <WarehouseSelect v-model="line.source_warehouse_id" />
          </div>
          <div class="col-6 md:col-2">
            <label>Ubicación Origen</label>
            <WarehouseLocationSelect v-model="line.source_warehouse_location_id" :warehouse-id="line.source_warehouse_id" />
          </div>
          <div class="col-6 md:col-2">
            <label>Bodega Destino *</label>
            <WarehouseSelect v-model="line.destination_warehouse_id" />
          </div>
          <div class="col-6 md:col-2">
            <label>Ubicación Destino</label>
            <WarehouseLocationSelect v-model="line.destination_warehouse_location_id" :warehouse-id="line.destination_warehouse_id" />
          </div>
          <div class="col-4 md:col-1">
            <label>Cantidad *</label>
            <InputNumber v-model="line.quantity" :min="1" class="w-full" />
          </div>
          <div class="col-2 md:col-1 flex align-items-end">
            <Button icon="pi pi-trash" severity="danger" text @click="removeLine(idx)" />
          </div>
        </div>

        <Button label="Agregar línea" icon="pi pi-plus" severity="secondary" @click="addLine" class="mb-3" />

        <div class="flex gap-2 mt-3">
          <Button label="Guardar Transferencia" icon="pi pi-send" :loading="saving" @click="save" />
          <Button label="Cancelar" severity="secondary" @click="$router.back()" />
        </div>

        <Message v-if="result" severity="success" class="mt-3">
          Transferencia creada. ID: {{ result.movement_id }}, Número: {{ result.number }}, Status: {{ result.status }}
        </Message>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { createInventoryTransfer } from '@/api/inventoryService'
import BankingProductSelect from '@/components/BankingProductSelect.vue'
import WarehouseSelect from '@/components/WarehouseSelect.vue'
import WarehouseLocationSelect from '@/components/WarehouseLocationSelect.vue'
import { useToast } from 'primevue/usetoast'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Divider from 'primevue/divider'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'
import Message from 'primevue/message'

const toast = useToast()
const saving = ref(false)
const result = ref<any>(null)

interface TransferLine {
  product_id: number | null
  source_warehouse_id: number | null
  source_warehouse_location_id: number | null
  destination_warehouse_id: number | null
  destination_warehouse_location_id: number | null
  quantity: number | null
}

const form = reactive({
  description: '',
  lines: [] as TransferLine[],
})

const errors = reactive<Record<string, string>>({})

function addLine() {
  form.lines.push({
    product_id: null, source_warehouse_id: null, source_warehouse_location_id: null,
    destination_warehouse_id: null, destination_warehouse_location_id: null, quantity: null,
  })
}

function removeLine(idx: number) {
  form.lines.splice(idx, 1)
}

addLine()

async function save() {
  Object.keys(errors).forEach(k => delete errors[k])
  if (!form.description) { errors.description = 'Descripción requerida'; return }
  if (form.lines.length === 0) { toast.add({ severity: 'warn', summary: 'Agregue al menos una línea', life: 3000 }); return }

  saving.value = true
  result.value = null
  try {
    const payload = {
      description: form.description,
      lines: form.lines.map(l => ({
        product_id: l.product_id,
        source_warehouse_id: l.source_warehouse_id,
        source_warehouse_location_id: l.source_warehouse_location_id || undefined,
        destination_warehouse_id: l.destination_warehouse_id,
        destination_warehouse_location_id: l.destination_warehouse_location_id || undefined,
        quantity: l.quantity,
      })),
    }
    const res = await createInventoryTransfer(payload)
    result.value = res.data?.data || res.data
    toast.add({ severity: 'success', summary: 'Transferencia creada', detail: `ID: ${result.value?.movement_id}`, life: 4000 })
  } catch (e: any) {
    const data = e.response?.data
    if (data?.errors) {
      for (const [k, msgs] of Object.entries(data.errors)) {
        if (k.startsWith('lines.')) {
          // too complex for field-level per line; show generic
        } else {
          errors[k] = (msgs as string[]).join(', ')
        }
      }
    }
    toast.add({ severity: 'error', summary: 'Error', detail: data?.message || 'Error al guardar', life: 4000 })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <Card>
      <template #title>Recepción de Compra</template>
      <template #content>
        <div class="grid p-fluid">
          <div class="col-12 md:col-4">
            <label>Proveedor *</label>
            <SupplierSelect v-model="form.supplier_id" />
            <small v-if="errors.supplier_id" class="p-error">{{ errors.supplier_id }}</small>
          </div>
          <div class="col-6 md:col-2">
            <label>Tipo Doc.</label>
            <Select v-model="form.document_type" :options="docTypes" class="w-full" />
          </div>
          <div class="col-6 md:col-2">
            <label>Número Doc.</label>
            <InputText v-model="form.document_number" />
          </div>
          <div class="col-6 md:col-2">
            <label>Fecha Doc. *</label>
            <DatePicker v-model="form.document_date" dateFormat="yy-mm-dd" class="w-full" />
          </div>
          <div class="col-6 md:col-2">
            <label>Vence</label>
            <DatePicker v-model="form.due_date" dateFormat="yy-mm-dd" class="w-full" />
          </div>
          <div class="col-6 md:col-2">
            <label>Días pago</label>
            <InputNumber v-model="form.payment_terms_days" :min="0" class="w-full" />
          </div>
          <div class="col-6 md:col-2">
            <label>Bodega</label>
            <WarehouseSelect v-model="form.default_warehouse_id" />
          </div>
          <div class="col-6 md:col-2">
            <label>Ubicación</label>
            <WarehouseLocationSelect v-model="form.default_location_id" :warehouse-id="form.default_warehouse_id" />
          </div>
          <div class="col-6 md:col-2 flex align-items-center">
            <Checkbox v-model="form.auto_account" binary />
            <label class="ml-1">Auto-contabilizar</label>
          </div>
          <div class="col-6 md:col-2 flex align-items-center">
            <Checkbox v-model="form.create_account_payable" binary />
            <label class="ml-1">Crear CXP</label>
          </div>
        </div>

        <Divider />
        <h3>Líneas</h3>

        <div v-for="(line, idx) in form.lines" :key="idx" class="grid p-fluid mb-2 border-1 border-round p-2">
          <div class="col-12 md:col-3">
            <label>Producto *</label>
            <BankingProductSelect v-model="line.product_id" />
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
            <InputNumber v-model="line.quantity" :min="1" class="w-full" />
          </div>
          <div class="col-4 md:col-2">
            <label>Costo Unit. *</label>
            <InputNumber v-model="line.unit_cost" :min="0" mode="currency" currency="USD" locale="es-US" class="w-full" />
          </div>
          <div class="col-4 md:col-1">
            <label>Lote</label>
            <InputText v-model="line.lot" />
          </div>
          <div class="col-4 md:col-1" v-if="line.quantity && line.unit_cost">
            <label>Total</label>
            <div class="font-bold p-2">${{ (line.quantity * line.unit_cost).toFixed(2) }}</div>
          </div>
          <div class="col-2 md:col-1 flex align-items-end">
            <Button icon="pi pi-trash" severity="danger" text @click="removeLine(idx)" />
          </div>
        </div>

        <Button label="Agregar línea" icon="pi pi-plus" severity="secondary" @click="addLine" class="mb-3" />

        <Divider />
        <div class="flex gap-2">
          <Button label="Guardar Recepción" icon="pi pi-check" :loading="saving" @click="save" />
          <Button label="Cancelar" severity="secondary" @click="$router.back()" />
        </div>

        <Message v-if="result" severity="success" class="mt-3">
          Recepción creada. Movement ID: {{ result.movement_id }}, Número: {{ result.number }}
          <template v-if="result.journal_entry_id">, Asiento: {{ result.journal_entry_id }}</template>
          <template v-if="result.account_payable_id">, CXP: {{ result.account_payable_id }}</template>
        </Message>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { createPurchaseReceipt } from '@/api/purchaseService'
import SupplierSelect from '@/components/SupplierSelect.vue'
import BankingProductSelect from '@/components/BankingProductSelect.vue'
import WarehouseSelect from '@/components/WarehouseSelect.vue'
import WarehouseLocationSelect from '@/components/WarehouseLocationSelect.vue'
import { useToast } from 'primevue/usetoast'
import Card from 'primevue/card'
import Select from 'primevue/select'
import InputText from 'primevue/inputtext'
import DatePicker from 'primevue/datepicker'
import InputNumber from 'primevue/inputnumber'
import Checkbox from 'primevue/checkbox'
import Divider from 'primevue/divider'
import Button from 'primevue/button'
import Message from 'primevue/message'

const toast = useToast()
const saving = ref(false)
const result = ref<any>(null)

const docTypes = ['Factura', 'Nota de Venta', 'Guía', 'Otro']

interface Line {
  product_id: number | null
  warehouse_id: number | null
  warehouse_location_id: number | null
  quantity: number | null
  unit_cost: number | null
  lot: string
}

const form = reactive({
  supplier_id: null as number | null,
  document_type: 'Factura',
  document_number: '',
  document_date: null as string | null,
  due_date: null as string | null,
  payment_terms_days: 30,
  default_warehouse_id: null as number | null,
  default_location_id: null as number | null,
  auto_account: true,
  create_account_payable: true,
  lines: [] as Line[],
})

const errors = reactive<Record<string, string>>({})

function addLine() {
  form.lines.push({ product_id: null, warehouse_id: null, warehouse_location_id: null, quantity: null, unit_cost: null, lot: '' })
}
function removeLine(idx: number) { form.lines.splice(idx, 1) }
addLine()

async function save() {
  Object.keys(errors).forEach(k => delete errors[k])
  if (!form.supplier_id) { errors.supplier_id = 'Requerido'; return }
  if (!form.document_date) { toast.add({ severity: 'warn', summary: 'Fecha requerida', life: 3000 }); return }
  if (form.lines.length === 0) { toast.add({ severity: 'warn', summary: 'Agregue líneas', life: 3000 }); return }

  saving.value = true
  result.value = null
  try {
    const payload: any = {
      supplier_id: form.supplier_id,
      document_type: form.document_type,
      document_number: form.document_number || undefined,
      document_date: form.document_date,
      due_date: form.due_date || undefined,
      payment_terms_days: form.payment_terms_days,
      auto_account: form.auto_account,
      create_account_payable: form.create_account_payable,
      lines: form.lines.map(l => ({
        product_id: l.product_id,
        warehouse_id: l.warehouse_id,
        warehouse_location_id: l.warehouse_location_id || undefined,
        quantity: l.quantity,
        unit_cost: l.unit_cost,
        lot: l.lot || undefined,
      })),
    }
    if (form.default_warehouse_id) payload.default_warehouse_id = form.default_warehouse_id
    if (form.default_location_id) payload.default_location_id = form.default_location_id

    const res = await createPurchaseReceipt(payload)
    result.value = res.data?.data || res.data
    toast.add({ severity: 'success', summary: 'Recepción creada', detail: `ID: ${result.value?.movement_id}`, life: 4000 })
  } catch (e: any) {
    const data = e.response?.data
    if (data?.errors) {
      for (const [k, msgs] of Object.entries(data.errors))
        errors[k] = (msgs as string[]).join(', ')
    }
    toast.add({ severity: 'error', summary: 'Error', detail: data?.message || 'Error', life: 4000 })
  } finally {
    saving.value = false
  }
}
</script>

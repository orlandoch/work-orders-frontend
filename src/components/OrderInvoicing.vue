<template>
  <Card>
    <template #title>
      <span class="flex align-items-center gap-2">
        <i class="pi pi-file-invoice"></i>
        Facturación
      </span>
    </template>
    <template #content>
      <div class="flex flex-column md:flex-row md:align-items-center gap-2 md:gap-3 mb-3">
        <label class="text-sm font-medium text-color-secondary whitespace-nowrap">Modo de facturación:</label>
        <Select v-model="localMode" :options="modeOptions" optionLabel="label" optionValue="value"
          class="w-full md:w-56" @change="updateMode" :loading="updating" />
      </div>

      <!-- Line items mode: editable items -->
      <div v-if="localMode === 'line_items'">
        <div class="text-sm text-color-secondary mb-2">Items de factura (ingreso manual)</div>
        <!-- Desktop: DataTable -->
        <div class="hidden md:block">
          <DataTable scrollable scrollHeight="flex" :value="manualItems" size="small" stripedRows class="text-sm w-full mb-2">
            <Column header="#">
              <template #body="s">{{ s.index + 1 }}</template>
            </Column>
            <Column header="Descripción">
              <template #body="s">
                <InputText v-model="s.data.description" placeholder="Descripción" class="w-full text-sm" />
              </template>
            </Column>
            <Column header="Cant." class="w-20">
              <template #body="s">
                <InputNumber v-model="s.data.quantity" :min="0.01" :step="1" class="w-full" inputClass="text-sm text-right" />
              </template>
            </Column>
            <Column header="P. Unit." class="w-28">
              <template #body="s">
                <InputNumber v-model="s.data.unit_price" :min="0" :step="0.01" class="w-full" inputClass="text-sm text-right" :format="true" />
              </template>
            </Column>
            <Column header="Total" class="w-24 text-right">
              <template #body="s">${{ (Number(s.data.quantity || 0) * Number(s.data.unit_price || 0)).toFixed(2) }}</template>
            </Column>
            <Column header="" class="w-10">
              <template #body="s">
                <Button icon="pi pi-times" text border-round severity="danger" size="small" @click="removeManualItem(s.index)" />
              </template>
            </Column>
          </DataTable>
        </div>
        <!-- Mobile: card list -->
        <div class="block md:hidden gap-2 mb-2">
          <div v-for="(item, idx) in manualItems" :key="idx" class="border-1 border-round p-3 gap-2">
            <div class="flex align-items-center justify-content-between">
              <span class="text-sm text-color-secondary font-mono">#{{ idx + 1 }}</span>
              <Button icon="pi pi-times" text border-round severity="danger" size="small" @click="removeManualItem(idx)" />
            </div>
            <InputText v-model="item.description" placeholder="Descripción" class="w-full text-sm" />
            <div class="grid formgrid p-fluid gap-2">
              <div class="col-6">
                <label class="text-sm text-color-secondary block mb-0.5">Cant.</label>
                <InputNumber v-model="item.quantity" :min="0.01" :step="1" class="w-full" inputClass="text-sm text-right" />
              </div>
              <div class="col-6">
                <label class="text-sm text-color-secondary block mb-0.5">P. Unit.</label>
                <InputNumber v-model="item.unit_price" :min="0" :step="0.01" class="w-full" inputClass="text-sm text-right" :format="true" />
              </div>
            </div>
            <div class="text-right text-sm font-semibold">
              Total: ${{ (Number(item.quantity || 0) * Number(item.unit_price || 0)).toFixed(2) }}
            </div>
          </div>
        </div>
        <Button label="Agregar item" icon="pi pi-plus" size="small" text @click="addManualItem" />
        <div class="mt-2 text-sm">
          <span class="text-color-secondary">Total items: </span>
          <span class="font-semibold">${{ manualTotal.toFixed(2) }}</span>
          <span v-if="pricingTotal && Math.abs(manualTotal - pricingTotal) > 0.01" class="text-color-secondary ml-2 text-sm">
            (debe coincidir con ${{ pricingTotal.toFixed(2) }})
          </span>
        </div>
      </div>

      <!-- Product list mode: auto-generated from pricing -->
      <div v-if="localMode === 'product_list'" class="mb-3">
        <div class="text-sm text-color-secondary mb-2">Items generados desde la orden de trabajo</div>
        <!-- Desktop: DataTable -->
        <div class="hidden md:block">
          <DataTable scrollable scrollHeight="flex" :value="lineItems" size="small" stripedRows class="text-sm w-full">
            <Column field="description" header="Descripción" />
            <Column field="quantity" header="Cant." class="text-right">
              <template #body="s">{{ Number(s.data.quantity).toFixed(2) }}</template>
            </Column>
            <Column field="unit_price" header="P. Unit." class="text-right">
              <template #body="s">${{ Number(s.data.unit_price).toFixed(2) }}</template>
            </Column>
            <Column field="total" header="Total" class="text-right">
              <template #body="s">${{ Number(s.data.total).toFixed(2) }}</template>
            </Column>
          </DataTable>
        </div>
        <!-- Mobile: card list -->
        <div class="block md:hidden gap-2">
          <div v-for="(item, idx) in lineItems" :key="idx" class="border-1 border-round p-3">
            <div class="font-medium text-sm">{{ item.description }}</div>
            <div class="flex flex-wrap gap-3 align-items-center text-sm text-color-secondary mt-1">
              <span v-if="item.unit"><strong>U.:</strong> {{ item.unit }}</span>
              <span><strong>Cant.:</strong> {{ Number(item.quantity).toFixed(2) }}</span>
              <span><strong>P. Unit.:</strong> ${{ Number(item.unit_price).toFixed(2) }}</span>
              <span v-if="item.iva_label"><strong>IVA:</strong> {{ item.iva_label }}</span>
            </div>
            <div class="mt-1">
              <span class="font-semibold text-sm">Total: ${{ Number(item.total).toFixed(2) }}</span>
            </div>
          </div>
        </div>
        <div class="mt-2 text-sm font-semibold text-right">Total: ${{ lineItemsTotal.toFixed(2) }}</div>
      </div>

      <div class="mt-3 pt-3 border-1-t flex flex-column md:flex-row align-items-start md:align-items-center justify-content-between gap-2">
        <div class="text-sm text-color-secondary">
          <span v-if="existingInvoice" class="text-primary">
            <i class="pi pi-check-circle"></i>
            Factura #{{ existingInvoice.code }} generada
          </span>
          <span v-else>Sin factura generada</span>
        </div>
        <Button :label="existingInvoice ? 'Ver factura' : 'Generar factura'"
          :icon="existingInvoice ? 'pi pi-external-link' : 'pi pi-plus'"
          size="small" class="w-full md:w-auto" :loading="generating" @click="existingInvoice ? viewInvoice() : generateInvoice()" />
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import api from '@/api/client'

const toast = useToast()

const props = defineProps<{
  workOrderId: number
}>()

const localMode = ref('manual')
const updating = ref(false)
const generating = ref(false)
const existingInvoice = ref<any>(null)
const pricing = ref<any>(null)
const manualItems = ref<any[]>([{ description: '', quantity: 1, unit_price: 0 }])
const lineItems = ref<any[]>([])

const modeOptions = [
  { label: 'Basado en listado', value: 'product_list' },
  { label: 'Líneas manuales', value: 'line_items' },
]

const manualTotal = computed(() =>
  manualItems.value.reduce((s, it) => s + Number(it.quantity || 0) * Number(it.unit_price || 0), 0)
)
const lineItemsTotal = computed(() =>
  lineItems.value.reduce((s, it) => s + Number(it.total || 0), 0)
)
const pricingTotal = computed(() => pricing.value?.total || 0)

function addManualItem() {
  manualItems.value.push({ description: '', quantity: 1, unit_price: 0 })
}
function removeManualItem(idx: number) {
  if (manualItems.value.length <= 1) return
  manualItems.value.splice(idx, 1)
}

async function fetchData() {
  try {
    const [pricingRes, invRes] = await Promise.all([
      api.get(`/work-orders/${props.workOrderId}/pricing`),
      api.get(`/work-orders/${props.workOrderId}/invoices`),
    ])
    pricing.value = pricingRes.data.data
    localMode.value = pricingRes.data.data.billing_mode || 'manual'

    // Build line items from pricing
    lineItems.value = []
    for (const m of pricingRes.data.data.materials || []) {
      lineItems.value.push({
        description: m.product_name,
        quantity: m.quantity,
        unit_price: m.unit_price,
        total: m.line_total,
      })
    }
    for (const mc of pricingRes.data.data.machines || []) {
      lineItems.value.push({
        description: mc.machine_name,
        quantity: mc.quantity,
        unit_price: mc.unit_price,
        total: mc.line_total,
      })
    }

    // Check existing invoice
    const invoices = invRes.data?.data || invRes.data || []
    if (Array.isArray(invoices) && invoices.length > 0) {
      existingInvoice.value = invoices[invoices.length - 1]
    }
  } catch (e: any) {
    // silent
  }
}

async function updateMode() {
  updating.value = true
  try {
    await api.patch(`/work-orders/${props.workOrderId}/pricing`, { billing_mode: localMode.value })
    toast.add({ severity: 'success', summary: 'Modo de facturación actualizado', life: 3000 })
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'Error', life: 5000 })
  } finally {
    updating.value = false
  }
}

async function generateInvoice() {
  generating.value = true
  try {
    let items: any[]
    if (localMode.value === 'manual') {
      items = manualItems.value
        .filter(it => it.description && it.quantity > 0)
        .map(it => ({
          description: it.description,
          quantity: it.quantity,
          unit_price: it.unit_price,
          total: Number(it.quantity) * Number(it.unit_price),
        }))
    } else {
      items = lineItems.value
    }

    const subtotal = items.reduce((s, it) => s + it.total, 0)
    const taxRate = 0 // TODO: usar IVA de la orden
    const ivaAmount = subtotal * taxRate
    const total = subtotal + ivaAmount

    const payload = {
      client_id: 0, // se asigna en backend
      work_order_id: props.workOrderId,
      issue_date: new Date().toISOString().split('T')[0],
      subtotal: subtotal.toFixed(2),
      iva_amount: ivaAmount.toFixed(2),
      total: total.toFixed(2),
      status: 'draft',
      items,
    }

    const res = await api.post('/invoices', payload)
    existingInvoice.value = res.data?.data || res.data
    toast.add({ severity: 'success', summary: 'Factura generada', detail: `Factura #${existingInvoice.value?.code || ''}`, life: 5000 })
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'Error al generar factura', life: 5000 })
  } finally {
    generating.value = false
  }
}

function viewInvoice() {
  // TODO: navigate to invoice detail
  toast.add({ severity: 'info', summary: 'Ir a factura', life: 2000 })
}

watch(() => props.workOrderId, () => fetchData(), { immediate: true })
</script>

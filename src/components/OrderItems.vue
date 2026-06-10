<template>
  <Card class="mb-3">
    <template #title>
      <div class="flex align-items-center justify-content-between flex-wrap gap-2">
        <span>Ítems de orden</span>
        <Button label="Nuevo ítem" icon="pi pi-plus" size="small" severity="info" @click="showNewItemDialog" />
      </div>
    </template>

    <template #content>
      <!-- Items via Accordion -->
      <Accordion :activeIndex="activeIndices" :multiple="true" @tab-open="onAccordionTabOpen" @tab-close="onAccordionTabClose" class="mb-3">
        <AccordionTab v-for="(item, idx) in items" :key="item.id">
          <template #header>
            <!-- Mobile: stacked; Desktop: row -->
            <div class="flex flex-column sm:flex-row sm:align-items-center sm:justify-content-between w-full pr-2 gap-1">
              <div class="flex align-items-center gap-2 text-sm font-medium text-color">
                <i class="pi pi-box" />
                <span v-if="item._editingDesc" class="flex align-items-center gap-1 flex-wrap">
                  <InputText v-model="item.description" size="small" class="w-12rem" @keydown.enter="saveItemHeader(item)" @blur="saveItemHeader(item)" @click.stop />
                  <InputNumber v-model="item.quantity" :min="0" :maxFractionDigits="2" size="small" class="w-6rem" @blur="saveItemHeader(item)" @click.stop placeholder="Cant." />
                  <InputText v-model="item.unit" size="small" class="w-4rem" @blur="saveItemHeader(item)" @click.stop placeholder="Und." />
                </span>
                <span v-else @click.stop="item._editingDesc = true" class="cursor-pointer hover:text-primary">
                  {{ item.description || 'Nuevo ítem' }}
                  <small class="text-color-secondary">(×{{ item.quantity || 1 }} {{ item.unit || 'u' }})</small>
                </span>
              </div>
              <div class="flex align-items-center gap-2 flex-shrink-0">
                <span class="text-xs" :class="diffClass(item.estimated_total, item.actual_total)">
                  <i class="pi pi-calculator text-color-secondary mr-1"></i>
                  Est. <strong>${{ toMoney(item.estimated_total ?? 0) }}</strong>
                </span>
                <span class="text-color-secondary text-xs">|</span>
                <span class="text-xs" :class="diffClass(item.estimated_total, item.actual_total)">
                  <i class="pi pi-check-circle text-primary mr-1"></i>
                  Real <strong>${{ toMoney(item.actual_total ?? 0) }}</strong>
                </span>
                <span v-if="item.actual_total && toFixedNum(item.actual_total,2) !== toFixedNum(item.estimated_total ?? 0,2)" class="text-xs" :class="diffClass(item.estimated_total, item.actual_total)">
                  ({{ diffSign(item.estimated_total, item.actual_total) }}${{ toMoney(diffAbs(item.estimated_total, item.actual_total)) }})
                </span>
                <Button icon="pi pi-trash" severity="danger" text rounded size="small" @click.stop="deleteItem(item)" />
              </div>
            </div>
          </template>

          <!-- ─── MATERIALS ─── -->
          <div class="mb-3">
            <div class="flex align-items-center gap-2 mb-2">
              <AutoComplete
                :suggestions="matSuggestions[item.id] || []"
                @complete="searchMaterials(item, $event)"
                optionLabel="text"
                optionValue="value"
                :placeholder="'Buscar material...'"
                size="small" class="flex-1"
                @item-select="(e: any) => addMaterial(item, e.value.value)"
              />
            </div>

            <!-- Desktop materials DataTable -->
            <div class="desktop-table">
              <DataTable :value="item._materials" scrollable scrollHeight="flex" class="p-datatable-sm" stripedRows size="small" :emptyMessage="'Sin materiales'">
                <Column field="product_name" header="Material/Servicio" sortable style="min-width:140px">
                  <template #body="s">
                    <div class="flex align-items-center gap-2">
                      <span class="font-medium text-sm">{{ s.data.product_name || s.data.product?.name || 'Producto #' + s.data.product_id }}</span>
                      <i v-if="s.data.product?.is_supply" class="pi pi-box text-xs text-color-secondary" />
                    </div>
                  </template>
                </Column>
                <Column header="Ud." style="min-width:45px">
                  <template #body="s">{{ s.data.product?.unit || 'u' }}</template>
                </Column>
                <Column header="Est." style="min-width:60px">
                  <template #body="s">
                    <InputNumber v-model="s.data.estimated_quantity" @blur="saveMaterialInline(item, s.data)"
                      :min="0" :maxFractionDigits="4" size="small" style="width:60px" fluid />
                  </template>
                </Column>
                <Column header="Real" style="min-width:60px">
                  <template #body="s">
                    <InputNumber v-model="s.data.real_quantity" @blur="saveMaterialInline(item, s.data)"
                      :min="0" :maxFractionDigits="4" size="small" style="width:60px" fluid />
                  </template>
                </Column>
                <Column header="Dif" style="min-width:50px">
                  <template #body="s">
                    <span :class="{ 'text-red-500 font-semibold': ((s.data.estimated_quantity||0) - (s.data.real_quantity||0)) !== 0 }">
                      {{ toFixedNum((s.data.estimated_quantity||0) - (s.data.real_quantity||0), 2) }}
                    </span>
                  </template>
                </Column>
                <Column header="Desp." style="min-width:55px">
                  <template #body="s">
                    <InputNumber v-model="s.data.waste_quantity" @blur="saveMaterialInline(item, s.data)"
                      :min="0" :maxFractionDigits="4" size="small" style="width:55px" fluid />
                  </template>
                </Column>
                <Column header="Precio/U." style="min-width:65px">
                  <template #body="s">
                    ${{ toMoney(s.data.real_unit_cost || s.data.estimated_unit_cost || 0) }}
                  </template>
                </Column>
                <Column header="P. Base" style="min-width:55px">
                  <template #body="s">--</template>
                </Column>
                <Column header="Total Est." style="min-width:70px">
                  <template #body="s">
                    ${{ toMoney((s.data.estimated_quantity||0) * (s.data.estimated_unit_cost||0)) }}
                  </template>
                </Column>
                <Column header="Total Real" style="min-width:70px">
                  <template #body="s">
                    ${{ toMoney((s.data.real_quantity||s.data.estimated_quantity||0) * (s.data.real_unit_cost||s.data.estimated_unit_cost||0)) }}
                  </template>
                </Column>
                <Column header="Descripción" style="min-width:120px">
                  <template #body="s">
                    <Textarea v-model="s.data.notes" @blur="saveMaterialInline(item, s.data)"
                      :autoResize="true" rows="1" class="w-full" placeholder="Nota" />
                  </template>
                </Column>
                <Column header="" style="width:50px">
                  <template #body="s">
                    <Button icon="pi pi-trash" text rounded severity="danger" size="small"
                      @click="deleteMaterial(item, s.data)" />
                  </template>
                </Column>
              </DataTable>
            </div>

            <!-- Mobile materials cards -->
            <div class="mobile-cards">
              <div v-for="mat in item._materials" :key="mat.id" class="col-12 mb-2 p-0">
                <div class="p-3 border-1 border-round surface-card cursor-pointer" @click="openMatEdit(item, mat)">
                  <div class="font-medium text-sm mb-2">{{ mat.product_name || mat.product?.name || 'Material' }}</div>
                  <div class="grid grid-nogutter gap-2 text-sm">
                    <div class="col-3 flex flex-column">
                      <small class="text-color-secondary">Est.</small>
                      <span class="font-semibold">{{ mat.estimated_quantity ?? '-' }}</span>
                    </div>
                    <div class="col-3 flex flex-column">
                      <small class="text-color-secondary">Real</small>
                      <span class="font-semibold">{{ mat.real_quantity ?? '-' }}</span>
                    </div>
                    <div class="col-3 flex flex-column">
                      <small class="text-color-secondary">Dif</small>
                      <span :class="['font-semibold', { 'text-red-500': ((mat.estimated_quantity||0)-(mat.real_quantity||0)) !== 0 }]">
                        {{ toFixedNum((mat.estimated_quantity||0) - (mat.real_quantity||0), 1) }}
                      </span>
                    </div>
                    <div class="col-3 flex flex-column">
                      <small class="text-color-secondary">Desp</small>
                      <span class="font-semibold">{{ mat.waste_quantity ?? '-' }}</span>
                    </div>
                    <div class="col-6 flex flex-column">
                      <small class="text-color-secondary">Precio/U.</small>
                      <span>${{ toMoney(mat.real_unit_cost || mat.estimated_unit_cost || 0) }}</span>
                    </div>
                    <div class="col-6 flex flex-column">
                      <small class="text-color-secondary">Total Real</small>
                      <span class="font-semibold">${{ toMoney((mat.real_quantity||mat.estimated_quantity||0) * (mat.real_unit_cost||mat.estimated_unit_cost||0)) }}</span>
                    </div>
                    <div v-if="mat.notes" class="col-12 flex flex-column mt-1">
                      <small class="text-color-secondary">Nota</small>
                      <span class="text-sm">{{ mat.notes }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ─── MACHINES ─── -->
          <div>
            <div class="flex align-items-center gap-2 mb-2">
              <AutoComplete
                :suggestions="machSuggestions[item.id] || []"
                @complete="searchMachines(item, $event)"
                optionLabel="text"
                optionValue="value"
                :placeholder="'Buscar máquina...'"
                size="small" class="flex-1"
                @item-select="(e: any) => addMachine(item, e.value.value)"
              />
            </div>

            <!-- Desktop machines DataTable -->
            <div class="desktop-table">
              <DataTable :value="item._machine_usages" scrollable scrollHeight="flex" class="p-datatable-sm" stripedRows size="small" :emptyMessage="'Sin máquinas'">
                <Column field="machine_name" header="Máquina/Equipo" sortable style="min-width:140px">
                  <template #body="s">
                    <span class="font-medium text-sm">{{ s.data.machine_name || s.data.machine?.name || 'Máquina #' + s.data.machine_id }}</span>
                  </template>
                </Column>
                <Column header="Ud." style="min-width:45px">
                  <template #body="s">h</template>
                </Column>
                <Column header="Est." style="min-width:60px">
                  <template #body="s">
                    <InputNumber v-model="s.data.estimated_units" @blur="saveMachineInline(item, s.data)"
                      :min="0" :maxFractionDigits="4" size="small" style="width:60px" fluid />
                  </template>
                </Column>
                <Column header="Real" style="min-width:60px">
                  <template #body="s">
                    <InputNumber v-model="s.data.actual_units" @blur="saveMachineInline(item, s.data)"
                      :min="0" :maxFractionDigits="4" size="small" style="width:60px" fluid />
                  </template>
                </Column>
                <Column header="Precio/U." style="min-width:65px">
                  <template #body="s">
                    ${{ toMoney(s.data.cost_per_unit || 0) }}
                  </template>
                </Column>
                <Column header="P. Base" style="min-width:55px">
                  <template #body="s">
                    ${{ toMoney(s.data.machine?.base_price || 0) }}
                  </template>
                </Column>
                <Column header="Total Est." style="min-width:70px">
                  <template #body="s">
                    ${{ toMoney((s.data.estimated_units||0) * (s.data.cost_per_unit||0)) }}
                  </template>
                </Column>
                <Column header="Total Real" style="min-width:70px">
                  <template #body="s">
                    ${{ toMoney((s.data.actual_units||s.data.estimated_units||0) * (s.data.cost_per_unit||0)) }}
                  </template>
                </Column>
                <Column header="Descripción" style="min-width:120px">
                  <template #body="s">
                    <Textarea v-model="s.data.description" @blur="saveMachineInline(item, s.data)"
                      :autoResize="true" rows="1" class="w-full" placeholder="Detalle" />
                  </template>
                </Column>
                <Column header="" style="width:50px">
                  <template #body="s">
                    <Button icon="pi pi-trash" text rounded severity="danger" size="small"
                      @click="deleteMachine(item, s.data)" />
                  </template>
                </Column>
              </DataTable>
            </div>

            <!-- Mobile machines cards -->
            <div class="mobile-cards">
              <div v-for="mu in item._machine_usages" :key="mu.id" class="col-12 mb-2 p-0">
                <div class="p-3 border-1 border-round surface-card cursor-pointer" @click="openMachEdit(item, mu)">
                  <div class="font-medium text-sm mb-2">{{ mu.machine_name || mu.machine?.name || 'Máquina' }}</div>
                  <div class="grid grid-nogutter gap-2 text-sm">
                    <div class="col-4 flex flex-column">
                      <small class="text-color-secondary">Est.</small>
                      <span class="font-semibold">{{ mu.estimated_units ?? '-' }}</span>
                    </div>
                    <div class="col-4 flex flex-column">
                      <small class="text-color-secondary">Real</small>
                      <span class="font-semibold">{{ mu.actual_units ?? '-' }}</span>
                    </div>
                    <div class="col-4 flex flex-column">
                      <small class="text-color-secondary">P/U</small>
                      <span>${{ toMoney(mu.cost_per_unit || 0) }}</span>
                    </div>
                    <div class="col-6 flex flex-column">
                      <small class="text-color-secondary">Total Est.</small>
                      <span>${{ toMoney((mu.estimated_units||0) * (mu.cost_per_unit||0)) }}</span>
                    </div>
                    <div class="col-6 flex flex-column">
                      <small class="text-color-secondary">Total Real</small>
                      <span class="font-semibold">${{ toMoney((mu.actual_units||mu.estimated_units||0) * (mu.cost_per_unit||0)) }}</span>
                    </div>
                    <div v-if="mu.description" class="col-12 flex flex-column mt-1">
                      <small class="text-color-secondary">Detalle</small>
                      <span class="text-sm">{{ mu.description }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Material mobile edit dialog trigger state per item -->
          <!-- Machine mobile edit dialog trigger state per item -->
        </AccordionTab>
      </Accordion>

      <!-- Nuevo ítem Dialog -->
      <Dialog v-model:visible="newItemDialog" header="Nuevo ítem" modal :closable="false"
        :breakpoints="{'767px': '95vw'}" style="width:500px">
        <div class="flex flex-column gap-3 p-fluid">
          <div>
            <label class="block text-sm font-medium mb-1">Descripción *</label>
            <InputText v-model="newItemDesc" placeholder="Ej: Letrero luminoso 2x1"
              :class="{'p-invalid': submitted && !newItemDesc.trim()}"
              @keyup.enter="createItem" />
            <small v-if="submitted && !newItemDesc.trim()" class="p-error block mt-1">La descripción es requerida</small>
          </div>
          <div class="grid">
            <div class="col-12 sm:col-6">
              <label class="block text-sm font-medium mb-1">Cantidad</label>
              <InputNumber v-model="newItemQty" :min="0.01" :step="1" :maxFractionDigits="2" />
            </div>
            <div class="col-12 sm:col-6">
              <label class="block text-sm font-medium mb-1">Unidad</label>
              <InputText v-model="newItemUnit" placeholder="u" />
            </div>
          </div>
        </div>
        <template #footer>
          <div class="flex gap-2 justify-content-end">
            <Button label="Cancelar" icon="pi pi-times" text severity="secondary" @click="closeNewItemDialog" />
            <Button label="Crear" icon="pi pi-check" @click="createItem" :loading="savingNewItem" />
          </div>
        </template>
      </Dialog>

      <!-- Material mobile edit Dialog -->
      <Dialog v-model:visible="matEditDialog" header="Editar material" modal :closable="true" style="width:420px">
        <div v-if="editingMaterial" class="flex flex-column gap-3">
          <div class="font-medium">{{ editingMaterial.product_name || editingMaterial.product?.name }}</div>
          <div class="grid">
            <div class="col-6">
              <label class="block text-sm font-medium mb-1">Cant. Est.</label>
              <InputNumber v-model="editingMaterial.estimated_quantity" :min="0" :maxFractionDigits="4" class="w-full" fluid />
            </div>
            <div class="col-6">
              <label class="block text-sm font-medium mb-1">Cant. Real</label>
              <InputNumber v-model="editingMaterial.real_quantity" :min="0" :maxFractionDigits="4" class="w-full" fluid />
            </div>
            <div class="col-6">
              <label class="block text-sm font-medium mb-1">Desperdicio</label>
              <InputNumber v-model="editingMaterial.waste_quantity" :min="0" :maxFractionDigits="4" class="w-full" fluid />
            </div>
            <div class="col-6">
              <label class="block text-sm font-medium mb-1">P/U Estimado</label>
              <InputNumber v-model="editingMaterial.estimated_unit_cost" :min="0" :maxFractionDigits="4" class="w-full" fluid :disabled="true" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Notas</label>
            <Textarea v-model="editingMaterial.notes" rows="2" class="w-full" placeholder="Nota opcional" />
          </div>
        </div>
        <template #footer>
          <Button label="Cancelar" icon="pi pi-times" text severity="secondary" @click="matEditDialog = false" />
          <Button label="Guardar" icon="pi pi-check" :loading="matEditSaving" @click="saveMatEdit" />
        </template>
      </Dialog>

      <!-- Machine mobile edit Dialog -->
      <Dialog v-model:visible="machEditDialog" header="Editar máquina" modal :closable="true" style="width:420px">
        <div v-if="editingMachine" class="flex flex-column gap-3">
          <div class="font-medium">{{ editingMachine.machine_name || editingMachine.machine?.name }}</div>
          <div class="grid">
            <div class="col-6">
              <label class="block text-sm font-medium mb-1">Horas Est.</label>
              <InputNumber v-model="editingMachine.estimated_units" :min="0" :maxFractionDigits="4" class="w-full" fluid />
            </div>
            <div class="col-6">
              <label class="block text-sm font-medium mb-1">Horas Real</label>
              <InputNumber v-model="editingMachine.actual_units" :min="0" :maxFractionDigits="4" class="w-full" fluid />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Detalle</label>
            <Textarea v-model="editingMachine.description" rows="2" class="w-full" placeholder="Descripción opcional" />
          </div>
        </div>
        <template #footer>
          <Button label="Cancelar" icon="pi pi-times" text severity="secondary" @click="machEditDialog = false" />
          <Button label="Guardar" icon="pi pi-check" :loading="machEditSaving" @click="saveMachEdit" />
        </template>
      </Dialog>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import api from '@/api'
import Card from 'primevue/card'
import Accordion from 'primevue/accordion'
import AccordionTab from 'primevue/accordiontab'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import AutoComplete from 'primevue/autocomplete'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Textarea from 'primevue/textarea'
import Dialog from 'primevue/dialog'
import Tag from 'primevue/tag'
const props = defineProps<{ workOrderId: number | string }>()
const emit = defineEmits<{ (e: 'updated'): void }>()

import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
const confirm = useConfirm()
const toast = useToast()

function toMoney(v: any): string {
  return (Number(v) || 0).toFixed(2)
}
function toFixedNum(v: any, d: number = 2): string {
  return (Number(v) || 0).toFixed(d)
}
function diffClass(est: any, act: any): string {
  const e = Number(est) || 0, a = Number(act) || 0
  if (a > e) return 'text-orange-500'
  if (a < e) return 'text-green-600'
  return 'text-color-secondary'
}
function diffSign(est: any, act: any): string {
  return (Number(act) || 0) > (Number(est) || 0) ? '+' : '-'
}
function diffAbs(est: any, act: any): string {
  return toMoney(Math.abs((Number(act) || 0) - (Number(est) || 0)))
}
function recomputeItemTotals(item: any) {
  let est = 0, act = 0
  for (const m of (item._materials || [])) {
    est += (Number(m.estimated_unit_cost) || 0) * (Number(m.estimated_quantity) || 0)
    act += (Number(m.real_unit_cost) || Number(m.estimated_unit_cost) || 0) * (Number(m.real_quantity) || Number(m.estimated_quantity) || 0)
  }
  for (const m of (item._machine_usages || [])) {
    est += (Number(m.cost_per_unit) || 0) * (Number(m.estimated_units) || 0)
    act += (Number(m.cost_per_unit) || 0) * (Number(m.actual_units) || Number(m.estimated_units) || 0)
  }
  item.estimated_total = est
  item.actual_total = act
}

// ── State ──
const items = ref<any[]>([])
const loading = ref(false)
const activeIndices = ref<number[]>([0])
const matSuggestions = ref<Record<number | string, any[]>>({})
const machSuggestions = ref<Record<number | string, any[]>>({})

// New item dialog
const newItemDialog = ref(false)
const newItemDesc = ref('')
const newItemQty = ref(1)
const newItemUnit = ref('u')
const savingNewItem = ref(false)
const submitted = ref(false)

// Material mobile edit dialog
const matEditDialog = ref(false)
const matEditSaving = ref(false)
const editingMaterial = ref<any>(null)
let matEditParentItem: any = null

// Machine mobile edit dialog
const machEditDialog = ref(false)
const machEditSaving = ref(false)
const editingMachine = ref<any>(null)
let machEditParentItem: any = null

// ── Detect mobile ──
const isMobile = ref(window.innerWidth < 768)
if (typeof window !== 'undefined') {
  window.addEventListener('resize', () => {
    isMobile.value = window.innerWidth < 768
  })
}

// ── Load items ──
async function loadItems() {
  loading.value = true
  try {
    const res = await api.get(`/work-orders/${props.workOrderId}/items`)
    const data = res.data?.data || res.data || []
    items.value = data.map((item: any) => enrichItem(item))
  } catch (e: any) {
    console.error('Error loading items:', e)
  } finally {
    loading.value = false
  }
}

function enrichItem(item: any) {
  item._editingDesc = false
  item._materials = (item.materials || []).map((m: any) => ({ ...m }))
  item._machine_usages = (item.machine_usages || []).map((m: any) => ({ ...m }))

  // Sort by sort_order
  return item
}

watch(() => props.workOrderId, () => { loadItems() }, { immediate: true })

// ── Accordion events ──
function onAccordionTabOpen(e: any) {
  // e.index
}
function onAccordionTabClose(e: any) {
  // e.index
}

// ── Item CRUD ──
function showNewItemDialog() {
  newItemDesc.value = ''
  newItemQty.value = 1
  newItemUnit.value = 'u'
  submitted.value = false
  newItemDialog.value = true
}

function closeNewItemDialog() {
  newItemDialog.value = false
}

async function createItem() {
  submitted.value = true
  if (!newItemDesc.value.trim()) {
    toast.add({ severity: 'warn', summary: 'Validación', detail: 'Escribe una descripción para el ítem', life: 3000 })
    return
  }
  savingNewItem.value = true
  try {
    const res = await api.post(`/work-orders/${props.workOrderId}/items`, {
      description: newItemDesc.value.trim(),
      quantity: newItemQty.value || 1,
      unit: newItemUnit.value || 'u',
    })
    items.value.push(enrichItem(res.data?.data || res.data))
    const lastIdx = items.value.length - 1
    if (!activeIndices.value.includes(lastIdx)) {
      activeIndices.value = [...activeIndices.value, lastIdx]
    }
    newItemDialog.value = false
    toast.add({ severity: 'success', summary: 'Ítem creado', detail: newItemDesc.value.trim(), life: 3000 })
    emit('updated')
  } catch (e: any) {
    const msg = e.response?.data?.message || e.message || 'Error al crear ítem'
    toast.add({ severity: 'error', summary: 'Error', detail: msg, life: 5000 })
  } finally {
    savingNewItem.value = false
  }
}

async function saveItemHeader(item: any) {
  item._editingDesc = false
  try {
    await api.put(`/work-orders/${props.workOrderId}/items/${item.id}`, {
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
    })
    toast.add({ severity: 'success', summary: 'Guardado', detail: 'Cabecera del ítem actualizada', life: 2000 })
    recomputeItemTotals(item)
    emit('updated')
  } catch (e: any) {
    const msg = e.response?.data?.message || e.message || 'Error al guardar'
    toast.add({ severity: 'error', summary: 'Error', detail: msg, life: 5000 })
  }
}

function deleteItem(item: any) {
  confirm.require({
    message: `Eliminar "${item.description || 'este ítem'}" y todos sus materiales/máquinas?`,
    header: 'Eliminar ítem',
    acceptLabel: 'Eliminar',
    rejectLabel: 'Cancelar',
    accept: async () => {
      try {
        await api.delete(`/work-orders/${props.workOrderId}/items/${item.id}`)
        const idx = items.value.indexOf(item)
        if (idx !== -1) items.value.splice(idx, 1)
        activeIndices.value = activeIndices.value.filter((i: number) => i !== idx)
        emit('updated')
      } catch (e: any) {
        console.error('Error deleting item:', e)
      }
    },
  })
}

// ── Helper: extrae el arreglo de una respuesta paginada de Laravel ──
// Dos formatos posibles:
//   A) {success:true, data: paginator}  → ProductController
//   B) paginator (res.data)              → MachineController
function extractPaginatedArray(axiosResponse: any): any[] {
  const body = axiosResponse?.data
  if (!body) return []
  // Formato A: {success, data: {current_page, data: [...]}}
  if (body.success !== undefined && body.data?.data) {
    return Array.isArray(body.data.data) ? body.data.data : []
  }
  // Formato B: paginator directo {current_page, data: [...]}
  if (Array.isArray(body.data)) {
    return body.data
  }
  return []
}

// ── Material helpers ──
let lastMatSearch = ''
async function searchMaterials(item: any, event: any) {
  const q = (event.query || '').trim()
  if (!q || q.length < 1) { matSuggestions.value[item.id] = []; return }
  lastMatSearch = q
  try {
    const res = await api.get('/products', { params: { search: q, limit: 15 } })
    const products = extractPaginatedArray(res)
    matSuggestions.value[item.id] = products
      .filter((p: any) => {
        const existing = (item._materials || []).find((m: any) => m.product_id === p.id)
        return !existing
      })
      .map((p: any) => ({
        text: `${p.name} (${p.code || 'sin código'})`,
        value: p.id,
        product: p,
      }))
  } catch { matSuggestions.value[item.id] = [] }
}

async function addMaterial(item: any, productId: number) {
  const product = matSuggestions.value[item.id]?.find((s: any) => s.value === productId)?.product
  if (!product) return
  try {
    const res = await api.post(`/work-orders/${props.workOrderId}/materials`, {
      product_id: productId,
      work_order_item_id: item.id,
      estimated_quantity: product.estimated_quantity || 1,
    })
    const newMat = { ...res.data?.data || res.data, product_name: product.name, product }
    item._materials.push(newMat)
    recomputeItemTotals(item)
    // Refresh suggestion list after add
    matSuggestions.value[item.id] = (matSuggestions.value[item.id] || []).filter((s: any) => s.value !== productId)
    emit('updated')
    toast.add({ severity: 'success', summary: 'Material agregado', detail: product.name, life: 2000 })
  } catch (e: any) {
    const msg = e.response?.data?.message || e.message || 'Error al agregar material'
    toast.add({ severity: 'error', summary: 'Error', detail: msg, life: 5000 })
  } finally {
  }
}

async function saveMaterialInline(item: any, mat: any) {
  try {
    await api.put(`/work-orders/${props.workOrderId}/materials/${mat.id}`, {
      estimated_quantity: mat.estimated_quantity,
      real_quantity: mat.real_quantity,
      waste_quantity: mat.waste_quantity,
      notes: mat.notes,
    })
    recomputeItemTotals(item)
    emit('updated')
    toast.add({ severity: 'success', summary: 'Material actualizado', life: 2000 })
  } catch (e: any) {
    const msg = e.response?.data?.message || e.message || 'Error al guardar material'
    toast.add({ severity: 'error', summary: 'Error', detail: msg, life: 5000 })
  }
}

function deleteMaterial(item: any, mat: any) {
  confirm.require({
    message: `Eliminar "${mat.product_name || mat.product?.name || 'material'}" de la lista?`,
    header: 'Eliminar material',
    acceptLabel: 'Eliminar',
    rejectLabel: 'Cancelar',
    accept: async () => {
      try {
        await api.delete(`/work-orders/${props.workOrderId}/materials/${mat.id}`)
        const idx = item._materials.indexOf(mat)
        if (idx !== -1) item._materials.splice(idx, 1)
        recomputeItemTotals(item)
        toast.add({ severity: 'success', summary: 'Material eliminado', life: 2000 })
        emit('updated')
      } catch (e: any) {
        const msg = e.response?.data?.message || e.message || 'Error al eliminar material'
        toast.add({ severity: 'error', summary: 'Error', detail: msg, life: 5000 })
      }
    },
  })
}

// Mobile material edit dialog
function openMatEdit(item: any, mat: any) {
  matEditParentItem = item
  editingMaterial.value = { ...mat }
  matEditDialog.value = true
}

async function saveMatEdit() {
  if (!editingMaterial.value || !matEditParentItem) return
  matEditSaving.value = true
  try {
    const mat = editingMaterial.value
    await api.put(`/work-orders/${props.workOrderId}/materials/${mat.id}`, {
      estimated_quantity: mat.estimated_quantity,
      real_quantity: mat.real_quantity,
      waste_quantity: mat.waste_quantity,
      notes: mat.notes,
    })
    // Sync back to parent item's material array
    const targetMat = matEditParentItem._materials.find((m: any) => m.id === mat.id)
    if (targetMat) {
      Object.assign(targetMat, mat)
    }
    recomputeItemTotals(matEditParentItem)
    matEditDialog.value = false
    toast.add({ severity: 'success', summary: 'Material actualizado', life: 2000 })
    emit('updated')
  } catch (e: any) {
    const msg = e.response?.data?.message || e.message || 'Error al guardar material'
    toast.add({ severity: 'error', summary: 'Error', detail: msg, life: 5000 })
  } finally {
    matEditSaving.value = false
  }
}

// ── Machine helpers ──
async function searchMachines(item: any, event: any) {
  const q = (event.query || '').trim()
  if (!q || q.length < 1) { machSuggestions.value[item.id] = []; return }
  try {
    const res = await api.get('/machines', { params: { search: q, limit: 15 } })
    const machines = extractPaginatedArray(res)
    machSuggestions.value[item.id] = machines
      .filter((m: any) => {
        const existing = (item._machine_usages || []).find((mu: any) => mu.machine_id === m.id)
        return !existing
      })
      .map((m: any) => ({
        text: `${m.name} (${m.code || 'sin código'})`,
        value: m.id,
        machine: m,
      }))
  } catch { machSuggestions.value[item.id] = [] }
}

async function addMachine(item: any, machineId: number) {
  const machineObj = machSuggestions.value[item.id]?.find((s: any) => s.value === machineId)?.machine
  if (!machineObj) return
  try {
    const res = await api.post(`/work-orders/${props.workOrderId}/machine-usages`, {
      machine_id: machineId,
      work_order_item_id: item.id,
      estimated_units: 1,
      actual_units: 0,
    })
    const newMu = { ...res.data?.data || res.data, machine_name: machineObj.name, machine: machineObj }
    item._machine_usages.push(newMu)
    recomputeItemTotals(item)
    machSuggestions.value[item.id] = (machSuggestions.value[item.id] || []).filter((s: any) => s.value !== machineId)
    emit('updated')
    toast.add({ severity: 'success', summary: 'Máquina agregada', detail: machineObj.name, life: 2000 })
  } catch (e: any) {
    const msg = e.response?.data?.message || e.message || 'Error al agregar máquina'
    toast.add({ severity: 'error', summary: 'Error', detail: msg, life: 5000 })
  } finally {
  }
}

async function saveMachineInline(item: any, mu: any) {
  try {
    await api.put(`/work-orders/${props.workOrderId}/machine-usages/${mu.id}`, {
      estimated_units: mu.estimated_units,
      actual_units: mu.actual_units,
      description: mu.description,
    })
    recomputeItemTotals(item)
    emit('updated')
    toast.add({ severity: 'success', summary: 'Máquina actualizada', life: 2000 })
  } catch (e: any) {
    const msg = e.response?.data?.message || e.message || 'Error al guardar máquina'
    toast.add({ severity: 'error', summary: 'Error', detail: msg, life: 5000 })
  }
}

function deleteMachine(item: any, mu: any) {
  confirm.require({
    message: `Eliminar "${mu.machine_name || mu.machine?.name || 'máquina'}" de la lista?`,
    header: 'Eliminar máquina',
    acceptLabel: 'Eliminar',
    rejectLabel: 'Cancelar',
    accept: async () => {
      try {
        await api.delete(`/work-orders/${props.workOrderId}/machine-usages/${mu.id}`)
        const idx = item._machine_usages.indexOf(mu)
        if (idx !== -1) item._machine_usages.splice(idx, 1)
        recomputeItemTotals(item)
        toast.add({ severity: 'success', summary: 'Máquina eliminada', life: 2000 })
        emit('updated')
      } catch (e: any) {
        const msg = e.response?.data?.message || e.message || 'Error al eliminar máquina'
        toast.add({ severity: 'error', summary: 'Error', detail: msg, life: 5000 })
      }
    },
  })
}

// Machine mobile edit dialog
function openMachEdit(item: any, mu: any) {
  machEditParentItem = item
  editingMachine.value = { ...mu }
  machEditDialog.value = true
}

async function saveMachEdit() {
  if (!editingMachine.value || !machEditParentItem) return
  machEditSaving.value = true
  try {
    const mu = editingMachine.value
    await api.put(`/work-orders/${props.workOrderId}/machine-usages/${mu.id}`, {
      estimated_units: mu.estimated_units,
      actual_units: mu.actual_units,
      description: mu.description,
    })
    const targetMu = machEditParentItem._machine_usages.find((m: any) => m.id === mu.id)
    if (targetMu) Object.assign(targetMu, mu)
    recomputeItemTotals(machEditParentItem)
    machEditDialog.value = false
    toast.add({ severity: 'success', summary: 'Máquina actualizada', life: 2000 })
    emit('updated')
  } catch (e: any) {
    const msg = e.response?.data?.message || e.message || 'Error al guardar máquina'
    toast.add({ severity: 'error', summary: 'Error', detail: msg, life: 5000 })
  } finally {
    machEditSaving.value = false
  }
}
</script>

<style scoped>
/* Hide desktop tables on mobile, show mobile cards */
.mobile-cards { display: none; }
@media (max-width: 767px) {
  .desktop-table { display: none; }
  .mobile-cards { display: block; }
}
.mobile-cards .cursor-pointer:hover {
  border-color: var(--p-primary-color) !important;
}
@media (hover: none) {
  .mobile-cards .cursor-pointer:active {
    border-color: var(--p-primary-color) !important;
  }
}
</style>

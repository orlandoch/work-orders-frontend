<template>
  <Card class="mb-3">
    <template #title>
      <div class="flex align-items-center justify-content-between flex-wrap gap-2">
        <div class="flex align-items-center gap-2">
          <i class="pi pi-list-check text-color-secondary" />
          <span>Ítems de la orden</span>
        </div>
        <Button
          label="Agregar ítem"
          icon="pi pi-plus"
          size="small"
          severity="secondary"
          @click="showAddItemDialog = true"
        />
      </div>
    </template>

    <template #content>
      <div v-if="loading" class="flex justify-content-center p-4">
        <ProgressSpinner style="width:40px;height:40px" />
      </div>

      <template v-else>
        <!-- Empty state -->
        <div v-if="items.length === 0" class="text-center p-4 text-color-secondary">
          <i class="pi pi-inbox text-4xl block mb-2" />
          <span>Sin ítems. Agregue productos/servicios de la orden.</span>
        </div>

        <!-- ── Item cards ── -->
        <div v-for="(item, index) in items" :key="item.id" class="mb-3 border-1 border-round surface-card overflow-hidden">
          <!-- Item header row -->
          <div class="flex align-items-center gap-2 p-3 surface-ground border-bottom-1">
            <i class="pi pi-tag text-primary" />
            <div class="flex-1 grid formgrid p-fluid align-items-end gap-2">
              <div class="col-12 md:col-5">
                <label class="text-xs text-color-secondary block mb-1">Descripción</label>
                <InputText
                  v-model="item._editDescription"
                  class="w-full text-sm"
                  placeholder="Ej: Letreros 40×60cm"
                  @blur="updateItem(item)"
                />
              </div>
              <div class="col-6 md:col-2">
                <label class="text-xs text-color-secondary block mb-1">Cantidad</label>
                <InputNumber
                  v-model="item._editQuantity"
                  :min="0.01"
                  :maxFractionDigits="2"
                  class="w-full"
                  inputClass="text-sm text-right"
                  @blur="updateItem(item)"
                />
              </div>
              <div class="col-6 md:col-2">
                <label class="text-xs text-color-secondary block mb-1">Unidad</label>
                <InputText
                  v-model="item._editUnit"
                  class="w-full text-sm"
                  placeholder="unidad"
                  @blur="updateItem(item)"
                />
              </div>
              <div class="col-12 md:col-3 text-right">
                <div class="text-xs text-color-secondary mb-1">Subtotal</div>
                <span class="font-semibold text-primary">${{ formatMoney(item.estimated_total || 0) }}</span>
              </div>
            </div>
            <Button
              icon="pi pi-trash"
              size="small"
              text
              severity="danger"
              @click="removeItem(item)"
              :loading="deletingId === item.id"
              v-tooltip.left="'Eliminar ítem'"
            />
          </div>

          <!-- ── Per-item material & machine management ── -->
          <div class="p-3">
            <!-- Materials section -->
            <div class="mb-2">
              <div class="flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
                <span class="text-xs text-color-secondary font-medium uppercase tracking-wider">
                  Materiales ({{ (item.materials || []).length }})
                </span>
                <AutoComplete
                  v-model="item._matQuery"
                  :suggestions="item._matResults || []"
                  @complete="(e: any) => searchProducts(e, item)"
                  @option-select="(e: any) => addProductToItem(e, item)"
                  optionLabel="label"
                  placeholder="Buscar material..."
                  :disabled="item._addingMat"
                  :forceSelection="false"
                  size="small"
                  class="w-20rem"
                  inputClass="text-sm"
                />
              </div>

              <DataTable
                v-if="(item.materials || []).length > 0"
                :value="item.materials"
                size="small"
                stripedRows
                class="p-datatable-sm mb-2"
                scrollable
                scrollHeight="flex"
              >
                <Column field="product.name" header="Producto" style="min-width:130px" />
                <Column header="Est." style="width:70px" class="text-right">
                  <template #body="s">
                    <InputNumber
                      v-model="s.data._editEstQty"
                      :min="0"
                      :step="0.01"
                      :maxFractionDigits="4"
                      size="small" style="width:60px" inputClass="text-sm text-right"
                      @blur="saveMaterial(item, s.data)"
                    />
                  </template>
                </Column>
                <Column header="Real" style="width:70px" class="text-right">
                  <template #body="s">
                    <InputNumber
                      v-model="s.data._editRealQty"
                      :min="0"
                      :step="0.01"
                      :maxFractionDigits="4"
                      size="small" style="width:60px" inputClass="text-sm text-right"
                      @blur="saveMaterial(item, s.data)"
                    />
                  </template>
                </Column>
                <Column header="Costo U." style="width:90px" class="text-right">
                  <template #body="s">${{ formatMoney(s.data.estimated_unit_cost || s.data.real_unit_cost || 0) }}</template>
                </Column>
                <Column header="Total" style="width:80px" class="text-right">
                  <template #body="s">
                    ${{ formatMoney((s.data._editEstQty || 0) * (s.data.estimated_unit_cost || 0)) }}
                  </template>
                </Column>
                <Column header="" style="width:40px">
                  <template #body="s">
                    <Button
                      icon="pi pi-trash"
                      text
                      rounded
                      size="small"
                      severity="danger"
                      @click="deleteMaterial(item, s.data)"
                      v-tooltip.left="'Quitar material'"
                    />
                  </template>
                </Column>
              </DataTable>
              <div v-else class="text-xs text-color-secondary py-1">Sin materiales asignados</div>
            </div>

            <!-- Machines section -->
            <div>
              <div class="flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
                <span class="text-xs text-color-secondary font-medium uppercase tracking-wider">
                  Máquinas ({{ (item.machine_usages || []).length }})
                </span>
                <AutoComplete
                  v-model="item._machQuery"
                  :suggestions="item._machResults || []"
                  @complete="(e: any) => searchMachines(e, item)"
                  @option-select="(e: any) => addMachineToItem(e, item)"
                  optionLabel="label"
                  placeholder="Buscar máquina..."
                  :disabled="item._addingMach"
                  :forceSelection="false"
                  size="small"
                  class="w-20rem"
                  inputClass="text-sm"
                />
              </div>

              <DataTable
                v-if="(item.machine_usages || []).length > 0"
                :value="item.machine_usages"
                size="small"
                stripedRows
                class="p-datatable-sm"
                scrollable
                scrollHeight="flex"
              >
                <Column field="machine.name" header="Máquina" style="min-width:130px" />
                <Column header="Est. (h)" style="width:70px" class="text-right">
                  <template #body="s">
                    <InputNumber
                      v-model="s.data._editEstUnits"
                      :min="0"
                      :step="0.5"
                      :minFractionDigits="1"
                      :maxFractionDigits="2"
                      size="small" style="width:60px" inputClass="text-sm text-right"
                      @blur="saveMachine(item, s.data)"
                    />
                  </template>
                </Column>
                <Column header="Real (h)" style="width:70px" class="text-right">
                  <template #body="s">
                    <InputNumber
                      v-model="s.data._editActualUnits"
                      :min="0"
                      :step="0.5"
                      :minFractionDigits="1"
                      :maxFractionDigits="2"
                      size="small" style="width:60px" inputClass="text-sm text-right"
                      @blur="saveMachine(item, s.data)"
                    />
                  </template>
                </Column>
                <Column header="$/h" style="width:80px" class="text-right">
                  <template #body="s">${{ formatMoney(s.data.cost_per_unit || 0) }}</template>
                </Column>
                <Column header="Total" style="width:80px" class="text-right">
                  <template #body="s">
                    ${{ formatMoney((s.data._editEstUnits || 0) * (s.data.cost_per_unit || 0)) }}
                  </template>
                </Column>
                <Column header="" style="width:40px">
                  <template #body="s">
                    <Button
                      icon="pi pi-trash"
                      text
                      rounded
                      size="small"
                      severity="danger"
                      @click="deleteMachine(item, s.data)"
                      v-tooltip.left="'Quitar máquina'"
                    />
                  </template>
                </Column>
              </DataTable>
              <div v-else class="text-xs text-color-secondary py-1">Sin máquinas asignadas</div>
            </div>
          </div>
        </div>
      </template>
    </template>
  </Card>

  <!-- Dialog: Add new item -->
  <Dialog
    v-model:visible="showAddItemDialog"
    header="Nuevo ítem de orden"
    modal
    :style="{ width: '450px' }"
    :closable="true"
  >
    <div class="flex flex-column gap-3">
      <div class="field">
        <label class="block text-sm font-medium mb-1">Descripción</label>
        <InputText v-model="newItemForm.description" class="w-full" placeholder="Ej: Letreros 40×60cm" />
      </div>
      <div class="grid formgrid p-fluid">
        <div class="col-6">
          <label class="block text-sm font-medium mb-1">Cantidad</label>
          <InputNumber
            v-model="newItemForm.quantity"
            :min="1"
            :maxFractionDigits="2"
            class="w-full"
          />
        </div>
        <div class="col-6">
          <label class="block text-sm font-medium mb-1">Unidad</label>
          <InputText v-model="newItemForm.unit" placeholder="unidad" class="w-full" />
        </div>
      </div>
    </div>
    <template #footer>
      <Button label="Cancelar" severity="secondary" text @click="showAddItemDialog = false" />
      <Button label="Guardar" icon="pi pi-check" @click="createItem" :loading="saving" />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { useToast } from 'primevue/usetoast'
import api from '@/api/client'
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import AutoComplete from 'primevue/autocomplete'
import Dialog from 'primevue/dialog'
import ProgressSpinner from 'primevue/progressspinner'

const props = defineProps<{
  workOrderId: number
}>()

const emit = defineEmits<{
  saved: []
}>()

const toast = useToast()
const loading = ref(false)
const items = ref<any[]>([])
const showAddItemDialog = ref(false)
const saving = ref(false)
const deletingId = ref<number | null>(null)

const newItemForm = ref({
  description: '',
  quantity: 1,
  unit: 'unidad',
})

// ── Load items ──
async function loadItems() {
  loading.value = true
  try {
    const res = await api.get(`/work-orders/${props.workOrderId}/items`)
    const data = res.data.data ?? res.data ?? []
    items.value = data.map(enrichItem)
  } catch (e: any) {
    console.error('Failed to load items:', e)
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los ítems', life: 5000 })
  } finally {
    loading.value = false
  }
}

// ── Enrich item with UI state ──
function enrichItem(it: any): any {
  return {
    ...it,
    _editDescription: it.description,
    _editQuantity: Number(it.quantity || 1),
    _editUnit: it.unit || 'unidad',
    _matQuery: '',
    _matResults: [],
    _addingMat: false,
    _machQuery: '',
    _machResults: [],
    _addingMach: false,
    // Enrich materials
    materials: (it.materials || []).map((m: any) => ({
      ...m,
      _editEstQty: Number(m.estimated_quantity || 0),
      _editRealQty: m.real_quantity != null ? Number(m.real_quantity) : null,
    })),
    // Enrich machines
    machine_usages: (it.machine_usages || []).map((mu: any) => ({
      ...mu,
      _editEstUnits: Number(mu.estimated_units || 0),
      _editActualUnits: mu.actual_units != null ? Number(mu.actual_units) : null,
    })),
  }
}

// ── Create item ──
async function createItem() {
  if (!newItemForm.value.description.trim()) return
  saving.value = true
  try {
    const res = await api.post(`/work-orders/${props.workOrderId}/items`, {
      description: newItemForm.value.description.trim(),
      quantity: newItemForm.value.quantity || 1,
      unit: newItemForm.value.unit || 'unidad',
    })
    const created = res.data.data ?? res.data
    items.value.push(enrichItem({ ...created, materials: [], machine_usages: [] }))
    newItemForm.value = { description: '', quantity: 1, unit: 'unidad' }
    showAddItemDialog.value = false
    toast.add({ severity: 'success', summary: 'Ítem creado', life: 3000 })
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el ítem', life: 5000 })
  } finally {
    saving.value = false
  }
}

// ── Update item ──
const updateDebounce = new Map<number, ReturnType<typeof setTimeout>>()
async function updateItem(item: any) {
  // Debounce to avoid many requests during typing
  const key = item.id
  if (updateDebounce.has(key)) clearTimeout(updateDebounce.get(key)!)
  updateDebounce.set(key, setTimeout(async () => {
    updateDebounce.delete(key)
    try {
      await api.put(`/work-orders/${props.workOrderId}/items/${item.id}`, {
        description: item._editDescription,
        quantity: item._editQuantity || 1,
        unit: item._editUnit || 'unidad',
      })
      item.description = item._editDescription
      item.quantity = item._editQuantity
      item.unit = item._editUnit
    } catch (e: any) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el ítem', life: 5000 })
    }
  }, 600))
}

// ── Delete item ──
async function removeItem(item: any) {
  if (!confirm(`¿Eliminar "${item.description}" y todos sus materiales/máquinas?`)) return
  deletingId.value = item.id
  try {
    await api.delete(`/work-orders/${props.workOrderId}/items/${item.id}`)
    items.value = items.value.filter((i: any) => i.id !== item.id)
    toast.add({ severity: 'success', summary: 'Ítem eliminado', life: 3000 })
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el ítem', life: 5000 })
  } finally {
    deletingId.value = null
  }
}

// ── Search products for a specific item ──
async function searchProducts(e: { query: string }, item: any) {
  try {
    const res = await api.get(`/products?search=${encodeURIComponent(e.query)}&limit=10`)
    const raw = res.data.data || res.data || []
    const list = Array.isArray(raw) ? raw : (raw.data || [])
    item._matResults = list.map((p: any) => ({
      label: `${p.code || p.name} - ${p.name}`,
      id: p.id,
      name: p.name,
      unit: p.unit || 'u',
    }))
  } catch { /* ignore */ }
}

// ── Add product to an item ──
async function addProductToItem(e: any, item: any) {
  const product = item._matResults?.find((x: any) => x.id === (e?.value?.id || e?.id || e?.value))
  if (!product) return

  // Check duplicate
  if ((item.materials || []).some((m: any) => m.product_id === product.id && !m.deleted_at)) {
    toast.add({ severity: 'warn', summary: 'Duplicado', detail: 'El material ya está en este ítem', life: 4000 })
    item._matQuery = ''
    item._matResults = []
    return
  }

  item._addingMat = true
  try {
    const res = await api.post(`/work-orders/${props.workOrderId}/materials`, {
      product_id: product.id,
      estimated_quantity: 1,
      work_order_item_id: item.id,
    })
    const created = res.data.data ?? res.data
    item.materials.push({
      ...created,
      _editEstQty: Number(created.estimated_quantity || 0),
      _editRealQty: created.real_quantity != null ? Number(created.real_quantity) : null,
    })
    item._matQuery = ''
    item._matResults = []
    toast.add({ severity: 'success', summary: 'Material agregado', life: 3000 })
  } catch (err: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: err.response?.data?.message || 'Error al agregar material', life: 5000 })
  } finally {
    item._addingMat = false
  }
}

// ── Save material inline ──
async function saveMaterial(item: any, mat: any) {
  try {
    await api.put(`/work-orders/${props.workOrderId}/materials/${mat.id}`, {
      estimated_quantity: mat._editEstQty ?? 0,
      real_quantity: mat._editRealQty,
    })
    mat.estimated_quantity = mat._editEstQty
    mat.real_quantity = mat._editRealQty
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'Error al guardar material', life: 5000 })
  }
}

// ── Delete material ──
async function deleteMaterial(item: any, mat: any) {
  try {
    await api.delete(`/work-orders/${props.workOrderId}/materials/${mat.id}`)
    item.materials = item.materials.filter((m: any) => m.id !== mat.id)
    toast.add({ severity: 'success', summary: 'Material quitado', life: 3000 })
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo quitar el material', life: 5000 })
  }
}

// ── Search machines for a specific item ──
async function searchMachines(e: { query: string }, item: any) {
  try {
    const res = await api.get(`/machines?search=${encodeURIComponent(e.query)}&limit=10&work_order=1`)
    const raw = res.data.data || res.data || []
    const list = Array.isArray(raw) ? raw : (raw.data || [])
    item._machResults = list.map((m: any) => ({
      label: `${m.code || m.name} - ${m.name}`,
      id: m.id,
      name: m.name,
    }))
  } catch { /* ignore */ }
}

// ── Add machine to an item ──
async function addMachineToItem(e: any, item: any) {
  const machine = item._machResults?.find((x: any) => x.id === (e?.value?.id || e?.id || e?.value))
  if (!machine) return

  if ((item.machine_usages || []).some((mu: any) => mu.machine_id === machine.id)) {
    toast.add({ severity: 'warn', summary: 'Duplicado', detail: 'La máquina ya está en este ítem', life: 4000 })
    item._machQuery = ''
    item._machResults = []
    return
  }

  item._addingMach = true
  try {
    const res = await api.post(`/work-orders/${props.workOrderId}/machine-usages`, {
      machine_id: machine.id,
      estimated_units: 1,
      actual_units: 0,
      work_order_item_id: item.id,
    })
    const created = res.data.data ?? res.data
    item.machine_usages.push({
      ...created,
      _editEstUnits: Number(created.estimated_units || 0),
      _editActualUnits: created.actual_units != null ? Number(created.actual_units) : null,
    })
    item._machQuery = ''
    item._machResults = []
    toast.add({ severity: 'success', summary: 'Máquina agregada', life: 3000 })
  } catch (err: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: err.response?.data?.message || 'Error al agregar máquina', life: 5000 })
  } finally {
    item._addingMach = false
  }
}

// ── Save machine inline ──
async function saveMachine(item: any, mu: any) {
  try {
    await api.put(`/work-orders/${props.workOrderId}/machine-usages/${mu.id}`, {
      estimated_units: mu._editEstUnits ?? 0,
      actual_units: mu._editActualUnits ?? 0,
    })
    mu.estimated_units = mu._editEstUnits
    mu.actual_units = mu._editActualUnits
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'Error al guardar máquina', life: 5000 })
  }
}

// ── Delete machine ──
async function deleteMachine(item: any, mu: any) {
  try {
    await api.delete(`/work-orders/${props.workOrderId}/machine-usages/${mu.id}`)
    item.machine_usages = item.machine_usages.filter((m: any) => m.id !== mu.id)
    toast.add({ severity: 'success', summary: 'Máquina quitada', life: 3000 })
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo quitar la máquina', life: 5000 })
  }
}

// ── Format helpers ──
function formatMoney(v: number | string): string {
  const n = typeof v === 'string' ? parseFloat(v) : (v ?? 0)
  return n.toFixed(2)
}

onMounted(loadItems)
watch(() => props.workOrderId, loadItems)
</script>

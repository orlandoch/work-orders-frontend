<template>
  <Card :class="{ 'shadow-none border-0': compact }">
    <template #title>
      <span v-if="!compact">Materiales y Servicios</span>
    </template>
    <template #content>
      <!-- Product search row -->
      <div class="grid formgrid p-fluid mb-3">
        <div class="field col-12">
          <AutoComplete
            v-model="searchQuery"
            :suggestions="productResults"
            @complete="searchProducts"
            @option-select="addProduct"
            optionLabel="label"
            placeholder="Buscar producto para agregar..."
            :disabled="adding"
            :forceSelection="false"
          />
        </div>
      </div>

      <!-- Materials table -->
      <DataTable scrollable scrollHeight="flex" :value="materials" size="small" stripedRows class="text-xs w-full">
        <Column header="Producto" style="min-width:160px">
          <template #body="s">
            <div :class="{ 'line-through opacity-60': s.data.deleted_at }">
              <span class="font-medium">{{ s.data.product?.name || 'Producto #'+s.data.product_id }}</span>
            </div>
          </template>
        </Column>
        <Column header="Ud." style="width:40px">
          <template #body="s">
            <span :class="{ 'line-through opacity-60': s.data.deleted_at }">{{ s.data.product?.unit || '-' }}</span>
          </template>
        </Column>
        <Column header="Estimado" style="min-width:80px">
          <template #body="s">
            <template v-if="s.data.deleted_at">{{ Number(s.data.estimated_quantity) }}</template>
            <div v-else class="inline-flex align-items-center gap-1">
              <InputNumber
                v-if="editingRow === s.data.id && editingField === 'estimated_quantity'"
                v-model="s.data.estimated_quantity"
                :min="0" :step="0.01" :minFractionDigits="2" :maxFractionDigits="4" size="small" class="w-full"
                @keydown.enter="saveInline(s.data)"
                @keydown.escape="cancelInline()"
                autofocus
              />
              <span v-else
                :class="editableClass('estimated_quantity')"
                @dblclick="startInline(s.data, 'estimated_quantity')"
              >{{ Number(s.data.estimated_quantity) }}</span>
            </div>
          </template>
        </Column>
        <Column header="Real" style="min-width:120px">
          <template #body="s">
            <template v-if="s.data.deleted_at"><span class="line-through opacity-60">{{ s.data.real_quantity ?? '-' }}</span></template>
            <div v-else class="inline-flex align-items-center gap-1">
              <InputNumber
                v-if="editingRow === s.data.id && editingField === 'real_quantity'"
                v-model="s.data.real_quantity"
                :min="0" :step="0.01" :minFractionDigits="2" :maxFractionDigits="4" size="small" class="w-full"
                @keydown.enter="saveInline(s.data)"
                @keydown.escape="cancelInline()"
              />
              <template v-else>
                <span
                  :class="realIndicatorClass(s.data).cls"
                  @dblclick="startInline(s.data, 'real_quantity')"
                  class="cursor-pointer hover:underline">{{ s.data.real_quantity != null ? Number(s.data.real_quantity) : '-' }}</span>
                <i v-if="realIndicatorClass(s.data).icon" :class="realIndicatorClass(s.data).icon + ' !text-[10px]'"></i>
              </template>
            </div>
          </template>
        </Column>
        <Column header="Dif" style="width:40px">
          <template #body="s">
            <span v-if="s.data.deleted_at" class="line-through opacity-60">-</span>
            <span v-else :class="diffClass(s.data)">{{ diffText(s.data) }}</span>
          </template>
        </Column>
        <Column header="Desp" style="min-width:60px">
          <template #body="s">
            <template v-if="s.data.deleted_at"><span class="line-through opacity-60">{{ s.data.waste_quantity || '-' }}</span></template>
            <div v-else class="inline-flex align-items-center gap-1">
              <InputNumber
                v-if="editingRow === s.data.id && editingField === 'waste_quantity'"
                v-model="s.data.waste_quantity"
                :min="0" :step="0.01" size="small" class="w-full"
                @keydown.enter="saveInline(s.data)"
                @keydown.escape="cancelInline()"
              />
              <span v-else
                :class="editableClass('waste_quantity')"
                @dblclick="startInline(s.data, 'waste_quantity')"
  >{{ s.data.waste_quantity != null ? Number(s.data.waste_quantity) : '-' }}</span>
            </div>
          </template>
        </Column>
        <Column header="Precio U." style="min-width:80px">
          <template #body="s">
            <span>${{ unitPrice(s.data).toFixed(2) }}</span>
          </template>
        </Column>
        <Column header="Total Est." style="min-width:70px">
          <template #body="s">
            <span class="text-color-secondary font-medium" :class="{ 'line-through opacity-60': s.data.deleted_at }">${{ (unitPrice(s.data) * Number(s.data.estimated_quantity || 0)).toFixed(2) }}</span>
          </template>
        </Column>
        <Column header="Total Real" style="min-width:70px">
          <template #body="s">
            <span class="font-semibold" :class="{ 'line-through opacity-60': s.data.deleted_at }">${{ (unitPrice(s.data) * realQty(s.data)).toFixed(2) }}</span>
          </template>
        </Column>
        <Column header="Descripción" style="min-width:120px">
          <template #body="s">
            <template v-if="s.data.deleted_at"><span class="line-through opacity-60">{{ s.data.notes || '-' }}</span></template>
            <div v-else-if="editingRow === s.data.id && editingField === 'notes'">
              <InputText
                v-model="s.data.notes"
                size="small" class="w-full"
                @keydown.enter="saveInline(s.data)"
                @keydown.escape="cancelInline()"
                autofocus
              />
            </div>
            <span v-else
              class="text-color-secondary cursor-pointer hover:underline"
              @dblclick="startInline(s.data, 'notes')"
            >{{ s.data.notes || '✎ añadir nota' }}</span>
          </template>
        </Column>
        <Column header="Acciones" style="width:70px">
          <template #body="s">
            <div class="flex gap-0.5">
              <Button v-if="s.data.deleted_at && !isDraft"
                icon="pi pi-undo" text rounded size="small" severity="info"
                @click="restoreItem(s.data)" v-tooltip.left="'Reincorporar'"
              />
              <div v-if="!s.data.deleted_at" class="flex gap-1">
                <Button v-if="editingRow === s.data.id"
                  icon="pi pi-check" text rounded size="small" severity="success"
                  @click="saveInline(s.data)" v-tooltip.left="'Confirmar'"
                />
                <Button v-if="editingRow === s.data.id"
                  icon="pi pi-times" text rounded size="small"
                  @click="cancelInline()" v-tooltip.left="'Cancelar'"
                />
                <Button
                  :icon="isDraft ? 'pi pi-trash' : 'pi pi-ban'"
                  text rounded size="small" severity="danger"
                  @click="deleteItem(s.data)" v-tooltip.left="isDraft ? 'Eliminar' : 'Deshabilitar'"
                />
              </div>
            </div>
          </template>
        </Column>
      </DataTable>

      <div v-if="!materials.length" class="text-color-secondary text-sm py-2">Sin materiales registrados</div>

      <!-- Summary -->
      <div v-if="materials.length" class="flex justify-end gap-6 mt-3 pt-3 border-t text-sm">
        <div class="text-right">
          <div class="text-color-secondary">Total Estimado:</div>
          <strong>${{ materialEstTotal.toFixed(2) }}</strong>
        </div>
        <div class="text-right">
          <div class="text-color-secondary">Total Real:</div>
          <strong>${{ materialRealTotal.toFixed(2) }}</strong>
        </div>
        <div class="text-right">
          <div class="text-color-secondary">Subtotal materiales:</div>
          <strong>${{ materialTotal.toFixed(2) }}</strong>
        </div>
        <div class="text-right">
          <div class="text-color-secondary">Items:</div>
          <strong>{{ activeMaterials.length }}</strong>
        </div>
      </div>

      <!-- Audit log timeline (collapsible) -->
      <div v-if="!hideAudit && auditLogs.length" class="mt-4 border-t pt-3">
        <h4 class="text-xs font-semibold text-color-secondary mb-2">
          Historial de cambios
          <span class="font-normal text-color-secondary">({{ auditLogs.length }})</span>
        </h4>
        <div class="space-y-1.5">
          <div
            v-for="(log, idx) in visibleAuditLogs"
            :key="log.id"
            class="flex items-start gap-2 text-xs"
            :class="{ 'pb-0': idx === visibleAuditLogs.length - 1 }"
          >
            <div class="w-2 h-2 rounded-full mt-1 shrink-0"
              :style="{ backgroundColor: log.status?.color || '#6b7280' }"
            />
            <div class="flex-1 min-w-0">
              <p>{{ auditLogText(log) }}</p>
              <p class="text-color-secondary">{{ formatDateTime(log.created_at) }}</p>
            </div>
          </div>
        </div>
        <Button
          v-if="auditLogs.length > SHOW_MAX"
          :label="auditExpanded ? 'Mostrar menos' : 'Mostrar todo (' + auditLogs.length + ')'"
          size="small"
          link
          class="text-xs mt-1"
          @click="auditExpanded = !auditExpanded"
        />
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import api from '@/api/client'
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import AutoComplete from 'primevue/autocomplete'

const toast = useToast()

interface MaterialItem {
  id: number
  product_id: number
  estimated_quantity: number
  real_quantity: number | null
  waste_quantity: number | null
  estimated_unit_cost: number
  real_unit_cost: number | null
  estimated_location_id: number | null
  real_location_id: number | null
  notes: string | null
  deleted_at: string | null
  product?: { id: number; name: string; code: string | null; unit: string | null }
  estimated_location?: { id: number; name: string }
  real_location?: { id: number; name: string }
  [key: string]: any
}

interface AuditLog {
  id: number
  work_order_material_id: number
  field: string
  old_value?: string
  new_value?: string
  old_text?: string
  new_text?: string
  created_at: string
  changed_by?: { id: number; name: string }
  material?: { product?: { name?: string } }
  status?: { color?: string }
}

const props = defineProps<{
  workOrderId: number
  isDraft: boolean
  statusId: number | null
  statusName: string
  compact?: boolean
  hideAudit?: boolean
}>()

const emit = defineEmits<{
  saved: []
}>()

const materials = ref<MaterialItem[]>([])
const auditLogs = ref<AuditLog[]>([])
const locations = ref<{ id: number; name: string }[]>([])
const loading = ref(false)
const adding = ref(false)

// Inline editing — track row and field being edited
const editingRow = ref<number | null>(null)
const editingField = ref<string | null>(null)
const editBackup = ref<MaterialItem | null>(null)

// Product search
const searchQuery = ref('')
const productResults = ref<{ label: string; doc: string; id: number }[]>([])

// Fields that are always editable (not just in draft)
function isFieldEditable(_field: string): boolean {
  return true
}

function editableClass(_field: string): string {
  return 'text-primary cursor-pointer hover:underline'
}

async function fetchData() {
  loading.value = true
  try {
    const [matRes, logRes] = await Promise.all([
      api.get(`/work-orders/${props.workOrderId}/materials`),
      api.get(`/work-orders/${props.workOrderId}/material-audit-logs`),
    ])
    const raw = matRes.data.data || matRes.data || []
    materials.value = Array.isArray(raw) ? [...raw] : []
    const logRaw = logRes.data.data || logRes.data || []
    auditLogs.value = Array.isArray(logRaw) ? [...logRaw] : []
  } catch (e) {
    console.error('Failed to load materials', e)
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los materiales', life: 5000 })
  } finally {
    loading.value = false
  }
}

async function fetchLocations() {
  try {
    const res = await api.get('/locations')
    const raw = res.data.data || res.data || []
    locations.value = Array.isArray(raw) ? raw : (raw.data || [])
  } catch { /* ignore */ }
}

async function searchProducts(e: { query: string }) {
  try {
    const res = await api.get(`/products?search=${encodeURIComponent(e.query)}&limit=10`)
    const raw = res.data.data || res.data || []
    const items = Array.isArray(raw) ? raw : (raw.data || [])
    productResults.value = items.map((p: any) => ({
      label: `${p.code || p.name} - ${p.name}`,
      doc: p.unit || '',
      id: p.id,
      price: Number(p.selling_price || 0),
      iva_id: p.iva_id,
      iva_code: p.iva?.code || '',
      iva_percentage: Number(p.iva?.percentage || 0),
    }))
  } catch { /* ignore */ }
}

async function addProduct(e: any) {
  const selected = productResults.value.find((x: any) => x.id === (e?.value?.id || e?.id || e?.value))
  const productId = selected?.id
  if (!productId) {
    console.warn('addProduct: no id found in event', e)
    return
  }
  // Chequear duplicado local antes de enviar
  if (materials.value.some(m => m.product_id === productId && !m.deleted_at)) {
    toast.add({ severity: 'warn', summary: 'Duplicado', detail: 'El producto ya está en la lista de materiales', life: 4000 })
    searchQuery.value = ''
    productResults.value = []
    return
  }
  const initialPrice = selected?.price || 0
  try {
    const res = await api.post(`/work-orders/${props.workOrderId}/materials`, {
      product_id: productId,
      estimated_quantity: 1,
    })
    console.log('Material added:', res.data)
    searchQuery.value = ''
    productResults.value = []
    await fetchData()
    console.log('Materials after reload:', materials.value.length)
    toast.add({ severity: 'success', summary: 'Agregado', detail: 'Material agregado correctamente', life: 3000 })
  } catch (err: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: err.response?.data?.message || 'Error al agregar material', life: 5000 })
  } finally {
    adding.value = false
  }
}

function startInline(item: MaterialItem, field: string) {
  if (!isFieldEditable(field)) return
  editingRow.value = item.id
  editingField.value = field
  editBackup.value = { ...item }
}

function cancelInline() {
  if (editingRow.value && editBackup.value) {
    const idx = materials.value.findIndex(m => m.id === editingRow.value)
    if (idx !== -1) {
      materials.value[idx] = { ...editBackup.value }
    }
  }
  editingRow.value = null
  editingField.value = null
  editBackup.value = null
}

async function saveInline(item: MaterialItem) {
  const field = editingField.value
  editingRow.value = null
  editingField.value = null
  editBackup.value = null

  // Build payload with only the changed field
  const payload: Record<string, any> = {}
  payload[field!] = item[field!]

  try {
    await api.put(`/work-orders/${props.workOrderId}/materials/${item.id}`, payload)
    emit('saved')
    toast.add({ severity: 'success', summary: 'Guardado', detail: 'Material actualizado', life: 3000 })
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'Error al guardar', life: 5000 })
  }
}

async function deleteItem(item: MaterialItem) {
  const msg = props.isDraft ? '¿Eliminar este material permanentemente?' : '¿Deshabilitar este material? (se marcará como eliminado)'
  // Use a simple confirm for now — PrimeVue ConfirmDialog requires more setup
  try {
    await api.delete(`/work-orders/${props.workOrderId}/materials/${item.id}`)
    await fetchData()
    toast.add({ severity: 'success', summary: props.isDraft ? 'Eliminado' : 'Deshabilitado', detail: 'Material eliminado correctamente', life: 3000 })
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'Error al eliminar', life: 5000 })
  }
}

async function restoreItem(item: MaterialItem) {
  try {
    await api.post(`/work-orders/${props.workOrderId}/materials/${item.id}/restore`)
    await fetchData()
    toast.add({ severity: 'success', summary: 'Reincorporado', detail: 'Material reincorporado correctamente', life: 3000 })
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'Error al reincorporar', life: 5000 })
  }
}

function diffText(item: MaterialItem): string {
  if (item.real_quantity === null) return '-'
  const diff = Number(item.real_quantity) - Number(item.estimated_quantity)
  const sign = diff >= 0 ? '+' : ''
  return `${sign}${diff.toFixed(2)}`
}

function diffClass(item: MaterialItem): string {
  if (item.real_quantity === null) return ''
  const diff = Number(item.real_quantity) - Number(item.estimated_quantity)
  const tolerance = Number(item.estimated_quantity) * 0.1
  if (Math.abs(diff) <= tolerance) return 'text-green-600'
  if (diff > 0) return 'text-amber-600 font-semibold'
  return 'text-red-600 font-semibold'
}

function realIndicatorClass(item: MaterialItem): { cls: string; icon: string | null; tooltip: string } {
  if (item.real_quantity == null) return { cls: 'text-color-secondary', icon: null, tooltip: '' }
  const diff = Number(item.real_quantity) - Number(item.estimated_quantity)
  if (Math.abs(diff) < 0.01) return { cls: 'text-green-600', icon: 'pi pi-check-circle text-green-600', tooltip: 'Coincide con el estimado' }
  if (diff > 0) return { cls: 'text-orange-500', icon: 'pi pi-arrow-up text-orange-500', tooltip: `${diff.toFixed(2)} más que el estimado` }
  return { cls: 'text-purple-600', icon: 'pi pi-arrow-down text-purple-600', tooltip: `${Math.abs(diff).toFixed(2)} menos que el estimado` }
}

function formatDateTime(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function unitPrice(item: MaterialItem): number {
  return Number(item.product?.selling_price || item.estimated_unit_cost || 0)
}

function realQty(item: MaterialItem): number {
  // Use real_quantity if available, else estimated
  return item.real_quantity != null ? Number(item.real_quantity) : Number(item.estimated_quantity)
}

const SHOW_MAX = 3
const auditExpanded = ref(false)
const visibleAuditLogs = computed(() =>
  auditExpanded.value ? auditLogs.value : auditLogs.value.slice(0, SHOW_MAX)
)

const activeMaterials = computed(() => materials.value.filter(m => !m.deleted_at))

const materialEstTotal = computed(() =>
  activeMaterials.value.reduce((sum, m) => sum + unitPrice(m) * Number(m.estimated_quantity || 0), 0)
)

const materialRealTotal = computed(() =>
  activeMaterials.value.reduce((sum, m) => sum + unitPrice(m) * realQty(m), 0)
)

const materialTotal = computed(() =>
  activeMaterials.value.reduce((sum, m) => sum + unitPrice(m) * realQty(m), 0)
)

function auditLogText(log: AuditLog): string {
  const productName = log.material?.product?.name || `Material #${log.work_order_material_id}`
  const user = log.changed_by?.name || 'Sistema'

  const fieldLabels: Record<string, string> = {
    estimated_quantity: 'Cantidad estimada',
    real_quantity: 'Cantidad real',
    waste_quantity: 'Desperdicio',
    deleted: 'Eliminado',
    restored: 'Reincorporado',
    created: 'Agregado',
    notes: 'Descripción',
    estimated_location_id: 'Ubicación estimada',
    real_location_id: 'Ubicación real',
    estimated_unit_cost: 'Costo unitario (est.)',
    real_unit_cost: 'Costo unitario (real)',
    product_id: 'Producto',
  }

  const fieldLabel = fieldLabels[log.field] || log.field

  switch (log.field) {
    case 'created':
      return `${user} agregó ${productName} (est.: ${log.new_value})`
    case 'deleted':
      return `${user} eliminó ${productName}`
    case 'restored':
      return `${user} reincorporó ${productName}`
    case 'estimated_quantity':
    case 'real_quantity':
    case 'waste_quantity':
    case 'estimated_unit_cost':
    case 'real_unit_cost':
      return `${user} cambió ${fieldLabel} de ${productName}: ${log.old_value ?? '-'} → ${log.new_value ?? '-'}`
    default:
      return `${user} modificó ${fieldLabel} de ${productName}`
  }
}

onMounted(() => {
  fetchData()
  fetchLocations()
})
</script>

<style scoped>
.line-through {
  text-decoration: line-through;
}

:deep(.p-inputnumber) {
  max-width: 100%;
}

:deep(.p-inputnumber input) {
  width: 100%;
  min-width: 50px;
}

:deep(.p-datatable td) {
  vertical-align: middle;
}
</style>

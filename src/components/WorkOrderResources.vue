<template>
  <Card class="mb-3">
    <template #title>
      <div class="flex align-items-center justify-content-between flex-wrap gap-2">
        <div class="flex align-align-items-center gap-2">
          <i class="pi pi-box text-color-secondary" />
          <span>Recursos</span>
        </div>
        <div class="flex align-align-items-center gap-2">
          <Button label="Historial" icon="pi pi-history" text size="small" @click="emit('openHistory')" />
        </div>
      </div>
    </template>
    <template #content>
      <!-- Action bar: two search fields -->
      <div class="grid formgrid p-fluid mb-3">
        <div class="col-12 md:col-6">
          <label class="block text-sm font-medium text-color mb-1">Material / Servicio</label>
          <AutoComplete
            v-model="matSearchQuery"
            :suggestions="productResults"
            @complete="searchProducts"
            @option-select="addProduct"
            optionLabel="label"
            placeholder="Agregar material o servicio..."
            :disabled="adding"
            :forceSelection="false"
            class="w-full"
            inputClass="w-full"
          />
        </div>
        <div class="col-12 md:col-6">
          <label class="block text-sm font-medium text-color mb-1">Equipo / Máquina</label>
          <AutoComplete
            v-model="machSearchQuery"
            :suggestions="machineResults"
            @complete="searchMachines"
            @option-select="addMachine"
            optionLabel="label"
            placeholder="Agregar equipo o máquina..."
            :disabled="adding"
            :forceSelection="false"
            class="w-full"
            inputClass="w-full"
          />
        </div>
      </div>

      <!-- DataTable (desktop) -- celdas solo texto, fila clicable -->
      <div class="table-wrapper">
        <DataTable scrollable scrollHeight="flex" :value="combinedList" size="small" stripedRows class="text-sm w-full">
          <Column header="Recurso" style="min-width:160px">
            <template #body="s">
              <div
                class="flex align-align-items-center gap-2 p-1 border-round"
                :class="{ 'line-through opacity-60': s.data.deleted_at }"
              >
                <i :class="['pi', s.data._type === 'machine' ? 'pi-cog' : 'pi-box', s.data._type === 'machine' ? 'text-color-secondary' : 'text-color-secondary']" class="text-sm" />
                <div>
                  <span class="font-medium">{{ s.data._name }}</span>
                  <span v-if="s.data._code" class="text-color-secondary ml-1">({{ s.data._code }})</span>
                  <div v-if="s.data._type === 'machine' && s.data._assetType" class="text-color-secondary text-xs">
                    {{ s.data._assetType }}
                  </div>
                </div>
              </div>
            </template>
          </Column>

          <Column header="Ud." style="width:40px">
            <template #body="s">
              <span :class="{ 'line-through opacity-60': s.data.deleted_at }">{{ s.data._unit || '-' }}</span>
            </template>
          </Column>

          <Column header="Est." style="min-width:50px">
            <template #body="s">
              <template v-if="s.data.deleted_at">
                <span class="line-through opacity-60">{{ s.data._type === 'machine' ? Number(s.data._estQty).toFixed(1) : Number(s.data._estQty) }}</span>
              </template>
              <div v-else class="inline-flex align-items-center gap-1">
                <InputNumber
                  v-if="editingRow === s.data._uid && editingField === '_estQty'"
                  v-model="s.data._estQty"
                  :min="0"
                  :step="s.data._type === 'machine' ? 0.5 : 0.01"
                  :minFractionDigits="s.data._type === 'machine' ? 1 : 2"
                  :maxFractionDigits="4"
                  size="small" style="width:90px" autofocus
                  @keydown.enter="saveInline(s.data)"
                  @keydown.escape="cancelInline()"
                />
                <span v-else :class="editableClass" @click="startInline(s.data, '_estQty')">
                  <i class="pi pi-pencil pencil-icon"></i>
                  {{ s.data._type === 'machine' ? Number(s.data._estQty).toFixed(1) : Number(s.data._estQty) }}
                </span>
              </div>
            </template>
          </Column>

          <Column header="Real" style="min-width:50px">
            <template #body="s">
              <template v-if="s.data.deleted_at">
                <span class="line-through opacity-60">{{ s.data._realQty ?? '-' }}</span>
              </template>
              <div v-else class="inline-flex align-items-center gap-1">
                <InputNumber
                  v-if="editingRow === s.data._uid && editingField === '_realQty'"
                  v-model="s.data._realQty"
                  :min="0"
                  :step="s.data._type === 'machine' ? 0.5 : 0.01"
                  :minFractionDigits="s.data._type === 'machine' ? 1 : 2"
                  :maxFractionDigits="4"
                  size="small" style="width:90px" autofocus
                  @keydown.enter="saveInline(s.data)"
                  @keydown.escape="cancelInline()"
                />
                <span v-else :class="[realIndicatorClass(s.data).cls, 'cursor-pointer']" @click="startInline(s.data, '_realQty')">
                  <i v-if="!realIndicatorClass(s.data).icon" class="pi pi-pencil pencil-icon"></i>
                  {{ s.data._realQty != null ? (s.data._type === 'machine' ? Number(s.data._realQty).toFixed(1) : Number(s.data._realQty)) : '-' }}
                  <i v-if="realIndicatorClass(s.data).icon" :class="realIndicatorClass(s.data).icon + ' !text-xs'"></i>
                </span>
              </div>
            </template>
          </Column>

          <Column header="Dif" style="width:40px">
            <template #body="s">
              <span v-if="s.data.deleted_at" class="line-through opacity-60">-</span>
              <span v-else :class="s.data._diffClass">{{ s.data._diffText }}</span>
            </template>
          </Column>

          <Column header="Desp" style="min-width:50px">
            <template #body="s">
              <template v-if="s.data._type === 'machine'"><span class="text-color-secondary">--</span></template>
              <template v-else-if="s.data.deleted_at"><span class="line-through opacity-60">{{ s.data.waste_quantity || '-' }}</span></template>
              <div v-else class="inline-flex align-items-center gap-1">
                <InputNumber
                  v-if="editingRow === s.data._uid && editingField === 'waste_quantity'"
                  v-model="s.data.waste_quantity"
                  :min="0"
                  :step="0.01"
                  :maxFractionDigits="4"
                  size="small" style="width:90px" autofocus
                  @keydown.enter="saveInline(s.data)"
                  @keydown.escape="cancelInline()"
                />
                <span v-else :class="editableClass" @click="startInline(s.data, 'waste_quantity')">
                  <i class="pi pi-pencil pencil-icon"></i>
                  {{ s.data.waste_quantity != null ? Number(s.data.waste_quantity) : '-' }}
                </span>
              </div>
            </template>
          </Column>

          <Column header="Precio/U." style="min-width:70px">
            <template #body="s">
              <span>${{ s.data._unitPrice.toFixed(2) }}</span>
            </template>
          </Column>

          <Column header="P. Base" style="min-width:60px">
            <template #body="s">
              <template v-if="s.data._type === 'machine'">
                <span>${{ Number(s.data.machine?.base_price || 0).toFixed(2) }}</span>
              </template>
              <span v-else class="text-color-secondary">--</span>
            </template>
          </Column>

          <Column header="Total Est." style="min-width:70px">
            <template #body="s">
              <template v-if="s.data._type === 'machine'">
                <div :class="s.data._belowMinEst ? 'bg-red-100 p-2 py-1 border-round' : 'p-2 py-1 border-round'">
                  <span class="text-color font-medium" :class="{ 'line-through opacity-60': s.data.deleted_at }">${{ s.data._estTotal.toFixed(2) }}</span>
                  <div v-if="s.data.machine?.min_units" class="text-xs leading-tight">
                    <span class="text-color-secondary">{{ s.data._calcEst }}</span>
                    <span v-if="s.data._minNoteEst" class="text-amber-500"> {{ s.data._minNoteEst }}</span>
                  </div>
                </div>
              </template>
              <span v-else class="text-color font-medium" :class="{ 'line-through opacity-60': s.data.deleted_at }">${{ s.data._estTotal.toFixed(2) }}</span>
            </template>
          </Column>

          <Column header="Total Real" style="min-width:70px">
            <template #body="s">
              <template v-if="s.data._type === 'machine'">
                <div :class="s.data._totalRealClass">
                  <span class="font-semibold">${{ s.data._realTotal.toFixed(2) }}</span>
                  <div v-if="s.data.machine?.min_units" class="text-xs leading-tight">
                    <span class="text-color-secondary">{{ s.data._calcReal }}</span>
                    <span v-if="s.data._minNoteReal" class="text-amber-500"> {{ s.data._minNoteReal }}</span>
                  </div>
                </div>
              </template>
              <span v-else class="font-semibold" :class="{ 'line-through opacity-60': s.data.deleted_at }">${{ s.data._realTotal.toFixed(2) }}</span>
            </template>
          </Column>

          <Column header="Descripción" style="min-width:120px">
            <template #body="s">
              <template v-if="s.data.deleted_at">
                <span class="line-through opacity-60">{{ s.data._notes || '-' }}</span>
              </template>
              <div v-else class="inline-flex align-items-center gap-1">
                <Textarea
                  v-if="editingRow === s.data._uid && editingField === '_notes'"
                  v-model="s.data._notes"
                  :autoResize="true" rows="1" style="width:140px" autofocus
                  @keydown.enter="saveInline(s.data)"
                  @keydown.escape="cancelInline()"
                />
                <span v-else :class="editableClass" @click="startInline(s.data, '_notes')">
                  <i class="pi pi-pencil pencil-icon"></i>
                  {{ s.data._notes || 'añadir nota' }}
                </span>
              </div>
            </template>
          </Column>

          <Column header="" style="width:70px">
            <template #body="s">
              <div class="flex gap-1">
                <Button v-if="s.data.deleted_at && isDraft === false"
                  icon="pi pi-undo" text border-round size="small" severity="info"
                  @click.stop="restoreItem(s.data)" v-tooltip.left="'Reincorporar'"
                />

                <Button v-if="!s.data.deleted_at"
                  :icon="(isDraft && s.data._type === 'material') ? 'pi pi-trash' : 'pi pi-ban'"
                  text border-round size="small" severity="danger"
                  @click.stop="deleteItem(s.data)" v-tooltip.left="'Eliminar'"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- Mobile cards -- compacto, sin edicion inline, click abre dialogo -->
      <div v-if="combinedList.length" class="mobile-cards">
        <div
          v-for="(item, idx) in combinedList"
          :key="item._uid"
          :data-uid="item._uid"
          class="mb-2 p-3 border-1 border-round mobile-card"
          :class="item.deleted_at ? 'surface-ground border-1 border-200 opacity-70' : 'surface-card border-1 border-200'"
          @click="!item.deleted_at && openEditDialog(item)"
        >
          <!-- Linea 1: icono + nombre + tipo -->
          <div class="flex align-items-center justify-content-between mb-1">
            <div class="flex align-align-items-center gap-2 min-w-0 flex-1">
              <i :class="['pi', item._type === 'machine' ? 'pi-cog text-color-secondary' : 'pi-box text-color-secondary']" class="text-sm" />
              <div class="min-w-0">
                <span class="font-medium text-sm block truncate" :class="{ 'line-through': item.deleted_at }">{{ item._name }}</span>
                <span v-if="item._code" class="text-color-secondary text-xs">{{ item._code }}</span>
              </div>
            </div>
            <span v-if="item._type === 'machine'" class="text-xs text-color-secondary surface-ground border-circle border-1 px-2 py-1 white-space-nowrap">Equipo</span>
            <span v-else class="text-xs text-color-secondary surface-ground border-circle border-1 px-2 py-1 white-space-nowrap">Material</span>
          </div>
          <!-- Linea 2: valores clave en 4 mini-columnas -->
          <div class="grid grid-nogutter text-xs w-full">
            <div class="col-3 text-center py-1">
              <div class="text-color-secondary">Est.</div>
              <div class="font-medium" :class="{ 'line-through opacity-60': item.deleted_at }">{{ item._type === 'machine' ? Number(item._estQty).toFixed(1) : item._estQty }}</div>
            </div>
            <div class="col-3 text-center py-1">
              <div class="text-color-secondary">Real</div>
              <div :class="[item._realCls, 'font-medium', { 'line-through opacity-60': item.deleted_at }]">{{ item._realQty != null ? (item._type === 'machine' ? Number(item._realQty).toFixed(1) : item._realQty) : '-' }}</div>
            </div>
            <div class="col-3 text-center py-1">
              <div class="text-color-secondary">Dif</div>
              <div :class="[item._diffClass, 'font-medium', { 'line-through opacity-60': item.deleted_at }]">{{ item._diffText }}</div>
            </div>
            <div class="col-3 text-center py-1">
              <div class="text-color-secondary">Desp</div>
              <div class="font-medium" :class="{ 'line-through opacity-60': item.deleted_at }">{{ item.waste_quantity != null ? Number(item.waste_quantity) : (item._type === 'machine' ? '-' : '-') }}</div>
            </div>
          </div>
          <!-- Linea 3: totales y accion rapida -->
          <div class="flex align-items-center justify-content-between mt-1 text-xs">
            <div>
              <span class="text-color-secondary">Total </span>
              <span class="font-semibold">${{ item._realTotal.toFixed(2) }}</span>
            </div>
            <div class="flex gap-1">
              <Button v-if="item.deleted_at && isDraft === false"
                icon="pi pi-undo" text border-round size="small" severity="info" aria-label="Reincorporar"
                @click.stop="restoreItem(item)"
              />
              <Button v-if="!item.deleted_at"
                icon="pi pi-ban" text border-round size="small" severity="danger" aria-label="Eliminar"
                @click.stop="deleteItem(item)"
              />
            </div>
          </div>
          <!-- Nota si existe -->
          <div v-if="item._notes" class="text-xs text-color-secondary mt-1 truncate" :class="{ 'line-through opacity-60': item.deleted_at }">
            <i class="pi pi-comment mr-1"></i>{{ item._notes }}
          </div>
        </div>
      </div>      <div v-if="!combinedList.length" class="text-color-secondary text-sm p-2">Sin recursos registrados</div>

      <!-- Combined summary (desktop/tablet) -->
      <div v-if="combinedList.length" class="desktop-summary mt-3 pt-3 border-1-t text-sm">
        <div class="flex flex-wrap gap-x-6 gap-y-2 justify-content-end">
          <div class="text-right">
            <div class="text-color-secondary">Total Est. Materiales:</div>
            <strong>${{ materialsEstTotal.toFixed(2) }}</strong>
          </div>
          <div class="text-right">
            <div class="text-color-secondary">Total Real Materiales:</div>
            <strong>${{ materialsRealTotal.toFixed(2) }}</strong>
          </div>
          <div class="text-right">
            <div class="text-color-secondary">Total Est. Equipos:</div>
            <strong>${{ machinesEstTotal.toFixed(2) }}</strong>
          </div>
          <div class="text-right">
            <div class="text-color-secondary">Total Real Equipos:</div>
            <strong>${{ machinesRealTotal.toFixed(2) }}</strong>
          </div>
          <div class="text-right">
            <div class="text-color-secondary">Total Estimado:</div>
            <strong class="text-primary">${{ grandTotalEst.toFixed(2) }}</strong>
          </div>
          <div class="text-right">
            <div class="text-color-secondary">Total Real:</div>
            <strong class="text-primary">${{ grandTotalReal.toFixed(2) }}</strong>
          </div>
          <div class="text-right">
            <div class="text-color-secondary">Items:</div>
            <strong>{{ combinedActive.length }}</strong>
          </div>
        </div>
      </div>
      <!-- Mobile totals cards -->
      <div v-if="combinedList.length" class="mobile-totals grid gap-2 mt-2" style="grid-template-columns: 1fr 1fr">
        <div class="p-3 border-round surface-ground">
          <div class="text-xs text-color-secondary">Est. Materiales</div>
          <strong>${{ materialsEstTotal.toFixed(2) }}</strong>
        </div>
        <div class="p-3 border-round surface-ground">
          <div class="text-xs text-color-secondary">Real Materiales</div>
          <strong>${{ materialsRealTotal.toFixed(2) }}</strong>
        </div>
        <div class="p-3 border-round surface-ground">
          <div class="text-xs text-color-secondary">Est. Equipos</div>
          <strong>${{ machinesEstTotal.toFixed(2) }}</strong>
        </div>
        <div class="p-3 border-round surface-ground">
          <div class="text-xs text-color-secondary">Real Equipos</div>
          <strong>${{ machinesRealTotal.toFixed(2) }}</strong>
        </div>
        <div class="p-3 border-round surface-ground">
          <div class="text-xs text-color-secondary">Total Estimado</div>
          <strong class="text-primary">${{ grandTotalEst.toFixed(2) }}</strong>
        </div>
        <div class="p-3 border-round surface-ground">
          <div class="text-xs text-color-secondary">Total Real</div>
          <strong class="text-primary">${{ grandTotalReal.toFixed(2) }}</strong>
        </div>
        <div class="p-3 border-round surface-ground" style="grid-column: 1 / -1">
          <div class="text-xs text-color-secondary">Items</div>
          <strong>{{ combinedActive.length }}</strong>
        </div>
      </div>
    </template>
  </Card>

      <!-- Dialogo de edicion de recurso -->
      <Dialog
        v-model:visible="editDialogVisible"
        :header="editDialogTitle"
        :modal="true"
        :closable="true"
        :dismissableMask="true"
        style="width: 95vw; max-width: 520px"
        class="resource-edit-dialog"
        @hide="cancelEditDialog()"
      >
        <div v-if="editItem" class="grid formgrid p-fluid">
          <div class="field col-12">
            <label class="text-color-secondary block text-sm mb-1">Estimado</label>
            <InputNumber
              v-model="editForm._estQty"
              :min="0"
              :step="editItem._type === 'machine' ? 0.5 : 0.01"
              :minFractionDigits="editItem._type === 'machine' ? 1 : 2"
              :maxFractionDigits="4"
              inputmode="decimal"
            />
          </div>
          <div class="field col-12">
            <label class="text-color-secondary block text-sm mb-1">Real</label>
            <InputNumber
              v-model="editForm._realQty"
              :min="0"
              :step="editItem._type === 'machine' ? 0.5 : 0.01"
              :minFractionDigits="editItem._type === 'machine' ? 1 : 2"
              :maxFractionDigits="4"
              inputmode="decimal"
            />
          </div>
          <div v-if="editItem._type === 'material'" class="field col-12">
            <label class="text-color-secondary block text-sm mb-1">Desperdicio</label>
            <InputNumber
              v-model="editForm.waste_quantity"
              :min="0"
              :step="0.01"
              :maxFractionDigits="4"
              inputmode="decimal"
            />
          </div>
          <div class="field col-12">
            <label class="text-color-secondary block text-sm mb-1">Descripción / Nota</label>
            <Textarea
              v-model="editForm._notes"
              :autoResize="true"
              rows="2"
              inputmode="text"
            />
          </div>
        </div>
        <template #footer>
          <div class="flex flex-column md:flex-row gap-2 justify-content-end w-full">
            <Button label="Cancelar" icon="pi pi-times" text severity="secondary" @click="cancelEditDialog()" class="w-full md:w-auto" />
            <Button label="Guardar" icon="pi pi-check" :loading="savingDialog" @click="saveEditDialog()" class="w-full md:w-auto" />
          </div>
        </template>
      </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useToast } from 'primevue/usetoast'
import api from '@/api/client'
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Dialog from 'primevue/dialog'
import Textarea from 'primevue/textarea'
import AutoComplete from 'primevue/autocomplete'

const toast = useToast()

const props = defineProps<{
  workOrderId: number
  isDraft: boolean
  statusId: number | null
  statusName: string
}>()

const emit = defineEmits<{
  openHistory: []
  saved: []
}>()

// ── Data ──
const materials = ref<any[]>([])
const usages = ref<any[]>([])
const loading = ref(false)
const adding = ref(false)

// ── Dialog state ──
const editDialogVisible = ref(false)
const editItem = ref<any>(null)
const editForm = ref<any>({})
const savingDialog = ref(false)
// dialogWidth removed — inline style handles width

const editDialogTitle = computed(() => {
  if (!editItem.value) return 'Editar recurso'
  const prefix = editItem.value._type === 'machine' ? 'Equipo' : 'Material'
  return `Editar ${prefix}: ${editItem.value._name || ''}`
})

// ── Search: materials ──
const matSearchQuery = ref('')
const productResults = ref<any[]>([])

// ── Search: machines ──
const machSearchQuery = ref('')
const machineResults = ref<any[]>([])

// ── Helpers ──
const editableClass = 'text-primary cursor-pointer hover:underline'

function uidFor(item: any, type: string): string {
  return `${type}_${item.id}`
}

// ── Fetch all data ──
async function fetchData() {
  loading.value = true
  try {
    const [matRes, machRes] = await Promise.all([
      api.get(`/work-orders/${props.workOrderId}/materials`),
      api.get(`/work-orders/${props.workOrderId}/machine-usages`),
    ])
    const rawMat = matRes.data.data || matRes.data || []
    materials.value = Array.isArray(rawMat) ? [...rawMat] : []
    const rawMach = machRes.data.data || machRes.data || []
    usages.value = Array.isArray(rawMach) ? [...rawMach] : []
  } catch (e) {
    console.error('Failed to load resources', e)
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los recursos', life: 5000 })
  } finally {
    loading.value = false
  }
}

// ── Search products ──
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
  if (!productId) return

  if (materials.value.some(m => m.product_id === productId && !m.deleted_at)) {
    toast.add({ severity: 'warn', summary: 'Duplicado', detail: 'El producto ya está en la lista', life: 4000 })
    matSearchQuery.value = ''
    productResults.value = []
    return
  }

  try {
    await api.post(`/work-orders/${props.workOrderId}/materials`, { product_id: productId, estimated_quantity: 1 })
    matSearchQuery.value = ''
    productResults.value = []
    await fetchData()
    emit('saved')
    toast.add({ severity: 'success', summary: 'Agregado', detail: 'Material agregado correctamente', life: 3000 })
  } catch (err: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: err.response?.data?.message || 'Error al agregar material', life: 5000 })
  }
}

// ── Search machines ──
async function searchMachines(e: { query: string }) {
  try {
    const res = await api.get(`/machines?search=${encodeURIComponent(e.query)}&limit=10&work_order=1`)
    const raw = res.data.data || res.data || []
    const items = Array.isArray(raw) ? raw : (raw.data || [])
    machineResults.value = items.map((m: any) => ({
      label: `${m.code || m.name} - ${m.name}`,
      doc: m.asset_type || m.type || '',
      id: m.id,
    }))
  } catch { /* ignore */ }
}

async function addMachine(e: any) {
  const machineId = e?.value?.id || e?.id || e?.value
  if (!machineId) return

  if (usages.value.some(u => u.machine_id === machineId)) {
    toast.add({ severity: 'warn', summary: 'Duplicado', detail: 'El equipo ya está registrado', life: 4000 })
    machSearchQuery.value = ''
    machineResults.value = []
    return
  }

  try {
    await api.post(`/work-orders/${props.workOrderId}/machine-usages`, {
      machine_id: machineId,
      actual_units: 0,
      estimated_units: 1.0,
    })
    machSearchQuery.value = ''
    machineResults.value = []
    await fetchData()
    emit('saved')
    toast.add({ severity: 'success', summary: 'Agregado', detail: 'Equipo agregado correctamente', life: 3000 })
  } catch (err: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: err.response?.data?.message || 'Error al agregar equipo', life: 5000 })
  }
}

// ── Inline editing (desktop DataTable) ──
const editingRow = ref<string | null>(null)
const editingField = ref<string | null>(null)
const inlineBackup = ref<any>(null)

function isFieldEditable(field: string): boolean {
  return ['_estQty', '_realQty', 'waste_quantity', '_notes'].includes(field)
}

function startInline(item: any, field: string) {
  if (!isFieldEditable(field)) return
  editingRow.value = item._uid
  editingField.value = field
  // backup the field value for cancel
  inlineBackup.value = { [field]: item[field] }
}

async function saveInline(item: any) {
  if (!editingField.value) return
  const field = editingField.value
  const [type] = item._uid.split('_')

  const fieldMap: Record<string, string> = {
    _estQty: type === 'machine' ? 'estimated_units' : 'estimated_quantity',
    _realQty: type === 'machine' ? 'actual_units' : 'real_quantity',
    waste_quantity: 'waste_quantity',
    _notes: type === 'machine' ? 'description' : 'notes',
  }

  const backendField = fieldMap[field]
  if (!backendField || item[field] === undefined) {
    editingRow.value = null
    editingField.value = null
    inlineBackup.value = null
    return
  }

  const payload = { [backendField]: item[field] }

  try {
    const endpoint = type === 'machine'
      ? `/work-orders/${props.workOrderId}/machine-usages/${item.id}`
      : `/work-orders/${props.workOrderId}/materials/${item.id}`
    await api.put(endpoint, payload)
    editingRow.value = null
    editingField.value = null
    inlineBackup.value = null
    await fetchData()
    emit('saved')
    toast.add({ severity: 'success', summary: 'Guardado', detail: 'Actualizado', life: 2000 })
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'Error al guardar', life: 5000 })
  }
}

function cancelInline() {
  editingRow.value = null
  editingField.value = null
  inlineBackup.value = null
}

function openEditDialog(item: any) {
  if (!item || item.deleted_at) return
  editItem.value = item
  editForm.value = {
    _estQty: item._estQty,
    _realQty: item._realQty,
    waste_quantity: item.waste_quantity ?? null,
    _notes: item._notes || '',
  }
  editDialogVisible.value = true
}

function cancelEditDialog() {
  editDialogVisible.value = false
  editItem.value = null
  editForm.value = {}
  // Blur active element to prevent PrimeVue refocus artifact
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
  }
}

async function saveEditDialog() {
  const item = editItem.value
  if (!item) return
  const [type] = item._uid.split('_')
  savingDialog.value = true

  const fieldMap: Record<string, string> = {
    _estQty: type === 'machine' ? 'estimated_units' : 'estimated_quantity',
    _realQty: type === 'machine' ? 'actual_units' : 'real_quantity',
    _notes: type === 'machine' ? 'description' : 'notes',
    waste_quantity: 'waste_quantity',
  }

  const payload: Record<string, any> = {}
  for (const [virtField, backendField] of Object.entries(fieldMap)) {
    // Only include fields that were actually changed or are present in editForm
    if (editForm.value[virtField] !== undefined) {
      payload[backendField] = editForm.value[virtField]
    }
  }

  try {
    const endpoint = type === 'machine'
      ? `/work-orders/${props.workOrderId}/machine-usages/${item.id}`
      : `/work-orders/${props.workOrderId}/materials/${item.id}`
    await api.put(endpoint, payload)
    editDialogVisible.value = false
    editItem.value = null
    editForm.value = {}
    // Blur active element to prevent PrimeVue refocus artifact
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
    await fetchData()
    emit('saved')
    toast.add({ severity: 'success', summary: 'Guardado', detail: 'Recurso actualizado', life: 3000 })
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'Error al guardar', life: 5000 })
  } finally {
    savingDialog.value = false
  }
}


// ── Delete / restore ──
async function deleteItem(item: any) {
  const [type] = item._uid.split('_')
  const endpoint = type === 'machine'
    ? `/work-orders/${props.workOrderId}/machine-usages/${item.id}`
    : `/work-orders/${props.workOrderId}/materials/${item.id}`
  try {
    await api.delete(endpoint)
    await fetchData()
    emit('saved')
    toast.add({ severity: 'success', summary: 'Eliminado', detail: 'Recurso eliminado correctamente', life: 3000 })
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'Error al eliminar', life: 5000 })
  }
}

async function restoreItem(item: any) {
  const [type] = item._uid.split('_')
  try {
    const endpoint = type === 'material'
      ? `/work-orders/${props.workOrderId}/materials/${item.id}/restore`
      : '' // machines don't have restore
    if (!endpoint) return
    await api.post(endpoint)
    await fetchData()
    emit('saved')
    toast.add({ severity: 'success', summary: 'Reincorporado', detail: 'Recurso reincorporado correctamente', life: 3000 })
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'Error al reincorporar', life: 5000 })
  }
}

// ── Computed: unified list ──
const combinedList = computed(() => {
  const matRows = materials.value.map(m => {
    const estQty = Number(m.estimated_quantity || 0)
    const realQty = m.real_quantity != null ? Number(m.real_quantity) : null
    const unitPrice = Number(m.product?.selling_price || m.estimated_unit_cost || 0)
    const realForCalc = realQty != null ? realQty : estQty
    const diff = realQty != null ? realQty - estQty : null
    const tolerance = estQty * 0.1

    let diffClass = ''
    let diffText = '-'
    if (diff !== null) {
      const sign = diff >= 0 ? '+' : ''
      diffText = `${sign}${diff.toFixed(2)}`
      if (Math.abs(diff) <= tolerance) diffClass = 'text-color-secondary'
      else if (diff > 0) diffClass = 'text-color-secondary font-semibold'
      else diffClass = 'text-color-secondary font-semibold'
    }

    // Real indicator
    let realCls = 'cursor-pointer hover:underline'
    let realIcon: string | null = null
    if (realQty != null) {
      const d = realQty - estQty
      if (Math.abs(d) < 0.01) { realCls = 'text-color-secondary'; realIcon = 'pi pi-check-circle text-color-secondary' }
      else if (d > 0) { realCls = 'text-color-secondary'; realIcon = 'pi pi-arrow-up text-color-secondary' }
      else { realCls = 'text-color-secondary'; realIcon = 'pi pi-arrow-down text-color-secondary' }
    } else {
      realCls = 'text-color-secondary'
    }

    return {
      ...m,
      _uid: uidFor(m, 'material'),
      _type: 'material',
      _name: m.product?.name || 'Producto #' + m.product_id,
      _code: m.product?.code || null,
      _unit: m.product?.unit || null,
      _assetType: null,
      _estQty: estQty,
      _realQty: realQty,
      _unitPrice: unitPrice,
      _diffText: diffText,
      _diffClass: diffClass,
      _realCls: realCls,
      _realIcon: realIcon,
      _estTotal: unitPrice * estQty,
      _realTotal: unitPrice * realForCalc,
      _notes: m.notes || null,
      _belowMinEst: false,
      _belowMinReal: false,
      _calcEst: '',
      _calcReal: '',
      _minNoteEst: '',
      _minNoteReal: '',
      _totalRealClass: '',
    }
  })

  const machRows = usages.value.map(u => {
    const estU = Number(u.estimated_units || 0)
    const actU = Number(u.actual_units || 0)
    const costPerU = Number(u.cost_per_unit || 0)
    const basePrice = Number(u.machine?.base_price || 0)
    const minUnits = Number(u.machine?.min_units || 0)
    const assetType = u.machine?.assetType?.name || u.machine?.asset_type_code || null

    // Diff
    const diff = actU - estU
    const sign = diff >= 0 ? '+' : ''
    const diffText = `${sign}${diff.toFixed(1)}`
    let diffClass
    if (Math.abs(diff) < 0.1) diffClass = 'text-color-secondary'
    else if (diff > 0) diffClass = 'text-color-secondary font-semibold'
    else diffClass = 'text-color-secondary font-semibold'

    // Real indicator
    let realCls = 'cursor-pointer hover:underline'
    let realIcon: string | null = null
    const d = actU - estU
    if (Math.abs(d) < 0.1) { realCls = 'text-color-secondary cursor-pointer hover:underline'; realIcon = 'pi pi-check-circle text-color-secondary' }
    else if (d > 0) { realCls = 'text-color-secondary cursor-pointer hover:underline'; realIcon = 'pi pi-arrow-up text-color-secondary' }
    else { realCls = 'text-color-secondary cursor-pointer hover:underline'; realIcon = 'pi pi-arrow-down text-color-secondary' }

    // Calc tooltips
    function calcTotal(units: number): number {
      const charged = minUnits > 0 ? Math.max(units, minUnits) : units
      return charged * costPerU + basePrice
    }

    function calcParts(units: number): { calc: string; minNote: string } {
      if (!minUnits) return { calc: '', minNote: '' }
      const charged = Math.max(units, minUnits)
      let calc = `${units} × $${costPerU.toFixed(2)}`
      if (charged > units) {
        calc = `${minUnits} (mín) × $${costPerU.toFixed(2)}`
        return { calc: calc + ` + $${basePrice.toFixed(2)} = $${calcTotal(units).toFixed(2)}`, minNote: `(se aplicó mínimo ${minUnits})` }
      }
      return { calc: calc + ` + $${basePrice.toFixed(2)} = $${calcTotal(units).toFixed(2)}`, minNote: '' }
    }

    const estTotal = calcTotal(estU)
    const realTotal = calcTotal(actU)
    const belowMinEst = minUnits > 0 && estU < minUnits
    const belowMinReal = minUnits > 0 && actU < minUnits
    const partsEst = calcParts(estU)
    const partsReal = calcParts(actU)

    let totalRealClass = 'p-2 py-1 border-round'
    if (belowMinReal) totalRealClass = 'bg-red-100 p-2 py-1 border-round'

    return {
      ...u,
      _uid: uidFor(u, 'machine'),
      _type: 'machine',
      _name: u.machine?.name || 'Equipo #' + u.machine_id,
      _code: u.machine?.code || null,
      _unit: 'U', // generic; could derive from asset type
      _assetType: assetType,
      _estQty: estU,
      _realQty: actU,
      _unitPrice: costPerU,
      _diffText: diffText,
      _diffClass: diffClass,
      _realCls: realCls,
      _realIcon: realIcon,
      _estTotal: estTotal,
      _realTotal: realTotal,
      _belowMinEst: belowMinEst,
      _belowMinReal: belowMinReal,
      _calcEst: partsEst.calc,
      _calcReal: partsReal.calc,
      _minNoteEst: partsEst.minNote,
      _minNoteReal: partsReal.minNote,
      _totalRealClass: totalRealClass,
      _notes: u.description || null,
    }
  })

  // Interleave: materials first, then machines
  return [...matRows, ...machRows]
})

const combinedActive = computed(() => combinedList.value.filter(r => !r.deleted_at))

const materialsActive = computed(() => materials.value.filter(m => !m.deleted_at))
const machinesActive = computed(() => usages.value.filter(u => true)) // usages have no deleted_at

const materialsEstTotal = computed(() =>
  materialsActive.value.reduce((sum, m) => {
    const up = Number(m.product?.selling_price || m.estimated_unit_cost || 0)
    return sum + up * Number(m.estimated_quantity || 0)
  }, 0)
)

const materialsRealTotal = computed(() =>
  materialsActive.value.reduce((sum, m) => {
    const up = Number(m.product?.selling_price || m.estimated_unit_cost || 0)
    const rq = m.real_quantity != null ? Number(m.real_quantity) : Number(m.estimated_quantity || 0)
    return sum + up * rq
  }, 0)
)

const machinesEstTotal = computed(() =>
  machinesActive.value.reduce((sum, u) => {
    const cost = Number(u.cost_per_unit || 0)
    const base = Number(u.machine?.base_price || 0)
    const minU = Number(u.machine?.min_units || 0)
    const estU = Number(u.estimated_units || 0)
    const charged = minU > 0 ? Math.max(estU, minU) : estU
    return sum + charged * cost + base
  }, 0)
)

const machinesRealTotal = computed(() =>
  machinesActive.value.reduce((sum, u) => {
    const cost = Number(u.cost_per_unit || 0)
    const base = Number(u.machine?.base_price || 0)
    const minU = Number(u.machine?.min_units || 0)
    const actU = Number(u.actual_units || 0)
    const charged = minU > 0 ? Math.max(actU, minU) : actU
    return sum + charged * cost + base
  }, 0)
)

const grandTotalEst = computed(() => materialsEstTotal.value + machinesEstTotal.value)
const grandTotalReal = computed(() => materialsRealTotal.value + machinesRealTotal.value)
const grandTotal = grandTotalReal

// ── RealIndicator (unified) ──
function realIndicatorClass(item: any): { cls: string; icon: string | null; tooltip: string } {
  return {
    cls: item._realCls || 'text-color-secondary',
    icon: item._realIcon || null,
    tooltip: '',
  }
}

// ── Lifecycle ──
onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.line-through {
  text-decoration: line-through;
}

/* Pencil icon for inline editing */
.pencil-icon {
  font-size: 0.4rem;
  color: var(--p-text-color);
  vertical-align: sub;
  opacity: 0.4;
  cursor: pointer;
}
.pencil-icon:hover {
  opacity: 0.8;
}

/* r color de fondo ni highlight */
.mobile-card {
  -webkit-tap-highlight-color: transparent !important;
  tap-highlight-color: transparent !important;
  outline: none !important;
  user-select: none !important;
  transition: none !important;
}

.mobile-card:active,
.mobile-card:focus,
.mobile-card:focus-visible,
.mobile-card:hover {
  background-color: inherit !important;
  outline: none !important;
}

:deep(.p-inputnumber) {
  width: 100%;
}

:deep(.p-inputnumber input) {
  width: 100%;
}

/* InputNumber en DataTable inline: limitado a 90px */
:deep(.p-datatable .p-inputnumber) {
  max-width: 90px;
}

/* InputNumber en dialogo: full width */
:deep(.resource-edit-dialog .p-inputnumber) {
  max-width: 100%;
}

/* Textarea en dialogo: full width */
:deep(.resource-edit-dialog textarea) {
  width: 100%;
}

:deep(.p-datatable td) {
  vertical-align: middle;
}

/* Responsive: hide table on mobile, show cards; hide cards on desktop */
.table-wrapper { display: block; }
.mobile-cards { display: none; }
.mobile-totals { display: none; }

.line-through { text-decoration: line-through; }

@media (max-width: 768px) {
  .table-wrapper { display: none; }
  .mobile-cards { display: block; }
  .mobile-totals { display: grid; }
  .desktop-summary { display: none; }

  /* Mobile field rows — font-size > 16px previene zoom automático en iOS */
  .mobile-field {
    min-height: 2.5rem;
  }
  .mobile-label {
    font-size: 0.875rem;
  }
  .mobile-val {
    font-size: 1rem;
  }
  .mobile-field .p-inputnumber,
  .mobile-field .p-inputtext {
    font-size: 16px !important;
    min-height: 2.25rem;
    width: 140px;
  }
  /* touch-action: manipulation elimina retardo 300ms y previene zoom en iOS */
  .mobile-field .p-inputnumber-input,
  .mobile-field .p-inputtext {
    touch-action: manipulation !important;
    font-size: 16px !important;
  }
  /* Inputs en modo edición inline: flexibles */
  .mobile-field .inline-flex .p-inputnumber,
  .mobile-field .inline-flex .p-inputtext {
    width: auto;
    min-width: 80px;
    max-width: 140px;
  }
}
</style>

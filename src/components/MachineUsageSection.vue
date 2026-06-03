<template>
  <Card :class="{ 'shadow-none border-0': compact }">
    <template #title>
      <span v-if="!compact">Equipos y Máquinas</span>
    </template>
    <template #content>
      <!-- Search row -->
      <div class="grid formgrid p-fluid mb-3">
        <div class="field col-12">
          <AutoComplete
            v-model="searchQuery"
            :suggestions="machineResults"
            @complete="searchMachines"
            @option-select="addMachine"
            optionLabel="label"
            placeholder="Buscar equipo o máquina..."
            :disabled="adding"
            :forceSelection="false"
          />
        </div>
      </div>

      <!-- Asset usages table -->
      <DataTable scrollable scrollHeight="flex" :value="usages" size="small" stripedRows class="text-xs w-full">
        <Column header="Equipo" style="min-width:140px">
          <template #body="s">
            <span class="font-medium">{{ s.data.machine?.name || 'Equipo #'+s.data.machine_id }}</span>
            <span v-if="s.data.machine?.code" class="text-color-secondary ml-1">({{ s.data.machine.code }})</span>
            <div v-if="s.data.machine?.assetType" class="text-color-secondary text-[10px]">
              {{ s.data.machine.assetType?.name || s.data.machine.asset_type_code || '—' }}
            </div>
          </template>
        </Column>
        <Column header="Est." style="min-width:60px">
          <template #body="s">
            <div class="inline-flex align-items-center gap-1">
              <InputNumber
                v-if="editingRow === s.data.id && editingField === 'estimated_units'"
                v-model="s.data.estimated_units"
                :min="0" :step="0.5" :minFractionDigits="1" :maxFractionDigits="4" size="small" class="w-full"
                @keydown.enter="saveInline(s.data)"
                @keydown.escape="cancelInline()"
                autofocus
              />
              <span v-else
                class="text-primary cursor-pointer hover:underline"
                @dblclick="startInline(s.data, 'estimated_units')"
              >{{ Number(s.data.estimated_units || 0).toFixed(1) }} <small class="text-color-secondary">{{ unitAbbr(s.data) }}</small></span>
            </div>
          </template>
        </Column>
        <Column header="Real" style="min-width:90px">
          <template #body="s">
            <div class="inline-flex align-items-center gap-1">
              <InputNumber
                v-if="editingRow === s.data.id && editingField === 'actual_units'"
                v-model="s.data.actual_units"
                :min="0" :step="0.5" :minFractionDigits="1" :maxFractionDigits="4" size="small" class="w-full"
                @keydown.enter="saveInline(s.data)"
                @keydown.escape="cancelInline()"
                autofocus
              />
              <template v-else>
                <span
                  :class="realIndicatorClass(s.data).cls"
                  @dblclick="startInline(s.data, 'actual_units')"
                  class="cursor-pointer hover:underline"
                >{{ Number(s.data.actual_units || 0).toFixed(1) }} <small class="text-color-secondary">{{ unitAbbr(s.data) }}</small></span>
                <i v-if="realIndicatorClass(s.data).icon" :class="realIndicatorClass(s.data).icon + ' !text-[10px]'"></i>
              </template>
            </div>
          </template>
        </Column>
        <Column header="Dif." style="width:40px">
          <template #body="s">
            <span :class="diffClass(getDiff(s.data))">{{ formatDiff(getDiff(s.data)) }} <small class="text-color-secondary">{{ unitAbbr(s.data) }}</small></span>
          </template>
        </Column>
        <Column header="Tarifa/U." style="min-width:60px">
          <template #body="s">
            <span>${{ Number(s.data.cost_per_unit || 0).toFixed(2) }}</span>
          </template>
        </Column>
        <Column header="Precio Base" style="min-width:60px">
          <template #body="s">
            <span>${{ Number(s.data.machine?.base_price || 0).toFixed(2) }}</span>
          </template>
        </Column>
        <Column header="Total Est." style="min-width:70px">
          <template #body="s">
            <div :class="isBelowMin(s.data, 'est') ? 'bg-red-100 px-2 py-1 rounded' : 'px-2 py-1 rounded'">
              <span class="text-color-secondary font-medium">${{ machineEstTotal(s.data).toFixed(2) }}</span>
              <div v-if="s.data.machine?.min_units" class="text-[10px] leading-tight">
                <span class="text-color-secondary">{{ machineCalcTooltipParts(s.data, 'est').calc }}</span>
                <span v-if="machineCalcTooltipParts(s.data, 'est').minNote" class="text-amber-500"> {{ machineCalcTooltipParts(s.data, 'est').minNote }}</span>
              </div>
            </div>
          </template>
        </Column>
        <Column header="Total Real" style="min-width:70px">
          <template #body="s">
            <div :class="getTotalClass(s.data)">
              <span class="font-semibold">${{ machineRealTotal(s.data).toFixed(2) }}</span>
              <div v-if="s.data.machine?.min_units" class="text-[10px] leading-tight">
                <span class="text-color-secondary">{{ machineCalcTooltipParts(s.data, 'real').calc }}</span>
                <span v-if="machineCalcTooltipParts(s.data, 'real').minNote" class="text-amber-500"> {{ machineCalcTooltipParts(s.data, 'real').minNote }}</span>
              </div>
            </div>
          </template>
        </Column>
        <Column header="Descripción" style="min-width:120px">
          <template #body="s">
            <div class="inline-flex align-items-center gap-1">
              <InputText
                v-if="editingRow === s.data.id && editingField === 'description'"
                v-model="s.data.description"
                size="small" class="w-full"
                @keydown.enter="saveInline(s.data)"
                @keydown.escape="cancelInline()"
                autofocus
              />
              <span v-else
                class="text-color-secondary cursor-pointer hover:underline"
                @dblclick="startInline(s.data, 'description')"
              >{{ s.data.description || '✎ añadir descripción' }}</span>
            </div>
          </template>
        </Column>
        <Column header="" style="width:50px">
          <template #body="s">
            <div class="flex gap-0.5">
              <Button v-if="editingRow === s.data.id"
                icon="pi pi-check" text rounded size="small" severity="success"
                @click="saveInline(s.data)" v-tooltip.left="'Confirmar'"
              />
              <Button v-if="editingRow === s.data.id"
                icon="pi pi-times" text rounded size="small"
                @click="cancelInline()" v-tooltip.left="'Cancelar'"
              />
              <Button v-if="editingRow !== s.data.id"
                icon="pi pi-trash" text rounded size="small" severity="danger"
                @click="deleteUsage(s.data)" v-tooltip.left="'Eliminar'"
              />
            </div>
          </template>
        </Column>
      </DataTable>

      <div v-if="!usages.length" class="text-color-secondary text-sm py-2">Sin equipos registrados</div>

      <!-- Summary -->
      <div v-if="usages.length" class="flex justify-end gap-6 mt-3 pt-3 border-t text-sm">
        <div class="text-right">
          <div class="text-color-secondary">Total Estimado:</div>
          <strong>${{ machinesEstTotal.toFixed(2) }}</strong>
        </div>
        <div class="text-right">
          <div class="text-color-secondary">Total Real:</div>
          <strong>${{ machinesRealTotal.toFixed(2) }}</strong>
        </div>
        <div class="text-right">
          <div class="text-color-secondary">Subtotal equipos:</div>
          <strong>${{ machinesTotal.toFixed(2) }}</strong>
        </div>
        <div class="text-right">
          <div class="text-color-secondary">Items:</div>
          <strong>{{ usages.length }}</strong>
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
            <div class="w-2 h-2 rounded-full mt-1 shrink-0" style="background-color: #6b7280" />
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

interface MachineUsageItem {
  id: number
  machine_id: number
  estimated_units: number
  actual_units: number
  cost_per_unit: number
  total_cost: number
  description: string | null
  created_at: string
  machine?: {
    id: number
    name: string
    code: string | null
    asset_type_code: string | null
    assetType?: { name: string }
    brand_relation?: { name: string }
    brand?: string
    min_units: number | null
    base_price: number
    work_unit?: { id: number; code: string; abbreviation: string }
  }
  [key: string]: any
}

const props = defineProps<{
  workOrderId: number
  compact?: boolean
  hideAudit?: boolean
}>()

const usages = ref<MachineUsageItem[]>([])
const auditLogs = ref<any[]>([])
const loading = ref(false)
const adding = ref(false)

// Audit log collapsible
const SHOW_MAX = 3
const auditExpanded = ref(false)
const visibleAuditLogs = computed(() =>
  auditExpanded.value ? auditLogs.value : auditLogs.value.slice(0, SHOW_MAX)
)

function auditLogText(log: any): string {
  const user = log.changed_by?.name || 'Sistema'
  const machineName = log.usage?.machine?.name || log.old_text || `Equipo #${log.machine_usage_id}`

  switch (log.field) {
    case 'created':
      return `${user} agregó ${machineName}`
    case 'deleted':
      return `${user} eliminó ${machineName}`
    case 'actual_units':
      return `${user} cambió unidades reales de ${machineName}: ${log.old_value ?? 0} → ${log.new_value ?? 0}`
    case 'estimated_units':
      return `${user} cambió unidades estimadas de ${machineName}: ${log.old_value ?? 0} → ${log.new_value ?? 0}`
    case 'description':
      return `${user} cambió descripción de ${machineName}`
    default:
      return `${user} modificó ${log.field} de ${machineName}`
  }
}

function formatDateTime(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

// Inline editing
const editingRow = ref<number | null>(null)
const editingField = ref<string | null>(null)
const editBackup = ref<MachineUsageItem | null>(null)

// Machine search
const searchQuery = ref('')
const machineResults = ref<{ label: string; doc: string; id: number }[]>([])

function unitAbbr(item: MachineUsageItem): string {
  return item.machine?.work_unit?.abbreviation || 'h'
}

function machineEstTotal(usage: MachineUsageItem): number {
  const base = Number(usage.machine?.base_price || 0)
  const rate = Number(usage.cost_per_unit || 0)
  const units = Number(usage.estimated_units || 0)
  const min = Number(usage.machine?.min_units || 0)
  const billable = min > 0 ? Math.max(units, min) : units
  return base + rate * billable
}

function machineRealTotal(usage: MachineUsageItem): number {
  const base = Number(usage.machine?.base_price || 0)
  const rate = Number(usage.cost_per_unit || 0)
  const units = Number(usage.actual_units || 0)
  const min = Number(usage.machine?.min_units || 0)
  const billable = min > 0 ? Math.max(units, min) : units
  return base + rate * billable
}

function machineSaleTotal(usage: MachineUsageItem): number {
  return machineRealTotal(usage) || machineEstTotal(usage)
}

function machineCalcTooltipParts(usage: MachineUsageItem, mode: 'est' | 'real' = 'real'): { calc: string; minNote: string } {
  const base = Number(usage.machine?.base_price || 0)
  const rate = Number(usage.cost_per_unit || 0)
  const units = mode === 'est' ? Number(usage.estimated_units || 0) : Number(usage.actual_units || 0)
  const min = Number(usage.machine?.min_units || 0)
  const billable = min > 0 ? Math.max(units, min) : units
  const abbr = unitAbbr(usage)
  const parts = []
  if (base > 0) parts.push(`Base $${base.toFixed(2)}`)
  parts.push(`${rate.toFixed(2)} × ${billable}${abbr}`)
  let minNote = ''
  if (min > 0 && units < min) {
    minNote = `(mín ${min}${abbr})`
  }
  return { calc: parts.join(' + '), minNote }
}

function isBelowMin(usage: MachineUsageItem, mode: 'est' | 'real' = 'real'): boolean {
  const min = Number(usage.machine?.min_units || 0)
  if (min <= 0) return false
  const units = mode === 'est' ? Number(usage.estimated_units || 0) : Number(usage.actual_units || 0)
  return units < min
}

function getTotalClass(usage: MachineUsageItem): string {
  const cls = 'px-2 py-1 rounded'
  return isBelowMin(usage) ? cls + ' bg-red-100' : cls
}

const machinesEstTotal = computed(() =>
  usages.value.reduce((sum, u) => sum + machineEstTotal(u), 0)
)

const machinesRealTotal = computed(() =>
  usages.value.reduce((sum, u) => sum + machineRealTotal(u), 0)
)

const machinesTotal = computed(() =>
  usages.value.reduce((sum, u) => sum + machineSaleTotal(u), 0)
)

function getDiff(item: MachineUsageItem): number {
  const est = Number(item.estimated_units || 0)
  const real = Number(item.actual_units || 0)
  return real - est
}

function formatDiff(diff: number): string {
  const sign = diff >= 0 ? '+' : ''
  return `${sign}${diff.toFixed(1)}`
}

function diffClass(diff: number): string {
  if (diff > 0) return 'text-red-500 font-medium'
  if (diff < 0) return 'text-green-600 font-medium'
  return 'text-color-secondary'
}

function realIndicatorClass(item: MachineUsageItem): { cls: string; icon: string | null; tooltip: string } {
  const real = Number(item.actual_units || 0)
  const est = Number(item.estimated_units || 0)
  const diff = real - est
  if (Math.abs(diff) < 0.01) return { cls: 'text-green-600', icon: 'pi pi-check-circle text-green-600', tooltip: 'Coincide con el estimado' }
  if (diff > 0) return { cls: 'text-orange-500', icon: 'pi pi-arrow-up text-orange-500', tooltip: `${diff.toFixed(1)} más que el estimado` }
  return { cls: 'text-purple-600', icon: 'pi pi-arrow-down text-purple-600', tooltip: `${Math.abs(diff).toFixed(1)} menos que el estimado` }
}

async function fetchData() {
  loading.value = true
  try {
    const [usageRes, auditRes] = await Promise.all([
      api.get(`/work-orders/${props.workOrderId}/machine-usages`),
      api.get(`/work-orders/${props.workOrderId}/machine-usage-audit-logs`),
    ])
    const raw = usageRes.data.data || usageRes.data || []
    usages.value = Array.isArray(raw) ? [...raw] : []
    const logRaw = auditRes.data.data || auditRes.data || []
    auditLogs.value = Array.isArray(logRaw) ? [...logRaw] : []
  } catch (e) {
    console.error('Failed to load usages', e)
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los equipos', life: 5000 })
  } finally {
    loading.value = false
  }
}

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
    searchQuery.value = ''
    machineResults.value = []
    return
  }

  adding.value = true
  try {
    await api.post(`/work-orders/${props.workOrderId}/machine-usages`, {
      machine_id: machineId,
      actual_units: 0,
      estimated_units: 1.0,
    })
    searchQuery.value = ''
    machineResults.value = []
    await fetchData()
    toast.add({ severity: 'success', summary: 'Agregado', detail: 'Equipo agregado correctamente', life: 3000 })
  } catch (err: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: err.response?.data?.message || 'Error al agregar equipo', life: 5000 })
  } finally {
    adding.value = false
  }
}

function startInline(item: MachineUsageItem, field: string) {
  editingRow.value = item.id
  editingField.value = field
  editBackup.value = { ...item }
}

function cancelInline() {
  if (editingRow.value && editBackup.value) {
    const idx = usages.value.findIndex(u => u.id === editingRow.value)
    if (idx !== -1) {
      usages.value[idx] = { ...editBackup.value }
    }
  }
  editingRow.value = null
  editingField.value = null
  editBackup.value = null
}

async function saveInline(item: MachineUsageItem) {
  const field = editingField.value
  editingRow.value = null
  editingField.value = null
  editBackup.value = null

  const payload: Record<string, any> = {}
  payload[field!] = item[field!]

  try {
    await api.put(`/work-orders/${props.workOrderId}/machine-usages/${item.id}`, payload)
    await fetchData()
    toast.add({ severity: 'success', summary: 'Guardado', detail: 'Uso de equipo actualizado', life: 3000 })
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'Error al guardar', life: 5000 })
  }
}

async function deleteUsage(item: MachineUsageItem) {
  try {
    await api.delete(`/work-orders/${props.workOrderId}/machine-usages/${item.id}`)
    await fetchData()
    toast.add({ severity: 'success', summary: 'Eliminado', detail: 'Uso de equipo eliminado', life: 3000 })
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'Error al eliminar', life: 5000 })
  }
}

onMounted(() => {
  fetchData()
})
</script>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getAllAccounts, deleteChartOfAccount, type ChartOfAccount } from '@/api/chartOfAccounts'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Tag from 'primevue/tag'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Dialog from 'primevue/dialog'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'

const router = useRouter()
const accounts = ref<ChartOfAccount[]>([])
const loading = ref(true)
const search = ref('')
const typeFilter = ref<string | null>(null)
const deleteDialog = ref(false)
const deletingId = ref<number | null>(null)
const error = ref('')

// ── Tree state ──
const expanded = ref<Set<string>>(new Set())

// Build parent_id → sorted children map from ALL accounts
const treeMap = computed(() => {
  const map = new Map<number | null, ChartOfAccount[]>()
  for (const acc of accounts.value) {
    const key = acc.parent_id
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(acc)
  }
  for (const [, children] of map) {
    children.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
  }
  return map
})

const roots = computed(() => treeMap.value.get(null) ?? [])

function toggleExpand(code: string) {
  const next = new Set(expanded.value)
  if (next.has(code)) next.delete(code)
  else next.add(code)
  expanded.value = next
}

function expandAll() {
  const all = new Set<string>()
  function walk(list: ChartOfAccount[]) {
    for (const acc of list) {
      const children = treeMap.value.get(acc.id)
      if (children && children.length > 0) {
        all.add(acc.code)
        walk(children)
      }
    }
  }
  walk(roots.value)
  expanded.value = all
}

function collapseAll() {
  expanded.value = new Set()
}

function hasChildren(acc: ChartOfAccount): boolean {
  return (treeMap.value.get(acc.id)?.length ?? 0) > 0
}

function isExpanded(code: string): boolean {
  return expanded.value.has(code)
}

const allExpanded = computed(() => {
  // Check if every node that has children is expanded
  for (const acc of accounts.value) {
    const children = treeMap.value.get(acc.id)
    if (children && children.length > 0 && !expanded.value.has(acc.code)) {
      return false
    }
  }
  return accounts.value.length > 0
})

// Flat visible list respecting tree expand/collapse
const treeAccounts = computed(() => {
  const result: ChartOfAccount[] = []
  function walk(list: ChartOfAccount[]) {
    for (const acc of list) {
      result.push(acc)
      if (expanded.value.has(acc.code)) {
        const children = treeMap.value.get(acc.id)
        if (children) walk(children)
      }
    }
  }
  walk(roots.value)
  return result
})

// Apply search/type filters on top of tree visibility
const displayAccounts = computed(() => {
  let result = treeAccounts.value
  if (search.value) {
    const s = search.value.toLowerCase()
    result = result.filter(a => a.code.toLowerCase().includes(s) || a.name.toLowerCase().includes(s))
  }
  if (typeFilter.value) {
    result = result.filter(a => a.type === typeFilter.value)
  }
  return result
})

// ── Type helpers ──
const typeOptions = [
  { label: 'Todos', value: null },
  { label: 'Activo', value: 'asset' },
  { label: 'Pasivo', value: 'liability' },
  { label: 'Patrimonio', value: 'equity' },
  { label: 'Ingresos', value: 'income' },
  { label: 'Gastos', value: 'expense' },
  { label: 'Costos', value: 'cost' },
]

const typeLabels: Record<string, string> = {
  asset: 'Activo', liability: 'Pasivo', equity: 'Patrimonio',
  income: 'Ingresos', expense: 'Gastos', cost: 'Costos',
}

const typeColors: Record<string, string> = {
  asset: 'info', liability: 'warn', equity: 'contrast',
  income: 'success', expense: 'danger', cost: 'warn',
}

const balanceLabels: Record<string, string> = { debit: 'Deudor', credit: 'Acreedor' }

// ── API ──
async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await getAllAccounts()
    accounts.value = res.data ?? []
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Error al cargar cuentas'
  } finally {
    loading.value = false
  }
}

function confirmDelete(id: number) {
  deletingId.value = id
  deleteDialog.value = true
}

async function doDelete() {
  if (!deletingId.value) return
  try {
    await deleteChartOfAccount(deletingId.value)
    deleteDialog.value = false
    deletingId.value = null
    await load()
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Error al eliminar'
    deleteDialog.value = false
  }
}

function goNew() { router.push('/accounting/chart-of-accounts/new') }
function goEdit(id: number) { router.push(`/accounting/chart-of-accounts/${id}/edit`) }

onMounted(load)
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-6">
    <div class="flex items-center justify-between flex-wrap gap-y-2">
      <h1 class="text-2xl font-bold text-gray-800">Plan de Cuentas</h1>
      <div class="flex items-center gap-2">
        <Button
          :icon="allExpanded ? 'pi pi-angle-double-up' : 'pi pi-angle-double-down'"
          :label="allExpanded ? 'Colapsar todo' : 'Expandir todo'"
          severity="secondary" size="small" class="hidden md:inline-flex"
          @click="allExpanded ? collapseAll() : expandAll()"
        />
        <Button label="Nueva Cuenta" icon="pi pi-plus" @click="goNew" />
      </div>
    </div>

    <!-- Expand/collapse buttons for mobile -->
    <div class="flex gap-2 md:hidden">
      <Button
        :icon="allExpanded ? 'pi pi-angle-double-up' : 'pi pi-angle-double-down'"
        :label="allExpanded ? 'Colapsar' : 'Expandir todo'"
        severity="secondary" size="small" @click="allExpanded ? collapseAll() : expandAll()"
      />
      <Button icon="pi pi-refresh" severity="secondary" size="small" @click="load" />
    </div>

    <Message v-if="error" severity="error" :closable="true" @close="error = ''">{{ error }}</Message>

    <Card>
      <template #content>
        <div class="grid grid-cols-12 gap-3 mb-4">
          <div class="col-span-12 md:col-span-7">
            <InputText v-model="search" placeholder="Buscar por código o nombre..." class="w-full" />
          </div>
          <div class="col-span-8 md:col-span-4">
            <Select v-model="typeFilter" :options="typeOptions" option-label="label" option-value="value"
              placeholder="Filtrar por tipo" class="w-full" />
          </div>
          <div class="col-span-4 md:col-span-1 hidden md:block">
            <Button icon="pi pi-refresh" severity="secondary" class="w-full" @click="load" />
          </div>
        </div>

        <ProgressSpinner v-if="loading" class="block mx-auto" />

        <!-- Desktop: DataTable -->
        <div class="hidden md:block">
          <DataTable v-if="!loading" :value="displayAccounts" scrollable scrollHeight="flex"
            striped-rows class="text-sm">
            <Column field="code" header="Código" style="min-width:100px">
              <template #body="{ data }">
                <span class="font-mono text-xs">{{ data.code }}</span>
              </template>
            </Column>
            <Column field="name" header="Nombre" style="min-width:200px">
              <template #body="{ data }">
                <span :style="{ marginLeft: (data.level - 1) * 16 + 'px' }" class="flex items-center gap-1">
                  <button
                    v-if="hasChildren(data)"
                    type="button"
                    class="w-4 h-4 flex items-center justify-center p-0 border-0 bg-transparent cursor-pointer text-gray-500 hover:text-gray-800 shrink-0"
                    @click="toggleExpand(data.code)"
                  >
                    <i :class="isExpanded(data.code) ? 'pi pi-chevron-down' : 'pi pi-chevron-right'" class="text-xs" />
                  </button>
                  <span v-else class="w-4 shrink-0"></span>
                  <span v-if="data.level === 1" class="font-bold">{{ data.name }}</span>
                  <span v-else-if="data.level === 2" class="font-semibold">{{ data.name }}</span>
                  <span v-else>{{ data.name }}</span>
                </span>
              </template>
            </Column>
            <Column field="type" header="Tipo" style="min-width:110px">
              <template #body="{ data }">
                <Tag :severity="typeColors[data.type] as any" :value="typeLabels[data.type]" />
              </template>
            </Column>
            <Column field="normal_balance" header="Saldo" style="min-width:80px">
              <template #body="{ data }">
                <span class="text-xs">{{ balanceLabels[data.normal_balance] || data.normal_balance }}</span>
              </template>
            </Column>
            <Column field="level" header="Nivel" style="min-width:60px">
              <template #body="{ data }">
                <Tag :value="data.level" severity="info" />
              </template>
            </Column>
            <Column header="Activa" style="min-width:70px">
              <template #body="{ data }">
                <i :class="data.is_active ? 'pi pi-check text-green-500' : 'pi pi-times text-red-400'" />
              </template>
            </Column>
            <Column header="" style="width:100px">
              <template #body="{ data }">
                <div class="flex gap-1">
                  <Button icon="pi pi-pencil" severity="secondary" text rounded size="small" @click="goEdit(data.id)" />
                  <Button icon="pi pi-trash" severity="danger" text rounded size="small" @click="confirmDelete(data.id)" />
                </div>
              </template>
            </Column>
          </DataTable>
        </div>

        <!-- Mobile: cards -->
        <div v-if="!loading" class="block md:hidden space-y-2">
          <div v-for="acc in displayAccounts" :key="acc.id" class="border border-surface-200 rounded p-3" @click="goEdit(acc.id)">
            <div class="flex items-start justify-between gap-2">
              <span class="font-mono text-sm font-medium">{{ acc.code }}</span>
              <i :class="acc.is_active ? 'pi pi-check text-green-500' : 'pi pi-times text-red-400'" />
            </div>
            <div :style="{ marginLeft: (acc.level - 1) * 12 + 'px' }" class="text-sm mt-1 flex items-center gap-1">
              <button
                v-if="hasChildren(acc)"
                type="button"
                class="w-4 h-4 flex items-center justify-center p-0 border-0 bg-transparent cursor-pointer text-gray-500 hover:text-gray-800 shrink-0"
                @click.stop="toggleExpand(acc.code)"
              >
                <i :class="isExpanded(acc.code) ? 'pi pi-chevron-down' : 'pi pi-chevron-right'" class="text-xs" />
              </button>
              <span v-else class="w-4 shrink-0"></span>
              <span v-if="acc.level === 1" class="font-semibold">{{ acc.name }}</span>
              <span v-else>{{ acc.name }}</span>
            </div>
            <div class="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 mt-1">
              <Tag :severity="typeColors[acc.type] as any" :value="typeLabels[acc.type]" size="small" />
              <span>Saldo: {{ balanceLabels[acc.normal_balance] || acc.normal_balance }}</span>
              <Tag :value="'Nivel ' + acc.level" severity="info" size="small" />
            </div>
            <div class="flex gap-1 mt-1">
              <Button icon="pi pi-pencil" severity="secondary" text rounded size="small" @click.stop="goEdit(acc.id)" />
              <Button icon="pi pi-trash" severity="danger" text rounded size="small" @click.stop="confirmDelete(acc.id)" />
            </div>
          </div>
          <div v-if="!displayAccounts.length" class="text-center text-gray-400 py-4 text-sm">
            No hay cuentas contables
          </div>
        </div>
      </template>
    </Card>

    <Dialog v-model:visible="deleteDialog" header="Confirmar eliminación" :modal="true"
      :style="{ width: '95vw', maxWidth: '500px' }">
      <p class="text-gray-600 mb-4">¿Estás seguro de eliminar esta cuenta contable?</p>
      <div class="flex justify-end gap-2">
        <Button label="Cancelar" severity="secondary" @click="deleteDialog = false" />
        <Button label="Eliminar" severity="danger" @click="doDelete" />
      </div>
    </Dialog>
  </div>
</template>

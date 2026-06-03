<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getJournalEntries, deleteJournalEntry, postJournalEntry, type JournalEntry } from '@/api/journalEntries'
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
const entries = ref<JournalEntry[]>([])
const loading = ref(true)
const search = ref('')
const statusFilter = ref<string | null>(null)
const deleteDialog = ref(false)
const postDialog = ref(false)
const selectedEntry = ref<JournalEntry | null>(null)
const error = ref('')
const paginator = ref({ page: 1, total: 0, perPage: 15 })

const typeLabels: Record<string, string> = {
  sales: 'Ventas', purchases: 'Compras', costs: 'Costos',
  expenses: 'Gastos', adjustments: 'Ajustes', opening: 'Apertura', closing: 'Cierre',
}

const typeOptions = [
  { label: 'Todos', value: null },
  { label: 'Ventas', value: 'sales' },
  { label: 'Compras', value: 'purchases' },
  { label: 'Costos', value: 'costs' },
  { label: 'Gastos', value: 'expenses' },
  { label: 'Ajustes', value: 'adjustments' },
  { label: 'Apertura', value: 'opening' },
  { label: 'Cierre', value: 'closing' },
]

const statusOptions = [
  { label: 'Todos', value: null },
  { label: 'Borrador', value: 'draft' },
  { label: 'Contabilizado', value: 'posted' },
]

async function load() {
  loading.value = true
  error.value = ''
  try {
    const params: Record<string, any> = { per_page: paginator.value.perPage, page: paginator.value.page }
    if (search.value) params.search = search.value
    if (statusFilter.value) params.status = statusFilter.value
    const res = await getJournalEntries(params)
    entries.value = res.data?.data ?? []
    paginator.value.total = res.data?.total ?? 0
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Error al cargar asientos'
  } finally {
    loading.value = false
  }
}

function confirmDelete(entry: JournalEntry) {
  selectedEntry.value = entry
  deleteDialog.value = true
}

function confirmPost(entry: JournalEntry) {
  selectedEntry.value = entry
  postDialog.value = true
}

async function doDelete() {
  if (!selectedEntry.value) return
  try {
    await deleteJournalEntry(selectedEntry.value.id)
    deleteDialog.value = false
    selectedEntry.value = null
    await load()
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Error al eliminar'
    deleteDialog.value = false
  }
}

async function doPost() {
  if (!selectedEntry.value) return
  try {
    await postJournalEntry(selectedEntry.value.id)
    postDialog.value = false
    selectedEntry.value = null
    await load()
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Error al contabilizar'
    postDialog.value = false
  }
}

function formatAmount(n: number): string {
  return '$' + Number(n).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function statusLabel(status: string): string {
  return status === 'posted' ? 'Contabilizado' : 'Borrador'
}

function statusSeverity(status: string): string {
  return status === 'posted' ? 'success' : 'warn'
}

function prevPage() {
  if (paginator.value.page > 1) { paginator.value.page--; load() }
}

function nextPage() {
  if (paginator.value.page * paginator.value.perPage < paginator.value.total) { paginator.value.page++; load() }
}

onMounted(load)
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-800">Asientos Contables</h1>
      <Button label="Nuevo Asiento" icon="pi pi-plus" @click="router.push('/accounting/journal-entries/new')" />
    </div>

    <Message v-if="error" severity="error" :closable="true" @close="error = ''">{{ error }}</Message>

    <Card>
      <template #content>
        <div class="grid grid-cols-12 gap-3 mb-4">
          <div class="col-span-12 md:col-span-7">
            <InputText v-model="search" placeholder="Buscar por código o descripción..." class="w-full" @input="load" />
          </div>
          <div class="col-span-7 md:col-span-3">
            <Select v-model="statusFilter" :options="statusOptions" option-label="label" option-value="value"
              placeholder="Estado" class="w-full" @change="load" />
          </div>
          <div class="col-span-5 md:col-span-2">
            <Button icon="pi pi-refresh" severity="secondary" class="w-full" @click="load" />
          </div>
        </div>

        <ProgressSpinner v-if="loading" class="block mx-auto" />

        <!-- Desktop: DataTable -->
        <div class="hidden md:block">
        <DataTable v-if="!loading" :value="entries" scrollable scrollHeight="flex"
          :paginator="paginator.total > paginator.perPage"
          :rows="paginator.perPage" :total-records="paginator.total" lazy
          @page="(e: any) => { paginator.page = e.page + 1; load() }"
          striped-rows class="text-sm">
          <Column field="code" header="Código" style="min-width:130px">
            <template #body="{ data }">
              <span class="font-mono text-xs">{{ data.code }}</span>
            </template>
          </Column>
          <Column field="description" header="Descripción" sortable style="min-width:200px" />
          <Column field="date" header="Fecha" sortable style="min-width:100px">
            <template #body="{ data }">{{ data.date }}</template>
          </Column>
          <Column field="type" header="Tipo" sortable style="min-width:90px">
            <template #body="{ data }">
              <Tag :value="typeLabels[data.type] || data.type" severity="info" />
            </template>
          </Column>
          <Column header="Débito" style="min-width:100px; text-align:right">
            <template #body="{ data }">
              <span class="font-mono text-xs">{{ data.total_debit ? formatAmount(data.total_debit) : '-' }}</span>
            </template>
          </Column>
          <Column header="Crédito" style="min-width:100px; text-align:right">
            <template #body="{ data }">
              <span class="font-mono text-xs">{{ data.total_credit ? formatAmount(data.total_credit) : '-' }}</span>
            </template>
          </Column>
          <Column field="status" header="Estado" style="min-width:90px">
            <template #body="{ data }">
              <Tag :value="statusLabel(data.status)" :severity="statusSeverity(data.status)" />
            </template>
          </Column>
          <Column header="" style="width:120px">
            <template #body="{ data }">
              <div class="flex gap-1">
                <Button v-if="data.status === 'draft'" icon="pi pi-pencil" severity="secondary" text rounded size="small"
                  @click="router.push(`/accounting/journal-entries/${data.id}/edit`)" />
                <Button v-if="data.status === 'draft'" icon="pi pi-check-circle" severity="success" text rounded size="small"
                  @click="confirmPost(data)" />
                <Button icon="pi pi-eye" severity="info" text rounded size="small"
                  @click="router.push(`/accounting/journal-entries/${data.id}/edit`)" />
                <Button v-if="data.status === 'draft'" icon="pi pi-trash" severity="danger" text rounded size="small"
                  @click="confirmDelete(data)" />
              </div>
            </template>
          </Column>
        </DataTable>
        </div>

        <!-- Mobile: cards -->
        <div v-if="!loading" class="block md:hidden space-y-2">
          <div v-for="entry in entries" :key="entry.id" class="border border-surface-200 rounded p-3">
            <div class="flex items-start justify-between gap-2">
              <span class="font-mono text-sm font-medium">{{ entry.code }}</span>
              <Tag :value="statusLabel(entry.status)" :severity="statusSeverity(entry.status)" size="small" />
            </div>
            <div class="text-sm mt-1">{{ entry.description }}</div>
            <div class="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 mt-1">
              <Tag :value="typeLabels[entry.type] || entry.type" severity="info" size="small" />
              <span>{{ entry.date }}</span>
            </div>
            <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs mt-1">
              <span>Débito: <strong>{{ entry.total_debit ? formatAmount(entry.total_debit) : '-' }}</strong></span>
              <span>Crédito: <strong>{{ entry.total_credit ? formatAmount(entry.total_credit) : '-' }}</strong></span>
            </div>
            <div class="flex gap-1 mt-1 pt-1 border-t border-surface-200">
              <Button v-if="entry.status === 'draft'" icon="pi pi-pencil" severity="secondary" text rounded size="small"
                @click.stop="router.push(`/accounting/journal-entries/${entry.id}/edit`)" v-tooltip.left="'Editar'" />
              <Button v-if="entry.status === 'draft'" icon="pi pi-check-circle" severity="success" text rounded size="small"
                @click.stop="confirmPost(entry)" v-tooltip.left="'Contabilizar'" />
              <Button icon="pi pi-eye" severity="info" text rounded size="small"
                @click.stop="router.push(`/accounting/journal-entries/${entry.id}/edit`)" v-tooltip.left="'Ver'" />
              <Button v-if="entry.status === 'draft'" icon="pi pi-trash" severity="danger" text rounded size="small"
                @click.stop="confirmDelete(entry)" v-tooltip.left="'Eliminar'" />
            </div>
          </div>

          <!-- Mobile paginator -->
          <div class="flex items-center justify-between mt-3 gap-2 text-sm">
            <span class="text-gray-500 text-xs" v-if="paginator.total">
              {{ entries.length }} de {{ paginator.total }} asientos
            </span>
            <div class="flex gap-1">
              <Button icon="pi pi-chevron-left" text rounded size="small" :disabled="paginator.page <= 1" @click="prevPage" />
              <span class="flex items-center px-2 text-xs">Pág. {{ paginator.page }}</span>
              <Button icon="pi pi-chevron-right" text rounded size="small"
                :disabled="paginator.page * paginator.perPage >= paginator.total" @click="nextPage" />
            </div>
          </div>

          <div v-if="!entries.length" class="text-center text-gray-400 py-4 text-sm">
            No hay asientos contables
          </div>
        </div>
      </template>
    </Card>

    <!-- Delete dialog -->
    <Dialog v-model:visible="deleteDialog" header="Confirmar eliminación" :modal="true" class="w-96">
      <p class="text-gray-600 mb-4">¿Eliminar el asiento <strong>{{ selectedEntry?.code }}</strong>?</p>
      <div class="flex justify-end gap-2">
        <Button label="Cancelar" severity="secondary" @click="deleteDialog = false" />
        <Button label="Eliminar" severity="danger" @click="doDelete" />
      </div>
    </Dialog>

    <!-- Post dialog -->
    <Dialog v-model:visible="postDialog" header="Contabilizar asiento" :modal="true" class="w-96">
      <p class="text-gray-600 mb-4">¿Contabilizar el asiento <strong>{{ selectedEntry?.code }}</strong>?<br>
      Una vez contabilizado no se podrá modificar.</p>
      <div class="flex justify-end gap-2">
        <Button label="Cancelar" severity="secondary" @click="postDialog = false" />
        <Button label="Contabilizar" severity="success" @click="doPost" />
      </div>
    </Dialog>
  </div>
</template>

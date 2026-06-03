<template>
  <div>
    <div class="page-header">
      <h3>Facturas</h3>
      <router-link to="/invoices/new">
        <Button label="Nueva Factura" icon="pi pi-plus" size="small" />
      </router-link>
    </div>

    <DataTable
      :value="invoices"
      :loading="loading"
      :paginator="true"
      :rows="15"
      :totalRecords="totalRecords"
      :lazy="true"
      @page="onPage"
      @sort="onSort"
      :rowsPerPageOptions="[10, 15, 25, 50]"
      paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
      currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords}"
      scrollable
      scrollHeight="flex"
      class="hidden md:!table"
    >
      <Column field="code" header="Código" sortable frozen class="font-medium"></Column>
      <Column field="client.name" header="Cliente" sortable></Column>
      <Column field="issue_date" header="Emisión" sortable>
        <template #body="{ data }">
          {{ data.issue_date }}
        </template>
      </Column>
      <Column field="subtotal" header="Subtotal" sortable>
        <template #body="{ data }">
          ${{ Number(data.subtotal).toLocaleString('es-EC', { minimumFractionDigits: 2 }) }}
        </template>
      </Column>
      <Column field="iva_amount" header="IVA">
        <template #body="{ data }">
          ${{ Number(data.iva_amount).toLocaleString('es-EC', { minimumFractionDigits: 2 }) }}
        </template>
      </Column>
      <Column field="total" header="Total" sortable>
        <template #body="{ data }">
          <strong>${{ Number(data.total).toLocaleString('es-EC', { minimumFractionDigits: 2 }) }}</strong>
        </template>
      </Column>
      <Column field="status" header="Estado">
        <template #body="{ data }">
          <Tag :value="statusLabel(data.status)" :severity="statusSeverity(data.status)" />
        </template>
      </Column>
      <Column header="Acciones" class="text-center">
        <template #body="{ data }">
          <Button icon="pi pi-eye" text rounded size="small" @click="ver(data.id)" v-tooltip.left="'Ver'" />
          <Button v-if="data.status === 'draft'" icon="pi pi-pencil" text rounded size="small" @click="editar(data.id)" v-tooltip.left="'Editar'" />
          <Button v-if="data.status === 'draft'" icon="pi pi-trash" text rounded size="small" severity="danger" @click="confirmDelete(data)" v-tooltip.left="'Eliminar'" />
        </template>
      </Column>
    </DataTable>

    <!-- Mobile: compact cards -->
    <div class="block md:hidden">
      <div v-for="inv in invoices" :key="inv.id" class="border-1 border-round surface-card p-3 mb-2" @click="ver(inv.id)">
        <div class="flex align-items-start justify-content-between gap-2">
          <span class="font-medium text-sm">{{ inv.code }}</span>
          <Tag :value="statusLabel(inv.status)" :severity="statusSeverity(inv.status)" size="small" />
        </div>
        <div class="text-xs text-color-secondary mt-1">{{ inv.client?.name }}</div>
        <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-color-secondary mt-2">
          <span>Emisión: <strong>{{ inv.issue_date }}</strong></span>
          <span>Subtotal: <strong>${{ Number(inv.subtotal).toLocaleString('es-EC', { minimumFractionDigits: 2 }) }}</strong></span>
          <span>IVA: <strong>${{ Number(inv.iva_amount).toLocaleString('es-EC', { minimumFractionDigits: 2 }) }}</strong></span>
        </div>
        <div class="flex justify-content-end mt-1 pt-1 border-top-1 surface-border">
          <span class="font-semibold text-sm">Total: ${{ Number(inv.total).toLocaleString('es-EC', { minimumFractionDigits: 2 }) }}</span>
        </div>
        <div class="flex gap-1 mt-1" v-if="inv.status === 'draft'">
          <Button icon="pi pi-pencil" text rounded size="small" @click.stop="editar(inv.id)" v-tooltip.left="'Editar'" />
          <Button icon="pi pi-trash" text rounded size="small" severity="danger" @click.stop="confirmDelete(inv)" v-tooltip.left="'Eliminar'" />
        </div>
      </div>

      <!-- Mobile paginator info -->
      <div class="flex justify-content-between align-items-center mt-3 gap-2 text-sm">
        <span class="text-color-secondary text-xs" v-if="totalRecords">
          {{ invoices.length }} de {{ totalRecords }} facturas
        </span>
        <div class="flex gap-1">
          <Button icon="pi pi-chevron-left" text rounded size="small" :disabled="page <= 1" @click="prevPage" />
          <span class="flex align-items-center px-2 text-xs">Pág. {{ page }}</span>
          <Button icon="pi pi-chevron-right" text rounded size="small" :disabled="page * 15 >= totalRecords" @click="nextPage" />
        </div>
      </div>
    </div>

    <Toast />
    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import api from '@/api/client'

const router = useRouter()
const confirm = useConfirm()
const toast = useToast()

const invoices = ref([])
const loading = ref(false)
const totalRecords = ref(0)
const page = ref(1)
const sortField = ref('created_at')
const sortOrder = ref('desc')

function statusSeverity(status: string): string {
  const map: Record<string, string> = {
    draft: 'info',
    issued: 'success',
    paid: 'primary',
    cancelled: 'danger',
    voided: 'secondary',
  }
  return map[status] || 'info'
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    draft: 'Borrador',
    issued: 'Emitida',
    paid: 'Pagada',
    cancelled: 'Anulada',
    voided: 'Sin efecto',
  }
  return map[status] || status
}

async function loadInvoices() {
  loading.value = true
  try {
    const res = await api.get('/invoices', {
      params: {
        page: page.value,
        sort_field: sortField.value,
        sort_order: sortOrder.value,
        per_page: 15,
      }
    })
    invoices.value = res.data.data.data || res.data.data
    totalRecords.value = res.data.data.total || invoices.value.length
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las facturas', life: 3000 })
  } finally {
    loading.value = false
  }
}

function onPage(event: any) {
  page.value = event.page + 1
  loadInvoices()
}

function onSort(event: any) {
  if (event.sortField) {
    sortField.value = event.sortField
    sortOrder.value = event.sortOrder === 1 ? 'asc' : 'desc'
    loadInvoices()
  }
}

function prevPage() {
  if (page.value > 1) {
    page.value--
    loadInvoices()
  }
}

function nextPage() {
  if (page.value * 15 < totalRecords.value) {
    page.value++
    loadInvoices()
  }
}

function ver(id: number) {
  router.push(`/invoices/${id}`)
}

function editar(id: number) {
  router.push(`/invoices/${id}/edit`)
}

function confirmDelete(data: any) {
  confirm.require({
    message: `¿Eliminar factura ${data.code}?`,
    header: 'Confirmar',
    icon: 'pi pi-exclamation-triangle',
    accept: async () => {
      try {
        await api.delete(`/invoices/${data.id}`)
        toast.add({ severity: 'success', summary: 'Eliminada', detail: 'Factura eliminada', life: 3000 })
        loadInvoices()
      } catch (e: any) {
        toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'Error al eliminar', life: 3000 })
      }
    }
  })
}

onMounted(loadInvoices)
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}
.page-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}
</style>

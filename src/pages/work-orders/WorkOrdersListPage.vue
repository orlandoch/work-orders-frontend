<template>
  <div class="workorders-page">
    <!-- Desktop/tablet table -->
    <div class="table-wrapper">
      <div class="page-header">
        <Button label="Nueva Orden" icon="pi pi-plus" @click="$router.push('/work-orders/new')" />
      </div>
      <DataTable scrollable scrollHeight="flex" :value="items" :loading="loading" paginator :rows="15" stripedRows sortField="created_at" :sortOrder="-1"
        @row-click="rowClick" dataKey="id" class="text-sm workorders-table">
        <Column field="code" header="Código" sortable />
        <Column field="title" header="Título" sortable />
        <Column field="status" header="Estado" sortable>
          <template #body="{data}">
            <Tag :value="statusLabel(data)" :severity="statusSev(data)" />
          </template>
        </Column>
        <Column field="client" header="Cliente" sortable>
          <template #body="{data}">{{ data.client?.name || data.client_name || '-' }}</template>
        </Column>
        <Column field="equipment" header="Equipo" sortable>
          <template #body="{data}">{{ data.equipment?.name || data.equipment_name || '-' }}</template>
        </Column>
        <Column field="scheduled_date" header="Programado" sortable>
          <template #body="{data}">{{ data.scheduled_date || '-' }}</template>
        </Column>
        <Column header="" style="width:50px">
          <template #body="{data}">
            <Button icon="pi pi-pencil" text rounded @click.stop="$router.push(`/work-orders/${data.id}/edit`)" />
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- ========== CARDS: mobile (<768px) ========== -->
    <div class="mobile-cards">
      <div v-if="loading" class="text-center py-6">
        <i class="pi pi-spin pi-spinner text-2xl text-gray-400" />
      </div>
      <Card v-for="item in items.filter(Boolean)" :key="item.id" class="mb-2 cursor-pointer" @click="rowClick({ data: item })">
        <template #content>
          <div class="flex justify-between items-start mb-2">
            <div>
              <span class="font-semibold text-primary">{{ item.code }}</span>
              <div class="text-sm font-medium">{{ item.title }}</div>
            </div>
            <Tag :value="statusLabel(item)" :severity="statusSev(item)" />
          </div>
          <div class="card-rows">
            <div class="card-row">
              <span class="card-lbl">Cliente</span>
              <span class="card-val">{{ item.client?.name || item.client_name || '-' }}</span>
            </div>
            <div class="card-row">
              <span class="card-lbl">Equipo</span>
              <span class="card-val">{{ item.equipment?.name || item.equipment_name || '-' }}</span>
            </div>
            <div class="card-row">
              <span class="card-lbl">Programado</span>
              <span class="card-val">{{ item.scheduled_date || '-' }}</span>
            </div>
          </div>
          <div class="flex justify-end mt-2">
            <Button icon="pi pi-pencil" text rounded size="small" @click.stop="$router.push(`/work-orders/${item.id}/edit`)" />
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api/client'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Card from 'primevue/card'
import Button from 'primevue/button'

const router = useRouter()
const items = ref<any[]>([])
const loading = ref(false)

const statuses: Record<string, { label: string; sev: 'info' | 'warn' | 'success' | 'danger' | 'secondary' | 'contrast' }> = {
  draft: { label: 'Borrador', sev: 'info' },
  pending: { label: 'Pendiente', sev: 'warn' },
  in_progress: { label: 'En Progreso', sev: 'success' },
  completed: { label: 'Completado', sev: 'secondary' },
  canceled: { label: 'Cancelado', sev: 'danger' },
}

function statusLabel(d: any) {
  const s = d.status?.code || d.status
  return statuses[s]?.label || s
}

function statusSev(d: any) {
  const s = d.status?.code || d.status
  return statuses[s]?.sev || 'info'
}

function rowClick(e: any) {
  router.push(`/work-orders/${e.data.id}`)
}

async function fetchItems() {
  loading.value = true
  try {
    const { data } = await api.get('/work-orders')
    items.value = data?.data?.data || data?.data || data || []
  } catch (e) {
    console.error('Failed to fetch work orders', e)
  } finally {
    loading.value = false
  }
}

onMounted(fetchItems)
</script>

<style scoped>
.workorders-page {
  max-width: 100%;
}
.table-wrapper {
  overflow-x: auto;
}
.page-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1rem;
}

/* Desktop: row-click affordance */
@media (hover: hover) {
  .workorders-table :deep(.p-datatable-tbody tr) {
    cursor: pointer;
  }
  .workorders-table :deep(.p-datatable-tbody tr:hover) {
    background-color: var(--p-surface-100) !important;
  }
}
.mobile-cards {
  display: none;
}
.card-rows {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.card-row {
  display: flex;
  gap: 0.5rem;
  font-size: 0.8rem;
}
.card-lbl {
  color: var(--p-text-muted-color, #6b7280);
  min-width: 6rem;
  flex-shrink: 0;
}
.card-val {
  font-weight: 500;
}

/* Mobile: hide table, show cards */
@media (max-width: 768px) {
  .table-wrapper {
    display: none;
  }
  .mobile-cards {
    display: block;
  }
}
</style>

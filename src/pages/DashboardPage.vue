<template>
  <div class="grid p-fluid">
    <!-- Stats cards: 1 col mobile, 2 tablet, 4 desktop -->
    <div v-for="stat in stats" :key="stat.label" class="col-12 md:col-6 lg:col-3">
      <Card style="margin-bottom: 0;">
        <template #content>
          <div class="flex align-items-center" style="gap: 0.75rem;">
            <i :class="stat.icon" :style="{ color: stat.color, fontSize: '1.5rem' }"></i>
            <div>
              <div style="font-size: 1.5rem; font-weight: 700; line-height: 1.2;" class="text-color">{{ stat.value }}</div>
              <div style="font-size: 0.8rem;" class="text-color-secondary">{{ stat.label }}</div>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Orders section -->
    <div class="col-12" style="margin-top: 1rem;">
      <Card>
        <template #title>Últimas Órdenes</template>
        <template #content>
          <!-- Desktop: DataTable (visible desde lg) -->
          <div class="hidden lg:block">
            <DataTable :value="recentOrders" size="small" stripedRows>
              <Column field="code" header="Código" />
              <Column field="title" header="Título" />
              <Column field="priority" header="Prioridad">
                <template #body="{ data }">
                  <Tag :value="data.priority" :severity="prioritySeverity(data.priority)" />
                </template>
              </Column>
              <Column header="Estado">
                <template #body="{ data }">
                  <Tag :value="data.status?.name" :style="{ background: data.status?.color }" />
                </template>
              </Column>
              <Column header="" body-style="text-align: right;">
                <template #body="{ data }">
                  <Button icon="pi pi-eye" text rounded @click="goToOrder(data.id)" />
                </template>
              </Column>
            </DataTable>
            <div v-if="recentOrders.length === 0" class="text-color-secondary" style="padding: 2rem 0; text-align: center;">
              Sin órdenes recientes.
            </div>
          </div>

          <!-- Mobile: lista compacta (oculta desde lg) -->
          <div class="block lg:hidden">
            <div v-if="recentOrders.length === 0" class="text-color-secondary" style="padding: 2rem 0; text-align: center;">
              Sin órdenes recientes.
            </div>
            <div v-for="order in recentOrders" :key="order.id" class="dashboard-mobile-order" @click.stop="goToOrder(order.id)">
              <div class="flex align-items-center justify-content-between">
                <span style="font-weight: 600; font-size: 0.85rem;">{{ order.code }}</span>
                <Tag :value="order.priority" :severity="prioritySeverity(order.priority)" style="font-size: 0.6rem;" />
              </div>
              <div class="text-color-secondary" style="font-size: 0.8rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 0.15rem;">
                {{ order.title }}
              </div>
              <div class="flex align-items-center justify-content-between" style="margin-top: 0.25rem;">
                <Tag :value="order.status?.name" :style="{ background: order.status?.color, fontSize: '0.6rem' }" />
                <span class="text-color-secondary" style="font-size: 0.7rem; cursor: pointer;" @click.stop="goToOrder(order.id)">
                  Ver <i class="pi pi-arrow-right" style="font-size: 0.6rem;"></i>
                </span>
              </div>
            </div>
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
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Button from 'primevue/button'

const stats = ref([
  { label: 'Órdenes Pendientes', value: '...', icon: 'pi pi-clock', color: '#f59e0b' },
  { label: 'En Progreso', value: '...', icon: 'pi pi-spinner', color: '#3b82f6' },
  { label: 'Completadas Hoy', value: '...', icon: 'pi pi-check-circle', color: '#10b981' },
  { label: 'Productos Bajos', value: '...', icon: 'pi pi-exclamation-triangle', color: '#ef4444' },
])

const recentOrders = ref<any[]>([])
const router = useRouter()

onMounted(async () => {
  try {
    const { data } = await api.get('/work-orders?per_page=5')
    recentOrders.value = data.data?.data || data.data || []
  } catch {
    // ignore
  }
  try {
    const { data } = await api.get('/product-stock-alerts')
    const total = data.data?.total || 0
    stats.value[3].value = total
  } catch {
    // ignore
  }
  try {
    const { data: orders } = await api.get('/work-orders?per_page=100')
    const all = orders.data?.data || orders.data || []
    stats.value[0].value = all.filter((o: any) => o.status?.code === 'pending').length
    stats.value[1].value = all.filter((o: any) => o.status?.code === 'in_progress').length
    const today = new Date().toISOString().substring(0, 10)
    stats.value[2].value = all.filter((o: any) => o.status?.code === 'completed' && o.completed_at?.startsWith(today)).length
  } catch {
    // ignore
  }
})

function goToOrder(id: number) {
  router.push(`/work-orders/${id}`)
}

function prioritySeverity(p: string) {
  const map: Record<string, string> = { baja: 'info', media: 'warn', alta: 'error', critica: 'danger' }
  return map[p] || 'info'
}
</script>

<style scoped>
.dashboard-mobile-order {
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--p-surface-200);
  cursor: pointer;
}
.dashboard-mobile-order:last-child {
  border-bottom: none;
}
.dashboard-mobile-order:hover {
  background: var(--p-surface-hover);
  margin: 0 -0.75rem;
  padding: 0.5rem 0.75rem;
}
</style>

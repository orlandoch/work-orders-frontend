<template>
  <Card class="mb-3">
    <template #title>
      <div class="flex flex-wrap align-items-center justify-content-between gap-2">
        <span class="text-sm md:text-base">Historial de Cambios de Estado</span>
        <Button
          v-if="!expanded && logs.length > 3"
          label="Ver todo"
          text
          size="small"
          icon="pi pi-chevron-down"
          @click="expanded = true"
        />
        <Button
          v-else-if="expanded && logs.length > 3"
          label="Ver menos"
          text
          size="small"
          icon="pi pi-chevron-up"
          @click="expanded = false"
        />
      </div>
    </template>
    <template #content>
      <!-- Loading state -->
      <div v-if="loading" class="text-center py-4 text-color-secondary">
        <i class="pi pi-spin pi-spinner mr-2" />Cargando historial...
      </div>
      <!-- Empty state -->
      <div v-else-if="logs.length === 0" class="text-center py-6 text-color-secondary">
        <i class="pi pi-clock text-2xl block mb-2" />
        <span class="text-sm">Aún no hay cambios de estado registrados</span>
      </div>
      <!-- Has logs -->
      <template v-else>
        <!-- Mobile: compact cards -->
        <div class="block md:hidden">
          <div
            v-for="(log, idx) in visibleLogs"
            :key="log.id"
            class="border-1 border-round surface-card p-3 mb-2"
          >
            <div class="flex align-items-start gap-2">
              <i :class="dotIcon(log)" class="text-sm mt-1" :style="{ color: dotColor(log) }"></i>
              <div class="flex-1 min-w-0">
                <div class="flex flex-wrap align-items-center gap-1">
                  <Tag
                    v-if="log.from_status"
                    :value="log.from_status.name"
                    severity="warn"
                    class="text-xs"
                  />
                  <i class="pi pi-arrow-right text-color-secondary text-xs"></i>
                  <Tag
                    v-if="log.to_status"
                    :value="log.to_status.name"
                    :style="log.to_status.code === 'canceled' ? { background: '#ef4444', color: '#fff' } : log.to_status.code === 'completed' ? { background: '#22c55e', color: '#fff' } : log.to_status.code === 'in_progress' ? { background: '#3b82f6', color: '#fff' } : { background: '#f59e0b', color: '#fff' }"
                    class="text-xs"
                  />
                </div>
                <div class="text-xs text-color-secondary mt-1">
                  {{ formatDate(log.created_at) }}
                </div>
                <div v-if="log.changed_by" class="text-xs text-color-secondary">
                  <i class="pi pi-user mr-1"></i>{{ log.changed_by.name }}
                </div>
                <p v-if="log.notes" class="text-xs text-color-secondary mt-1 italic">
                  "{{ log.notes }}"
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Desktop: timeline -->
        <div class="hidden md:block relative pl-7">
          <!-- Timeline line -->
          <div class="absolute timeline-line" />

          <div
            v-for="(log, idx) in visibleLogs"
            :key="log.id"
            class="relative pb-4"
            :class="{ 'pb-0': idx === visibleLogs.length - 1 }"
          >
            <!-- Dot -->
            <div
              class="timeline-dot absolute"
              :class="dotClass(log) + ' border-circle flex align-items-center justify-content-center'"
              :style="{ borderColor: dotColor(log), backgroundColor: dotColor(log) }"
            >
              <i :class="dotIcon(log)" class="text-xs" />
            </div>

            <!-- Content card -->
            <div class="surface-ground border-1 border-round p-2 text-sm">
              <div class="flex flex-wrap align-items-center justify-content-between gap-1">
                <div class="flex align-items-center gap-1 flex-wrap">
                  <Tag
                    v-if="log.from_status"
                    :value="log.from_status.name"
                    severity="warn"
                    class="text-xs"
                  />
                  <i class="pi pi-arrow-right text-color-secondary text-xs"></i>
                  <Tag
                    v-if="log.to_status"
                    :value="log.to_status.name"
                    :style="log.to_status.code === 'canceled' ? { background: '#ef4444', color: '#fff' } : log.to_status.code === 'completed' ? { background: '#22c55e', color: '#fff' } : log.to_status.code === 'in_progress' ? { background: '#3b82f6', color: '#fff' } : { background: '#f59e0b', color: '#fff' }"
                    class="text-xs"
                  />
                </div>
                <span class="text-color-secondary text-xs whitespace-nowrap">{{ formatDate(log.created_at) }}</span>
              </div>

              <div v-if="log.changed_by" class="text-xs text-color-secondary mt-1">
                <i class="pi pi-user mr-1" />{{ log.changed_by.name }}
              </div>

              <p v-if="log.notes" class="text-xs text-color-secondary mt-1 italic">
                "{{ log.notes }}"
              </p>
            </div>
          </div>
        </div>
      </template>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import api from '@/api/client'
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import Button from 'primevue/button'

const props = defineProps<{
  workOrderId: number
}>()

const logs = ref<any[]>([])
const loading = ref(false)
const expanded = ref(false)

const visibleLogs = computed(() => expanded.value ? logs.value : logs.value.slice(0, 3))

function dotClass(log: any): string {
  const code = log.to_status?.code
  if (code === 'canceled') return 'timeline-dot-canceled'
  if (code === 'completed') return 'timeline-dot-completed'
  if (code === 'in_progress') return 'timeline-dot-progress'
  return 'timeline-dot-default'
}

function dotIcon(log: any): string {
  const code = log.to_status?.code
  if (code === 'canceled') return 'pi pi-ban'
  if (code === 'completed') return 'pi pi-check'
  if (code === 'in_progress') return 'pi pi-play'
  return 'pi pi-circle'
}

function dotColor(log: any): string {
  const code = log.to_status?.code
  if (code === 'canceled') return '#ef4444'
  if (code === 'completed') return '#22c55e'
  if (code === 'in_progress') return '#3b82f6'
  return '#f59e0b'
}

function formatDate(d: string | null): string {
  if (!d) return ''
  const date = new Date(d)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = String(date.getFullYear()).slice(-2)
  const hours = String(date.getHours()).padStart(2, '0')
  const mins = String(date.getMinutes()).padStart(2, '0')
  return `${day}/${month}/${year} ${hours}:${mins}`
}

async function loadLogs() {
  if (!props.workOrderId) return
  loading.value = true
  try {
    const res = await api.get(`/work-orders/${props.workOrderId}/audit-logs`)
    logs.value = res.data?.data ?? res.data ?? []
  } catch (e: any) {
    logs.value = []
  } finally {
    loading.value = false
  }
}

watch(() => props.workOrderId, () => {
  loadLogs()
}, { immediate: true })
</script>

<style scoped>
.timeline-line {
  left: 1rem;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--p-content-border-color, #d1d5db);
}

.timeline-dot {
  left: 0.5rem;
  top: 0.35rem;
  width: 1.25rem;
  height: 1.25rem;
  transform: translateX(-50%);
  color: #fff;
  font-size: 0.6rem;
}

.timeline-dot-canceled {
  background: #ef4444;
}
.timeline-dot-completed {
  background: #22c55e;
}
.timeline-dot-progress {
  background: #3b82f6;
}
.timeline-dot-default {
  background: #f59e0b;
}
</style>

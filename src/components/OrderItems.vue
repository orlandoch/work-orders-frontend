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

        <!-- Item cards -->
        <div v-for="(item, index) in items" :key="item.id" class="mb-3 border-1 border-round surface-card">
          <!-- Item header -->
          <div class="flex align-items-center gap-2 p-3 surface-ground border-round-top">
            <i class="pi pi-tag text-primary" />
            <span class="font-semibold flex-1">{{ item.description }}</span>
            <Chip :label="`× ${formatQty(item.quantity)} ${item.unit || 'unidad'}`" class="text-sm" />
            <span class="text-sm text-color-secondary">${{ formatMoney(item.estimated_total || 0) }}</span>
            <Button
              icon="pi pi-trash"
              size="small"
              text
              severity="danger"
              @click="removeItem(item)"
              :loading="deletingId === item.id"
            />
          </div>

          <!-- Item detail: materials table -->
          <div class="p-3">
            <div class="text-xs text-color-secondary font-medium mb-2 uppercase tracking-wider">
              Materiales ({{ (item.materials || []).length }})
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
              <Column field="product.name" header="Producto" style="min-width:140px" />
              <Column header="Cant." style="width:90px" class="text-right">
                <template #body="s">
                  {{ formatQty(s.data.estimated_quantity || s.data.real_quantity || 0) }}
                </template>
              </Column>
              <Column header="Costo U." style="width:90px" class="text-right">
                <template #body="s">${{ formatMoney(s.data.estimated_unit_cost || s.data.real_unit_cost || 0) }}</template>
              </Column>
              <Column header="Total" style="width:90px" class="text-right">
                <template #body="s">
                  ${{ formatMoney((s.data.estimated_quantity || 0) * (s.data.estimated_unit_cost || 0)) }}
                </template>
              </Column>
            </DataTable>
            <div v-else class="text-xs text-color-secondary py-1">Sin materiales asignados</div>

            <!-- Item detail: machines table -->
            <div class="text-xs text-color-secondary font-medium mt-2 mb-2 uppercase tracking-wider">
              Máquinas ({{ (item.machine_usages || []).length }})
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
              <Column field="machine.name" header="Máquina" style="min-width:140px" />
              <Column header="Horas" style="width:90px" class="text-right">
                <template #body="s">
                  {{ s.data.estimated_units || s.data.actual_units || 0 }}
                </template>
              </Column>
              <Column header="Costo/h" style="width:90px" class="text-right">
                <template #body="s">${{ formatMoney(s.data.cost_per_unit || 0) }}</template>
              </Column>
              <Column header="Total" style="width:90px" class="text-right">
                <template #body="s">
                  ${{ formatMoney((s.data.estimated_units || 0) * (s.data.cost_per_unit || 0)) }}
                </template>
              </Column>
            </DataTable>
            <div v-else class="text-xs text-color-secondary py-1">Sin máquinas asignadas</div>
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
import { ref, onMounted, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import api from '@/api'

const props = defineProps<{
  workOrderId: number
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

async function loadItems() {
  loading.value = true
  try {
    const res = await api.get(`/work-orders/${props.workOrderId}/items`)
    const data = res.data.data ?? res.data ?? []
    items.value = data.map((it: any) => ({
      ...it,
      estimated_total: it.estimated_total ?? 0,
      actual_total: it.actual_total ?? 0,
    }))
  } catch (e: any) {
    console.error('Failed to load items:', e)
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los ítems', life: 5000 })
  } finally {
    loading.value = false
  }
}

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
    items.value.push({ ...created, estimated_total: 0, actual_total: 0 })
    newItemForm.value = { description: '', quantity: 1, unit: 'unidad' }
    showAddItemDialog.value = false
    toast.add({ severity: 'success', summary: 'Ítem creado', life: 3000 })
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el ítem', life: 5000 })
  } finally {
    saving.value = false
  }
}

async function removeItem(item: any) {
  if (!confirm(`¿Eliminar "${item.description}"?`)) return
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

function formatMoney(v: number | string): string {
  const n = typeof v === 'string' ? parseFloat(v) : (v ?? 0)
  return n.toFixed(2)
}

function formatQty(v: number | string): string {
  const n = typeof v === 'string' ? parseFloat(v) : (v ?? 0)
  return n % 1 === 0 ? n.toString() : n.toFixed(2)
}

onMounted(loadItems)

// Reload when work order id changes
watch(() => props.workOrderId, loadItems)
</script>

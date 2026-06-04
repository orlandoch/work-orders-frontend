<template>
  <div>
    <div class="flex align-items-center gap-3 mb-4">
      <Button icon="pi pi-arrow-left" text rounded @click="$router.push('/work-orders')" />
      <h1 class="text-xl font-semibold">{{ isEdit ? 'Editar' : 'Nueva' }} Orden de Trabajo</h1>
    </div>
<!-- Skeleton loading en edición mientras se cargan datos -->
    <div v-if="loading" class="flex flex-column gap-3">
      <div class="flex flex-column gap-4">
        <div>
          <Card>
            <template #title><Skeleton width="10rem" /></template>
            <template #content>
              <div class="flex flex-column gap-3 p-fluid">
                <div v-for="n in 8" :key="n">
                  <Skeleton width="6rem" height="0.75rem" class="mb-2" />
                  <Skeleton width="100%" height="2.5rem" />
                </div>
              </div>
            </template>
          </Card>
        </div>
      </div>
    </div>

    <form v-else @submit.prevent="save">
      <div class="grid mb-4">
        <!-- Full width: Basic info (all 12 columns) + Client as first field -->
        <div class="col-12">
          <Card>
            <template #title>Información General</template>
            <template #content>
              <div class="grid formgrid p-fluid">
                <!-- Row 0: Tipo de Orden -->
                <div class="field col-12 md:col-6 lg:col-4">
                  <label>Tipo *</label>
                  <Select v-model="f.type" :options="['client','production']" class="w-full">
                    <template #value="{ value }">
                      <span v-if="value === 'production'" class="flex align-items-center gap-2"><i class="pi pi-cog" /> Producción</span>
                      <span v-else class="flex align-items-center gap-2"><i class="pi pi-briefcase" /> Cliente</span>
                    </template>
                  </Select>
                </div>
                <!-- Campos de producción (solo si type=production) -->
                <template v-if="f.type === 'production'">
                  <div class="field col-12 md:col-6 lg:col-4">
                    <label>Producto a fabricar *</label>
                    <AutoComplete
                      v-model="productSearch"
                      :suggestions="productResults"
                      @complete="searchProducts"
                      optionLabel="label"
                      class="w-full"
                      placeholder="Buscar producto..."
                      @item-select="selectProduct"
                    >
                      <template #option="{ option }">
                        <div class="text-sm">
                          <div class="font-medium">{{ option.label }}</div>
                          <div class="text-color-secondary text-xs">{{ option.type }} — ${{ option.cost }}</div>
                        </div>
                      </template>
                    </AutoComplete>
                    <InlineMessage v-if="isProductionEdit" severity="warn" class="mt-2 text-xs">Cambiar producto puede afectar los materiales precargados</InlineMessage>
                  </div>
                </template>
                <div class="field col-12 md:col-6 lg:col-4">
                  <label>{{ f.type === 'production' ? 'Cantidad a producir' : 'Cantidad' }} *</label>
                  <InputNumber v-model="f.produced_quantity" :min="1" class="w-full" placeholder="0" />
                </div>
                <div class="field col-12" v-if="f.type === 'client'">
                  <label>Buscar Cliente</label>
                  <div class="flex flex-column gap-2">
                  <AutoComplete
                    v-model="clientSearch"
                    :suggestions="clientResults"
                    @complete="searchClients"
                    optionLabel="label"
                    class="w-full"
                    placeholder="Buscar..."
                    @item-select="selectClient"
                  >
                    <template #option="slotProps">
                      <div class="text-sm">
                        <div class="font-medium">{{ slotProps.option.label }}</div>
                        <div class="text-color-secondary text-xs">{{ slotProps.option.doc }}</div>
                      </div>
                    </template>
                  </AutoComplete>
                  <InlineMessage v-if="selectedClientDetail" severity="info" class="text-sm">
                    <div class="flex align-items-center gap-3 flex-wrap">
                      <span class="font-semibold">{{ selectedClientDetail.full_name }}</span>
                      <span v-if="selectedClientDetail.document_number" class="text-muted-color">{{ selectedClientDetail.document_type }}: {{ selectedClientDetail.document_number }}</span>
                      <span v-if="contactInfo.phone" class="text-muted-color">📞 {{ contactInfo.phone }}</span>
                      <span v-if="contactInfo.email" class="text-muted-color">✉ {{ contactInfo.email }}</span>
                      <span v-if="contactInfo.address" class="text-muted-color">📍 {{ contactInfo.address }}</span>
                      <span v-if="selectedClientDetail.price_list_name" class="text-muted-color">💰 {{ selectedClientDetail.price_list_name }}</span>
                      <Button icon="pi pi-times" text rounded size="small" severity="danger" @click="clearClient" />
                    </div>
                  </InlineMessage>
                  <InlineMessage v-else-if="f.client_id" severity="warn">Cargando datos del cliente...</InlineMessage>
                </div>
              </div>
              <!-- Row 2: Título, Prioridad, Ubicación -->
              <div class="field col-12 md:col-6 lg:col-4"><label>Título *</label><InputText v-model="f.title" class="w-full" required /></div>
              <div class="field col-12 md:col-6 lg:col-4"><label>Prioridad</label><Select v-model="f.priority" :options="['baja','media','alta','critica']" class="w-full" /></div>
              <div class="field col-12 md:col-6 lg:col-4"><label>Ubicación</label><Select v-model="f.location_id" :options="locs" optionLabel="name" optionValue="id" filter class="w-full" placeholder="Seleccionar" /></div>
              <!-- Row 3: Descripción, Notas -->
              <div class="field col-12 md:col-6 lg:col-4"><label>Descripción</label><Textarea v-model="f.description" rows="3" class="w-full" /></div>
              <div class="field col-12 md:col-6 lg:col-4"><label>Notas</label><Textarea v-model="f.notes" rows="3" class="w-full" /></div>
              <!-- Row 4: Programado al final -->
              <div class="field col-12 md:col-6 lg:col-4"><label>Programado</label><div class="flex gap-2">
                <Calendar v-model="f.scheduled_date" dateFormat="yy-mm-dd" class="flex-1" />
                <InputMask v-model="timeStr" mask="99:99" placeholder="HH:mm" style="width:100px" class="flex-shrink-0 flex-none" />
              </div></div>
            </div>
          </template>
        </Card>
        </div>

        <!-- Members + Attachments side by side -->
        <div class="col-12">
          <div class="grid">
            <div class="col-12">
              <Card>
                <template #title>Miembros del Equipo</template>
                <template #content>
                  <div class="flex flex-column gap-3">
                    <div v-if="memberMode === 'select'">
                      <MultiSelect
                        v-model="selectedUserIds"
                        :options="allUsers"
                        optionLabel="name"
                        optionValue="id"
                        filter
                        placeholder="Seleccionar empleados..."
                        class="w-full"
                        display="chip"
                        @change="syncMultiSelectMembers"
                      />
                    </div>
                    <div v-if="memberMode === 'autocomplete'">
                      <AutoComplete
                        v-model="userSearchQuery"
                        :suggestions="userResults"
                        @complete="searchUsers"
                        optionLabel="label"
                        class="w-full"
                        placeholder="Buscar empleado..."
                        @item-select="(e) => addMember(e.value)"
                      >
                        <template #option="slotProps">
                          <div class="text-sm">
                            <div class="font-medium">{{ slotProps.option.label }}</div>
                            <div class="text-color-secondary text-xs">{{ slotProps.option.email }}</div>
                          </div>
                        </template>
                      </AutoComplete>
                    </div>
                    <div v-if="members.length" class="flex flex-wrap align-items-center gap-2 w-full">
                      <span
                        v-for="m in members"
                        :key="m.user_id"
                        :class="[
                          'inline-flex align-items-center gap-1 px-2 py-1 border-round text-xs border-1',
                          m.is_leader ? 'surface-ground border-primary text-primary' : 'surface-ground surface-border text-color-secondary'
                        ]"
                      >
                        <i :class="m.is_leader ? 'pi pi-star-fill text-primary' : 'pi pi-user text-color-secondary'" class="text-xs flex-shrink-0" />
                        <span class="overflow-hidden text-overflow-ellipsis" style="white-space:nowrap">{{ userName(m.user_id) }}</span>
                        <span
                          class="underline cursor-pointer ml-1"
                          :class="m.is_leader ? 'text-primary' : 'text-color-secondary'"
                          @click="toggleLeader(members.indexOf(m))"
                        >
                          {{ m.is_leader ? 'Líder' : 'Líder?' }}
                        </span>
                        <i
                          class="pi pi-times-circle text-color-secondary cursor-pointer"
                          title="Eliminar"
                          @click="removeMember(members.indexOf(m))"
                        />
                      </span>
                    </div>
                    <p v-else class="text-color-secondary text-sm">Agrega miembros del equipo</p>
                  </div>
                </template>
              </Card>
            </div>
            <!-- Attachments -->
            <div class="col-12">
              <Card>
                <template #title>
                  <div class="flex align-items-center justify-content-between">
                    <span>Archivos Adjuntos</span>
                    <div class="flex gap-2">
                      <input ref="fileInputRef" type="file" multiple accept="*/*" class="file-input" @change="onFileChange" />
                      <Button type="button" icon="pi pi-upload" severity="secondary" size="small" @click="fileInputRef?.click()" />
                    </div>
                  </div>
                </template>
                <template #content>
                  <!-- Drop zone -->
                  <div
                    class="border-2 border-dashed border-round p-4 mb-3 text-center text-sm cursor-pointer"
                    :class="dragOver ? 'border-primary surface-ground' : 'surface-border text-color-secondary'"
                    @dragenter.prevent="dragOver = true"
                    @dragover.prevent="dragOver = true"
                    @dragleave.prevent="dragOver = false"
                    @drop.prevent="onDrop"
                    @click="fileInputRef?.click()"
                  >
                    <i class="pi pi-upload mr-1" /> Arrastra archivos aquí o haz clic para seleccionar
                  </div>
                  <!-- Existing attachments -->
                  <div v-if="existingAttachments.length" class="mb-3">
                    <p class="text-xs text-color-secondary mb-1">Archivos actuales:</p>
                    <div v-for="(a, i) in existingAttachments" :key="'e'+i"
                        class="flex align-items-center gap-2 surface-ground border-1 surface-border border-round px-2 py-1 text-xs overflow-hidden"
                      >
                        <i :class="fileIcon(a)" class="text-primary flex-shrink-0" />
                        <span @click="downloadAttachment(Number(route.params.id), a.id!, a.original_name || a.name)" class="flex-1 overflow-hidden text-overflow-ellipsis text-primary cursor-pointer min-w-0" style="white-space:nowrap">
                          {{ a.original_name || a.name }}
                        </span>
                        <span class="text-color-secondary flex-shrink-0">{{ formatSize(a.file_size || a.size) }}</span>
                        <Button icon="pi pi-download" text rounded size="small" severity="info" @click="downloadAttachment(Number(route.params.id), a.id!, a.original_name || a.name)" />
                        <Button icon="pi pi-trash" text rounded size="small" severity="danger" :loading="deletingId === a.id" @click="deleteExisting(a.id!)" />
                      </div>
                  </div>
                  <!-- New attachments -->
                  <div v-if="newAttachments.length">
                    <p class="text-xs text-color-secondary mb-1">Nuevos archivos (por subir):</p>
                      <div v-for="(a, i) in newAttachments" :key="'n'+i"
                        class="flex align-items-center gap-2 surface-ground border-1 surface-border border-round px-2 py-1 text-xs overflow-hidden"
                      >
                        <i :class="fileIcon(a)" class="text-color-secondary flex-shrink-0" />
                        <span class="flex-1 overflow-hidden text-overflow-ellipsis min-w-0" style="white-space:nowrap">{{ a.original_name || a.name }}</span>
                        <span class="text-color-secondary flex-shrink-0">{{ formatSize(a.file_size || a.size) }}</span>
                        <Button icon="pi pi-times" text rounded size="small" severity="danger" @click="removeNew(i)" />
                      </div>
                  </div>
                  <p v-if="!existingAttachments.length && !newAttachments.length" class="text-color-secondary text-sm">Sin archivos</p>
                </template>
              </Card>
            </div>
          </div>
        </div>

        <!-- Ítems de la orden (only when WO exists) -->
        <div v-if="isEdit" class="col-12">
          <OrderItems :workOrderId="Number(route.params.id)" />
        </div>

      <!-- Resources unificados (only when WO exists) -->
        <div v-if="isEdit" class="col-12">
          <WorkOrderResources
            :workOrderId="Number(route.params.id)"
            :isDraft="isDraft"
            :statusId="f.work_order_status_id"
            :statusName="statusName"
          />
        </div>
      </div>

      <!-- Submit -->
      <div class="flex justify-end gap-2">
        <Button label="Cancelar" severity="secondary" @click="$router.push('/work-orders')" />
        <Button type="submit" label="Guardar" :loading="saving" />
      </div>
    </form>

    <Toast />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api/client'
import { fetchSettings } from '@/api/settings'
import { useProductSearch } from '@/composables/useProductSearch'
import { useClientSearch } from '@/composables/useClientSearch'
import { useMembers } from '@/composables/useMembers'
import { useAttachments } from '@/composables/useAttachments'
import Card from 'primevue/card'
import InlineMessage from 'primevue/inlinemessage'
import Skeleton from 'primevue/skeleton'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import MultiSelect from 'primevue/multiselect'
import Textarea from 'primevue/textarea'
import Calendar from 'primevue/calendar'
import AutoComplete from 'primevue/autocomplete'
import InputMask from 'primevue/inputmask'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import { downloadAttachment } from '@/composables/useAttachmentUrl'
import type { WorkOrderStatus } from '@/composables/workOrderTypes'
import WorkOrderResources from '@/components/WorkOrderResources.vue'
import OrderItems from '@/components/OrderItems.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const isEdit = computed(() => !!route.params.id)
const loading = ref(!!route.params.id)
const workOrderId = computed(() => Number(route.params.id))
const statusOptions = ref<WorkOrderStatus[]>([])
const loaded = ref(false)

const isDraft = computed(() => {
  if (!loaded.value || !f.value.work_order_status_id) return false
  const status = statusOptions.value.find((s) => s.id === f.value.work_order_status_id)
  return status?.code === 'draft'
})

const statusName = computed(() => {
  if (!f.value.work_order_status_id) return 'Borrador'
  return statusOptions.value.find((s) => s.id === f.value.work_order_status_id)?.name || 'Desconocido'
})

const saving = ref(false)
const locs = ref<any[]>([])

const f = ref({ title: '', description: '', priority: 'media', type: 'client', client_id: null, client_name: '', location_id: null, scheduled_date: null, notes: '', work_order_status_id: null, product_id: null, produced_quantity: null, serial_numbers: null })
const timeStr = ref('')

// Settings
const wcSettings = ref<Record<string, unknown> | null>(null)

// ─── Composables ─────────────────────────────────────────────────────
const { productSearch, productResults, searchProducts, selectProduct } = useProductSearch()
const { clientSearch, clientResults, selectedClientDetail, contactInfo, clientLoading, searchClients, selectClient, clearClient, loadClientDetail } = useClientSearch()
const { members, memberMode, allUsers, selectedUserIds, userSearchQuery, userResults, searchUsers, addMember, removeMember, toggleLeader, loadAllUsers, syncMultiSelectMembers, loadMembersFromOrder } = useMembers()
const { existingAttachments, newAttachments, uploading, loadExistingAttachments, onFileChange, removeNewAttachment, removeExistingAttachment, fileIcon, formatSize } = useAttachments()
const deletingId = ref<number | null>(null)
function deleteExisting(id: number) {
  const idx = existingAttachments.value.findIndex(a => a.id === id)
  if (idx !== -1) removeExistingAttachment(idx)
}
function removeNew(index: number) {
  removeNewAttachment(index)
}

// ─── Save ────────────────────────────────────────────────────────────
async function save() {
  saving.value = true
  try {
    const payload: Record<string, any> = {
      title: f.value.title,
      description: f.value.description,
      priority: f.value.priority,
      type: f.value.type,
      location_id: f.value.location_id,
      scheduled_date: f.value.scheduled_date,
      notes: f.value.notes,
      work_order_status_id: f.value.work_order_status_id,
      members: members.value.map(m => ({ user_id: m.user_id, is_leader: m.is_leader })),
      // Production fields
      product_id: f.value.type === 'production' ? f.value.product_id : null,
      produced_quantity: f.value.type === 'production' ? f.value.produced_quantity : null,
      serial_numbers: f.value.type === 'production' ? f.value.serial_numbers : null,
    }
    if (f.value.type === 'client') {
      payload.client_id = f.value.client_id
    } else {
      payload.client_id = null
    }

    if (isEdit.value) {
      await api.put(`/work-orders/${workOrderId.value}`, payload)
      toast.add({ severity: 'success', summary: 'Actualizado', detail: 'Orden actualizada', life: 3000 })
    } else {
      const { data } = await api.post('/work-orders', payload)
      toast.add({ severity: 'success', summary: 'Creada', detail: 'Orden creada', life: 3000 })
      router.push(`/work-orders/${data.data?.id ?? data.id}`)
      return
    }
    router.push('/work-orders')
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e?.response?.data?.message || 'Error al guardar', life: 5000 })
  } finally {
    saving.value = false
  }
}

// ─── Load data on mount ──────────────────────────────────────────────
onMounted(async () => {
  // Load statuses
  try {
    const { data } = await api.get('/work-order-statuses')
    statusOptions.value = data.data || data || []
  } catch { /* ignore */ }

  // Load settings (work order prefix, etc.)
  try {
    wcSettings.value = await fetchSettings()
  } catch { /* ignore */ }

  // Load locations
  try {
    const { data } = await api.get('/locations')
    locs.value = data.data?.data || data.data || []
  } catch { /* ignore */ }

  // Load all users for member select mode
  try {
    await loadAllUsers()
  } catch { /* ignore */ }

  if (isEdit.value) {
    try {
      const { data } = await api.get(`/work-orders/${workOrderId.value}`)
      const wo = data.data ?? data
      f.value = {
        title: wo.title ?? '',
        description: wo.description ?? '',
        priority: wo.priority ?? 'media',
        type: wo.type ?? 'client',
        client_id: wo.client_id ?? null,
        client_name: wo.client?.full_name ?? '',
        location_id: wo.location_id ?? null,
        scheduled_date: wo.scheduled_date ?? null,
        notes: wo.notes ?? '',
        work_order_status_id: wo.status_id ?? wo.status?.id ?? null,
        product_id: wo.product_id ?? null,
        produced_quantity: wo.produced_quantity ?? null,
        serial_numbers: wo.serial_numbers ?? null,
      }
      loaded.value = true
      timeStr.value = wo.created_at ? new Date(wo.created_at).toLocaleString('es-EC') : ''
      loading.value = false

      // Load client detail if present
      if (f.value.client_id) {
        await loadClientDetail(f.value.client_id)
      }

      // Load members
      await loadMembersFromOrder(wo.members ?? [])

      // Load attachments
      await loadExistingAttachments(wo.attachments ?? [])

      // Select product if production type
      if (wo.type === 'production' && wo.product_id) {
        selectProduct({ value: { id: wo.product_id, label: wo.product?.name ?? '', cost: wo.product?.cost_price ?? 0, type: wo.product?.type ?? '' } })
      }
    } catch {
      loading.value = false
    }
  } else {
    loading.value = false
    loaded.value = true
  }
})

// ─── Sync selectedClientDetail → f.client_id ───────────────────────
watch(selectedClientDetail, (val) => {
  f.value.client_id = val?.id ?? null
})

// ─── File input ref for attachment upload ────────────────────────────
const fileInputRef = ref<HTMLInputElement | null>(null)
</script>

<style scoped>

.file-input { display: none; }
</style>

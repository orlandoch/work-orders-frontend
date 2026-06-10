<template>
 <div v-if="order">
  <!-- Header: mobile-friendly with collapsible actions -->
  <div class="flex flex-wrap align-items-start gap-2 mb-3">
   <div class="flex align-items-center gap-2 flex-1 min-w-0">
    <Button icon="pi pi-arrow-left" text rounded @click="$router.push('/work-orders')" />
    <h1 class="text-xl font-bold m-0 text-overflow-ellipsis white-space-nowrap overflow-hidden">{{ order.code }} — {{ order.title }}</h1>
   </div>
   <div class="flex gap-2 flex-wrap">
    <!-- Desktop: show all actions inline -->
    <span class="hidden md:flex gap-2">
     <Button v-if="canPublish" label="Publicar" icon="pi pi-send" severity="success" @click="publishDialog = true" />
     <Button v-if="canStart"  label="Iniciar"  icon="pi pi-play" severity="info"  @click="startDialog = true" />
     <Button v-if="canComplete" label="Completar" icon="pi pi-check" severity="success" @click="completeDialog = true" />
     <Button v-if="canCompleteProduction" label="Completar Producción" icon="pi pi-check-circle" severity="success" @click="productionCompleteDialog = true" />
     <Button v-if="canCompleteProduction" label="Precargar BOM" icon="pi pi-list" severity="help" outlined @click="handlePrecargaBom" />
     <Button v-if="canCancel"  label="Cancelar" icon="pi pi-ban" severity="danger"  @click="cancelDialog = true" />
     <Button v-if="canReopen"  label="Reabrir"  icon="pi pi-replay" severity="warn" @click="reopenDialog = true" />
     <Button label="Editar" icon="pi pi-pencil" outlined @click="$router.push(`/work-orders/${$route.params.id}/edit`)" />
    </span>
    <!-- Mobile: main action visible + menu overflow -->
    <span class="block md:hidden flex gap-1 flex-wrap">
     <Button v-if="canComplete" label="Completar" icon="pi pi-check" severity="success" size="small" @click="completeDialog = true" />
     <Button v-if="canCompleteProduction" label="Completar Producción" icon="pi pi-check-circle" severity="success" size="small" @click="productionCompleteDialog = true" />
     <Button v-if="canCompleteProduction" label="Precargar BOM" icon="pi pi-list" severity="help" size="small" outlined @click="handlePrecargaBom" />
     <Button v-if="canStart" label="Iniciar" icon="pi pi-play" severity="info" size="small" @click="startDialog = true" />
     <Button v-if="canPublish" label="Publicar" icon="pi pi-send" severity="success" size="small" @click="publishDialog = true" />
     <Button v-if="canReopen" label="Reabrir" icon="pi pi-replay" severity="warn" size="small" @click="reopenDialog = true" />
     <Button v-if="canCancel" label="Cancelar" icon="pi pi-ban" severity="danger" size="small" @click="cancelDialog = true" />
     <Button label="Editar" icon="pi pi-pencil" outlined size="small" @click="$router.push(`/work-orders/${$route.params.id}/edit`)" />
    </span>
   </div>
  </div>

  <div class="grid formgrid mb-3" @click="summaryDialog = true">
   <i class="pi pi-circle-fill text-xs mr-2" :style="{ color: order.status?.color || '#94a3b8' }" />
   <span class="font-medium text-overflow-ellipsis white-space-nowrap overflow-hidden">{{ order.client?.full_name || '—' }}</span>
   <i class="pi pi-angle-right text-xs text-color-secondary mx-1" />
   <Tag :value="order.priority" :severity="pSev(order.priority)" class="text-xs" />
   <span class="text-color-secondary text-xs">{{ order.scheduled_date || '—' }}</span>
   <span class="text-color-secondary text-xs ml-auto text-overflow-ellipsis white-space-nowrap overflow-hidden">{{ teamLeaderName }}</span>
  </div>

  <!-- === ÍTEMS DE LA ORDEN (agrupa materiales + máquinas por ítem) === -->
  <OrderItems :workOrderId="order.id" @updated="load" />

  <!-- Comments -->
  <Card class="mb-3">
   <template #title>
    <div class="flex align-items-center justify-content-between">
     <span>Comentarios ({{ order.comments?.length || 0 }})</span>
    </div>
   </template>
   <template #content>
    <div class="flex flex-column md:flex-row gap-2">
     <Textarea v-model="newComment" rows="2" class="w-full" placeholder="Escribe un comentario..." />
     <Button icon="pi pi-send" severity="info" :disabled="!newComment.trim()" @click="addComment" class="self-end md:self-auto" />
    </div>
    <div v-if="order.comments?.length" class="flex flex-column gap-3">
     <div v-for="c in order.comments" :key="c.id" class="surface-ground border-round p-3">
      <div class="flex flex-column md:flex-row md:align-items-center md:justify-content-between gap-1 mb-1">
       <span class="font-medium">{{ c.user?.name }}</span>
       <span>{{ c.created_at }}</span>
      </div>
      <p class="text-sm line-height-3">{{ c.body }}</p>
      <Button label="Responder" text size="small" icon="pi pi-reply" class="mt-1" @click="toggleReply(c.id)" />
      <div v-if="replyingTo === c.id" class="flex gap-2 mt-2 ml-4">
       <Textarea v-model="replyText" rows="1" class="flex-1" placeholder="Escribe una respuesta..." />
       <div class="flex flex-column gap-1">
        <Button icon="pi pi-send" severity="info" :disabled="!replyText.trim()" size="small" @click="addReply(c.id)" />
        <Button icon="pi pi-times" text rounded severity="secondary" size="small" @click="cancelReply" />
       </div>
      </div>
      <div v-if="c.replies?.length" class="ml-4 mt-2 flex flex-column gap-2">
       <div v-for="r in c.replies" :key="r.id">
        <div class="flex align-items-center justify-content-between gap-1">
         <span class="font-medium">{{ r.user?.name }}</span>
         <span>{{ r.created_at }}</span>
        </div>
        <p class="text-sm line-height-3">{{ r.body }}</p>
       </div>
      </div>
     </div>
    </div>
    <p v-else class="text-color-secondary text-sm">Sin comentarios</p>
   </template>
  </Card>

  <!-- Description + Notas -->
  <Card class="mb-3">
   <template #title>
    <div class="flex align-items-center gap-2">
     <i class="pi pi-align-left" />
     <span>Descripción</span>
    </div>
   </template>
   <template #content>
    <p class="text-sm line-height-3">{{ order.description || 'Sin descripción' }}</p>
    <p v-if="order.notes" class="mt-2 text-color-secondary"><strong>Notas:</strong> {{ order.notes }}</p>
   </template>
  </Card>

  <!-- Attachments -->
  <Card class="mb-3">
   <template #title>
    <div class="flex align-items-center justify-content-between">
     <div class="flex align-items-center gap-2">
      <i class="pi pi-paperclip text-primary" />
      <span>Archivos ({{ order.attachments?.length || 0 }})</span>
     </div>
     <div class="relative">
      <Button :label="uploading ? 'Subiendo...' : 'Subir archivo'" icon="pi pi-upload" size="small" :disabled="uploading" />
      <input
       type="file"
       class="hidden"
       @change="onFileInput"
       :disabled="uploading"
      />
     </div>
    </div>
   </template>
   <template #content>
    <div v-if="order.attachments?.length" class="flex flex-column md:flex-row flex-wrap gap-2">
     <div v-for="a in order.attachments" :key="a.id" class="w-full">
      <div
       @click="downloadAttachment(order.id, a.id, a.original_name)"
       class="flex align-items-center gap-2 surface-ground border-1 border-200 border-round p-2 hover:surface-hover cursor-pointer"
      >
       <i :class="fileIcon(a.mime_type)" class="text-color-secondary flex-shrink-0" />
       <span class="flex-1 min-w-0 overflow-hidden text-overflow-ellipsis white-space-nowrap">{{ a.original_name }}</span>
       <span class="text-color-secondary text-xs flex-shrink-0">{{ formatSize(a.file_size) }}</span>
       <i class="pi pi-download text-color-secondary text-xs flex-shrink-0" />
      </div>
      <i
       class="pi pi-trash"
       @click="deleteAttachment(a.id)"
      />
     </div>
    </div>
    <p v-else class="text-color-secondary text-sm">Sin archivos adjuntos</p>
   </template>
  </Card>

  <!-- Status Timeline -->
  <WorkOrderTimeline :workOrderId="order.id" />


  <!-- Pricing -->
  <OrderPricing :workOrderId="order.id" :key="'pricing-' + pricingKey" class="mb-3" />

  <!-- Payments -->

  <!-- === PUBLISH DIALOG === -->
  <Dialog v-model:visible="publishDialog" header="Publicar Orden" modal :style="{ width: '500px', maxWidth: '95vw' }">
   <p class="text-color-secondary">La orden pasará de <strong>Borrador</strong> a <strong>Pendiente</strong>. Se notificará a los miembros del equipo.</p>
   <div class="field col-12">
    <label class="text-color-secondary block text-sm mb-1 font-medium">Notas</label>
    <Textarea v-model="publishForm.notes" rows="3" class="w-full" placeholder="Notas opcionales sobre esta publicación..." />
   </div>
   <template #footer>
    <Button label="Cancelar" severity="secondary" @click="publishDialog = false" />
    <Button label="Publicar" severity="success" icon="pi pi-send" :loading="saving" @click="doPublish" />
   </template>
  </Dialog>

  <!-- === START DIALOG === -->
  <Dialog v-model:visible="startDialog" header="Iniciar Orden" modal :style="{ width: '500px', maxWidth: '95vw' }">
   <p class="text-color-secondary">La orden pasará de <strong>Pendiente</strong> a <strong>En Progreso</strong>. Se registrará la fecha/hora de inicio.</p>
   <div class="field col-12">
    <label class="text-color-secondary block text-sm mb-1 font-medium">Notas</label>
    <Textarea v-model="startForm.notes" rows="3" class="w-full" placeholder="Notas opcionales al iniciar..." />
   </div>
   <template #footer>
    <Button label="Cancelar" severity="secondary" @click="startDialog = false" />
    <Button label="Iniciar Orden" severity="info" icon="pi pi-play" :loading="saving" @click="doStart" />
   </template>
  </Dialog>

  <!-- === COMPLETE DIALOG === -->
  <Dialog v-model:visible="completeDialog" header="Completar Orden — Verificar Recursos" modal :style="{ width: '750px', maxWidth: '95vw' }" :breakpoints="{ '640px': '95vw' }">
   <div class="flex flex-column gap-4">
    <WorkOrderResources :workOrderId="order.id" :isDraft="false" :statusId="order.status_id" :statusName="order.status?.name" @saved="load" />

    <div class="field col-12">
     <label class="text-color-secondary block text-sm mb-1 font-medium">Notas de finalización *</label>
     <Textarea v-model="completeForm.notes" rows="3" class="w-full" placeholder="Describe el trabajo realizado..." />
    </div>

    <small v-if="completeError" class="text-red-500 block">{{ completeError }}</small>

    <div class="field flex align-items-center gap-2">
     <Checkbox v-model="completeForm.confirmed" :binary="true" inputId="confirmReview" />
     <label for="confirmReview" class="text-sm text-color-secondary">He revisado los materiales y usos de máquina, la información es correcta</label>
    </div>
   </div>
   <template #footer>
    <Button label="Cancelar" severity="secondary" @click="completeDialog = false" />
    <Button label="Completar Orden" severity="success" icon="pi pi-check" :loading="saving"
     :disabled="!completeForm.notes?.trim() || !completeForm.confirmed" @click="handleComplete" />
   </template>
  </Dialog>

  <!-- Dialog: Completar Producción -->
  <Dialog v-model:visible="productionCompleteDialog" header="Completar Producción" modal :style="{ width: '500px', maxWidth: '95vw' }">
   <div class="flex flex-column gap-3">
    <div>
     <label class="block mb-1 text-sm">Números de serie <span class="text-xs text-color-secondary">(opcional)</span></label>
     <Chips v-model="serialNumbers" placeholder="Escribe cada serie y presiona Enter" class="w-full" />
     <small class="text-color-secondary">Asigna números de serie únicos a las unidades producidas</small>
    </div>
    <Message severity="warn" :closable="false" class="text-sm">
     <strong>Resumen de costos estimados:</strong><br />
     Materiales: ${{ materialCost.toFixed(2) }}<br />
     Máquinas: ${{ machineCost.toFixed(2) }}<br />
     <strong>Costo total: ${{ totalCost.toFixed(2) }}</strong><br />
     <span class="text-xs">Costo por unidad: ${{ unitCost.toFixed(2) }}</span>
    </Message>
   </div>
   <template #footer>
    <Button label="Cancelar" severity="secondary" @click="productionCompleteDialog = false" />
    <Button label="Completar Producción" icon="pi pi-check-circle" severity="success" @click="handleCompleteProduction" :loading="completingProduction" />
   </template>
  </Dialog>

  <!-- === REOPEN DIALOG === -->
  <Dialog v-model:visible="reopenDialog" header="Reabrir Orden" modal :style="{ width: '500px', maxWidth: '95vw' }">
   <p class="text-color-secondary">La orden volverá de <strong>Completada</strong> a <strong>En Progreso</strong>.</p>
   <div class="field col-12">
    <label class="text-color-secondary block text-sm mb-1 font-medium">Motivo de la reapertura *</label>
    <Textarea v-model="reopenForm.notes" rows="3" class="w-full" placeholder="Explica por qué se reabre..." />
   </div>
   <template #footer>
    <Button label="Cancelar" severity="secondary" @click="reopenDialog = false" />
    <Button label="Reabrir Orden" severity="warn" icon="pi pi-replay" :loading="saving"
     :disabled="!reopenForm.notes?.trim()" @click="handleReopen" />
   </template>
  </Dialog>

  <!-- === CANCEL DIALOG === -->
  <Dialog v-model:visible="cancelDialog" header="Cancelar Orden" modal :style="{ width: '500px', maxWidth: '95vw' }">
   <p class="text-color-secondary">Motivo de la cancelación. Esta acción no se puede deshacer.</p>
   <div class="field col-12">
    <label class="text-color-secondary block text-sm mb-1 font-medium">Motivo *</label>
    <Select v-model="cancelForm.cancel_reason_id" :options="cancelReasons" optionValue="id" optionLabel="name" placeholder="Selecciona un motivo..." class="w-full" />
   </div>
   <div class="field col-12">
    <label class="text-color-secondary block text-sm mb-1 font-medium">Comentario *</label>
    <Textarea v-model="cancelForm.notes" rows="3" class="w-full" placeholder="Explica el motivo de la cancelación..." />
   </div>
   <small v-if="cancelError" class="text-red-500 block mb-2">{{ cancelError }}</small>
   <template #footer>
    <Button label="Volver" severity="secondary" @click="cancelDialog = false" />
    <Button label="Cancelar Orden" severity="danger" icon="pi pi-ban" :loading="saving"
     :disabled="!cancelForm.cancel_reason_id || !cancelForm.notes?.trim()" @click="handleCancel" />
   </template>
  </Dialog>

  <ConfirmDialog /><Toast />

  <!-- === HISTORIAL DIALOG === -->
  <Dialog v-model:visible="historyDialog" header="Historial de cambios" modal :style="{ width: '700px', maxWidth: '95vw' }" :breakpoints="{ '640px': '95vw' }">
   <div v-if="historyLoading" class="text-center p-3"><i class="pi pi-spin pi-spinner text-xl" /></div>
   <div v-else-if="historyLogs.length" class="flex flex-column gap-3">
    <div v-for="(log, idx) in historyLogs" :key="idx" class="flex gap-3">
     <div class="flex flex-column align-items-center">
      <i :class="['pi text-xs', auditLogType(log) === 'machine' ? 'pi-cog text-blue-500' : 'pi-box text-green-500']" />
      <div v-if="idx < historyLogs.length - 1" class="w-full flex-1 surface-200 min-h-4" />
     </div>
     <div class="flex-1 pb-3">
      <p class="text-sm">{{ auditLogText(log) }}</p>
      <p class="text-xs text-color-secondary mt-1">{{ formatDateTime(log.created_at) }}</p>
     </div>
    </div>
   </div>
   <p v-else class="text-color-secondary text-sm p-3 text-center">Sin registros</p>
   <template #footer>
    <Button label="Cerrar" severity="secondary" @click="historyDialog = false" />
   </template>
  </Dialog>

  <!-- === Resumen completo en diálogo (clic en barra) === -->
  <Dialog v-model:visible="summaryDialog" header="Resumen de orden" modal :style="{ width: '680px', maxWidth: '95vw' }" :breakpoints="{ '768px': '95vw' }" :dismissableMask="true">
   <div class="overflow-y-auto history-panel">
    <!-- Sección 1: Datos de la orden -->
    <div class="p-3 border-bottom-1 border-100">
     <h3 class="text-xs font-semibold text-color-secondary uppercase tracking-wider mb-3 flex align-items-center gap-2"><i class="pi pi-info-circle text-xs" />Orden</h3>
     <div class="grid formgrid">
      <div><span class="text-color-secondary block text-sm">Código</span><span class="font-medium">{{ order.code }}</span></div>
      <div><span class="text-color-secondary block text-sm">Título</span><span>{{ order.title }}</span></div>
      <div><span class="text-color-secondary block text-sm">Estado</span><Tag :value="order.status?.name" :style="{ background: order.status?.color, color: '#fff' }" /></div>
      <div><span class="text-color-secondary block text-sm">Prioridad</span><Tag :value="order.priority" :severity="pSev(order.priority)" /></div>
      <div>
       <span class="text-color-secondary block text-sm">Cantidad</span>
       <div class="flex align-items-center gap-2">
        <InputNumber v-if="editingQuantity" ref="quantityInput" v-model="quantityBuffer" :min="1" class="w-5rem" @keyup.enter="saveQuantity" @blur="cancelQuantityEdit" />
        <span v-else class="font-medium">{{ order.produced_quantity ?? '—' }}</span>
        <Button v-if="!editingQuantity" icon="pi pi-pencil" text rounded size="small" @click="startQuantityEdit" />
        <Button v-else icon="pi pi-check" text rounded size="small" severity="success" @click="saveQuantity" />
       </div>
      </div>
      <div><span class="text-color-secondary block text-sm">Programado</span><span>{{ formatDate(order.scheduled_date) }}</span></div>
      <div v-if="order.started_at"><span class="text-color-secondary block text-sm">Iniciado</span><span>{{ formatDate(order.started_at) }}</span></div>
      <div v-if="order.completed_at"><span class="text-color-secondary block text-sm">Completado</span><span>{{ formatDate(order.completed_at) }}</span></div>
      <div v-if="order.cancel_reason_id"><span class="text-color-secondary block text-sm">Motivo cancelación</span><Tag :value="order.cancel_reason?.name || '-'" severity="danger" /></div>
     </div>
    </div>
    <!-- Sección 2: Cliente (oculto para WO de producción) -->
    <div v-if="!isProduction" class="p-3 border-bottom-1 border-100">
     <div class="flex align-items-center justify-content-between mb-3">
      <h3 style="font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;" class="text-color-secondary flex align-items-center gap-2"><i class="pi pi-user" style="font-size: 0.75rem;" />Cliente</h3>
      <Button icon="pi pi-pencil" text rounded size="small" @click="showClientDialog = true" />
     </div>
     <div class="grid formgrid">
      <div class="col-12 md:col-6"><span class="text-color-secondary" style="display: block; font-size: 0.875rem;">Nombre</span><span style="font-weight: 500;">{{ order.client?.full_name || '—' }}</span></div>
      <div v-if="order.client?.document_number" class="col-12 md:col-6"><span class="text-color-secondary" style="display: block; font-size: 0.875rem;">Documento</span><span>{{ order.client?.document_type }} {{ order.client?.document_number }}</span></div>
      <div class="col-12 md:col-6"><span class="text-color-secondary" style="display: block; font-size: 0.875rem;">Teléfono</span><span>{{ (order.client?.contact_details||[]).find((d:any)=>d.type==='phone')?.value || '—' }}</span></div>
      <div class="col-12 md:col-6"><span class="text-color-secondary" style="display: block; font-size: 0.875rem;">Email</span><span>{{ (order.client?.contact_details||[]).find((d:any)=>d.type==='email')?.value || '—' }}</span></div>
      <div class="col-12"><span class="text-color-secondary" style="display: block; font-size: 0.875rem;">Dirección</span><span>{{ (order.client?.contact_details||[]).find((d:any)=>d.type==='address')?.value || '—' }}</span></div>
     </div>
    </div>

    <!-- Client edit dialog -->
    <Dialog v-model:visible="showClientDialog" header="Asignar Cliente" :modal="true" :style="{ width: '450px' }" class="p-fluid">
      <div class="field">
        <label for="clientSearch">Buscar cliente</label>
        <AutoComplete
          id="clientSearch"
          v-model="clientSearch"
          :suggestions="clientResults"
          @complete="searchClients"
          field="full_name"
          forceSelection
          :dropdown="true"
          placeholder="Escribe nombre o documento..."
          @item-select="(e:any) => selectedClient = e.value"
        />
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" @click="showClientDialog = false" />
        <Button label="Guardar" @click="saveClient" :loading="savingClient" :disabled="!selectedClient" />
      </template>
    </Dialog>

    <!-- Sección 2b: Producto (solo WO de producción) -->
    <div v-if="isProduction" class="p-3 border-bottom-1 border-100">
     <div class="flex align-items-center justify-content-between mb-3">
      <h3 style="font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;" class="text-color-secondary flex align-items-center gap-2"><i class="pi pi-cog" style="font-size: 0.75rem;" />Producción</h3>
     </div>
     <div class="grid formgrid">
      <div class="col-12 md:col-6"><span class="text-color-secondary" style="display: block; font-size: 0.875rem;">Producto</span><span style="font-weight: 500;">{{ order.product?.name || '—' }}</span></div>
      <div class="col-12 md:col-6"><span class="text-color-secondary" style="display: block; font-size: 0.875rem;">Cantidad a producir</span><span style="font-weight: 500;">{{ order.produced_quantity || 0 }} unidades</span></div>
      <div v-if="order.serial_numbers?.length" class="col-12"><span class="text-color-secondary" style="display: block; font-size: 0.875rem;">Números de serie</span><span>{{ order.serial_numbers.join(', ') }}</span></div>
     </div>
    </div>
    <!-- Sección 3: Equipo -->
    <div class="p-3 border-bottom-1 border-100">
     <h3 class="text-xs font-semibold text-color-secondary uppercase tracking-wider mb-3 flex align-items-center gap-2"><i class="pi pi-users text-xs" />Equipo ({{ order.members?.length || 0 }})</h3>
     <div v-if="order.members?.length" class="flex flex-wrap gap-2">
      <span v-for="m in order.members" :key="m.id"
       class="inline-flex align-items-center gap-2 border-1 border-round p-2"
       :class="m.is_leader ? 'surface-ground border-yellow-300 text-yellow-800' : 'surface-ground border-200 text-color'">
       <i :class="m.is_leader ? 'pi pi-star-fill text-yellow-500' : 'pi pi-user text-color-secondary'" class="text-xs" />
       {{ m.user?.name }}
       <Tag v-if="m.is_leader" value="Líder" severity="warning" class="text-xs" />
      </span>
     </div>
     <p v-else class="text-color-secondary text-sm">Sin miembros asignados</p>
    </div>
    <!-- Sección 4: Descripción -->
    <div v-if="order.description" class="p-4">
     <h3 class="text-xs font-semibold text-color-secondary uppercase tracking-wider mb-3 flex align-items-center gap-2"><i class="pi pi-align-left text-xs" />Descripción</h3>
     <p class="text-color line-height-3 text-sm line-height-3">{{ order.description }}</p>
    </div>
   </div>
   <template #footer>
    <Button label="Cerrar" severity="secondary" @click="summaryDialog = false" />
   </template>
  </Dialog>
 </div>
 <div v-else-if="loading" class="text-center p-4"><i class="pi pi-spin pi-spinner text-lg text-color-secondary" /></div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/api/client'
import { useCostSummary } from '@/composables/useCostSummary'
import { useStatusTransitions } from '@/composables/useStatusTransitions'
import { useWorkOrderComments } from '@/composables/useWorkOrderComments'
import { useWorkOrderAttachments } from '@/composables/useWorkOrderAttachments'
import { downloadAttachment } from '@/composables/useAttachmentUrl'
import { useToast } from 'primevue/usetoast'
import type { WorkOrderResponse, WorkOrderStatus } from '@/composables/workOrderTypes'
import WorkOrderTimeline from '@/components/WorkOrderTimeline.vue'
import OrderPricing from '@/components/OrderPricing.vue'
import OrderItems from '@/components/OrderItems.vue'
import InputNumber from 'primevue/inputnumber'
import AutoComplete from 'primevue/autocomplete'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import OrderInvoicing from '@/components/OrderInvoicing.vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import Checkbox from 'primevue/checkbox'
import Chips from 'primevue/chips'
import Message from 'primevue/message'
import WorkOrderResources from '@/components/WorkOrderResources.vue'

const route = useRoute()
const toast = useToast()
const STORAGE_BASE = import.meta.env.VITE_APP_URL || ''

const order = ref<WorkOrderResponse | null>(null)
const loading = ref(true)
const activeTab = ref(0)
const pricingKey = ref(0)

// ─── Composable: Status Transitions ──────────────────────────────────
const {
  saving, completeDialog, cancelDialog, reopenDialog,
  completeForm, cancelForm, reopenForm,
  completeError, cancelError, cancelReasons,
  loadCancelReasons, doComplete, doCompleteProduction, doPrecargaBom, doCancel, doReopen,
} = useStatusTransitions()

// ─── Composable: Comments (reactive — orderId from route) ────────────
const orderIdRef = computed(() => route.params.id as string | undefined)
const comments = useWorkOrderComments(orderIdRef, { onLoad: load })
const {
  newComment, replyingTo, replyText, savingComment,
  addComment, addReply, toggleReply, cancelReply,
} = comments

// ─── Composable: Attachments (reactive — orderId from route) ─────────
const {
  uploading, fileInputRef, onFileInput, deleteAttachment,
} = useWorkOrderAttachments(orderIdRef, { onLoad: load })

// ─── Composable: Cost Summary (reactive — pass the order ref) ────────
const { materialCost, machineCost, totalCost, unitCost } = useCostSummary(order)

// ─── Standalone dialogs ──────────────────────────────────────────────
const publishDialog = ref(false)
const publishForm = reactive({ notes: '' })
const startDialog = ref(false)
const startForm = reactive({ notes: '' })
const productionCompleteDialog = ref(false)
const completingProduction = ref(false)
const serialNumbers = ref<string[]>([])
const summaryDialog = ref(false)
const historyDialog = ref(false)

// ─── Quantity editing ────────────────────────────────────────────────
const editingQuantity = ref(false)
const quantityBuffer = ref(1)
const quantityInput = ref<HTMLInputElement | null>(null)

function startQuantityEdit() {
  quantityBuffer.value = order.value?.produced_quantity ?? order.value?.product?.quantity ?? 1
  editingQuantity.value = true
  nextTick(() => quantityInput.value?.focus())
}

function cancelQuantityEdit() {
  editingQuantity.value = false
}

async function saveQuantity() {
  const qty = quantityBuffer.value
  if (!qty || qty < 1) return
  try {
    await api.put(`/work-orders/${order.value!.id}`, { produced_quantity: qty })
    order.value!.produced_quantity = qty
    editingQuantity.value = false
    toast.add({ severity: 'success', summary: 'Cantidad actualizada' })
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e?.response?.data?.message || 'Error' })
  }
}

// ─── Computed ────────────────────────────────────────────────────────
const teamLeaderName = computed(() => {
  const lead = order.value?.members?.find((m: any) => m.is_leader)
  return lead?.user_name || lead?.user?.name || ''
})

const statusColor = computed(() => order.value?.status?.color || '#6b7280')

const canPublish = computed(() => {
  const s = order.value?.status; return s && [1, 2].includes(s.id)
})
const canStart = computed(() => {
  const s = order.value?.status; return s && [3, 4].includes(s.id)
})
const canComplete = computed(() => {
  const s = order.value?.status
  return s && [3, 4, 5].includes(s.id) && order.value?.type !== 'production'
})
const canCompleteProduction = computed(() => {
  const s = order.value?.status
  return s && [3, 4, 5].includes(s.id) && order.value?.type === 'production'
})
const canCancel = computed(() => {
  const s = order.value?.status; return s && [1, 2, 3, 4].includes(s.id)
})
const canReopen = computed(() => {
  const s = order.value?.status; return s && [6, 7].includes(s.id)
})

// ─── pSev: priority → severity helper ────────────────────────────────
function pSev(priority: string): string | undefined {
  const map: Record<string, string> = {
    critical: 'danger',
    high: 'warn',
    medium: 'info',
    low: 'success',
  }
  return map[priority]
}

// ─── Load ────────────────────────────────────────────────────────────
async function load() {
  loading.value = true
  try {
    const { data } = await api.get(`/work-orders/${route.params.id}?include=attachments,members,materials,machineUsages,comments,client,product`)
    order.value = data.data ?? data
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la orden' })
  } finally {
    loading.value = false
    pricingKey.value++
  }
}

// ─── Status-transition actions (simple wrappers) ─────────────────────
async function doPublish() {
  saving.value = true
  try {
    await api.post(`/work-orders/${order.value!.id}/publish`, { notes: publishForm.notes })
    publishDialog.value = false
    publishForm.notes = ''
    toast.add({ severity: 'success', summary: 'Publicada' })
    await load()
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e?.response?.data?.message || 'Error' })
  } finally {
    saving.value = false
  }
}

async function doStart() {
  saving.value = true
  try {
    await api.post(`/work-orders/${order.value!.id}/start`, { notes: startForm.notes })
    startDialog.value = false
    startForm.notes = ''
    toast.add({ severity: 'success', summary: 'Iniciada' })
    await load()
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e?.response?.data?.message || 'Error' })
  } finally {
    saving.value = false
  }
}

async function handleComplete() {
  const ok = await doComplete(order.value?.id)
  if (ok) await load()
}

async function handleCancel() {
  const ok = await doCancel(order.value?.id)
  if (ok) await load()
}

async function handleReopen() {
  const ok = await doReopen(order.value?.id)
  if (ok) await load()
}

async function handlePrecargaBom() {
  const ok = await doPrecargaBom(order.value?.id)
  if (ok) await load()
}

// ─── Production complete ─────────────────────────────────────────────
async function handleCompleteProduction() {
  completingProduction.value = true
  try {
    await api.post(`/work-orders/${order.value!.id}/complete-production`, {
      serial_numbers: serialNumbers.value,
    })
    toast.add({ severity: 'success', summary: 'Producción completada', life: 4000 })
    productionCompleteDialog.value = false
    serialNumbers.value = []
    await load()
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: e?.response?.data?.message || e?.message || 'Error',
      life: 5000,
    })
  } finally {
    completingProduction.value = false
  }
}

// ─── Client assign dialog ────────────────────────────────────────────
const showClientDialog = ref(false)
const clientSearch = ref('')
const clientResults = ref<any[]>([])
const selectedClient = ref<{ id: number; label: string } | null>(null)
const savingClient = ref(false)

async function searchClients(event: { query: string }) {
  if (!event.query?.trim()) {
    clientResults.value = []
    return
  }
  try {
    const { data } = await api.get(`/clients/search?q=${encodeURIComponent(event.query)}`)
    clientResults.value = (data.data || []).map((c: any) => ({
      id: c.id,
      label: `${c.full_name} [${c.document_number || ''}]`,
    }))
  } catch {
    clientResults.value = []
  }
}

async function saveClient() {
  if (!selectedClient.value?.id) return
  savingClient.value = true
  try {
    await api.put(`/work-orders/${route.params.id}`, { client_id: selectedClient.value.id })
    toast.add({ severity: 'success', summary: 'Cliente asignado' })
    showClientDialog.value = false
    await load()
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e?.response?.data?.message || 'Error' })
  } finally {
    savingClient.value = false
  }
}

// ─── History dialog ─────────────────────────────────────────────────
function openCombinedHistory() {
  historyDialog.value = true
}

// ─── Utility functions ───────────────────────────────────────────────
function fileIcon(mime: string) {
  if (!mime) return 'pi pi-file'
  if (mime.startsWith('image/')) return 'pi pi-image'
  if (mime === 'application/pdf') return 'pi pi-file-pdf text-red-500'
  if (mime?.includes('spreadsheet') || mime?.includes('excel')) return 'pi pi-file-excel text-green-500'
  if (mime?.includes('word') || mime?.includes('document')) return 'pi pi-file-word text-blue-500'
  if (mime?.includes('zip') || mime?.includes('rar') || mime?.includes('tar')) return 'pi pi-file-archive text-yellow-500'
  return 'pi pi-file'
}

function attachmentUrl(filename: string) {
  return `${STORAGE_BASE}/storage/attachments/${filename}`
}

function formatDate(date: string | null | undefined): string {
 if (!date) return '—'
 return new Date(date).toLocaleDateString('es-EC', {
  year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
 })
}

function formatSize(bytes: number) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function auditLogType(log: any): 'material' | 'machine' {
  return log.resource_type === 'machine' ? 'machine' : 'material'
}

function auditLogText(log: any): string {
  return log.summary || `${log.resource_type} #${log.resource_id}`
}

// ─── History dialog ────────────────────────────────────────
const historyLoading = ref(false)
const historyLogs = ref<any[]>([])

async function loadHistory() {
  historyLoading.value = true
  try {
    const { data } = await api.get(`/work-orders/${route.params.id}/audit-logs`)
    historyLogs.value = data.data ?? data ?? []
  } catch {
    historyLogs.value = []
  } finally {
    historyLoading.value = false
  }
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleString('es-EC', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  } catch {
    return dateStr
  }
}


// ─── Watch history dialog open ──────────────────────────
watch(() => historyDialog.value, (open) => {
  if (open) loadHistory()
})

// ─── Init ────────────────────────────────────────────────────────────
onMounted(async () => {
  await load()
  await loadCancelReasons()
})
</script>
<style scoped>
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.full-width { grid-column: 1 / -1; }
.field label { display: block; margin-bottom: 0.375rem; font-size: 0.875rem; font-weight: 500; }
.line-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr auto; gap: 0.5rem; align-items: end; margin-bottom: 0.5rem; }
.history-panel { max-height: 80vh; }
.info-bar {
 display: flex;
 align-items: center;
 gap: 0.4rem;
 background: var(--p-surface-50, #f8f9fa);
 border: 1px solid var(--p-surface-200, #e9ecef);
 border-radius: 0.5rem;
 padding: 0.5rem 0.75rem;
 cursor: pointer;
 transition: box-shadow 0.15s;
 overflow: hidden;
}
.info-bar:hover {
 box-shadow: 0 0 0 2px var(--p-primary-200, #c7d2fe);
}

/* === Mobile improvements === */
@media (max-width: 768px) {
 .info-bar {
  flex-wrap: wrap;
  gap: 0.3rem;
  padding: 0.5rem;
  font-size: 0.8rem;
 }
 .info-bar > :last-child {
  margin-left: 0 !important;
  flex-basis: 100%;
 }
 .actions-bar {
  flex-direction: row;
  flex-wrap: wrap;
  margin-left: 0 !important;
  justify-content: center;
  width: 100%;
 }
 .actions-bar .p-button {
  font-size: 0.8rem;
  padding: 0.4rem 0.75rem;
 }
 .comments-input {
  flex-direction: column;
 }
 .comments-input .p-button {
  align-self: flex-end;
 }
 .form-grid {
  grid-template-columns: 1fr;
 }

 /* Dialogs: stacked buttons on very small screens */
 :deep(.dialog-mobile-stacked .p-dialog-footer) {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
 }
 :deep(.dialog-mobile-stacked .p-dialog-footer .p-button) {
  width: 100%;
 }

 /* Full-width textarea in mobile */
 .comments-input textarea {
  font-size: 16px;
 }

 /* Touch-friendly attachment delete */
 .group i.pi-trash {
  min-width: 28px;
  min-height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
 }
}
</style>

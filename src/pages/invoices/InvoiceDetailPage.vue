<template>
  <div>
    <div class="page-header flex flex-wrap gap-2">
      <h3 class="text-base md:text-xl">Factura {{ displayCode }}</h3>
      <div class="flex flex-wrap gap-2">
        <Button v-if="invoice?.work_order_id" label="Ver Orden de Trabajo" icon="pi pi-clipboard" size="small" severity="help" @click="$router.push(`/work-orders/${invoice.work_order_id}`)" />
        <Button label="Editar" icon="pi pi-pencil" size="small" severity="info" @click="$router.push(`/invoices/${$route.params.id}/edit`)" />
        <Button label="Volver" icon="pi pi-arrow-left" size="small" severity="secondary" @click="$router.push('/invoices')" />
      </div>
    </div>

    <!-- SRI Status Banner -->
      <Card class="mb-4" v-if="invoice?.sri_status">
        <template #content>
          <div class="flex flex-wrap gap-3 align-items-center">
            <div class="flex align-items-center gap-2">
              <i v-if="sriStatusKey === 'autorizado'" class="pi pi-check-circle" :class="sriStatusIconClass" style="font-size: 1.25rem"></i>
              <i v-else class="pi pi-verified" :class="sriStatusIconClass" style="font-size: 1.25rem"></i>
              <Tag :severity="sriStatusSeverity" :value="sriStatusLabel" />
            </div>
            <span v-if="invoice.sri_number" class="text-xs font-mono font-semibold">
              Nro. {{ invoice.sri_number }}
            </span>
            <span v-if="invoice.access_key" class="text-xs text-color-secondary font-mono break-all">
              Clave: {{ invoice.access_key }}
            </span>
            <div class="flex flex-wrap gap-1">
              <Button
                v-if="sriStatusKey === 'autorizado' && invoice.access_key"
                label="Copiar clave"
                icon="pi pi-copy"
                size="small"
                severity="success"
                text
                @click="copyAccessKey"
              />
              <Button
                v-if="sriStatusKey === 'autorizado'"
                label="Descargar RIDE PDF"
                icon="pi pi-file-pdf"
                size="small"
                severity="help"
                @click="downloadRide"
              />
            </div>
          </div>
        </template>
      </Card>

    <!-- Emitir factura electrónica (solo si draft y no emitida) -->
    <Card class="mb-4" v-if="invoice?.status === 'draft' && !invoice?.sri_status">
      <template #content>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Esta factura aún no ha sido emitida electrónicamente.</p>
            <p class="text-xs text-gray-400">Se generará el XML firmado y se enviará al SRI.</p>
          </div>
          <Button
            label="Emitir factura electrónica"
            icon="pi pi-send"
            severity="success"
            :loading="emitting"
            @click="emitElectronicInvoice"
          />
        </div>
      </template>
    </Card>

    <Message v-if="emitError" severity="error" :closable="true" @close="emitError = ''" class="mb-4">
      {{ emitError }}
    </Message>

    <div v-if="loading" class="flex justify-center p-8">
      <ProgressSpinner />
    </div>

    <template v-else-if="invoice">
      <!-- Header info -->
      <Card class="mb-4">
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <span class="text-xs text-color-secondary block">Cliente</span>
              <span class="font-medium text-sm">{{ invoice.client?.name || invoice.client?.full_name || '-' }}</span>
              <span class="text-xs text-color-secondary block mt-1">{{ invoice.client?.document_type || 'Documento' }}</span>
              <span class="text-sm">{{ invoice.client?.document_number || invoice.client?.ruc || invoice.client?.tax_id || '-' }}</span>
            </div>
            <div>
              <span class="text-xs text-color-secondary block">Dirección</span>
              <span class="text-sm">{{ invoice.client?.address || '-' }}</span>
              <span class="text-xs text-color-secondary block mt-1">Teléfono</span>
              <span class="text-sm">{{ invoice.client?.phone || '-' }}</span>
            </div>
            <div>
              <span class="text-xs text-color-secondary block">Fecha de emisión</span>
              <span class="text-sm">{{ invoice.issue_date || '-' }}</span>
              <span class="text-xs text-color-secondary block mt-1">Estado</span>
              <div class="flex flex-wrap gap-1">
                <Tag :value="invoice.status || 'Pendiente'" :severity="invoice.status === 'Anulada' ? 'danger' : invoice.status === 'Pagada' ? 'success' : 'info'" />
                <Tag v-if="invoice.sri_status" :severity="sriStatusSeverity" :value="'SRI: ' + sriStatusLabel" />
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Items -->
      <Card class="mb-4">
        <template #title>Detalle de Facturación</template>
        <template #content>
          <!-- Desktop: table -->
          <table class="items-table hidden md:!table">
            <thead>
              <tr>
                <th class="c">#</th>
                <th>Descripción</th>
                <th class="c">Cant</th>
                <th class="r">Precio U.</th>
                <th class="r">Desc.</th>
                <th class="r">Precio Total</th>
                <th class="c">IVA</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in invoice.items" :key="item.id">
                <td class="c">{{ idx + 1 }}</td>
                <td class="desc mono">{{ item.description }}</td>
                <td class="c">{{ item.quantity }}</td>
                <td class="r mono">${{ formatMoney(item.unit_price) }}</td>
                <td class="r mono">${{ formatMoney(item.discount ?? 0) }}</td>
                <td class="r mono">${{ formatMoney(item.quantity * item.unit_price - (item.discount ?? 0)) }}</td>
                <td class="c iva-col">{{ item.iva_label || '15%' }}</td>
              </tr>
              <!-- Totales -->
              <tr class="totals-sep"><td colspan="7"></td></tr>
              <tr v-for="st in subtotalesPorIva" :key="st.label" class="totals-row">
                <td colspan="5" class="r">Subtotal IVA {{ st.label }}</td>
                <td class="r mono">${{ formatMoney(st.base) }}</td>
                <td></td>
              </tr>
              <tr class="totals-row" v-if="totalDescuento">
                <td colspan="5" class="r">Descuento</td>
                <td class="r mono">${{ formatMoney(totalDescuento) }}</td>
                <td></td>
              </tr>
              <tr class="totals-row">
                <td colspan="5" class="r">IVA 15%</td>
                <td class="r mono">${{ formatMoney(ivaAmount) }}</td>
                <td></td>
              </tr>
              <tr class="totals-row grand-total">
                <td colspan="5" class="r">TOTAL</td>
                <td class="r mono bold">${{ formatMoney(total) }}</td>
                <td></td>
              </tr>
            </tbody>
          </table>

          <!-- Mobile: compact cards -->
          <div class="block md:hidden">
            <div v-for="(item, idx) in invoice.items" :key="item.id" class="flex flex-column pb-2 mb-2" style="border-bottom: 1px solid var(--p-content-border-color)">
              <div class="flex align-items-start justify-content-between gap-2">
                <span class="font-medium text-sm flex-1 min-w-0">{{ item.description }}</span>
                <span class="text-xs font-mono text-color-secondary whitespace-nowrap">#{{ idx + 1 }}</span>
              </div>
              <div class="flex flex-wrap gap-x-3 gap-y-1 text-xs text-color-secondary mt-1">
                <span><strong>Cant.:</strong> {{ item.quantity }}</span>
                <span><strong>P. Unit.:</strong> ${{ formatMoney(item.unit_price) }}</span>
                <span v-if="item.discount"><strong>Desc.:</strong> ${{ formatMoney(item.discount ?? 0) }}</span>
                <span><strong>IVA:</strong> {{ item.iva_label || '15%' }}</span>
              </div>
              <div class="w-full text-right font-mono text-sm" style="color: var(--p-primary-color)">
                ${{ formatMoney(item.quantity * item.unit_price - (item.discount ?? 0)) }}
              </div>
            </div>

            <!-- Mobile totals -->
            <div class="w-full surface-ground p-2 border-round">
              <div v-for="st in subtotalesPorIva" :key="st.label" class="flex justify-content-between align-items-center py-1">
                <span class="text-color-secondary text-xs">Subtotal IVA {{ st.label }}</span>
                <span class="font-mono text-xs">${{ formatMoney(st.base) }}</span>
              </div>
              <div v-if="totalDescuento" class="flex justify-content-between align-items-center py-1">
                <span class="text-color-secondary text-xs">Descuento</span>
                <span class="font-mono text-xs">${{ formatMoney(totalDescuento) }}</span>
              </div>
              <div class="flex justify-content-between align-items-center py-1">
                <span class="text-color-secondary text-xs">IVA 15%</span>
                <span class="font-mono text-xs">${{ formatMoney(ivaAmount) }}</span>
              </div>
              <div class="flex justify-content-between align-items-center pt-1 border-top-1" style="border-color: var(--p-text-color)">
                <span class="font-semibold text-sm">TOTAL</span>
                <span class="font-bold font-mono text-sm">${{ formatMoney(total) }}</span>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Payments -->
      <Card class="mb-4" v-if="invoice.payments?.length">
        <template #title>Pagos</template>
        <template #content>
          <!-- Desktop -->
          <DataTable :value="invoice.payments" stripedRows class="hidden md:!table">
            <Column field="payment_date" header="Fecha" />
            <Column field="payment_method.name" header="Método" />
            <Column field="amount" header="Monto">
              <template #body="{ data }">
                <span class="text-right block">${{ formatMoney(data.amount) }}</span>
              </template>
            </Column>
            <Column field="bank.name" header="Banco" />
            <Column field="voucher_number" header="Comprobante" />
          </DataTable>
          <!-- Mobile -->
          <div class="block md:hidden">
            <div v-for="p in invoice.payments" :key="p.id" class="border-1 border-round surface-card p-3 mb-2">
              <div class="flex justify-content-between align-items-start gap-2">
                <span class="font-medium text-sm">{{ p.payment_method?.name || 'Pago' }}</span>
                <span class="font-semibold text-sm">${{ formatMoney(p.amount) }}</span>
              </div>
              <div class="flex flex-wrap gap-x-3 gap-y-1 text-xs text-color-secondary mt-1">
                <span>Fecha: <strong>{{ p.payment_date }}</strong></span>
                <span v-if="p.bank?.name">Banco: <strong>{{ p.bank.name }}</strong></span>
                <span v-if="p.voucher_number">Comp.: <strong>{{ p.voucher_number }}</strong></span>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- SRI Logs -->
      <Card class="mb-4" v-if="invoice?.sri_status">
        <template #title>Documento Electrónico SRI</template>
        <template #content>
          <div class="flex flex-wrap items-center gap-2 mb-3">
            <Button
              v-if="sriStatusKey === 'pendiente' || sriStatusKey === 'rechazado' || sriStatusKey === 'error'"
              label="Reenviar al SRI"
              icon="pi pi-refresh"
              size="small"
              severity="warn"
              :loading="retrying"
              @click="retrySri"
            />
            <Button
              v-if="invoice.access_key"
              :label="'Clave de Acceso: ' + invoice.access_key"
              icon="pi pi-copy"
              size="small"
              severity="info"
              text
              @click="copyAccessKey"
            />
          </div>

          <!-- SRI logs siempre visibles cuando hay doc electrónico -->
          <Accordion v-model:activeIndex="sriAccordionIndex">
            <AccordionPanel value="0">
              <AccordionHeader>Historial de Comunicación con SRI</AccordionHeader>
              <AccordionContent>
              <!-- Desktop -->
              <DataTable :value="sriLogs" stripedRows size="small" v-if="sriLogs.length" @row-click="openLogDetail" class="hidden md:!table" :tableStyle="{ tableLayout: 'fixed' }">
                <Column field="created_at" header="Fecha" style="width: 130px">
                  <template #body="{ data }">
                    <span class="text-xs cursor-pointer hover:text-primary">{{ formatDateTime(data.created_at) }}</span>
                  </template>
                </Column>
                <Column field="action" header="Acción" style="width: 80px">
                  <template #body="{ data }">
                    <Tag :severity="logSeverity(data.status)" :value="formatAction(data.action)" size="small" class="cursor-pointer" />
                  </template>
                </Column>
                <Column field="message" header="Mensaje">
                  <template #body="{ data }">
                    <span class="flex align-items-center gap-1 cursor-pointer hover:text-primary text-sm" style="word-break: break-word; overflow-wrap: break-word">
                      <i v-if="data.message === 'AUTORIZADO'" class="pi pi-check-circle text-green-500" style="font-size: 1rem; flex-shrink: 0"></i>
                      <span>{{ data.message || '-' }}</span>
                    </span>
                  </template>
                </Column>
              </DataTable>

              <!-- Mobile -->
              <div class="block md:hidden" v-if="sriLogs.length">
                <div v-for="log in sriLogs" :key="log.id" class="pb-2 mb-2" style="border-bottom: 1px solid var(--p-content-border-color); cursor: pointer" @click="openLogDetail({ data: log })">
                  <div class="flex justify-content-between align-items-start gap-2">
                    <span class="text-xs text-color-secondary">{{ formatDateTime(log.created_at) }}</span>
                    <Tag :severity="logSeverity(log.status)" :value="formatAction(log.action)" size="small" />
                  </div>
                  <div class="flex align-items-center gap-1 mt-1 text-xs">
                    <i v-if="log.message === 'AUTORIZADO'" class="pi pi-check-circle text-green-500" style="font-size: 0.75rem"></i>
                    <span style="word-break: break-word; overflow-wrap: break-word">{{ log.message || '-' }}</span>
                  </div>
                </div>
              </div>

              <p v-else class="text-sm text-color-secondary italic">Sin registros de comunicación SRI</p>

              <Divider class="my-2" />
              <p class="text-xs text-color-secondary">
                <i class="pi pi-info-circle mr-1"></i>
                Última actualización: {{ lastLogUpdate || '-' }}
              </p>
            </AccordionContent>
            </AccordionPanel>
          </Accordion>
        </template>
      </Card>

      <!-- Dialog detalle log SRI -->
      <Dialog v-model:visible="logDialogVisible" :header="'Log: ' + logDialogData?.action" modal :style="{ width: 'min(700px, 95vw)' }" :maximizable="true">
        <div class="flex flex-column gap-3">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div>
              <span class="font-semibold text-xs block text-color-secondary">Estado</span>
              <Tag :severity="logDialogData?.status === 'success' ? 'success' : logDialogData?.status === 'error' ? 'danger' : 'warn'" :value="logDialogData?.status" size="small" />
            </div>
            <div>
              <span class="font-semibold text-xs block text-color-secondary">Fecha</span>
              <span class="text-sm">{{ formatDateTime(logDialogData?.created_at) }}</span>
            </div>
          </div>

          <div>
            <span class="font-semibold text-xs block text-color-secondary">Mensaje</span>
            <p class="text-sm mt-1">{{ logDialogData?.message || '-' }}</p>
          </div>

          <Divider />

          <div v-if="logDialogPayload">
            <span class="font-semibold text-xs block text-color-secondary mb-1">Respuesta del SRI <i class="pi pi-copy cursor-pointer hover:text-primary" style="font-size: 0.75rem" @click="copySriResponse"></i></span>
            <pre class="surface-ground p-3 border-1 border-round text-xs overflow-auto max-h-96 whitespace-pre-wrap break-all">{{ logDialogPayload }}</pre>
          </div>
          <div v-else>
            <p class="text-sm text-color-secondary italic">Sin payload de respuesta</p>
          </div>
        </div>

        <template #footer>
          <Button label="Cerrar" icon="pi pi-times" severity="secondary" @click="logDialogVisible = false" />
        </template>
      </Dialog>
    </template>

    <Message v-else severity="warn">Factura no encontrada</Message>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { api } from '@/api'
import { useInvoiceCalculations } from '@/composables/useInvoiceCalculations'
import { useSriDetail } from '@/composables/useSriDetail'

const route = useRoute()
const toast = useToast()

const invoice = ref<any>(null)
const sriAccordionIndex = ref<number | number[]>([0])

async function loadInvoice() {
  try {
    const id = route.params.id
    if (!id) return
    const res = await api.get(`/api/invoices/${id}`)
    invoice.value = res.data?.data ?? res.data
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || e.message, life: 5000 })
  }
}

watch(() => route.params.id, () => loadInvoice())
onMounted(() => loadInvoice())

// --- Cálculos de la factura ---
const invoiceItems = computed(() => invoice.value?.items || [])
const {
  subtotal,
  totalDescuento,
  ivaAmount,
  total,
  subtotalesPorIva,
  formatMoney,
} = useInvoiceCalculations(invoiceItems)

// --- Operaciones SRI ---
const sri = useSriDetail(invoice)
const {
  emitInProgress,
  retrying,
  sriLogs,
  showSriLogs,
  loadingLogs,
  lastLogUpdate,
  logDialogVisible,
  logDialogData,
  logDialogPayload,
  formatAction,
  logSeverity,
  formatDateTime,
  formatXml,
} = sri

watch(showSriLogs, (v) => {
  if (v) sri.loadSriLogs()
})
</script>

<style scoped>
.items-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
.items-table th { background: var(--p-surface-100); padding: 6px 6px; font-size: 0.75rem; text-transform: uppercase; color: var(--p-text-muted-color); letter-spacing: 0.5px; border-bottom: 2px solid var(--p-content-border-color); }
.items-table td { padding: 6px 6px; border-bottom: 1px solid var(--p-content-border-color); font-size: 0.85rem; }
.items-table .desc { max-width: 240px; overflow: hidden; text-overflow: ellipsis; }
.items-table .c { text-align: center; }
.items-table .r { text-align: right; }
.items-table .mono { font-family: monospace; }
.items-table .iva-col { font-size: 0.75rem; color: var(--p-text-muted-color); }
.items-table .totals-sep td { padding: 0; border-bottom: none; height: 4px; }
.items-table .totals-row td { background: var(--p-surface-50); border-bottom: 1px solid var(--p-content-border-color); font-size: 0.85rem; padding: 5px 6px; }
.items-table .grand-total td { border-top: 2px solid var(--p-text-color); font-weight: 700; font-size: 0.9rem; }
.items-table .grand-total .mono { font-weight: 700; }
.items-table .bold { font-weight: 700; }
</style>

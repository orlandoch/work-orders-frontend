<template>
  <Card>
    <template #title>
      <span class="flex align-items-center gap-2">
        <i class="pi pi-calculator"></i>
        Precios y Facturación
      </span>
    </template>

    <template #content>
      <div v-if="loading" class="flex justify-content-center p-4">
        <ProgressSpinner style="width:40px;height:40px" />
      </div>

      <template v-else>
      <!-- Billing basis & mode selectors -->
      <div class="grid formgrid p-fluid mb-3">
        <div class="col-12 md:col-6">
          <label class="block text-sm font-medium text-color mb-1">Base de facturación</label>
          <Select
            v-model="billingBasis"
            :options="billingBasisOptions"
            optionLabel="label"
            optionValue="value"
            class="w-full"
            @change="updatePricing"
          >
            <template #value="{ value }">
              <span class="flex align-items-center gap-2">
                <i :class="value === 'estimated' ? 'pi pi-calculator text-color-secondary text-sm' : 'pi pi-check-circle text-primary text-sm'"></i>
                <span>{{ value === 'estimated' ? `Total Est.: $${formatMoney(pricingData.totals?.estimated ?? pricingData.total ?? 0)}` : `Total Real: $${formatMoney(pricingData.totals?.actual ?? pricingData.total ?? 0)}` }}</span>
              </span>
            </template>
            <template #option="{ option }">
              <span class="flex align-items-center gap-2">
                <i :class="option.value === 'estimated' ? 'pi pi-calculator text-color-secondary text-sm' : 'pi pi-check-circle text-primary text-sm'"></i>
                <span>{{ option.label }}</span>
              </span>
            </template>
          </Select>
        </div>
        <div class="col-12 md:col-6">
          <label class="block text-sm font-medium text-color mb-1">Modo de facturación</label>
          <Select
            v-model="billingMode"
            :options="billingModeOptions"
            optionLabel="label"
            optionValue="value"
            class="w-full"
            @change="onBillingModeChange"
          />
        </div>
      </div>

      <!-- Info message about current mode -->
      <Message v-if="billingMode === 'product_list'" severity="info" :closable="false" class="mb-3">
        Seleccione productos del listado para facturar.
      </Message>
      <Message v-if="billingMode === 'item_list'" severity="info" :closable="false" class="mb-3">
        Facturando por ítem de orden (una línea por producto/servicio).
      </Message>
      <Message v-if="billingMode === 'line_items'" severity="warn" :closable="false" class="mb-3">
        Ingrese líneas de factura manual. El total debe coincidir con <strong>${{ formatMoney(targetTotal) }}</strong>.
      </Message>

      <!-- Item groups (agrupación por WorkOrderItem) -->
      <div v-if="billingMode === 'product_list' && pricingData.item_groups && pricingData.item_groups.length > 1" class="mb-3">
        <Accordion :activeIndex="0">
          <AccordionTab v-for="(group, gi) in pricingData.item_groups" :key="group.item_id || gi">
            <template #header>
              <div class="flex align-items-center justify-content-between w-full pr-3">
                <div class="flex align-items-center gap-2">
                  <i class="pi pi-tag text-primary text-sm" />
                  <span class="font-medium text-sm">{{ group.description }}</span>
                  <Chip v-if="group.quantity" :label="`× ${formatQty(group.quantity)} ${group.unit || ''}`" class="text-xs" />
                </div>
                <span class="font-semibold text-primary text-sm">${{ formatMoney(group.subtotal || 0) }}</span>
              </div>
            </template>
            <div class="grid">
              <div v-for="(line, li) in group.lines" :key="line.mat_id || line.mu_id || li" class="col-12 flex align-items-center justify-content-between py-1 border-bottom-1 border-50">
                <div class="flex align-items-center gap-2">
                  <i :class="line.type === 'machine' ? 'pi pi-cog text-color-secondary text-xs' : 'pi pi-box text-color-secondary text-xs'"></i>
                  <span class="text-sm">
                    {{ line.description }}
                    <span class="text-color-secondary text-xs">
                      × {{ formatQty(line.quantity) }} @ ${{ formatMoney(line.unit_price) }}
                    </span>
                  </span>
                </div>
                <span class="text-sm font-medium">${{ formatMoney(line.total || 0) }}</span>
              </div>
            </div>
          </AccordionTab>
        </Accordion>
      </div>

      <!-- Single item (1 group) compact summary -->
      <div v-else-if="billingMode === 'product_list' && pricingData.item_groups && pricingData.item_groups.length === 1" class="mb-3 text-sm text-color-secondary">
        <div class="flex align-items-center gap-2 p-2 border-round surface-ground">
          <i class="pi pi-tag text-primary" />
          <span>{{ pricingData.item_groups[0].description }}</span>
          <Chip v-if="pricingData.item_groups[0].quantity" :label="`× ${formatQty(pricingData.item_groups[0].quantity)} ${pricingData.item_groups[0].unit || ''}`" class="text-xs" />
        </div>
      </div>

      <!-- UNIFIED ITEMS TABLE (line_items mode: from order, manual mode: from invoice lines) -->
      <div v-if="billingMode === 'product_list'" class="hidden lg:block">
        <DataTable scrollable scrollHeight="flex" :value="combinedItems" class="p-datatable-sm" stripedRows>
          <Column header="" style="width:40px">
            <template #body="s">
              <i :class="itemIcon(s.data.type)" v-tooltip.top="itemTypeLabel(s.data.type)"></i>
            </template>
          </Column>
          <Column field="description" header="Descripción" style="min-width:200px">
            <template #body="s">
              <span :class="{ 'text-color-secondary': s.data.type === 'machine' }">
                {{ s.data.description }}
              </span>
            </template>
          </Column>
          <Column field="unit" header="U." style="width:60px" />
          <Column field="quantity" header="Cant." style="width:80px" class="text-right">
            <template #body="s">{{ formatQty(s.data.quantity) }}</template>
          </Column>
          <Column field="unit_price" header="P. Unit." style="width:100px" class="text-right">
            <template #body="s">$ {{ formatMoney(s.data.unit_price) }}</template>
          </Column>
          <Column header="IVA" style="width:100px">
            <template #body="s">
              <span v-if="editingLine === s.data._key">
                <Select v-model="editForm.iva_id" :options="ivas" optionValue="id" optionLabel="name" placeholder="IVA" class="w-28" size="small" />
              </span>
              <span v-else>{{ s.data.iva_label }}</span>
            </template>
          </Column>
          <Column field="line_total" header="Total" style="width:100px" class="text-right">
            <template #body="s">$ <strong>{{ formatMoney(s.data.line_total) }}</strong></template>
          </Column>
        </DataTable>
      </div>

      <!-- Mobile cards for items (PrimeVue Card + PrimeFlex grid) -->
      <div class="block lg:hidden mt-3 grid">
        <!-- Empty state -->
        <template v-if="billingMode === 'product_list' && combinedItems.length === 0">
          <div class="col-12 text-color-secondary p-4 text-center">Seleccione productos del listado para facturar.</div>
        </template>
        <template v-else-if="billingMode === 'item_list' && combinedItems.length === 0">
          <div class="col-12 text-color-secondary p-4 text-center">Agregue ítems a la orden para facturar.</div>
        </template>
        <template v-else-if="billingMode === 'line_items' && invoiceLines.length === 0">
          <div class="col-12 text-color-secondary p-4 text-center">Sin líneas de facturación aún.</div>
        </template>

        <!-- Product list mode: render from combinedItems -->
        <template v-if="billingMode === 'product_list'">
          <div v-for="item in combinedItems" :key="item._key || item.description" class="col-12 mb-2">
            <div class="p-3 border-1 border-round surface-card">
              <div class="font-medium text-sm" :class="{ 'text-color-secondary': item.type === 'machine' }">
                {{ item.description }}
              </div>
              <div class="flex flex-wrap gap-3 align-items-center text-sm text-color-secondary mt-1">
                <span v-if="item.unit"><strong>U.:</strong> {{ item.unit }}</span>
                <span v-if="item.quantity != null"><strong>Cant.:</strong> {{ formatQty(item.quantity) }}</span>
                <span v-if="item.unit_price != null"><strong>P. Unit.:</strong> ${{ formatMoney(item.unit_price) }}</span>
                <span v-if="item.iva_label"><strong>IVA:</strong> {{ item.iva_label }}</span>
              </div>
              <div class="mt-1">
                <span class="font-semibold text-sm">Total: ${{ formatMoney(item.line_total || 0) }}</span>
              </div>
            </div>
          </div>
        </template>

        <!-- Item list mode: render from combinedItems (one per WO item) -->
        <template v-if="billingMode === 'item_list'">
          <div v-for="item in combinedItems" :key="item.id" class="col-12 mb-2">
            <div class="p-3 border-1 border-round surface-card">
              <div class="font-medium text-sm">
                {{ item.description }}
              </div>
              <div class="flex flex-wrap gap-3 align-items-center text-sm text-color-secondary mt-1">
                <span v-if="item.unit"><strong>U.:</strong> {{ item.unit }}</span>
                <span v-if="item.quantity != null"><strong>Cant.:</strong> {{ formatQty(item.quantity) }}</span>
                <span v-if="item.unit_price != null"><strong>P. Unit.:</strong> ${{ formatMoney(item.unit_price) }}</span>
                <span v-if="item.iva_label"><strong>IVA:</strong> {{ item.iva_label }}</span>
              </div>
              <div class="mt-1">
                <span class="font-semibold text-sm">Total: ${{ formatMoney(item.line_total || 0) }}</span>
              </div>
            </div>
          </div>
        </template>

        <!-- Line items mode: render from invoiceLines -->
        <template v-if="billingMode === 'line_items'">
          <div v-for="s in invoiceLines" :key="s.data?._key || s._key" class="col-12 mb-2">
            <div class="p-3 border-1 border-round surface-card">
              <div class="flex align-items-start justify-content-between gap-2">
                <span class="font-medium text-sm" :class="{ 'text-color-secondary': s.data?.type === 'machine' }">
                  {{ s.data?.description }}
                </span>
                <div class="flex gap-1">
                  <Button v-if="s.data?._key" icon="pi pi-pencil" text border-round severity="secondary" size="small"
                    @click="editInvoiceLine(s)" />
                  <Button v-if="s.data?._key" icon="pi pi-trash" text border-round severity="danger" size="small"
                    @click="removeInvoiceLine(s.data._key)" />
                </div>
              </div>
              <div class="flex flex-wrap gap-3 align-items-center text-sm text-color-secondary mt-1">
                <span v-if="s.data?.unit"><strong>U.:</strong> {{ s.data.unit }}</span>
                <span v-if="s.data?.quantity != null"><strong>Cant.:</strong> {{ formatQty(s.data.quantity) }}</span>
                <span v-if="s.data?.unit_price != null"><strong>P. Unit.:</strong> ${{ formatMoney(s.data.unit_price) }}</span>
                <span v-if="s.data?.iva_label"><strong>IVA:</strong> {{ s.data.iva_label }}</span>
              </div>
              <div class="mt-1">
                <span class="font-semibold text-sm">Total: ${{ formatMoney(s.data?.line_total || 0) }}</span>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- MANUAL INVOICE LINES TABLE (desktop) -->
      <div v-if="billingMode === 'line_items'" class="hidden lg:block">
        <DataTable scrollable scrollHeight="flex" :value="invoiceLines" class="p-datatable-sm" stripedRows>
          <Column field="description" header="Descripción" style="min-width:200px">
            <template #body="s">
              <InputText v-if="editingLine === s.data._key" v-model="editForm.description" style="width:100%;min-width:120px;max-width:100%" class="text-sm" />
              <span v-else>{{ s.data.description }}</span>
            </template>
          </Column>
          <Column field="quantity" header="Cant." style="width:90px" class="text-right">
            <template #body="s">
              <InputNumber v-if="editingLine === s.data._key" v-model="editForm.quantity" :min="0.01" :step="0.01" :minFractionDigits="2" :maxFractionDigits="4" inputStyle="width:70px" class="inline-flex" inputClass="text-sm text-right" />
              <span v-else>{{ formatQty(s.data.quantity) }}</span>
            </template>
          </Column>
          <Column field="unit_price" header="P. Unit." style="width:110px" class="text-right">
            <template #body="s">
              <InputNumber v-if="editingLine === s.data._key" v-model="editForm.unit_price" :min="0" :step="0.01" :minFractionDigits="2" :maxFractionDigits="4" inputStyle="width:90px" class="inline-flex" inputClass="text-sm text-right" />
              <span v-else>$ {{ formatMoney(s.data.unit_price) }}</span>
            </template>
          </Column>
          <Column header="IVA" style="width:110px">
            <template #body="s">
              <span v-if="editingLine === s.data._key">
                <Select v-model="editForm.iva_id" :options="ivas" optionValue="id" optionLabel="name" placeholder="IVA" style="width:100px;min-width:90px" size="small" />
              </span>
              <span v-else>{{ s.data.iva_label }}</span>
            </template>
          </Column>
          <Column field="line_total" header="Total" style="width:100px" class="text-right">
            <template #body="s">
              <span v-if="editingLine === s.data._key">$ {{ formatMoney(editForm.quantity * editForm.unit_price) }}</span>
              <span v-else>$ <strong>{{ formatMoney(s.data.line_total) }}</strong></span>
            </template>
          </Column>
          <Column header="" style="width:100px">
            <template #body="s">
              <template v-if="editingLine === s.data._key">
                <Button icon="pi pi-check" text border-round severity="success" size="small" @click="saveLine(s.data)" :loading="savingLine" />
                <Button icon="pi pi-times" text border-round severity="secondary" size="small" @click="cancelEdit" />
              </template>
              <template v-else>
                <Button icon="pi pi-pencil" text border-round severity="info" size="small" @click="startEdit(s.data)" />
                <Button icon="pi pi-trash" text border-round severity="danger" size="small" @click="deleteLine(s.data)" :loading="deletingLine === s.data._key" />
              </template>
            </template>
          </Column>
        </DataTable>

        <!-- New line button -->
        <div class="mt-3">
          <Button v-if="!showAddForm && editingLine === null" label="Agregar línea" icon="pi pi-plus" size="small" severity="info" @click="showAddForm = true" />
        </div>

        <!-- New line form -->
        <div v-if="showAddForm" class="mt-3 border-1 border-round p-3 surface-ground">
          <div class="grid formgrid p-fluid align-items-end">
            <div class="col-12 md:col-5">
              <label class="text-sm text-color-secondary block mb-1">Descripción</label>
              <InputText v-model="newLine.description" placeholder="Ej: Diseño gráfico" class="w-full text-sm" />
            </div>
            <div class="col-6 md:col-2">
              <label class="text-sm text-color-secondary block mb-1">Cantidad</label>
              <InputNumber v-model="newLine.quantity" :min="0.01" :step="0.01" :minFractionDigits="2" :maxFractionDigits="4" class="w-full" inputClass="text-sm text-right" />
            </div>
            <div class="col-6 md:col-2">
              <label class="text-sm text-color-secondary block mb-1">P. Unitario</label>
              <InputNumber v-model="newLine.unit_price" :min="0" :step="0.01" :minFractionDigits="2" :maxFractionDigits="4" class="w-full" inputClass="text-sm text-right" />
            </div>
            <div class="col-6 md:col-2">
              <label class="text-sm text-color-secondary block mb-1">IVA</label>
              <Select v-model="newLine.iva_id" :options="ivas" optionValue="id" optionLabel="name" placeholder="IVA predet." class="w-full" size="small" />
            </div>
            <div class="col-6 md:col-1 flex flex-column justify-content-end">
              <label class="text-sm text-color-secondary block mb-1">Total</label>
              <div class="text-sm font-semibold pt-1">$ {{ formatMoney((newLine.quantity ?? 0) * (newLine.unit_price ?? 0)) }}</div>
            </div>
          </div>
          <div class="flex gap-2 mt-2 justify-content-end">
            <Button label="Cancelar" size="small" severity="secondary" @click="showAddForm = false" />
            <Button label="Agregar" icon="pi pi-plus" size="small" :disabled="!newLine.description || !newLine.quantity || !newLine.unit_price" :loading="addingLine" @click="addLine" />
          </div>
        </div>

        <!-- Validation status -->
        <div class="mt-3 flex align-items-center gap-2">
          <i class="pi" :class="invoiceLinesTotalValid ? 'pi-check-circle text-primary' : 'pi-exclamation-triangle text-color-secondary'"></i>
          <span :class="invoiceLinesTotalValid ? 'text-primary font-semibold' : 'text-color-secondary font-semibold'" class="text-sm">
            Total líneas: <strong>${{ formatMoney(invoiceLinesTotal) }}</strong>
            <template v-if="!invoiceLinesTotalValid">
              — <strong>{{ diffLabel }}</strong>
              (debe ser ${{ formatMoney(targetTotal) }})
            </template>
            <template v-else>
              — Coincide con el total de la orden ✓
            </template>
          </span>
        </div>
      </div>

      <!-- Invoice-style summary -->
      <div class="flex justify-content-end mt-3">
        <div class="w-full border-1 border-round p-4 surface-ground" style="max-width: 28rem">
          <div class="flex justify-content-between py-1">
            <span class="text-color-secondary">Subtotal materiales</span>
            <span>$ {{ formatMoney(pricingData.subtotal_materials ?? 0) }}</span>
          </div>
          <div class="flex justify-content-between py-1">
            <span class="text-color-secondary">Subtotal equipos</span>
            <span>$ {{ formatMoney(pricingData.subtotal_machines ?? 0) }}</span>
          </div>
          <Divider class="my-2" />
          <div v-for="tax in taxBreakdown" :key="tax.name" class="flex justify-content-between py-1">
            <span class="text-color-secondary">{{ tax.name }}</span>
            <span>$ {{ formatMoney(tax.amount) }}</span>
          </div>
          <Divider class="my-2" />
          <div class="flex justify-content-between py-1 font-bold text-lg">
            <span>Total</span>
            <span>$ {{ formatMoney(targetTotal) }}</span>
          </div>
        </div>
      </div>

      <!-- Payment Methods Section -->
      <Divider />
      <div class="mb-3">
        <h4 class="text-sm font-semibold text-color mb-2">
          <i class="pi pi-credit-card mr-1"></i> Métodos de Pago
        </h4>

        <div v-for="(pm, idx) in selectedPayments" :key="pm._key || idx" class="border-1 border-round p-3 mb-2 surface-ground" style="position:relative">
          <Button
            icon="pi pi-times"
            severity="danger"
            text
            rounded
            size="small"
            aria-label="Eliminar método de pago"
            @click="removePayment(idx)"
            style="position:absolute;top:0.5rem;right:0.5rem"
          />
          <div class="grid formgrid p-fluid">
            <div class="field col-12 md:col-6 lg:col-3">
              <label class="text-color-secondary block text-sm mb-1">Método</label>
              <Select
                v-model="pm.payment_method_id"
                :options="paymentMethods"
                optionLabel="name"
                optionValue="id"
                placeholder="Seleccionar..."
                class="w-full"
                @change="onPaymentMethodChange(pm, idx)"
              />
            </div>
            <div class="field col-12 md:col-6 lg:col-3">
              <label class="text-color-secondary block text-sm mb-1">Monto</label>
              <InputNumber v-model="pm.amount" :min="0.01" :minFractionDigits="2" class="w-full" inputClass="text-right" @input="markUnsaved(idx)" @keydown.enter="savePayment(idx)" />
            </div>
            <div class="field col-12 md:col-6 lg:col-3">
              <label class="text-color-secondary block text-sm mb-1">Fecha</label>
              <DatePicker v-model="pm.payment_date" dateFormat="yy-mm-dd" class="w-full" showIcon @date-select="markUnsaved(idx)" />
            </div>
            <div class="field col-12 md:col-6 lg:col-3">
              <label class="text-color-secondary block text-sm mb-1">Notas (opcional)</label>
              <InputText v-model="pm.notes" placeholder="Observaciones del pago" class="w-full" @input="markUnsaved(idx)" @keydown.enter="savePayment(idx)" />
            </div>
          </div>

          <!-- Fila 2: Banco + Comprobante (solo si aplica) -->
          <template v-if="pm.selectedMethod?.requires_bank || pm.selectedMethod?.requires_voucher">
            <div class="grid formgrid p-fluid">
              <div class="field col-12 md:col-6 lg:col-3" v-if="pm.selectedMethod?.requires_bank">
                <label class="text-color-secondary block text-sm mb-1">Banco</label>
                <Select
                  v-model="pm.bank_id"
                  :options="banks"
                  optionLabel="name"
                  optionValue="id"
                  placeholder="Seleccionar banco..."
                  class="w-full"
                  @change="markUnsaved(idx)"
                />
              </div>
              <div class="field col-12 md:col-6 lg:col-3" v-if="pm.selectedMethod?.requires_voucher">
                <label class="text-color-secondary block text-sm mb-1">N° Comprobante</label>
                <InputText v-model="pm.voucher_number" placeholder="Número de cheque/transferencia" class="w-full" @input="markUnsaved(idx)" @keydown.enter="savePayment(idx)" />
              </div>
            </div>
          </template>

          <!-- Botón guardar (debajo del bloque) -->
          <div v-if="!hasInvoice && pm.payment_method_id && pm.amount" class="mt-2">
            <Button
              :icon="pm._saved ? 'pi pi-refresh' : 'pi pi-save'"
              :label="pm._saved ? 'Actualizar' : 'Guardar'"
              :severity="pm._saved ? 'warn' : 'success'"
              size="small"
              @click="savePayment(idx)"
            />
          </div>
        </div>

        <Button
          v-if="!hasInvoice"
          label="Agregar método de pago"
          icon="pi pi-plus"
          size="small"
          severity="secondary"
          @click="addPayment"
          class="mt-1"
        />

        <div v-if="selectedPayments.length > 0" class="mt-2 flex align-items-center gap-3">
          <span class="text-sm text-color-secondary">
            Total asignado: <strong>${{ formatMoney(paymentTotal) }}</strong>
          </span>
          <span
            v-if="paymentDiff !== 0"
            class="text-sm font-semibold"
            :class="paymentDiff > 0 ? 'text-color-secondary' : 'text-color-secondary'"
          >
            <template v-if="paymentDiff > 0">❌ Sobran ${{ formatMoney(paymentDiff) }}</template>
            <template v-else>❌ Faltan ${{ formatMoney(Math.abs(paymentDiff)) }}</template>
          </span>
          <span v-else class="text-sm text-primary font-semibold">✓ Monto correcto</span>
        </div>
      </div>

      <!-- Invoicing section -->
      <Divider />
      <div class="flex flex-wrap align-items-center justify-content-between gap-3">
        <div class="flex align-items-center gap-2 text-sm text-color-secondary">
          <i class="pi pi-file"></i>
          <span v-if="!hasInvoice">Aún no se ha generado factura para esta orden</span>
          <span v-else>
            Factura vinculada:
            <router-link :to="invoiceRoute" class="text-primary font-medium">
              #{{ invoice.number || invoice.id }}
            </router-link>
          </span>
        </div>
        <div class="flex gap-2">
          <Button
            v-if="hasInvoice"
            label="Ver Factura"
            icon="pi pi-external-link"
            severity="success"
            @click="router.push(invoiceRoute)"
          />
          <Button
            v-if="!hasInvoice"
            label="Crear Factura"
            icon="pi pi-file-plus"
            severity="info"
            :disabled="hasInvoice || generatingInvoice || (billingMode === 'line_items' && !invoiceLinesTotalValid) || !paymentsMatch"
            :loading="generatingInvoice"
            @click="generateInvoice"
          />
        </div>
      </div>

      <Message v-if="invoiceError" severity="error" :closable="true" @close="invoiceError = ''" class="mt-2">
        {{ invoiceError }}
      </Message>
      </template>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Accordion from 'primevue/accordion'
import AccordionTab from 'primevue/accordiontab'
import Select from 'primevue/select'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Divider from 'primevue/divider'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Chip from 'primevue/chip'
import DatePicker from 'primevue/datepicker'
import api from '@/api/client'
import { useToast } from 'primevue/usetoast'
import { useRouter } from 'vue-router'

const router = useRouter()

const props = defineProps<{ workOrderId: number }>()
const toast = useToast()

const loading = ref(true)
const pricing = ref<any>({})
const billingBasis = ref('estimated')
const billingMode = ref('manual')

const hasInvoice = ref(false)
const invoice = ref<any>({})
const generatingInvoice = ref(false)
const invoiceError = ref('')

// ─── Payment methods ───
const paymentMethods = ref<any[]>([])
const ivas = ref<any[]>([])
const banks = ref<any[]>([])
const selectedPayments = ref<any[]>([])

const paymentTotal = computed(() =>
  selectedPayments.value.reduce((sum, pm) => sum + (Number(pm.amount) || 0), 0)
)
const paymentDiff = computed(() => paymentTotal.value - Number(targetTotal.value))
const paymentsMatch = computed(() => paymentDiff.value === 0 && selectedPayments.value.length > 0)

function addPayment() {
  const today = new Date().toISOString().split('T')[0]
  selectedPayments.value.push({
    _key: Date.now() + Math.random(),
    payment_method_id: null,
    amount: null,
    payment_date: today,
    bank_id: null,
    voucher_number: null,
    reference: null,
    notes: null,
    selectedMethod: null,
    _saved: false,
    _persistedId: null,
  })
}
function removePayment(idx: number) {
  const pm = selectedPayments.value[idx]
  if (pm._persistedId && !hasInvoice.value) {
    // Delete from backend
    api.delete(`/payments/${pm._persistedId}`).catch(() => {})
  }
  selectedPayments.value.splice(idx, 1)
}
function onPaymentMethodChange(pm: any, idx: number) {
  const oldSelectedMethod = pm.selectedMethod
  pm.selectedMethod = paymentMethods.value.find((m: any) => m.id === pm.payment_method_id) || null
  // If method changed, clear dependent fields and mark unsaved
  if (!pm.selectedMethod?.requires_bank) pm.bank_id = null
  if (!pm.selectedMethod?.requires_voucher) pm.voucher_number = null
  markUnsaved(idx)
  if (pm._persistedId && pm._saved && oldSelectedMethod?.id !== pm.selectedMethod?.id) {
    pm._saved = false
  }
}

function markUnsaved(idx: number) {
  const pm = selectedPayments.value[idx]
  if (pm && pm._persistedId && pm._saved) {
    pm._saved = false
  }
}

async function loadPayments() {
  if (!props.workOrderId) return
  try {
    const res = await api.get(`/work-orders/${props.workOrderId}/payments`)
    const data = res.data.data
    selectedPayments.value = (data.payments || []).map((p: any) => ({
      _key: 'persisted-' + p.id,
      payment_method_id: p.payment_method_id,
      amount: p.amount,
      payment_date: p.payment_date || new Date().toISOString().split('T')[0],
      bank_id: p.bank_id,
      voucher_number: p.voucher_number,
      reference: p.reference,
      notes: p.notes,
      selectedMethod: paymentMethods.value.find((m: any) => m.id === p.payment_method_id) || null,
      _saved: true,
      _persistedId: p.id,
    }))
  } catch {
    // No payments yet — fine
  }
}

async function savePayment(idx: number) {
  const pm = selectedPayments.value[idx]
  if (!pm.payment_method_id || !pm.amount || !pm.payment_date) return

  const payload = {
    payment_method_id: pm.payment_method_id,
    amount: pm.amount,
    payment_date: pm.payment_date,
    bank_id: pm.bank_id || null,
    voucher_number: pm.voucher_number || null,
    reference: pm.reference || null,
    notes: pm.notes || null,
  }

  try {
    let saved
    if (pm._persistedId) {
      const res = await api.put(`/payments/${pm._persistedId}`, payload)
      saved = res.data.data
    } else {
      const res = await api.post(`/work-orders/${props.workOrderId}/payments`, payload)
      saved = res.data.data
    }
    pm._persistedId = saved.id
    pm._saved = true
    pm._key = 'persisted-' + saved.id
    toast.add({ severity: 'success', summary: pm._persistedId ? 'Pago actualizado' : 'Pago guardado', life: 3000 })
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'Error al guardar pago', life: 5000 })
  }
}

async function loadPaymentMethods() {
  try { const res = await api.get('/payment-methods'); paymentMethods.value = res.data } catch {}
}
async function loadIvas() {
  try { const res = await api.get('/ivas'); ivas.value = res.data.data || res.data.ivas || [] } catch { ivas.value = [] }
}
async function loadBanks() {
  try { const res = await api.get('/banks'); banks.value = res.data } catch {}
}

// Invoice lines (manual mode)
const invoiceLines = ref<any[]>([])
const showAddForm = ref(false)
const newLine = ref({ description: '', quantity: 1, unit_price: 0, iva_id: null })
const addingLine = ref(false)
const editingLine = ref<number | null>(null)
const editForm = ref({ description: '', quantity: 1, unit_price: 0, iva_id: null })
const savingLine = ref(false)
const deletingLine = ref<number | null>(null)

const pricingData = computed(() => pricing.value ?? {})

const billingBasisOptions = computed(() => [
  {
    label: `Total Est.: $${formatMoney(pricingData.value.totals?.estimated ?? pricingData.value.total ?? 0)}`,
    value: 'estimated',
  },
  {
    label: `Total Real: $${formatMoney(pricingData.value.totals?.actual ?? pricingData.value.total ?? 0)}`,
    value: 'actual',
  },
])

const billingModeOptions = [
  { label: 'Basado en listados', value: 'product_list' },
  { label: 'Basado en ítems', value: 'item_list' },
  { label: 'Líneas manuales', value: 'line_items' },
]

function itemIcon(type: string): string {
  if (type === 'service') return 'pi pi-wrench text-color-secondary text-lg'
  if (type === 'machine') return 'pi pi-cog text-color-secondary text-lg'
  return 'pi pi-box text-color-secondary text-lg'
}

function itemTypeLabel(type: string): string {
  if (type === 'service') return 'Servicio'
  if (type === 'machine') return 'Máquina'
  return 'Material'
}

// Determine billing mode from pricing data
const activeBillingMode = computed(() => billingMode.value || pricingData.value.billing_mode || 'product_list')

// Combined items: what to display as invoice line items
const combinedItems = computed(() => {
  // Item list mode: show one line per WorkOrderItem
  if (pricing.value?.billing_mode === 'item_list') {
    const items = pricingData.value.items ?? []
    return items.map((m: any, i: number) => {
      const ivaLabel = ivas.value.find((iv: any) => iv.id === (m.iva_id ?? null) )?.name ?? '0%'
      return {
        id: `item-${m.item_id || i}`,
        type: 'product',
        description: m.description,
        unit: m.unit || 'u',
        quantity: m.quantity,
        unit_price: m.unit_price,
        line_total: m.line_total,
        iva_label: ivaLabel,
      }
    })
  }

  // Product list mode: show one line per material/machine
  const items: any[] = []
  for (const m of (pricingData.value.materials ?? [])) {
    const type = m.type ?? 'product'
    const ivaLabel = ivas.value.find((iv: any) => iv.id === (m.iva_id ?? m.iva_code ? ivas.value.find((x: any) => x.code === m.iva_code)?.id : null))?.name ?? ((m.iva_percentage ?? 0) > 0 ? m.iva_percentage + '%' : '0%')
    items.push({
      id: `mat-${m.id}`,
      type,
      description: m.product_name ?? `Producto #${m.product_id}`,
      unit: m.unit ?? 'u',
      quantity: m.quantity,
      unit_price: m.unit_price,
      line_total: m.line_total,
      iva_label: ivaLabel,
    })
  }
  for (const m of (pricingData.value.machines ?? [])) {
    const mchIvaLabel = ivas.value.find((iv: any) => iv.id === (m.iva_id ?? null))?.name ?? '0%'
    items.push({
      id: `mch-${m.id}`,
      type: 'machine',
      description: m.machine_name ?? `Máquina #${m.machine_id}`,
      unit: 'h',
      quantity: m.quantity,
      unit_price: m.unit_price,
      line_total: m.line_total,
      iva_label: mchIvaLabel,
    })
  }
  return items
})

const taxBreakdown = computed(() => {
  const taxes: any[] = []
  if (pricingData.value.tax_breakdown) {
    for (const t of pricingData.value.tax_breakdown) {
      taxes.push({ name: `${t.code} (${t.percentage}%)`, amount: t.tax })
    }
  }
  return taxes
})

const targetTotal = computed(() => pricingData.value.total ?? pricingData.value.total_amount ?? 0)
const invoiceLinesTotal = computed(() => invoiceLines.value.reduce((s: number, l: any) => s + Number(l.line_total || 0), 0))
const invoiceLinesDiff = computed(() => Number(targetTotal.value) - invoiceLinesTotal.value)
const invoiceLinesTotalValid = computed(() => Math.abs(invoiceLinesDiff.value) < 0.01)
const diffLabel = computed(() => {
  const diff = invoiceLinesDiff.value
  if (diff > 0) return `Faltan $${formatMoney(diff)}`
  return `Excedente $${formatMoney(Math.abs(diff))}`
})

const invoiceRoute = computed(() => {
  if (!invoice.value?.id) return null
  return `/invoices/${invoice.value.id}`
})

function formatMoney(v: number | string): string {
  const n = typeof v === 'string' ? parseFloat(v) : (v ?? 0)
  return n.toFixed(2)
}

function formatQty(v: number | string): string {
  const n = typeof v === 'string' ? parseFloat(v) : (v ?? 0)
  return n % 1 === 0 ? n.toString() : n.toFixed(2)
}

function nextLineKey(): number {
  const max = invoiceLines.value.reduce((m: number, l: any) => Math.max(m, l._key || 0), 0)
  return max + 1
}

async function loadPricing() {
  loading.value = true
  try {
    const [pricingRes, invRes] = await Promise.all([
      api.get(`/work-orders/${props.workOrderId}/pricing`),
      api.get(`/work-orders/${props.workOrderId}/invoices`),
    ])
    const raw = pricingRes.data.data ?? pricingRes.data
    pricing.value = raw ?? {}
    billingBasis.value = pricing.value.billing_basis ?? 'estimated'
    billingMode.value = pricing.value.billing_mode ?? 'manual'

    const invoices = invRes.data.data ?? invRes.data ?? []
    if (invoices.length > 0) {
      hasInvoice.value = true
      invoice.value = invoices[0]
    }

    // Load invoice lines if manual mode
    if (billingMode.value === 'manual') {
      await loadInvoiceLines()
    }

    // Load existing payments (pre-invoice or invoice-linked)
    await loadPayments()
  } catch (e: any) {
    console.error('Failed to load pricing:', e)
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar información de precios', life: 5000 })
  } finally {
    loading.value = false
  }
}

async function loadInvoiceLines() {
  try {
    const res = await api.get(`/work-orders/${props.workOrderId}/invoice-lines`)
    const lines = res.data.data ?? res.data ?? []
    invoiceLines.value = lines.map((l: any, i: number) => {
      const ivaObj = ivas.value.find((iv: any) => iv.id === l.iva_id)
      return { ...l, iva_label: ivaObj?.name ?? '0%', _key: l.id ?? i }
    })
  } catch (e: any) {
    console.error('Failed to load invoice lines:', e)
  }
}

async function updatePricing() {
  try {
    const res = await api.patch(`/work-orders/${props.workOrderId}/pricing`, {
      billing_basis: billingBasis.value,
    })
    const raw = res.data.data ?? res.data
    pricing.value = raw ?? {}
  } catch (e: any) {
    console.error('Failed to update pricing:', e)
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar la base de facturación', life: 5000 })
  }
}

async function onBillingModeChange() {
  try {
    await api.patch(`/work-orders/${props.workOrderId}/pricing`, {
      billing_mode: billingMode.value,
    })
    if (billingMode.value === 'manual') {
      await loadInvoiceLines()
    }
  } catch (e: any) {
    console.error('Failed to update billing mode:', e)
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el modo de facturación', life: 5000 })
  }
}

async function addLine() {
  if (!newLine.value.description || !newLine.value.quantity || !newLine.value.unit_price) return
  addingLine.value = true
  try {
    const res = await api.post(`/work-orders/${props.workOrderId}/invoice-lines`, {
      description: newLine.value.description,
      quantity: newLine.value.quantity,
      unit_price: newLine.value.unit_price,
      iva_id: newLine.value.iva_id ?? ivas.value.find((iv: any) => iv.is_default)?.id ?? null,
    })
    const line = res.data.data ?? res.data
    const ivaObj = ivas.value.find((iv: any) => iv.id === line.iva_id)
    invoiceLines.value.push({ ...line, iva_label: ivaObj?.name ?? '0%', _key: line.id ?? nextLineKey() })
    newLine.value = { description: '', quantity: 1, unit_price: 0, iva_id: null }
    showAddForm.value = false
    toast.add({ severity: 'success', summary: 'Línea agregada', life: 3000 })
  } catch (e: any) {
    console.error('Failed to add line:', e)
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo agregar la línea', life: 5000 })
  } finally {
    addingLine.value = false
  }
}

function startEdit(line: any) {
  editingLine.value = line._key
  editForm.value = { description: line.description, quantity: Number(line.quantity), unit_price: Number(line.unit_price), iva_id: line.iva_id ?? null }
}

function cancelEdit() {
  editingLine.value = null
  editForm.value = { description: '', quantity: 1, unit_price: 0 }
}

async function saveLine(line: any) {
  if (!editForm.value.description) return
  savingLine.value = true
  try {
    const res = await api.put(`/invoice-lines/${line.id}`, {
      description: editForm.value.description,
      quantity: editForm.value.quantity,
      unit_price: editForm.value.unit_price,
      iva_id: editForm.value.iva_id ?? line.iva_id ?? null,
    })
    const updated = res.data.data ?? res.data
    const idx = invoiceLines.value.findIndex((l: any) => l._key === line._key)
    if (idx >= 0) {
      const ivaObj = ivas.value.find((iv: any) => iv.id === (updated.iva_id || line.iva_id))
      invoiceLines.value[idx] = { ...updated, iva_label: ivaObj?.name ?? '0%', _key: line._key }
    }
    editingLine.value = null
    toast.add({ severity: 'success', summary: 'Línea actualizada', life: 3000 })
  } catch (e: any) {
    console.error('Failed to update line:', e)
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar la línea', life: 5000 })
  } finally {
    savingLine.value = false
  }
}

async function deleteLine(line: any) {
  deletingLine.value = line._key
  try {
    await api.delete(`/invoice-lines/${line.id}`)
    invoiceLines.value = invoiceLines.value.filter((l: any) => l._key !== line._key)
    toast.add({ severity: 'success', summary: 'Línea eliminada', life: 3000 })
  } catch (e: any) {
    console.error('Failed to delete line:', e)
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la línea', life: 5000 })
  } finally {
    deletingLine.value = null
  }
}

async function generateInvoice() {
  generatingInvoice.value = true
  invoiceError.value = ''
  try {
    // Auto-fill total if only one payment method without amount
    if (selectedPayments.value.length === 1 && (!selectedPayments.value[0].amount || Number(selectedPayments.value[0].amount) === 0)) {
      selectedPayments.value[0].amount = targetTotal.value
    }

    const payload: any = {
      work_order_id: props.workOrderId,
      billing_basis: billingBasis.value,
      billing_mode: billingMode.value,
      payments: selectedPayments.value.map((pm: any) => ({
        payment_method_id: pm.payment_method_id,
        amount: pm.amount,
        payment_date: pm.payment_date || issueDate.value,
        bank_id: pm.bank_id || null,
        voucher_number: pm.voucher_number || null,
        reference: pm.reference || null,
        notes: pm.notes || null,
      })),
    }
    if (billingMode.value === 'manual') {
      payload.lines = invoiceLines.value.map((l: any) => ({
        description: l.description,
        quantity: l.quantity,
        unit_price: l.unit_price,
        line_total: l.line_total,
        iva_id: l.iva_id,
      }))
    } else if (billingMode.value === 'line_items') {
      // Use combined items from the order's BOM and machines
      payload.lines = combinedItems.value.map((l: any) => ({
        description: l.description,
        quantity: l.quantity,
        unit_price: l.unit_price,
        iva_id: l.iva_id || null,
      }))
    }

    const res = await api.post('/invoices', payload)
    hasInvoice.value = true
    invoice.value = res.data.data ?? res.data
    toast.add({ severity: 'success', summary: 'Factura creada', detail: 'Factura generada exitosamente', life: 3000 })

    // Redirigir al detalle de la factura
    const invId = invoice.value?.id
    if (invId) {
      await router.push(`/invoices/${invId}`)
    }
  } catch (e: any) {
    console.error('Failed to generate invoice:', e)
    invoiceError.value = e?.response?.data?.message || e?.message || 'Error al generar factura'
  } finally {
    generatingInvoice.value = false
  }
}

onMounted(() => {
  loadPricing()
  loadPaymentMethods()
  loadBanks()
  loadIvas()
})
</script>

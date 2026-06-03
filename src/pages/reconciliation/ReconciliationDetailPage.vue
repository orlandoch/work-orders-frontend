<template>
  <div>
    <div class="flex gap-2 mb-3">
      <Button label="← Volver" severity="secondary" icon="pi pi-arrow-left" @click="$router.push('/banking/reconciliations')" />
    </div>

    <div v-if="loading" class="text-center p-4"><i class="pi pi-spin pi-spinner" style="font-size:2rem" /></div>

    <template v-else-if="period">
      <div class="grid">
        <div class="col-12 md:col-3"><Card><template #title>Apertura</template><template #content class="text-xl font-bold">${{ fmt(period.opening_balance) }}</template></Card></div>
        <div class="col-12 md:col-3"><Card><template #title>Cierre</template><template #content class="text-xl font-bold">${{ fmt(period.closing_balance) }}</template></Card></div>
        <div class="col-12 md:col-3"><Card><template #title>Estado Cta.</template><template #content class="text-xl font-bold">${{ fmt(period.statement_balance) }}</template></Card></div>
        <div class="col-12 md:col-3"><Card><template #title>Diferencia</template><template #content><span :class="diffClass" class="text-xl font-bold">${{ fmt(period.difference) }}</span></template></Card></div>
      </div>

      <div class="flex gap-2 my-3 flex-wrap">
        <StatusChip :value="period.status" />
        <Button label="Recalcular" icon="pi pi-refresh" size="small" severity="info" @click="recalculate" />
        <Button v-if="period.status !== 'reconciled' && period.status !== 'closed'" label="Marcar Conciliado" icon="pi pi-check-circle" size="small" severity="success" :disabled="Number(period.difference) > 0.01" @click="markReconciled" />
        <Button v-if="period.status === 'reconciled'" label="Cerrar Período" icon="pi pi-lock" size="small" severity="contrast" @click="closePeriod" />
      </div>

      <Accordion :multiple="true" :activeIndex="[0,1,2,3]">
        <AccordionTab header="Movimientos Bancarios no Conciliados">
          <DataTable :value="unmatchedMovements" stripedRows emptyMessage="Todos conciliados">
            <Column field="id" header="#" />
            <Column field="movement_date" header="Fecha"><template #body="{ d }">{{ d.movement_date?.substring(0,10) }}</template></Column>
            <Column field="type" header="Tipo"><template #body="{ d }"><StatusChip :value="d.type" /></template></Column>
            <Column field="direction" header="Dir."><template #body="{ d }"><StatusChip :value="d.direction" /></template></Column>
            <Column field="amount" header="Monto"><template #body="{ d }">${{ fmt(d.amount) }}</template></Column>
            <Column field="description" header="Descripción" />
            <Column header="Seleccionar" style="width:80px">
              <template #body="{ data }">
                <Button icon="pi pi-arrow-right" text rounded size="small" @click="selectMovement(data)" />
              </template>
            </Column>
          </DataTable>
        </AccordionTab>

        <AccordionTab header="Líneas de Estado no Conciliadas">
          <DataTable :value="unmatchedStatementLines" stripedRows emptyMessage="Todas conciliadas">
            <Column field="id" header="#" />
            <Column field="statement_date" header="Fecha"><template #body="{ d }">{{ d.statement_date?.substring(0,10) }}</template></Column>
            <Column field="description" header="Descripción" />
            <Column field="amount" header="Monto"><template #body="{ d }">${{ fmt(d.amount) }}</template></Column>
            <Column field="direction" header="Dir."><template #body="{ d }"><StatusChip :value="d.direction" /></template></Column>
            <Column field="reference" header="Ref." />
            <Column header="Seleccionar" style="width:80px">
              <template #body="{ data }">
                <Button icon="pi pi-arrow-left" text rounded size="small" @click="selectStatementLine(data)" />
              </template>
            </Column>
          </DataTable>
        </AccordionTab>

        <AccordionTab header="Matches Realizados">
          <DataTable :value="matchedLines" stripedRows emptyMessage="Sin matches">
            <Column field="id" header="#" />
            <Column header="Movimiento">
              <template #body="{ d }">M#{{ d.bank_movement_id }} ${{ fmt(d.amount) }} {{ d.direction }}</template>
            </Column>
            <Column header="Estado Cta.">
              <template #body="{ d }">S#{{ d.bank_statement_line_id }} ${{ fmt(d.amount) }} {{ d.direction }}</template>
            </Column>
            <Column field="difference" header="Diff"><template #body="{ d }">${{ fmt(d.difference) }}</template></Column>
            <Column header="Acción" style="width:80px">
              <template #body="{ data }">
                <Button v-if="period.status !== 'closed'" icon="pi pi-times" text rounded size="small" severity="danger" @click="unmatch(data)" />
              </template>
            </Column>
          </DataTable>
        </AccordionTab>

        <AccordionTab header="Sugerencias de Matching">
          <div class="mb-2">
            <Button label="Cargar Sugerencias" icon="pi pi-lightbulb" size="small" severity="warn" @click="loadSuggestions" :disabled="suggestionsLoading" />
          </div>
          <DataTable :value="suggestions" :loading="suggestionsLoading" stripedRows emptyMessage="Sin sugerencias disponibles">
            <Column header="Score">
              <template #body="{ data }">
                <Tag :value="data.score + '%'" :severity="data.score >= 90 ? 'success' : data.score >= 80 ? 'warn' : 'info'" />
              </template>
            </Column>
            <Column header="Movimiento">
              <template #body="{ d }">M#{{ d.bank_movement_id }} ${{ fmt(d.bank_movement?.amount) }} {{ d.bank_movement?.description?.substring(0,30) }}</template>
            </Column>
            <Column header="Estado Cta.">
              <template #body="{ d }">S#{{ d.bank_statement_line_id }} ${{ fmt(d.statement_line?.amount) }} {{ d.statement_line?.description?.substring(0,30) }}</template>
            </Column>
            <Column header="Razón">
              <template #body="{ data }"><small>{{ data.reason }}</small></template>
            </Column>
            <Column header="Acción" style="width:100px">
              <template #body="{ data }">
                <Button label="Aceptar" icon="pi pi-check" size="small" severity="success" @click="acceptSuggestion(data)" />
              </template>
            </Column>
          </DataTable>
        </AccordionTab>
      </Accordion>

      <!-- Match Dialog -->
      <Dialog v-model:visible="matchDialog" header="Match Manual" :modal="true" style="width:450px">
        <div class="grid p-fluid">
          <div class="col-12">
            <p v-if="selectedMovement"><strong>Movimiento:</strong> M#{{ selectedMovement.id }} ${{ fmt(selectedMovement.amount) }} {{ selectedMovement.direction }} - {{ selectedMovement.description }}</p>
            <p v-if="selectedStatementLine"><strong>Estado:</strong> S#{{ selectedStatementLine.id }} ${{ fmt(selectedStatementLine.amount) }} {{ selectedStatementLine.direction }} - {{ selectedStatementLine.description }}</p>
          </div>
          <div class="col-12">
            <label>Notas</label>
            <Textarea v-model="matchNotes" rows="2" />
          </div>
        </div>
        <template #footer>
          <Button label="Cancelar" severity="secondary" @click="matchDialog = false" />
          <Button label="Realizar Match" icon="pi pi-link" :loading="matching" @click="doMatch" />
        </template>
      </Dialog>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  getReconciliation, matchReconciliation, unmatchReconciliation,
  recalculateReconciliation, markReconciledReconciliation, closeReconciliation,
  getReconciliationSuggestions, acceptReconciliationSuggestion,
} from '@/api/reconciliationService'
import StatusChip from '@/components/StatusChip.vue'
import { useToast } from 'primevue/usetoast'
import Card from 'primevue/card'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import Textarea from 'primevue/textarea'
import Accordion from 'primevue/accordion'
import AccordionTab from 'primevue/accordiontab'

const route = useRoute()
const toast = useToast()

const loading = ref(false)
const period = ref<any>(null)
const unmatchedMovements = ref<any[]>([])
const unmatchedStatementLines = ref<any[]>([])
const matchedLines = ref<any[]>([])
const suggestions = ref<any[]>([])
const suggestionsLoading = ref(false)

const matchDialog = ref(false)
const matching = ref(false)
const selectedMovement = ref<any>(null)
const selectedStatementLine = ref<any>(null)
const matchNotes = ref('')

async function load() {
  loading.value = true
  try {
    const res = await getReconciliation(Number(route.params.id))
    const data = res.data?.data || res.data
    period.value = data
    unmatchedMovements.value = data.unmatched_movements || []
    unmatchedStatementLines.value = data.unreconciled_statement_lines || []
    matchedLines.value = data.matched_lines || []
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar', life: 4000 })
  } finally {
    loading.value = false
  }
}

function selectMovement(m: any) {
  selectedMovement.value = m
  if (selectedStatementLine.value) matchDialog.value = true
}

function selectStatementLine(s: any) {
  selectedStatementLine.value = s
  if (selectedMovement.value) matchDialog.value = true
}

async function doMatch() {
  if (!selectedMovement.value || !selectedStatementLine.value) return
  matching.value = true
  try {
    await matchReconciliation(Number(route.params.id), {
      bank_movement_id: selectedMovement.value.id,
      bank_statement_line_id: selectedStatementLine.value.id,
      notes: matchNotes.value || undefined,
    })
    toast.add({ severity: 'success', summary: 'Match realizado', life: 3000 })
    matchDialog.value = false
    selectedMovement.value = null
    selectedStatementLine.value = null
    load()
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || e.response?.data?.errors?.match?.[0] || 'Error', life: 4000 })
  } finally {
    matching.value = false
  }
}

async function unmatch(line: any) {
  try {
    await unmatchReconciliation(Number(route.params.id), line.id)
    toast.add({ severity: 'success', summary: 'Match eliminado', life: 3000 })
    load()
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'Error', life: 4000 })
  }
}

async function recalculate() {
  try {
    await recalculateReconciliation(Number(route.params.id))
    toast.add({ severity: 'success', summary: 'Recalculado', life: 3000 })
    load()
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'Error', life: 4000 })
  }
}

async function markReconciled() {
  try {
    await markReconciledReconciliation(Number(route.params.id))
    toast.add({ severity: 'success', summary: 'Marcado como conciliado', life: 3000 })
    load()
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'Error', life: 4000 })
  }
}

async function closePeriod() {
  try {
    await closeReconciliation(Number(route.params.id))
    toast.add({ severity: 'success', summary: 'Período cerrado', life: 3000 })
    load()
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'Error', life: 4000 })
  }
}

async function loadSuggestions() {
  suggestionsLoading.value = true
  try {
    const res = await getReconciliationSuggestions(Number(route.params.id))
    suggestions.value = res.data?.data || []
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error cargando sugerencias', life: 4000 })
  } finally {
    suggestionsLoading.value = false
  }
}

async function acceptSuggestion(sug: any) {
  try {
    await acceptReconciliationSuggestion(Number(route.params.id), {
      bank_movement_id: sug.bank_movement_id,
      bank_statement_line_id: sug.bank_statement_line_id,
    })
    toast.add({ severity: 'success', summary: 'Sugerencia aceptada', life: 3000 })
    load()
    suggestions.value = [] // clear suggestions
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'Error', life: 4000 })
  }
}

const diffClass = computed(() => {
  const d = Number(period.value?.difference ?? 0)
  return d === 0 ? 'text-green-600' : 'text-red-600'
})

function fmt(val: number | string) {
  const n = Number(val)
  return isNaN(n) ? '0.00' : n.toFixed(2)
}

onMounted(load)
</script>

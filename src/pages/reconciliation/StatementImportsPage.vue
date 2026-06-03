<template>
  <div>
    <Card>
      <template #title>Importar Estado de Cuenta (CSV)</template>
      <template #content>
        <!-- Step 1: Upload & Map -->
        <div class="grid p-fluid">
          <div class="col-12 md:col-6">
            <label>Cuenta Bancaria *</label>
            <BankAccountSelect v-model="form.bank_account_id" />
          </div>
          <div class="col-12">
            <label>Archivo CSV *</label>
            <FileUpload
              mode="basic"
              accept=".csv,.txt"
              :auto="false"
              chooseLabel="Seleccionar archivo"
              @select="onFileSelect"
            />
            <small v-if="form.file" class="text-green-600">{{ form.file.name }}</small>
          </div>
        </div>

        <Divider />
        <h3>Mapping de Columnas</h3>

        <div class="grid p-fluid">
          <div class="col-12 md:col-3">
            <label>Columna Fecha *</label>
            <InputText v-model="mapping.date_column" placeholder="fecha" />
          </div>
          <div class="col-12 md:col-3">
            <label>Columna Descripción *</label>
            <InputText v-model="mapping.description_column" placeholder="descripcion" />
          </div>
          <div class="col-6 md:col-2">
            <label>Formato A: Monto</label>
            <InputText v-model="mapping.amount_column" placeholder="monto" />
          </div>
          <div class="col-6 md:col-2">
            <label>Formato A: Dirección</label>
            <InputText v-model="mapping.direction_column" placeholder="direccion" />
          </div>
          <div class="col-6 md:col-2">
            <label>Formato B: Débito</label>
            <InputText v-model="mapping.debit_column" placeholder="debito" />
          </div>
          <div class="col-6 md:col-2">
            <label>Formato B: Crédito</label>
            <InputText v-model="mapping.credit_column" placeholder="credito" />
          </div>
          <div class="col-12 md:col-2">
            <label>Columna Ref.</label>
            <InputText v-model="mapping.reference_column" placeholder="referencia" />
          </div>
          <div class="col-6 md:col-2">
            <label>Formato Fecha</label>
            <InputText v-model="mapping.date_format" placeholder="Y-m-d" />
          </div>
          <div class="col-6 md:col-2">
            <label>Delimitador</label>
            <InputText v-model="mapping.delimiter" placeholder="," />
          </div>
        </div>

        <Button label="Previsualizar" icon="pi pi-eye" :loading="previewing" @click="preview" :disabled="!form.file || !form.bank_account_id" class="mt-2" />

        <!-- Step 2: Preview results -->
        <template v-if="previewResult">
          <Divider />
          <Message :severity="previewResult.summary.valid_rows > 0 ? 'info' : 'warn'">
            <strong>Resumen:</strong>
            {{ previewResult.summary.total_rows }} filas,
            {{ previewResult.summary.valid_rows }} válidas,
            {{ previewResult.summary.duplicate_rows }} duplicadas,
            {{ previewResult.summary.invalid_rows }} inválidas
            | Income: ${{ fmt(previewResult.summary.total_income) }}
            | Expense: ${{ fmt(previewResult.summary.total_expense) }}
          </Message>

          <DataTable :value="previewResult.rows" stripedRows :rows="10" paginator
            emptyMessage="Sin filas" class="mt-2">
            <Column field="row_number" header="#"
              style="width:50px" />
            <Column header="Estado" style="width:80px">
              <template #body="{ data }"><StatusChip :value="data.status" /></template>
            </Column>
            <Column field="parsed_date" header="Fecha" />
            <Column field="parsed_description" header="Descripción" />
            <Column field="parsed_amount" header="Monto">
              <template #body="{ data }">${{ fmt(data.parsed_amount) }}</template>
            </Column>
            <Column field="parsed_direction" header="Dir.">
              <template #body="{ data }"><StatusChip :value="data.parsed_direction" /></template>
            </Column>
            <Column field="parsed_reference" header="Ref." />
          </DataTable>

          <div class="flex gap-2 mt-3">
            <Button label="Importar (omitir duplicados)" icon="pi pi-upload" :loading="confirming"
              @click="confirmImport(true)" :disabled="previewResult.summary.valid_rows === 0" />
            <Button label="Importar (incluir duplicados)" icon="pi pi-upload" severity="warn" :loading="confirming"
              @click="confirmImport(false)" :disabled="previewResult.summary.valid_rows === 0" />
          </div>
        </template>

        <Message v-if="importResult" severity="success" class="mt-3">
          Importación completada. {{ importResult.imported_count }} líneas importadas, {{ importResult.skipped_count }} omitidas.
        </Message>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { previewStatementImport, confirmStatementImport } from '@/api/reconciliationService'
import BankAccountSelect from '@/components/BankAccountSelect.vue'
import StatusChip from '@/components/StatusChip.vue'
import { useToast } from 'primevue/usetoast'
import Card from 'primevue/card'
import FileUpload from 'primevue/fileupload'
import Divider from 'primevue/divider'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Message from 'primevue/message'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

const toast = useToast()
const previewing = ref(false)
const confirming = ref(false)
const previewResult = ref<any>(null)
const importResult = ref<any>(null)

const form = reactive({
  bank_account_id: null as number | null,
  file: null as File | null,
})

const mapping = reactive({
  date_column: 'fecha',
  description_column: 'descripcion',
  amount_column: 'monto',
  direction_column: 'direccion',
  debit_column: '',
  credit_column: '',
  reference_column: 'referencia',
  date_format: 'Y-m-d',
  delimiter: ',',
})

function onFileSelect(event: any) {
  form.file = event.files?.[0] || event.target?.files?.[0] || null
  previewResult.value = null
  importResult.value = null
}

async function preview() {
  if (!form.file || !form.bank_account_id) return
  previewing.value = true
  previewResult.value = null
  importResult.value = null

  try {
    const fd = new FormData()
    fd.append('bank_account_id', String(form.bank_account_id))
    fd.append('file', form.file)

    const map = Object.fromEntries(
      Object.entries(mapping).filter(([_, v]) => v)
    )
    fd.append('mapping', JSON.stringify(map))

    const res = await previewStatementImport(fd)
    previewResult.value = res.data?.data || res.data
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'Error al previsualizar', life: 4000 })
  } finally {
    previewing.value = false
  }
}

async function confirmImport(skipDuplicates: boolean) {
  confirming.value = true
  try {
    const res = await confirmStatementImport(previewResult.value.id || 1, {
      skip_duplicates: skipDuplicates,
    })
    importResult.value = res.data?.data || res.data
    toast.add({ severity: 'success', summary: 'Importación completada', life: 3000 })
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'Error', life: 4000 })
  } finally {
    confirming.value = false
  }
}

function fmt(val: number | string) {
  const n = Number(val)
  return isNaN(n) ? '0.00' : n.toFixed(2)
}
</script>

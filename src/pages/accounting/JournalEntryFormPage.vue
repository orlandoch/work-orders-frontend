<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getJournalEntry, createJournalEntry, updateJournalEntry, type JournalEntryLine } from '@/api/journalEntries'
import { getAllAccounts, type ChartOfAccount } from '@/api/chartOfAccounts'
import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import Message from 'primevue/message'
import Tag from 'primevue/tag'

const router = useRouter()
const route = useRoute()
const isEdit = !!route.params.id
const editMode = computed(() => isEdit && data.value?.status !== 'posted')

const data = ref<{
  id?: number; code?: string; description: string; date: string; type: string;
  status?: string; lines: JournalEntryLine[];
}>({
  description: '', date: new Date().toISOString().split('T')[0],
  type: 'adjustments', lines: [{ chart_of_account_id: 0, debit: 0, credit: 0, description: null }],
})

const accounts = ref<ChartOfAccount[]>([])
const saving = ref(false)
const error = ref('')

const typeOptions = [
  { label: 'Ajustes', value: 'adjustments' },
  { label: 'Ventas', value: 'sales' },
  { label: 'Compras', value: 'purchases' },
  { label: 'Costos', value: 'costs' },
  { label: 'Gastos', value: 'expenses' },
  { label: 'Apertura', value: 'opening' },
  { label: 'Cierre', value: 'closing' },
]

const totalDebit = computed(() => data.value.lines.reduce((s, l) => s + (Number(l.debit) || 0), 0))
const totalCredit = computed(() => data.value.lines.reduce((s, l) => s + (Number(l.credit) || 0), 0))
const difference = computed(() => Math.abs(totalDebit.value - totalCredit.value))
const isBalanced = computed(() => difference.value < 0.01)

function accountLabel(acc: ChartOfAccount): string {
  return `${acc.code} - ${acc.name}`
}

function addLine() {
  data.value.lines.push({ chart_of_account_id: 0, debit: 0, credit: 0, description: null })
}

function removeLine(index: number) {
  if (data.value.lines.length > 1) {
    data.value.lines.splice(index, 1)
  }
}

async function save() {
  if (!isBalanced.value) {
    error.value = `El asiento no está balanceado. Diferencia: $${difference.value.toFixed(2)}`
    return
  }

  saving.value = true
  error.value = ''

  const payload = {
    description: data.value.description,
    date: data.value.date,
    type: data.value.type,
    lines: data.value.lines.map(l => ({
      chart_of_account_id: l.chart_of_account_id,
      debit: Number(l.debit) || 0,
      credit: Number(l.credit) || 0,
      description: l.description || null,
    })),
  }

  try {
    if (isEdit) {
      await updateJournalEntry(parseInt(route.params.id as string), payload)
    } else {
      await createJournalEntry(payload)
    }
    router.push('/accounting/journal-entries')
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Error al guardar asiento'
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    const res = await getAllAccounts()
    accounts.value = res.data.filter((a: ChartOfAccount) => a.level === 3 && a.is_active)
  } catch { error.value = 'Error al cargar cuentas contables' }

  if (isEdit) {
    const id = parseInt(route.params.id as string)
    try {
      const res = await getJournalEntry(id)
      const e = res.data
      data.value = {
        id: e.id, code: e.code,
        description: e.description, date: e.date, type: e.type,
        status: e.status,
        lines: e.lines.map(l => ({
          chart_of_account_id: l.chart_of_account_id,
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0,
          description: l.description || null,
        })),
      }
    } catch { error.value = 'Error al cargar asiento' }
  }
})
</script>

<template>
  <div class="max-w-5xl mx-auto space-y-6">
    <div class="flex items-center gap-4">
      <Button icon="pi pi-arrow-left" severity="secondary" text rounded @click="router.back()" />
      <h1 class="text-2xl font-bold text-gray-800">
        <template v-if="isEdit">Asiento {{ data.code }}</template>
        <template v-else>Nuevo Asiento Contable</template>
      </h1>
      <Tag v-if="data.status === 'posted'" value="Contabilizado" severity="success" />
      <Tag v-else-if="data.status === 'draft'" value="Borrador" severity="warn" />
    </div>

    <Message v-if="error" severity="error" :closable="true" @close="error = ''">{{ error }}</Message>

    <Card>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-gray-700">Descripción *</label>
            <InputText v-model="data.description" placeholder="Descripción del asiento"
              :disabled="!editMode && isEdit" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-gray-700">Fecha *</label>
            <InputText v-model="data.date" type="date"
              :disabled="!editMode && isEdit" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-gray-700">Tipo *</label>
            <Select v-model="data.type" :options="typeOptions" option-label="label" option-value="value"
              :disabled="!editMode && isEdit" />
          </div>
        </div>

        <!-- Lines table -->
        <div class="border rounded-lg overflow-hidden mb-4">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b">
              <tr>
                <th class="text-left px-3 py-2 font-medium text-gray-600">Cuenta Contable</th>
                <th class="text-right px-3 py-2 font-medium text-gray-600">Débito</th>
                <th class="text-right px-3 py-2 font-medium text-gray-600">Crédito</th>
                <th class="text-left px-3 py-2 font-medium text-gray-600">Descripción</th>
                <th class="px-3 py-2" style="width:40px"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(line, i) in data.lines" :key="i" class="border-b hover:bg-gray-50">
                <td class="px-3 py-2">
                  <Select v-model="line.chart_of_account_id" :options="accounts" option-label="label" option-value="id"
                    placeholder="Seleccionar cuenta" class="w-full"
                    :disabled="!editMode && isEdit">
                    <template #value="{ value }">
                      <span v-if="value" class="text-xs">{{ accounts.find(a => a.id === value)?.code }} - {{ accounts.find(a => a.id === value)?.name }}</span>
                      <span v-else class="text-gray-400 text-xs">Seleccionar...</span>
                    </template>
                    <template #option="{ option }">
                      <span class="text-xs">{{ option.code }} - {{ option.name }}</span>
                    </template>
                  </Select>
                </td>
                <td class="px-3 py-2">
                  <InputNumber v-model="line.debit" :min="0" :max="999999999.99" :minFractionDigits="2" :maxFractionDigits="2"
                    class="w-32" :disabled="!editMode && isEdit"
                    @update:modelValue="line.credit = 0" />
                </td>
                <td class="px-3 py-2">
                  <InputNumber v-model="line.credit" :min="0" :max="999999999.99" :minFractionDigits="2" :maxFractionDigits="2"
                    class="w-32" :disabled="!editMode && isEdit"
                    @update:modelValue="line.debit = 0" />
                </td>
                <td class="px-3 py-2">
                  <InputText v-model="line.description" placeholder="Opcional" class="w-full"
                    :disabled="!editMode && isEdit" />
                </td>
                <td class="px-3 py-2 text-center">
                  <Button v-if="editMode || !isEdit" icon="pi pi-trash" severity="danger" text rounded size="small"
                    @click="removeLine(i)" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Totals -->
        <div class="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg mb-4">
          <div class="flex items-center gap-6">
            <span class="text-sm font-medium">Total Débito: <span class="font-mono font-bold">${{ totalDebit.toFixed(2) }}</span></span>
            <span class="text-sm font-medium">Total Crédito: <span class="font-mono font-bold">${{ totalCredit.toFixed(2) }}</span></span>
            <span class="text-sm font-medium" :class="isBalanced ? 'text-green-600' : 'text-red-500'">
              {{ isBalanced ? '✓ Balanceado' : `✗ Diferencia: $${difference.toFixed(2)}` }}
            </span>
          </div>
          <Tag v-if="isBalanced && totalDebit > 0" value="OK" severity="success" />
        </div>

        <div v-if="editMode || !isEdit" class="flex justify-between items-center">
          <Button label="+ Agregar línea" severity="secondary" text @click="addLine" />
          <div class="flex gap-2">
            <Button label="Cancelar" severity="secondary" @click="router.back()" />
            <Button label="Guardar" icon="pi pi-check" :loading="saving" @click="save" />
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

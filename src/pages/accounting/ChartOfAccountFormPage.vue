<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  getChartOfAccount, createChartOfAccount, updateChartOfAccount,
  getAllAccounts, type ChartOfAccount, type ChartOfAccountInput,
} from '@/api/chartOfAccounts'
import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import ToggleSwitch from 'primevue/toggleswitch'
import Message from 'primevue/message'

const router = useRouter()
const route = useRoute()
const isEdit = route.params.id?.toString() ? true : false

const form = ref<ChartOfAccountInput>({
  code: '', name: '', type: 'asset', normal_balance: 'debit',
  level: 3, parent_id: null, is_active: true,
})
const saving = ref(false)
const error = ref('')
const parentAccounts = ref<ChartOfAccount[]>([])

const typeOptions = [
  { label: 'Activo', value: 'asset' },
  { label: 'Pasivo', value: 'liability' },
  { label: 'Patrimonio', value: 'equity' },
  { label: 'Ingresos', value: 'income' },
  { label: 'Costos', value: 'cost' },
  { label: 'Gastos', value: 'expense' },
]

const balanceOptions = [
  { label: 'Deudor', value: 'debit' },
  { label: 'Acreedor', value: 'credit' },
]

const levelOptions = [
  { label: 'Nivel 1 - Grupo', value: 1 },
  { label: 'Nivel 2 - Subgrupo', value: 2 },
  { label: 'Nivel 3 - Cuenta', value: 3 },
]

onMounted(async () => {
  try {
    const res = await getAllAccounts()
    parentAccounts.value = res.data.filter((a: ChartOfAccount) => a.level < 3)
  } catch {}

  if (isEdit) {
    const id = parseInt(route.params.id as string)
    try {
      const res = await getChartOfAccount(id)
      const a = res.data
      form.value = {
        code: a.code, name: a.name, type: a.type,
        normal_balance: a.normal_balance, level: a.level,
        parent_id: a.parent_id, is_active: a.is_active,
      }
    } catch {
      error.value = 'Error al cargar la cuenta'
    }
  }
})

async function save() {
  saving.value = true
  error.value = ''
  try {
    if (isEdit) {
      await updateChartOfAccount(parseInt(route.params.id as string), form.value)
    } else {
      await createChartOfAccount(form.value)
    }
    router.push('/accounting/chart-of-accounts')
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Error al guardar'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <div class="flex items-center gap-4">
      <Button icon="pi pi-arrow-left" severity="secondary" text rounded @click="router.back()" />
      <h1 class="text-2xl font-bold text-gray-800">{{ isEdit ? 'Editar' : 'Nueva' }} Cuenta Contable</h1>
    </div>

    <Message v-if="error" severity="error" :closable="true" @close="error = ''">{{ error }}</Message>

    <Card>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-gray-700">Código</label>
            <InputText v-model="form.code" placeholder="Ej: 1.01.01.001" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-gray-700">Nombre</label>
            <InputText v-model="form.name" placeholder="Nombre de la cuenta" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-gray-700">Tipo</label>
            <Select v-model="form.type" :options="typeOptions" option-label="label" option-value="value" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-gray-700">Saldo Normal</label>
            <Select v-model="form.normal_balance" :options="balanceOptions" option-label="label" option-value="value" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-gray-700">Nivel</label>
            <Select v-model="form.level" :options="levelOptions" option-label="label" option-value="value" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-gray-700">Cuenta Padre</label>
            <Select v-model="form.parent_id" :options="parentAccounts" option-label="label" option-value="id"
              placeholder="Ninguna (raíz)" :disabled="form.level === 1" clearable>
              <template #value="{ value }">
                <span v-if="value">{{ parentAccounts.find(a => a.id === value)?.code }} - {{ parentAccounts.find(a => a.id === value)?.name }}</span>
                <span v-else class="text-gray-400">Ninguna (raíz)</span>
              </template>
              <template #option="{ option }">
                <span>{{ option.code }} - {{ option.name }}</span>
              </template>
            </Select>
          </div>
          <div class="flex items-center gap-3 col-span-2">
            <ToggleSwitch v-model="form.is_active" :inputId="'active'" />
            <label for="active" class="text-sm font-medium text-gray-700">Cuenta Activa</label>
          </div>
        </div>

        <div class="flex justify-end gap-2 mt-6 pt-4 border-t">
          <Button label="Cancelar" severity="secondary" @click="router.back()" />
          <Button label="Guardar" icon="pi pi-check" :loading="saving" @click="save" />
        </div>
      </template>
    </Card>
  </div>
</template>

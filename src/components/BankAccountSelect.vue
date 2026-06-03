<template>
  <Select
    v-model="model"
    :options="accounts"
    optionLabel="label"
    optionValue="id"
    :loading="loading"
    :filter="true"
    filterPlaceholder="Buscar cuenta..."
    :placeholder="placeholder || 'Seleccionar cuenta bancaria'"
    showClear
    class="w-full"
  />
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { getBankAccounts } from '@/api/bankingService'
import Select from 'primevue/select'

interface BankAccount {
  id: number
  name: string
  bank_name?: string
  account_number?: string
  current_balance?: string | number
}

const props = defineProps<{
  modelValue?: number | null
  placeholder?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: number | null): void
}>()

const model = ref(props.modelValue)
const accounts = ref<BankAccount[]>([])
const loading = ref(false)

const list = computed(() =>
  accounts.value.map(a => ({
    id: a.id,
    label: `${a.name}${a.bank_name ? ' - ' + a.bank_name : ''}${a.account_number ? ' [' + a.account_number + ']' : ''}`
  }))
)

watch(model, (val) => emit('update:modelValue', val))

async function load() {
  loading.value = true
  try {
    const res = await getBankAccounts({ per_page: 100 })
    accounts.value = res.data?.data || []
  } catch {
    // silent
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

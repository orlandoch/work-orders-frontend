<template>
  <Select
    v-model="model"
    :options="accounts"
    optionLabel="label"
    optionValue="id"
    :loading="loading"
    :filter="true"
    filterPlaceholder="Buscar cuenta contable..."
    :placeholder="placeholder || 'Seleccionar cuenta contable'"
    showClear
    class="w-full"
  />
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { getChartOfAccounts } from '@/api/inventoryService'
import Select from 'primevue/select'

interface COA {
  id: number
  code: string
  name: string
}

const props = defineProps<{
  modelValue?: number | null
  placeholder?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: number | null): void
}>()

const model = ref(props.modelValue)
const accounts = ref<COA[]>([])
const loading = ref(false)

const list = computed(() =>
  accounts.value.map(a => ({
    id: a.id,
    label: `${a.code} - ${a.name}`
  }))
)

watch(model, (val) => emit('update:modelValue', val))

async function load() {
  loading.value = true
  try {
    const res = await getChartOfAccounts({ per_page: 200 })
    accounts.value = res.data?.data || []
  } catch {
    // silent
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

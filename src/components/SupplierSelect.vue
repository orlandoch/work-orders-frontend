<template>
  <Select
    v-model="model"
    :options="suppliers"
    optionLabel="name"
    optionValue="id"
    :loading="loading"
    :filter="true"
    filterPlaceholder="Buscar proveedor..."
    :placeholder="placeholder || 'Seleccionar proveedor'"
    showClear
    class="w-full"
  />
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import api from '@/api/client'
import Select from 'primevue/select'

interface Supplier {
  id: number
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
const suppliers = ref<Supplier[]>([])
const loading = ref(false)

watch(model, (val) => emit('update:modelValue', val))

async function load() {
  loading.value = true
  try {
    const res = await api.get('/suppliers', { params: { per_page: 100 } })
    suppliers.value = res.data?.data || res.data || []
  } catch {
    // silent
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

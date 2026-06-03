<template>
  <Select
    v-model="model"
    :options="locations"
    optionLabel="name"
    optionValue="id"
    :loading="loading"
    :filter="true"
    filterPlaceholder="Buscar ubicación..."
    :placeholder="placeholder || 'Seleccionar ubicación'"
    :disabled="!warehouseId"
    showClear
    class="w-full"
  />
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { getWarehouseLocations } from '@/api/inventoryService'
import Select from 'primevue/select'

interface Location {
  id: number
  name: string
}

const props = defineProps<{
  modelValue?: number | null
  warehouseId?: number | null
  placeholder?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: number | null): void
}>()

const model = ref(props.modelValue)
const locations = ref<Location[]>([])
const loading = ref(false)

watch(model, (val) => emit('update:modelValue', val))
watch(() => props.warehouseId, (val) => {
  model.value = null
  if (val) load(val)
  else locations.value = []
})

async function load(whId: number) {
  loading.value = true
  try {
    const res = await getWarehouseLocations({ warehouse_id: whId, per_page: 200 })
    locations.value = res.data?.data || []
  } catch {
    // silent
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (props.warehouseId) load(props.warehouseId)
})
</script>

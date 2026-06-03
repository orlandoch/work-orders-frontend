<template>
  <Select
    v-model="model"
    :options="products"
    optionLabel="name"
    optionValue="id"
    :loading="loading"
    :filter="true"
    filterPlaceholder="Buscar producto..."
    :placeholder="placeholder || 'Seleccionar producto'"
    showClear
    class="w-full"
    @filter="onFilter"
  />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { getProducts } from '@/api/inventoryService'
import Select from 'primevue/select'

interface Product {
  id: number
  name: string
  sku?: string
}

const props = defineProps<{
  modelValue?: number | null
  placeholder?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: number | null): void
}>()

const model = ref(props.modelValue)
const products = ref<Product[]>([])
const loading = ref(false)

watch(model, (val) => emit('update:modelValue', val))

async function loadProducts(search = '') {
  loading.value = true
  try {
    const res = await getProducts({ search, per_page: 50 })
    products.value = res.data?.data || res.data || []
  } catch {
    // silent
  } finally {
    loading.value = false
  }
}

function onFilter(e: any) {
  loadProducts(e.value || '')
}

loadProducts()
</script>

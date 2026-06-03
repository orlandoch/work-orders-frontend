<template>
  <Select v-model="modelValue" :options="items" optionLabel="name" optionValue="id" :loading="loading"
    :placeholder="placeholder" filter :filterFields="['name', 'sku', 'barcode']" showClear
    @update:modelValue="(v: any) => emit('update:modelValue', v)" class="w-full"
    :invalid="invalid">
    <template #option="slotProps">
      <div class="flex justify-content-between">
        <span>{{ slotProps.option.name }}</span>
        <small class="text-gray-400">{{ slotProps.option.sku }}</small>
      </div>
    </template>
  </Select>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getProducts } from '@/api/client'
import Select from 'primevue/select'

const props = defineProps<{
  modelValue?: number | null
  placeholder?: string
  invalid?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: number | null): void
}>()

const items = ref<any[]>([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const res = await getProducts({ per_page: 200 })
    items.value = res.data?.data || []
  } catch (e) {
    console.error('Error loading products', e)
  } finally {
    loading.value = false
  }
})
</script>

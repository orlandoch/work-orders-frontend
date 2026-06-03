<template>
  <div>
    <Card>
      <template #title>
        <div class="flex items-center gap-2">
          <i class="pi pi-tags text-blue-500" />
          <span>{{ isEdit ? 'Editar' : 'Nueva' }} Lista de Precios</span>
        </div>
      </template>
      <template #content>
        <Message v-if="error" severity="error" closable @close="error = ''">{{ error }}</Message>
        <form @submit.prevent="save">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div class="space-y-1">
              <label class="text-sm font-medium text-gray-700">Nombre *</label>
              <InputText v-model="f.name" class="w-full" required />
            </div>
            <div class="space-y-1">
              <label class="text-sm font-medium text-gray-700">Código *</label>
              <InputText v-model="f.code" class="w-full" required :disabled="isEdit" />
            </div>
            <div class="space-y-1">
              <label class="text-sm font-medium text-gray-700">Lista por defecto</label>
              <div class="flex items-center gap-2 mt-2">
                <ToggleSwitch v-model="f.is_default" />
                <span class="text-sm text-gray-600">{{ f.is_default ? 'Sí' : 'No' }}</span>
              </div>
            </div>
            <div class="space-y-1">
              <label class="text-sm font-medium text-gray-700">Activa</label>
              <div class="flex items-center gap-2 mt-2">
                <ToggleSwitch v-model="f.is_active" />
                <span class="text-sm text-gray-600">{{ f.is_active ? 'Sí' : 'No' }}</span>
              </div>
            </div>
          </div>
          <div class="flex justify-end gap-2">
            <Button label="Cancelar" severity="secondary" @click="$router.push('/price-lists')" />
            <Button type="submit" label="Guardar" :loading="saving" />
          </div>
        </form>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import ToggleSwitch from 'primevue/toggleswitch'
import Button from 'primevue/button'
import Message from 'primevue/message'
import { useToast } from 'primevue/usetoast'
import { getPriceList, createPriceList, updatePriceList } from '@/api/priceLists'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const isEdit = computed(() => !!route.params.id)

import { computed } from 'vue'

const f = reactive({
  name: '',
  code: '',
  is_default: false,
  is_active: true,
})

const saving = ref(false)
const error = ref('')

onMounted(async () => {
  if (isEdit.value) {
    try {
      const pl = await getPriceList(Number(route.params.id))
      f.name = pl.name
      f.code = pl.code
      f.is_default = pl.is_default
      f.is_active = pl.is_active
    } catch {
      error.value = 'Error al cargar lista de precios'
    }
  }
})

async function save() {
  saving.value = true
  error.value = ''
  try {
    if (isEdit.value) {
      await updatePriceList(Number(route.params.id), { ...f })
    } else {
      await createPriceList({ ...f })
    }
    toast.add({ severity: 'success', summary: 'Lista guardada', life: 3000 })
    router.push('/price-lists')
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Error al guardar'
  } finally {
    saving.value = false
  }
}
</script>

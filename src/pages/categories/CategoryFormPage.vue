<template>
  <div>
    <Card>
      <template #title>{{ isEdit ? 'Editar' : 'Nueva' }} Categoría</template>
      <template #content>
        <Message v-if="error" severity="error" closable @close="error = ''">{{ error }}</Message>
        <form @submit.prevent="save">
          <div class="form-grid mb-6">
            <div class="field"><label>Nombre *</label><InputText v-model="f.name" class="w-full" required /></div>
            <div class="field"><label>Código</label><InputText v-model="f.code" class="w-full" placeholder="Ej: MAT-VIN" /></div>
            <div class="field"><label>Categoría Padre</label><Select v-model="f.parent_id" :options="parentOptions" optionLabel="label" optionValue="value" filter showClear class="w-full" placeholder="— Ninguna (raíz) —" /></div>
            <div class="field"><label>Activo</label><ToggleSwitch v-model="f.is_active" /></div>
            <div class="field full-width"><label>Descripción</label><Textarea v-model="f.description" rows="2" class="w-full" /></div>
          </div>
          <div class="form-actions">
            <Button label="Cancelar" severity="secondary" @click="$router.push('/categories')" />
            <Button type="submit" label="Guardar" :loading="saving" />
          </div>
        </form>
      </template>
    </Card>
    <Toast />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api/client'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import ToggleSwitch from 'primevue/toggleswitch'
import Button from 'primevue/button'
import Message from 'primevue/message'
import { useToast } from 'primevue/usetoast'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const isEdit = computed(() => !!route.params.id)
const saving = ref(false)
const error = ref('')

const f = reactive({
  name: '',
  code: '',
  parent_id: null as number | null,
  description: '',
  is_active: true,
})

const allCats = ref<any[]>([])
const parentOptions = ref<{ label: string; value: number | null }[]>([])

function buildOptions(cats: any[], parentId: number | null = null, depth: number = 0): { label: string; value: number | null }[] {
  const result: { label: string; value: number | null }[] = []
  for (const c of cats) {
    if (c.parent_id === parentId && c.id !== route.params.id) {
      result.push({ label: '— '.repeat(depth) + c.name, value: c.id })
      result.push(...buildOptions(cats, c.id, depth + 1))
    }
  }
  return result
}

onMounted(async () => {
  try {
    const { data: res } = await api.get('/product-categories?per_page=200')
    const cats = res?.data?.data || []
    allCats.value = cats
    parentOptions.value = [{ label: '— Ninguna (raíz) —', value: null }, ...buildOptions(cats, null, 1)]

    if (isEdit.value) {
      const { data: catRes } = await api.get(`/product-categories/${route.params.id}`)
      const cat = catRes?.data
      if (cat) {
        f.name = cat.name || ''
        f.code = cat.code || ''
        f.parent_id = cat.parent_id || null
        f.description = cat.description || ''
        f.is_active = cat.is_active ?? true
      }
    }
  } catch {
    error.value = 'Error al cargar datos'
  }
})

async function save() {
  if (!f.name.trim()) { error.value = 'El nombre es obligatorio'; return }
  saving.value = true
  error.value = ''
  try {
    if (isEdit.value) await api.put(`/product-categories/${route.params.id}`, f)
    else await api.post('/product-categories', f)
    toast.add({ severity: 'success', summary: 'Guardado', life: 2000 })
    setTimeout(() => router.push('/categories'), 500)
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Error al guardar'
  } finally {
    saving.value = false
  }
}
</script>

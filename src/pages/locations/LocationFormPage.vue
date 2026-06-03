<template>
  <div><Card><template #title>{{isEdit?'Editar':'Nueva'}} Ubicación</template><template #content>
    <form @submit.prevent="save"><div class="form-grid">
      <div class="field"><label>Nombre *</label><InputText v-model="f.name" class="w-full" required/></div>
      <div class="field"><label>Código</label><InputText v-model="f.code" class="w-full"/></div>
      <div class="field"><label>Tipo</label><Select v-model="f.type" :options="['warehouse','zone','shelf','level']" class="w-full"/></div>
      <div class="field"><label>Padre</label><Select v-model="f.parent_id" :options="locs" optionLabel="name" optionValue="id" class="w-full" placeholder="Ninguno"/></div>
      <div class="field"><label>Activo</label><ToggleSwitch v-model="f.is_active"/></div>
      <div class="field full-width"><label>Descripción</label><Textarea v-model="f.description" rows="2" class="w-full"/></div>
    </div><div class="form-actions"><Button label="Cancelar" severity="secondary" @click="$router.push('/locations')"/><Button type="submit" label="Guardar" :loading="saving"/></div></form>
  </template></Card><Toast/></div>
</template>
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api/client'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import ToggleSwitch from 'primevue/toggleswitch'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const isEdit = computed(() => !!route.params.id)
const saving = ref(false)
const locs = ref([])
const f = ref({ name: '', code: '', type: 'warehouse', parent_id: null, description: '', is_active: true })

onMounted(async () => {
  try {
    const { data } = await api.get('/locations?per_page=100')
    locs.value = data.data.data
  } catch {}
  if (isEdit.value) {
    try {
      const { data } = await api.get(`/locations/${route.params.id}`)
      Object.assign(f.value, data.data)
    } catch {}
  }
})

async function save() {
  saving.value = true
  try {
    if (isEdit.value) await api.put(`/locations/${route.params.id}`, f.value)
    else await api.post('/locations', f.value)
    toast.add({ severity: 'success', summary: 'Guardado', life: 3000 })
    setTimeout(() => router.push('/locations'), 500)
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'Error' })
  } finally {
    saving.value = false
  }
}
</script>
<style scoped>
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.full-width { grid-column: 1 / -1; }
.field label { display: block; margin-bottom: 0.375rem; font-size: 0.875rem; font-weight: 500; }
.form-actions { display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1.5rem; }
</style>

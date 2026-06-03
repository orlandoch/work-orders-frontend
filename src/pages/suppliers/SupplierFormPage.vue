<template>
  <div>
    <Card>
      <template #title>{{ isEdit ? 'Editar' : 'Nuevo' }} Proveedor</template>
      <template #content>
        <form @submit.prevent="save">
          <!-- Basic info -->
          <div class="form-grid mb-4">
            <div class="field"><label>Nombres *</label><InputText v-model="f.first_name" class="w-full" required /></div>
            <div class="field"><label>Apellidos</label><InputText v-model="f.last_name" class="w-full" placeholder="Opcional (persona jurídica)" /></div>
            <div class="field"><label>Tipo Documento</label><Select v-model="f.document_type" :options="['cedula','ruc','pasaporte']" class="w-full" placeholder="Seleccionar" /></div>
            <div class="field"><label>N° Documento</label><InputText v-model="f.document_number" class="w-full" /></div>
          </div>

          <!-- Contact details -->
          <div class="border-t pt-3 mb-4">
            <h3 class="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <i class="pi pi-address-book text-blue-500" />
              Contacto
            </h3>

            <div class="mb-3">
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm font-medium text-gray-600">Teléfonos</span>
                <Button icon="pi pi-plus" text rounded size="small" @click="addDetail('phone')" />
              </div>
              <div v-for="(d, i) in phones" :key="d._key" class="flex items-center gap-2 mb-1">
                <InputText v-model="d.value" placeholder="Número" class="flex-1" />
                <InputText v-model="d.label" placeholder="Etiqueta" class="w-28" />
                <i v-if="d.is_primary" class="pi pi-star-fill text-yellow-500 cursor-pointer" title="Principal" @click="setPrimary(d, 'phone')" />
                <i v-else class="pi pi-star text-gray-300 cursor-pointer" title="Marcar principal" @click="setPrimary(d, 'phone')" />
                <Button icon="pi pi-trash" text rounded severity="danger" size="small" @click="removeDetail(i, 'phone')" />
              </div>
            </div>

            <div class="mb-3">
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm font-medium text-gray-600">Emails</span>
                <Button icon="pi pi-plus" text rounded size="small" @click="addDetail('email')" />
              </div>
              <div v-for="(d, i) in emails" :key="d._key" class="flex items-center gap-2 mb-1">
                <InputText v-model="d.value" placeholder="Email" type="email" class="flex-1" />
                <InputText v-model="d.label" placeholder="Etiqueta" class="w-28" />
                <i v-if="d.is_primary" class="pi pi-star-fill text-yellow-500 cursor-pointer" @click="setPrimary(d, 'email')" />
                <i v-else class="pi pi-star text-gray-300 cursor-pointer" @click="setPrimary(d, 'email')" />
                <Button icon="pi pi-trash" text rounded severity="danger" size="small" @click="removeDetail(i, 'email')" />
              </div>
            </div>

            <div class="mb-1">
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm font-medium text-gray-600">Direcciones</span>
                <Button icon="pi pi-plus" text rounded size="small" @click="addDetail('address')" />
              </div>
              <div v-for="(d, i) in addresses" :key="d._key" class="flex items-center gap-2 mb-1">
                <InputText v-model="d.value" placeholder="Dirección" class="flex-1" />
                <InputText v-model="d.label" placeholder="Etiqueta" class="w-28" />
                <i v-if="d.is_primary" class="pi pi-star-fill text-yellow-500 cursor-pointer" @click="setPrimary(d, 'address')" />
                <i v-else class="pi pi-star text-gray-300 cursor-pointer" @click="setPrimary(d, 'address')" />
                <Button icon="pi pi-trash" text rounded severity="danger" size="small" @click="removeDetail(i, 'address')" />
              </div>
            </div>
          </div>

          <div class="border-t pt-3 mb-4">
            <div class="field">
              <label>Activo</label>
              <div class="mt-2"><ToggleSwitch v-model="f.is_active" /></div>
            </div>
          </div>

          <div class="form-actions">
            <Button label="Cancelar" severity="secondary" @click="$router.push('/suppliers')" />
            <Button type="submit" label="Guardar" :loading="saving" />
          </div>
        </form>
      </template>
    </Card>
    <Toast />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api/client'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import ToggleSwitch from 'primevue/toggleswitch'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'

interface ContactDetailItem {
  _key: number
  id?: number
  value: string
  type: 'phone' | 'email' | 'address'
  label: string
  is_primary: boolean
}

let keyCounter = 0

const route = useRoute()
const router = useRouter()
const toast = useToast()
const isEdit = computed(() => !!route.params.id)
const saving = ref(false)

const f = ref({ first_name: '', last_name: '', document_type: '', document_number: '', is_active: true })
const contactDetails = ref<ContactDetailItem[]>([])

const phones = computed(() => contactDetails.value.filter(d => d.type === 'phone'))
const emails = computed(() => contactDetails.value.filter(d => d.type === 'email'))
const addresses = computed(() => contactDetails.value.filter(d => d.type === 'address'))

function addDetail(type: 'phone' | 'email' | 'address') {
  contactDetails.value.push({ _key: ++keyCounter, value: '', type, label: '', is_primary: false })
}

function removeDetail(index: number, type: string) {
  const items = contactDetails.value.filter(d => d.type === type)
  const item = items[index]
  if (item) {
    contactDetails.value = contactDetails.value.filter(d => d._key !== item._key)
  }
}

function setPrimary(item: ContactDetailItem, type: string) {
  contactDetails.value.forEach(d => {
    if (d.type === type) d.is_primary = d._key === item._key
  })
}

onMounted(async () => {
  if (isEdit.value) {
    try {
      const { data } = await api.get(`/suppliers/${route.params.id}`)
      const s = data.data
      f.value.first_name = s.first_name || ''
      f.value.last_name = s.last_name || ''
      f.value.document_type = s.document_type || ''
      f.value.document_number = s.document_number || ''
      f.value.is_active = s.is_active ?? true

      if (s.contact_details) {
        contactDetails.value = s.contact_details.map((cd: any) => ({
          _key: ++keyCounter,
          id: cd.id,
          value: cd.value,
          type: cd.type,
          label: cd.label || '',
          is_primary: cd.is_primary ?? false,
        }))
      }
    } catch { toast.add({ severity: 'error', summary: 'Error al cargar proveedor' }) }
  } else {
    addDetail('phone')
    addDetail('email')
    addDetail('address')
    contactDetails.value.forEach(d => { d.is_primary = true })
  }
})

async function save() {
  saving.value = true
  const payload: any = {
    ...f.value,
    contact_details: contactDetails.value.map(d => ({
      id: d.id,
      value: d.value,
      type: d.type,
      label: d.label || null,
      is_primary: d.is_primary,
    })),
  }

  try {
    if (isEdit.value) await api.put(`/suppliers/${route.params.id}`, payload)
    else await api.post('/suppliers', payload)
    toast.add({ severity: 'success', summary: 'Guardado', life: 3000 })
    setTimeout(() => router.push('/suppliers'), 500)
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'Error al guardar' })
  } finally { saving.value = false }
}
</script>

<style scoped>
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.field label { display: block; margin-bottom: 0.375rem; font-size: 0.875rem; font-weight: 500; }
.form-actions { display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1.5rem; }
</style>

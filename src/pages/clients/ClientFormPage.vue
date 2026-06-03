<template>
  <div>
    <Card>
      <template #title>{{ isEdit ? 'Editar' : 'Nuevo' }} Cliente</template>
      <template #content>
        <form @submit.prevent="save">
          <!-- Basic info -->
          <div class="form-grid mb-4">
            <div class="field"><label>Nombres *</label><InputText v-model="form.first_name" class="w-full" required /></div>
            <div class="field"><label>Apellidos</label><InputText v-model="form.last_name" class="w-full" placeholder="Opcional (persona jurídica)" /></div>
            <div class="field"><label>Tipo Documento</label><Select v-model="form.document_type" :options="docTypes" class="w-full" placeholder="Seleccionar" /></div>
            <div class="field"><label>N° Documento</label><InputText v-model="form.document_number" class="w-full" /></div>
          </div>

          <!-- Contact details -->
          <div class="border-t pt-3 mb-4">
            <h3 class="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <i class="pi pi-address-book text-blue-500" />
              Contacto
            </h3>

            <!-- Phones -->
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

            <!-- Emails -->
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

            <!-- Addresses -->
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

          <!-- Status & price list -->
          <div class="border-t pt-3 mb-4">
            <div class="form-grid">
              <div class="field">
                <label>Activo</label>
                <div class="mt-2"><ToggleSwitch v-model="form.is_active" /></div>
              </div>
              <div class="field">
                <label>Lista de Precios</label>
                <Select v-model="form.price_list_id" :options="priceLists" optionLabel="name" optionValue="id" filter class="w-full" placeholder="Default" :loading="loadingPl" />
              </div>
            </div>
          </div>

          <div class="form-actions">
            <Button label="Cancelar" severity="secondary" @click="$router.push('/clients')" />
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
import { getPriceLists } from '@/api/priceLists'
import { fetchRequiredFields } from '@/composables/useRequiredFields'
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

const requiredClientFields = ref<string[]>([])

onMounted(async () => {
  const fields = await fetchRequiredFields()
  requiredClientFields.value = fields.requiredClientFields.value
})

const fieldLabels: Record<string, string> = {
  document_type: 'Tipo de documento',
  document_number: 'Número de documento',
  email: 'Correo electrónico',
  phone: 'Teléfono',
  address: 'Dirección',
}

const loadingPl = ref(false)
const priceLists = ref<Array<{id:number;name:string}>>([])
const docTypes = ['cedula','ruc','pasaporte']

const form = ref({ first_name:'', last_name:'', document_type:'', document_number:'', is_active:true, price_list_id:null as number|null })
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
  loadingPl.value = true
  try { priceLists.value = await getPriceLists() } catch {}
  loadingPl.value = false

  if (isEdit.value) {
    try {
      const { data } = await api.get(`/clients/${route.params.id}`)
      const c = data.data
      form.value.first_name = c.first_name || ''
      form.value.last_name = c.last_name || ''
      form.value.document_type = c.document_type || ''
      form.value.document_number = c.document_number || ''
      form.value.is_active = c.is_active ?? true
      form.value.price_list_id = c.price_list_id || null

      if (c.contact_details) {
        contactDetails.value = c.contact_details.map((cd: any) => ({
          _key: ++keyCounter,
          id: cd.id,
          value: cd.value,
          type: cd.type,
          label: cd.label || '',
          is_primary: cd.is_primary ?? false,
        }))
      }
    } catch { toast.add({ severity: 'error', summary: 'Error al cargar cliente' }) }
  } else {
    // Start with one empty phone, email, address
    addDetail('phone')
    addDetail('email')
    addDetail('address')
    // Mark first of each as primary
    contactDetails.value.forEach(d => { d.is_primary = true })
  }
})

async function save() {
  saving.value = true

  // Validate required fields
  const missing: string[] = []
  for (const field of requiredClientFields.value) {
    if (field === 'document_type') {
      if (!form.value.document_type) missing.push(fieldLabels.document_type)
    } else if (field === 'document_number') {
      if (!form.value.document_number?.trim()) missing.push(fieldLabels.document_number)
    } else if (field === 'email') {
      if (!form.value.email?.trim()) missing.push(fieldLabels.email)
    } else if (field === 'phone') {
      const hasPhone = contactDetails.value.some(d => d.type === 'phone' && d.value?.trim())
      if (!hasPhone) missing.push(fieldLabels.phone)
    } else if (field === 'address') {
      const hasAddress = contactDetails.value.some(d => d.type === 'address' && d.value?.trim())
      if (!hasAddress) missing.push(fieldLabels.address)
    }
  }
  if (missing.length) {
    toast.add({ severity: 'error', summary: 'Campos requeridos', detail: 'Complete: ' + missing.join(', '), life: 5000 })
    saving.value = false
    return
  }

  const payload: any = {
    ...form.value,
    contact_details: contactDetails.value.map(d => ({
      id: d.id,
      value: d.value,
      type: d.type,
      label: d.label || null,
      is_primary: d.is_primary,
    })),
  }

  try {
    if (isEdit.value) await api.put(`/clients/${route.params.id}`, payload)
    else await api.post('/clients', payload)
    toast.add({ severity: 'success', summary: 'Guardado', life: 3000 })
    setTimeout(() => router.push('/clients'), 500)
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

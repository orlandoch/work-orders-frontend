<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{ visible: boolean; brand: any }>()
const emit = defineEmits(['close', 'saved'])

const name = ref('')
const saving = ref(false)
const error = ref('')

watch(() => props.visible, (v) => {
  if (v) {
    name.value = props.brand?.name || ''
    error.value = ''
  }
})

async function save() {
  if (!name.value.trim()) { error.value = 'El nombre es obligatorio'; return }
  saving.value = true
  error.value = ''
  try {
    const token = localStorage.getItem('token')
    const isEdit = props.brand?.id
    const url = isEdit ? `/api/brands/${props.brand.id}` : '/api/brands'
    const res = await fetch(url, {
      method: isEdit ? 'PUT' : 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ name: name.value.trim() })
    })
    if (res.ok) {
      emit('saved')
    } else {
      const json = await res.json()
      error.value = json.message || JSON.stringify(json.errors || '')
    }
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <Dialog
    :visible="visible"
    :header="brand?.id ? 'Editar Marca' : 'Nueva Marca'"
    :modal="true"
    :closable="true"
    @update:visible="$emit('close')"
    style="width:450px"
  >
    <div class="field">
      <label for="brandName">Nombre</label>
      <InputText id="brandName" v-model="name" class="w-full" autofocus />
    </div>

    <small v-if="error" class="p-error block mt-1">{{ error }}</small>

    <template #footer>
      <Button label="Cancelar" icon="pi pi-times" class="p-button-text" @click="$emit('close')" />
      <Button label="Guardar" icon="pi pi-check" :loading="saving" @click="save" />
    </template>
  </Dialog>
</template>

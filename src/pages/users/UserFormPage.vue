<template>
  <div class="max-w-2xl mx-auto">
    <div class="mb-6 flex items-center gap-2">
      <Button icon="pi pi-arrow-left" severity="secondary" text @click="router.push('/users')" />
      <h1 class="text-2xl font-bold text-gray-800">{{ isEdit ? 'Editar Usuario' : 'Nuevo Usuario' }}</h1>
    </div>

    <Card>
      <template #content>
        <Message v-if="error" severity="error" class="mb-4">{{ error }}</Message>

        <form @submit.prevent="submit" class="form-grid">
          <div class="field">
            <label>Nombre *</label>
            <InputText v-model="form.name" class="w-full" required placeholder="Nombre completo" />
          </div>
          <div class="field">
            <label>Email *</label>
            <InputText v-model="form.email" type="email" class="w-full" required placeholder="correo@ejemplo.com" />
          </div>
          <div class="field">
            <label>{{ isEdit ? 'Nueva Contraseña (dejar vacío para mantener)' : 'Contraseña *' }}</label>
            <InputText v-model="form.password" type="password" class="w-full" placeholder="••••••••" :required="!isEdit" />
            <small class="text-muted" v-if="isEdit">Solo si quieres cambiar la contraseña</small>
          </div>
          <div class="field full-width">
            <label>Roles {{ form.role_ids.length > 0 ? `(${form.role_ids.length} seleccionados)` : '' }}</label>
            <div v-if="loadingRoles" class="text-center py-4 text-muted">Cargando roles...</div>
            <div v-else-if="!roles.length" class="text-center py-4 text-muted">No hay roles disponibles</div>
            <div v-else class="roles-grid">
              <div v-for="role in roles" :key="role.id" class="role-item" @click="toggleRole(role.id)">
                <Checkbox :inputId="'role_'+role.id" :binary="true" :modelValue="form.role_ids.includes(role.id)" @click.stop />
                <label :for="'role_'+role.id" class="cursor-pointer select-none role-name">
                  {{ role.name }}
                </label>
                <Tag v-if="role.description" :value="role.description" severity="secondary" class="role-desc" />
              </div>
            </div>
          </div>
          <div class="full-width flex justify-end gap-2 pt-2">
            <Button label="Cancelar" severity="secondary" @click="router.push('/users')" />
            <Button type="submit" :loading="saving" :label="isEdit ? 'Guardar Cambios' : 'Crear Usuario'" />
          </div>
        </form>
      </template>
    </Card>
    <Toast />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '@/api/client'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Checkbox from 'primevue/checkbox'
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import Message from 'primevue/message'
import { useToast } from 'primevue/usetoast'
import Toast from 'primevue/toast'

const router = useRouter()
const route = useRoute()
const toast = useToast()
const isEdit = computed(() => !!route.params.id)

const saving = ref(false)
const loadingRoles = ref(true)
const error = ref<string | null>(null)
const roles = ref<any[]>([])

const form = ref({
  name: '',
  email: '',
  password: '',
  role_ids: [] as number[],
})

function toggleRole(id: number) {
  const idx = form.value.role_ids.indexOf(id)
  if (idx >= 0) {
    form.value.role_ids.splice(idx, 1)
  } else {
    form.value.role_ids.push(id)
  }
}

async function submit() {
  if (!form.value.name || !form.value.email) {
    error.value = 'Nombre y email son requeridos'
    return
  }
  if (!isEdit.value && !form.value.password) {
    error.value = 'Contraseña es requerida'
    return
  }

  saving.value = true
  error.value = null
  try {
    const payload: any = {
      name: form.value.name,
      email: form.value.email,
      role_ids: form.value.role_ids,
    }
    if (form.value.password) {
      payload.password = form.value.password
    }

    if (isEdit.value) {
      await api.put(`/users/${route.params.id}`, payload)
      toast.add({ severity: 'success', summary: 'Actualizado', detail: 'Usuario actualizado', life: 3000 })
    } else {
      await api.post('/users', payload)
      toast.add({ severity: 'success', summary: 'Creado', detail: 'Usuario creado', life: 3000 })
    }
    router.push('/users')
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Error al guardar usuario'
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  // Load roles
  try {
    const { data } = await api.get('/roles')
    roles.value = data.data.data
  } catch { }

  // If editing, load user data
  if (isEdit.value) {
    try {
      const { data } = await api.get(`/users/${route.params.id}`)
      const u = data.data
      form.value.name = u.name
      form.value.email = u.email
      form.value.role_ids = u.roles?.map((r: any) => r.id) || []
    } catch { }
  }

  loadingRoles.value = false
})
</script>

<style scoped>
.form-grid {
  display: grid;
  gap: 1rem;
}
.full-width {
  grid-column: 1 / -1;
}
.field label {
  display: block;
  margin-bottom: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
}
.text-muted {
  color: #94a3b8;
  font-size: 0.8rem;
}
.roles-grid {
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  overflow: hidden;
}
.role-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.75rem;
  cursor: pointer;
  transition: background 0.15s;
  border-bottom: 1px solid #f1f5f9;
}
.role-item:last-child {
  border-bottom: none;
}
.role-item:hover {
  background: #f8fafc;
}
.role-name {
  font-weight: 500;
  font-size: 0.875rem;
  min-width: 120px;
}
.role-desc {
  font-size: 0.75rem;
}
</style>

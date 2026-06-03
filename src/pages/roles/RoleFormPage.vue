<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '@/api/client'
import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Checkbox from 'primevue/checkbox'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import { useToast } from 'primevue/usetoast'

const router = useRouter()
const route = useRoute()
const toast = useToast()

const isEdit = computed(() => !!route.params.id)
const saving = ref(false)
const loading = ref(true)
const error = ref<string | null>(null)
const allPermissions = ref<any[]>([])

const form = ref({ name: '', description: '' })
const selectedPermissionIds = ref<number[]>([])

const modules = computed(() => {
  const set = new Set<string>()
  allPermissions.value.forEach(p => {
    const mod = p.name.split('.')[0]
    set.add(mod)
  })
  return Array.from(set).sort()
})

function modulePermissions(module: string) {
  return allPermissions.value.filter(p => p.name.startsWith(module + '.'))
}

function toggleModule(module: string, checked: boolean) {
  const modulePerms = modulePermissions(module)
  const moduleIds = modulePerms.map(p => p.id)
  if (checked) {
    const newIds = moduleIds.filter(id => !selectedPermissionIds.value.includes(id))
    selectedPermissionIds.value.push(...newIds)
  } else {
    selectedPermissionIds.value = selectedPermissionIds.value.filter(id => !moduleIds.includes(id))
  }
}

function isModuleFullySelected(module: string): boolean {
  const perms = modulePermissions(module)
  if (perms.length === 0) return false
  return perms.every(p => selectedPermissionIds.value.includes(p.id))
}

function isModulePartiallySelected(module: string): boolean {
  const perms = modulePermissions(module)
  if (perms.length === 0) return false
  const selected = perms.filter(p => selectedPermissionIds.value.includes(p.id))
  return selected.length > 0 && selected.length < perms.length
}

function togglePermission(id: number) {
  const idx = selectedPermissionIds.value.indexOf(id)
  if (idx >= 0) {
    selectedPermissionIds.value.splice(idx, 1)
  } else {
    selectedPermissionIds.value.push(id)
  }
}

function formatModuleName(module: string): string {
  const names: Record<string, string> = {
    users: 'Usuarios',
    roles: 'Roles',
    clients: 'Clientes',
    suppliers: 'Proveedores',
    products: 'Productos',
    categories: 'Categorías',
    locations: 'Ubicaciones',
    stock: 'Stock',
    'work-orders': 'Órdenes de Trabajo',
    bom: 'BOM',
    consumptions: 'Consumos',
    calendar: 'Calendario',
    invoices: 'Facturación',
    ivas: 'IVA',
    'payment-terms': 'Formas de Pago',
    dashboard: 'Dashboard',
  }
  return names[module] || module
}

function labelForCode(name: string): string {
  const action = name.split('.').pop() || name
  const labels: Record<string, string> = {
    view: 'Ver',
    create: 'Crear',
    edit: 'Editar',
    delete: 'Eliminar',
    manage: 'Gestionar',
    issue: 'Emitir',
    pay: 'Cobrar/Pagar',
    cancel: 'Anular',
    start: 'Iniciar',
    complete: 'Completar',
    alerts: 'Alertas',
  }
  return labels[action] || action
}

const totalPermisos = computed(() => allPermissions.value.length)

async function submit() {
  if (!form.value.name) {
    error.value = 'El nombre del rol es requerido'
    return
  }
  saving.value = true
  error.value = null
  try {
    const payload = {
      name: form.value.name,
      description: form.value.description,
      permissions: selectedPermissionIds.value,
    }
    if (isEdit.value) {
      await api.put(`/roles/${route.params.id}`, payload)
      toast.add({ severity: 'success', summary: 'Actualizado', detail: 'Rol actualizado', life: 3000 })
    } else {
      await api.post('/roles', payload)
      toast.add({ severity: 'success', summary: 'Creado', detail: 'Rol creado', life: 3000 })
    }
    router.push('/roles')
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Error al guardar rol'
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    const [permsRes] = await Promise.all([
      api.get('/permissions'),
    ])
    allPermissions.value = permsRes.data.data

    if (isEdit.value) {
      const roleRes = await api.get(`/roles/${route.params.id}`)
      const r = roleRes.data.data
      form.value.name = r.name
      form.value.description = r.description || ''
      selectedPermissionIds.value = r.permissions?.map((p: any) => p.id) || []
    }

    loading.value = false
  } catch {
    error.value = 'Error al cargar datos'
    loading.value = false
  }
})
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6 pb-8">
    <div class="flex items-center gap-2">
      <Button icon="pi pi-arrow-left" severity="secondary" text @click="router.push('/roles')" />
      <h1 class="text-2xl font-bold text-gray-800">{{ isEdit ? 'Editar Rol' : 'Nuevo Rol' }}</h1>
    </div>

    <Message v-if="error" severity="error" class="mb-4">{{ error }}</Message>

    <Card>
      <template #content>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">Nombre *</label>
            <InputText v-model="form.name" class="w-full" required placeholder="ej: Operador" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Descripción</label>
            <Textarea v-model="form.description" class="w-full" rows="3" placeholder="¿Qué puede hacer este rol?" />
          </div>

          <div class="pt-4">
            <div class="flex items-center justify-between mb-2">
              <label class="text-sm font-medium text-gray-700">Permisos</label>
              <span class="text-sm text-gray-500">
                {{ selectedPermissionIds.length }} de {{ totalPermisos }} permisos seleccionados
              </span>
            </div>

            <div v-if="loading" class="text-center py-4 text-gray-400">Cargando permisos...</div>

            <div v-else>
              <div v-for="mod in modules" :key="mod" class="border rounded-lg overflow-hidden" style="margin-bottom: 1.25rem">
                <div class="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b cursor-pointer hover:bg-gray-100"
                  @click="toggleModule(mod, !isModuleFullySelected(mod))">
                  <i class="pi" :class="isModuleFullySelected(mod) ? 'pi-check-circle text-green-600' :
                    isModulePartiallySelected(mod) ? 'pi-minus-circle text-yellow-600' : 'pi-circle text-gray-300'" />
                  <span class="font-semibold text-gray-700 flex-1">{{ formatModuleName(mod) }}</span>
                  <Tag :value="modulePermissions(mod).length" severity="info" />
                </div>
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 p-3">
                  <div v-for="perm in modulePermissions(mod)" :key="perm.id"
                    class="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 cursor-pointer"
                    @click="togglePermission(perm.id)">
                    <Checkbox
                      :inputId="`perm_${perm.id}`"
                      :binary="true"
                      :modelValue="selectedPermissionIds.includes(perm.id)"
                      @click.stop
                    />
                    <label :for="`perm_${perm.id}`" class="text-sm cursor-pointer select-none">
                      {{ labelForCode(perm.name) }}
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button label="Cancelar" severity="secondary" @click="router.push('/roles')" />
          <Button type="submit" :loading="saving" :label="isEdit ? 'Guardar Cambios' : 'Crear Rol'" @click="submit" />
        </div>
      </template>
    </Card>
  </div>
</template>

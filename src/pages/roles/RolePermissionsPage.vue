<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '@/api/client'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import { useToast } from 'primevue/usetoast'

const router = useRouter()
const route = useRoute()
const toast = useToast()

const saving = ref(false)
const loading = ref(true)
const error = ref<string | null>(null)
const success = ref(false)

const roleId = computed(() => Number(route.params.id))
const role = ref<any>(null)
const allPermissions = ref<any[]>([])
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

async function save() {
  saving.value = true
  error.value = null
  success.value = false
  try {
    await api.put(`/roles/${roleId.value}`, {
      permissions: selectedPermissionIds.value,
    })
    success.value = true
    toast.add({ severity: 'success', summary: 'Actualizado', detail: 'Permisos del rol actualizados', life: 3000 })
    setTimeout(() => { success.value = false }, 3000)
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Error al guardar permisos'
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    const [roleRes, permsRes] = await Promise.all([
      api.get(`/roles/${roleId.value}`),
      api.get('/permissions'),
    ])
    role.value = roleRes.data.data
    allPermissions.value = permsRes.data.data
    selectedPermissionIds.value = role.value.permissions?.map((p: any) => p.id) || []
  } catch {
    error.value = 'Error al cargar datos'
  }
  loading.value = false
})
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6 pb-8">
    <div class="flex items-center gap-2">
      <Button icon="pi pi-arrow-left" severity="secondary" text @click="router.push('/roles')" />
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Permisos del Rol</h1>
        <p v-if="role" class="text-sm text-gray-500">{{ role.name }}</p>
      </div>
    </div>

    <Message v-if="success" severity="success">Permisos actualizados correctamente</Message>
    <Message v-if="error" severity="error">{{ error }}</Message>

    <div class="flex items-center justify-end gap-3 mb-2">
      <span class="text-sm text-gray-500">
        {{ selectedPermissionIds.length }} de {{ totalPermisos }} permisos seleccionados
      </span>
      <Button :loading="saving" label="Guardar Permisos" icon="pi pi-save" @click="save" />
    </div>

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
</template>

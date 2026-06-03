<template>
  <div v-if="client">
    <div class="flex items-center gap-3 mb-4">
      <Button icon="pi pi-arrow-left" text rounded @click="$router.push('/clients')" />
      <h1 class="text-xl font-bold">{{ client.full_name }}</h1>
      <span class="ml-auto flex gap-2">
        <Button label="Editar" icon="pi pi-pencil" outlined @click="$router.push(`/clients/${client.id}/edit`)" />
      </span>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- Info card -->
      <Card>
        <template #title>Información General</template>
        <template #content>
          <dl class="text-sm space-y-2">
            <div class="flex justify-between"><dt class="text-gray-500">Documento</dt><dd>{{ client.document_type }} {{ client.document_number }}</dd></div>
            <div class="flex justify-between"><dt class="text-gray-500">Activo</dt><dd><i :class="client.is_active ? 'pi pi-check text-green-500' : 'pi pi-times text-red-400'"></i></dd></div>
          </dl>
        </template>
      </Card>

      <!-- Contact card -->
      <Card>
        <template #title>Contacto</template>
        <template #content>
          <div v-if="contactGroups.length" class="text-sm space-y-3">
            <div v-for="group in contactGroups" :key="group.type">
              <h4 class="font-medium text-gray-600 capitalize mb-1">{{ group.type === 'phone' ? 'Teléfonos' : group.type === 'email' ? 'Emails' : 'Direcciones' }}</h4>
              <div v-for="cd in group.items" :key="cd.id" class="flex items-center gap-2 py-0.5">
                <i :class="group.icon" class="text-gray-400" />
                <span>{{ cd.value }}</span>
                <span v-if="cd.label" class="text-gray-400 text-xs">({{ cd.label }})</span>
                <i v-if="cd.is_primary" class="pi pi-star-fill text-yellow-500 text-xs" title="Principal" />
              </div>
            </div>
          </div>
          <p v-else class="text-gray-400 text-sm">Sin información de contacto</p>
        </template>
      </Card>

      <!-- Stats / future card -->
      <Card>
        <template #title>Resumen</template>
        <template #content>
          <p class="text-sm text-gray-400">Próximamente: órdenes de trabajo, facturas, movimientos</p>
        </template>
      </Card>
    </div>
  </div>
  <div v-else-if="loading" class="text-center py-8"><i class="pi pi-spin pi-spinner text-2xl text-gray-400" /></div>
  <Toast />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api/client'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const client = ref<any>(null)
const loading = ref(true)

const contactGroups = computed(() => {
  if (!client.value?.contact_details) return []
  const groups: Record<string, { type: string; icon: string; items: any[] }> = {
    phone: { type: 'phone', icon: 'pi pi-phone', items: [] },
    email: { type: 'email', icon: 'pi pi-envelope', items: [] },
    address: { type: 'address', icon: 'pi pi-map-marker', items: [] },
  }
  for (const cd of client.value.contact_details) {
    if (groups[cd.type]) groups[cd.type].items.push(cd)
  }
  return Object.values(groups).filter(g => g.items.length)
})

onMounted(async () => {
  try {
    const { data } = await api.get(`/clients/${route.params.id}`)
    client.value = data.data
  } catch { toast.add({ severity: 'error', summary: 'Error al cargar cliente' }) }
  finally { loading.value = false }
})
</script>

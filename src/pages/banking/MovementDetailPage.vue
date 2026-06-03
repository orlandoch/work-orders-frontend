<template>
  <div class="p-3">
    <div class="mb-3">
      <Button icon="pi pi-arrow-left" text label="Volver a Movimientos" @click="$router.push('/banking/movements')" />
    </div>

    <template v-if="loading">
      <Card><template #content><div class="text-center py-4"><i class="pi pi-spin pi-spinner" style="font-size:2rem" /></div></template></Card>
    </template>

    <template v-else-if="!movement">
      <Card><template #content><p class="text-center text-gray-500">Movimiento no encontrado</p></template></Card>
    </template>

    <template v-else>
      <!-- Encabezado -->
      <Card class="mb-3">
        <template #title>
          <div class="flex justify-content-between align-items-center">
            <span>Detalle del Movimiento #{{ movement.id }}</span>
            <div class="flex gap-2">
              <Button v-if="canReverse" label="Reversar" icon="pi pi-undo" severity="danger" size="small" @click="reverse" :loading="reversing" />
            </div>
          </div>
        </template>
        <template #content>
          <div class="grid">
            <div class="col-12 md:col-6">
              <div class="mb-2"><strong>Tipo:</strong> <StatusChip :value="movement.type" /></div>
              <div class="mb-2"><strong>Dirección:</strong> <StatusChip :value="movement.direction" /></div>
              <div class="mb-2"><strong>Monto:</strong> <span class="text-xl font-bold" :class="movement.direction === 'income' ? 'text-green-600' : 'text-red-600'">${{ Number(movement.amount).toFixed(2) }}</span></div>
              <div class="mb-2"><strong>Fecha:</strong> {{ movement.movement_date?.split(' ')[0] }}</div>
            </div>
            <div class="col-12 md:col-6">
              <div class="mb-2"><strong>Estado:</strong> <StatusChip :value="movement.status" /></div>
              <div class="mb-2"><strong>Descripción:</strong> {{ movement.description || '—' }}</div>
              <div class="mb-2"><strong>Referencia:</strong> {{ movement.reference || '—' }}</div>
              <div class="mb-2"><strong>Saldo antes:</strong> ${{ Number(movement.balance_before).toFixed(2) }} → <strong>${{ Number(movement.balance_after).toFixed(2) }}</strong></div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Cuenta Bancaria -->
      <Card class="mb-3">
        <template #title>Cuenta Bancaria</template>
        <template #content>
          <div class="grid">
            <div class="col-6"><strong>Nombre:</strong> {{ movement.bank_account?.name || '—' }}</div>
            <div class="col-6"><strong>Banco:</strong> {{ movement.bank_account?.bank_name || '—' }}</div>
            <div class="col-6"><strong>Número:</strong> {{ movement.bank_account?.account_number || '—' }}</div>
            <div class="col-6"><strong>Tipo:</strong> <StatusChip :value="movement.bank_account?.account_type" /></div>
          </div>
        </template>
      </Card>

      <!-- Asiento Contable -->
      <Card v-if="movement.journal_entry" class="mb-3">
        <template #title>Asiento Contable #{{ movement.journal_entry.id }}</template>
        <template #content>
          <DataTable :value="movement.journal_entry.lines || []" stripedRows :rows="10" emptyMessage="Sin líneas de asiento">
            <Column field="chart_of_account.code" header="Código" />
            <Column field="chart_of_account.name" header="Cuenta" />
            <Column field="debit" header="Débito">
              <template #body="{ data }">${{ Number(data.debit || 0).toFixed(2) }}</template>
            </Column>
            <Column field="credit" header="Crédito">
              <template #body="{ data }">${{ Number(data.credit || 0).toFixed(2) }}</template>
            </Column>
            <Column field="description" header="Descripción" />
          </DataTable>
        </template>
      </Card>

      <!-- Movimiento emparejado (transferencias) -->
      <Card v-if="movement.paired_movement" class="mb-3">
        <template #title>Movimiento Emparejado</template>
        <template #content>
          <div class="grid">
            <div class="col-4"><strong>ID:</strong> #{{ movement.paired_movement.id }}</div>
            <div class="col-4"><strong>Monto:</strong> ${{ Number(movement.paired_movement.amount).toFixed(2) }}</div>
            <div class="col-4"><strong>Dirección:</strong> <StatusChip :value="movement.paired_movement.direction" /></div>
          </div>
        </template>
      </Card>

      <!-- Reversos -->
      <Card v-if="movement.reverse_movements?.length" class="mb-3">
        <template #title>Movimientos de Reverso</template>
        <template #content>
          <div v-for="rev in movement.reverse_movements" :key="rev.id" class="mb-2">
            <i class="pi pi-undo text-orange-500 mr-2" />#{{ rev.id }} — ${{ Number(rev.amount).toFixed(2) }} — {{ rev.status }}
          </div>
        </template>
      </Card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getBankMovement, reverseBankMovement } from '@/api/bankingService'
import StatusChip from '@/components/StatusChip.vue'
import { useToast } from 'primevue/usetoast'
import Card from 'primevue/card'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const loading = ref(true)
const movement = ref<any>(null)
const reversing = ref(false)

const canReverse = computed(() => {
  if (!movement.value) return false
  return ['manual', 'income', 'expense'].includes(movement.value.type) && movement.value.status === 'posted'
})

async function load() {
  loading.value = true
  try {
    const id = route.params.id
    const res = await getBankMovement(Number(id))
    movement.value = res.data?.data || res.data
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el movimiento', life: 4000 })
  } finally {
    loading.value = false
  }
}

async function reverse() {
  if (!confirm('¿Está seguro de reversar este movimiento?')) return
  reversing.value = true
  try {
    await reverseBankMovement(movement.value.id)
    toast.add({ severity: 'success', summary: 'Movimiento reversado', life: 3000 })
    load()
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'Error al reversar', life: 4000 })
  } finally {
    reversing.value = false
  }
}

onMounted(load)
</script>

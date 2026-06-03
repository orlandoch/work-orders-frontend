import { ref, reactive } from 'vue'
import api from '@/api/client'
import { useToast } from 'primevue/usetoast'

export interface CancelReason {
  id: number
  name: string
  code?: string
}

/**
 * useStatusTransitions — dialog‑based status transitions for work orders
 *
 * Manages dialogs, forms, error state and API calls for
 * completing, cancelling and reopening work orders.
 */
export function useStatusTransitions() {
  const toast = useToast()

  // ── Dialog state ──────────────────────────────────────────────────
  const saving = ref(false)
  const completeDialog = ref(false)
  const cancelDialog = ref(false)
  const reopenDialog = ref(false)

  // ── Forms ──────────────────────────────────────────────────────────
  const completeForm = reactive({
    notes: '',
    confirmed: false,
  })
  const cancelForm = reactive({
    cancel_reason_id: null as number | null,
    notes: '',
  })
  const reopenForm = reactive({
    notes: '',
  })

  // ── Errors ─────────────────────────────────────────────────────────
  const completeError = ref('')
  const cancelError = ref('')

  // ── Data ───────────────────────────────────────────────────────────
  const cancelReasons = ref<CancelReason[]>([])

  // ── Load cancel reasons ────────────────────────────────────────────
  async function loadCancelReasons() {
    try {
      const { data } = await api.get('/cancel-reasons')
      cancelReasons.value = (data.data || data || [])
        .map((r: any) => ({
          id: r.id,
          name: r.name,
          code: r.code,
        }))
    } catch {
      cancelReasons.value = []
    }
  }

  // ── Completar (client WO) ──────────────────────────────────────────
  async function doComplete(orderId: number | string): Promise<boolean> {
    if (!completeForm.notes?.trim() || !completeForm.confirmed) return false
    saving.value = true
    completeError.value = ''
    try {
      await api.post(`/work-orders/${orderId}/complete`, {
        notes: completeForm.notes,
      })
      toast.add({ severity: 'success', summary: 'Orden completada', life: 4000 })
      completeDialog.value = false
      completeForm.notes = ''
      completeForm.confirmed = false
      return true
    } catch (e: any) {
      completeError.value = e?.response?.data?.message || e?.message || 'Error al completar'
      return false
    } finally {
      saving.value = false
    }
  }

  // ── Completar (production WO) ──────────────────────────────────────
  async function doCompleteProduction(orderId: number | string): Promise<boolean> {
    saving.value = true
    try {
      await api.post(`/work-orders/${orderId}/complete-production`)
      toast.add({ severity: 'success', summary: 'Producción completada', life: 4000 })
      return true
    } catch (e: any) {
      toast.add({
        severity: 'error',
        summary: 'Error al completar producción',
        detail: e?.response?.data?.message || e?.message || 'Error',
        life: 5000,
      })
      return false
    } finally {
      saving.value = false
    }
  }

  // ── Precarga BOM ───────────────────────────────────────────────────
  async function doPrecargaBom(orderId: number | string): Promise<boolean> {
    saving.value = true
    try {
      await api.post(`/work-orders/${orderId}/precarga-bom`)
      toast.add({ severity: 'success', summary: 'Materiales cargados desde BOM', life: 4000 })
      return true
    } catch (e: any) {
      toast.add({
        severity: 'error',
        summary: 'Error al cargar BOM',
        detail: e?.response?.data?.message || e?.message || 'Error',
        life: 5000,
      })
      return false
    } finally {
      saving.value = false
    }
  }

  // ── Cancelar ───────────────────────────────────────────────────────
  async function doCancel(orderId: number | string): Promise<boolean> {
    if (!cancelForm.cancel_reason_id || !cancelForm.notes?.trim()) return false
    saving.value = true
    cancelError.value = ''
    try {
      await api.post(`/work-orders/${orderId}/cancel`, {
        cancel_reason_id: cancelForm.cancel_reason_id,
        notes: cancelForm.notes,
      })
      toast.add({ severity: 'info', summary: 'Orden cancelada', life: 4000 })
      cancelDialog.value = false
      cancelForm.cancel_reason_id = null
      cancelForm.notes = ''
      return true
    } catch (e: any) {
      cancelError.value = e?.response?.data?.message || e?.message || 'Error al cancelar'
      return false
    } finally {
      saving.value = false
    }
  }

  // ── Reabrir ────────────────────────────────────────────────────────
  async function doReopen(orderId: number | string): Promise<boolean> {
    if (!reopenForm.notes?.trim()) return false
    saving.value = true
    try {
      await api.post(`/work-orders/${orderId}/reopen`, {
        notes: reopenForm.notes,
      })
      toast.add({ severity: 'warn', summary: 'Orden reabierta', life: 4000 })
      reopenDialog.value = false
      reopenForm.notes = ''
      return true
    } catch (e: any) {
      toast.add({
        severity: 'error',
        summary: 'Error al reabrir',
        detail: e?.response?.data?.message || e?.message || 'Error',
        life: 5000,
      })
      return false
    } finally {
      saving.value = false
    }
  }

  function reset() {
    saving.value = false
    completeDialog.value = false
    cancelDialog.value = false
    reopenDialog.value = false
    completeForm.notes = ''
    completeForm.confirmed = false
    cancelForm.cancel_reason_id = null
    cancelForm.notes = ''
    reopenForm.notes = ''
    completeError.value = ''
    cancelError.value = ''
  }

  return {
    saving,
    completeDialog,
    cancelDialog,
    reopenDialog,
    completeForm,
    cancelForm,
    reopenForm,
    completeError,
    cancelError,
    cancelReasons,
    loadCancelReasons,
    doComplete,
    doCompleteProduction,
    doPrecargaBom,
    doCancel,
    doReopen,
    reset,
  }
}

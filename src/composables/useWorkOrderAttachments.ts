import { ref } from 'vue'
import api from '@/api/client'
import { useToast } from 'primevue/usetoast'

/**
 * useWorkOrderAttachments — file upload/delete for a work order
 *
 * Accepts orderId as a getter, matching the inline template API.
 */
export function useWorkOrderAttachments(orderId: { value: string | number | undefined }, options: { onLoad: () => void }) {
  const toast = useToast()

  const uploading = ref(false)
  const fileInputRef = ref<HTMLInputElement | null>(null)

  async function onFileInput(e: Event) {
    const input = e.target as HTMLInputElement
    if (!input.files?.length) return
    uploading.value = true
    const formData = new FormData()
    formData.append('file', input.files[0])
    input.value = ''
    try {
      await api.post(`/work-orders/${orderId.value}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.add({ severity: 'success', summary: 'Archivo subido', life: 3000 })
      options.onLoad()
    } catch {
      toast.add({ severity: 'error', summary: 'Error al subir archivo', life: 5000 })
    } finally {
      uploading.value = false
    }
  }

  async function deleteAttachment(attachmentId: number) {
    if (!confirm('Eliminar este archivo?')) return
    try {
      await api.delete(`/work-orders/${orderId.value}/attachments/${attachmentId}`)
      toast.add({ severity: 'success', summary: 'Archivo eliminado', life: 3000 })
      options.onLoad()
    } catch {
      toast.add({ severity: 'error', summary: 'Error al eliminar archivo', life: 5000 })
    }
  }

  return {
    uploading,
    fileInputRef,
    onFileInput,
    deleteAttachment,
  }
}

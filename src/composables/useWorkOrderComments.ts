import { ref } from 'vue'
import api from '@/api/client'
import { useToast } from 'primevue/usetoast'

/**
 * useWorkOrderComments — comment management for work orders
 *
 * Accepts orderId as a getter (ref/computed) so template can call
 * addComment()/addReply() without passing the ID.
 */
export function useWorkOrderComments(orderId: { value: string | number | undefined }, options: { onLoad: () => void }) {
  const toast = useToast()

  const newComment = ref('')
  const replyingTo = ref<number | null>(null)
  const replyText = ref('')
  const savingComment = ref(false)

  function toggleReply(commentId: number) {
    replyingTo.value = replyingTo.value === commentId ? null : commentId
    replyText.value = ''
  }

  function cancelReply() {
    replyingTo.value = null
    replyText.value = ''
  }

  async function addComment() {
    if (!newComment.value.trim() || savingComment.value) return
    savingComment.value = true
    try {
      await api.post(`/work-orders/${orderId.value}/comments`, {
        body: newComment.value,
        parent_id: null,
      })
      newComment.value = ''
      toast.add({ severity: 'success', summary: 'Comentario añadido', life: 3000 })
      options.onLoad()
    } catch {
      toast.add({ severity: 'error', summary: 'Error al añadir comentario', life: 5000 })
    } finally {
      savingComment.value = false
    }
  }

  async function addReply(parentId: number) {
    if (!replyText.value.trim() || savingComment.value) return
    savingComment.value = true
    try {
      await api.post(`/work-orders/${orderId.value}/comments`, {
        body: replyText.value,
        parent_id: parentId,
      })
      replyText.value = ''
      replyingTo.value = null
      toast.add({ severity: 'success', summary: 'Respuesta añadida', life: 3000 })
      options.onLoad()
    } catch {
      toast.add({ severity: 'error', summary: 'Error al responder', life: 5000 })
    } finally {
      savingComment.value = false
    }
  }

  return {
    newComment,
    replyingTo,
    replyText,
    savingComment,
    toggleReply,
    cancelReply,
    addComment,
    addReply,
  }
}

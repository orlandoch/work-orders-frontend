import { ref } from 'vue'

export interface NewAttachment {
  id: number
  file: File
  name: string
  file_size: number
  mime_type: string
  url?: string
}

export interface ExistingAttachment {
  id: number
  name: string
  original_name?: string
  file_size?: number
  size?: number
  mime_type?: string
  url?: string
}

/**
 * useAttachments — generic multi‑file upload/download manager
 *
 * Designed for work‑order attachments: a list of new files to upload
 * and a list of existing attachments already on the server.
 */
export function useAttachments() {
  const existingAttachments = ref<ExistingAttachment[]>([])
  const newAttachments = ref<NewAttachment[]>([])
  const uploading = ref(false)

  function loadExistingAttachments(attachments: ExistingAttachment[]) {
    existingAttachments.value = (attachments || []).map(a => ({
      ...a,
      // Normalise snake_case / camelCase
      file_size: a.file_size ?? a.size,
      original_name: a.original_name ?? a.name,
    }))
  }

  function onFileChange(event: Event | { target: { files: FileList } }) {
    const target = 'target' in event ? event.target : event
    const files = (target as HTMLInputElement).files
    if (!files) return
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      newAttachments.value.push({
        id: Date.now() + i + Math.random(),
        file,
        name: file.name,
        file_size: file.size,
        mime_type: file.type,
      })
    }
    // Reset input so re‑selecting the same file fires change again
    if (target instanceof HTMLInputElement) {
      target.value = ''
    }
  }

  function removeNewAttachment(index: number) {
    if (index >= 0 && index < newAttachments.value.length) {
      newAttachments.value.splice(index, 1)
    }
  }

  function removeExistingAttachment(index: number) {
    if (index >= 0 && index < existingAttachments.value.length) {
      existingAttachments.value.splice(index, 1)
    }
  }

  function reset() {
    existingAttachments.value = []
    newAttachments.value = []
    uploading.value = false
  }

  function fileIcon(mimeType?: string): string {
    if (!mimeType) return 'pi pi-file'
    if (mimeType.startsWith('image/')) return 'pi pi-image'
    if (mimeType === 'application/pdf') return 'pi pi-file-pdf'
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'pi pi-file-excel'
    if (mimeType.includes('word') || mimeType.includes('document')) return 'pi pi-file-word'
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return 'pi pi-file-archive'
    return 'pi pi-file'
  }

  function formatSize(bytes?: number): string {
    if (bytes === undefined || bytes === null) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return {
    existingAttachments,
    newAttachments,
    uploading,
    loadExistingAttachments,
    onFileChange,
    removeNewAttachment,
    removeExistingAttachment,
    reset,
    fileIcon,
    formatSize,
  }
}

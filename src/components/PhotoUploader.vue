<template>
  <div>
    <!-- Existing photos grid -->
    <div v-if="photos.length > 0" class="grid mb-3">
      <div v-for="photo in photos" :key="photo.id" class="col-6 md:col-4 lg:col-3">
        <div class="relative border-round overflow-hidden surface-ground" style="aspect-ratio: 1">
          <img :src="photo.url" :alt="photo.original_name" class="w-full h-full object-cover" loading="lazy" />
          <Button
            icon="pi pi-trash"
            severity="danger"
            text
            rounded
            size="small"
            class="absolute top-1 right-1"
            :loading="deleting === photo.id"
            @click="remove(photo)"
            v-tooltip.top="'Eliminar'"
          />
          <span class="absolute bottom-0 left-0 right-0 text-xs text-white text-center bg-black-alpha-50 py-1 truncate">
            {{ photo.original_name }}
          </span>
        </div>
      </div>
    </div>

    <div v-else class="text-sm text-color-secondary font-italic py-2 mb-2">
      Sin fotos aún. Arrastre imágenes o use el selector.
    </div>

    <!-- Upload zone -->
    <div
      class="upload-zone border-2 border-dashed border-round p-4 text-center cursor-pointer transition-colors"
      :class="{ 'border-primary bg-primary-50': dragOver }"
      @dragover.prevent="dragOver = true"
      @dragleave.prevent="dragOver = false"
      @drop.prevent="onDrop"
      @click="fileInputRef?.click()"
    >
      <i class="pi pi-cloud-upload text-2xl text-color-secondary mb-2 block"></i>
      <p class="text-sm text-color-secondary">
        Arrastre imágenes aquí o <span class="text-primary font-semibold">seleccione archivos</span>
      </p>
      <p class="text-xs text-color-secondary mt-1">JPEG, PNG, WebP — máx. 5MB c/u — hasta 10 fotos</p>
      <input
        ref="fileInputRef"
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        class="hidden"
        @change="onFileInput"
      />
    </div>

    <!-- Uploading indicator -->
    <div v-if="uploading" class="flex align-items-center gap-2 mt-2">
      <ProgressSpinner style="width: 20px; height: 20px" strokeWidth="4" />
      <span class="text-sm text-color-secondary">Subiendo...</span>
    </div>

    <Message v-if="uploadError" severity="error" :closable="true" class="mt-2 text-sm" @close="uploadError = ''">
      {{ uploadError }}
    </Message>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import api from '@/api/client'
import Button from 'primevue/button'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'

const props = defineProps<{
  modelType: string   // 'product', 'work-order', etc.
  modelId: number | null
}>()

const photos = ref<any[]>([])
const uploading = ref(false)
const uploadError = ref('')
const deleting = ref<number | null>(null)
const dragOver = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

/** Cargar fotos cuando cambie el modelId */
watch(() => props.modelId, async (id) => {
  if (!id) { photos.value = []; return }
  try {
    const { data } = await api.get(`/photos/${props.modelType}/${id}`)
    photos.value = data.data || []
  } catch { /* ignore */ }
}, { immediate: true })

async function uploadFiles(files: FileList | File[]) {
  if (!props.modelId || files.length === 0) return

  uploadError.value = ''
  uploading.value = true
  dragOver.value = false

  const formData = new FormData()
  for (const file of Array.from(files).slice(0, 10)) {
    formData.append('photos[]', file)
  }

  try {
    const { data } = await api.post(`/photos/${props.modelType}/${props.modelId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    photos.value.push(...(data.data || []))
  } catch (e: any) {
    uploadError.value = e?.response?.data?.message || 'Error al subir foto(s)'
  } finally {
    uploading.value = false
    // Reset file input so the same file can be selected again
    if (fileInputRef.value) fileInputRef.value.value = ''
  }
}

function onDrop(e: DragEvent) {
  dragOver.value = false
  if (e.dataTransfer?.files) uploadFiles(e.dataTransfer.files)
}

function onFileInput(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files) uploadFiles(input.files)
}

async function remove(photo: any) {
  deleting.value = photo.id
  try {
    await api.delete(`/photos/${photo.id}`)
    photos.value = photos.value.filter((p: any) => p.id !== photo.id)
  } catch (e: any) {
    uploadError.value = e?.response?.data?.message || 'Error al eliminar foto'
  } finally {
    deleting.value = null
  }
}
</script>

<style scoped>
.upload-zone {
  transition: background-color 0.2s, border-color 0.2s;
}
.upload-zone:hover {
  border-color: var(--p-primary-color);
  background-color: var(--p-primary-50);
}
</style>

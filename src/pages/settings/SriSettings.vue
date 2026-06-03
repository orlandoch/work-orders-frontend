<template>
  <Card>
    <template #title>
      <div class="flex items-center gap-2">
        <i class="pi pi-file-export text-indigo-500" />
        <span>Facturación Electrónica SRI</span>
      </div>
    </template>
    <template #content>
      <div class="space-y-6">
        <!-- Environment selector -->
        <div class="flex items-center gap-4">
          <label class="text-sm font-medium whitespace-nowrap">Ambiente</label>
          <Select
            v-model="config.environment"
            :options="envOptions"
            optionLabel="label"
            optionValue="value"
            class="w-48"
            size="small"
            @change="updateConfig"
          />
          <Tag
            :value="config.environment === 'production' ? 'Producción' : 'Pruebas'"
            :severity="config.environment === 'production' ? 'success' : 'warn'"
            class="text-xs"
          />
        </div>

        <!-- Certificate section -->
        <div class="border rounded-lg p-4 space-y-3">
          <h3 class="font-semibold text-sm flex items-center gap-2">
            <i class="pi pi-lock" />
            Firma Electrónica
            <Tag
              v-if="issuer?.has_certificate"
              value="Subida"
              severity="success"
              class="text-xs"
            />
            <Tag v-else value="Faltante" severity="danger" class="text-xs" />
            <small v-if="issuer?.certificate_filename" class="text-gray-400 text-xs ml-1">
              ({{ issuer.certificate_filename }})
            </small>
          </h3>

          <!-- Certificate error message -->
          <Message v-if="certError" severity="warn" class="text-sm">{{ certError }}</Message>

          <!-- Certificate details (only when parsed successfully) -->
          <template v-if="certInfo?.validity">
            <div class="border border-green-200 bg-green-50 rounded-lg p-3 space-y-3">
              <!-- Validity banner -->
              <div class="flex items-center gap-2 text-sm rounded px-3 py-2" :class="expiryBg">
                <i :class="expiryIconCss" />
                <span>
                  <strong>Validez:</strong>
                  {{ certInfo.validity.not_before }} → {{ certInfo.validity.not_after }}
                  <span v-if="certInfo.validity.days_remaining !== null" class="ml-1 font-semibold">
                    {{ certInfo.validity.days_remaining > 0
                      ? `(faltan ${certInfo.validity.days_remaining} días)`
                      : '(VENCIDO)' }}
                  </span>
                </span>
              </div>

              <!-- Subject -->
              <div class="text-xs space-y-1">
                <div v-if="certInfo.subject?.O"><strong>Titular:</strong> {{ certInfo.subject.O }}</div>
                <div v-if="certInfo.subject?.CN"><strong>CN:</strong> {{ certInfo.subject.CN }}</div>
                <div v-if="certInfo.subject?.UID || certInfo.subject?.serialNumber">
                  <strong>RUC:</strong> {{ certInfo.subject.UID || certInfo.subject.serialNumber }}
                </div>
                <div v-if="certInfo.subject?.L"><strong>Ubicación:</strong> {{ certInfo.subject.L }}</div>
              </div>

              <!-- Issuer -->
              <div class="text-xs space-y-1">
                <div class="font-semibold text-gray-600 border-b pb-1 mb-1">Emitido por</div>
                <div v-if="certInfo.issuer?.O"><strong>Organización:</strong> {{ certInfo.issuer.O }}</div>
                <div v-if="certInfo.issuer?.CN"><strong>CN:</strong> {{ certInfo.issuer.CN }}</div>
              </div>

              <!-- Technical details -->
              <div class="text-xs space-y-1">
                <div class="font-semibold text-gray-600 border-b pb-1 mb-1">Detalles técnicos</div>
                <div><strong>Serial:</strong> {{ certInfo.certificate?.serial }}</div>
                <div v-if="certInfo.certificate?.signature_algorithm">
                  <strong>Algoritmo firma:</strong> {{ certInfo.certificate.signature_algorithm }}
                </div>
                <div v-if="certInfo.certificate?.public_key_algorithm">
                  <strong>Algoritmo llave:</strong> {{ certInfo.certificate.public_key_algorithm }}
                </div>
                <div v-if="certInfo.certificate?.key_size">
                  <strong>Tamaño llave:</strong> {{ certInfo.certificate.key_size }}
                </div>
              </div>
            </div>
          </template>

          <!-- Upload form -->
          <div class="flex items-center gap-3">
            <FileUpload
              mode="basic"
              accept=".p12,.pfx"
              :maxFileSize="5242880"
              chooseLabel="Seleccionar archivo .p12"
              @select="onFileSelect"
              class="w-auto"
            />
            <small v-if="selectedFile" class="text-gray-400">{{ selectedFile.name }}</small>
          </div>
          <div class="flex items-center gap-3">
            <InputPassword
              v-model="certPassword"
              placeholder="Contraseña del certificado"
              :feedback="false"
              class="w-64"
              size="small"
            />
            <Button
              label="Subir Firma"
              icon="pi pi-upload"
              size="small"
              :disabled="!selectedFile || !certPassword || uploading"
              :loading="uploading"
              @click="uploadCert"
            />
          </div>

          <Message v-if="uploadMsg" :severity="uploadMsgType" class="text-sm">{{ uploadMsg }}</Message>
        </div>

        <!-- SRI URLs -->
        <div v-if="sriUrls" class="border rounded-lg p-4 space-y-2">
          <h3 class="font-semibold text-sm flex items-center gap-2">
            <i class="pi pi-globe" />
            URLs del SRI
          </h3>
          <div class="grid grid-cols-1 gap-2 text-xs font-mono bg-gray-100 rounded p-3">
            <div>
              <label class="text-gray-500 font-semibold block">Recepción (Pruebas)</label>
              <code class="break-all">{{ sriUrls.reception_testing }}</code>
            </div>
            <div>
              <label class="text-gray-500 font-semibold block">Autorización (Pruebas)</label>
              <code class="break-all">{{ sriUrls.authorization_testing }}</code>
            </div>
            <div>
              <label class="text-gray-500 font-semibold block">Recepción (Producción)</label>
              <code class="break-all">{{ sriUrls.reception_production }}</code>
            </div>
            <div>
              <label class="text-gray-500 font-semibold block">Autorización (Producción)</label>
              <code class="break-all">{{ sriUrls.authorization_production }}</code>
            </div>
          </div>
          <p class="text-xs text-gray-400 mt-2">
            Las URLs están definidas en el código. Si el SRI las cambia, se actualizarán
            en la siguiente versión.
          </p>
        </div>
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Card from 'primevue/card'
import InputPassword from 'primevue/password'
import Select from 'primevue/select'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import FileUpload from 'primevue/fileupload'
import { electronicIssuerApi, type ElectronicIssuer, type SriUrls, type CertificateInfo } from '@/api/electronicIssuer'

const issuer = ref<ElectronicIssuer | null>(null)
const config = ref({ environment: 'testing' as 'testing' | 'production' })
const sriUrls = ref<SriUrls | null>(null)
const certInfo = ref<CertificateInfo | null>(null)
const certError = ref('')

const selectedFile = ref<File | null>(null)
const certPassword = ref('')
const uploading = ref(false)
const uploadMsg = ref('')
const uploadMsgType = ref<'success' | 'error' | 'warn'>('success')

const envOptions = [
  { label: 'Pruebas', value: 'testing' },
  { label: 'Producción', value: 'production' },
]

const daysRemaining = computed(() => certInfo.value?.validity?.days_remaining ?? null)

const expiryBg = computed(() => {
  const d = daysRemaining.value
  if (d === null) return ''
  if (d <= 0) return 'bg-red-100 text-red-700'
  if (d <= 30) return 'bg-yellow-100 text-yellow-700'
  return 'bg-green-100 text-green-700'
})

const expiryIconCss = computed(() => {
  const d = daysRemaining.value
  if (d === null) return ''
  if (d <= 0) return 'pi pi-exclamation-triangle'
  if (d <= 30) return 'pi pi-clock'
  return 'pi pi-check-circle'
})

function onFileSelect(event: { files: File[] }) {
  selectedFile.value = event.files[0] ?? null
  uploadMsg.value = ''
}

async function uploadCert() {
  if (!selectedFile.value || !certPassword.value) return
  uploading.value = true
  uploadMsg.value = ''
  try {
    await electronicIssuerApi.uploadCertificate(selectedFile.value, certPassword.value)
    uploadMsg.value = 'Certificado subido correctamente'
    uploadMsgType.value = 'success'
    selectedFile.value = null
    certPassword.value = ''
    await load()
  } catch (e: any) {
    const msg = e?.response?.data?.message ?? 'Error al subir el certificado'
    uploadMsg.value = msg
    uploadMsgType.value = 'error'
  } finally {
    uploading.value = false
  }
}

async function updateConfig() {
  try {
    await electronicIssuerApi.update({ environment: config.value.environment })
    await load()
  } catch {}
}

async function load() {
  // Load issuer
  try {
    const res = await electronicIssuerApi.get()
    issuer.value = res.data
    config.value.environment = res.data?.environment ?? 'testing'
  } catch {
    issuer.value = null
  }

  // Load certificate info
  certError.value = ''
  certInfo.value = null
  try {
    const res = await electronicIssuerApi.getCertificateInfo()
    if (res.data?.error) {
      certError.value = res.data.error
    } else if (res.data?.validity) {
      certInfo.value = res.data
    }
    // If neither error nor validity, certInfo stays null (no cert)
  } catch {
    certInfo.value = null
  }

  // Load SRI URLs
  try {
    const res = await electronicIssuerApi.getSriUrls()
    sriUrls.value = res.data
  } catch {}
}

onMounted(load)
</script>
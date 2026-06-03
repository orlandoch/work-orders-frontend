import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import api from '@/api'
import type { Iva } from '@/api/types'

export interface SriLogEntry {
  id: number
  action: string
  status: string
  message?: string
  request_payload?: string
  response_payload?: string
  context?: string
  created_at: string
}

export interface SriInvoiceData {
  id: number
  sri_status?: string
  sequential?: number
  access_key?: string
  electronic_document?: {
    id: number
    internal_status: string
    sri_status: string
    access_key: string
    ride_path?: string
    xml_signed_path?: string
    xml_generated_path?: string
    last_error?: string
  }
}

/**
 * Operaciones SRI sobre una factura (emitir, reintentar, RIDE, logs, copiar).
 * Todas las funciones leen invoice.value internamente — sin argumentos.
 */
export function useSriDetail(invoice: { value: SriInvoiceData | null }) {
  const toast = useToast()
  const emitInProgress = ref(false)
  const retrying = ref(false)
  const sriLogs = ref<SriLogEntry[]>([])
  const showSriLogs = ref(false)
  const loadingLogs = ref(false)
  const lastLogUpdate = ref(Date.now())
  const logDialogVisible = ref(false)
  const logDialogData = ref<SriLogEntry | null>(null)
  const logDialogPayload = ref<string | null>(null)
  const ivas = ref<Iva[]>([])

  function formatAction(action: string): string {
    const map: Record<string, string> = {
      signxml: 'Firma XML',
      send_reception: 'Envío a Recepción',
      send_authorization: 'Envío a Autorización',
      ride: 'RIDE PDF',
      load_certificate: 'Carga de Certificado',
      generate_access_key: 'Generar Clave de Acceso',
      generate_xml: 'Generar XML',
    }
    return map[action] || action
  }

  function logSeverity(status: string): 'success' | 'warn' | 'error' | 'info' {
    if (status === 'success') return 'success'
    if (status === 'error' || status === 'failed') return 'error'
    if (status === 'warning') return 'warn'
    return 'info'
  }

  function formatDateTime(iso: string): string {
    if (!iso) return '-'
    return new Date(iso).toLocaleDateString('es-EC', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
  }

  function formatXml(xml: string | null | undefined): string {
    if (!xml) return ''
    try {
      if (xml.startsWith('<')) {
        const doc = new DOMParser().parseFromString(xml, 'text/xml')
        const xsltStr = `<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
          <xsl:strip-space elements="*"/><xsl:output indent="yes"/>
          <xsl:template match="node()|@*"><xsl:copy><xsl:apply-templates select="node()|@*"/></xsl:copy></xsl:template>
        </xsl:stylesheet>`
        const xsltDoc = new DOMParser().parseFromString(xsltStr, 'text/xml')
        const proc = new XSLTProcessor()
        proc.importStylesheet(xsltDoc)
        return new XMLSerializer().serializeToString(proc.transformToDocument(doc).documentElement!)
      }
      return xml.startsWith('{') ? JSON.stringify(JSON.parse(xml), null, 2) : xml
    } catch { return xml }
  }

  async function emitElectronicInvoice(): Promise<void> {
    const invId = invoice.value?.id
    if (!invId) return
    emitInProgress.value = true
    try {
      const res = await api.post(`/invoices/${invId}/emit`, { send_to_sri: true })
      if (res.data.success && res.data.data?.status !== 'error') {
        toast.add({ severity: 'success', summary: 'SRI procesado', detail: `Access key: ${res.data.data?.access_key || 'N/A'}`, life: 5000 })
      } else {
        toast.add({ severity: 'error', summary: 'Error SRI', detail: res.data.message || 'Error desconocido', life: 8000 })
      }
    } catch (e: any) {
      toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || e.message, life: 5000 })
    } finally { emitInProgress.value = false }
  }

  async function retrySri(): Promise<void> {
    const invId = invoice.value?.id
    if (!invId) return
    retrying.value = true
    try {
      const res = await api.post(`/invoices/${invId}/retry-sri`)
      if (res.data.success) {
        toast.add({ severity: 'success', summary: 'Reintento SRI', detail: 'Envío reprocesado', life: 4000 })
      } else {
        toast.add({ severity: 'error', summary: 'Error', detail: res.data.message || 'Error desconocido', life: 5000 })
      }
    } catch (e: any) {
      toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || e.message, life: 5000 })
    } finally { retrying.value = false }
  }

  async function downloadRide(): Promise<void> {
    const invId = invoice.value?.id
    if (!invId) return
    try {
      const res = await api.get(`/invoices/${invId}/ride`)
      if (res.data.success && res.data.url) {
        window.open(res.data.url, '_blank')
      } else {
        toast.add({ severity: 'warn', summary: 'RIDE no disponible', detail: res.data.message || '', life: 4000 })
      }
    } catch (e: any) {
      toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || e.message, life: 5000 })
    }
  }

  async function loadSriLogs(): Promise<void> {
    const edId = invoice.value?.electronic_document?.id
    if (!edId) return
    loadingLogs.value = true
    try {
      const res = await api.get(`/electronic-documents/${edId}/logs`)
      sriLogs.value = res.data?.data ?? res.data ?? []
    } catch { /* silent */ }
    finally { loadingLogs.value = false; lastLogUpdate.value = Date.now() }
  }

  function openLogDetail(log: SriLogEntry): void {
    logDialogData.value = log
    logDialogPayload.value = log.response_payload || log.request_payload || null
    logDialogVisible.value = true
  }

  async function copyAccessKey(): Promise<void> {
    const ak = invoice.value?.electronic_document?.access_key
    if (!ak) return
    try {
      await navigator.clipboard.writeText(ak)
      toast.add({ severity: 'success', summary: 'Copiado', detail: 'Clave de acceso copiada', life: 2000 })
    } catch {
      toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo copiar', life: 3000 })
    }
  }

  async function copySriResponse(): Promise<void> {
    const ed = invoice.value?.electronic_document
    const payload = ed?.xml_signed_path || ed?.xml_generated_path || ed?.last_error
    if (!payload) return
    try {
      await navigator.clipboard.writeText(formatXml(payload))
      toast.add({ severity: 'success', summary: 'Copiado', detail: 'Respuesta SRI copiada', life: 2000 })
    } catch {
      toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo copiar', life: 3000 })
    }
  }

  return {
    emitInProgress, retrying, sriLogs, showSriLogs, loadingLogs,
    lastLogUpdate, logDialogVisible, logDialogData, logDialogPayload, ivas,
    formatAction, logSeverity, formatDateTime, formatXml,
    emitElectronicInvoice, retrySri, downloadRide,
    loadSriLogs, openLogDetail, copyAccessKey, copySriResponse,
  }
}

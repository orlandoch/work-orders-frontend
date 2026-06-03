import { ref, computed } from 'vue'
import api from '@/api'

export interface ContactInfo {
  phone?: string
  email?: string
  address?: string
  document_type?: string
  document_number?: string
}

export function useClientSearch() {
  const clientSearch = ref('')
  const clientResults = ref<any[]>([])
  const selectedClientDetail = ref<any>(null)
  const clientLoading = ref(false)

  const contactInfo = computed<ContactInfo>(() => {
    const c = selectedClientDetail.value
    if (!c) return {}
    // Prefer structured contact_details array if available
    if (Array.isArray(c.contact_details) && c.contact_details.length > 0) {
      const cd = c.contact_details
      return {
        phone: cd.find((d: any) => d.type === 'phone')?.value ?? cd.find((d: any) => d.type === 'mobile')?.value ?? c.phone ?? '',
        email: cd.find((d: any) => d.type === 'email')?.value ?? c.email ?? '',
        address: cd.find((d: any) => d.type === 'address')?.value ?? c.address ?? '',
        document_type: c.document_type ?? c.doc_type ?? '',
        document_number: c.document_number ?? c.doc_number ?? '',
      }
    }
    // Fallback to flat fields
    return {
      phone: c.phone ?? c.main_phone ?? c.contact_phone,
      email: c.email ?? c.main_email,
      address: c.address ?? c.main_address,
      document_type: c.document_type ?? c.doc_type ?? '',
      document_number: c.document_number ?? c.doc_number ?? '',
    }
  })

  async function searchClients(e: { query: string }) {
    if (!e.query?.trim()) {
      clientResults.value = []
      return
    }
    clientLoading.value = true
    try {
      const { data } = await api.get(`/clients/search?q=${encodeURIComponent(e.query)}`)
      clientResults.value = (data.data || []).map((c: any) => ({
        id: c.id,
        label: `${c.full_name} [${c.document_number || '—'}]`,
        doc: c.document_number,
        document_type: c.document_type ?? '',
        document_number: c.document_number ?? '',
        ruc: c.document_type === 'ruc' || c.document_type === 'RUC' ? c.document_number : '',
      }))
    } catch {
      clientResults.value = []
    } finally {
      clientLoading.value = false
    }
  }

  async function selectClient(e: any) {
    const selected = e.value
    const clientId = selected?.value ?? selected?.id
    if (!clientId) return
    try {
      const { data } = await api.get(`/clients/${clientId}?include=contactDetails`)
      selectedClientDetail.value = data.data ?? data
    } catch {
      selectedClientDetail.value = null
    }
  }

  function clearClient() {
    clientSearch.value = ''
    selectedClientDetail.value = null
    clientResults.value = []
  }

  async function loadClientDetail(clientId: number) {
    if (!clientId) return
    try {
      const { data } = await api.get(`/clients/${clientId}?include=contactDetails`)
      selectedClientDetail.value = data.data ?? data
      clientSearch.value = selectedClientDetail.value?.full_name ?? ''
    } catch {
      // silently fail
    }
  }

  return {
    clientSearch,
    clientResults,
    selectedClientDetail,
    contactInfo,
    clientLoading,
    searchClients,
    selectClient,
    clearClient,
    loadClientDetail,
  }
}

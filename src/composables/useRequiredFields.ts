import { ref } from 'vue'
import { fetchSettings } from '@/api/settings'

export async function fetchRequiredFields() {
  const result = { requiredClientFields: ref<string[]>([]), requiredProductFields: ref<string[]>([]) }
  try {
    const data = await fetchSettings()
    for (const group of Object.keys(data)) {
      const entries = data[group]
      for (const entry of entries) {
        if (entry.key === 'validation.required_client_fields') {
          try { result.requiredClientFields.value = JSON.parse(entry.value) } catch { result.requiredClientFields.value = [] }
        }
        if (entry.key === 'validation.required_product_fields') {
          try { result.requiredProductFields.value = JSON.parse(entry.value) } catch { result.requiredProductFields.value = [] }
        }
      }
    }
  } catch {}
  return result
}

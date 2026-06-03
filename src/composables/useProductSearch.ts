import { ref } from 'vue'
import api from '@/api'

export interface ProductSuggestion {
  id: number
  label: string
  type: string
  cost: number
}

export function useProductSearch() {
  const productSearch = ref<ProductSuggestion | string>('')
  const productResults = ref<ProductSuggestion[]>([])
  const productLoading = ref(false)

  async function searchProducts(e: { query: string }) {
    if (!e.query?.trim()) {
      productResults.value = []
      return
    }
    productLoading.value = true
    try {
      const { data } = await api.get(`/products?search=${encodeURIComponent(e.query)}`)
      productResults.value = (data.data?.data || []).map((p: any) => ({
        id: p.id,
        label: p.name,
        type: p.type,
        cost: p.cost_price || 0,
      }))
    } catch {
      productResults.value = []
    } finally {
      productLoading.value = false
    }
  }

  function clearProduct() {
    productSearch.value = ''
    productResults.value = []
  }

  return {
    productSearch,
    productResults,
    productLoading,
    searchProducts,
    clearProduct,
  }
}

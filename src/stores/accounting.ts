import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getAllAccounts, type ChartOfAccount } from '@/api/chartOfAccounts'

export const useAccountingStore = defineStore('accounting', () => {
  const accounts = ref<ChartOfAccount[]>([])
  const loading = ref(false)

  async function fetchAccounts() {
    loading.value = true
    try {
      const res = await getAllAccounts()
      accounts.value = res.data
    } finally {
      loading.value = false
    }
  }

  const accountsByType = computed(() => {
    const map: Record<string, ChartOfAccount[]> = {}
    for (const acc of accounts.value) {
      if (!map[acc.type]) map[acc.type] = []
      map[acc.type].push(acc)
    }
    return map
  })

  function accountLabel(acc: ChartOfAccount): string {
    return `${acc.code} - ${acc.name}`
  }

  return { accounts, loading, fetchAccounts, accountsByType, accountLabel }
})

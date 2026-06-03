import { ref, computed } from 'vue'
import api from '@/api'

export function useMembers() {
  const members = ref<any[]>([])
  const userSearchQuery = ref('')
  const userResults = ref<any[]>([])
  const usersCache = ref<any[]>([])

  // Multi‑select mode support
  const memberMode = ref<'autocomplete' | 'select'>('autocomplete')
  const allUsers = ref<any[]>([])
  const selectedUserIds = ref<number[]>([])

  const teamNames = computed(() =>
    members.value.filter(m => m.is_leader).length > 0
      ? members.value.filter(m => m.is_leader).map(m => m.user_name).join(', ')
      : members.value.map(m => m.user_name).join(', ') || '—'
  )

  async function searchUsers(e: { query: string }) {
    if (!e.query?.trim()) {
      userResults.value = usersCache.value
      return
    }
    try {
      const { data } = await api.get(`/users/search?q=${encodeURIComponent(e.query)}`)
      userResults.value = (Array.isArray(data) ? data : data.data || [])
        .filter((u: any) => !members.value.some(m => m.user_id === u.id))
      usersCache.value = userResults.value
    } catch {
      userResults.value = []
    }
  }

  function addMember(user: any) {
    if (!user?.id) return
    if (members.value.some(m => m.user_id === user.id)) return
    members.value.push({
      id: 0,
      user_id: user.id,
      user_name: user.label || user.name || user.full_name || user.user_name || '',
      is_leader: members.value.length === 0,
    })
  }

  function removeMember(index: number) {
    if (index >= 0 && index < members.value.length) {
      members.value.splice(index, 1)
    }
  }

  function toggleLeader(index: number) {
    if (index >= 0 && index < members.value.length) {
      members.value[index].is_leader = !members.value[index].is_leader
    }
  }

  function loadAllUsers() {
    api.get('/users').then(({ data }) => {
      allUsers.value = Array.isArray(data) ? data : data.data || []
    })
  }

  function syncMultiSelectMembers(selected: any[]) {
    // Remove members whose user_ids are NOT in the selected list
    const keepIds = new Set(selected.map((s: any) => s.id ?? s.user_id))
    members.value = members.value.filter(m => keepIds.has(m.user_id))
    // Add new members that are in selected but not yet in members
    for (const s of selected) {
      const uid = s.id ?? s.user_id
      if (!members.value.some(m => m.user_id === uid)) {
        addMember(s)
      }
    }
  }

  function loadMembersFromOrder(orderMembers: any[]) {
    members.value = (orderMembers || []).map((m: any) => ({
      id: m.id ?? 0,
      user_id: m.user_id ?? m.user?.id,
      user_name: m.user_name ?? m.user?.name ?? m.user?.full_name ?? '',
      is_leader: !!m.is_leader,
    }))
    selectedUserIds.value = members.value.map(m => m.user_id)
  }

  function userName(userId: number): string {
    return members.value.find(m => m.user_id === userId)?.user_name ?? ''
  }

  function reset() {
    members.value = []
    userSearchQuery.value = ''
    userResults.value = []
    usersCache.value = []
    allUsers.value = []
    selectedUserIds.value = []
    memberMode.value = 'autocomplete'
  }

  return {
    members,
    userSearchQuery,
    userResults,
    usersCache,
    memberMode,
    allUsers,
    selectedUserIds,
    teamNames,
    searchUsers,
    addMember,
    removeMember,
    toggleLeader,
    loadAllUsers,
    syncMultiSelectMembers,
    loadMembersFromOrder,
    userName,
    reset,
  }
}

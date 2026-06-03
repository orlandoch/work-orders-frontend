<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api, { storeAuth } from '@/api/client'

const router = useRouter()

// On app boot, refresh user data + permissions if token exists
onMounted(async () => {
  const token = localStorage.getItem('token')
  if (!token) return

  // Don't refetch on every page load — only if permissions are missing
  const perms = localStorage.getItem('permissions')
  if (perms && perms !== '[]') return

  try {
    const { data } = await api.get('/me')
    if (data.success && data.data) {
      // Check if the response has the new structure (all_permissions nested) or old
      let userData = data.data
      let userToken = token
      if (data.data.user) {
        userData = data.data.user
        userToken = data.data.token || token
      }
      storeAuth(userData, userToken)
    }
  } catch {
    // If unauthenticated, clear and redirect
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('permissions')
    if (router.currentRoute.value.path !== '/login') {
      router.push('/login')
    }
  }
})
</script>

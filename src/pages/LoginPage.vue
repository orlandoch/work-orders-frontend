<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <i class="pi pi-wrench" style="font-size: 2.5rem; color: #6366f1;"></i>
        <h1>WorkOrders</h1>
        <p>Inicia sesión para continuar</p>
      </div>
      <form @submit.prevent="handleLogin">
        <div class="field">
          <label for="email">Correo electrónico</label>
          <InputText id="email" v-model="email" type="email" class="w-full" placeholder="admin@wom.test" />
        </div>
        <div class="field">
          <label for="password">Contraseña</label>
          <Password id="password" v-model="password" :feedback="false" class="w-full" placeholder="••••••••" toggleMask />
        </div>
        <Button type="submit" label="Ingresar" icon="pi pi-sign-in" class="w-full" :loading="loading" />
      </form>
      <Message v-if="error" severity="error" :closable="false" class="mt-3">{{ error }}</Message>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'
import api, { storeAuth } from '@/api/client'

const router = useRouter()
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.post('/login', { email: email.value, password: password.value })
    storeAuth(data.data.user, data.data.token)
    router.push('/')
  } catch (e: any) {
    error.value = e.response?.data?.errors?.email?.[0] || 'Error al iniciar sesión'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.login-card {
  background: white;
  padding: 2.5rem;
  border-radius: 1rem;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
  width: 100%;
  max-width: 420px;
}
.login-header {
  text-align: center;
  margin-bottom: 2rem;
}
.login-header h1 {
  margin: 0.5rem 0 0.25rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
}
.login-header p {
  color: #64748b;
  font-size: 0.875rem;
}
.field {
  margin-bottom: 1.25rem;
}
.field label {
  display: block;
  margin-bottom: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #475569;
}
.field :deep(.p-password) {
  width: 100%;
}
</style>

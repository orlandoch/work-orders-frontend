import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  // Let Axios set Content-Type automatically for FormData (multipart/form-data)
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }
  return config
})

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('permissions')
      window.location.href = '/#/login'
    }
    return Promise.reject(error)
  }
)

export function storeAuth(user: any, token: string) {
  localStorage.setItem('token', token)
  localStorage.setItem('user', JSON.stringify(user))

  // Extract all_permissions if present, or from roles
  let perms: string[] = user.all_permissions || []
  if (!perms.length && user.roles) {
    const permSet = new Set<string>()
    user.roles.forEach((r: any) => {
      if (r.permissions) r.permissions.forEach((p: any) => permSet.add(p.name || p))
    })
    perms = Array.from(permSet)
  }
  localStorage.setItem('permissions', JSON.stringify(perms))
}

export function hasPermission(name: string): boolean {
  const raw = localStorage.getItem('permissions')
  if (!raw) return false
  try {
    const perms: string[] = JSON.parse(raw)
    return perms.includes(name)
  } catch {
    return false
  }
}

export function hasAnyPermission(names: string[]): boolean {
  return names.some(n => hasPermission(n))
}

export function hasAllPermissions(names: string[]): boolean {
  return names.every(n => hasPermission(n))
}

export default api

export function getInvoiceSriLogs(invoiceId: number) {
  return api.get(`/invoices/${invoiceId}/sri-logs`)
}

export function retryInvoiceSri(invoiceId: number) {
  return api.post(`/invoices/${invoiceId}/retry-sri`)
}

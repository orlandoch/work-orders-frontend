import axios from 'axios'

const http = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api', headers: { Accept: 'application/json' } })

http.interceptors.request.use(c => {
  const token = localStorage.getItem('token')
  if (token) c.headers.Authorization = `Bearer ${token}`
  return c
})

export default {
  get(url: string) { return http.get(url) },
  post(url: string, data?: any) { return http.post(url, data) },
  put(url: string, data?: any) { return http.put(url, data) },
  delete(url: string) { return http.delete(url) },
}

export { http }

export function getInvoiceSriLogs(invoiceId: number) {
  return http.get(`/invoices/${invoiceId}/sri-logs`)
}

export function retryInvoiceSri(invoiceId: number) {
  return http.post(`/invoices/${invoiceId}/retry-sri`)
}

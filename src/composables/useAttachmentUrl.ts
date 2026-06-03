import api from '@/api/client'

export async function downloadAttachment(woId: number, attId: number, filename?: string): Promise<void> {
  try {
    const resp = await api.get(`/work-orders/${woId}/attachments/${attId}/download`, {
      responseType: 'blob',
    })
    const blob = resp.data
    const name = filename || `attachment-${attId}`
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    console.error('Download failed', e)
  }
}

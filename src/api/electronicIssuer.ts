import api from './client'

export interface ElectronicIssuer {
  id: number
  ruc: string
  environment: 'testing' | 'production'
  certificate_path: string | null
  certificate_filename: string | null
  certificate_expires_at: string | null
  has_certificate: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SriUrls {
  reception_testing: string
  authorization_testing: string
  reception_production: string
  authorization_production: string
}

export interface CertificateInfo {
  certificate?: {
    serial: string
    subject: string
    issuer: string
    signature_algorithm?: string
    public_key_algorithm?: string
    key_size?: string
  }
  validity?: {
    not_before: string
    not_after: string
    days_remaining: number | null
    expired: boolean
  }
  subject?: Record<string, string>
  issuer?: Record<string, string>
  /** Error message when cert can't be read */
  error?: string
}

export const electronicIssuerApi = {
  get() {
    return api.get<ElectronicIssuer>('/electronic-issuers')
  },

  update(data: { environment?: string; certificate_password?: string }) {
    return api.put<ElectronicIssuer>('/electronic-issuers', data)
  },

  uploadCertificate(file: File, password: string) {
    const form = new FormData()
    form.append('certificate', file)
    form.append('certificate_password', password)
    return api.post('/electronic-issuers/upload-certificate', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  async getCertificateInfo() {
    return api.get<CertificateInfo>('/electronic-issuers/certificate-info')
  },

  async getSriUrls() {
    return api.get<SriUrls>('/sri/urls')
  },
}

/**
 * Helper para parsear errores de API y extraer mensajes legibles.
 *
 * Soporta:
 * - Errores de validación 422 (errores por campo)
 * - Errores genéricos con mensaje (message / error / errors)
 * - Fallback genérico
 */

export interface ParsedApiError {
  message: string
  fieldErrors: Record<string, string[]>
  hasFieldErrors: boolean
}

export function parseApiError(error: any): ParsedApiError {
  const response = error?.response?.data || error?.data || {}

  // Errores de validación 422 (Laravel)
  if (response?.errors && typeof response.errors === 'object') {
    const fieldErrors: Record<string, string[]> = {}
    for (const [field, msgs] of Object.entries(response.errors)) {
      fieldErrors[field] = Array.isArray(msgs) ? msgs : [String(msgs)]
    }
    return {
      message: response.message || 'Error de validación',
      fieldErrors,
      hasFieldErrors: true,
    }
  }

  // Error simple con mensaje
  const message =
    response?.message ||
    response?.error ||
    response?.error_description ||
    error?.message ||
    error?.toString() ||
    'Error desconocido al conectar con el servidor'

  return {
    message,
    fieldErrors: {},
    hasFieldErrors: false,
  }
}

/**
 * Obtiene el primer error de un campo específico.
 * Útil para mostrar en inline o tooltip.
 */
export function getFieldError(error: any, field: string): string | null {
  const parsed = parseApiError(error)
  if (parsed.hasFieldErrors && parsed.fieldErrors[field]?.length) {
    return parsed.fieldErrors[field][0]
  }
  return null
}

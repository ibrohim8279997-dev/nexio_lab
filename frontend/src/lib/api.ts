import type { ApiErrorBody } from '../types'
import { translateStored } from '../i18n'

const API_URL = (import.meta.env.VITE_API_URL || '/api/v1').replace(/\/$/, '')

export class ApiError extends Error {
  status: number
  errors?: Record<string, string[]>

  constructor(message: string, status = 0, errors?: Record<string, string[]>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: BodyInit | Record<string, unknown> | null
}

let csrfToken: string | null = null
let csrfRequest: Promise<void> | null = null

function isBodyInit(body: unknown): body is BodyInit {
  return typeof body === 'string' || body instanceof FormData || body instanceof URLSearchParams || body instanceof Blob || body instanceof ArrayBuffer
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase()
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && path !== '/client/csrf') {
    await ensureCsrf()
  }

  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')
  if (csrfToken && !['GET', 'HEAD', 'OPTIONS'].includes(method)) headers.set('X-CSRF-TOKEN', csrfToken)
  let body = options.body

  if (body && !isBodyInit(body)) {
    headers.set('Content-Type', 'application/json')
    body = JSON.stringify(body)
  }

  const send = () => fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body: body as BodyInit | null | undefined,
    credentials: 'include',
    cache: options.method && options.method !== 'GET' ? 'no-store' : 'default',
  })

  let response: Response
  try {
    response = await send()
  } catch {
    throw new ApiError(translateStored('api.network'))
  }

  if (response.status === 419 && !['GET', 'HEAD', 'OPTIONS'].includes(method) && path !== '/client/csrf') {
    await response.body?.cancel()
    csrfToken = null
    csrfRequest = null
    await ensureCsrf()
    headers.set('X-CSRF-TOKEN', csrfToken || '')
    try {
      response = await send()
    } catch {
      throw new ApiError(translateStored('api.network'))
    }
  }

  if (response.status === 204) return undefined as T
  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json') ? await response.json() : null
  if (!response.ok) {
    const direct = (payload || {}) as ApiErrorBody
    const wrapped = (payload as { error?: { message?: string; fields?: Record<string, string[]> } } | null)?.error
    throw new ApiError(wrapped?.message || direct.message || translateStored('api.request'), response.status, wrapped?.fields || direct.errors)
  }
  return payload as T
}

export async function ensureCsrf(): Promise<void> {
  if (csrfToken) return
  if (!csrfRequest) {
    const configured = import.meta.env.VITE_CSRF_URL as string | undefined
    const csrfUrl = configured || `${API_URL}/client/csrf`
    csrfRequest = fetch(csrfUrl, { credentials: 'include', headers: { Accept: 'application/json' } })
      .then(async (response) => {
        if (!response.ok) throw new ApiError(translateStored('api.session'), response.status)
        const payload = await response.json() as { data?: { token?: string } }
        if (!payload.data?.token) throw new ApiError(translateStored('api.csrf'))
        csrfToken = payload.data.token
      })
      .catch((error) => {
        csrfRequest = null
        throw error
      })
  }
  await csrfRequest
}

export function uploadMedia(file: File, field = 'image') {
  const form = new FormData()
  form.append(field, file)
  return api<{ data: { path: string; url: string; original_url?: string; webp_url?: string } }>('/admin/media', { method: 'POST', body: form })
}

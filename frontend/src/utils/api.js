const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
export const WS_BASE = import.meta.env.VITE_WS_URL 
  ? import.meta.env.VITE_WS_URL.replace(/^http/, 'ws') 
  : 'ws://localhost:8000'

export async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token')
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const url = `${API_BASE}${endpoint}`
  const response = await fetch(url, { ...options, headers })

  if (!response.ok) {
    let errorDetail = 'Something went wrong'
    try {
      const errData = await response.json()
      errorDetail = errData.detail || errData.message || JSON.stringify(errData)
    } catch {
      errorDetail = response.statusText || errorDetail
    }
    const err = new Error(errorDetail)
    err.status = response.status
    throw err
  }

  return response.json()
}

const api = {
  get: (url, opts) => request(url, { ...opts, method: 'GET' }),
  post: (url, data, opts) => request(url, { ...opts, method: 'POST', body: JSON.stringify(data) }),
  put: (url, data, opts) => request(url, { ...opts, method: 'PUT', body: JSON.stringify(data) }),
  delete: (url, opts) => request(url, { ...opts, method: 'DELETE' }),
}

export default api

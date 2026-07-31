const BASE_URL = '/api'

function getToken() {
  return localStorage.getItem('ascend_token')
}

async function request(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(BASE_URL + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401 && getToken()) {
    // expired/invalid token — bounce to login
    localStorage.removeItem('ascend_token')
    localStorage.removeItem('ascend_user')
    if (!window.location.pathname.startsWith('/auth')) {
      window.location.href = '/auth'
    }
    throw new Error('Session expired')
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const detail = typeof data.detail === 'string' ? data.detail : 'The System has encountered an error.'
    throw new Error(detail)
  }
  return data
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  request,
}

export const endpoints = {
  register: (body) => api.post('/auth/register', body),
  login: (body) => api.post('/auth/login', body),

  stats: () => api.get('/player/stats'),
  rank: () => api.get('/player/rank'),
  inventory: () => api.get('/player/inventory'),
  prs: () => api.get('/player/prs'),

  dailyQuest: () => api.get('/quests/daily'),
  quests: () => api.get('/quests'),
  createQuest: (body) => api.post('/quests', body),
  logQuest: (id, body) => api.post(`/quests/${id}/log`, body),
  completeQuest: (id) => api.post(`/quests/${id}/complete`),

  dungeons: () => api.get('/dungeons'),
  createDungeon: (body) => api.post('/dungeons', body),
  getDungeon: (id) => api.get(`/dungeons/${id}`),
  logSet: (id, body) => api.post(`/dungeons/${id}/log-set`, body),
  completeDungeon: (id, body) => api.post(`/dungeons/${id}/complete`, body),

  statsHistory: () => api.get('/progress/stats-history'),
  volume: () => api.get('/progress/volume'),
  streak: () => api.get('/progress/streak'),

  nutritionToday: () => api.get('/nutrition/today'),
  nutritionLog: (body) => api.post('/nutrition/log', body),
}

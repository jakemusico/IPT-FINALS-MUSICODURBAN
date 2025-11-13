const API_BASE = 'http://127.0.0.1:8000/api'

function authHeader() {
  try {
    const token = localStorage.getItem('api_token')
    if (token) return { 'Authorization': `Bearer ${token}` }
  } catch (e) {}
  return {}
}

async function parseJsonSafe(res) {
  const ct = (res.headers.get('content-type') || '').toLowerCase()
  if (ct.includes('application/json')) {
    return res.json()
  }
  const text = await res.text().catch(() => null)
  throw new Error(text || res.statusText || 'Non-JSON response')
}

export async function getAll(params = {}) {
  const qs = new URLSearchParams(params).toString()
  const url = `${API_BASE}/academic-years${qs ? ('?' + qs) : ''}`
  try {
    const res = await fetch(url, { headers: { 'Content-Type': 'application/json', ...authHeader() }, credentials: !localStorage.getItem('api_token') ? 'same-origin' : undefined })
    if (!res.ok) {
      const payload = await parseJsonSafe(res).catch((e)=>null)
      throw new Error((payload && payload.message) ? payload.message : res.statusText)
    }
    return await parseJsonSafe(res)
  } catch (err) {
    console.error('academicYearService.getAll error', err)
    throw err
  }
}

export async function create(data) {
  try {
    const res = await fetch(`${API_BASE}/academic-years`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, credentials: !localStorage.getItem('api_token') ? 'same-origin' : undefined, body: JSON.stringify(data) })
    if (!res.ok) {
      const payload = await parseJsonSafe(res).catch(()=>null)
      throw new Error((payload && payload.errors) ? JSON.stringify(payload.errors) : (payload && payload.message) ? payload.message : res.statusText)
    }
    return await parseJsonSafe(res)
  } catch (err) {
    console.error('academicYearService.create error', err)
    throw err
  }
}

export async function update(id, data) {
  try {
    const res = await fetch(`${API_BASE}/academic-years/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeader() }, credentials: !localStorage.getItem('api_token') ? 'same-origin' : undefined, body: JSON.stringify(data) })
    if (!res.ok) {
      const payload = await parseJsonSafe(res).catch(()=>null)
      throw new Error((payload && payload.errors) ? JSON.stringify(payload.errors) : (payload && payload.message) ? payload.message : res.statusText)
    }
    return await parseJsonSafe(res)
  } catch (err) {
    console.error('academicYearService.update error', err)
    throw err
  }
}

export async function remove(id) {
  try {
    const res = await fetch(`${API_BASE}/academic-years/${id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json', ...authHeader() }, credentials: !localStorage.getItem('api_token') ? 'same-origin' : undefined })
    if (!res.ok) {
      const payload = await parseJsonSafe(res).catch(()=>null)
      throw new Error((payload && payload.message) ? payload.message : res.statusText)
    }
    return await parseJsonSafe(res)
  } catch (err) {
    console.error('academicYearService.remove error', err)
    throw err
  }
}

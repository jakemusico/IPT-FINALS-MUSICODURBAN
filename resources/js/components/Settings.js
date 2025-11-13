import React, { useEffect, useState } from 'react'

function safe(res) {
  if (!res) return []
  if (Array.isArray(res)) return res
  if (res.data && Array.isArray(res.data)) return res.data
  return []
}



export default function Settings() {
  const token = (() => { try { return localStorage.getItem('api_token') } catch(e){ return null } })()
  const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {}
  const [tab, setTab] = useState('courses')
  const [courses, setCourses] = useState([])
  const [departments, setDepartments] = useState([])
  const [years, setYears] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({})
  const [editingId, setEditingId] = useState(null)
  const [openMenuId, setOpenMenuId] = useState(null)
  const [archivedOnly, setArchivedOnly] = useState(false)
  const TEXT = { primary: '#0b2b4a', body: '#374151' }
  const [error, setError] = useState('')

  // show a concise, user-friendly error and log raw HTML responses to console
  const showFriendlyError = (err) => {
    const raw = (err && err.message) ? err.message : String(err || '')
    // detect HTML responses
    if (typeof raw === 'string' && /<!doctype|<html/i.test(raw)) {
      console.error('Server returned HTML response:', raw)
      setError('Server returned an HTML error page (possible session expiry or server error). Check DevTools Network or console for details.')
    } else {
      const msg = typeof raw === 'string' && raw.length > 300 ? raw.slice(0,300) + '...' : raw
      setError(msg || 'An error occurred')
    }
  }

  // small fetch wrapper: if we don't have a bearer token, include credentials
  const doFetch = (input, init = {}) => {
    const opts = { ...init }
    if (!token) {
      opts.credentials = opts.credentials || 'same-origin'
    }
    return fetch(input, opts)
  }

  // parse JSON when available, otherwise return text
  const fetchJsonSafe = async (input, init = {}) => {
    const res = await doFetch(input, init)
    const ct = (res.headers.get('content-type') || '').toLowerCase()
    let payload = null
    let text = null
    if (ct.includes('application/json')) {
      try { payload = await res.json() } catch (e) { text = await res.text().catch(()=>String(e)) }
    } else {
      text = await res.text().catch(()=>null)
    }
    return { res, payload, text }
  }

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
    const [cRes, dRes, yRes] = await Promise.all([doFetch('/api/courses', { headers: authHeader }).catch(()=>({})), doFetch('/api/departments', { headers: authHeader }).catch(()=>({})), doFetch('/api/academic-years', { headers: authHeader }).catch(()=>({}))])
    const [cJs, dJs, yJs] = await Promise.all([
      cRes.json().catch(() => []),
      dRes.json().catch(() => []),
      yRes.json().catch(() => []),
    ])
      setCourses(safe(cJs))
      setDepartments(safe(dJs))
      setYears(safe(yJs))
    } catch (e) {
      console.error(e); setError('Failed to load settings data')
    } finally { setLoading(false) }
  }

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const createCourse = async (e) => {
    e.preventDefault(); setError('')
    try {
      const res = await doFetch('/api/courses', { method: 'POST', headers: { 'Content-Type':'application/json', ...authHeader }, body: JSON.stringify(form) })
      const js = await res.json().catch(()=> ({}))
      if (!res.ok) throw new Error(js.message || 'Create failed')
      setForm({}); setShowForm(false); await fetchAll()
  } catch (err) { showFriendlyError(err) }
  }

  const updateCourse = async (e) => {
    e.preventDefault(); setError('')
    if (!editingId) return
    try {
      const res = await doFetch(`/api/courses/${editingId}`, { method: 'PATCH', headers: { 'Content-Type':'application/json', ...authHeader }, body: JSON.stringify(form) })
      const js = await res.json().catch(()=> ({}))
      if (!res.ok) throw new Error(js.message || 'Update failed')
      // Update local list (optimistic)
      setCourses(prev => (prev || []).map(c => (String(c.id) === String(editingId) ? ({ ...c, ...form }) : c)))
      setForm({}); setShowForm(false); setEditingId(null); try { window.dispatchEvent(new Event('courses:changed')) } catch(e){}
  } catch (err) { showFriendlyError(err) }
  }

  const updateDepartment = async (e) => {
    e.preventDefault(); setError('')
    if (!editingId) return
    try {
      const res = await doFetch(`/api/departments/${editingId}`, { method: 'PATCH', headers: { 'Content-Type':'application/json', ...authHeader }, body: JSON.stringify(form) })
      const js = await res.json().catch(()=> ({}))
      if (!res.ok) throw new Error(js.message || 'Update failed')
      // Update local list (optimistic)
      setDepartments(prev => (prev || []).map(d => (String(d.id) === String(editingId) ? ({ ...d, ...form }) : d)))
      setForm({}); setShowForm(false); setEditingId(null); try { window.dispatchEvent(new Event('departments:changed')) } catch(e){}
  } catch (err) { showFriendlyError(err) }
  }

  const createDepartment = async (e) => {
    e.preventDefault(); setError('')
    try {
      const { res, payload, text } = await fetchJsonSafe('/api/departments', { method: 'POST', headers: { 'Content-Type':'application/json', ...authHeader }, body: JSON.stringify(form) })
      if (!res.ok) {
        const msg = (payload && payload.message) ? payload.message : (text || res.statusText)
        throw new Error(msg || 'Create failed')
      }
      setForm({}); setShowForm(false); await fetchAll()
  } catch (err) { showFriendlyError(err) }
  }

  const createYear = async (e) => {
    e.preventDefault(); setError('')
    try {
      // prepare payload matching API expectations
      const data = {
        year_name: form.year || form.year_name || '',
        start_date: formatDateForApi ? formatDateForApi(form.start_date || form.start || '') : (form.start_date || form.start || ''),
        end_date: formatDateForApi ? formatDateForApi(form.end_date || form.end || '') : (form.end_date || form.end || ''),
        status: (form.status || 'active').toLowerCase()
      }

      // if editingId is set, update instead of create
      let res, payload, text
      if (editingId) {
        const upd = { year_name: data.year_name, start_date: data.start_date, end_date: data.end_date, status: data.status }
        ;({ res, payload, text } = await fetchJsonSafe(`/api/academic-years/${editingId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...authHeader }, body: JSON.stringify(upd) }))
      } else {
        ;({ res, payload, text } = await fetchJsonSafe('/api/academic-years', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...authHeader }, body: JSON.stringify(data) }))
      }

      if (!res.ok) {
        // extract validation messages when available
        let msg = (payload && payload.message) ? payload.message : (text || res.statusText)
        if (payload && payload.errors) {
          const errs = []
          Object.values(payload.errors).forEach(v => {
            if (Array.isArray(v)) errs.push(...v)
            else errs.push(String(v))
          })
          if (errs.length) msg = errs.join(' ')
        }
        throw new Error(msg || 'Create failed')
      }
      // on success clear editingId so the modal resets
      setForm({}); setShowForm(false); setEditingId(null); await fetchAll()
    } catch (err) { showFriendlyError(err) }
  }

  const filtered = (arr, keys=[]) => arr.filter(item => {
    if (!search) return true
    const q = search.toLowerCase()
    return keys.some(k => String(item[k] || '').toLowerCase().includes(q))
  })

  // convenience: for courses ensure we search both name and code by default
  const courseFiltered = () => filtered(courses || [], ['name', 'code', 'description'])

  // compute years to show (respect archivedOnly toggle)
  const yearsToShow = React.useMemo(() => {
    const base = filtered(years || [], ['year', 'year_name', 'name', 'start_date', 'end_date'])
    if (archivedOnly) return (base || []).filter(y => String(y.status || '').toLowerCase() === 'archived')
    // when not viewing archived, show active/non-archived records
    return (base || []).filter(y => String(y.status || '').toLowerCase() !== 'archived')
  }, [years, search, archivedOnly])

  // format ISO dates into a short human-friendly form like "Jan 22, 2025"
  const formatDate = (val) => {
    if (!val) return '—'
    try {
      const d = new Date(val)
      if (Number.isNaN(d.getTime())) return String(val)
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    } catch (e) {
      return String(val)
    }
  }

  // format a date value to YYYY-MM-DD for API payloads
  const formatDateForApi = (val) => {
    if (!val) return ''
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val
    try {
      const d = new Date(val)
      if (Number.isNaN(d.getTime())) return String(val)
      return d.toISOString().slice(0, 10)
    } catch (e) {
      return String(val)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <h1 style={{ margin: 0 }}>System Settings</h1>
  <div style={{ color: '#4b5563' }}>Manage courses, departments, and academic year configurations</div>
      </div>

      <div style={{ background: '#fff', padding: 12, borderRadius: 10 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setTab('courses')} style={{ padding: '10px 18px', borderRadius: 8, border: 0, background: tab==='courses' ? '#fff' : '#f1f5f9', fontWeight: 700 }}>Courses</button>
          <button onClick={() => setTab('departments')} style={{ padding: '10px 18px', borderRadius: 8, border: 0, background: tab==='departments' ? '#fff' : '#f1f5f9', fontWeight: 700 }}>Departments</button>
          <button onClick={() => setTab('years')} style={{ padding: '10px 18px', borderRadius: 8, border: 0, background: tab==='years' ? '#fff' : '#f1f5f9', fontWeight: 700 }}>Academic Years</button>
        </div>
      </div>

      {/* Settings panels: courses / departments / academic years (Quick Statistics removed) */}
      <div style={{ background: '#fff', padding: 20, borderRadius: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0 }}>{tab === 'courses' ? 'Course Management' : tab === 'departments' ? 'Department Management' : 'Academic Year Management'}</h2>
            <div style={{ color: '#4b5563' }}>Add, edit, and archive {tab === 'courses' ? 'course' : tab === 'departments' ? 'department' : 'academic year'} information</div>
          </div>
          <div>
            <button onClick={() => { setShowForm(true); setForm({}); setEditingId(null); setArchivedOnly(false) }} style={{ background: '#0b2b4a', color: '#fff', padding: '10px 14px', borderRadius: 10, border: 0, marginRight: 8 }}>+ Add {tab === 'courses' ? 'Course' : tab === 'departments' ? 'Department' : 'Academic Year'}</button>
            {/* (Removed: Quick Add Archived button per request) */}
            {tab === 'years' && (
              <button onClick={() => { setArchivedOnly(prev => !prev); setShowForm(false) }} style={{ background: archivedOnly ? '#ffffff' : '#f3f4f6', color: archivedOnly ? '#0b2b4a' : '#374151', padding: '10px 14px', borderRadius: 10, border: '1px solid #e6eef6' }}>{archivedOnly ? 'Back to active academic years' : 'Archived Academic Years'}</button>
            )}
          </div>
        </div>

        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <input placeholder={tab === 'courses' ? 'Search Courses/Course ID' : tab === 'departments' ? 'Search Departments/Department Code' : 'Search academic years...'} value={search} onChange={e=>setSearch(e.target.value)} style={{ padding: '12px 14px', borderRadius: 8, border: '1px solid #eee', width: 420 }} />
        </div>

  <div style={{ marginTop: 18, borderRadius: 8, overflow: 'visible', border: '1px solid #f0f0f0' }}>
          {/* compute years to show (respect archivedOnly toggle) */}
          {/* yearsToShow computed above */}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#fafafa' }}>
              <tr>
                {tab === 'courses' && (<>
                  <th style={{ textAlign: 'left', padding: 16 }}>Course Name</th>
                  <th style={{ padding: 16 }}>Code</th>
                  <th style={{ padding: 16 }}>Description</th>
                  <th style={{ padding: 16 }}>Status</th>
                  <th style={{ padding: 16 }}>Actions</th>
                </>)}

                {tab === 'departments' && (<>
                  <th style={{ textAlign: 'left', padding: 16 }}>Department Name</th>
                  <th style={{ padding: 16 }}>Code</th>
                  <th style={{ padding: 16 }}>Department Head</th>
                  <th style={{ padding: 16 }}>Status</th>
                  <th style={{ padding: 16 }}>Actions</th>
                </>)}

                {tab === 'years' && (<>
                  <th style={{ textAlign: 'left', padding: 16 }}>Academic Year</th>
                  <th style={{ padding: 16 }}>Start Date</th>
                  <th style={{ padding: 16 }}>End Date</th>
                  <th style={{ padding: 16 }}>Status</th>
                  <th style={{ padding: 16 }}>Actions</th>
                </>)}
              </tr>
            </thead>
            <tbody>
              {tab === 'courses' && courseFiltered().map(c => (
                <tr key={c.id} style={{ borderTop: '1px solid #f4f4f6' }}>
                  <td style={{ padding: 16, color: TEXT.body }}>{c.name}</td>
                  <td style={{ padding: 16, color: TEXT.body }}>{c.code || '—'}</td>
                  <td style={{ padding: 16, color: TEXT.body }}>{c.description || '—'}</td>
                  <td style={{ padding: 16 }}>
                    <span style={{ display: 'inline-block', padding: '6px 10px', borderRadius: 16, background: (c.archived || c.status === 'Archived') ? '#9ca3af' : '#2e7d32', color: '#fff', fontWeight: 700, fontSize: 12 }}>{(c.archived || c.status === 'Archived') ? 'Archived' : (c.status || 'Active')}</span>
                  </td>
                  <td style={{ padding: 16, position: 'relative' }}>
                    <div style={{ position: 'relative', display: 'inline-block' }} onClick={e => e.stopPropagation()}>
                      <button onClick={e => { e.stopPropagation(); setOpenMenuId(openMenuId === c.id ? null : c.id) }} style={{ background: '#fff', border: 'none', padding: '8px 10px', borderRadius: 8, cursor: 'pointer', boxShadow: '0 1px 2px rgba(2,6,23,0.06)' }}>⋯</button>
                      {openMenuId === c.id && (() => {
                        const isArchived = !!(c.archived || c.status === 'Archived')
                        return (
                          <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', background: '#fff', boxShadow: '0 6px 18px rgba(2,6,23,0.08)', borderRadius: 8, padding: 8, minWidth: 160, zIndex: 9999 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              <button onClick={() => { setEditingId(c.id); setForm({ name: c.name || '', code: c.code || '', description: c.description || '' }); setShowForm(true); setOpenMenuId(null) }} style={{ background: 'transparent', border: '1px solid #e5e7eb', padding: '6px 8px', borderRadius: 6, cursor: 'pointer', textAlign: 'left' }}>Edit</button>
                              {isArchived ? (
                                <button onClick={async () => {
                                  setOpenMenuId(null)
                                  if (!window.confirm('Are you sure you want to restore this course?')) return
                                  try {
                                    const res = await doFetch(`/api/courses/${c.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader }, body: JSON.stringify({ archived: false }) })
                                    const js = await res.json().catch(()=> ({}))
                                    if (!res.ok) throw new Error(js.message || 'Restore failed')
                                    // update local state so status updates immediately
                                    setCourses(prev => (prev || []).map(x => (String(x.id) === String(c.id) ? ({ ...x, archived: false, status: 'Active' }) : x)))
                                    try { window.dispatchEvent(new Event('courses:changed')) } catch(e){}
                                  } catch (err) { showFriendlyError(err) }
                                }} style={{ background: '#2e7d32', color: '#fff', border: 0, padding: '6px 8px', borderRadius: 6, cursor: 'pointer', textAlign: 'left' }}>Restore</button>
                              ) : (
                                <button onClick={async () => {
                                  setOpenMenuId(null)
                                  if (!window.confirm('Archive this course?')) return
                                  try {
                                    const res = await doFetch(`/api/courses/${c.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader }, body: JSON.stringify({ archived: true }) })
                                    const js = await res.json().catch(()=> ({}))
                                    if (!res.ok) throw new Error(js.message || 'Archive failed')
                                    // update local state so status updates immediately
                                    setCourses(prev => (prev || []).map(x => (String(x.id) === String(c.id) ? ({ ...x, archived: true, status: 'Archived' }) : x)))
                                    try { window.dispatchEvent(new Event('courses:changed')) } catch(e){}
                                  } catch (err) { showFriendlyError(err) }
                                }} style={{ background: '#f87171', color: '#fff', border: 0, padding: '6px 8px', borderRadius: 6, cursor: 'pointer', textAlign: 'left' }}>Archive</button>
                              )}
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  </td>
                </tr>
              ))}

              {tab === 'departments' && filtered(departments, ['name','code','head']).map(d => (
                <tr key={d.id} style={{ borderTop: '1px solid #f4f4f6' }}>
                  <td style={{ padding: 16, color: '#1f2937', fontWeight: 600 }}>{d.name}</td>
                  <td style={{ padding: 16, color: '#4b5563' }}>{d.code || '—'}</td>
                  <td style={{ padding: 16, color: '#6b7280' }}>{d.head || '—'}</td>
                  <td style={{ padding: 16 }}>
                    <span style={{ display: 'inline-block', padding: '6px 10px', borderRadius: 16, background: (d.archived || d.status === 'Archived') ? '#9ca3af' : '#2e7d32', color: '#fff', fontWeight: 700, fontSize: 12 }}>{(d.archived || d.status === 'Archived') ? 'Archived' : (d.status || 'Active')}</span>
                  </td>
                  <td style={{ padding: 16, position: 'relative' }}>
                    <div style={{ position: 'relative', display: 'inline-block' }} onClick={e => e.stopPropagation()}>
                      <button onClick={e => { e.stopPropagation(); setOpenMenuId(openMenuId === d.id ? null : d.id) }} style={{ background: '#fff', border: 'none', padding: '8px 10px', borderRadius: 8, cursor: 'pointer', boxShadow: '0 1px 2px rgba(2,6,23,0.06)' }}>⋯</button>
                      {openMenuId === d.id && (() => {
                        const isArchived = !!(d.archived || d.status === 'Archived')
                        return (
                          <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', background: '#fff', boxShadow: '0 6px 18px rgba(2,6,23,0.08)', borderRadius: 8, padding: 8, minWidth: 160, zIndex: 9999 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              <button onClick={() => { setEditingId(d.id); setForm({ name: d.name || '', code: d.code || '', head: d.head || '', description: d.description || '' }); setShowForm(true); setOpenMenuId(null) }} style={{ background: 'transparent', border: '1px solid #e5e7eb', padding: '6px 8px', borderRadius: 6, cursor: 'pointer', textAlign: 'left' }}>Edit</button>
                              {isArchived ? (
                                <button onClick={async () => {
                                  setOpenMenuId(null)
                                  if (!window.confirm('Are you sure you want to restore this department?')) return
                                  try {
                                    const res = await doFetch(`/api/departments/${d.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader }, body: JSON.stringify({ archived: false }) })
                                    const js = await res.json().catch(()=> ({}))
                                    if (!res.ok) throw new Error(js.message || 'Restore failed')
                                    setDepartments(prev => (prev || []).map(x => (String(x.id) === String(d.id) ? ({ ...x, archived: false, status: 'Active' }) : x)))
                                    try { window.dispatchEvent(new Event('departments:changed')) } catch(e){}
                                  } catch (err) { showFriendlyError(err) }
                                }} style={{ background: '#2e7d32', color: '#fff', border: 0, padding: '6px 8px', borderRadius: 6, cursor: 'pointer', textAlign: 'left' }}>Restore</button>
                              ) : (
                                <button onClick={async () => {
                                  setOpenMenuId(null)
                                  if (!window.confirm('Archive this department?')) return
                                  try {
                                    const res = await doFetch(`/api/departments/${d.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader }, body: JSON.stringify({ archived: true }) })
                                    const js = await res.json().catch(()=> ({}))
                                    if (!res.ok) throw new Error(js.message || 'Archive failed')
                                    setDepartments(prev => (prev || []).map(x => (String(x.id) === String(d.id) ? ({ ...x, archived: true, status: 'Archived' }) : x)))
                                    try { window.dispatchEvent(new Event('departments:changed')) } catch(e){}
                                  } catch (err) { showFriendlyError(err) }
                                }} style={{ background: '#f87171', color: '#fff', border: 0, padding: '6px 8px', borderRadius: 6, cursor: 'pointer', textAlign: 'left' }}>Archive</button>
                              )}
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  </td>
                </tr>
              ))}

              {tab === 'years' && yearsToShow.map(y => (
                <tr key={y.id} style={{ borderTop: '1px solid #f4f4f6', background: '#fff' }}>
                  <td style={{ padding: 20, color: TEXT.primary, fontWeight: 800, fontSize: 18 }}>{y.year || y.year_name || y.name || '—'}</td>
                  <td style={{ padding: 20, color: TEXT.primary, fontSize: 15 }}>{formatDate(y.start_date || y.start)}</td>
                  <td style={{ padding: 20, color: TEXT.primary, fontSize: 15 }}>{formatDate(y.end_date || y.end)}</td>
                  <td style={{ padding: 20 }}>
                    {String(y.status || '').toLowerCase() === 'archived' ? (
                      <span style={{ background: '#6b7280', color: '#fff', padding: '6px 12px', borderRadius: 14, fontWeight: 700, fontSize: 13 }}>Archived</span>
                    ) : (
                      <span style={{ background: '#166534', color: '#fff', padding: '6px 12px', borderRadius: 14, fontWeight: 700, fontSize: 13 }}>Active</span>
                    )}
                  </td>
                  <td style={{ padding: 16, position: 'relative' }}>
                    <div style={{ position: 'relative', display: 'inline-block' }} onClick={e => e.stopPropagation()}>
                      <button onClick={e => { e.stopPropagation(); setOpenMenuId(openMenuId === y.id ? null : y.id) }} style={{ background: '#fff', border: 'none', padding: '8px 10px', borderRadius: 8, cursor: 'pointer', boxShadow: '0 1px 2px rgba(2,6,23,0.06)' }}>⋯</button>
                      {openMenuId === y.id && (() => {
                        const isArchived = !!(y.status === 'Archived' || (y.status && String(y.status).toLowerCase() === 'archived'))
                        return (
                          <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', background: '#fff', boxShadow: '0 6px 18px rgba(2,6,23,0.08)', borderRadius: 8, padding: 8, minWidth: 160, zIndex: 9999 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              <button onClick={() => { setEditingId(y.id); setForm({ year: y.year || y.year_name || y.name || '', start_date: y.start_date || y.start || '', end_date: y.end_date || y.end || '', status: y.status || 'active' }); setShowForm(true); setOpenMenuId(null) }} style={{ background: 'transparent', border: '1px solid #e5e7eb', padding: '6px 8px', borderRadius: 6, cursor: 'pointer', textAlign: 'left' }}>Edit</button>
                              {isArchived ? (
                                <>
                                  <button onClick={async () => {
                                    setOpenMenuId(null)
                                    if (!window.confirm('Are you sure you want to restore this academic year?')) return
                                    try {
                                      const res = await doFetch(`/api/academic-years/${y.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader }, body: JSON.stringify({ status: 'active' }) })
                                      const js = await res.json().catch(()=> ({}))
                                      if (!res.ok) throw new Error(js.message || 'Restore failed')
                                      setYears(prev => (prev || []).map(x => (String(x.id) === String(y.id) ? ({ ...x, status: 'Active' }) : x)))
                                      try { window.dispatchEvent(new Event('academic-years:changed')) } catch(e){}
                                    } catch (err) { showFriendlyError(err) }
                                  }} style={{ background: '#2e7d32', color: '#fff', border: 0, padding: '6px 8px', borderRadius: 6, cursor: 'pointer', textAlign: 'left' }}>Restore</button>

                                  <button onClick={async () => {
                                    setOpenMenuId(null)
                                    if (!window.confirm('Permanently delete this academic year? This cannot be undone.')) return
                                    try {
                                      // send force=1 to trigger permanent deletion on server
                                      const res = await doFetch(`/api/academic-years/${y.id}?force=1`, { method: 'DELETE', headers: { 'Content-Type': 'application/json', ...authHeader } })
                                      const js = await res.json().catch(()=> ({}))
                                      if (!res.ok) throw new Error(js.message || 'Delete failed')
                                      setYears(prev => (prev || []).filter(x => String(x.id) !== String(y.id)))
                                      try { window.dispatchEvent(new Event('academic-years:changed')) } catch(e){}
                                    } catch (err) { showFriendlyError(err) }
                                  }} style={{ background: '#fee2e2', color: '#a00', border: 0, padding: '6px 8px', borderRadius: 6, cursor: 'pointer', textAlign: 'left' }}>Delete</button>
                                </>
                              ) : (
                                <button onClick={async () => {
                                  setOpenMenuId(null)
                                  if (!window.confirm('Archive this academic year?')) return
                                  try {
                                    // call DELETE route which sets status to archived on the server
                                    const res = await doFetch(`/api/academic-years/${y.id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json', ...authHeader } })
                                    const js = await res.json().catch(()=> ({}))
                                    if (!res.ok) throw new Error(js.message || 'Archive failed')
                                    setYears(prev => (prev || []).map(x => (String(x.id) === String(y.id) ? ({ ...x, status: 'Archived' }) : x)))
                                    try { window.dispatchEvent(new Event('academic-years:changed')) } catch(e){}
                                  } catch (err) { showFriendlyError(err) }
                                }} style={{ background: '#f87171', color: '#fff', border: 0, padding: '6px 8px', borderRadius: 6, cursor: 'pointer', textAlign: 'left' }}>Archive</button>
                              )}
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  </td>
                </tr>
              ))}

                {((tab === 'courses' && (courseFiltered() || []).length === 0) || (tab === 'departments' && filtered(departments, ['name','code','head']).length === 0) || (tab === 'years' && (yearsToShow || []).length === 0)) ? (
                <tr><td colSpan={5} style={{ padding: 20, textAlign: 'center', color: '#6b7280' }}>{loading ? 'Loading...' : 'No records'}</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {/* modal form (create / edit) */}
        {showForm && (
          <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 9999 }} onClick={() => { setShowForm(false); setEditingId(null); setForm({}) }}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#fff', padding: 16, borderRadius: 12, width: 'min(700px, 96%)', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(2,6,23,0.12)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <h3 style={{ margin: 0, fontSize: 18 }}>{editingId ? 'Edit Course' : (tab === 'courses' ? 'Add Course' : tab === 'departments' ? 'Add Department' : 'Add Academic Year')}</h3>
                <button onClick={() => { setShowForm(false); setEditingId(null); setForm({}) }} style={{ background: 'transparent', border: 0, cursor: 'pointer', fontSize: 18 }}>✕</button>
              </div>
              {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
              <form onSubmit={tab === 'courses' ? (editingId ? updateCourse : createCourse) : tab === 'departments' ? (editingId ? updateDepartment : createDepartment) : createYear} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {tab === 'courses' && (
                  <>
                    <input name="name" placeholder="Course name" value={form.name||''} onChange={onChange} style={{ padding: 10, flex: '1 1 320px' }} />
                    <input name="code" placeholder="Code" value={form.code||''} onChange={onChange} style={{ padding: 10, flex: '1 1 120px' }} />
                    <textarea name="description" placeholder="Short description" value={form.description||''} onChange={onChange} style={{ padding: 10, flex: '1 1 100%', minHeight: 80 }} />
                  </>
                )}

                {tab === 'departments' && (
                  <>
                    <input name="name" placeholder="Department name" value={form.name||''} onChange={onChange} style={{ padding: 10, flex: '1 1 320px' }} />
                    <input name="code" placeholder="Code" value={form.code||''} onChange={onChange} style={{ padding: 10, flex: '1 1 120px' }} />
                    <input name="head" placeholder="Department head" value={form.head||''} onChange={onChange} style={{ padding: 10, flex: '1 1 220px' }} />
                    <input name="description" placeholder="Short description" value={form.description||''} onChange={onChange} style={{ padding: 10, flex: '1 1 100%' }} />
                  </>
                )}

                {tab === 'years' && (
                  <>
                    <input name="year" placeholder="Academic year (e.g. 2024-2025)" value={form.year||''} onChange={onChange} style={{ padding: 10, flex: '1 1 220px' }} />
                    <input name="start_date" placeholder="Start date" value={form.start_date||''} onChange={onChange} type="date" style={{ padding: 10 }} />
                    <input name="end_date" placeholder="End date" value={form.end_date||''} onChange={onChange} type="date" style={{ padding: 10 }} />
                  </>
                )}

                <div style={{ display: 'flex', gap: 8, width: '100%', marginTop: 8 }}>
                  <button type="submit" style={{ background: '#1976d2', color: '#fff', padding: '8px 14px', borderRadius: 8, border: 0 }}>{editingId ? 'Save' : 'Create'}</button>
                  <button type="button" onClick={() => { setShowForm(false); setEditingId(null); setForm({}) }} style={{ background: '#eee', padding: '8px 14px', borderRadius: 8, border: 0 }}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

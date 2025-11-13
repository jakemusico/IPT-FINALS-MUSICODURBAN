import React, { useEffect, useState, useRef } from 'react'

export default function FacultyManager() {
  const token = (() => { try { return localStorage.getItem('api_token') } catch(e){ return null } })()
  const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {}

  const [faculty, setFaculty] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [query, setQuery] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [tab, setTab] = useState('active') // 'active' | 'archived'

  const [formVisible, setFormVisible] = useState(false)
  const [form, setForm] = useState({ id_number: '', fname: '', lname: '', email: '', contact: '', department: '', position: '', gender: '', address: '', birthday: '', employment_type: '', education: '', photo: '', photo_file: null, remove_photo: false })
  const [editingId, setEditingId] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const fileInputRef = useRef(null)

  const [viewProfile, setViewProfile] = useState(null) // selected faculty for view modal

  // uniform button styles
  const actionBtn = { background: 'transparent', border: '1px solid #e5e7eb', padding: '6px 8px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, color: '#0b2b4a' }
  const primaryBtn = { background: '#1976d2', color: '#fff', border: 0, padding: '6px 10px', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }
  const archiveBtn = { background: '#9ca3af', color: '#fff', border: 0, padding: '6px 10px', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }
  const restoreBtn = { background: '#f59e0b', color: '#fff', border: 0, padding: '6px 10px', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }
  const deleteBtn = { background: '#e53935', color: '#fff', border: 0, padding: '6px 10px', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }
  const neutralBtn = { background: '#eee', padding: '6px 10px', borderRadius: 6, border: 0, cursor: 'pointer', color: '#0b2b4a' }
  const [openMenuId, setOpenMenuId] = useState(null)

  // click outside to close row menus
  useEffect(() => {
    const handler = () => setOpenMenuId(null)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  const TEXT = { primary: '#0b2b4a', body: '#111827', muted: '#6b7280' }
  useEffect(() => { fetchFaculty(); fetchDepartments() }, [])

  const normalizePhotoUrl = (photo) => {
    if (!photo) return null
    // if server returned a storage path like '/storage/..' make it absolute so <img> loads
    try {
      if (photo.startsWith('/')) return window.location.origin + photo
    } catch (e) { /* window may be undefined in SSR, ignore */ }
    return photo
  }

  // Safely parse fetch responses: prefer JSON but fall back to text to avoid
  // crashing on HTML error pages (Unexpected token '<'). Returns an object
  // { json, text } where one will be null depending on content-type.
  const safeParse = async (res) => {
    const ct = (res.headers && res.headers.get && res.headers.get('content-type')) || ''
    if (ct.includes('application/json')) {
      try {
        const js = await res.json()
        return { json: js, text: null }
      } catch (e) {
        // malformed JSON, fall back to text
        const txt = await res.text().catch(() => String(e))
        return { json: null, text: txt }
      }
    }
    // not JSON, return text (likely an HTML error page)
    const txt = await res.text().catch(() => null)
    return { json: null, text: txt }
  }

  const fetchFaculty = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/faculty', { headers: authHeader })
      const parsed = await safeParse(res)
      if (!res.ok) {
        const msg = (parsed.json && parsed.json.message) || parsed.text || `Failed to load faculty (status ${res.status})`
        throw new Error(msg)
      }
      const json = parsed.json
      // If server didn't return JSON (e.g. returned HTML error page), handle gracefully
      if (!json) {
        // show any returned text to help debugging and keep UI stable
        setError(parsed.text || `Invalid response from server (status ${res.status})`)
        setFaculty([])
        return
      }
      // normalize photo URLs for immediate display
      const list = (json.data || []).map(p => ({ ...p, photo: normalizePhotoUrl(p.photo) }))
      setFaculty(list)
    } catch (e) { setError(e.message || String(e)) } finally { setLoading(false) }
  }

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/departments', { headers: authHeader })
      const parsed = await safeParse(res)
      if (res.ok && parsed.json && parsed.json.data) setDepartments(parsed.json.data)
    } catch (e) { /* ignore */ }
  }

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const onFileChange = (e) => {
    const f = e.target.files && e.target.files[0] ? e.target.files[0] : null
    // if a file is chosen, clear any typed photo URL to avoid sending an empty string
    setForm(prev => ({ ...prev, photo_file: f, photo: f ? '' : prev.photo, remove_photo: false }))
    // revoke previous object URL if it was a blob URL
    try { if (previewUrl && String(previewUrl).startsWith('blob:')) { URL.revokeObjectURL(previewUrl) } } catch (e) { /* ignore */ }
    // show object URL preview for newly chosen file, otherwise keep existing photo URL if present
    if (f) {
      setPreviewUrl(URL.createObjectURL(f))
    } else {
      setPreviewUrl(form.photo ? normalizePhotoUrl(form.photo) : null)
    }
  }

  const createFaculty = async (e) => {
    // allow being called both as an onSubmit handler (event passed) or programmatically
    try { if (e && e.preventDefault) e.preventDefault() } catch(e) {}
    setError('')
    try {
      // decide whether to use FormData (for file upload) or JSON (no file)
      let res
      if (form.photo_file) {
        const fd = new FormData()
        Object.keys(form).forEach(k => {
          if (k === 'photo_file' || k === 'remove_photo') return
          const v = form[k]
          if (v !== undefined && v !== null && v !== '') fd.append(k, v)
        })
        fd.append('photo_file', form.photo_file)
        // Always send explicit remove_photo flag as '1' or '0' so server boolean validation accepts it
        fd.append('remove_photo', form.remove_photo ? '1' : '0')
        // debug: log FormData keys
        try {
          for (const pair of fd.entries()) console.debug('createFaculty fd:', pair[0], pair[1])
        } catch (e) {}
        // Ask server to return JSON on errors (prevents HTML login pages)
        res = await fetch('/api/faculty', { method: 'POST', headers: { ...authHeader, 'Accept': 'application/json' }, body: fd })
      } else {
        const payload = {}
        Object.keys(form).forEach(k => {
          if (k === 'photo_file') return
          const v = form[k]
          if (v !== undefined && v !== null && v !== '') payload[k] = v
        })
        // ensure remove_photo is included for JSON payloads (boolean)
        payload.remove_photo = !!form.remove_photo
        console.debug('createFaculty json payload:', payload)
        res = await fetch('/api/faculty', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...authHeader }, body: JSON.stringify(payload) })
      }
      const parsed = await safeParse(res)
      try { console.debug('createFaculty response', res.status, parsed) } catch(e) {}
      if (!res.ok) {
        // Prefer validation errors if present
        let msg = (parsed.json && parsed.json.message) || parsed.text || `Create failed (status ${res.status})`
        try {
          if (parsed.json && parsed.json.errors) {
            const errs = parsed.json.errors
            msg = Object.keys(errs).map(k => (errs[k] || []).join(' ')).join(' ')
          }
        } catch (e) {}
        throw new Error(msg)
      }
  const js = parsed.json || null
  // if server returned the created record, add it to the UI immediately
  if (js && js.data) {
        // prefer to fetch the freshly created record from the server so we have
        // the exact shape (including storage URL) and to avoid race conditions
        let item = { ...js.data, photo: normalizePhotoUrl(js.data.photo) }
        if (js.data.id) {
          try {
            const one = await fetch(`/api/faculty/${js.data.id}`, { headers: authHeader })
            const oneParsed = await safeParse(one)
            if (one.ok && oneParsed.json && oneParsed.json.data) {
              item = { ...oneParsed.json.data, photo: normalizePhotoUrl(oneParsed.json.data.photo) }
            }
          } catch (e) { console.debug('createFaculty: failed to fetch single record', e) }
        }
        // update the list and open the view modal for the created record
  setFaculty(prev => [item, ...prev.filter(p => p.id != item.id)])
  setViewProfile(item)
  try { window.alert('Faculty created successfully') } catch(e) {}
        // also ensure the server list is in sync
        try { await fetchFaculty() } catch (e) { /* ignore */ }
      } else {
        await fetchFaculty()
      }
  // clear form and preview and reset file input
  setForm({ id_number: '', fname: '', lname: '', email: '', contact: '', department: '', position: '', gender: '', address: '', birthday: '', employment_type: '', education: '', photo: '', photo_file: null, remove_photo: false })
      try { if (previewUrl && String(previewUrl).startsWith('blob:')) { URL.revokeObjectURL(previewUrl) } } catch(e){}
      setPreviewUrl(null)
      try { if (fileInputRef && fileInputRef.current) fileInputRef.current.value = '' } catch (e) {}
      setFormVisible(false)
  } catch (err) { const msg = err && err.message ? err.message : String(err); setError(msg); try { window.alert(`Create failed: ${msg}`) } catch(e) {} }
  }
  const startEdit = (f) => {
    setEditingId(f.id)
    setForm({
      id_number: f.id_number||'',
      fname: f.fname||'',
      lname: f.lname||'',
      email: f.email||'',
      contact: f.contact||'',
      department: f.department||'',
      position: f.position||'',
      gender: f.gender||'',
      address: f.address||'',
      birthday: f.birthday||'',
      employment_type: f.employment_type||'',
      education: f.education||'',
      photo: f.photo||'',
      photo_file: null,
      remove_photo: false
    })
    // set preview to existing photo if present
    try { setPreviewUrl(f.photo ? normalizePhotoUrl(f.photo) : null) } catch (e) { setPreviewUrl(null) }
    try { if (fileInputRef && fileInputRef.current) fileInputRef.current.value = '' } catch(e) {}
    setFormVisible(true)
  }

  const cancel = () => {
    setEditingId(null)
    setForm({ id_number: '', fname: '', lname: '', email: '', contact: '', department: '', position: '', gender: '', address: '', birthday: '', employment_type: '', education: '', photo: '', photo_file: null, remove_photo: false })
    try { if (previewUrl) { URL.revokeObjectURL(previewUrl) } } catch(e){}
    setPreviewUrl(null)
    try { if (fileInputRef && fileInputRef.current) fileInputRef.current.value = '' } catch(e) {}
    setFormVisible(false)
  }

  const confirmEdit = async () => {
    if (!editingId) return
    try {
      // Always send FormData for updates to ensure file + fields are sent in one request.
      const fd = new FormData()
      // Append all form fields (including empty strings) so server-side update
      // validation receives the expected keys. For multipart requests sending
      // PATCH we use the _method override below.
      Object.keys(form).forEach(k => {
        // skip photo_file (appended separately) and remove_photo (we'll append explicitly)
        if (k === 'photo_file' || k === 'remove_photo') return
        const v = form[k]
        fd.append(k, v === undefined || v === null ? '' : v)
      })
      // append file if selected
      if (form.photo_file) fd.append('photo_file', form.photo_file)
  // Always append explicit remove_photo flag as '1' or '0' to satisfy boolean validation
  fd.append('remove_photo', form.remove_photo ? '1' : '0')
      // Laravel-friendly override for PATCH with multipart
      fd.append('_method', 'PATCH')
      try { for (const pair of fd.entries()) console.debug('confirmEdit fd:', pair[0], pair[1]) } catch(e){}

  // Use Accept so Laravel returns JSON for API requests (avoid HTML redirects)
  const res = await fetch(`/api/faculty/${editingId}`, { method: 'POST', headers: { ...authHeader, 'Accept': 'application/json' }, body: fd })
      const parsed = await safeParse(res)
  try { console.debug('confirmEdit response', res.status, parsed) } catch(e) {}
      if (!res.ok) {
        // Prefer validation errors if present
        let msg = (parsed.json && parsed.json.message) || parsed.text || `Update failed (status ${res.status})`
        try {
          if (parsed.json && parsed.json.errors) {
            const errs = parsed.json.errors
            msg = Object.keys(errs).map(k => (errs[k] || []).join(' ')).join(' ')
          }
        } catch (e) {}
        throw new Error(msg)
      }
      const js = parsed.json || null
      // prefer returned updated record; if it's not present, refresh the list from server
      if (js && js.data) {
        let item = { ...js.data, photo: normalizePhotoUrl(js.data.photo) }
        if ((!item.photo || item.photo === null) && js.data.id) {
          try {
            const one = await fetch(`/api/faculty/${js.data.id}`, { headers: authHeader })
            const oneParsed = await safeParse(one)
            if (one.ok && oneParsed.json && oneParsed.json.data) item = { ...oneParsed.json.data, photo: normalizePhotoUrl(oneParsed.json.data.photo) }
          } catch (e) { /* ignore */ }
        }
  setFaculty(prev => prev.map(p => (p.id == item.id ? item : p)))
  setViewProfile(item)
  try { window.alert('Faculty updated successfully') } catch(e) {}
      } else {
        // make sure the UI shows the newest photo/state
        await fetchFaculty()
      }
      // refresh list to ensure updated photo appears in the table
      try { await fetchFaculty() } catch(e) {}
      cancel()
  } catch (err) { const msg = err && err.message ? err.message : String(err); setError(msg); try { window.alert(`Update failed: ${msg}`) } catch(e) {} }
  }

  // unified submit handler so form submit always routes to the correct action
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    // if editing, run confirmEdit; otherwise create
    try {
      if (editingId) {
        await confirmEdit()
      } else {
        await createFaculty()
      }
    } catch (err) {
      // surface any unexpected errors
      setError(err && err.message ? err.message : String(err))
    }
  }

  // Archive: mark as Archived; Restore: mark as Active
  const archiveFaculty = async (id) => {
    if (!window.confirm('Are you sure you want to archive this faculty?')) return
    try {
  const res = await fetch(`/api/faculty/${id}`, { method: 'PATCH', headers: { 'Content-Type':'application/json', ...authHeader }, body: JSON.stringify({ archived: true }) })
      const parsed = await safeParse(res)
      if (!res.ok) {
        const msg = (parsed.json && parsed.json.message) || parsed.text || `Archive failed (status ${res.status})`
        throw new Error(msg)
      }
      const js = parsed.json
      // refresh list so the archived item disappears from Active tab
      await fetchFaculty()
      // do NOT auto-switch to the Archived tab; user will navigate there manually
  if (viewProfile && viewProfile.id == id) setViewProfile(null)
      // simple success feedback (alert/toast can be replaced with a nicer UI later)
      try { window.alert('Faculty archived successfully. You can view it in the Archived tab.') } catch (e) { /* ignore */ }
    } catch (err) { setError(err.message || String(err)) }
  }

  const restoreFaculty = async (id) => {
    try {
  const res = await fetch(`/api/faculty/${id}`, { method: 'PATCH', headers: { 'Content-Type':'application/json', ...authHeader }, body: JSON.stringify({ archived: false }) })
      const parsed = await safeParse(res)
      if (!res.ok) {
        const msg = (parsed.json && parsed.json.message) || parsed.text || `Restore failed (status ${res.status})`
        throw new Error(msg)
      }
      const js = parsed.json
      await fetchFaculty()
      // go back to active tab after restore
      setTab('active')
  if (viewProfile && viewProfile.id == id) setViewProfile(null)
    } catch (err) { setError(err.message || String(err)) }
  }

  const deleteFaculty = async (id) => {
    if (!window.confirm('Permanently delete this faculty? This cannot be undone.')) return
    try {
      // Use Accept header to ensure JSON errors come back from Laravel
      const res = await fetch(`/api/faculty/${id}`, { method: 'DELETE', headers: { 'Accept': 'application/json', ...authHeader } })
      const parsed = await safeParse(res)
      if (!res.ok) {
        const msg = (parsed.json && parsed.json.message) || parsed.text || `Delete failed (status ${res.status})`
        throw new Error(msg)
      }
      // refresh list and close any open profile modal
      await fetchFaculty()
      if (viewProfile && viewProfile.id == id) setViewProfile(null)
      try { window.alert('Faculty deleted') } catch (e) {}
    } catch (err) {
      setError(err && err.message ? err.message : String(err))
      try { window.alert(`Delete failed: ${err && err.message ? err.message : String(err)}`) } catch(e) {}
    }
  }

  const initials = (f) => {
    const a = (f.fname||'').trim().charAt(0) || ''
    const b = (f.lname||'').trim().charAt(0) || ''
    return (a+b).toUpperCase()
  }

  const isArchived = (f) => {
    if (!f) return false
    if (typeof f.archived !== 'undefined') return !!f.archived
    return String(f.status || '').toLowerCase() === 'archived'
  }

  // apply search & filter and tab
  const filtered = faculty.filter(f => {
    const archived = isArchived(f)
    if (tab === 'active' && archived) return false
    if (tab === 'archived' && !archived) return false

    const q = query.trim().toLowerCase()
    if (q && !(String(f.fname||'').toLowerCase().includes(q) || String(f.lname||'').toLowerCase().includes(q) || String(f.email||'').toLowerCase().includes(q) || String(f.position||'').toLowerCase().includes(q))) return false
    if (filterDept && (f.department || '') !== filterDept) return false
    return true
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0 }}>Faculty Management</h2>
          <div style={{ color: '#4b5563' }}>Manage faculty members, their profiles, and department assignments.</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => { setFormVisible(true); setEditingId(null); setForm({ fname: '', lname: '', email: '', contact: '', department: '', position: '', gender: '', address: '', birthday: '', employment_type: '', education: '', photo: '' }) }} style={{ background: '#2e7d32', color: '#fff', border: 0, padding: '10px 16px', borderRadius: 8 }}>+ Add Faculty</button>
          {/* Archived toggle moved next to Add so Active is the default main view */}
          {tab === 'active' ? (
            <button onClick={() => setTab('archived')} style={{ padding: '8px 12px', borderRadius: 8, border: 0, background: 'transparent', color: '#0b2b4a', fontWeight: 700 }}>Archived Faculty</button>
          ) : (
            <button onClick={() => setTab('active')} style={{ padding: '8px 12px', borderRadius: 8, border: 0, background: '#1976d2', color: '#fff', fontWeight: 700 }}>Back to Active</button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <input placeholder="Search by name, email, or position" value={query} onChange={e => setQuery(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid #eee' }} />
        </div>

        <div>
          <select value={filterDept} onChange={e => setFilterDept(e.target.value)} style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #eee' }}>
            <option value="">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
          </select>
        </div>
      </div>

      <div style={{ background: '#fff', padding: 16, borderRadius: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>{tab === 'active' ? 'Active Faculty' : 'Archived Faculty'} <span style={{ color: TEXT.primary, fontSize: 20, fontWeight: 800, marginLeft: 8 }}>({filtered.length})</span></h3>
          <div style={{ color: '#6b7280' }}>{error && <span style={{ color: 'red' }}>{error}</span>}</div>
        </div>

  <div style={{ marginTop: 12, borderRadius: 8, overflow: 'visible', border: '1px solid #f0f0f0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#fafafa' }}>
              <tr>
                <th style={{ textAlign: 'left', padding: 14, color: TEXT.primary, fontWeight: 700 }}>Faculty</th>
                <th style={{ padding: 14, textAlign: 'left', color: TEXT.primary, fontWeight: 700 }}>Employee ID</th>
                <th style={{ padding: 14, textAlign: 'left', color: TEXT.primary, fontWeight: 700 }}>Department</th>
                <th style={{ padding: 14, color: TEXT.primary, fontWeight: 700 }}>Position</th>
                <th style={{ padding: 14, color: TEXT.primary, fontWeight: 700 }}>Status</th>
                <th style={{ padding: 14, color: TEXT.primary, fontWeight: 700 }}>Date Hired</th>
                <th style={{ padding: 14, color: TEXT.primary, fontWeight: 700 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => (
                <tr key={f.id} style={{ borderTop: '1px solid #f2f2f2' }}>
                  <td style={{ padding: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
                    {f.photo ? (
                      <img src={f.photo} alt="avatar" style={{ width: 44, height: 44, borderRadius: 22, objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: 44, height: 44, borderRadius: 22, background: '#0b2340', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{initials(f)}</div>
                    )}
                    <div>
                      <div style={{ fontWeight: 800, color: '#0b2b4a', fontSize: 15 }}>
                        {f.fname} {f.lname}
                      </div>
                      <div style={{ color: '#374151', fontSize: 13 }}>{f.email}</div>
                    </div>
                  </td>
                  <td style={{ padding: 12, color: TEXT.body, fontWeight: 700 }}>{f.id_number || '—'}</td>
                  <td style={{ padding: 12, color: TEXT.body }}>{f.department || '—'}</td>
                  <td style={{ padding: 12, color: TEXT.body }}>{f.position || '—'}</td>
                  <td style={{ padding: 12 }}>
                    <span style={{ display: 'inline-block', padding: '6px 10px', borderRadius: 16, background: isArchived(f) ? '#9ca3af' : (f.status === 'On Leave' ? '#ffb74d' : '#2e7d32'), color: '#fff', fontWeight: 700, fontSize: 12 }}>{isArchived(f) ? 'Archived' : (f.status || 'Active')}</span>
                  </td>
                  <td style={{ padding: 12, color: TEXT.body }}>{(f.date_hired || f.hired_at || f.created_at) ? new Date(f.date_hired || f.hired_at || f.created_at).toLocaleDateString() : '—'}</td>
                  <td style={{ padding: 12, position: 'relative' }}>
                    <div style={{ position: 'relative', display: 'inline-block' }} onClick={e => e.stopPropagation()}>
                      <button
                        onClick={e => { e.stopPropagation(); setOpenMenuId(openMenuId === f.id ? null : f.id) }}
                        style={{
                          background: '#fff',
                          border: 'none',
                          padding: '10px 12px',
                          borderRadius: 10,
                          cursor: 'pointer',
                          minWidth: 44,
                          minHeight: 44,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 1px 2px rgba(2,6,23,0.06)',
                          outline: 'none'
                        }}
                      >
                        ⋯
                      </button>
                      {openMenuId === f.id && (
                        <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', background: '#fff', boxShadow: '0 6px 18px rgba(2,6,23,0.08)', borderRadius: 8, padding: 8, minWidth: 140, zIndex: 9999 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <button onClick={() => { setViewProfile(f); setOpenMenuId(null) }} style={{ ...actionBtn, width: '100%', textAlign: 'left' }}>View</button>
                            <button onClick={() => { startEdit(f); setOpenMenuId(null) }} style={{ ...actionBtn, width: '100%', textAlign: 'left' }}>Edit</button>
                            {tab === 'active' ? (
                              <button onClick={() => { setOpenMenuId(null); archiveFaculty(f.id) }} style={{ ...archiveBtn, width: '100%', textAlign: 'left' }}>Archive</button>
                            ) : (
                              <>
                                <button onClick={() => { setOpenMenuId(null); restoreFaculty(f.id) }} style={{ ...restoreBtn, width: '100%', textAlign: 'left' }}>Restore</button>
                                <button onClick={() => { setOpenMenuId(null); deleteFaculty(f.id) }} style={{ ...deleteBtn, width: '100%', textAlign: 'left' }}>Delete</button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 20, color: '#6b7280' }}>{loading ? 'Loading...' : (tab === 'active' ? 'No active faculty.' : 'No archived faculty.')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* form modal (create / edit) */}
      {formVisible && (
        <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 9999 }} onClick={() => cancel()}>
          <div onClick={e=>e.stopPropagation()} style={{ background: '#fff', borderRadius: 10, padding: 20, width: 'min(900px, 96%)', maxHeight: '90vh', overflow: 'auto' }}>
            <h3 style={{ marginTop: 0 }}>{editingId ? 'Edit Faculty' : 'Add Faculty'}</h3>
            <form encType="multipart/form-data" onSubmit={handleSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ gridColumn: '1 / -1', width: '100%', paddingTop: 6 }}><strong style={{ color: '#111827' }}>FACULTY INFORMATION</strong></div>
              <input name="id_number" placeholder="Employee ID (auto)" value={form.id_number} onChange={onChange} readOnly={true} style={{ padding: 10, flex: '1 1 200px', background: '#f3f4f6', cursor: 'not-allowed' }} />
              <input name="fname" placeholder="First name" value={form.fname} onChange={onChange} style={{ padding: 10, flex: '1 1 200px' }} />
              <input name="lname" placeholder="Last name" value={form.lname} onChange={onChange} style={{ padding: 10, flex: '1 1 200px' }} />
              <input name="email" placeholder="Email" value={form.email} onChange={onChange} style={{ padding: 10, flex: '1 1 260px' }} />
              <input name="contact" placeholder="Contact" value={form.contact} onChange={onChange} style={{ padding: 10, flex: '1 1 160px' }} />
              <select name="department" value={form.department} onChange={onChange} style={{ padding: 10, flex: '1 1 220px' }}>
                <option value="">Select department</option>
                {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
              </select>
              <input name="position" placeholder="Position" value={form.position} onChange={onChange} style={{ padding: 10, flex: '1 1 200px' }} />
              {/* <div style={{ gridColumn: '1 / -1', width: '100%', paddingTop: 6 }}><strong style={{ color: '#111827' }}>PERSONAL / DEMOGRAPHIC</strong></div> */}
              <select name="gender" value={form.gender} onChange={onChange} style={{ padding: 10, flex: '1 1 160px' }}>
                <option value="">Gender</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
              <input name="birthday" type="date" placeholder="Birthday" value={form.birthday} onChange={onChange} style={{ padding: 10, flex: '1 1 160px' }} />
              <input name="address" placeholder="Address" value={form.address} onChange={onChange} style={{ padding: 10, flex: '1 1 100%' }} />
              <div style={{ gridColumn: '1 / -1', width: '100%', paddingTop: 6 }}><strong style={{ color: '#111827' }}>EMPLOYMENT INFORMATION</strong></div>
              <select name="employment_type" value={form.employment_type} onChange={onChange} style={{ padding: 10, flex: '1 1 200px' }}>
                <option value="">Employment Type</option>
                <option>Full-time</option>
                <option>Part-time</option>
                <option>Contractual</option>
              </select>
              <input name="education" placeholder="Educational background" value={form.education} onChange={onChange} style={{ padding: 10, flex: '1 1 100%' }} />
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: '1 1 100%' }}>
                <input name="photo_file" ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/jpg" onChange={onFileChange} style={{ padding: 10, flex: '0 0 260px' }} />
                <input name="photo" placeholder="Or enter photo URL (optional)" value={form.photo} onChange={onChange} style={{ padding: 10, flex: '1 1 auto' }} />
                {/* preview */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 64, height: 64, borderRadius: 8, overflow: 'hidden', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {previewUrl ? (
                      <img src={previewUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      // when editing and photo removed show initials; otherwise show placeholder text
                      (editingId && form.remove_photo) ? (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', background: '#0b2340', fontWeight: 800 }}>{initials(form)}</div>
                      ) : (
                        <div style={{ color: '#9ca3af', fontSize: 12 }}>No preview</div>
                      )
                    )}
                  </div>
                  {/* (Remove-photo button removed — uploads still supported) */}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 8, width: '100%' }}>
                {editingId ? (
                  <>
                    <button type="submit" style={primaryBtn}>Save</button>
                    <button type="button" onClick={cancel} style={{ background: '#eee', padding: '8px 14px', borderRadius: 8, border: 0 }}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button type="submit" style={primaryBtn}>Create</button>
                    <button type="button" onClick={() => setFormVisible(false)} style={{ background: '#eee', padding: '8px 14px', borderRadius: 8, border: 0 }}>Close</button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Profile Modal */}
      {viewProfile && (
        <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 9999 }} onClick={() => setViewProfile(null)}>
          <div onClick={e=>e.stopPropagation()} style={{ background: '#fff', borderRadius: 10, padding: 20, width: 'min(960px, 96%)', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ width: 140, flexShrink: 0 }}>
                {viewProfile.photo ? (
                  <img src={viewProfile.photo} alt="profile" style={{ width: 140, height: 140, objectFit: 'cover', borderRadius: 8 }} />
                ) : (
                  <div style={{ width: 140, height: 140, borderRadius: 8, background: '#0b2340', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 800 }}>{initials(viewProfile)}</div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 style={{ margin: 0, color: '#0b2b4a', fontWeight: 800 }}>{viewProfile.fname} {viewProfile.lname}</h2>
                    <div style={{ color: '#374151' }}>{viewProfile.position || '—'} - {viewProfile.department || '—'}</div>
                  </div>
                  <div style={{ textAlign: 'right', color: '#6b7280' }}>Updated: {viewProfile.updated_at ? new Date(viewProfile.updated_at).toLocaleString() : (viewProfile.created_at ? new Date(viewProfile.created_at).toLocaleString() : '—')}</div>
                </div>

                <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div style={{ gridColumn: '1 / -1', paddingTop: 6 }}><strong style={{ color: '#111827' }}>FACULTY INFORMATION</strong></div>
                  <div>
                    <div style={{ color: TEXT.muted, fontWeight: 700, marginBottom: 6 }}>Email</div>
                    <div style={{ color: TEXT.body, fontWeight: 600 }}>{viewProfile.email || '—'}</div>
                  </div>
                  <div>
                    <div style={{ color: TEXT.muted, fontWeight: 700, marginBottom: 6 }}>Contact</div>
                    <div style={{ color: TEXT.body, fontWeight: 600 }}>{viewProfile.contact || '—'}</div>
                  </div>
                  <div>
                    <div style={{ color: TEXT.muted, fontWeight: 700, marginBottom: 6 }}>Gender</div>
                    <div style={{ color: TEXT.body, fontWeight: 600 }}>{viewProfile.gender || '—'}</div>
                  </div>
                  <div>
                    <div style={{ color: TEXT.muted, fontWeight: 700, marginBottom: 6 }}>Birthday</div>
                    <div style={{ color: TEXT.body, fontWeight: 600 }}>{viewProfile.birthday || '—'}</div>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ color: TEXT.muted, fontWeight: 700, marginBottom: 6 }}>Address</div>
                    <div style={{ color: TEXT.body, fontWeight: 600 }}>{viewProfile.address || '—'}</div>
                  </div>
                  <div style={{ gridColumn: '1 / -1', paddingTop: 6 }}><strong style={{ color: '#111827' }}>EMPLOYMENT INFORMATION</strong></div>
                  <div>
                    <div style={{ color: TEXT.muted, fontWeight: 700, marginBottom: 6 }}>Employment Type</div>
                    <div style={{ color: TEXT.body, fontWeight: 600 }}>{viewProfile.employment_type || '—'}</div>
                  </div>
                  <div>
                    <div style={{ color: TEXT.muted, fontWeight: 700, marginBottom: 6 }}>Education</div>
                    <div style={{ color: TEXT.body, fontWeight: 600 }}>{viewProfile.education || '—'}</div>
                  </div>
                  <div>
                    <div style={{ color: TEXT.muted, fontWeight: 700, marginBottom: 6 }}>Date Hired</div>
                    <div style={{ color: TEXT.body, fontWeight: 600 }}>{viewProfile.date_hired || viewProfile.hired_at || (viewProfile.created_at ? new Date(viewProfile.created_at).toLocaleDateString() : '—')}</div>
                  </div>
                </div>

                <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                  <button onClick={() => { startEdit(viewProfile); setViewProfile(null) }} style={primaryBtn}>Edit</button>
                  {isArchived(viewProfile) ? (
                    <button onClick={() => { restoreFaculty(viewProfile.id); setViewProfile(null) }} style={restoreBtn}>Restore</button>
                  ) : (
                    <button onClick={() => { archiveFaculty(viewProfile.id); setViewProfile(null) }} style={archiveBtn}>Archive</button>
                  )}
                  <button onClick={() => setViewProfile(null)} style={neutralBtn}>Close</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import React, { useEffect, useState, useRef } from 'react'

export default function StudentsManager() {
  const token = (() => { try { return localStorage.getItem('api_token') } catch(e){ return null } })()
  const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {}
  const [students, setStudents] = useState([])
  const [departments, setDepartments] = useState([])
  const [coursesList, setCoursesList] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [previewUrl, setPreviewUrl] = useState(null)
  const fileInputRef = useRef(null)
  const [query, setQuery] = useState('')
  const [filterCourse, setFilterCourse] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [formVisible, setFormVisible] = useState(false)
  const [form, setForm] = useState({
    student_id: '',
    fname: '',
    middle_name: '',
    lname: '',
    gender: '',
    birthday: '',
    contact: '',
    email: '',
    address: '',
    course: '',
    department: '',
    year: '',
    section: '',
    school_year: '',
    status: '',
  parent_name: '',
  parent_relationship: '',
  parent_contact: '',
  parent_address: '',
    photo: '',
    photo_file: null,
    remove_photo: false,
    id_number: ''
  })
  const [editingId, setEditingId] = useState(null)
  const [tab, setTab] = useState('active') // 'active' | 'archived'
  const [viewProfile, setViewProfile] = useState(null)
  const [openMenuId, setOpenMenuId] = useState(null)
  

  // uniform button and text styles (match FacultyManager)
  const actionBtn = { background: 'transparent', border: '1px solid #e5e7eb', padding: '6px 8px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, color: '#0b2b4a' }
  const primaryBtn = { background: '#1976d2', color: '#fff', border: 0, padding: '6px 10px', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }
  const archiveBtn = { background: '#9ca3af', color: '#fff', border: 0, padding: '6px 10px', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }
  const restoreBtn = { background: '#f59e0b', color: '#fff', border: 0, padding: '6px 10px', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }
  const deleteBtn = { background: '#e53935', color: '#fff', border: 0, padding: '6px 10px', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }
  const neutralBtn = { background: '#eee', padding: '6px 10px', borderRadius: 6, border: 0, cursor: 'pointer', color: '#0b2b4a' }
  const TEXT = { primary: '#0b2b4a', body: '#111827', muted: '#6b7280' }
  // fetch students, departments and courses on mount
  useEffect(() => { fetchStudents(); fetchDepartments(); fetchCourses() }, [])

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/courses', { headers: authHeader })
      const parsed = await safeParse(res)
      if (res.ok && parsed.json && parsed.json.data) setCoursesList(parsed.json.data)
    } catch (e) { /* ignore */ }
  }

  const normalizePhotoUrl = (photo) => {
    if (!photo) return null
    try { if (photo.startsWith('/')) return window.location.origin + photo } catch (e) {}
    return photo
  }

  const safeParse = async (res) => {
    const ct = (res.headers && res.headers.get && res.headers.get('content-type')) || ''
    if (ct.includes('application/json')) {
      try { const js = await res.json(); return { json: js, text: null } } catch (e) { const txt = await res.text().catch(() => String(e)); return { json: null, text: txt } }
    }
    const txt = await res.text().catch(() => null)
    return { json: null, text: txt }
  }

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/departments', { headers: authHeader })
      const parsed = await safeParse(res)
      if (res.ok && parsed.json && parsed.json.data) setDepartments(parsed.json.data)
    } catch (e) { /* ignore */ }
  }

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const onDepartmentChange = (e) => {
    const val = e.target.value
    // when department changes, reset selected course to avoid mismatches
    setForm(prev => ({ ...prev, department: val, course: '' }))
  }

  const onFileChange = (e) => {
    const f = e.target.files && e.target.files[0] ? e.target.files[0] : null
    setForm(prev => ({ ...prev, photo_file: f, photo: f ? '' : prev.photo, remove_photo: false }))
    try { if (previewUrl && String(previewUrl).startsWith('blob:')) { URL.revokeObjectURL(previewUrl) } } catch (e) {}
    if (f) {
      setPreviewUrl(URL.createObjectURL(f))
    } else {
      setPreviewUrl(form.photo ? normalizePhotoUrl(form.photo) : null)
    }
  }

  const fetchStudents = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/students', { headers: authHeader })
      const parsed = await safeParse(res)
      if (!res.ok) {
        const msg = (parsed.json && parsed.json.message) || parsed.text || `Failed to load students (status ${res.status})`
        throw new Error(msg)
      }
      const json = parsed.json
      if (!json) {
        setError(parsed.text || `Invalid response from server (status ${res.status})`)
        setStudents([])
        return
      }
      const list = (json.data || []).map(s => ({ ...s, photo: normalizePhotoUrl(s.photo), archived: !!s.archived }))
      setStudents(list)
      // return list so callers can use the freshly loaded data
      return list
    } catch (e) { setError(e.message || String(e)) } finally { setLoading(false) }
  }

  const onSubmit = async (e) => {
    try { if (e && e.preventDefault) e.preventDefault() } catch (e) {}
    setError('')
    try {
      let res
      if (form.photo_file) {
        const fd = new FormData()
        Object.keys(form).forEach(k => {
          if (k === 'photo_file' || k === 'remove_photo') return
          const v = form[k]
          if (v !== undefined && v !== null && v !== '') fd.append(k, v)
        })
  // append file under 'photo_file' (matches Faculty upload behavior)
  fd.append('photo_file', form.photo_file)
        try { for (const pair of fd.entries()) console.debug('createStudent fd:', pair[0], pair[1]) } catch (e) {}
        fd.append('remove_photo', form.remove_photo ? '1' : '0')
        res = await fetch('/api/students', { method: 'POST', headers: { ...authHeader, 'Accept': 'application/json' }, body: fd })
      } else {
        const payload = {}
        Object.keys(form).forEach(k => {
          if (k === 'photo_file') return
          const v = form[k]
          if (v !== undefined && v !== null && v !== '') payload[k] = v
        })
  // Keep same behavior as edit: only include non-empty fields. Add remove_photo explicitly.
  payload.remove_photo = !!form.remove_photo
        try { console.debug('createStudent payload:', payload) } catch(e) {}
        res = await fetch('/api/students', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...authHeader }, body: JSON.stringify(payload) })
      }
    const parsed = await safeParse(res)
  try { console.debug('createStudent parsed', parsed) } catch(e) {}
      if (!res.ok) {
        let msg = (parsed.json && parsed.json.message) || parsed.text || `Create failed (status ${res.status})`
        try { if (parsed.json && parsed.json.errors) { const errs = parsed.json.errors; msg = Object.keys(errs).map(k => (errs[k] || []).join(' ')).join(' ') } } catch (e) {}
        throw new Error(msg)
      }
      const js = parsed.json || null
      if (js && js.data) {
        let item = { ...js.data, photo: normalizePhotoUrl(js.data.photo) }
        const createdId = js.data.id || null
        if (createdId) {
          try {
            const one = await fetch(`/api/students/${createdId}`, { headers: { ...authHeader, 'Accept': 'application/json' } })
            const oneParsed = await safeParse(one)
            console.debug('onSubmit: single fetch result', { status: one.status, parsed: oneParsed })
            if (one.ok && oneParsed.json && oneParsed.json.data) item = { ...oneParsed.json.data, photo: normalizePhotoUrl(oneParsed.json.data.photo) }
          } catch (e) { console.debug('onSubmit: failed to fetch single record', e) }
        } else {
          console.debug('onSubmit: created response has no id field', js.data)
        }

        try {
          const refreshed = await fetchStudents()
          console.debug('onSubmit: refreshed list length', (refreshed || []).length)
          const createdStudent = (refreshed || []).find(r => {
            if (createdId && r.id == createdId) return true
            if (js.data.student_id && r.student_id == js.data.student_id) return true
            if (js.data.id_number && r.id_number == js.data.id_number) return true
            return false
          })
          if (createdStudent) {
            console.debug('onSubmit: found created student in refreshed list', createdStudent)
            item = createdStudent
          } else {
            console.debug('onSubmit: created student not found in refreshed list', js.data)
          }
        } catch (e) { console.debug('onSubmit: refresh failed', e) }

        setStudents(prev => [item, ...prev.filter(p => p.id != item.id)])
        console.debug('onSubmit: final item shown in viewProfile', item)
        setViewProfile(item)
        try { window.alert('Student created successfully') } catch(e) {}
      } else {
        await fetchStudents()
      }
  setForm({ student_id: '', fname: '', middle_name: '', lname: '', gender: '', birthday: '', contact: '', email: '', address: '', course: '', department: '', year: '', section: '', school_year: '', status: '', parent_name: '', parent_relationship: '', parent_contact: '', parent_address: '', photo: '', photo_file: null, remove_photo: false, id_number: '' })
      try { if (previewUrl && String(previewUrl).startsWith('blob:')) URL.revokeObjectURL(previewUrl) } catch (e) {}
      setPreviewUrl(null)
      try { if (fileInputRef && fileInputRef.current) fileInputRef.current.value = '' } catch (e) {}
      setFormVisible(false)
    } catch (err) { const msg = err && err.message ? err.message : String(err); setError(msg); try { window.alert(`Create failed: ${msg}`) } catch(e) {} }
  }

  

  const archiveStudent = async (id) => {
    if (!window.confirm('Are you sure you want to archive this student?')) return
    try {
      const res = await fetch(`/api/students/${id}`, { method: 'PATCH', headers: { 'Content-Type':'application/json', ...authHeader }, body: JSON.stringify({ archived: true }) })
      const parsed = await safeParse(res)
      if (!res.ok) {
        const msg = (parsed.json && parsed.json.message) || parsed.text || `Archive failed (status ${res.status})`
        throw new Error(msg)
      }
      await fetchStudents()
    } catch (err) { setError(err.message || String(err)) }
  }

  const restoreStudent = async (id) => {
    try {
      const res = await fetch(`/api/students/${id}`, { method: 'PATCH', headers: { 'Content-Type':'application/json', ...authHeader }, body: JSON.stringify({ archived: false }) })
      const parsed = await safeParse(res)
      if (!res.ok) {
        const msg = (parsed.json && parsed.json.message) || parsed.text || `Restore failed (status ${res.status})`
        throw new Error(msg)
      }
      await fetchStudents()
    } catch (err) { setError(err && err.message ? err.message : String(err)) }
  }

  const deleteStudent = async (id) => {
    if (!window.confirm('Permanently delete this student? This cannot be undone.')) return
    try {
      const res = await fetch(`/api/students/${id}`, { method: 'DELETE', headers: authHeader })
      const parsed = await safeParse(res)
      if (!res.ok) {
        const msg = (parsed.json && parsed.json.message) || parsed.text || `Delete failed (status ${res.status})`
        throw new Error(msg)
      }
      await fetchStudents()
    } catch (err) { setError(err && err.message ? err.message : String(err)) }
  }

  const startEdit = (s) => {
    setEditingId(s.id)
    setForm({
      id_number: s.id_number||'',
      student_id: s.student_id||'',
      fname: s.fname||'',
      middle_name: s.middle_name||'',
      lname: s.lname||'',
      gender: s.gender||'',
      birthday: s.birthday||'',
      contact: s.contact||'',
      email: s.email||'',
      address: s.address||'',
      course: s.course||'',
      department: s.department||'',
      
      year: s.year||'',
      section: s.section||'',
      school_year: s.school_year||'',
      status: s.status||'',
  parent_name: s.parent_name||'',
  parent_relationship: s.parent_relationship||'',
  parent_contact: s.parent_contact||'',
  parent_address: s.parent_address||'',
      photo: s.photo||'',
      photo_file: null,
      remove_photo: false
    })
    try { setPreviewUrl(s.photo ? normalizePhotoUrl(s.photo) : null) } catch (e) { setPreviewUrl(null) }
    try { if (fileInputRef && fileInputRef.current) fileInputRef.current.value = '' } catch (e) {}
    setFormVisible(true)
  }
  
  const cancel = () => { setEditingId(null); setForm({ student_id: '', fname: '', middle_name: '', lname: '', gender: '', birthday: '', contact: '', email: '', address: '', course: '', department: '', year: '', section: '', school_year: '', status: '', parent_name: '', parent_relationship: '', parent_contact: '', parent_address: '', photo: '', photo_file: null, remove_photo: false, id_number: '' }); setFormVisible(false) }

  const confirmEdit = async () => {
    console.debug('confirmEdit called, editingId=', editingId)
    if (!editingId) {
      console.debug('confirmEdit aborted: no editingId')
      return
    }
    setLoading(true)
    try {
      // Always use FormData for updates (keeps upload + fields together and
      // mirrors FacultyManager behaviour which avoids multipart vs JSON edge cases)
      const fd = new FormData()
      // append only meaningful fields (omit empty strings) so we don't trigger
      // `sometimes|required` validation on the server when the client didn't
      // intend to change a field. Keep photo_file/remove_photo handled below.
      Object.keys(form).forEach(k => {
        if (k === 'photo_file' || k === 'remove_photo') return
        const v = form[k]
        // treat empty strings or whitespace-only strings as "not provided"
        if (v === undefined || v === null) return
        if (typeof v === 'string' && v.trim() === '') return
        fd.append(k, v)
      })
    if (form.photo_file) fd.append('photo_file', form.photo_file)
      fd.append('remove_photo', form.remove_photo ? '1' : '0')
      // Laravel-friendly override for PATCH when using multipart
      fd.append('_method', 'PATCH')

  try { for (const pair of fd.entries()) console.debug('confirmEdit fd:', pair[0], pair[1]) } catch(e) {}
  console.debug('confirmEdit: sending request to', `/api/students/${editingId}`)
  const res = await fetch(`/api/students/${editingId}`, { method: 'POST', headers: { ...authHeader, 'Accept': 'application/json' }, body: fd })
    const parsed = await safeParse(res)
    try { console.debug('confirmEdit parsed', parsed) } catch(e) {}
    if (!parsed.json && parsed.text) try { console.debug('confirmEdit raw response text:', parsed.text.slice ? parsed.text.slice(0, 1000) : parsed.text) } catch(e) {}
      if (!res.ok) {
        let msg = (parsed.json && parsed.json.message) || parsed.text || `Update failed (status ${res.status})`
        try {
          if (parsed.json && parsed.json.errors) {
            const errs = parsed.json.errors
            msg = Object.keys(errs).map(k => (errs[k] || []).join(' ')).join(' ')
          }
        } catch (e) {}
        throw new Error(msg)
      }

      // After a successful update, always fetch the single, authoritative
      // student record from the server and use that to update the UI. This
      // guarantees the server-populated fields (including storage-backed
      // `photo`) are reflected in both the view modal and the table.
      let item = null
      try {
        const one = await fetch(`/api/students/${editingId}`, { headers: { ...authHeader, 'Accept': 'application/json' } })
        const oneParsed = await safeParse(one)
        try { console.debug('confirmEdit fetched single record', one.status, oneParsed) } catch(e) {}
        if (one.ok && oneParsed.json && oneParsed.json.data) {
          item = { ...oneParsed.json.data, photo: normalizePhotoUrl(oneParsed.json.data.photo) }
        }
      } catch (e) { console.debug('confirmEdit: fetch single record failed', e) }

      // fallback: if server returned the updated record in the update response
      // use that (normalized), otherwise refresh the list so the table stays in sync
      const js = parsed.json || null
      if (!item && js && js.data) {
        try {
          item = { ...js.data, photo: normalizePhotoUrl(js.data.photo) }
        } catch (e) { /* ignore */ }
      }

      if (item) {
        setStudents(prev => prev.map(p => (p.id == item.id ? item : p)))
        try { setViewProfile(item); setPreviewUrl(item.photo || null) } catch (e) {}
        try { window.alert('Student updated successfully') } catch(e) {}
      } else {
        // Last resort: refresh the whole list so UI shows latest state
        try { await fetchStudents() } catch (e) { /* ignore */ }
      }

      // ensure table is up-to-date
      try { await fetchStudents() } catch (e) {}

      cancel()
    } catch (err) { const msg = err && err.message ? err.message : String(err); console.error('confirmEdit error', err); setError(msg) } finally { setLoading(false) }
  }

  // unified submit handler: submit the form for create or edit depending on editingId
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    console.debug('handleSubmit called, editingId=', editingId)
    try {
      if (editingId) {
        await confirmEdit()
      } else {
        await onSubmit()
      }
    } catch (err) {
      console.error('handleSubmit error', err)
      setError(err && err.message ? err.message : String(err))
    }
  }

  const remove = async (id) => {
    if (!window.confirm('Delete this student?')) return
    try {
      const res = await fetch(`/api/students/${id}`, { method: 'DELETE', headers: authHeader })
      const js = await res.json()
      if (!res.ok) throw new Error(js.message || 'Delete failed')
      await fetchStudents()
    } catch (err) { setError(err.message) }
  }

  const courses = Array.from(new Set(students.map(s => s.course).filter(Boolean)))

  const filtered = students.filter(s => {
    const q = query.trim().toLowerCase()
    if (q && !(String(s.fname||'').toLowerCase().includes(q) || String(s.lname||'').toLowerCase().includes(q) || String(s.email||'').toLowerCase().includes(q) || String(s.student_id||'').toLowerCase().includes(q))) return false
    if (filterCourse && (s.course || '') !== filterCourse) return false
    if (filterDept && (s.department || '') !== filterDept) return false
    // tab filtering: only show active or archived based on tab state
    if (tab === 'active' && s.archived) return false
    if (tab === 'archived' && !s.archived) return false
    return true
  })

  const initials = (s) => {
    const a = (s.fname||'').trim().charAt(0) || ''
    const b = (s.lname||'').trim().charAt(0) || ''
    return (a+b).toUpperCase()
  }

  const formatName = (s) => {
    if (!s) return ''
    const first = (s.fname||'').trim()
    const mid = (s.middle_name||'').trim()
    const last = (s.lname||'').trim()
    const midInitial = mid ? ` ${mid.charAt(0)}.` : ''
    return `${first}${midInitial} ${last}`.trim()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0 }}>Student Management</h2>
          <div style={{ color: '#4b5563' }}>Manage student enrollments, profiles, and academic records.</div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={() => { setFormVisible(true); setEditingId(null); setForm({ student_id: '', fname: '', middle_name: '', lname: '', gender: '', birthday: '', contact: '', email: '', address: '', course: '', department: '', year: '', section: '', school_year: '', status: '', parent_name: '', parent_relationship: '', parent_contact: '', parent_address: '', photo: '', photo_file: null, remove_photo: false, id_number: '' }); setPreviewUrl(null); if (fileInputRef && fileInputRef.current) try { fileInputRef.current.value = '' } catch(e){} }} style={{ background: '#2e7d32', color: '#fff', border: 0, padding: '10px 16px', borderRadius: 8 }}>+ Add Student</button>
          
          {/* Archived toggle moved next to Add to match Faculty layout */}
          {tab === 'active' ? (
            <button onClick={() => setTab('archived')} style={{ padding: '8px 12px', borderRadius: 8, border: 0, background: 'transparent', color: '#0b2b4a', fontWeight: 700 }}>Archived Students</button>
          ) : (
            <button onClick={() => setTab('active')} style={{ padding: '8px 12px', borderRadius: 8, border: 0, background: '#1976d2', color: '#fff', fontWeight: 700 }}>Back to Active</button>
          )}
        </div>
      </div>

      <div style={{ background: '#fff', padding: 16, borderRadius: 12 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
          <input placeholder="Search by name, email, or student ID..." value={query} onChange={e => setQuery(e.target.value)} style={{ flex: 1, padding: '12px 14px', borderRadius: 8, border: '1px solid #eee' }} />
          <select value={filterCourse} onChange={e => setFilterCourse(e.target.value)} style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #eee' }}>
            <option value="">All Courses</option>
            {courses.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterDept} onChange={e => setFilterDept(e.target.value)} style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #eee' }}>
            <option value="">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
          </select>
        </div>

        <div style={{ marginTop: 8 }}>
          
          <h3 style={{ marginTop: 0 }}>{tab === 'active' ? 'Active Students' : 'Archived Students'} <span style={{ color: TEXT.primary, fontSize: 20, fontWeight: 800, marginLeft: 8 }}>({filtered.length})</span></h3>
          <div style={{ borderRadius: 8, overflow: 'visible', border: '1px solid #f0f0f0', position: 'relative' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#fafafa' }}>
                  <tr>
                    <th style={{ textAlign: 'left', padding: 16 }}>Student</th>
                    <th style={{ padding: 16 }}>Student ID</th>
                    <th style={{ padding: 16, textAlign: 'left' }}>Course</th>
                    <th style={{ padding: 16 }}>Department</th>
                    <th style={{ padding: 16 }}>Year Level</th>
                    <th style={{ padding: 16 }}>Status</th>
                    <th style={{ padding: 16 }}>Actions</th>
                  </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr key={s.id} style={{ borderTop: '1px solid #f2f2f2' }}>
                    <td style={{ padding: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 22, overflow: 'hidden', background: '#0b2340', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                        {s.photo ? (
                          <img src={normalizePhotoUrl(s.photo)} alt={formatName(s)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ color: '#fff', fontWeight: 700 }}>{initials(s)}</div>
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, color: TEXT.primary, fontSize: 15 }}>{formatName(s)}</div>
                        <div style={{ color: '#374151', fontSize: 13 }}>{s.email}</div>
                      </div>
                    </td>
                    <td style={{ padding: 14, color: '#374151' }}>{s.student_id || '—'}</td>
                    <td style={{ padding: 14, color: '#374151' }}>{s.course || '—'}</td>
                    <td style={{ padding: 14, color: '#374151' }}>{s.department || '—'}</td>
                    <td style={{ padding: 14, color: '#374151' }}>{s.year || '—'}</td>
                    <td style={{ padding: 14 }}>
                      {s.archived ? (
                        <span style={{ display: 'inline-block', padding: '6px 10px', borderRadius: 16, background: '#6b7280', color: '#fff', fontWeight: 700, fontSize: 12 }}>Archived</span>
                      ) : (
                        <span style={{ display: 'inline-block', padding: '6px 10px', borderRadius: 16, background: (s.status === 'Dropped' || s.status === 'Inactive' ? '#e57373' : '#2e7d32'), color: '#fff', fontWeight: 700, fontSize: 12 }}>{s.status || 'Enrolled'}</span>
                      )}
                    </td>
                    <td style={{ padding: 14, position: 'relative' }}>
                      <div style={{ position: 'relative', display: 'inline-block' }} onClick={e => e.stopPropagation()}>
                        <button onClick={e => { e.stopPropagation(); setOpenMenuId(openMenuId === s.id ? null : s.id) }} style={{ background: '#fff', border: 'none', padding: '10px 12px', borderRadius: 10, cursor: 'pointer', minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 2px rgba(2,6,23,0.06)', outline: 'none' }}>⋯</button>
                        {openMenuId === s.id && (
                          <div style={{ position: 'absolute', right: 0, top: 48, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 8, zIndex: 40, minWidth: 160 }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              <button onClick={() => { setViewProfile(s); setOpenMenuId(null) }} style={{ ...actionBtn, width: '100%', textAlign: 'left' }}>View</button>
                              <button onClick={() => { startEdit(s); setOpenMenuId(null) }} style={{ ...actionBtn, width: '100%', textAlign: 'left' }}>Edit</button>
                              {!s.archived ? (
                                <button onClick={() => { archiveStudent(s.id); setOpenMenuId(null) }} style={{ ...archiveBtn, width: '100%', textAlign: 'left' }}>Archive</button>
                              ) : (
                                <>
                                  <button onClick={() => { restoreStudent(s.id); setOpenMenuId(null) }} style={{ ...restoreBtn, width: '100%', textAlign: 'left' }}>Restore</button>
                                  <button onClick={() => { deleteStudent(s.id); setOpenMenuId(null) }} style={{ ...deleteBtn, width: '100%', textAlign: 'left' }}>Delete</button>
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
                    <td colSpan="7" style={{ textAlign: 'center', padding: 20, color: '#6b7280' }}>{loading ? 'Loading...' : 'No students yet.'}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {formVisible && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }} onClick={() => { setFormVisible(false); setEditingId(null); setOpenMenuId(null) }}>
          <div style={{ background: '#fff', padding: 16, borderRadius: 12, width: '80%', maxWidth: 760, maxHeight: '80vh', overflowY: 'auto', boxSizing: 'border-box' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>{editingId ? 'Edit Student' : 'Add Student'}</h3>
              <button onClick={() => { setFormVisible(false); setEditingId(null) }} style={{ background: 'transparent', border: 0, cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ gridColumn: '1 / -1', width: '100%', paddingTop: 6 }}><strong style={{ color: '#111827' }}>STUDENT INFORMATION</strong></div>
              <input name="fname" placeholder="First name" value={form.fname} onChange={onChange} style={{ padding: 10, flex: '1 1 200px' }} />
              <input name="middle_name" placeholder="Middle name" value={form.middle_name} onChange={onChange} style={{ padding: 10, flex: '1 1 160px' }} />
              <input name="lname" placeholder="Last name" value={form.lname} onChange={onChange} style={{ padding: 10, flex: '1 1 200px' }} />
              {/* Student ID is auto-generated on create (Year + 5 digits). Show editable field only when editing. */}
              {editingId ? (
                // When editing, show the Student ID but make it non-editable so
                // users cannot change the assigned YEAR+5 digit identifier.
                <input name="student_id" placeholder="Student ID" value={form.student_id} readOnly disabled style={{ padding: 10, flex: '1 1 160px', background: '#f8fafc', color: '#6b7280', cursor: 'default' }} />
              ) : (
                <input name="student_id" placeholder="Student Id (auto)" value={''} disabled style={{ padding: 10, flex: '1 1 160px', background: '#f8fafc', color: '#6b7280' }} />
              )}
              {/* Student number (id_number) retained in data but removed from form UI per request */}
              <div style={{ gridColumn: '1 / -1', width: '100%', paddingTop: 6 }}><strong style={{ color: '#111827' }}>ACADEMIC INFORMATION</strong></div>
              <select name="department" value={form.department} onChange={onDepartmentChange} style={{ padding: 10, flex: '1 1 220px' }}>
                <option value="">Select department</option>
                {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
              </select>
              <select name="course" value={form.course} onChange={onChange} style={{ padding: 10, flex: '1 1 220px' }}>
                <option value="">Select course</option>
                {Array.isArray(coursesList) && coursesList
                  .filter(c => {
                    // if no department selected, show all courses
                    if (!form.department) return true
                    const deptName = String(form.department || '').toLowerCase()
                    if (c.department && String(c.department).toLowerCase() === deptName) return true
                    if (c.department_id && departments.find(d => Number(d.id) === Number(c.department_id) && String(d.name).toLowerCase() === deptName)) return true
                    // also allow matching by department code stored on course.department
                    const deptByName = departments.find(d => String(d.name).toLowerCase() === deptName)
                    if (deptByName && c.department && String(c.department).toLowerCase() === String(deptByName.code || '').toLowerCase()) return true
                    return false
                  })
                  .map(c => <option key={c.id} value={c.name}>{(c.code ? `[${c.code}] ` : '') + (c.name || 'Unnamed Course')}</option>)}
              </select>
              {/* Major removed from form UI per request */}
              <select name="year" value={form.year} onChange={onChange} style={{ padding: 10, flex: '1 1 160px' }}>
                <option value="">Year level</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
              <input name="section" placeholder="Section" value={form.section} onChange={onChange} style={{ padding: 10, flex: '1 1 160px' }} />
              <input name="school_year" placeholder="School Year (e.g. 2024-2025)" value={form.school_year} onChange={onChange} style={{ padding: 10, flex: '1 1 200px' }} />
              <select name="status" value={form.status} onChange={onChange} style={{ padding: 10, flex: '1 1 160px' }}>
                <option value="">Status</option>
                <option value="Enrolled">Enrolled</option>
                <option value="Dropped">Dropped</option>
                <option value="Graduated">Graduated</option>
                <option value="LOA">LOA</option>
              </select>
              <select name="gender" value={form.gender} onChange={onChange} style={{ padding: 10, flex: '1 1 140px' }}>
                <option value="">Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
              {/* <input name="birthday" placeholder="Birthday (YYYY-MM-DD)" value={form.birthday} onChange={onChange} style={{ padding: 10, flex: '1 1 160px' }} /> */}
              <input name="birthday" type="date" placeholder="Birthday" value={form.birthday} onChange={onChange} style={{ padding: 10, flex: '1 1 160px' }} />
              <input name="contact" placeholder="Contact number" value={form.contact} onChange={onChange} style={{ padding: 10, flex: '1 1 160px' }} />
              <input name="email" placeholder="Email" value={form.email} onChange={onChange} style={{ padding: 10, flex: '1 1 260px' }} />
              <input name="address" placeholder="Address" value={form.address} onChange={onChange} style={{ padding: 10, flex: '1 1 100%' }} />
              <div style={{ gridColumn: '1 / -1', width: '100%', paddingTop: 6 }}><strong style={{ color: '#111827' }}>PARENT / GUARDIAN INFORMATION</strong></div>
              <input name="parent_name" placeholder="Parent / Guardian name" value={form.parent_name} onChange={onChange} style={{ padding: 10, flex: '1 1 220px' }} />
              <input name="parent_relationship" placeholder="Relationship" value={form.parent_relationship} onChange={onChange} style={{ padding: 10, flex: '1 1 160px' }} />
              <input name="parent_contact" placeholder="Contact Number" value={form.parent_contact} onChange={onChange} style={{ padding: 10, flex: '1 1 160px' }} />
              <input name="parent_address" placeholder="Address" value={form.parent_address} onChange={onChange} style={{ padding: 10, flex: '1 1 100%' }} />
              {/* <input name="parent_" placeholder="Parent  (optional)" value={form.parent_} onChange={onChange} style={{ padding: 10, flex: '1 1 220px' }} /> */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: '1 1 100%' }}>
                <input name="photo_file" ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/jpg" onChange={onFileChange} style={{ padding: 10, flex: '0 0 260px' }} />
                {/* optional URL (keeps parity with Faculty upload UI) */}
                <input name="photo" placeholder="Or enter photo URL (optional)" value={form.photo} onChange={onChange} style={{ padding: 10, flex: '1 1 auto' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 64, height: 64, borderRadius: 8, overflow: 'hidden', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {previewUrl ? (
                      <img src={previewUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      (editingId && form.remove_photo) ? (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b2340', color: '#fff', fontWeight: 700 }}>{initials(form)}</div>
                      ) : (
                        <div style={{ color: '#9ca3af', fontSize: 12 }}>No preview</div>
                      )
                    )}
                  </div>
                </div>
                {/* remove_photo checkbox intentionally omitted to match Faculty UI */}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                {editingId ? (
                    <>
                    <button type="submit" style={primaryBtn}>Save</button>
                    <button type="button" onClick={() => { setFormVisible(false); cancel() }} style={neutralBtn}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button type="submit" style={primaryBtn}>Create</button>
                    <button type="button" onClick={() => { setFormVisible(false); setEditingId(null) }} style={neutralBtn}>Close</button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {viewProfile && (
        <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 9999 }} onClick={() => setViewProfile(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 10, padding: 20, width: 'min(960px, 96%)', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ width: 140, flexShrink: 0 }}>
                {viewProfile.photo ? (
                  <img src={normalizePhotoUrl(viewProfile.photo)} alt="profile" style={{ width: 140, height: 140, objectFit: 'cover', borderRadius: 8 }} />
                ) : (
                  <div style={{ width: 140, height: 140, borderRadius: 8, background: '#0b2340', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 800 }}>{initials(viewProfile)}</div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 style={{ margin: 0, color: TEXT.primary, fontWeight: 800 }}>{formatName(viewProfile)}</h2>
                    <div style={{ color: '#374151' }}>{viewProfile.course ? `${viewProfile.course} • ${viewProfile.department || ''}` : viewProfile.department || ''}</div>
                  </div>
                  <div style={{ textAlign: 'right', color: '#6b7280' }}>Updated: {viewProfile.updated_at ? new Date(viewProfile.updated_at).toLocaleString() : (viewProfile.created_at ? new Date(viewProfile.created_at).toLocaleString() : '—')}</div>
                </div>

                <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div style={{ gridColumn: '1 / -1', paddingTop: 6 }}><strong style={{ color: '#111827' }}>STUDENT INFORMATION</strong></div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ color: '#6b7280' }}>Student ID</div>
                    <div style={{ color: '#111827', fontWeight: 700 }}>{viewProfile.student_id || (viewProfile.id_number || '—')}</div>
                  </div>

                  <div><div style={{ color: '#6b7280' }}>Email</div><div style={{ color: '#111827', fontWeight: 700 }}>{viewProfile.email || '—'}</div></div>
                  <div><div style={{ color: '#6b7280' }}>Contact</div><div style={{ color: '#111827', fontWeight: 700 }}>{viewProfile.contact || '—'}</div></div>

                  <div><div style={{ color: '#6b7280' }}>Gender</div><div style={{ color: '#111827', fontWeight: 700 }}>{viewProfile.gender || '—'}</div></div>
                  <div><div style={{ color: '#6b7280' }}>Birthday</div><div style={{ color: '#111827', fontWeight: 700 }}>{viewProfile.birthday || '—'}</div></div>

                  <div style={{ gridColumn: '1 / -1' }}><div style={{ color: '#6b7280' }}>Address</div><div style={{ color: '#111827', fontWeight: 700 }}>{viewProfile.address || '—'}</div></div>

                  <div style={{ gridColumn: '1 / -1', paddingTop: 6 }}><strong style={{ color: '#111827' }}>ACADEMIC INFORMATION</strong></div>

                  <div><div style={{ color: '#6b7280' }}>Course</div><div style={{ color: '#111827', fontWeight: 700 }}>{viewProfile.course || '—'}</div></div>
                  <div><div style={{ color: '#6b7280' }}>Department</div><div style={{ color: '#111827', fontWeight: 700 }}>{viewProfile.department || '—'}</div></div>

                  <div><div style={{ color: '#6b7280' }}>Year Level</div><div style={{ color: '#111827', fontWeight: 700 }}>{viewProfile.year || '—'}</div></div>
                  <div><div style={{ color: '#6b7280' }}>Section</div><div style={{ color: '#111827', fontWeight: 700 }}>{viewProfile.section || '—'}</div></div>

                  <div style={{ gridColumn: '1 / -1', paddingTop: 6 }}><strong style={{ color: '#111827' }}>PARENT / GUARDIAN INFO</strong></div>
                  <div style={{ gridColumn: '1 / -1' }}><div style={{ color: '#6b7280' }}>Parent / Guardian</div><div style={{ color: '#111827', fontWeight: 700 }}>{viewProfile.parent_name || '—'} {viewProfile.parent_relationship ? `(${viewProfile.parent_relationship})` : ''}</div></div>
                  <div><div style={{ color: '#6b7280' }}>Contact</div><div style={{ color: '#111827', fontWeight: 700 }}>{viewProfile.parent_contact || '—'}</div></div>
                  <div style={{ gridColumn: '1 / -1' }}><div style={{ color: '#6b7280' }}>Address</div><div style={{ color: '#111827', fontWeight: 700 }}>{viewProfile.parent_address || '—'}</div></div>
                </div>

                <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                  <button onClick={() => { startEdit(viewProfile); setViewProfile(null) }} style={primaryBtn}>Edit</button>
                  {!viewProfile.archived ? (
                    <button onClick={() => { archiveStudent(viewProfile.id); setViewProfile(null) }} style={archiveBtn}>Archive</button>
                  ) : (
                    <>
                      <button onClick={() => { restoreStudent(viewProfile.id); setViewProfile(null) }} style={restoreBtn}>Restore</button>
                      <button onClick={() => { deleteStudent(viewProfile.id); setViewProfile(null) }} style={deleteBtn}>Delete</button>
                    </>
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

import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

export default function CourseDetails(){
  const { id } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const token = (() => { try { return localStorage.getItem('api_token') } catch(e){ return null } })()
  const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {}
  const TEXT = { primary: '#0b2b4a' }
  const actionBtn = { background: 'transparent', border: '1px solid #e5e7eb', padding: '6px 8px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, color: '#0b2b4a' }
  const primaryBtn = { background: '#1976d2', color: '#fff', border: 0, padding: '6px 10px', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }
  const archiveBtn = { background: '#9ca3af', color: '#fff', border: 0, padding: '6px 10px', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }

  const [showForm, setShowForm] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', code: '', description: '', duration: '' })
  const [studentsCount, setStudentsCount] = useState(null)
  const [studentsList, setStudentsList] = useState(null)
  const [openMenuId, setOpenMenuId] = useState(null)
  const [showStudentModal, setShowStudentModal] = useState(false)
  const [viewStudent, setViewStudent] = useState(null)
  const [studentFormVisible, setStudentFormVisible] = useState(false)
  const [studentEditingId, setStudentEditingId] = useState(null)
  const [studentForm, setStudentForm] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    student_id: '',
    email: '',
    phone: '',
    course: '',
    department: '',
    year: '',
    section: '',
    status: '',
    gender: '',
    date_of_birth: '',
    guardian_name: '',
    guardian_relationship: '',
    guardian_contact: '',
    guardian_address: '',
    address: '',
    photoFile: null,
    photoPreview: null
  })

  useEffect(() => {
    let mounted = true
    if (!id) { setLoading(false); setError('No course id'); return }
    setLoading(true)
    fetch(`/api/courses/${id}`, { headers: authHeader }).then(r => r.ok ? r.json() : r.json().then(js => Promise.reject(js))).then(js => {
      if (!mounted) return
      setCourse(js && js.data ? js.data : js)
      setLoading(false)
    }).catch(err => {
      if (!mounted) return
      setError(err && err.message ? err.message : 'Failed to load course')
      setLoading(false)
    })
    return () => { mounted = false }
  }, [id])

  const openEditForm = () => {
    if (!course) return
    setEditForm({
      name: course.name || '',
      code: course.code || '',
      description: course.description || '',
      duration: course.duration || ''
    })
    setShowForm(true)
  }

  // Fetch students and compute how many are enrolled in this course
  useEffect(() => {
    let mounted = true
    if (!course) return
    // show loading for the students count
    setStudentsCount(null)
    setStudentsList(null)
    fetch(`/api/students`, { headers: authHeader }).then(r => r.ok ? r.json() : r.json().then(js => Promise.reject(js))).then(js => {
      if (!mounted) return
      const list = js && js.data ? js.data : js
      if (!Array.isArray(list)) { setStudentsCount(0); return }
      const count = list.filter(s => {
        // match by course_id if present, otherwise by course name or code
        try {
          if (s.course_id && String(s.course_id) === String(course.id)) return true
        } catch(e){}
        if (s.course && (s.course === course.name || s.course === course.code)) return true
        return false
      }).length
      const filtered = list.filter(s => {
        try {
          if (s.course_id && String(s.course_id) === String(course.id)) return true
        } catch(e){}
        if (s.course && (s.course === course.name || s.course === course.code)) return true
        return false
      })
      setStudentsList(filtered)
      setStudentsCount(filtered.length)
    }).catch(err => {
      if (!mounted) return
      setStudentsCount(0)
      setStudentsList([])
    })
    return () => { mounted = false }
  }, [course])

  const enrolled = (studentsCount !== null) ? studentsCount : (course && (course.enrolled_count || course.students_count || course.enrolled)) || 0

  // Helpers for student display
  const getDisplayName = (s) => {
    if (!s) return 'Unnamed'
    const first = s.first_name || s.fname || s.first || ''
    const last = s.last_name || s.lname || s.last || ''
    const name = (s.name && String(s.name).trim()) || (s.full_name && String(s.full_name).trim()) || ((first || last) ? `${first} ${last}`.trim() : null)
    return name || 'Unnamed'
  }

  const startStudentEdit = (s) => {
    if (!s) return
    setStudentEditingId(s.id)
    setStudentForm({
      first_name: s.first_name || s.fname || '',
      middle_name: s.middle_name || s.mname || s.middle || '',
      last_name: s.last_name || s.lname || '',
      student_id: s.student_id || s.student_number || s.id_number || s.id || '',
      email: s.email || s.contact || '',
      phone: s.phone || s.mobile || s.contact || '',
      course: s.course || course && course.name || '',
      department: s.department || (course && (course.department_name || (course.department && course.department.name))) || '',
      year: s.year || s.year_level || s.level || '',
      section: s.section || s.class_section || '',
      status: s.status || '',
      gender: s.gender || s.sex || '',
      date_of_birth: s.date_of_birth || s.birthday || s.dob || '',
      guardian_name: s.guardian_name || s.parent_name || '',
      guardian_relationship: s.guardian_relationship || s.parent_relation || s.relationship || '',
      guardian_contact: s.guardian_contact || s.parent_contact || '',
      guardian_address: s.guardian_address || s.parent_address || '',
      address: s.address || '',
      photoFile: null,
      photoPreview: s.avatar || s.photo || null
    })
    setShowStudentModal(false)
    setStudentFormVisible(true)
    setOpenMenuId(null)
  }

  const onStudentFormChange = (e) => setStudentForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const onStudentFileChange = (e) => {
    const file = e && e.target && e.target.files && e.target.files[0]
    if (!file) return setStudentForm(prev => ({ ...prev, photoFile: null, photoPreview: null }))
    const preview = URL.createObjectURL(file)
    setStudentForm(prev => ({ ...prev, photoFile: file, photoPreview: preview }))
  }

  // Close student edit modal and cleanup any object URL preview to avoid leaking
  const closeStudentForm = () => {
    try {
      const prev = studentForm && studentForm.photoPreview
      if (prev && typeof prev === 'string' && prev.startsWith && prev.startsWith('blob:')) {
        try { URL.revokeObjectURL(prev) } catch (e) { /* ignore */ }
      }
    } catch (e) {}
    // reset editing state and hide form
    setStudentForm(prev => ({ ...prev, photoFile: null, photoPreview: null }))
    setStudentEditingId(null)
    setStudentFormVisible(false)
  }

  const confirmStudentEdit = async (e) => {
    e && e.preventDefault && e.preventDefault()
    if (!studentEditingId) return
    try {
      // If there's a file selected, submit as multipart/form-data
      if (studentForm.photoFile) {
        const fd = new FormData()
        // include method override for servers that expect it
        fd.append('_method', 'PATCH')
        // append all fields
        Object.keys(studentForm).forEach(k => {
          if (k === 'photoFile' || k === 'photoPreview') return
          const v = studentForm[k]
          if (v !== undefined && v !== null) fd.append(k, v)
        })
        fd.append('photo', studentForm.photoFile)
        const res = await fetch(`/api/students/${studentEditingId}`, { method: 'POST', headers: { ...authHeader }, body: fd })
        const js = await res.json().catch(()=> ({}))
        if (!res.ok) throw new Error(js.message || 'Update failed')
        const updated = js && js.data ? js.data : { id: studentEditingId, ...studentForm }
        setStudentsList(prev => (prev || []).map(s => (String(s.id) === String(studentEditingId) ? updated : s)))
      } else {
        const payload = { ...studentForm }
        // remove preview/file props
        delete payload.photoFile; delete payload.photoPreview
        const res = await fetch(`/api/students/${studentEditingId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader }, body: JSON.stringify(payload) })
        const js = await res.json().catch(()=> ({}))
        if (!res.ok) throw new Error(js.message || 'Update failed')
        const updated = js && js.data ? js.data : { id: studentEditingId, ...payload }
        setStudentsList(prev => (prev || []).map(s => (String(s.id) === String(studentEditingId) ? updated : s)))
      }

      setStudentFormVisible(false)
      setStudentEditingId(null)
      try { window.dispatchEvent(new Event('students:changed')) } catch(e){}
    } catch (err) {
      setError(err && err.message ? err.message : String(err))
    }
  }

  const archiveStudent = async (s) => {
    const sid = s && (s.id || s.student_id)
    if (!sid) return
    if (!window.confirm('Archive this student?')) return
    try {
      const res = await fetch(`/api/students/${sid}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader }, body: JSON.stringify({ archived: true }) })
      const js = await res.json().catch(()=> ({}))
      if (!res.ok) throw new Error(js.message || 'Archive failed')
      // If server returned updated student data, use it; otherwise mark archived locally
      const updated = js && js.data ? js.data : null
      setStudentsList(prev => {
        if (!prev || !Array.isArray(prev)) return prev
        // update the matching student in-place so the row remains visible
        return prev.map(x => {
          try {
            if (String(x.id) === String(sid) || String(x.student_id) === String(sid)) {
              if (updated) return updated
              return { ...x, archived: true, status: 'Archived' }
            }
          } catch(e) {}
          return x
        })
      })
      try { window.dispatchEvent(new Event('students:changed')) } catch(e){}
      // stay on the same page — do not navigate away
    } catch (err) { setError(err && err.message ? err.message : String(err)) }
  }

  const restoreStudent = async (s) => {
    const sid = s && (s.id || s.student_id)
    if (!sid) return
    if (!window.confirm('Restore this student?')) return
    try {
      const res = await fetch(`/api/students/${sid}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader }, body: JSON.stringify({ archived: false }) })
      const js = await res.json().catch(()=> ({}))
      if (!res.ok) throw new Error(js.message || 'Restore failed')
      const updated = js && js.data ? js.data : null
      setStudentsList(prev => {
        if (!prev || !Array.isArray(prev)) return prev
        return prev.map(x => {
          try {
            if (String(x.id) === String(sid) || String(x.student_id) === String(sid)) {
              if (updated) return updated
              // revert archived flag and restore status label
              return { ...x, archived: false, status: x.status === 'Archived' ? 'Enrolled' : x.status }
            }
          } catch(e) {}
          return x
        })
      })
      try { window.dispatchEvent(new Event('students:changed')) } catch(e){}
    } catch (err) { setError(err && err.message ? err.message : String(err)) }
  }

  const formatDate = (v) => {
    if (!v) return ''
    try {
      const d = new Date(v)
      if (isNaN(d)) return String(v)
      return d.toLocaleString()
    } catch (e) { return String(v) }
  }

  const onEditChange = (e) => setEditForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const saveEdit = async (e) => {
    e && e.preventDefault && e.preventDefault()
    try {
      const res = await fetch(`/api/courses/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader }, body: JSON.stringify(editForm) })
      const js = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(js.message || 'Update failed')
      if (js && js.data) setCourse(js.data)
      else setCourse(prev => ({ ...prev, ...editForm }))
      setShowForm(false)
      try { window.dispatchEvent(new Event('courses:changed')) } catch(e){}
      // refresh the page so related lists/controllers reflect the update
      try { window.location.reload() } catch(e){}
    } catch (err) {
      setError(err && err.message ? err.message : String(err))
    }
  }

  const archiveCourse = async () => {
    if (!window.confirm('Archive this course?')) return
    try {
      const res = await fetch(`/api/courses/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader }, body: JSON.stringify({ archived: true }) })
      const js = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(js.message || 'Archive failed')
      try { window.dispatchEvent(new Event('courses:changed')) } catch(e){}
      // go back to previous page after archiving
      navigate(-1)
    } catch (err) { setError(err && err.message ? err.message : String(err)) }
  }

  const restoreCourse = async () => {
    if (!window.confirm('Restore this course?')) return
    try {
      const res = await fetch(`/api/courses/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader }, body: JSON.stringify({ archived: false }) })
      const js = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(js.message || 'Restore failed')
      setCourse(prev => ({ ...prev, archived: false }))
      try { window.dispatchEvent(new Event('courses:changed')) } catch(e){}
    } catch (err) { setError(err && err.message ? err.message : String(err)) }
  }

  const deleteCourse = async () => {
    // Permanent delete confirmation for archived courses
    if (!window.confirm('Are you sure you want to permanently delete this course? This action cannot be undone.')) return
    try {
      const res = await fetch(`/api/courses/${id}`, { method: 'DELETE', headers: { ...authHeader, 'Accept': 'application/json' } })
      const js = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(js.message || 'Delete failed')
      try { window.dispatchEvent(new Event('courses:changed')) } catch(e){}
      // navigate back after deletion
      navigate(-1)
    } catch (err) { setError(err && err.message ? err.message : String(err)) }
  }

  return (
    <div>
      {/* Header similar to Department page */}
      <div className="bg-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-6 flex items-start justify-between" style={{ position: 'relative' }}>
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900">{(course && course.name) ? course.name : `Course ${id ? `#${id}` : ''}`}</h1>
            {/* course code - make more prominent and visible */}
            <div className="mt-2 text-sm text-gray-700 font-semibold" style={{ color: TEXT.primary }}>{course && course.code ? course.code : ''}</div>

            {/* Show duration and description directly under the title as requested - use uniform, darker colors */}
            <div className="mt-4 text-sm" style={{ color: '#374151' }}>
              <div className="font-medium" style={{ color: '#374151' }}>Duration: <span className="font-semibold text-gray-900">{course && course.duration ? `${course.duration} Years` : 'N/A'}</span></div>
              <div className="mt-3 max-w-3xl" style={{ color: '#374151', lineHeight: 1.6 }}>{course && course.description ? course.description : 'No description available.'}</div>
            </div>
          </div>

          <div style={{ position: 'absolute', right: 24, top: 24, display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => navigate(-1)} style={{ background: '#fff', border: '1px solid #e5e7eb', padding: '8px 12px', borderRadius: 8, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 40, minWidth: 88, fontWeight: 800, color: TEXT.primary, boxShadow: '0 1px 2px rgba(2,6,23,0.06)' }}>Back</button>
            {/* Active course: show Edit (blue) and Archive */}
            {!course?.archived ? (
              <>
                <button onClick={() => openEditForm()} style={{ background: '#1976d2', color: '#fff', border: 0, padding: '8px 12px', borderRadius: 8, cursor: 'pointer' }}>Edit</button>
                <button onClick={() => archiveCourse()} style={{ background: '#fff', border: '1px solid #f1f1f1', padding: '8px 12px', borderRadius: 8, cursor: 'pointer' }}>Archive</button>
              </>
            ) : (
              /* Archived course: show Delete (permanent) and Restore */
              <>
                <button onClick={() => deleteCourse()} style={{ background: '#DC2626', color: '#fff', border: 0, padding: '8px 12px', borderRadius: 8 }}>Delete</button>
                <button onClick={() => restoreCourse()} style={{ background: '#fff', border: '1px solid #e5e7eb', padding: '8px 12px', borderRadius: 8, cursor: 'pointer', color: TEXT.primary, fontWeight: 700 }}>Restore</button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Edit Course modal */}
      {showForm && (
        <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 9999 }} onClick={() => { setShowForm(false) }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', padding: 16, borderRadius: 12, width: 'min(680px, 96%)', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(2,6,23,0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>Edit Course</h3>
              <button onClick={() => { setShowForm(false) }} style={{ background: 'transparent', border: 0, cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>
            {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
            <form onSubmit={saveEdit} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input name="name" placeholder="Course name" value={editForm.name} onChange={onEditChange} style={{ padding: 10, flex: '2 1 320px' }} />
              <input name="code" placeholder="Course code (e.g. CS101)" value={editForm.code} onChange={onEditChange} style={{ padding: 10, flex: '1 1 180px' }} />
              <textarea name="description" placeholder="Course description" value={editForm.description} onChange={onEditChange} style={{ padding: 10, flex: '1 1 200px', minHeight: 80 }} />
              <input name="duration" type="number" min="0" placeholder="Duration (years)" value={editForm.duration} onChange={onEditChange} style={{ padding: 10, flex: '1 1 160px' }} />
              <div style={{ display: 'flex', gap: 8, width: '100%', marginTop: 8 }}>
                <button type="submit" style={{ background: '#1976d2', color: '#fff', padding: '8px 14px', borderRadius: 8, border: 0 }}>Save</button>
                <button type="button" onClick={() => { setShowForm(false) }} style={{ background: '#eee', padding: '8px 14px', borderRadius: 8, border: 0 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="max-w-4xl">
          {loading ? (
            <div className="text-gray-500">Loading...</div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : (
            <>
              {/* Students container similar to Department page: list students belonging to this course (no surrounding white card) */}
              <div>
                {/* <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-extrabold">Students <span className="text-gray-500">({studentsCount !== null ? studentsCount : '0'})</span></h2>
                </div> */}

                <div style={{ background: '#fff', padding: 18, borderRadius: 8 }}>
                  <h3 style={{ marginTop: 0 }}>Students <span style={{ color: TEXT.primary, fontSize: 20, fontWeight: 800, marginLeft: 8 }}>({(studentsList||[]).length})</span></h3>
                  <div style={{ marginTop: 8, borderRadius: 8, overflow: 'visible', border: '1px solid #f0f0f0' }}>
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
                        {(studentsList || []).length ? (studentsList || []).map((s, idx) => {
                          const first = s.first_name || s.fname || s.first || ''
                          const last = s.last_name || s.lname || s.last || ''
                          const displayName = (s.name && String(s.name).trim()) || (s.full_name && String(s.full_name).trim()) || ((first || last) ? `${first} ${last}`.trim() : null) || 'Unnamed'
                          const email = s.email || s.contact || s.email_address || ''
                          const studentIdVal = s.student_id || s.id_number || s.student_number || s.id
                          return (
                          <tr key={s.id || idx} style={{ borderTop: '1px solid #f2f2f2' }}>
                            <td style={{ padding: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
                              <div style={{ width: 44, height: 44, borderRadius: 22, overflow: 'hidden', background: '#0b2340', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                                { (s.avatar || s.photo) ? (
                                  <img src={s.avatar || s.photo} alt={displayName } style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <div style={{ color: '#fff', fontWeight: 700 }}>{(displayName||'').split(' ').map(p=>p[0]).slice(0,2).join('')}</div>
                                )}
                              </div>
                              <div>
                                <div style={{ fontWeight: 800, color: TEXT.primary, fontSize: 15 }}>{displayName}</div>
                                <div style={{ color: '#374151', fontSize: 13 }}>{email}</div>
                              </div>
                            </td>
                            <td style={{ padding: 14, color: '#374151' }}>{studentIdVal}</td>
                            <td style={{ padding: 14, color: '#374151' }}>{s.course || '—'}</td>
                            <td style={{ padding: 14, color: '#374151' }}>{s.department || (course && course.department_name) || (course && course.department && course.department.name) || '—'}</td>
                            <td style={{ padding: 14, color: '#374151' }}>{s.year || s.year_level || s.level || '—'}</td>
                            <td style={{ padding: 14 }}>
                              {s.archived ? (
                                <span style={{ display: 'inline-block', padding: '6px 10px', borderRadius: 16, background: '#6b7280', color: '#fff', fontWeight: 700, fontSize: 12 }}>Archived</span>
                              ) : (
                                <span style={{ display: 'inline-block', padding: '6px 10px', borderRadius: 16, background: (s.status === 'Dropped' || s.status === 'Inactive' ? '#e57373' : '#2e7d32'), color: '#fff', fontWeight: 700, fontSize: 12 }}>{s.status || 'Enrolled'}</span>
                              )}
                            </td>
                            <td style={{ padding: 14, position: 'relative' }}>
                              <div style={{ position: 'relative', display: 'inline-block' }} onClick={e => e.stopPropagation()}>
                                <button onClick={e => { e.stopPropagation(); const targetId = s.id || studentIdVal; setOpenMenuId(openMenuId === targetId ? null : targetId) }} style={{ background: '#fff', border: 'none', padding: '10px 12px', borderRadius: 10, cursor: 'pointer', minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 2px rgba(2,6,23,0.06)', outline: 'none' }}>⋯</button>

                                {openMenuId === (s.id || studentIdVal) && (
                                  <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', background: '#fff', borderRadius: 8, boxShadow: '0 8px 30px rgba(2,6,23,0.12)', minWidth: 180, overflow: 'visible', zIndex: 60 }} onClick={e => e.stopPropagation()}>
                                    <button onClick={() => { setOpenMenuId(null); setViewStudent(s); setShowStudentModal(true); }}
                                      style={{ display: 'block', width: 'calc(100% - 28px)', margin: '8px 14px', padding: '10px 12px', textAlign: 'left', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontWeight: 700, color: '#0b2b4a', borderRadius: 8 }}
                                    >
                                      View
                                    </button>

                                    <button onClick={() => { setOpenMenuId(null); startStudentEdit(s) }}
                                      style={{ display: 'block', width: 'calc(100% - 28px)', margin: '8px 14px', padding: '10px 12px', textAlign: 'left', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontWeight: 700, color: '#0b2b4a', borderRadius: 8 }}
                                    >
                                      Edit
                                    </button>

                                    {s.archived ? (
                                      <button onClick={() => { setOpenMenuId(null); restoreStudent(s) }}
                                        style={{ display: 'block', width: 'calc(100% - 28px)', margin: '8px 14px', padding: '10px 12px', textAlign: 'left', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontWeight: 700, color: TEXT.primary, borderRadius: 8 }}
                                      >
                                        Restore
                                      </button>
                                    ) : (
                                      <button onClick={() => { setOpenMenuId(null); archiveStudent(s) }}
                                        style={{ display: 'block', width: 'calc(100% - 28px)', margin: '8px 14px', padding: '10px 12px', textAlign: 'left', border: '1px solid #ffe4e6', background: '#fff', cursor: 'pointer', fontWeight: 700, color: '#b91c1c', borderRadius: 8 }}
                                      >
                                        Archive
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                        }) : (
                          <tr>
                            <td colSpan={7} style={{ textAlign: 'center', padding: 20, color: '#6b7280' }}>No students found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Status card removed per request - only students list remains under the header */}
      </div>

      {/* Student view modal */}
      {showStudentModal && viewStudent && (
        <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 9999 }} onClick={() => setShowStudentModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', padding: 22, borderRadius: 12, width: 'min(900px, 96%)', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(2,6,23,0.12)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
                <div style={{ width: 120, height: 120, borderRadius: 8, overflow: 'hidden', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {viewStudent.avatar || viewStudent.photo ? (
                    <img src={viewStudent.avatar || viewStudent.photo} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ fontWeight: 800, color: '#0b2340', fontSize: 20 }}>{(getDisplayName(viewStudent)||'U').split(' ').map(p=>p[0]).slice(0,2).join('')}</div>
                  )}
                </div>

                <div style={{ minWidth: 240 }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: TEXT.primary }}>{getDisplayName(viewStudent)}</div>
                  <div style={{ marginTop: 6, color: '#374151', fontWeight: 600 }}>{(viewStudent.course || (course && course.name) || '')}{(viewStudent.course || course) ? ' • ' : ''}{(viewStudent.department || (course && course.department_name) || '')}</div>
                </div>
              </div>

              <div style={{ textAlign: 'right', color: '#6b7280' }}>
                <div style={{ fontSize: 12 }}>Updated:</div>
                <div style={{ fontWeight: 700 }}>{formatDate(viewStudent.updated_at || viewStudent.updated || viewStudent.updatedAt)}</div>
              </div>
            </div>

            <hr style={{ margin: '18px 0', border: 'none', borderTop: '1px solid #eef2f6' }} />

            {/* Two-column grid for information fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: TEXT.primary, marginBottom: 8 }}>STUDENT INFORMATION</div>
                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', rowGap: 12, columnGap: 12 }}>
                  <div style={{ color: '#6b7280' }}>Student ID</div>
                  <div style={{ fontWeight: 800 }}>{viewStudent.student_id || viewStudent.student_number || viewStudent.id || '—'}</div>

                  <div style={{ color: '#6b7280' }}>Email</div>
                  <div style={{ fontWeight: 700 }}>{viewStudent.email || viewStudent.contact || viewStudent.email_address || '—'}</div>

                  <div style={{ color: '#6b7280' }}>Gender</div>
                  <div style={{ fontWeight: 700 }}>{viewStudent.gender || viewStudent.sex || '—'}</div>

                  <div style={{ color: '#6b7280' }}>Address</div>
                  <div style={{ fontWeight: 700 }}>{viewStudent.address || viewStudent.home_address || '—'}</div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: TEXT.primary, marginBottom: 8 }}>&nbsp;</div>
                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', rowGap: 12, columnGap: 12 }}>
                  <div style={{ color: '#6b7280' }}>Contact</div>
                  <div style={{ fontWeight: 700 }}>{viewStudent.phone || viewStudent.contact || viewStudent.mobile || '—'}</div>

                  <div style={{ color: '#6b7280' }}>Birthday</div>
                  <div style={{ fontWeight: 700 }}>{formatDate(viewStudent.date_of_birth || viewStudent.birthday || viewStudent.dob)}</div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: TEXT.primary, marginBottom: 8 }}>ACADEMIC INFORMATION</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', rowGap: 12, columnGap: 12 }}>
                  <div style={{ color: '#6b7280' }}>Course</div>
                  <div style={{ fontWeight: 700 }}>{viewStudent.course || (course && course.name) || '—'}</div>

                  <div style={{ color: '#6b7280' }}>Year Level</div>
                  <div style={{ fontWeight: 700 }}>{viewStudent.year || viewStudent.year_level || viewStudent.level || '—'}</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', rowGap: 12, columnGap: 12 }}>
                  <div style={{ color: '#6b7280' }}>Department</div>
                  <div style={{ fontWeight: 700 }}>{viewStudent.department || (course && course.department_name) || '—'}</div>

                  <div style={{ color: '#6b7280' }}>Section</div>
                  <div style={{ fontWeight: 700 }}>{viewStudent.section || viewStudent.class_section || '—'}</div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: TEXT.primary, marginBottom: 8 }}>PARENT / GUARDIAN INFO</div>
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', rowGap: 12, columnGap: 12 }}>
                <div style={{ color: '#6b7280' }}>Parent / Guardian</div>
                <div style={{ fontWeight: 700 }}>{(() => {
                    const name = viewStudent.guardian_name || viewStudent.parent_name || viewStudent.guardian || '—'
                    const rel = viewStudent.guardian_relationship || viewStudent.parent_relation || viewStudent.guardian_relation || viewStudent.relationship
                    return rel ? `${name} (${rel})` : name
                  })()}</div>

                <div style={{ color: '#6b7280' }}>Contact</div>
                <div style={{ fontWeight: 700 }}>{viewStudent.guardian_contact || viewStudent.parent_contact || '—'}</div>

                <div style={{ color: '#6b7280' }}>Address</div>
                <div style={{ fontWeight: 700 }}>{viewStudent.guardian_address || viewStudent.parent_address || viewStudent.address || '—'}</div>
              </div>
            </div>

            <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
              <button onClick={() => { setShowStudentModal(false); startStudentEdit(viewStudent) }} style={{ background: '#1976d2', color: '#fff', padding: '10px 18px', borderRadius: 8, border: 0, fontWeight: 700 }}>Edit</button>
              {viewStudent && viewStudent.archived ? (
                <button onClick={() => { setShowStudentModal(false); restoreStudent(viewStudent) }} style={{ background: '#fff', border: '1px solid #e5e7eb', color: TEXT.primary, padding: '10px 18px', borderRadius: 8, fontWeight: 700 }}>Restore</button>
              ) : (
                <button onClick={() => { setShowStudentModal(false); archiveStudent(viewStudent) }} style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#0b2b4a', padding: '10px 18px', borderRadius: 8, fontWeight: 700 }}>Archive</button>
              )}
              <button onClick={() => setShowStudentModal(false)} style={{ background: '#fff', border: '1px solid #e5e7eb', color: '#0b2b4a', padding: '10px 18px', borderRadius: 8, fontWeight: 700 }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Student edit modal */}
      {studentFormVisible && (
        <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 9999 }} onClick={() => closeStudentForm()}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', padding: 22, borderRadius: 12, width: 'min(900px, 96%)', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(2,6,23,0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>Edit Student</h3>
              <button onClick={() => { closeStudentForm() }} style={{ background: 'transparent', border: 0, cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>
            {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
            <form onSubmit={confirmStudentEdit} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {/* STUDENT INFORMATION */}
              <div style={{ gridColumn: '1 / -1', fontSize: 14, fontWeight: 800, color: TEXT.primary }}>STUDENT INFORMATION</div>
              <input name="first_name" placeholder="First name" value={studentForm.first_name} onChange={onStudentFormChange} style={{ padding: 10 }} />
              <input name="middle_name" placeholder="Middle name" value={studentForm.middle_name} onChange={onStudentFormChange} style={{ padding: 10 }} />
              <input name="last_name" placeholder="Last name" value={studentForm.last_name} onChange={onStudentFormChange} style={{ padding: 10 }} />

              <input name="student_id" placeholder="Student ID" value={studentForm.student_id} onChange={onStudentFormChange} readOnly style={{ padding: 10, gridColumn: '1 / -1', background: '#f8fafc', color: '#374151', cursor: 'default' }} />

              {/* ACADEMIC INFORMATION */}
              <div style={{ gridColumn: '1 / -1', marginTop: 6, fontSize: 14, fontWeight: 800, color: TEXT.primary }}>ACADEMIC INFORMATION</div>
              <select name="course" value={studentForm.course} onChange={onStudentFormChange} style={{ padding: 10 }}>
                <option value="">Select course</option>
                <option value="[BSA] Bachelor of Science in Accountancy">[BSA] Bachelor of Science in Accountancy</option>
                <option value="[BSIT] Bachelor of Science in Information Technology">[BSIT] Bachelor of Science in Information Technology</option>
                <option value="[BSCS] Bachelor of Science in Computer Science">[BSCS] Bachelor of Science in Computer Science</option>
              </select>
              <select name="department" value={studentForm.department} onChange={onStudentFormChange} style={{ padding: 10 }}>
                <option value="">Select department</option>
                <option value="Accountancy Program">Accountancy Program</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Information Technology">Information Technology</option>
              </select>
              <select name="year" value={studentForm.year} onChange={onStudentFormChange} style={{ padding: 10 }}>
                <option value="">Year level</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>

              <input name="section" placeholder="Section (e.g. A-10)" value={studentForm.section} onChange={onStudentFormChange} style={{ padding: 10 }} />
              <select name="status" value={studentForm.status} onChange={onStudentFormChange} style={{ padding: 10 }}>
                <option value="">Status</option>
                <option value="Enrolled">Enrolled</option>
                <option value="Dropped">Dropped</option>
                <option value="Inactive">Inactive</option>
                <option value="Graduated">Graduated</option>
              </select>
              <select name="gender" value={studentForm.gender} onChange={onStudentFormChange} style={{ padding: 10 }}>
                <option value="">Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>

              <input name="date_of_birth" type="date" placeholder="Birthday" value={studentForm.date_of_birth} onChange={onStudentFormChange} style={{ padding: 10 }} />
              <input name="phone" placeholder="Contact Number" value={studentForm.phone} onChange={onStudentFormChange} style={{ padding: 10 }} />
              <input name="email" placeholder="Email" value={studentForm.email} onChange={onStudentFormChange} style={{ padding: 10 }} />

              <input name="address" placeholder="Address" value={studentForm.address} onChange={onStudentFormChange} style={{ padding: 10, gridColumn: '1 / -1' }} />

              {/* PARENT / GUARDIAN */}
              <div style={{ gridColumn: '1 / -1', marginTop: 6, fontSize: 14, fontWeight: 800, color: TEXT.primary }}>PARENT / GUARDIAN INFORMATION</div>
              <input name="guardian_name" placeholder="Parent / Guardian name" value={studentForm.guardian_name} onChange={onStudentFormChange} style={{ padding: 10 }} />
              <input name="guardian_relationship" placeholder="Relationship (e.g. Mother)" value={studentForm.guardian_relationship} onChange={onStudentFormChange} style={{ padding: 10 }} />
              <input name="guardian_contact" placeholder="Parent / Guardian contact" value={studentForm.guardian_contact} onChange={onStudentFormChange} style={{ padding: 10 }} />

              <input name="guardian_address" placeholder="Parent / Guardian address" value={studentForm.guardian_address} onChange={onStudentFormChange} style={{ padding: 10, gridColumn: '1 / -1' }} />

              {/* Profile picture upload */}
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 12, alignItems: 'center' }}>
                <input type="file" accept="image/*" onChange={onStudentFileChange} />
                {studentForm.photoPreview ? (
                  <div style={{ width: 72, height: 72, borderRadius: 8, overflow: 'hidden', background: '#eef2ff' }}>
                    <img src={studentForm.photoPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ) : null}
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, marginTop: 8 }}>
                <button type="submit" style={{ background: '#1976d2', color: '#fff', padding: '8px 14px', borderRadius: 8, border: 0 }}>Save</button>
                <button type="button" onClick={() => { closeStudentForm() }} style={{ background: '#eee', padding: '8px 14px', borderRadius: 8, border: 0 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

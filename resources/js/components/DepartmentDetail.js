import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'

export default function DepartmentDetail(){
  const { id } = useParams()
  const navigate = useNavigate()
  const token = (() => { try { return localStorage.getItem('api_token') } catch(e){ return null } })()
  const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {}
  const [dept, setDept] = useState(null)
  const [faculty, setFaculty] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', code: '', description: '', head: '', office_location: '', contact_email: '', contact_number: '' })
  const [openMenuId, setOpenMenuId] = useState(null)
  const [openStudentMenuId, setOpenStudentMenuId] = useState(null)
  const [viewFaculty, setViewFaculty] = useState(null)
  const [viewStudent, setViewStudent] = useState(null)
  const [showCourseForm, setShowCourseForm] = useState(false)
  const [showArchivedCourses, setShowArchivedCourses] = useState(false)
  const [courseForm, setCourseForm] = useState({ course_code: '', name: '', description: '', duration: '' })
  // Faculty edit form state (for Edit modal on Department page)
  const [facultyFormVisible, setFacultyFormVisible] = useState(false)
  const [facultyForm, setFacultyForm] = useState({ id_number: '', fname: '', lname: '', email: '', contact: '', department: '', position: '', gender: '', birthday: '', address: '', employment_type: '', education: '', photo: '', photo_file: null, remove_photo: false })
  const [facultyEditingId, setFacultyEditingId] = useState(null)
  const facultyFileRef = useRef(null)
  const [facultyPreviewUrl, setFacultyPreviewUrl] = useState(null)

  // Student edit form state (for Edit modal on Department page)
  const [studentFormVisible, setStudentFormVisible] = useState(false)
  const [studentForm, setStudentForm] = useState({ student_id: '', id_number: '', fname: '', middle_name: '', lname: '', gender: '', birthday: '', contact: '', email: '', address: '', course: '', department: '', year: '', section: '', status: '', parent_name: '', parent_relationship: '', parent_contact: '', parent_address: '', photo: '', photo_file: null, remove_photo: false })
  const [studentEditingId, setStudentEditingId] = useState(null)
  const studentFileRef = useRef(null)
  const [studentPreviewUrl, setStudentPreviewUrl] = useState(null)
  const [coursesList, setCoursesList] = useState([])
  const [departmentsList, setDepartmentsList] = useState([])

  const TEXT = { primary: '#0b2b4a', body: '#111827', muted: '#6b7280' }
  const actionBtn = { background: 'transparent', border: '1px solid #e5e7eb', padding: '6px 8px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, color: '#0b2b4a' }
  const primaryBtn = { background: '#1976d2', color: '#fff', border: 0, padding: '6px 10px', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }
  const archiveBtn = { background: '#9ca3af', color: '#fff', border: 0, padding: '6px 10px', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }
  const deleteBtn = { background: '#e53935', color: '#fff', border: 0, padding: '6px 10px', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }

  useEffect(() => {
    let mounted = true
    setLoading(true)
    Promise.all([
      fetch(`/api/departments/${id}`, { headers: authHeader }).then(r => r.ok ? r.json() : Promise.reject(r)),
      fetch('/api/faculty', { headers: authHeader }).then(r => r.ok ? r.json() : Promise.reject(r)).catch(() => ({ data: [] })),
      fetch('/api/students', { headers: authHeader }).then(r => r.ok ? r.json() : Promise.reject(r)).catch(() => ({ data: [] })),
      fetch('/api/courses', { headers: authHeader }).then(r => r.ok ? r.json() : Promise.reject(r)).catch(() => ({ data: [] })),
      fetch('/api/departments', { headers: authHeader }).then(r => r.ok ? r.json() : Promise.reject(r)).catch(() => ({ data: [] })),
    ]).then(([dJs, fJs, sJs, cJs, deJs]) => {
      if (!mounted) return
    setDept(dJs && dJs.data ? dJs.data : null)
  if (dJs && dJs.data) setEditForm({ name: dJs.data.name||'', code: dJs.data.code||'', description: dJs.data.description||'', head: dJs.data.head||'', office_location: dJs.data.office_location||'', contact_email: dJs.data.contact_email||'', contact_number: dJs.data.contact_number||'' })
  setFaculty(fJs && fJs.data ? fJs.data : (fJs || []))
  setStudents(sJs && sJs.data ? sJs.data : (sJs || []))
  setCoursesList(cJs && cJs.data ? cJs.data : (cJs || []))
  setDepartmentsList(deJs && deJs.data ? deJs.data : (deJs || []))
      setLoading(false)
    }).catch(err => {
      setError('Failed to load department details')
      setLoading(false)
    })
    return () => { mounted = false }
  }, [id])

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>
  if (error) return <div style={{ padding: 20, color: 'red' }}>{error}</div>
  if (!dept) return <div style={{ padding: 20 }}>Department not found.</div>

  const onEditChange = (e) => setEditForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const onCourseChange = (e) => setCourseForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const createCourse = async (e) => {
    e && e.preventDefault && e.preventDefault()
    setError('')
    try {
      // map frontend field course_code -> backend 'code'
      const payload = { name: courseForm.name, description: courseForm.description, duration: courseForm.duration, code: courseForm.course_code, department_id: dept.id }
      const res = await fetch('/api/courses', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader }, body: JSON.stringify(payload) })
      const js = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(js.message || 'Create course failed')
      // refresh department details to pick up new course
      const dres = await fetch(`/api/departments/${dept.id}`, { headers: authHeader })
      const djs = await dres.json().catch(() => ({}))
  if (dres.ok && djs && djs.data) setDept(djs.data)
  setCourseForm({ course_code: '', name: '', description: '', duration: '' })
      setShowCourseForm(false)
    } catch (e) { setError(e.message || String(e)) }
  }

  const saveEdit = async () => {
    setError('')
    try {
      const res = await fetch(`/api/departments/${dept.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader }, body: JSON.stringify(editForm) })
      const js = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(js.message || 'Update failed')
      // update local state using server response when available
      if (js && js.data) setDept(js.data)
      else setDept(prev => ({ ...prev, ...editForm }))
      setShowForm(false)
      // notify other components (DepartmentManager listens for this)
      try { window.dispatchEvent(new Event('departments:changed')) } catch(e){}
    } catch (e) { setError(e.message || String(e)) }
  }

  const deleteDept = async () => {
    if (!window.confirm('Delete this department?')) return
    try {
      const res = await fetch(`/api/departments/${dept.id}`, { method: 'DELETE', headers: authHeader })
      const js = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(js.message || 'Delete failed')
      try { window.dispatchEvent(new Event('departments:changed')) } catch(e){}
      navigate('/department')
    } catch (e) { setError(e.message || String(e)) }
  }

  const archiveDept = async () => {
    if (!window.confirm('Archive this department?')) return
    try {
      const res = await fetch(`/api/departments/${dept.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader }, body: JSON.stringify({ archived: true }) })
      const js = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(js.message || 'Archive failed')
      // notify master list and navigate back to department list after archiving
      try { window.dispatchEvent(new Event('departments:changed')) } catch(e){}
      navigate('/department')
    } catch (e) { setError(e.message || String(e)) }
  }

  const restoreDept = async () => {
    if (!window.confirm('Restore this department?')) return
    try {
      const res = await fetch(`/api/departments/${dept.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader }, body: JSON.stringify({ archived: false }) })
      const js = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(js.message || 'Restore failed')
      // update local state and notify manager
      setDept(prev => ({ ...prev, archived: false }))
      try { window.dispatchEvent(new Event('departments:changed')) } catch(e){}
    } catch (e) { setError(e.message || String(e)) }
  }

  const deptFaculty = faculty.filter(f => {
    if (!f) return false
    if (f.department_id && Number(f.department_id) === Number(dept.id)) return true
    if (f.department && String(f.department).toLowerCase() === String(dept.name).toLowerCase()) return true
    if (f.department && dept.code && String(dept.code).toLowerCase() === String(f.department).toLowerCase()) return true
    return false
  })

  const deptStudents = students.filter(s => {
    if (!s) return false
    if (s.department_id && Number(s.department_id) === Number(dept.id)) return true
    if (s.department && String(s.department).toLowerCase() === String(dept.name).toLowerCase()) return true
    if (s.department && dept.code && String(dept.code).toLowerCase() === String(s.department).toLowerCase()) return true
    return false
  })

  // Actions for faculty and students used by dropdowns
  const archiveFaculty = async (id) => {
    if (!window.confirm('Archive this faculty member?')) return
    try {
      const res = await fetch(`/api/faculty/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader }, body: JSON.stringify({ archived: true }) })
      const js = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(js.message || 'Archive failed')
      setFaculty(prev => (Array.isArray(prev) ? prev.map(p => p.id === id ? { ...p, archived: true } : p) : prev))
      setOpenMenuId(null)
    } catch (e) { setError(e.message || String(e)) }
  }

  const restoreFaculty = async (id) => {
    if (!window.confirm('Restore this faculty member?')) return
    try {
      const res = await fetch(`/api/faculty/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader }, body: JSON.stringify({ archived: false }) })
      const js = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(js.message || 'Restore failed')
      setFaculty(prev => (Array.isArray(prev) ? prev.map(p => p.id === id ? { ...p, archived: false } : p) : prev))
      setOpenMenuId(null)
    } catch (e) { setError(e.message || String(e)) }
  }

  const deleteFaculty = async (id) => {
    if (!window.confirm('Permanently delete this faculty? This cannot be undone.')) return
    try {
      const res = await fetch(`/api/faculty/${id}`, { method: 'DELETE', headers: authHeader })
      const js = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(js.message || 'Delete failed')
      setFaculty(prev => (Array.isArray(prev) ? prev.filter(p => p.id !== id) : prev))
      setOpenMenuId(null)
    } catch (e) { setError(e.message || String(e)) }
  }

  const archiveStudent = async (id) => {
    if (!window.confirm('Archive this student?')) return
    try {
      const res = await fetch(`/api/students/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader }, body: JSON.stringify({ archived: true }) })
      const js = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(js.message || 'Archive failed')
      setStudents(prev => (Array.isArray(prev) ? prev.map(p => p.id === id ? { ...p, archived: true } : p) : prev))
      setOpenStudentMenuId(null)
    } catch (e) { setError(e.message || String(e)) }
  }

  const restoreStudent = async (id) => {
    if (!window.confirm('Restore this student?')) return
    try {
      const res = await fetch(`/api/students/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader }, body: JSON.stringify({ archived: false }) })
      const js = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(js.message || 'Restore failed')
      setStudents(prev => (Array.isArray(prev) ? prev.map(p => p.id === id ? { ...p, archived: false } : p) : prev))
      setOpenStudentMenuId(null)
    } catch (e) { setError(e.message || String(e)) }
  }

  const deleteStudent = async (id) => {
    if (!window.confirm('Permanently delete this student? This cannot be undone.')) return
    try {
      const res = await fetch(`/api/students/${id}`, { method: 'DELETE', headers: authHeader })
      const js = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(js.message || 'Delete failed')
      setStudents(prev => (Array.isArray(prev) ? prev.filter(p => p.id !== id) : prev))
      setOpenStudentMenuId(null)
    } catch (e) { setError(e.message || String(e)) }
  }

  // Helpers and edit modal handling for Faculty and Students on this page
  const normalizePhotoUrl = (photo) => {
    if (!photo) return null
    try { if (photo.startsWith('/')) return window.location.origin + photo } catch (e) {}
    return photo
  }

  const onFacultyChange = (e) => {
    const t = e.target
    setFacultyForm(prev => ({ ...prev, [t.name]: t.type === 'checkbox' ? t.checked : t.value }))
  }

  const onStudentChange = (e) => {
    const t = e.target
    setStudentForm(prev => ({ ...prev, [t.name]: t.type === 'checkbox' ? t.checked : t.value }))
  }

  const onFacultyFileChange = (e) => {
    const f = e.target.files && e.target.files[0] ? e.target.files[0] : null
    setFacultyForm(prev => ({ ...prev, photo_file: f, photo: f ? '' : prev.photo, remove_photo: false }))
    try { if (facultyPreviewUrl && String(facultyPreviewUrl).startsWith('blob:')) URL.revokeObjectURL(facultyPreviewUrl) } catch(e){}
    if (f) setFacultyPreviewUrl(URL.createObjectURL(f))
    else setFacultyPreviewUrl(facultyForm.photo ? normalizePhotoUrl(facultyForm.photo) : null)
  }

  const onStudentFileChange = (e) => {
    const f = e.target.files && e.target.files[0] ? e.target.files[0] : null
    setStudentForm(prev => ({ ...prev, photo_file: f, photo: f ? '' : prev.photo, remove_photo: false }))
    try { if (studentPreviewUrl && String(studentPreviewUrl).startsWith('blob:')) URL.revokeObjectURL(studentPreviewUrl) } catch(e){}
    if (f) setStudentPreviewUrl(URL.createObjectURL(f))
    else setStudentPreviewUrl(studentForm.photo ? normalizePhotoUrl(studentForm.photo) : null)
  }

  const onStudentDepartmentChange = (e) => {
    const val = e.target.value
    setStudentForm(prev => ({ ...prev, department: val, course: '' }))
  }

  const startEdit = (item) => {
    // detect student vs faculty by presence of student_id or course keys
    if (item && (typeof item.student_id !== 'undefined' || typeof item.course !== 'undefined')) {
      // student
      setStudentEditingId(item.id)
      setStudentForm({
        student_id: item.student_id||'', id_number: item.id_number||'', fname: item.fname||'', middle_name: item.middle_name||'', lname: item.lname||'', gender: item.gender||'', birthday: item.birthday||'', contact: item.contact||'', email: item.email||'', address: item.address||'', course: item.course||'', department: item.department||'', year: item.year||'', section: item.section||'', status: item.status||'', parent_name: item.parent_name||'', parent_relationship: item.parent_relationship||'', parent_contact: item.parent_contact||'', parent_address: item.parent_address||'', photo: item.photo||'', photo_file: null, remove_photo: false
      })
      try { setStudentPreviewUrl(item.photo ? normalizePhotoUrl(item.photo) : null) } catch(e){ setStudentPreviewUrl(null) }
      try { if (studentFileRef && studentFileRef.current) studentFileRef.current.value = '' } catch(e){}
      setStudentFormVisible(true)
    } else if (item) {
      // faculty
      setFacultyEditingId(item.id)
      setFacultyForm({ id_number: item.id_number||'', fname: item.fname||'', lname: item.lname||'', email: item.email||'', contact: item.contact||'', department: item.department||'', position: item.position||'', gender: item.gender||'', birthday: item.birthday||'', address: item.address||'', employment_type: item.employment_type||'', education: item.education||'', photo: item.photo||'', photo_file: null, remove_photo: false })
      try { setFacultyPreviewUrl(item.photo ? normalizePhotoUrl(item.photo) : null) } catch(e){ setFacultyPreviewUrl(null) }
      try { if (facultyFileRef && facultyFileRef.current) facultyFileRef.current.value = '' } catch(e){}
      setFacultyFormVisible(true)
    }
  }

  const cancelFacultyEdit = () => {
    setFacultyEditingId(null)
    setFacultyForm({ id_number: '', fname: '', lname: '', email: '', contact: '', department: '', position: '', gender: '', birthday: '', address: '', employment_type: '', education: '', photo: '', photo_file: null, remove_photo: false })
    try { if (facultyPreviewUrl && String(facultyPreviewUrl).startsWith('blob:')) URL.revokeObjectURL(facultyPreviewUrl) } catch(e){}
    setFacultyPreviewUrl(null)
    try { if (facultyFileRef && facultyFileRef.current) facultyFileRef.current.value = '' } catch(e){}
    setFacultyFormVisible(false)
  }

  const cancelStudentEdit = () => {
    setStudentEditingId(null)
    setStudentForm({ student_id: '', id_number: '', fname: '', middle_name: '', lname: '', gender: '', birthday: '', contact: '', email: '', address: '', course: '', department: '', year: '', section: '', status: '', parent_name: '', parent_relationship: '', parent_contact: '', parent_address: '', photo: '', photo_file: null, remove_photo: false })
    try { if (studentPreviewUrl && String(studentPreviewUrl).startsWith('blob:')) URL.revokeObjectURL(studentPreviewUrl) } catch(e){}
    setStudentPreviewUrl(null)
    try { if (studentFileRef && studentFileRef.current) studentFileRef.current.value = '' } catch(e){}
    setStudentFormVisible(false)
  }

  const confirmFacultyEdit = async () => {
    if (!facultyEditingId) return
    setError('')
    try {
      const fd = new FormData()
      Object.keys(facultyForm).forEach(k => {
        if (k === 'photo_file' || k === 'remove_photo') return
        const v = facultyForm[k]
        fd.append(k, v === undefined || v === null ? '' : v)
      })
      if (facultyForm.photo_file) fd.append('photo_file', facultyForm.photo_file)
      fd.append('remove_photo', facultyForm.remove_photo ? '1' : '0')
      fd.append('_method', 'PATCH')
      const res = await fetch(`/api/faculty/${facultyEditingId}`, { method: 'POST', headers: { ...authHeader, 'Accept': 'application/json' }, body: fd })
      const js = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(js.message || 'Update failed')
      // fetch single record to get normalized photo url
      try {
        const one = await fetch(`/api/faculty/${facultyEditingId}`, { headers: authHeader })
        const oneJs = await one.json().catch(() => ({}))
        if (one.ok && oneJs && oneJs.data) {
          const item = { ...oneJs.data, photo: normalizePhotoUrl(oneJs.data.photo) }
          setFaculty(prev => prev.map(p => (p.id == item.id ? item : p)))
          setViewFaculty(item)
        } else {
          // fallback: optimistic update
          setFaculty(prev => prev.map(p => (p.id == facultyEditingId ? { ...p, ...facultyForm } : p)))
        }
      } catch (e) {
        setFaculty(prev => prev.map(p => (p.id == facultyEditingId ? { ...p, ...facultyForm } : p)))
      }
      cancelFacultyEdit()
    } catch (e) { setError(e.message || String(e)) }
  }

  const confirmStudentEdit = async () => {
    if (!studentEditingId) return
    setError('')
    try {
      const fd = new FormData()
      Object.keys(studentForm).forEach(k => {
        if (k === 'photo_file' || k === 'remove_photo') return
        const v = studentForm[k]
        if (v === undefined || v === null) fd.append(k, '')
        else fd.append(k, v)
      })
      if (studentForm.photo_file) fd.append('photo_file', studentForm.photo_file)
      fd.append('remove_photo', studentForm.remove_photo ? '1' : '0')
      fd.append('_method', 'PATCH')
      const res = await fetch(`/api/students/${studentEditingId}`, { method: 'POST', headers: { ...authHeader, 'Accept': 'application/json' }, body: fd })
      const js = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(js.message || 'Update failed')
      try {
        const one = await fetch(`/api/students/${studentEditingId}`, { headers: authHeader })
        const oneJs = await one.json().catch(() => ({}))
        if (one.ok && oneJs && oneJs.data) {
          const item = { ...oneJs.data, photo: normalizePhotoUrl(oneJs.data.photo) }
          setStudents(prev => prev.map(p => (p.id == item.id ? item : p)))
          setViewStudent(item)
        } else {
          setStudents(prev => prev.map(p => (p.id == studentEditingId ? { ...p, ...studentForm } : p)))
        }
      } catch (e) {
        setStudents(prev => prev.map(p => (p.id == studentEditingId ? { ...p, ...studentForm } : p)))
      }
      cancelStudentEdit()
    } catch (e) { setError(e.message || String(e)) }
  }

  return (
    <div style={{ padding: 20 }}>
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, position: 'relative' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div>
              <h1 style={{ margin: 0 }}>{dept.name}</h1>
              <div style={{ color: '#6b7280', marginTop: 6 }}>{dept.code || ''}</div>
              {/* show department contact details and short description under the header */}
              <div style={{ display: 'flex', gap: 18, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ minWidth: 160 }}>
                  <div style={{ color: TEXT.muted, fontSize: 12, fontWeight: 700 }}>Email</div>
                  <div style={{ color: TEXT.body, fontWeight: 600 }}>{dept.contact_email || '—'}</div>
                </div>
                <div style={{ minWidth: 140 }}>
                  <div style={{ color: TEXT.muted, fontSize: 12, fontWeight: 700 }}>Contact</div>
                  <div style={{ color: TEXT.body, fontWeight: 600 }}>{dept.contact_number || '—'}</div>
                </div>
                <div style={{ minWidth: 200 }}>
                  <div style={{ color: TEXT.muted, fontSize: 12, fontWeight: 700 }}>Location</div>
                  <div style={{ color: TEXT.body, fontWeight: 600 }}>{dept.office_location || '—'}</div>
                </div>
              </div>
              {dept.description ? <div style={{ color: '#4b5563', marginTop: 10 }}>{dept.description}</div> : null}

              {/* Department head + stat tiles (styled like manager stat-cards) */}
              <div style={{ marginTop: 12 }}>
                <div style={{ color: TEXT.muted, fontSize: 13 }}>Department Head:</div>
                <div style={{ fontWeight: 800, color: TEXT.primary, marginTop: 6 }}>{dept.head || '—'}</div>

                </div>
              </div>
            </div>
          </div>

  {/* stats row will be rendered in the main content area so it lines up with Courses */}

  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <button onClick={() => navigate(-1)} style={{ background: '#fff', border: '1px solid #e5e7eb', padding: '8px 12px', borderRadius: 8, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 40, minWidth: 88, fontWeight: 800, color: TEXT.primary, boxShadow: '0 1px 2px rgba(2,6,23,0.06)' }}>Back</button>
          <button onClick={() => { if (!showForm) setEditForm({ name: dept.name||'', code: dept.code||'', description: dept.description||'', head: dept.head||'', office_location: dept.office_location||'', contact_email: dept.contact_email||'', contact_number: dept.contact_number||'' }); setShowForm(s => !s) }} style={{ background: showForm ? '#f3f4f6' : '#1976d2', color: showForm ? '#111' : '#fff', border: 0, padding: '8px 12px', borderRadius: 8 }}>{showForm ? 'Cancel' : 'Edit'}</button>
          {/* On the detail page: allow Archive for active depts, and Restore for archived depts (user requested Restore button here). */}
          {!dept.archived ? (
            <button onClick={archiveDept} style={{ background: '#fff', border: '1px solid #f1f1f1', padding: '8px 12px', borderRadius: 8, cursor: 'pointer' }}>Archive</button>
          ) : (
            <button onClick={restoreDept} style={{ background: '#fff', border: '1px solid #e5e7eb', padding: '8px 12px', borderRadius: 8, cursor: 'pointer', color: TEXT.primary, fontWeight: 700 }}>Restore</button>
          )}
          {/* Add Course modal */}
          {showCourseForm && (
            <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 9999 }} onClick={() => { setShowCourseForm(false) }}>
              <div onClick={e => e.stopPropagation()} style={{ background: '#fff', padding: 16, borderRadius: 12, width: 'min(680px, 96%)', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(2,6,23,0.12)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <h3 style={{ margin: 0, fontSize: 18 }}>Add Course</h3>
                  <button onClick={() => { setShowCourseForm(false) }} style={{ background: 'transparent', border: 0, cursor: 'pointer', fontSize: 18 }}>✕</button>
                </div>
                {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
                <form onSubmit={createCourse} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <input name="name" placeholder="Course name" value={courseForm.name} onChange={onCourseChange} style={{ padding: 10, flex: '2 1 320px' }} />
                  <input name="course_code" placeholder="Course code" value={courseForm.course_code} onChange={onCourseChange} style={{ padding: 10, flex: '1 1 180px' }} />
                  <input name="duration" placeholder="Duration (e.g. 4 years)" value={courseForm.duration} onChange={onCourseChange} style={{ padding: 10, flex: '1 1 160px' }} />
                  <input name="description" placeholder="Short description" value={courseForm.description} onChange={onCourseChange} style={{ padding: 10, flex: '1 1 100%' }} />
                  <div style={{ display: 'flex', gap: 8, width: '100%', marginTop: 8 }}>
                    <button type="submit" style={{ background: '#1976d2', color: '#fff', padding: '8px 14px', borderRadius: 8, border: 0 }}>Create</button>
                    <button type="button" onClick={() => { setShowCourseForm(false); setCourseForm({ course_code: '', name: '', description: '', duration: '' }) }} style={{ background: '#eee', padding: '8px 14px', borderRadius: 8, border: 0 }}>Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}
          {/* Faculty Edit modal (copied behavior from FacultyManager) */}
          {facultyFormVisible && (
            <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 9999 }} onClick={() => { cancelFacultyEdit() }}>
              <div onClick={e => e.stopPropagation()} style={{ background: '#fff', padding: 16, borderRadius: 12, width: 'min(720px, 96%)', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(2,6,23,0.12)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <h3 style={{ margin: 0, fontSize: 18 }}>{facultyEditingId ? 'Edit Faculty' : 'Add Faculty'}</h3>
                  <button onClick={() => { cancelFacultyEdit() }} style={{ background: 'transparent', border: 0, cursor: 'pointer', fontSize: 18 }}>✕</button>
                </div>
                {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
                <form onSubmit={e => { e.preventDefault(); confirmFacultyEdit() }} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <div style={{ gridColumn: '1 / -1', width: '100%', paddingTop: 6 }}><strong style={{ color: '#111827' }}>FACULTY INFORMATION</strong></div>
                  <input name="id_number" placeholder="Employee ID" value={facultyForm.id_number} onChange={onFacultyChange} readOnly={true} style={{ padding: 10, flex: '1 1 160px', background: '#f3f4f6', cursor: 'not-allowed' }} />
                  <input name="fname" placeholder="First name" value={facultyForm.fname} onChange={onFacultyChange} style={{ padding: 10, flex: '1 1 220px' }} />
                  <input name="lname" placeholder="Last name" value={facultyForm.lname} onChange={onFacultyChange} style={{ padding: 10, flex: '1 1 220px' }} />
                  <input name="email" placeholder="Email" value={facultyForm.email} onChange={onFacultyChange} style={{ padding: 10, flex: '1 1 220px' }} />
                  <input name="contact" placeholder="Contact" value={facultyForm.contact} onChange={onFacultyChange} style={{ padding: 10, flex: '1 1 180px' }} />
                  <input name="department" placeholder="Department" value={facultyForm.department} onChange={onFacultyChange} style={{ padding: 10, flex: '1 1 220px' }} />
                  <input name="position" placeholder="Position" value={facultyForm.position} onChange={onFacultyChange} style={{ padding: 10, flex: '1 1 220px' }} />
                  <select name="gender" value={facultyForm.gender} onChange={onFacultyChange} style={{ padding: 10, flex: '1 1 160px' }}>
                    <option value="">Select gender</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                  <input type="date" name="birthday" placeholder="Birthday" value={facultyForm.birthday} onChange={onFacultyChange} style={{ padding: 10, flex: '1 1 160px' }} />
                  <input name="address" placeholder="Address" value={facultyForm.address} onChange={onFacultyChange} style={{ padding: 10, flex: '1 1 100%' }} />

                  <div style={{ gridColumn: '1 / -1', width: '100%', paddingTop: 6 }}><strong style={{ color: '#111827' }}>EMPLOYMENT INFORMATION</strong></div>
                  <select name="employment_type" value={facultyForm.employment_type} onChange={onFacultyChange} style={{ padding: 10, flex: '1 1 220px' }}>
                    <option value="">Select employment type</option>
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Contract</option>
                  </select>
                  <input name="education" placeholder="Education" value={facultyForm.education} onChange={onFacultyChange} style={{ padding: 10, flex: '1 1 220px' }} />
                  <input type="file" ref={facultyFileRef} onChange={onFacultyFileChange} style={{ padding: 10, flex: '1 1 100%' }} />

                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button type="submit" style={{ background: '#1976d2', color: '#fff', padding: '8px 14px', borderRadius: 8, border: 0 }}>Save</button>
                    <button type="button" onClick={() => cancelFacultyEdit()} style={{ background: '#eee', padding: '8px 14px', borderRadius: 8, border: 0 }}>Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Student Edit modal (copied behavior from StudentsManager) */}
          {studentFormVisible && (
            <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 9999 }} onClick={() => { cancelStudentEdit() }}>
              <div onClick={e => e.stopPropagation()} style={{ background: '#fff', padding: 16, borderRadius: 12, width: 'min(840px, 96%)', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(2,6,23,0.12)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <h3 style={{ margin: 0, fontSize: 18 }}>{studentEditingId ? 'Edit Student' : 'Add Student'}</h3>
                  <button onClick={() => { cancelStudentEdit() }} style={{ background: 'transparent', border: 0, cursor: 'pointer', fontSize: 18 }}>✕</button>
                </div>
                {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
                <form onSubmit={e => { e.preventDefault(); confirmStudentEdit() }} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <div style={{ gridColumn: '1 / -1', width: '100%', paddingTop: 6 }}><strong style={{ color: '#111827' }}>STUDENT INFORMATION</strong></div>
                  <input name="fname" placeholder="First name" value={studentForm.fname} onChange={onStudentChange} style={{ padding: 10, flex: '1 1 220px' }} />
                  <input name="middle_name" placeholder="Middle name" value={studentForm.middle_name} onChange={onStudentChange} style={{ padding: 10, flex: '1 1 160px' }} />
                  <input name="lname" placeholder="Last name" value={studentForm.lname} onChange={onStudentChange} style={{ padding: 10, flex: '1 1 220px' }} />
                  <input name="student_id" placeholder="Student ID" value={studentForm.student_id} onChange={onStudentChange} disabled={!!studentEditingId} style={{ padding: 10, flex: '1 1 160px', background: studentEditingId ? '#f3f4f6' : undefined }} />

                  <div style={{ gridColumn: '1 / -1', width: '100%', paddingTop: 6 }}><strong style={{ color: '#111827' }}>ACADEMIC INFORMATION</strong></div>
                  <select name="course" value={studentForm.course} onChange={onStudentChange} style={{ padding: 10, flex: '1 1 220px' }}>
                    <option value="">Select course</option>
                    {Array.isArray(coursesList) && coursesList
                      .filter(c => {
                        if (!studentForm.department) return true
                        const deptName = String(studentForm.department || '').toLowerCase()
                        if (c.department && String(c.department).toLowerCase() === deptName) return true
                        if (c.department_id && departmentsList.find(d => Number(d.id) === Number(c.department_id) && String(d.name).toLowerCase() === deptName)) return true
                        const deptByName = departmentsList.find(d => String(d.name).toLowerCase() === deptName)
                        if (deptByName && c.department && String(c.department).toLowerCase() === String(deptByName.code || '').toLowerCase()) return true
                        return false
                      })
                      .map(c => <option key={c.id} value={c.name}>{(c.code ? `[${c.code}] ` : '') + (c.name || 'Unnamed Course')}</option>)}
                  </select>
                  <select name="department" value={studentForm.department} onChange={onStudentDepartmentChange} style={{ padding: 10, flex: '1 1 220px' }}>
                    <option value="">Select department</option>
                    {departmentsList.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                  </select>
                  <select name="year" value={studentForm.year} onChange={onStudentChange} style={{ padding: 10, flex: '1 1 160px' }}>
                    <option value="">Year level</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                  <input name="section" placeholder="Section" value={studentForm.section} onChange={onStudentChange} style={{ padding: 10, flex: '1 1 160px' }} />
                  <select name="status" value={studentForm.status} onChange={onStudentChange} style={{ padding: 10, flex: '1 1 160px' }}>
                    <option value="">Status</option>
                    <option>Enrolled</option>
                    <option>Inactive</option>
                    <option>Dropped</option>
                  </select>
                  <select name="gender" value={studentForm.gender} onChange={onStudentChange} style={{ padding: 10, flex: '1 1 160px' }}>
                    <option value="">Select gender</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                  <input type="date" name="birthday" value={studentForm.birthday} onChange={onStudentChange} style={{ padding: 10, flex: '1 1 160px' }} />
                  <input name="contact" placeholder="Contact" value={studentForm.contact} onChange={onStudentChange} style={{ padding: 10, flex: '1 1 220px' }} />
                  <input name="email" placeholder="Email" value={studentForm.email} onChange={onStudentChange} style={{ padding: 10, flex: '1 1 220px' }} />
                  <input name="address" placeholder="Address" value={studentForm.address} onChange={onStudentChange} style={{ padding: 10, flex: '1 1 100%' }} />

                  <div style={{ gridColumn: '1 / -1', width: '100%', paddingTop: 6 }}><strong style={{ color: '#111827' }}>PARENT / GUARDIAN INFORMATION</strong></div>
                  <input name="parent_name" placeholder="Parent/Guardian name" value={studentForm.parent_name} onChange={onStudentChange} style={{ padding: 10, flex: '1 1 220px' }} />
                  <input name="parent_relationship" placeholder="Relationship" value={studentForm.parent_relationship} onChange={onStudentChange} style={{ padding: 10, flex: '1 1 160px' }} />
                  <input name="parent_contact" placeholder="Parent contact" value={studentForm.parent_contact} onChange={onStudentChange} style={{ padding: 10, flex: '1 1 220px' }} />
                  <input name="parent_address" placeholder="Parent address" value={studentForm.parent_address} onChange={onStudentChange} style={{ padding: 10, flex: '1 1 100%' }} />
                  <input type="file" ref={studentFileRef} onChange={onStudentFileChange} style={{ padding: 10, flex: '1 1 100%' }} />

                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button type="submit" style={{ background: '#1976d2', color: '#fff', padding: '8px 14px', borderRadius: 8, border: 0 }}>Save</button>
                    <button type="button" onClick={() => cancelStudentEdit()} style={{ background: '#eee', padding: '8px 14px', borderRadius: 8, border: 0 }}>Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Faculty view modal */}
      {viewFaculty && (
        <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 9999 }} onClick={() => setViewFaculty(null)}>
          <div onClick={e=>e.stopPropagation()} style={{ background: '#fff', borderRadius: 10, padding: 20, width: 'min(960px, 96%)', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ width: 140, flexShrink: 0 }}>
                {viewFaculty.photo ? (
                  <img src={viewFaculty.photo} alt="profile" style={{ width: 140, height: 140, objectFit: 'cover', borderRadius: 8 }} />
                ) : (
                  <div style={{ width: 140, height: 140, borderRadius: 8, background: '#0b2340', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 800 }}>{(viewFaculty.fname||'').charAt(0)}{(viewFaculty.lname||'').charAt(0)}</div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 style={{ margin: 0, color: TEXT.primary, fontWeight: 800 }}>{viewFaculty.fname} {viewFaculty.lname}</h2>
                    <div style={{ color: '#374151' }}>{viewFaculty.position || '—'} - {viewFaculty.department || '—'}</div>
                  </div>
                  <div style={{ textAlign: 'right', color: '#6b7280' }}>Updated: {viewFaculty.updated_at ? new Date(viewFaculty.updated_at).toLocaleString() : (viewFaculty.created_at ? new Date(viewFaculty.created_at).toLocaleString() : '—')}</div>
                </div>

                <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div style={{ gridColumn: '1 / -1', paddingTop: 6 }}><strong style={{ color: '#111827' }}>FACULTY INFORMATION</strong></div>
                  <div>
                    <div style={{ color: TEXT.muted, fontWeight: 700, marginBottom: 6 }}>Email</div>
                    <div style={{ color: TEXT.body, fontWeight: 600 }}>{viewFaculty.email || '—'}</div>
                  </div>
                  <div>
                    <div style={{ color: TEXT.muted, fontWeight: 700, marginBottom: 6 }}>Contact</div>
                    <div style={{ color: TEXT.body, fontWeight: 600 }}>{viewFaculty.contact || '—'}</div>
                  </div>
                  <div>
                    <div style={{ color: TEXT.muted, fontWeight: 700, marginBottom: 6 }}>Gender</div>
                    <div style={{ color: TEXT.body, fontWeight: 600 }}>{viewFaculty.gender || '—'}</div>
                  </div>
                  <div>
                    <div style={{ color: TEXT.muted, fontWeight: 700, marginBottom: 6 }}>Birthday</div>
                    <div style={{ color: TEXT.body, fontWeight: 600 }}>{viewFaculty.birthday || '—'}</div>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ color: TEXT.muted, fontWeight: 700, marginBottom: 6 }}>Address</div>
                    <div style={{ color: TEXT.body, fontWeight: 600 }}>{viewFaculty.address || '—'}</div>
                  </div>

                  <div style={{ gridColumn: '1 / -1', paddingTop: 6 }}><strong style={{ color: '#111827' }}>EMPLOYMENT INFORMATION</strong></div>
                  <div>
                    <div style={{ color: TEXT.muted, fontWeight: 700, marginBottom: 6 }}>Employment Type</div>
                    <div style={{ color: TEXT.body, fontWeight: 600 }}>{viewFaculty.employment_type || '—'}</div>
                  </div>
                  <div>
                    <div style={{ color: TEXT.muted, fontWeight: 700, marginBottom: 6 }}>Education</div>
                    <div style={{ color: TEXT.body, fontWeight: 600 }}>{viewFaculty.education || '—'}</div>
                  </div>
                  <div>
                    <div style={{ color: TEXT.muted, fontWeight: 700, marginBottom: 6 }}>Date Hired</div>
                    <div style={{ color: TEXT.body, fontWeight: 600 }}>{(viewFaculty.date_hired || viewFaculty.hired_at || viewFaculty.created_at) ? new Date(viewFaculty.date_hired || viewFaculty.hired_at || viewFaculty.created_at).toLocaleDateString() : '—'}</div>
                  </div>
                </div>

                <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                  <button onClick={() => { startEdit(viewFaculty); setViewFaculty(null) }} style={primaryBtn}>Edit</button>
                  <button onClick={async () => {
                      if (!window.confirm('Archive this faculty member?')) return
                      try {
                        const res = await fetch(`/api/faculty/${viewFaculty.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader }, body: JSON.stringify({ archived: true }) })
                        const js = await res.json().catch(() => ({}))
                        if (!res.ok) throw new Error(js.message || 'Archive failed')
                        // update local faculty list
                        setFaculty(prev => (Array.isArray(prev) ? prev.map(p => p.id === viewFaculty.id ? { ...p, archived: true } : p) : prev))
                        setViewFaculty(null)
                      } catch (e) { setError(e.message || String(e)) }
                    }} style={archiveBtn}>Archive</button>
                  <button onClick={() => setViewFaculty(null)} style={{ background: '#eee', padding: '8px 14px', borderRadius: 8, border: 0 }}>Close</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student view modal */}
      {viewStudent && (
        <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 9999 }} onClick={() => setViewStudent(null)}>
          <div onClick={e=>e.stopPropagation()} style={{ background: '#fff', borderRadius: 10, padding: 20, width: 'min(960px, 96%)', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ width: 140, flexShrink: 0 }}>
                {viewStudent.photo ? (
                  <img src={viewStudent.photo} alt="profile" style={{ width: 140, height: 140, objectFit: 'cover', borderRadius: 8 }} />
                ) : (
                  <div style={{ width: 140, height: 140, borderRadius: 8, background: '#0b2340', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 800 }}>{(viewStudent.fname||'').charAt(0)}{(viewStudent.lname||'').charAt(0)}</div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 style={{ margin: 0, color: TEXT.primary, fontWeight: 800 }}>{(viewStudent.fname||'') + (viewStudent.lname ? ` ${viewStudent.lname}` : '')}</h2>
                    <div style={{ color: '#374151' }}>{viewStudent.course ? `${viewStudent.course} • ${viewStudent.department || ''}` : viewStudent.department || ''}</div>
                  </div>
                  <div style={{ textAlign: 'right', color: '#6b7280' }}>Updated: {viewStudent.updated_at ? new Date(viewStudent.updated_at).toLocaleString() : (viewStudent.created_at ? new Date(viewStudent.created_at).toLocaleString() : '—')}</div>
                </div>

                <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div style={{ gridColumn: '1 / -1', paddingTop: 6 }}><strong style={{ color: '#111827' }}>STUDENT INFORMATION</strong></div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ color: TEXT.muted }}>Student ID</div>
                    <div style={{ color: TEXT.body, fontWeight: 700 }}>{viewStudent.student_id || (viewStudent.id_number || '—')}</div>
                  </div>

                  <div><div style={{ color: TEXT.muted }}>Email</div><div style={{ color: TEXT.body, fontWeight: 700 }}>{viewStudent.email || '—'}</div></div>
                  <div><div style={{ color: TEXT.muted }}>Contact</div><div style={{ color: TEXT.body, fontWeight: 700 }}>{viewStudent.contact || '—'}</div></div>

                  <div><div style={{ color: TEXT.muted }}>Gender</div><div style={{ color: TEXT.body, fontWeight: 700 }}>{viewStudent.gender || '—'}</div></div>
                  <div><div style={{ color: TEXT.muted }}>Birthday</div><div style={{ color: TEXT.body, fontWeight: 700 }}>{viewStudent.birthday || '—'}</div></div>

                  <div style={{ gridColumn: '1 / -1' }}><div style={{ color: TEXT.muted }}>Address</div><div style={{ color: TEXT.body, fontWeight: 700 }}>{viewStudent.address || '—'}</div></div>

                  <div style={{ gridColumn: '1 / -1', paddingTop: 6 }}><strong style={{ color: '#111827' }}>ACADEMIC INFORMATION</strong></div>

                  <div><div style={{ color: TEXT.muted }}>Course</div><div style={{ color: TEXT.body, fontWeight: 700 }}>{viewStudent.course || '—'}</div></div>
                  <div><div style={{ color: TEXT.muted }}>Department</div><div style={{ color: TEXT.body, fontWeight: 700 }}>{viewStudent.department || '—'}</div></div>

                  <div><div style={{ color: TEXT.muted }}>Year Level</div><div style={{ color: TEXT.body, fontWeight: 700 }}>{viewStudent.year || '—'}</div></div>
                  <div><div style={{ color: TEXT.muted }}>Section</div><div style={{ color: TEXT.body, fontWeight: 700 }}>{viewStudent.section || '—'}</div></div>

                  <div style={{ gridColumn: '1 / -1', paddingTop: 6 }}><strong style={{ color: '#111827' }}>PARENT / GUARDIAN INFO</strong></div>
                  <div style={{ gridColumn: '1 / -1' }}><div style={{ color: TEXT.muted }}>Parent / Guardian</div><div style={{ color: TEXT.body, fontWeight: 700 }}>{viewStudent.parent_name || '—'} {viewStudent.parent_relationship ? `(${viewStudent.parent_relationship})` : ''}</div></div>
                  <div><div style={{ color: TEXT.muted }}>Contact</div><div style={{ color: TEXT.body, fontWeight: 700 }}>{viewStudent.parent_contact || '—'}</div></div>
                  <div style={{ gridColumn: '1 / -1' }}><div style={{ color: TEXT.muted }}>Address</div><div style={{ color: TEXT.body, fontWeight: 700 }}>{viewStudent.parent_address || '—'}</div></div>

                </div>

                <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                  <button onClick={() => { startEdit(viewStudent); setViewStudent(null) }} style={primaryBtn}>Edit</button>
                  <button onClick={async () => {
                      if (!window.confirm('Archive this student?')) return
                      try {
                        const res = await fetch(`/api/students/${viewStudent.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader }, body: JSON.stringify({ archived: true }) })
                        const js = await res.json().catch(() => ({}))
                        if (!res.ok) throw new Error(js.message || 'Archive failed')
                        // update local students list
                        setStudents(prev => (Array.isArray(prev) ? prev.map(p => p.id === viewStudent.id ? { ...p, archived: true } : p) : prev))
                        setViewStudent(null)
                      } catch (e) { setError(e.message || String(e)) }
                    }} style={archiveBtn}>Archive</button>
                  <button onClick={() => setViewStudent(null)} style={{ background: '#eee', padding: '8px 14px', borderRadius: 8, border: 0 }}>Close</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* compact counts are shown under the Department Head in the header section above */}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
        <>
          {/* Stats row - styled like dashboard top stats; placed here so edges align with Courses container */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ background: '#fff', padding: 20, borderRadius: 12, minWidth: 220, flex: '1 1 220px', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
              <div style={{ color: TEXT.primary, fontWeight: 800, fontSize: 28 }}>{deptFaculty.length}</div>
              <div style={{ color: TEXT.body, fontSize: 13, marginTop: 8 }}>Faculty Members</div>
            </div>
            <div style={{ background: '#fff', padding: 20, borderRadius: 12, minWidth: 220, flex: '1 1 220px', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
              <div style={{ color: TEXT.primary, fontWeight: 800, fontSize: 28 }}>{deptStudents.length}</div>
              <div style={{ color: TEXT.body, fontSize: 13, marginTop: 8 }}>Students</div>
            </div>
            <div style={{ background: '#fff', padding: 20, borderRadius: 12, minWidth: 220, flex: '1 1 220px', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
              <div style={{ color: TEXT.primary, fontWeight: 800, fontSize: 28 }}>{(dept.courses && dept.courses.length) ? dept.courses.length : 0}</div>
              <div style={{ color: TEXT.body, fontSize: 13, marginTop: 8 }}>Courses</div>
            </div>
          </div>
          {/* Edit modal popup - keeps UI consistent with DepartmentManager */}
          {showForm && (
            <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 9999 }} onClick={() => { setShowForm(false) }}>
              <div onClick={e => e.stopPropagation()} style={{ background: '#fff', padding: 16, borderRadius: 12, width: 'min(880px, 96%)', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(2,6,23,0.12)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <h3 style={{ margin: 0, fontSize: 18 }}>Edit Department</h3>
                  <button onClick={() => { setShowForm(false) }} style={{ background: 'transparent', border: 0, cursor: 'pointer', fontSize: 18 }}>✕</button>
                </div>
                {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
                <form onSubmit={e => { e.preventDefault(); saveEdit() }} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <div style={{ gridColumn: '1 / -1', width: '100%', paddingTop: 6 }}><strong style={{ color: '#111827' }}>DEPARTMENT INFORMATION</strong></div>
                  <input name="name" placeholder="Department name" value={editForm.name} onChange={onEditChange} style={{ padding: 10, flex: '1 1 220px' }} />
                  <input name="code" placeholder="Code (e.g. CSP, AP)" value={editForm.code} onChange={onEditChange} style={{ padding: 10, flex: '1 1 140px' }} />
                  <input name="head" placeholder="Department head" value={editForm.head} onChange={onEditChange} style={{ padding: 10, flex: '1 1 220px' }} />

                  <div style={{ gridColumn: '1 / -1', width: '100%', paddingTop: 6 }}><strong style={{ color: '#111827' }}>CONTACT INFORMATION</strong></div>
                  <input name="office_location" placeholder="Office location (e.g. Main Bldg 2nd floor)" value={editForm.office_location} onChange={onEditChange} style={{ padding: 10, flex: '1 1 220px' }} />
                  <input name="contact_email" placeholder="Contact email (department)" value={editForm.contact_email} onChange={onEditChange} style={{ padding: 10, flex: '1 1 220px' }} />
                  <input name="contact_number" placeholder="Contact phone (landline)" value={editForm.contact_number} onChange={onEditChange} style={{ padding: 10, flex: '1 1 160px' }} />

                  <input name="description" placeholder="Short description" value={editForm.description} onChange={onEditChange} style={{ padding: 10, flex: '1 1 100%' }} />
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button type="submit" style={{ background: '#1976d2', color: '#fff', padding: '8px 14px', borderRadius: 8, border: 0 }}>Save</button>
                    <button type="button" onClick={() => setShowForm(false)} style={{ background: '#eee', padding: '8px 14px', borderRadius: 8, border: 0 }}>Cancel</button>
                    {/* <button type="button" onClick={deleteDept} style={{ background: '#ffe5e5', padding: '8px 14px', borderRadius: 8, border: 0, color: '#a00' }}>Delete</button> */}
                  </div>
                </form>
              </div>
            </div>
          )}
            {/* Courses container */}
            <div style={{ background: '#fff', padding: 18, borderRadius: 8, position: 'relative', overflow: 'visible' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ marginTop: 0 }}>Courses <span style={{ color: TEXT.primary, fontSize: 20, fontWeight: 800, marginLeft: 8 }}>({(dept.courses && dept.courses.length) ? dept.courses.length : 0})</span></h3>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button onClick={() => setShowCourseForm(true)} style={{ background: '#1976d2', color: '#fff', border: 0, padding: '10px 14px', borderRadius: 10, boxShadow: '0 6px 18px rgba(2,6,23,0.12)', transform: 'translateY(-8px)', cursor: 'pointer' }}>+ Add Course</button>
                    <button onClick={() => setShowArchivedCourses(v => !v)} style={{ background: '#fff', border: '1px solid #e5e7eb', color: TEXT.primary, fontWeight: 700, padding: '10px 14px', borderRadius: 10, boxShadow: '0 6px 18px rgba(2,6,23,0.06)', transform: 'translateY(-8px)', cursor: 'pointer' }}>{showArchivedCourses ? 'View Active' : 'Archived Courses'}</button>
                  </div>
                </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(() => {
                  const list = Array.isArray(dept.courses) ? dept.courses.filter(c => {
                    if (!c) return false
                    if (typeof c === 'string') return !showArchivedCourses
                    return !!c.archived === !!showArchivedCourses
                  }) : []
                  return (list && list.length) ? list.map((c, i) => (
                    typeof c === 'string' ? (
                      <div key={i} style={{ background: '#f3f4f6', padding: 12, borderRadius: 8 }}>
                        <div style={{ fontWeight: 700 }}>{c}</div>
                      </div>
                    ) : (
                      <Link key={i} to={`/courses/details/${c.id}`} style={{ display: 'block', background: '#f3f4f6', padding: 12, borderRadius: 8, textDecoration: 'none', color: 'inherit' }}>
                        {c.code ? <div style={{ color: TEXT.muted, fontWeight: 700, fontSize: 12, marginBottom: 6 }}>{c.code}</div> : null}
                        <div>
                          <div style={{ fontWeight: 800, color: TEXT.primary }}>{c.name || c.title || 'Untitled Course'}</div>
                        </div>
                        {c.description ? <div style={{ color: '#374151', marginTop: 6 }}>{c.description}</div> : null}
                        {c.duration ? <div style={{ color: '#6b7280', marginTop: 6, fontSize: 13 }}>Duration: {c.duration}</div> : null}
                      </Link>
                    )
                  )) : <div style={{ color: '#6b7280' }}>No courses listed.</div>
                })()}
              
              {/* Course creation is now handled in a modal - see modal markup below */}
              </div>
            </div>

            {/* Faculty container (table rows matching main Faculty layout) */}
            <div style={{ background: '#fff', padding: 18, borderRadius: 8 }}>
              <h3 style={{ marginTop: 0 }}>Faculty Members <span style={{ color: TEXT.primary, fontSize: 20, fontWeight: 800, marginLeft: 8 }}>({deptFaculty.length})</span></h3>
              <div style={{ marginTop: 8, borderRadius: 8, overflow: 'visible', border: '1px solid #f0f0f0' }}>
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
                    {deptFaculty.length ? deptFaculty.map((f) => (
                      <tr key={f.id} style={{ borderTop: '1px solid #f2f2f2' }}>
                        <td style={{ padding: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
                          {f.photo ? (
                            <img src={f.photo} alt="avatar" style={{ width: 44, height: 44, borderRadius: 22, objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: 44, height: 44, borderRadius: 22, background: '#0b2340', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{(f.fname||'').charAt(0).toUpperCase()}{(f.lname||'').charAt(0).toUpperCase()}</div>
                          )}
                          <div>
                            <div style={{ fontWeight: 800, color: '#0b2b4a', fontSize: 15 }}>{f.fname} {f.lname}</div>
                            <div style={{ color: '#374151', fontSize: 13 }}>{f.email}</div>
                          </div>
                        </td>
                        <td style={{ padding: 12, color: TEXT.body, fontWeight: 700 }}>{f.id_number || '—'}</td>
                        <td style={{ padding: 12, color: TEXT.body }}>{f.department || '—'}</td>
                        <td style={{ padding: 12, color: TEXT.body }}>{f.position || '—'}</td>
                        <td style={{ padding: 12 }}>
                          <span style={{ display: 'inline-block', padding: '6px 10px', borderRadius: 16, background: (f.archived ? '#9ca3af' : (f.status === 'On Leave' ? '#ffb74d' : '#2e7d32')), color: '#fff', fontWeight: 700, fontSize: 12 }}>{f.archived ? 'Archived' : (f.status || 'Active')}</span>
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
                              <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', background: '#fff', boxShadow: '0 6px 18px rgba(2,6,23,0.08)', borderRadius: 8, padding: 8, minWidth: 160, zIndex: 9999 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                  <button onClick={() => { setViewFaculty(f); setOpenMenuId(null) }} style={{ ...actionBtn, width: '100%', textAlign: 'left' }}>View</button>
                                  <button onClick={() => { startEdit(f); setOpenMenuId(null) }} style={{ ...actionBtn, width: '100%', textAlign: 'left' }}>Edit</button>
                                  {f.archived ? (
                                    <>
                                      <button onClick={() => { restoreFaculty(f.id) }} style={{ ...actionBtn, width: '100%', textAlign: 'left' }}>Restore</button>
                                      <button onClick={() => { deleteFaculty(f.id) }} style={{ background: '#fee2e2', color: '#a00', width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 6, border: 'none' }}>Delete</button>
                                    </>
                                  ) : (
                                    <button onClick={() => { archiveFaculty(f.id) }} style={{ ...archiveBtn, width: '100%', textAlign: 'left' }}>Archive</button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: 20, color: '#6b7280' }}>No faculty listed</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Students container (table rows matching Student layout) */}
            <div style={{ background: '#fff', padding: 18, borderRadius: 8 }}>
              <h3 style={{ marginTop: 0 }}>Students <span style={{ color: TEXT.primary, fontSize: 20, fontWeight: 800, marginLeft: 8 }}>({deptStudents.length})</span></h3>
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
                    {deptStudents.length ? deptStudents.map((s) => (
                      <tr key={s.id} style={{ borderTop: '1px solid #f2f2f2' }}>
                        <td style={{ padding: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
                          <div style={{ width: 44, height: 44, borderRadius: 22, overflow: 'hidden', background: '#0b2340', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                            {s.photo ? (
                              <img src={s.photo} alt={(s.fname||'')+' '+(s.lname||'')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ color: '#fff', fontWeight: 700 }}>{(s.fname||'').charAt(0).toUpperCase()}{(s.lname||'').charAt(0).toUpperCase()}</div>
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: TEXT.primary, fontSize: 15 }}>{(s.fname||'') + (s.lname ? ` ${s.lname}` : '')}</div>
                            <div style={{ color: '#374151', fontSize: 13 }}>{s.email}</div>
                          </div>
                        </td>
                        <td style={{ padding: 14, color: '#374151' }}>{s.student_id || (s.id_number || '—')}</td>
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
                            <button onClick={e => { e.stopPropagation(); setOpenStudentMenuId(openStudentMenuId === s.id ? null : s.id) }} style={{ background: '#fff', border: 'none', padding: '10px 12px', borderRadius: 10, cursor: 'pointer', minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 2px rgba(2,6,23,0.06)', outline: 'none' }}>⋯</button>
                            {openStudentMenuId === s.id && (
                              <div style={{ position: 'absolute', right: 0, top: 48, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 8, zIndex: 40, minWidth: 160 }} onClick={e => e.stopPropagation()}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                  <button onClick={() => { setViewStudent(s); setOpenStudentMenuId(null) }} style={{ ...actionBtn, width: '100%', textAlign: 'left' }}>View</button>
                                  <button onClick={() => { startEdit(s); setOpenStudentMenuId(null) }} style={{ ...actionBtn, width: '100%', textAlign: 'left' }}>Edit</button>
                                  {s.archived ? (
                                    <>
                                      <button onClick={() => { restoreStudent(s.id) }} style={{ ...actionBtn, width: '100%', textAlign: 'left' }}>Restore</button>
                                      <button onClick={() => { deleteStudent(s.id) }} style={{ background: '#fee2e2', color: '#a00', width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 6, border: 'none' }}>Delete</button>
                                    </>
                                  ) : (
                                    <button onClick={() => { archiveStudent(s.id) }} style={{ ...archiveBtn, width: '100%', textAlign: 'left' }}>Archive</button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: 20, color: '#6b7280' }}>No students found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        
      </div>
    </div>
  )
}

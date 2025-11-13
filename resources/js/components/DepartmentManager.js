import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function DepartmentManager() {
  const token = (() => { try { return localStorage.getItem('api_token') } catch(e){ return null } })()
  const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {}
  const [departments, setDepartments] = useState([])
  const [faculty, setFaculty] = useState([])
  const [students, setStudents] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', code: '', description: '', head: '', office_location: '', contact_email: '', contact_number: '' })
  const [editingId, setEditingId] = useState(null)
  const TEXT = { primary: '#0b2b4a', muted: '#6b7280', body: '#374151' }
  const [notification, setNotification] = useState(null)
  const [showArchived, setShowArchived] = useState(false)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [dRes, fRes, sRes, cRes] = await Promise.all([
        fetch('/api/departments', { headers: authHeader }),
        fetch('/api/faculty', { headers: authHeader }),
        fetch('/api/students', { headers: authHeader }),
        fetch('/api/courses', { headers: authHeader }),
      ])
      const [dJs, fJs, sJs, cJs] = await Promise.all([dRes.json().catch(() => ({})), fRes.json().catch(() => ({})), sRes.json().catch(() => ({})), cRes.json().catch(() => ({}))])
      if (!dRes.ok) throw new Error(dJs.message || 'Failed to load departments')
      setDepartments(dJs.data || [])
      setFaculty(Array.isArray(fJs.data) ? fJs.data : (fJs || []))
      setStudents(Array.isArray(sJs.data) ? sJs.data : (sJs || []))
      setCourses(Array.isArray(cJs.data) ? cJs.data : (cJs || []))
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])
  useEffect(() => {
    const handler = () => { fetchAll() }
    window.addEventListener('departments:changed', handler)
    return () => window.removeEventListener('departments:changed', handler)
  }, [])
  const navigate = useNavigate()

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const createDept = async (e) => {
    e.preventDefault(); setError('')
    try {
  const res = await fetch('/api/departments', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader }, body: JSON.stringify(form) })
      const js = await res.json()
      if (!res.ok) throw new Error(js.message || 'Create failed')
      setForm({ name: '', code: '', description: '', head: '', office_location: '', contact_email: '', contact_number: '' })
      setShowForm(false)
      await fetchAll()
      // show notification briefly
      try { setNotification('Department created') ; setTimeout(() => setNotification(null), 2500) } catch(e){}
    } catch (err) { setError(err.message) }
  }

  const startEdit = (d) => { setEditingId(d.id); setForm({ name: d.name||'', code: d.code||'', description: d.description||'', head: d.head||'', office_location: d.office_location||'', contact_email: d.contact_email||'', contact_number: d.contact_number||'' }); setShowForm(true) }
  const cancel = () => { setEditingId(null); setForm({ name: '', code: '', description: '', head: '', office_location: '', contact_email: '', contact_number: '' }); setShowForm(false) }

  const confirmEdit = async () => {
    if (!editingId) return
    try {
  const res = await fetch(`/api/departments/${editingId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader }, body: JSON.stringify(form) })
      const js = await res.json()
      if (!res.ok) throw new Error(js.message || 'Update failed')
      cancel(); await fetchAll()
      try { setNotification('Department updated'); setTimeout(() => setNotification(null), 2500) } catch(e){}
    } catch (err) { setError(err.message) }
  }

  const remove = async (id) => {
    if (!window.confirm('Delete this department?')) return
    try {
  const res = await fetch(`/api/departments/${id}`, { method: 'DELETE', headers: authHeader })
      const js = await res.json()
      if (!res.ok) throw new Error(js.message || 'Delete failed')
      await fetchAll()
    } catch (err) { setError(err.message) }
  }

  const restoreDepartment = async (e, id) => {
    if (e && e.stopPropagation) e.stopPropagation()
    if (!window.confirm('Restore this department?')) return
    try {
      const res = await fetch(`/api/departments/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader }, body: JSON.stringify({ archived: false }) })
      const js = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(js.message || 'Restore failed')
      await fetchAll()
      try { setNotification('Department restored'); setTimeout(() => setNotification(null), 2500) } catch(e){}
    } catch (err) { setError(err.message) }
  }
  

  // helper: group counts by department name or code
  const computeCounts = () => {
  const byDept = {}
  departments.forEach(d => { byDept[d.id] = { dept: d, faculty: 0, students: 0, courses: 0 } })

    // try to count faculty by matching department name or code
    faculty.forEach(f => {
      const match = departments.find(d => {
        if (!d) return false
        if (f.department && String(d.name).toLowerCase() === String(f.department).toLowerCase()) return true
        if (f.department && d.code && String(d.code).toLowerCase() === String(f.department).toLowerCase()) return true
        if (f.department_id && d.id && Number(f.department_id) === Number(d.id)) return true
        return false
      })
      if (match) byDept[match.id].faculty++
    })

    students.forEach(s => {
      const match = departments.find(d => {
        if (!d) return false
        if (s.department && String(d.name).toLowerCase() === String(s.department).toLowerCase()) return true
        if (s.department && d.code && String(d.code).toLowerCase() === String(s.department).toLowerCase()) return true
        if (s.department_id && d.id && Number(s.department_id) === Number(d.id)) return true
        return false
      })
      if (match) byDept[match.id].students++
    })

    // count courses per department (match by department_id or by name/code)
    courses.forEach(c => {
      const match = departments.find(d => {
        if (!d) return false
        if (c.department_id && d.id && Number(c.department_id) === Number(d.id)) return true
        if (c.department && String(d.name).toLowerCase() === String(c.department).toLowerCase()) return true
        if (c.department && d.code && String(d.code).toLowerCase() === String(c.department).toLowerCase()) return true
        return false
      })
      if (match) byDept[match.id].courses++
    })

    // fallback: if department object includes counts, use them
    Object.values(byDept).forEach(b => {
      if (b.dept && (b.dept.faculty_count || b.dept.students_count || b.dept.courses_count)) {
        b.faculty = b.dept.faculty_count || b.faculty
        b.students = b.dept.students_count || b.students
        b.courses = b.dept.courses_count || b.courses
      }
    })

    return byDept
  }

  const totals = {
    totalDepartments: departments.length,
    totalFaculty: faculty.length,
    totalStudents: students.length,
    totalCourses: courses.length,
    avgFacultyPerDept: departments.length ? Math.round(faculty.length / departments.length) : 0,
  }

  const byDept = computeCounts()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* notification */}
      {notification && (
        <div style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', top: 20, zIndex: 9999 }}>
          <div style={{ background: '#0b2b4a', color: '#fff', padding: '10px 14px', borderRadius: 8, boxShadow: '0 6px 18px rgba(2,6,23,0.08)', minWidth: 200, textAlign: 'center' }}>{notification}</div>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0 }}>Departments Overview</h1>
          <div style={{ color: '#4b5563' }}>Academic departments and their statistics</div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', code: '', description: '', head: '', office_location: '', contact_email: '', contact_number: '' }) }} style={{ background: '#1e88e5', color: '#fff', border: 0, padding: '10px 16px', borderRadius: 8 }}>+ New Department</button>
          <button onClick={() => setShowArchived(v => !v)} style={{ background: 'transparent', border: 0, color: TEXT.primary, fontWeight: 700, cursor: 'pointer' }}>{showArchived ? 'View Active' : 'Archived Departments'}</button>
        </div>
      </div>

  {/* stat cards */}
  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ background: '#fff', padding: 20, borderRadius: 12, minWidth: 220, flex: '1 1 220px', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
          <div style={{ color: TEXT.primary, fontWeight: 700 }}>Total Departments</div>
          <div style={{ marginTop: 8, fontSize: 28, fontWeight: 800, color: TEXT.primary }}>{totals.totalDepartments}</div>
          {/* <div style={{ color: '#2e7d32', marginTop: 6, fontSize: 13 }}>+15% new this year</div> */}
        </div>
        
        <div style={{ background: '#fff', padding: 20, borderRadius: 12, minWidth: 220, flex: '1 1 220px', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
          <div style={{ color: TEXT.primary, fontWeight: 700 }}>Total Faculty</div>
          <div style={{ marginTop: 8, fontSize: 28, fontWeight: 800, color: TEXT.primary }}>{totals.totalFaculty}</div>
          {/* <div style={{ color: '#2e7d32', marginTop: 6, fontSize: 13 }}>+8% this semester</div> */}
        </div>
        <div style={{ background: '#fff', padding: 20, borderRadius: 12, minWidth: 220, flex: '1 1 220px', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
          <div style={{ color: TEXT.primary, fontWeight: 700 }}>Total Students</div>
          <div style={{ marginTop: 8, fontSize: 28, fontWeight: 800, color: TEXT.primary }}>{totals.totalStudents}</div>
          {/* <div style={{ color: '#2e7d32', marginTop: 6, fontSize: 13 }}>+12% this year</div> */}
        </div>

        {/* Removed Total Faculty and Avg cards per UX request; keeping layout with Total Departments and Total Students only. */}
      </div>

      {/* departments grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {departments.filter(d => !!d.archived === showArchived).map(d => {
          const b = byDept[d.id] || { faculty: 0, students: 0, courses: 0 }
          return (
            <div key={d.id} onClick={() => navigate(`/department/${d.id}`)} style={{ background: '#fff', padding: 20, borderRadius: 12, boxShadow: '0 2px 8px rgba(15,23,42,0.04)', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 360 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: '1 1 auto', minWidth: 0 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: TEXT.primary, lineHeight: 1.2, wordBreak: 'break-word' }}>{d.name}</div>
                  <div style={{ color: TEXT.muted, marginTop: 6 }}>{d.code || ''}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: '0 0 auto' }}>
                  <div style={{ background: d.archived ? '#f3f4f6' : '#e8f5e9', color: d.archived ? '#374151' : '#2e7d32', padding: '6px 10px', borderRadius: 16, fontWeight: 700, fontSize: 13 }}>{d.archived ? 'Archived' : 'Active'}</div>
                </div>
              </div>

              <div style={{ color: TEXT.body, marginTop: 12, flex: '1 1 auto', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical' }}>{d.description || 'No description provided.'}</div>

              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column' }}>
                <div>
                  <div style={{ color: TEXT.muted, fontSize: 13 }}>Department Head:</div>
                  <div style={{ fontWeight: 800, color: TEXT.primary, marginTop: 6, wordBreak: 'break-word' }}>{d.head || '—'}</div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-end', marginTop: 12 }}>
                  <div style={{ textAlign: 'center', flex: '1 1 0' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: TEXT.primary }}>{b.faculty}</div>
                    <div style={{ color: TEXT.body, fontSize: 13 }}>Faculty Members</div>
                  </div>
                  <div style={{ textAlign: 'center', flex: '1 1 0' }}>
                    <div style={{ fontSize: 18, color: '#2e7d32', fontWeight: 800 }}>{b.students}</div>
                    <div style={{ color: '#374151', fontSize: 13 }}>Students</div>
                  </div>
                  <div style={{ textAlign: 'center', flex: '1 1 0' }}>
                    <div style={{ fontSize: 18, color: '#0b2b4a', fontWeight: 800 }}>{b.courses}</div>
                    <div style={{ color: '#374151', fontSize: 13 }}>Courses</div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* form modal (create / edit) */}
      {showForm && (
        <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 9999 }} onClick={() => { cancel(); }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', padding: 16, borderRadius: 12, width: 'min(880px, 96%)', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(2,6,23,0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>{editingId ? 'Edit Department' : 'Add Department'}</h3>
              <button onClick={() => { cancel() }} style={{ background: 'transparent', border: 0, cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>
            {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
            <form onSubmit={editingId ? (e => { e.preventDefault(); confirmEdit() }) : createDept} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ gridColumn: '1 / -1', width: '100%', paddingTop: 6 }}><strong style={{ color: '#111827' }}>DEPARTMENT INFORMATION</strong></div>
              <input name="name" placeholder="Department name" value={form.name} onChange={onChange} style={{ padding: 10, flex: '1 1 220px' }} />
              <input name="code" placeholder="Code (e.g. CSP, AP)" value={form.code} onChange={onChange} style={{ padding: 10, flex: '1 1 140px' }} />
              <input name="head" placeholder="Department head" value={form.head} onChange={onChange} style={{ padding: 10, flex: '1 1 220px' }} />

              <div style={{ gridColumn: '1 / -1', width: '100%', paddingTop: 6 }}><strong style={{ color: '#111827' }}>CONTACT INFORMATION</strong></div>
              <input name="office_location" placeholder="Office location (e.g. Main Bldg 2nd floor)" value={form.office_location} onChange={onChange} style={{ padding: 10, flex: '1 1 220px' }} />
              <input name="contact_email" placeholder="Contact email (department)" value={form.contact_email} onChange={onChange} style={{ padding: 10, flex: '1 1 220px' }} />
              <input name="contact_number" placeholder="Contact phone (landline)" value={form.contact_number} onChange={onChange} style={{ padding: 10, flex: '1 1 160px' }} />

              <input name="description" placeholder="Short description" value={form.description} onChange={onChange} style={{ padding: 10, flex: '1 1 100%' }} />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button type="submit" style={{ background: '#1976d2', color: '#fff', padding: '8px 14px', borderRadius: 8, border: 0 }}>{editingId ? 'Save' : 'Create'}</button>
                <button type="button" onClick={cancel} style={{ background: '#eee', padding: '8px 14px', borderRadius: 8, border: 0 }}>Cancel</button>
                {editingId && <button type="button" onClick={() => { if (window.confirm('Delete department?')) remove(editingId) }} style={{ background: '#ffe5e5', padding: '8px 14px', borderRadius: 8, border: 0, color: '#a00' }}>Delete</button>}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

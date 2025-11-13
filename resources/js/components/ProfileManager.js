// import React, { useEffect, useState } from 'react'

// export default function ProfileManager() {
//   const token = (() => { try { return localStorage.getItem('api_token') } catch(e){ return null } })()
//   const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {}
//   const [students, setStudents] = useState([])
//   const [departments, setDepartments] = useState([])
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState('')
//   const [query, setQuery] = useState('')
//   const [filterCourse, setFilterCourse] = useState('')
//   const [filterDept, setFilterDept] = useState('')
//   const [formVisible, setFormVisible] = useState(false)
//   const [form, setForm] = useState({ fname: '', lname: '', email: '', contact: '', age: '', student_id: '', course: '', department: '', year: '', gpa: '', status: '' })
//   const [editingId, setEditingId] = useState(null)

//   const fetchStudents = async () => {
//     setLoading(true)
//     try {
//       const res = await fetch('/api/students', { headers: authHeader })
//       const js = await res.json()
//       if (!res.ok) throw new Error(js.message || 'Failed')
//       setStudents(js.data || [])
//     } catch (e) { setError(e.message) } finally { setLoading(false) }
//   }

//   const fetchDepartments = async () => {
//     try {
//   const res = await fetch('/api/departments', { headers: authHeader })
//       const js = await res.json()
//       if (res.ok && js.data) setDepartments(js.data)
//     } catch (e) { /* ignore */ }
//   }

//   useEffect(() => { fetchStudents(); fetchDepartments() }, [])

//   const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

//   const onSubmit = async (e) => {
//     e.preventDefault(); setError('')
//     try {
//       const payload = {
//         fname: form.fname,
//         lname: form.lname,
//         email: form.email,
//         contact: form.contact || null,
//         age: form.age === '' ? null : Number(form.age),
//         student_id: form.student_id || null,
//         course: form.course || null,
//         department: form.department || null,
//         year: form.year || null,
//         gpa: form.gpa === '' ? null : Number(form.gpa),
//         status: form.status || null,
//         join_date: form.join_date || null,
//       }

//   const res = await fetch('/api/students', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader }, body: JSON.stringify(payload) })
//       const js = await res.json()
//       if (!res.ok) throw new Error(js.message || 'Create failed')
//       setForm({ fname: '', lname: '', email: '', contact: '', age: '', student_id: '', course: '', department: '', year: '', gpa: '', status: '' })
//       setFormVisible(false)
//       await fetchStudents()
//     } catch (err) { setError(err.message) }
//   }

//   const startEdit = (s) => { setEditingId(s.id); setForm({ fname: s.fname||'', lname: s.lname||'', email: s.email||'', contact: s.contact||'', age: s.age ?? '', student_id: s.student_id||'', course: s.course||'', department: s.department||'', year: s.year||'', gpa: s.gpa ?? '', status: s.status||'', join_date: s.join_date||'' }); setFormVisible(true) }
//   const cancel = () => { setEditingId(null); setForm({ fname: '', lname: '', email: '', contact: '', age: '', student_id: '', course: '', department: '', year: '', gpa: '', status: '' }); setFormVisible(false) }

//   const confirmEdit = async () => {
//     if (!editingId) return
//     try {
//       const payload = {
//         fname: form.fname,
//         lname: form.lname,
//         email: form.email,
//         contact: form.contact || null,
//         age: form.age === '' ? null : Number(form.age),
//         student_id: form.student_id || null,
//         course: form.course || null,
//         department: form.department || null,
//         year: form.year || null,
//         gpa: form.gpa === '' ? null : Number(form.gpa),
//         status: form.status || null,
//         join_date: form.join_date || null,
//       }

//   const res = await fetch(`/api/students/${editingId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader }, body: JSON.stringify(payload) })
//       const js = await res.json()
//       if (!res.ok) throw new Error(js.message || 'Update failed')
//       cancel(); await fetchStudents()
//     } catch (err) { setError(err.message) }
//   }

//   const remove = async (id) => {
//     if (!window.confirm('Delete this student?')) return
//     try {
//   const res = await fetch(`/api/students/${id}`, { method: 'DELETE', headers: authHeader })
//       const js = await res.json()
//       if (!res.ok) throw new Error(js.message || 'Delete failed')
//       await fetchStudents()
//     } catch (err) { setError(err.message) }
//   }

//   const courses = Array.from(new Set(students.map(s => s.course).filter(Boolean)))

//   const filtered = students.filter(s => {
//     const q = query.trim().toLowerCase()
//     if (q && !(String(s.fname||'').toLowerCase().includes(q) || String(s.lname||'').toLowerCase().includes(q) || String(s.email||'').toLowerCase().includes(q) || String(s.student_id||'').toLowerCase().includes(q))) return false
//     if (filterCourse && (s.course || '') !== filterCourse) return false
//     if (filterDept && (s.department || '') !== filterDept) return false
//     return true
//   })

//   const initials = (s) => {
//     const a = (s.fname||'').trim().charAt(0) || ''
//     const b = (s.lname||'').trim().charAt(0) || ''
//     return (a+b).toUpperCase()
//   }

//   return (
//     <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
//       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//         <div>
//           <h2 style={{ margin: 0 }}>Student Management</h2>
//           <div style={{ color: '#4b5563' }}>Manage student enrollments, profiles, and academic records.</div>
//         </div>
//         <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
//           <button onClick={() => { setFormVisible(true); setEditingId(null); setForm({ fname: '', lname: '', email: '', contact: '', age: '', student_id: '', course: '', department: '', year: '', gpa: '', status: '' }) }} style={{ background: '#2e7d32', color: '#fff', border: 0, padding: '10px 16px', borderRadius: 8 }}>+ Add Student</button>
//         </div>
//       </div>

//       <div style={{ background: '#fff', padding: 16, borderRadius: 12 }}>
//         <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
//           <input placeholder="Search by name, email, or student ID..." value={query} onChange={e => setQuery(e.target.value)} style={{ flex: 1, padding: '12px 14px', borderRadius: 8, border: '1px solid #eee' }} />
//           <select value={filterCourse} onChange={e => setFilterCourse(e.target.value)} style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #eee' }}>
//             <option value="">All Courses</option>
//             {courses.map(c => <option key={c} value={c}>{c}</option>)}
//           </select>
//           <select value={filterDept} onChange={e => setFilterDept(e.target.value)} style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #eee' }}>
//             <option value="">All Departments</option>
//             {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
//           </select>
//         </div>

//         <div style={{ marginTop: 8 }}>
//           <h3 style={{ marginTop: 0 }}>Students ({filtered.length})</h3>
//           <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #f0f0f0' }}>
//             <table style={{ width: '100%', borderCollapse: 'collapse' }}>
//               <thead style={{ background: '#fafafa' }}>
//                 <tr>
//                   <th style={{ textAlign: 'left', padding: 16 }}>Student</th>
//                   <th style={{ padding: 16, textAlign: 'left' }}>Course</th>
//                   <th style={{ padding: 16 }}>Department</th>
//                   <th style={{ padding: 16 }}>Year</th>
//                   <th style={{ padding: 16 }}>GPA</th>
//                   <th style={{ padding: 16 }}>Status</th>
//                   <th style={{ padding: 16 }}>Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {filtered.map((s, i) => (
//                   <tr key={s.id} style={{ borderTop: '1px solid #f2f2f2' }}>
//                     <td style={{ padding: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
//                       <div style={{ width: 44, height: 44, borderRadius: 22, background: '#0b2340', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{initials(s)}</div>
//                       <div>
//                         <div style={{ fontWeight: 700 }}>{s.fname} {s.lname}</div>
//                         <div style={{ color: '#6b7280', fontSize: 13 }}>{s.student_id || ''}{s.student_id ? <span style={{ display: 'block' }}>{s.email}</span> : <span style={{ display: 'block' }}>{s.email}</span>}</div>
//                       </div>
//                     </td>
//                     <td style={{ padding: 14 }}>{s.course || '—'}</td>
//                     <td style={{ padding: 14 }}>{s.department || '—'}</td>
//                     <td style={{ padding: 14 }}>{s.year || '—'}</td>
//                     <td style={{ padding: 14, color: '#2e7d32', fontWeight: 700 }}>{s.gpa ?? '—'}</td>
//                     <td style={{ padding: 14 }}>
//                       <span style={{ display: 'inline-block', padding: '6px 10px', borderRadius: 16, background: (s.status === 'Inactive' ? '#e57373' : '#2e7d32'), color: '#fff', fontWeight: 700, fontSize: 12 }}>{s.status || 'Active'}</span>
//                     </td>
//                     <td style={{ padding: 14, position: 'relative' }}>
//                       <div style={{ position: 'relative', display: 'inline-block' }} onClick={e => e.stopPropagation()}>
//                         <button
//                           onClick={e => { e.stopPropagation(); startEdit(s) }}
//                           style={{
//                             background: '#fff',
//                             border: 'none',
//                             padding: '10px 12px',
//                             borderRadius: 10,
//                             cursor: 'pointer',
//                             minWidth: 44,
//                             minHeight: 44,
//                             display: 'flex',
//                             alignItems: 'center',
//                             justifyContent: 'center',
//                             boxShadow: '0 1px 2px rgba(2,6,23,0.06)',
//                             outline: 'none'
//                           }}
//                         >
//                           ⋯
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//                 {filtered.length === 0 && (
//                   <tr>
//                     <td colSpan="7" style={{ textAlign: 'center', padding: 20, color: '#6b7280' }}>{loading ? 'Loading...' : 'No students yet.'}</td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </div>

//       {formVisible && (
//         <div style={{ background: '#fff', padding: 16, borderRadius: 12 }}>
//           <h3 style={{ marginTop: 0 }}>{editingId ? 'Edit Student' : 'Add Student'}</h3>
//           <form onSubmit={onSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
//             <input name="fname" placeholder="First name" value={form.fname} onChange={onChange} style={{ padding: 10, flex: '1 1 200px' }} />
//             <input name="lname" placeholder="Last name" value={form.lname} onChange={onChange} style={{ padding: 10, flex: '1 1 200px' }} />
//             <input name="email" placeholder="Email" value={form.email} onChange={onChange} style={{ padding: 10, flex: '1 1 260px' }} />
//             <input name="student_id" placeholder="Student ID" value={form.student_id} onChange={onChange} style={{ padding: 10, flex: '1 1 160px' }} />
//             <select name="course" value={form.course} onChange={onChange} style={{ padding: 10, flex: '1 1 220px' }}>
//               <option value="">Select course</option>
//               {courses.map(c => <option key={c} value={c}>{c}</option>)}
//             </select>
//             <select name="department" value={form.department} onChange={onChange} style={{ padding: 10, flex: '1 1 220px' }}>
//               <option value="">Select department</option>
//               {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
//             </select>
//             <input name="year" placeholder="Year (e.g. 3rd Year)" value={form.year} onChange={onChange} style={{ padding: 10, flex: '1 1 160px' }} />
//             <input name="gpa" placeholder="GPA" value={form.gpa} onChange={onChange} style={{ padding: 10, flex: '1 1 120px' }} />
//             <select name="status" value={form.status} onChange={onChange} style={{ padding: 10, flex: '1 1 160px' }}>
//               <option value="">Status</option>
//               <option value="Active">Active</option>
//               <option value="Inactive">Inactive</option>
//               <option value="On Leave">On Leave</option>
//             </select>
//             <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
//               {editingId ? (
//                 <>
//                   <button type="button" onClick={confirmEdit} style={{ background: '#1976d2', color: '#fff', padding: '8px 14px', borderRadius: 8, border: 0 }}>Save</button>
//                   <button type="button" onClick={cancel} style={{ background: '#eee', padding: '8px 14px', borderRadius: 8, border: 0 }}>Cancel</button>
//                 </>
//               ) : (
//                 <>
//                   <button type="submit" style={{ background: '#1976d2', color: '#fff', padding: '8px 14px', borderRadius: 8, border: 0 }}>Create</button>
//                   <button type="button" onClick={() => setFormVisible(false)} style={{ background: '#eee', padding: '8px 14px', borderRadius: 8, border: 0 }}>Close</button>
//                 </>
//               )}
//             </div>
//           </form>
//         </div>
//       )}
//     </div>
//   )
// }

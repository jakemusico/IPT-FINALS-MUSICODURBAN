import React, { useEffect, useState } from 'react'

function safeData(resJs) {
  if (!resJs) return []
  if (Array.isArray(resJs)) return resJs
  if (resJs.data && Array.isArray(resJs.data)) return resJs.data
  return []
}

function exportCsv(filename, headers, rows) {
  const lines = [headers.join(','), ...rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(','))]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

const normalizePhotoUrl = (photo) => {
  if (!photo) return null
  try { if (photo.startsWith('/')) return window.location.origin + photo } catch (e) {}
  return photo
}

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

const TEXT = { primary: '#0b2b4a', body: '#111827', muted: '#6b7280' }

export default function Reports() {
  const [active, setActive] = useState('students')
  const [students, setStudents] = useState([])
  const [faculty, setFaculty] = useState([])
  const [loading, setLoading] = useState(false)
  const [courseFilter, setCourseFilter] = useState('')
  const [deptFilter, setDeptFilter] = useState('')

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [sRes, fRes] = await Promise.all([fetch('/api/students'), fetch('/api/faculty')])
      const [sJs, fJs] = await Promise.all([sRes.json().catch(()=>[]), fRes.json().catch(()=>[])])
      setStudents(safeData(sJs))
      setFaculty(safeData(fJs))
    } catch (e) {
      console.error(e)
    } finally { setLoading(false) }
  }

  const courses = Array.from(new Set(students.map(s => s.course).filter(Boolean)))
  const departments = Array.from(new Set(faculty.map(f => f.department).filter(Boolean)))

  const filteredStudents = students.filter(s => {
    if (!courseFilter) return true
    return (s.course || '').toLowerCase() === courseFilter.toLowerCase()
  })

  const filteredFaculty = faculty.filter(f => {
    if (!deptFilter) return true
    return (f.department || '').toLowerCase() === deptFilter.toLowerCase()
  })

  const exportStudents = () => {
    const headers = ['Student Name','Course','Grade','Attendance','Status','Email']
    const rows = filteredStudents.map(s => [ (s.fname||'') + ' ' + (s.lname||''), s.course||'', s.grade||'', s.attendance||'', s.status||'', s.email||'' ])
    exportCsv('student_reports.csv', headers, rows)
  }

  const exportFaculty = () => {
    const headers = ['Faculty Name','Employee ID','Department','Position','Status','Date Hired']
    const rows = filteredFaculty.map(f => [ (f.fname||'') + ' ' + (f.lname||''), f.id_number || f.employee_id || '', f.department||'', f.position||'', f.status || (f.archived ? 'Archived' : 'Active'), (f.date_hired || f.hired_at || f.created_at) ? new Date(f.date_hired || f.hired_at || f.created_at).toLocaleDateString() : '' ])
    exportCsv('faculty_reports.csv', headers, rows)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0 }}>Reports</h1>
          <div style={{ color: '#4b5563' }}>Generate and view reports for students and faculty</div>
        </div>
      </div>

      <div style={{ background: '#fff', padding: 12, borderRadius: 10, display: 'flex', gap: 8 }}>
        <button onClick={() => setActive('students')} style={{ padding: '8px 14px', borderRadius: 8, border: 0, background: active === 'students' ? '#fff' : '#f1f5f9', boxShadow: active === 'students' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none', fontWeight: 700 }}>Student Reports</button>
        <button onClick={() => setActive('faculty')} style={{ padding: '8px 14px', borderRadius: 8, border: 0, background: active === 'faculty' ? '#fff' : '#f1f5f9', boxShadow: active === 'faculty' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none', fontWeight: 700 }}>Faculty Reports</button>
      </div>

      {active === 'students' && (
        <div style={{ background: '#fff', padding: 20, borderRadius: 12 }}>
          <h2 style={{ marginTop: 0 }}>Student Performance Reports</h2>
          <div style={{ color: '#4b5563', marginBottom: 12 }}>View student performance metrics filtered by course</div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ fontWeight: 700, color: TEXT.primary }}>Filter by Course:</div>
              <select value={courseFilter} onChange={e=>setCourseFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #eee', color: TEXT.body }}>
                <option value=''>All Courses</option>
                {courses.map(c=> <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <button onClick={exportStudents} style={{ background: '#0b2b4a', color: '#fff', padding: '10px 14px', borderRadius: 10, border: 0 }}>Export CSV</button>
            </div>
          </div>

          <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #f0f0f0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#fafafa' }}>
                <tr>
                  <th style={{ textAlign: 'left', padding: 16 }}>Student</th>
                  <th style={{ padding: 16 }}>Student ID</th>
                  <th style={{ padding: 16, textAlign: 'left' }}>Course</th>
                  <th style={{ padding: 16 }}>Department</th>
                  <th style={{ padding: 16 }}>Year Level</th>
                  <th style={{ padding: 16 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(s => (
                  <tr key={s.id} style={{ borderTop: '1px solid #f4f4f6' }}>
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
                    <td style={{ padding: 14, color: '#374151' }}>{s.course || ''}</td>
                    <td style={{ padding: 14, color: '#374151' }}>{s.department || '—'}</td>
                    <td style={{ padding: 14, color: '#374151' }}>{s.year || '—'}</td>
                    <td style={{ padding: 14 }}>
                      <span style={{ display: 'inline-block', padding: '6px 10px', borderRadius: 16, background: (s.status === 'Dropped' || s.status === 'Inactive' ? '#e57373' : '#2e7d32'), color: '#fff', fontWeight: 700, fontSize: 12 }}>{s.status || 'Enrolled'}</span>
                    </td>
                  </tr>
                ))}

                {filteredStudents.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: 20, textAlign: 'center', color: '#6b7280' }}>{loading ? 'Loading...' : 'No student records'}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {active === 'faculty' && (
        <div style={{ background: '#fff', padding: 20, borderRadius: 12 }}>
          <h2 style={{ marginTop: 0 }}>Faculty Performance Reports</h2>
          <div style={{ color: '#4b5563', marginBottom: 12 }}>View faculty metrics filtered by department</div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ fontWeight: 700, color: TEXT.primary }}>Filter by Department:</div>
              <select value={deptFilter} onChange={e=>setDeptFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #eee', color: TEXT.body }}>
                <option value=''>All Departments</option>
                {departments.map(d=> <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <button onClick={exportFaculty} style={{ background: '#0b2b4a', color: '#fff', padding: '10px 14px', borderRadius: 10, border: 0 }}>Export CSV</button>
            </div>
          </div>

          <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #f0f0f0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#fafafa' }}>
                <tr>
                  <th style={{ textAlign: 'left', padding: 16, color: TEXT.primary }}>Faculty</th>
                  <th style={{ padding: 16, textAlign: 'left', color: TEXT.primary }}>Employee ID</th>
                  <th style={{ padding: 16, textAlign: 'left', color: TEXT.primary }}>Department</th>
                  <th style={{ padding: 16, color: TEXT.primary }}>Position</th>
                  <th style={{ padding: 16, color: TEXT.primary }}>Status</th>
                  <th style={{ padding: 16, color: TEXT.primary }}>Date Hired</th>
                </tr>
              </thead>
              <tbody>
                {filteredFaculty.map(f => (
                  <tr key={f.id} style={{ borderTop: '1px solid #f4f4f6' }}>
                    <td style={{ padding: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 22, overflow: 'hidden', background: '#0b2340', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                        {f.photo ? (
                          <img src={normalizePhotoUrl(f.photo)} alt={(f.fname||'') + ' ' + (f.lname||'')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ color: '#fff', fontWeight: 700 }}>{initials(f)}</div>
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, color: TEXT.primary, fontSize: 15 }}>{(f.fname||'') + ' ' + (f.lname||'')}</div>
                        <div style={{ color: '#374151', fontSize: 13 }}>{f.email}</div>
                      </div>
                    </td>
                    <td style={{ padding: 14, color: '#374151', fontWeight: 700 }}>{f.id_number || f.employee_id || '—'}</td>
                    <td style={{ padding: 14, color: '#374151' }}>{f.department || '—'}</td>
                    <td style={{ padding: 14, color: '#374151' }}>{f.position || '—'}</td>
                    <td style={{ padding: 14 }}>
                      <span style={{ display: 'inline-block', padding: '6px 10px', borderRadius: 16, background: (f.archived ? '#9ca3af' : (f.status === 'On Leave' ? '#ffb74d' : '#2e7d32')), color: '#fff', fontWeight: 700, fontSize: 12 }}>{f.archived ? 'Archived' : (f.status || 'Active')}</span>
                    </td>
                    <td style={{ padding: 14, color: '#374151' }}>{(f.date_hired || f.hired_at || f.created_at) ? new Date(f.date_hired || f.hired_at || f.created_at).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}

                {filteredFaculty.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: 20, textAlign: 'center', color: '#6b7280' }}>{loading ? 'Loading...' : 'No faculty records'}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  )
}

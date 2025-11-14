import React, { useEffect, useState, useMemo } from 'react'
import { Bar, Pie } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement)

export default function Home() {
  const [students, setStudents] = useState([])
  const [faculty, setFaculty] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    setLoading(true)

    const tryDashboard = async () => {
      // Try the new consolidated endpoint first
      try {
        const resp = await fetch('/api/dashboard')
        if (resp.ok) {
          const js = await resp.json()
          if (!mounted) return
          // Accept multiple shapes: { students: [...], faculty: [...] }
          if (js.students) {
            // some APIs wrap in { data: [...] }
            const s = js.students.data ? js.students.data : (Array.isArray(js.students) ? js.students : [])
            setStudents(s)
          }
          if (js.faculty) {
            const f = js.faculty.data ? js.faculty.data : (Array.isArray(js.faculty) ? js.faculty : [])
            setFaculty(f)
          }
          if (js.departments) {
            const d = js.departments.data ? js.departments.data : (Array.isArray(js.departments) ? js.departments : [])
            setDepartments(d)
          }
          setLoading(false)
          return
        }
      } catch (e) {
        // ignore and fallback
      }

      // Fallback to individual endpoints
      try {
        const [studentsRes, facultyRes, departmentsRes] = await Promise.all([
          fetch('/api/students').then(r => r.ok ? r.json() : Promise.reject(r)),
          fetch('/api/faculty').then(r => r.ok ? r.json() : Promise.reject(r)).catch(() => null),
          fetch('/api/departments').then(r => r.ok ? r.json() : Promise.reject(r)).catch(() => null)
        ])
        if (!mounted) return
        if (studentsRes && studentsRes.data) setStudents(studentsRes.data)
        if (facultyRes && facultyRes.data) setFaculty(facultyRes.data)
        if (departmentsRes && departmentsRes.data) setDepartments(departmentsRes.data)
        // if departments not present, try a separate fetch as a fallback
        if (!departmentsRes) {
          try {
            const dr = await fetch('/api/departments')
            if (dr.ok) {
              const djs = await dr.json()
              if (djs && djs.data) setDepartments(djs.data)
            }
          } catch (e) {}
        }
        setLoading(false)
      } catch (err) {
        // fallback: try students only
        fetch('/api/students').then(r => r.json()).then(js => { if (mounted && js && js.data) setStudents(js.data) })
        setError('Could not fetch dashboard (using sample/fallback data).')
        setLoading(false)
      }
    }

    tryDashboard()

    return () => { mounted = false }
  }, [])

  // derive totals
  const totalStudents = students.length
  const totalFaculty = faculty.length || 89 // fallback sample
  // normalize department names for deduplication and counting
  const normalizeDeptKey = (s) => {
    if (!s) return ''
    return String(s)
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\b(program|programs|education|educ|edu|department|dept|of|the|and)\b/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  let totalDepartments = null
  if (departments && departments.length) {
    const seen = {}
    departments.filter(d => !d.archived).forEach(d => {
      const key = normalizeDeptKey(d.name || d.code || d.id || '')
      if (key) seen[key] = true
    })
    totalDepartments = Object.keys(seen).length
  }

  // students by course: group by `course` property if present; produce short codes + full names
  const studentsByCourse = useMemo(() => {
    // canonical mapping for known course names to exact codes
    const canonicalMap = {
      'accountancy': 'BSA',
      'bachelor of science in accountancy': 'BSA',
      'criminology': 'BSCRIM',
      'bachelor of science in criminology': 'BSCRIM',
      'business administration': 'BSBA',
      'information technology': 'BSIT',
      'nursing': 'BSN',
      'psychology': 'BSPSYCH',
      'tourism management': 'BSTM',
      'hotel management': 'BSHM',
      'civil engineering': 'BSCE'
    }

    // helper to generate a short course code from a full course name
    const makeCode = (name) => {
      if (!name || typeof name !== 'string') return 'UNK'
      const lname = name.toLowerCase()
      // try exact/contains matches against canonical map
      for (const k in canonicalMap) {
        if (lname === k || lname.includes(k)) return canonicalMap[k]
      }
      const cleaned = name.replace(/[\(\)\.,\/:&\-]/g, ' ').replace(/\s+/g, ' ').trim()
      const parts = cleaned.split(' ').map(p => p.trim()).filter(Boolean)
      const stop = new Set(['of','in','and','the','for','to','with'])
      const lower = cleaned.toLowerCase()
      let prefix = ''
      if (lower.startsWith('bachelor') && lower.includes('science')) prefix = 'BS'
      else if (lower.startsWith('bachelor') && lower.includes('arts')) prefix = 'BA'
      else if (lower.startsWith('associate')) prefix = 'AS'
      const significant = parts.filter(p => p.length > 2 && !stop.has(p.toLowerCase()))
      if (prefix) {
        while (significant.length && ['bachelor','science','arts','of'].includes(significant[0].toLowerCase())) significant.shift()
      }
      let remainder = ''
      if (significant.length === 0 && parts.length > 0) {
        remainder = parts.map(p => p[0].toUpperCase()).slice(0,3).join('')
      } else {
        remainder = significant.map(p => p[0].toUpperCase()).slice(0,3).join('')
      }
      const code = (prefix + remainder).slice(0,6) || name.slice(0,6).toUpperCase().replace(/[^A-Z0-9]/g, '')
      return code
    }

    if (!students || students.length === 0) {
      return { codes: ['CS','ENG','BA','MATH','PHY'], names: ['Computer Science','Engineering','Business Admin','Mathematics','Physics'], data: [240,180,150,80,60] }
    }
    const map = {}
    students.forEach(s => {
      const name = s.course || s.course_name || s.course_code || 'Undeclared'
      const code = s.course_code || makeCode(name)
      const key = code + '||' + name
      if (!map[key]) map[key] = { code, name, count: 0 }
      map[key].count += 1
    })
    const entries = Object.values(map)
    entries.sort((a,b) => a.code.localeCompare(b.code))
    const codes = entries.map(e => e.code)
    const names = entries.map(e => e.name)
    const data = entries.map(e => e.count)
    return { codes, names, data }
  }, [students])

  // faculty by department: prefer authoritative departments list when available
  const facultyByDept = useMemo(() => {
      if (departments && departments.length) {
        // dedupe departments by normalized name (exclude archived entries)
        const seen = {}
        const unique = []
        departments.filter(d => !d.archived).forEach(d => {
          const raw = d.name || d.code || d.id || ''
          const key = normalizeDeptKey(raw)
          if (!key) return
          if (!seen[key]) { seen[key] = true; unique.push(d) }
        })
      const labels = unique.map(d => d.name || d.code || `Dept ${d.id}`)
      const data = unique.map(d => {
        const dKey = normalizeDeptKey(d.name || d.code || d.id || '')
        return faculty.reduce((acc, f) => {
          try {
            if (!f) return acc
            if (f.department_id && Number(f.department_id) === Number(d.id)) return acc + 1
            const fKey = normalizeDeptKey(f.department || f.dept || '')
            if (fKey && dKey && fKey === dKey) return acc + 1
          } catch (e) {}
          return acc
        }, 0)
      })
      return { labels, data }
    }

    if (!faculty || faculty.length === 0) {
      return { labels: ['Engineering','Sciences','Mathematics','Business','Liberal Arts'], data: [24,18,12,15,8] }
    }
    const map = {}
    const labelsByKey = {}
    faculty.forEach(f => {
      const raw = f.department || f.dept || 'General'
      const key = normalizeDeptKey(raw) || 'general'
      labelsByKey[key] = labelsByKey[key] || raw
      map[key] = (map[key] || 0) + 1
    })
    const labels = Object.keys(map).map(k => labelsByKey[k] || k)
    const data = Object.keys(map).map(k => map[k])
    return { labels, data }
  }, [faculty, departments])

  const barData = {
    labels: studentsByCourse.codes || studentsByCourse.labels || [],
    datasets: [{ label: 'Students', backgroundColor: '#0b2340', data: (studentsByCourse.data || []).map(d => Number(d) || 0) }]
  }

  const barOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (items) => {
            try {
              const idx = items && items[0] ? items[0].dataIndex : 0
              return (studentsByCourse.names && studentsByCourse.names[idx]) || ''
            } catch (e) { return '' }
          },
          label: (context) => {
            try { return `Students: ${context.raw}` } catch (e) { return '' }
          }
        }
      }
    },
    scales: {
      x: { ticks: { autoSkip: true, maxRotation: 45, minRotation: 0 } }
    }
  }

  const pieData = {
    labels: facultyByDept.labels,
    datasets: [{ data: facultyByDept.data, backgroundColor: ['#1e2f5b','#2e7d32','#ffb300','#f6c85f','#90a4ae'] }]
  }

  return (
    <div style={{ padding: 8 }}>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ margin: 0 }}>Dashboard</h1>
  <div style={{ color: '#4b5563' }}>Welcome back! Here's an overview of your academic institution.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 18 }}>
        <div style={{ background: '#fff', padding: 18, borderRadius: 8, boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
          <div style={{ color: '#374151', fontWeight: 600 }}>Total Students</div>
          <div style={{ fontSize: 32, fontWeight: 800, marginTop: 6, color: '#0b2b4a' }}>{totalStudents}</div>
        </div>
        <div style={{ background: '#fff', padding: 18, borderRadius: 8, boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
          <div style={{ color: '#374151', fontWeight: 600 }}>Total Faculty</div>
          <div style={{ fontSize: 32, fontWeight: 800, marginTop: 6, color: '#0b2b4a' }}>{totalFaculty}</div>
        </div>
        <div style={{ background: '#fff', padding: 18, borderRadius: 8, boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
          <div style={{ color: '#374151', fontWeight: 600 }}>Active Courses</div>
          <div style={{ fontSize: 32, fontWeight: 800, marginTop: 6, color: '#0b2b4a' }}>{(studentsByCourse.codes || studentsByCourse.names || []).length}</div>
        </div>
        <div style={{ background: '#fff', padding: 18, borderRadius: 8, boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
          <div style={{ color: '#374151', fontWeight: 600 }}>Departments</div>
          <div style={{ fontSize: 32, fontWeight: 800, marginTop: 6, color: '#0b2b4a' }}>{totalDepartments !== null ? totalDepartments : facultyByDept.labels.length}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
        <div style={{ background: '#fff', padding: 18, borderRadius: 8 }}>
          <h3 style={{ marginTop: 0 }}>Students by Course</h3>
          <Bar data={barData} options={barOptions} />
        </div>

        <div style={{ background: '#fff', padding: 18, borderRadius: 8 }}>
          <h3 style={{ marginTop: 0 }}>Faculty by Department</h3>
          <Pie data={pieData} options={{ responsive: true, plugins: { legend: { position: 'right' } } }} />
        </div>
      </div>
    </div>
  )
}

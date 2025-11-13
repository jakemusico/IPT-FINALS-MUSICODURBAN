import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email, password, remember })
      }).catch(()=>null)

      if (!res) throw new Error('No response from server')

      // If the backend redirects on success (non-JSON), follow location
      const ct = res.headers.get('content-type') || ''
      if (res.status === 422) {
        // validation
        const js = await res.json().catch(()=>null)
        throw new Error(js?.message || 'Validation failed')
      }

      if (ct.includes('application/json')) {
        const js = await res.json().catch(()=>null)
        if (!res.ok) throw new Error(js?.message || 'Login failed')
        // if token or user returned, store and navigate
        if (js?.token) {
          try { localStorage.setItem('api_token', js.token) } catch(e){}
        }
        // optional: store user
        if (js?.user) {
          try { localStorage.setItem('user', JSON.stringify(js.user)) } catch(e){}
        }
        navigate('/')
        return
      }

      // fallback: if response is redirectish, navigate to root
      if (res.redirected) {
        window.location.href = res.url
        return
      }

      throw new Error('Login failed')
    } catch (e) {
      setError(e.message || 'Login failed')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f7fb' }}>
      <div style={{ width: 520, background: '#fff', padding: 28, borderRadius: 12, boxShadow: '0 8px 40px rgba(2,6,23,0.08)' }}>
        <h2 style={{ margin: 0, marginBottom: 6 }}>Admin Login</h2>
  <div style={{ color: '#4b5563', marginBottom: 16 }}>Sign in with your administrator account</div>

        {error && <div style={{ color: '#a00', marginBottom: 12 }}>{error}</div>}

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" type="email" style={{ padding: 12, borderRadius: 8, border: '1px solid #eee' }} required />
          <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" type="password" style={{ padding: 12, borderRadius: 8, border: '1px solid #eee' }} required />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#0f172a', fontSize: 15, fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: '#1976d2', cursor: 'pointer' }}
              />
              <span style={{ marginLeft: 2 }}>Remember me</span>
            </label>
            <a href="#" style={{ color: '#2cb7eaff', textDecoration: 'none' }}></a>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button type="submit" disabled={loading} style={{ background: '#1976d2', color: '#fff', border: 0, padding: '10px 16px', borderRadius: 8 }}>Sign in</button>
            <button type="button" onClick={() => { setEmail(''); setPassword('') }} style={{ background: '#eee', border: 0, padding: '10px 16px', borderRadius: 8 }}>Clear</button>
          </div>
        </form>

      </div>
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

function initials(name) {
  if (!name) return ''
  const parts = name.trim().split(/\s+/)
  return (parts[0]?.charAt(0) || '') + (parts[1]?.charAt(0) || '')
}

export default function MyProfile() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState({})
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', location: '' })
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [removePhoto, setRemovePhoto] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  // color constants used for improved contrast and clarity
  const TEXT = { primary: '#0b2b4a', body: '#374151', inputBorder: '#e5e7eb', inputText: '#0b2b4a', placeholder: '#9ca3af' }
  useEffect(() => { fetchProfile() }, [])

  const fetchProfile = async () => {
    setLoading(true)
    try {
      // try common endpoints for current user/profile
      const attempts = ['/api/user','/api/profile','/api/profiles/1']
      let data = null
      const token = localStorage.getItem('api_token')
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {}
      for (const url of attempts) {
        try {
          const res = await fetch(url, { headers })
          if (!res.ok) continue
          const js = await res.json().catch(()=>null)
          if (!js) continue
          // try common shapes
          data = js.user || js.data || js.profile || js
          break
        } catch (e) { continue }
      }

      if (data) {
        const name = (data.full_name || [data.fname, data.lname].filter(Boolean).join(' ') || data.name || '')
        setProfile(data)
        setForm({ full_name: name, email: data.email || '', phone: data.phone || data.contact || '', location: data.location || '' })
        // set photo preview if available
        const p = data.photo || data.profile_photo || null
        if (p) setPhotoPreview(p)
      }
    } catch (e) {
      console.error(e)
    } finally { setLoading(false) }
  }

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const onPhotoChange = (e) => {
    const f = e.target.files && e.target.files[0] ? e.target.files[0] : null
    setPhotoFile(f)
    setRemovePhoto(false)
    if (f) {
      try {
        const url = URL.createObjectURL(f)
        setPhotoPreview(url)
      } catch (e) { setPhotoPreview(null) }
    }
  }

  const triggerFileInput = () => {
    const inp = document.getElementById('mp-photo-file')
    if (inp) inp.click()
  }

  const handleRemovePhoto = () => {
    // mark for removal and clear selected file + preview
    setRemovePhoto(true)
    setPhotoFile(null)
    setPhotoPreview(null)
  }

  const save = async () => {
    setError(''); setMessage('')
    // basic validation
    if (!form.full_name.trim() || !form.email.trim()) { setError('Name and email are required'); return }
    setLoading(true)
    try {
      // prepare payload: try to split into fname/lname if backend expects
      const parts = form.full_name.trim().split(/\s+/)
      const token = localStorage.getItem('api_token')
      const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {}

      // prepare JSON payload (used for non-multipart requests and fallbacks)
      const payload = {
        name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone || null,
        location: form.location || null,
      }

      // if there's a photo file or removePhoto is requested, use FormData multipart
      let res = null
      if (photoFile || removePhoto) {
        const fd = new FormData()
        // include fields expected by updateProfile
        fd.append('name', payload.name)
        fd.append('email', payload.email)
        if (payload.phone) fd.append('phone', payload.phone)
        if (payload.location) fd.append('location', payload.location)
        if (photoFile) fd.append('photo_file', photoFile)
        if (removePhoto) fd.append('remove_photo', '1')
        // use POST + _method override so PHP/Laravel parse multipart files correctly
        fd.append('_method', 'PUT')

        res = await fetch('/api/profile', { method: 'POST', headers: { ...authHeader }, body: fd }).catch(()=>null)
      } else {
        // try PUT /api/profile (new simple endpoint for authenticated user)
        res = await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...authHeader }, body: JSON.stringify(payload) }).catch(()=>null)
      }
      if (res && res.ok) {
        await res.json().catch(()=>({}))
        setMessage('Profile updated')
        setEditing(false)
        await fetchProfile()
        return
      }

  // try PATCH /api/user next (older endpoint)
  res = await fetch('/api/user', { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...authHeader }, body: JSON.stringify(payload) }).catch(()=>null)
      if (res && res.ok) {
        await res.json().catch(()=>({}))
        setMessage('Profile updated')
        setEditing(false)
        await fetchProfile()
        return
      }

      // fallback: if profile has id, update /api/profiles/:id
      if (profile && profile.id) {
        // when using local profile endpoint, support multipart if photoFile present
        if (photoFile || removePhoto) {
          const fd = new FormData()
          fd.append('fname', parts[0] || '')
          fd.append('lname', parts.slice(1).join(' ') || '')
          fd.append('email', form.email.trim())
          if (form.phone) fd.append('contact', form.phone)
          if (form.location) fd.append('address', form.location)
          if (photoFile) fd.append('photo_file', photoFile)
          if (removePhoto) fd.append('remove_photo', '1')
          fd.append('_method', 'PATCH')
          res = await fetch(`/api/profiles/${profile.id}`, { method: 'POST', headers: { ...authHeader }, body: fd }).catch(()=>null)
        } else {
          const payload = {
            fname: parts[0] || '',
            lname: parts.slice(1).join(' ') || '',
            email: form.email.trim(),
            contact: form.phone || null,
            address: form.location || null,
          }
          res = await fetch(`/api/profiles/${profile.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...authHeader }, body: JSON.stringify(payload) }).catch(()=>null)
        }
        if (res && res.ok) { setMessage('Profile updated'); setEditing(false); await fetchProfile(); return }
      }

      setError('Failed to update profile (no supported endpoint)')
    } catch (e) { setError(String(e)) } finally { setLoading(false) }
  }

  const logout = async () => {
    try {
      const token = localStorage.getItem('api_token')
      const headers = token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
      // best-effort call to server logout
      await fetch('/api/logout', { method: 'POST', headers }).catch(()=>null)
    } catch (e) {
      // ignore
    }
    try { localStorage.removeItem('api_token') } catch(e){}
    try { localStorage.removeItem('user') } catch(e){}
    // navigate to login page
    try { navigate('/login') } catch(e){ window.location.href = '/login' }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* small component-scoped placeholder rule to make placeholders readable */}
      <style>{`.mp-input::placeholder{ color: ${TEXT.placeholder}; opacity: 1; }`}</style>
      <div>
        <h1 style={{ margin: 0 }}>My Profile</h1>
        <div style={{ color: TEXT.body }}>Manage your personal information and preferences</div>
      </div>

      <div style={{ background: '#fff', padding: 20, borderRadius: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ width: 84, height: 84, borderRadius: 42, overflow: 'hidden', background: '#0b2b4a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800 }}>
              {photoPreview ? (
                <img src={photoPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{initials(form.full_name || profile.full_name || (profile.fname||'') + ' ' + (profile.lname||''))}</div>
              )}
            </div>
            {/* hidden file input for photo upload */}
            <input id="mp-photo-file" type="file" accept="image/*" onChange={onPhotoChange} style={{ display: 'none' }} />
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: TEXT.primary }}>{form.full_name || profile.full_name || (profile.fname||'') + ' ' + (profile.lname||'')}</div>
              <div style={{ color: TEXT.body, fontWeight: 600 }}>{form.email || profile.email || ''}</div>
              {editing && (
                <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                  <button type="button" onClick={triggerFileInput} style={{ background: '#1976d2', color: '#fff', padding: '6px 10px', borderRadius: 6, border: 0 }}>Upload Photo</button>
                  <button type="button" onClick={handleRemovePhoto} style={{ background: '#eee', padding: '6px 10px', borderRadius: 6, border: 0 }}>Remove Photo</button>
                </div>
              )}
            </div>
          </div>

          <div>
            {!editing ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setEditing(true)} style={{ background: '#0b2b4a', color: '#fff', padding: '8px 12px', borderRadius: 8, border: 0 }}>Edit Profile</button>
                <button onClick={logout} style={{ background: '#eee', padding: '8px 12px', borderRadius: 8, border: 0 }}>Logout</button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={save} style={{ background: '#1976d2', color: '#fff', padding: '8px 12px', borderRadius: 8, border: 0 }}>Save</button>
                <button onClick={() => { setEditing(false); setForm({ full_name: profile.full_name || (profile.fname||'') + ' ' + (profile.lname||''), email: profile.email || '', phone: profile.phone || profile.contact || '', location: profile.location || '' }) }} style={{ background: '#eee', padding: '8px 12px', borderRadius: 8, border: 0 }}>Cancel</button>
              </div>
            )}
          </div>
        </div>

          <div style={{ marginTop: 18 }}>
          {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
          {message && <div style={{ color: '#2e7d32', marginBottom: 8 }}>{message}</div>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: 8, color: TEXT.primary, fontSize: 13 }}>Full Name</label>
              <input className="mp-input" name="full_name" value={form.full_name} onChange={onChange} disabled={!editing} placeholder="Full Name" style={{ width: '100%', padding: 12, borderRadius: 8, border: `1px solid ${TEXT.inputBorder}`, color: TEXT.inputText }} />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: 8, color: TEXT.primary, fontSize: 13 }}>Email</label>
              <input className="mp-input" name="email" value={form.email} onChange={onChange} disabled={!editing} placeholder="Email" style={{ width: '100%', padding: 12, borderRadius: 8, border: `1px solid ${TEXT.inputBorder}`, color: TEXT.inputText }} />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: 8, color: TEXT.primary, fontSize: 13 }}>Phone</label>
              <input className="mp-input" name="phone" value={form.phone} onChange={onChange} disabled={!editing} placeholder="Phone" style={{ width: '100%', padding: 12, borderRadius: 8, border: `1px solid ${TEXT.inputBorder}`, color: TEXT.inputText }} />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: 8, color: TEXT.primary, fontSize: 13 }}>Location</label>
              <input className="mp-input" name="location" value={form.location} onChange={onChange} disabled={!editing} placeholder="Location" style={{ width: '100%', padding: 12, borderRadius: 8, border: `1px solid ${TEXT.inputBorder}`, color: TEXT.inputText }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

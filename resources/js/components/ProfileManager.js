import React, { useEffect, useState } from 'react';

export default function ProfileManager() {
  const [searchInput, setSearchInput] = useState('');
  // Set page background color for a modern look
  useEffect(() => {
    const prevBg = document.body.style.background;
    const prevFilter = document.body.style.backdropFilter;
    document.body.style.background =
      "url('https://live.staticflickr.com/3571/3555313681_b477fe9d44_b.jpg') center center / cover no-repeat fixed";
    document.body.style.backdropFilter = 'blur(4px)';
    return () => {
      document.body.style.background = prevBg;
      document.body.style.backdropFilter = prevFilter;
    };
  }, []);
  const [profiles, setProfiles] = useState([]);
  const [form, setForm] = useState({ fname: '', lname: '', email: '', contact: '', age: '' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState('');
  const [filter, setFilter] = useState('');

  const resetMessages = () => {
    setError('');
    setMessage('');
  };

  const fetchProfiles = async () => {
    resetMessages();
    setLoading(true);
    try {
      const res = await fetch('/api/profiles');
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.message || 'Failed to fetch');
      setProfiles(Array.isArray(json.data) ? json.data : []);
      setLastRefreshed(new Date().toLocaleString());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    resetMessages();

        if (!form.fname.trim() || !form.lname.trim() || !form.email.trim() || !form.contact.trim() || !form.age) {
          let missing = [];
          if (!form.fname.trim()) missing.push('First name');
          if (!form.lname.trim()) missing.push('Last name');
          if (!form.email.trim()) missing.push('Email');
          if (!form.contact.trim()) missing.push('Contact');
          if (!form.age) missing.push('Age');
          setError(missing.length ? missing.join(', ') + ' ' + (missing.length === 1 ? 'is' : 'are') + ' required.' : '');
          return;
        }
        if (form.contact.length !== 11) {
          setError('Contact must be exactly 11 digits.');
          return;
        }

    setLoading(true);
    try {
      const res = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          fname: form.fname.trim(),
          lname: form.lname.trim(),
          email: form.email.trim(),
          contact: form.contact.trim() || null,
          age: form.age !== '' ? Number(form.age) : null,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.message || 'Create failed');
      setMessage('Profile created successfully.');
  setForm({ fname: '', lname: '', email: '', contact: '', age: '' });
      await fetchProfiles();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setForm({
      fname: p.fname || '',
      lname: p.lname || '',
      email: p.email || '',
      contact: p.contact || '',
      age: p.age == null ? '' : String(p.age),
    });
  };

  const cancelEdit = () => {
  setEditingId(null);
  setForm({ fname: '', lname: '', email: '', contact: '', age: '' });
  };

  const confirmEdit = async () => {
    if (!editingId) return;
    resetMessages();
    if (!form.fname.trim() || !form.lname.trim() || !form.email.trim()) {
      setError('Firstname, Lastname, and Email are required.');
      return;
    }
    setLoading(true);
    try {
      // Use PATCH to allow partial updates and include age when provided
      const res = await fetch(`/api/profiles/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          fname: form.fname.trim(),
          lname: form.lname.trim(),
          email: form.email.trim(),
          contact: form.contact.trim() || null,
          age: form.age === '' ? null : Number(form.age),
        }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.message || 'Update failed');
      setMessage('Profile updated successfully.');
      cancelEdit();
      await fetchProfiles();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this profile?')) return;
    resetMessages();
    setLoading(true);
    const confirmed = window.confirm('Are you sure you want to delete this profile? This action cannot be undone.');
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/profiles/${id}`, { method: 'DELETE', headers: { 'Accept': 'application/json' } });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || (json.success === false)) throw new Error(json.message || 'Delete failed');
      setMessage('Profile deleted successfully.');
      await fetchProfiles();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
  <div style={{ maxWidth: 1100, minHeight: '100vh', margin: '0 auto', padding: 28, background: 'rgba(255,255,255,0.75)', borderRadius: 14, boxShadow: '0 4px 24px #0003', color: '#1a237e', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', backdropFilter: 'blur(2px)' }}>
      <h2 style={{ marginBottom: 10, fontWeight: 700, color: '#111' }}>Musico Student Profiles</h2>
      <div style={{ marginBottom: 16, color: '#222', fontSize: 16, fontWeight: 500 }}>
        <span>Total: {profiles.length}</span> &nbsp;|&nbsp; <span>Last update: {lastRefreshed || '—'}</span>
      </div>
      {error && (
        <div style={{ background: '#ffe5e5', color: '#a00', padding: 10, borderRadius: 4, marginBottom: 12, fontWeight: 600, position: 'relative' }}>
          <span>{error}</span>
          <button
            onClick={() => setError('')}
            style={{
              position: 'absolute',
              top: 6,
              right: 10,
              background: 'none',
              border: 'none',
              color: '#a00',
              fontWeight: 900,
              fontSize: 20,
              cursor: 'pointer',
              lineHeight: 1,
            }}
            aria-label="Close error"
          >
            ×
          </button>
        </div>
      )}
      {message && <div style={{ background: '#e5ffe5', color: '#0a0', padding: 10, borderRadius: 4, marginBottom: 12, fontWeight: 600 }}>{message}</div>}
      <form onSubmit={onSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 18 }}>
  <input name="fname" placeholder="First name" value={form.fname} onChange={onChange} style={{ flex: 1, minWidth: 120, padding: 8, color: '#111', background: '#fff', border: '1px solid #bbb', fontWeight: 500 }} />
  <input name="lname" placeholder="Last name" value={form.lname} onChange={onChange} style={{ flex: 1, minWidth: 120, padding: 8, color: '#111', background: '#fff', border: '1px solid #bbb', fontWeight: 500 }} />
  <input name="email" placeholder="Email" value={form.email} onChange={onChange} style={{ flex: 1, minWidth: 180, padding: 8, color: '#111', background: '#fff', border: '1px solid #bbb', fontWeight: 500 }} />
  <input
    name="contact"
    placeholder="Contact"
    value={form.contact}
    onChange={e => {
      const val = e.target.value.replace(/[^0-9]/g, '');
      if (val.length <= 11) {
        setForm(f => ({ ...f, contact: val }));
      }
    }}
    maxLength={11}
    inputMode="numeric"
    style={{ flex: 1, minWidth: 120, padding: 8, color: '#111', background: '#fff', border: '1px solid #bbb', fontWeight: 500 }}
  />
  <input type="number" min="0" max="150" name="age" placeholder="Age" value={form.age} onChange={onChange} style={{ flex: 1, minWidth: 80, padding: 8, color: '#111', background: '#fff', border: '1px solid #bbb', fontWeight: 500 }} />
        {editingId ? (
          <>
            <button type="button" onClick={confirmEdit} disabled={loading} style={{ background: '#1976d2', color: '#fff', border: 0, borderRadius: 4, padding: '8px 16px', fontWeight: 700 }}>Save</button>
            <button type="button" onClick={cancelEdit} disabled={loading} style={{ background: '#eee', color: '#333', border: 0, borderRadius: 4, padding: '8px 16px', fontWeight: 700 }}>Cancel</button>
          </>
        ) : (
          <button type="submit" disabled={loading} style={{ background: '#1976d2', color: '#fff', border: 0, borderRadius: 4, padding: '8px 16px', fontWeight: 700 }}>Create</button>
        )}
      </form>
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, alignItems: 'center' }}>
        <div style={{ display: 'flex', flex: 1, gap: 10, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              placeholder="Filter by name, email, contact, or age"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              style={{ width: '100%', height: 40, padding: '8px 32px 8px 8px', color: '#111', background: '#fff', border: '1px solid #bbb', borderRadius: 4, fontWeight: 500, fontSize: 16, boxSizing: 'border-box' }}
            />
            {searchInput && (
              <button
                onClick={() => { setSearchInput(''); setFilter(''); }}
                style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 0, color: '#888', fontSize: 18, cursor: 'pointer', padding: 0, lineHeight: 1 }}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
          <button
            onClick={() => setFilter(searchInput)}
            style={{ background: '#1976d2', color: '#fff', border: 0, borderRadius: 4, padding: '8px 16px', fontWeight: 700, fontSize: 16, boxShadow: '0 2px 8px #0001', transition: 'background 0.2s', height: 40, minWidth: 90, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            Search
          </button>
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 16, color: '#111', background: '#fff', borderRadius: 14, overflow: 'hidden' }}>
          <thead>
            <tr style={{ background: 'rgba(33, 150, 243, 0.92)' }}>
              <th style={{ padding: '14px 10px', border: '1px solid #bbb', color: '#fff', fontWeight: 700, textAlign: 'center', borderTopLeftRadius: 8, letterSpacing: 1 }}>#</th>
              <th style={{ padding: '14px 10px', border: '1px solid #bbb', color: '#fff', fontWeight: 700, whiteSpace: 'nowrap', textAlign: 'center', letterSpacing: 1 }}>First name</th>
              <th style={{ padding: '14px 10px', border: '1px solid #bbb', color: '#fff', fontWeight: 700, whiteSpace: 'nowrap', textAlign: 'center', letterSpacing: 1 }}>Last name</th>
              <th style={{ padding: '14px 10px', border: '1px solid #bbb', color: '#fff', fontWeight: 700, textAlign: 'center', letterSpacing: 1 }}>Email</th>
              <th style={{ padding: '14px 10px', border: '1px solid #bbb', color: '#fff', fontWeight: 700, textAlign: 'center', letterSpacing: 1 }}>Contact</th>
              <th style={{ padding: '14px 10px', border: '1px solid #bbb', color: '#fff', fontWeight: 700, textAlign: 'center', letterSpacing: 1 }}>Age</th>
              <th style={{ padding: '14px 10px', border: '1px solid #bbb', color: '#fff', fontWeight: 700, textAlign: 'center', letterSpacing: 1 }}>Created</th>
              <th style={{ padding: '14px 10px', border: '1px solid #bbb', color: '#fff', fontWeight: 700, textAlign: 'center', letterSpacing: 1 }}>Updated</th>
              <th style={{ padding: '14px 10px', border: '1px solid #bbb', color: '#fff', fontWeight: 700, textAlign: 'center', borderTopRightRadius: 8, letterSpacing: 1 }}>Manage</th>
            </tr>
          </thead>
          <tbody>
            {profiles
              .filter((p) => {
                const q = filter.trim().toLowerCase();
                if (!q) return true;
                return (
                  String(p.fname || '').toLowerCase().includes(q) ||
                  String(p.lname || '').toLowerCase().includes(q) ||
                  String(p.email || '').toLowerCase().includes(q) ||
                  String(p.contact || '').toLowerCase().includes(q) ||
                  String(String(p.age ?? '')).toLowerCase().includes(q)
                );
              })
              .map((p, idx) => (
                <tr key={p.id}>
                  <td style={{ padding: 8, border: '1px solid #bbb', textAlign: 'center', fontWeight: 600 }}>{idx + 1}</td>
                  <td style={{ padding: 8, border: '1px solid #bbb' }}>{p.fname}</td>
                  <td style={{ padding: 8, border: '1px solid #bbb' }}>{p.lname}</td>
                  <td style={{ padding: 8, border: '1px solid #bbb' }}>{p.email}</td>
                  <td style={{ padding: 8, border: '1px solid #bbb' }}>{p.contact || '—'}</td>
                  <td style={{ padding: 8, border: '1px solid #bbb', textAlign: 'center' }}>{p.age ?? '—'}</td>
                  <td style={{ padding: 8, border: '1px solid #bbb' }}>{p.created_at ? new Date(p.created_at).toLocaleString() : '—'}</td>
                  <td style={{ padding: 8, border: '1px solid #bbb' }}>{p.updated_at ? new Date(p.updated_at).toLocaleString() : '—'}</td>
                  <td style={{ padding: 8, border: '1px solid #bbb' }}>
                      <div style={{ display: 'flex', flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center' }}>
                        <button onClick={() => startEdit(p)} style={{ background: '#eee', color: '#1976d2', border: 0, borderRadius: 4, padding: '6px 12px', marginRight: 4, fontSize: 15, fontWeight: 600 }}>Edit</button>
                        <button onClick={() => remove(p.id)} style={{ background: '#ffe5e5', color: '#a00', border: 0, borderRadius: 4, padding: '6px 12px', fontSize: 15, fontWeight: 600 }}>Delete</button>
                      </div>
                  </td>
                </tr>
              ))}
            {profiles.length === 0 && (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: 14, color: '#888', fontWeight: 600 }}>{loading ? 'Loading...' : 'No profiles yet.'}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

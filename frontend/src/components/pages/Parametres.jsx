import React, { useState, useEffect, useRef } from 'react';
import keycloak from '../../keycloak';
import api from '../../services/api';

const AVATAR_BASE = 'http://localhost:9091/api/profile/avatar/';

// ── Helper exporté — utilisé dans le chat pour afficher la photo d'un collègue
export function getAvatarUrl(keycloakId) {
  return keycloakId ? `${AVATAR_BASE}${keycloakId}` : null;
}

// ── Icônes ─────────────────────────────────────────────────────────────────
const IconCamera = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);
const IconUser = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconMail = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
  </svg>
);
const IconBriefcase = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>
);
const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconTrash = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);
const IconLogout = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const IconLoader = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

// ── Styles ────────────────────────────────────────────────────────────────
const card = { background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '16px', padding: '28px' };
const labelStyle = { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'hsl(var(--nav-muted))', marginBottom: '8px' };
const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))', color: 'hsl(var(--foreground))', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' };
const inputReadonly = { ...inputStyle, opacity: 0.5, cursor: 'not-allowed' };

// ── Composant principal ────────────────────────────────────────────────────
export default function Parametres() {
  const fileInputRef = useRef(null);
  const keycloakId = keycloak?.tokenParsed?.sub || '';
  const kcEmail    = keycloak?.tokenParsed?.email || '';

  const [firstName,     setFirstName]     = useState('');
  const [lastName,      setLastName]      = useState('');
  const [role,          setRole]          = useState('Responsable RH');
  const [avatarUrl,     setAvatarUrl]     = useState(null);   // URL backend
  const [avatarPreview, setAvatarPreview] = useState(null);   // preview local
  const [pendingFile,   setPendingFile]   = useState(null);   // fichier à uploader
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [saved,         setSaved]         = useState(false);
  const [dragOver,      setDragOver]      = useState(false);
  const [error,         setError]         = useState(null);

  // ── Chargement initial ─────────────────────────────────────────────────
  useEffect(() => {
    api.get('/profile')
      .then(res => {
        const p = res.data;
        if (p.firstName) setFirstName(p.firstName);
        if (p.lastName)  setLastName(p.lastName);
        if (p.role)      setRole(p.role);
        if (p.avatarPath) setAvatarUrl(`${AVATAR_BASE}${keycloakId}?t=${Date.now()}`);
      })
      .catch(() => setError('Impossible de charger le profil.'))
      .finally(() => setLoading(false));
  }, [keycloakId]);

  const initials      = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'RH';
  const displayAvatar = avatarPreview || avatarUrl;

  // ── Gestion fichier ────────────────────────────────────────────────────
  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > 2 * 1024 * 1024) { setError('Image trop lourde (max 2 Mo)'); return; }
    setError(null);
    setPendingFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); };

  // ── Sauvegarde ─────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true); setError(null);
    try {
      await api.put('/profile', { firstName, lastName, role });

      if (pendingFile) {
        const form = new FormData();
        form.append('file', pendingFile);
        await api.post('/profile/avatar', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setAvatarUrl(`${AVATAR_BASE}${keycloakId}?t=${Date.now()}`);
        setAvatarPreview(null);
        setPendingFile(null);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      window.dispatchEvent(new CustomEvent('tritux_profile_updated', {
        detail: { firstName, lastName, role, keycloakId }
      }));
    } catch {
      setError('Erreur lors de la sauvegarde. Réessayez.');
    } finally {
      setSaving(false);
    }
  };

  // ── Supprimer avatar ───────────────────────────────────────────────────
  const handleRemoveAvatar = async () => {
    try {
      await api.delete('/profile/avatar');
      setAvatarUrl(null);
      setAvatarPreview(null);
      setPendingFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      window.dispatchEvent(new CustomEvent('tritux_profile_updated', {
        detail: { firstName, lastName, role, keycloakId, avatarRemoved: true }
      }));
    } catch {
      setError('Erreur lors de la suppression.');
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center', padding: '80px', color: 'hsl(var(--nav-muted))' }}>
      <IconLoader /> Chargement du profil...
    </div>
  );

  return (
    <>
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>

      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* En-tête */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, color: 'hsl(var(--foreground))' }}>Mon profil</h1>
          <p style={{ margin: '6px 0 0', fontSize: '0.875rem', color: 'hsl(var(--nav-muted))' }}>
            Vos informations sont partagées avec vos collègues dans le chat.
          </p>
        </div>

        {/* Erreur */}
        {error && (
          <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '10px', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        {/* ── Section avatar ── */}
        <div style={{ ...card, marginBottom: '20px' }}>
          <p style={{ ...labelStyle, marginBottom: '20px' }}>Photo de profil</p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '28px', flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: 88, height: 88, borderRadius: '50%',
                background: displayAvatar ? 'transparent' : 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '3px solid hsl(var(--border))', overflow: 'hidden',
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              }}>
                {displayAvatar
                  ? <img src={displayAvatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ color: 'white', fontSize: '1.4rem', fontWeight: 700 }}>{initials}</span>
                }
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: '50%', background: 'hsl(var(--primary))', border: '2px solid hsl(var(--card))', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
                title="Changer la photo"
              >
                <IconCamera />
              </button>
            </div>

            {/* Drag & drop */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                flex: 1, minWidth: 200,
                border: `2px dashed ${dragOver ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
                borderRadius: '12px', padding: '20px', textAlign: 'center', cursor: 'pointer',
                background: dragOver ? 'hsl(var(--primary) / 0.05)' : 'transparent',
                transition: 'all 0.2s',
              }}
            >
              {pendingFile
                ? <p style={{ margin: 0, fontSize: '0.875rem', color: 'hsl(var(--primary))', fontWeight: 600 }}>✓ {pendingFile.name}</p>
                : <>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'hsl(var(--foreground))' }}>
                      Glissez une image ici ou <span style={{ color: 'hsl(var(--primary))', fontWeight: 600 }}>parcourez</span>
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'hsl(var(--nav-muted))' }}>PNG, JPG, WebP — max 2 Mo</p>
                  </>
              }
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={e => handleFile(e.target.files[0])} style={{ display: 'none' }} />
          </div>

          {displayAvatar && (
            <button
              onClick={handleRemoveAvatar}
              style={{ marginTop: '16px', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'transparent', color: 'hsl(var(--nav-muted))', fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'hsl(var(--border))'; e.currentTarget.style.color = 'hsl(var(--nav-muted))'; }}
            >
              <IconTrash /> Supprimer la photo
            </button>
          )}
        </div>

        {/* ── Section infos ── */}
        <div style={{ ...card, marginBottom: '20px' }}>
          <p style={{ ...labelStyle, marginBottom: '20px' }}>Informations personnelles</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}><IconUser /> Prénom</label>
              <input style={inputStyle} value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Votre prénom"
                onFocus={e => e.target.style.borderColor = 'hsl(var(--primary))'}
                onBlur={e => e.target.style.borderColor = 'hsl(var(--border))'}
              />
            </div>
            <div>
              <label style={labelStyle}><IconUser /> Nom</label>
              <input style={inputStyle} value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Votre nom"
                onFocus={e => e.target.style.borderColor = 'hsl(var(--primary))'}
                onBlur={e => e.target.style.borderColor = 'hsl(var(--border))'}
              />
            </div>
            <div>
              <label style={labelStyle}><IconMail /> Email</label>
              <input style={inputReadonly} value={kcEmail} readOnly title="Géré par Keycloak" />
              <p style={{ margin: '5px 0 0', fontSize: '0.7rem', color: 'hsl(var(--nav-muted))' }}>Géré via Keycloak — non modifiable ici</p>
            </div>
            <div>
              <label style={labelStyle}><IconBriefcase /> Rôle / Poste</label>
              <input style={inputStyle} value={role} onChange={e => setRole(e.target.value)} placeholder="Ex: Responsable RH"
                onFocus={e => e.target.style.borderColor = 'hsl(var(--primary))'}
                onBlur={e => e.target.style.borderColor = 'hsl(var(--border))'}
              />
            </div>
          </div>
        </div>

        {/* ── Actions ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <button
            onClick={() => keycloak.logout({ redirectUri: window.location.origin })}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', border: '1px solid hsl(var(--border))', background: 'transparent', color: 'hsl(var(--nav-muted))', fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'hsl(var(--border))'; e.currentTarget.style.color = 'hsl(var(--nav-muted))'; }}
          >
            <IconLogout /> Se déconnecter
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px', borderRadius: '10px', border: 'none', background: saved ? 'hsl(142, 76%, 36%)' : 'hsl(var(--primary))', color: 'white', fontSize: '0.875rem', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', transition: 'all 0.3s', boxShadow: '0 2px 8px hsl(var(--primary) / 0.3)', opacity: saving ? 0.8 : 1 }}
          >
            {saving ? <><IconLoader /> Enregistrement...</> : saved ? <><IconCheck /> Enregistré !</> : 'Enregistrer les modifications'}
          </button>
        </div>

      </div>
    </>
  );
}
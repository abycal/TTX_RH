import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import api from '../../services/api';

const statusMap = {
  new: { label: 'Nouveau', cls: 'status-new' },
  default: { label: 'Actif', cls: 'status-confirmed' },
};

export default function Profiles() {
  const [candidates, setCandidates] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const fetchCandidates = () => {
    api.get('/candidates').then(r => setCandidates(r.data)).catch(() => {});
  };

  useEffect(() => { fetchCandidates(); }, []);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setUploading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      await api.post('/candidates/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      fetchCandidates();
    } catch {
      setError("Erreur lors de l'import. Vérifiez que les services sont démarrés.");
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
    multiple: false,
  });

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Supprimer ce candidat ?')) return;
    await api.delete(`/candidates/${id}`);
    fetchCandidates();
  };

  const filtered = candidates.filter(c =>
    c.nom?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', margin: 0 }}>
          Gérez les CV et profils des candidats importés.
        </p>
        <label
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '8px 18px', borderRadius: '9999px',
            border: 'none',
            background: 'hsl(var(--foreground))',
            color: 'hsl(var(--card))',
            fontSize: '0.875rem', fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          ↑ Importer CV
          <input type="file" accept=".pdf,.docx" style={{ display: 'none' }}
            onChange={e => e.target.files?.[0] && onDrop([e.target.files[0]])} />
        </label>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className="premium-card"
        style={{
          padding: '40px',
          textAlign: 'center',
          cursor: 'pointer',
          borderStyle: 'dashed',
          borderWidth: '2px',
          borderColor: isDragActive ? 'hsl(var(--primary))' : 'hsl(var(--border))',
          background: isDragActive ? 'hsl(var(--primary) / 0.04)' : 'hsl(var(--card))',
          transition: 'all 0.2s',
        }}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: 36, height: 36,
              border: '3px solid hsl(var(--primary))',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            <p style={{ color: 'hsl(var(--primary))', fontWeight: 500, margin: 0 }}>Extraction en cours par IA…</p>
            <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem', margin: 0 }}>Importez votre CV, nous nous occupons du reste</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px', color: 'hsl(var(--muted-foreground))' }}><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></div>
            <p style={{ fontWeight: 500, color: 'hsl(var(--foreground))', margin: '0 0 6px' }}>Glissez un CV ici ou cliquez pour importer</p>
            <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', margin: 0 }}>PDF ou DOCX — l'IA extraira automatiquement les informations</p>
          </>
        )}
      </div>

      {error && (
        <div style={{
          padding: '12px 16px', borderRadius: '12px',
          background: 'hsl(var(--destructive) / 0.08)',
          border: '1px solid hsl(var(--destructive) / 0.2)',
          color: 'hsl(var(--destructive))',
          fontSize: '0.875rem',
        }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div className="premium-card" style={{ overflow: 'hidden', padding: 0 }}>
        {/* Search & filters */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid hsl(var(--border) / 0.5)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un candidat…"
              style={{
                width: '100%', padding: '8px 12px 8px 36px',
                borderRadius: '9999px',
                border: '1px solid hsl(var(--border))',
                background: 'hsl(var(--muted))',
                fontSize: '0.875rem',
                color: 'hsl(var(--foreground))',
                outline: 'none',
              }}
            />
          </div>
          <span style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))' }}>
            {filtered.length} profil{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'hsl(var(--muted) / 0.5)' }}>
              {['Candidat', 'Date import', 'Statut', 'Actions'].map(h => (
                <th key={h} style={{
                  textAlign: 'left', padding: '12px 24px',
                  fontSize: '0.6875rem', fontWeight: 600,
                  color: 'hsl(var(--muted-foreground))',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  borderBottom: '1px solid hsl(var(--border) / 0.5)',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '64px 24px', color: 'hsl(var(--muted-foreground))' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px', color: 'hsl(var(--muted-foreground))' }}><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg></div>
                  <p style={{ margin: 0, fontSize: '0.875rem' }}>Aucun profil importé pour l'instant</p>
                </td>
              </tr>
            ) : (
              filtered.map((c, idx) => (
                <tr
                  key={c.id}
                  onClick={() => navigate(`/profiles/${c.id}`)}
                  style={{
                    borderBottom: idx < filtered.length - 1 ? '1px solid hsl(var(--border) / 0.4)' : 'none',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'hsl(var(--muted) / 0.4)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '14px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: 'hsl(var(--primary) / 0.12)',
                        color: 'hsl(var(--primary))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 600, fontSize: '0.875rem', flexShrink: 0,
                      }}>
                        {c.nom?.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 500, color: 'hsl(var(--foreground))' }}>{c.nom}</span>
                    </div>
                  </td>
              
                  <td style={{ padding: '14px 24px', color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem' }}>
                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString('fr-FR') : '—'}
                  </td>
                  <td style={{ padding: '14px 24px' }}>
                    <span className="status-badge status-new">Nouveau</span>
                  </td>
                  <td style={{ padding: '14px 24px' }}>
                    <div style={{ display: 'flex', gap: '6px' }} onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => navigate(`/profiles/${c.id}`)}
                        style={{
                          padding: '5px 12px', borderRadius: '9999px',
                          border: '1px solid hsl(var(--border))',
                          background: 'transparent',
                          color: 'hsl(var(--foreground))',
                          fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer',
                        }}
                      >
                        Afficher
                      </button>
                      <button
                        onClick={() => navigate(`/transformation?id=${c.id}`)}
                        style={{
                          padding: '5px 12px', borderRadius: '9999px',
                          border: 'none',
                          background: 'hsl(var(--primary) / 0.1)',
                          color: 'hsl(var(--primary))',
                          fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer',
                        }}
                      >
                        Transformer
                      </button>
                      <button
                        onClick={(e) => handleDelete(c.id, e)}
                        style={{
                          padding: '5px 12px', borderRadius: '9999px',
                          border: 'none',
                          background: 'hsl(var(--destructive) / 0.08)',
                          color: 'hsl(var(--destructive))',
                          fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer',
                        }}
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

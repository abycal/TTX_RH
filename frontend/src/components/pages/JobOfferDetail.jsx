import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import keycloak from '../../keycloak';

const PAGE_SIZE = 10;

// ── Icônes ────────────────────────────────────────────────────────────────────
const IconArrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
);
const IconClose = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconCV = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
  </svg>
);
const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
  </svg>
);
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IconVideo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
);
const IconBuilding = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" />
  </svg>
);
const IconMail = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
  </svg>
);
const IconSpinner = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite' }}>
    <path d="M21 12a9 9 0 11-6.219-8.56" />
  </svg>
);

// ── Badge score ────────────────────────────────────────────────────────────────
function ScoreBadge({ score }) {
  if (score === null || score === undefined) {
    return (
      <span style={{ padding: '3px 10px', borderRadius: '9999px', background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))', fontSize: '0.75rem', fontWeight: 600 }}>
        —
      </span>
    );
  }
  let bg, color;
  if (score >= 70) { bg = 'hsl(142 76% 36% / 0.12)'; color = 'hsl(142 76% 28%)'; }
  else if (score >= 40) { bg = 'hsl(38 92% 50% / 0.12)'; color = 'hsl(38 80% 35%)'; }
  else { bg = 'hsl(0 65% 50% / 0.12)'; color = 'hsl(0 65% 40%)'; }
  return (
    <span style={{ padding: '3px 10px', borderRadius: '9999px', background: bg, color, fontSize: '0.75rem', fontWeight: 700 }}>
      {score}/100
    </span>
  );
}

// ── Badge statut cliquable ─────────────────────────────────────────────────────
const STATUS_OPTIONS = ['NEW', 'REVIEWED', 'SHORTLISTED', 'REJECTED'];
const STATUS_LABELS = { NEW: 'Nouveau', REVIEWED: 'Vu', SHORTLISTED: 'Sélectionné', REJECTED: 'Refusé' };
const STATUS_COLORS = {
  NEW: { bg: 'hsl(var(--status-new) / 0.12)', color: 'hsl(var(--status-new))' },
  REVIEWED: { bg: 'hsl(var(--status-confirmed) / 0.12)', color: 'hsl(var(--status-confirmed))' },
  SHORTLISTED: { bg: 'hsl(38 92% 50% / 0.12)', color: 'hsl(38 80% 35%)' },
  REJECTED: { bg: 'hsl(var(--destructive) / 0.12)', color: 'hsl(var(--destructive))' },
};

function StatusBadge({ status, candidateId, onUpdate }) {
  const [open, setOpen] = useState(false);
  const c = STATUS_COLORS[status] || STATUS_COLORS.NEW;
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{ padding: '3px 10px', borderRadius: '9999px', background: c.bg, color: c.color, fontSize: '0.75rem', fontWeight: 600, border: `1px solid ${c.color}40`, cursor: 'pointer' }}
      >
        {STATUS_LABELS[status] || status}
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '110%', left: 0, zIndex: 100, background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', boxShadow: 'var(--shadow-lg)', padding: '6px', minWidth: '140px' }}>
          {STATUS_OPTIONS.map((s) => {
            const sc = STATUS_COLORS[s];
            return (
              <button
                key={s}
                onClick={() => { onUpdate(candidateId, s); setOpen(false); }}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 12px', borderRadius: '8px', border: 'none', background: s === status ? sc.bg : 'transparent', color: s === status ? sc.color : 'hsl(var(--foreground))', fontSize: '0.8rem', fontWeight: s === status ? 700 : 400, cursor: 'pointer' }}
              >
                {STATUS_LABELS[s]}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Modal confirmation suppression ────────────────────────────────────────────
function DeleteModal({ open, candidate, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div className="premium-card" style={{ width: '100%', maxWidth: '420px', padding: '28px 28px 24px' }}>
        <h3 style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: 700, color: 'hsl(var(--destructive))' }}>
          Supprimer ce candidat ?
        </h3>
        <p style={{ margin: '0 0 24px', fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.5 }}>
          Voulez-vous vraiment supprimer <strong>{candidate?.fullName}</strong> ? Cette action est irréversible.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={onCancel} style={{ padding: '8px 18px', borderRadius: '10px', border: '1px solid hsl(var(--border))', background: 'transparent', color: 'hsl(var(--foreground))', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer' }}>
            Annuler
          </button>
          <button onClick={onConfirm} style={{ padding: '8px 18px', borderRadius: '10px', border: 'none', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', background: 'hsl(var(--destructive))', color: '#fff' }}>
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal Approve — choix du type de meet ─────────────────────────────────────
function ApproveModal({ open, candidate, onConfirm, onCancel }) {
  const [meetType, setMeetType] = useState('online');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Reset à chaque ouverture
  useEffect(() => {
    if (open) { setMeetType('online'); setLoading(false); setDone(false); }
  }, [open]);

  if (!open) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(candidate.id, meetType);
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div className="premium-card" style={{ width: '100%', maxWidth: '460px', padding: '32px' }}>

        {done ? (
          /* ── État succès ── */
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'hsl(142 76% 36% / 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="hsl(142 76% 28%)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem', fontWeight: 700, color: 'hsl(142 76% 28%)' }}>
              Convocation envoyée !
            </h3>
            <p style={{ margin: '0 0 24px', fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.6 }}>
              Un email de convocation avec le créneau d'entretien a été envoyé à <strong>{candidate?.email}</strong>.
            </p>
            <button onClick={onCancel} style={{ padding: '9px 24px', borderRadius: '9999px', border: 'none', background: 'hsl(var(--foreground))', color: 'hsl(var(--card))', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
              Fermer
            </button>
          </div>
        ) : (
          /* ── Formulaire de choix ── */
          <>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 700, color: 'hsl(var(--foreground))' }}>
                  Approuver ce candidat
                </h3>
                <p style={{ margin: 0, fontSize: '0.825rem', color: 'hsl(var(--muted-foreground))' }}>
                  {candidate?.fullName} · {candidate?.email}
                </p>
              </div>
              <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted-foreground))', display: 'flex', alignItems: 'center', padding: '2px' }}>
                <IconClose />
              </button>
            </div>

            {/* Description */}
            <div style={{ padding: '14px 16px', borderRadius: '12px', background: 'hsl(var(--muted) / 0.6)', marginBottom: '24px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <IconMail />
              <p style={{ margin: 0, fontSize: '0.825rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.6 }}>
                Le système va consulter votre agenda Google, trouver un créneau libre et envoyer automatiquement une convocation au candidat.
              </p>
            </div>

            {/* Choix du type */}
            <p style={{ margin: '0 0 12px', fontSize: '0.8rem', fontWeight: 600, color: 'hsl(var(--foreground))', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Type d'entretien
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '28px' }}>
              {/* En ligne */}
              <button
                onClick={() => setMeetType('online')}
                style={{
                  padding: '18px 16px',
                  borderRadius: '14px',
                  border: meetType === 'online'
                    ? '2px solid hsl(var(--primary))'
                    : '2px solid hsl(var(--border))',
                  background: meetType === 'online'
                    ? 'hsl(var(--primary) / 0.08)'
                    : 'hsl(var(--card))',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '10px',
                  textAlign: 'center',
                }}
              >
                <span style={{ color: meetType === 'online' ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }}>
                  <IconVideo />
                </span>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: meetType === 'online' ? 'hsl(var(--primary))' : 'hsl(var(--foreground))' }}>
                  En ligne
                </span>
                <span style={{ fontSize: '0.72rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.4 }}>
                  Visioconférence<br />(lien envoyé par email)
                </span>
              </button>

              {/* Sur place */}
              <button
                onClick={() => setMeetType('onsite')}
                style={{
                  padding: '18px 16px',
                  borderRadius: '14px',
                  border: meetType === 'onsite'
                    ? '2px solid hsl(var(--primary))'
                    : '2px solid hsl(var(--border))',
                  background: meetType === 'onsite'
                    ? 'hsl(var(--primary) / 0.08)'
                    : 'hsl(var(--card))',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '10px',
                  textAlign: 'center',
                }}
              >
                <span style={{ color: meetType === 'onsite' ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }}>
                  <IconBuilding />
                </span>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: meetType === 'onsite' ? 'hsl(var(--primary))' : 'hsl(var(--foreground))' }}>
                  Sur place
                </span>
                <span style={{ fontSize: '0.72rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.4 }}>
                  Bureaux Tritux<br />Tunis, Tunisie
                </span>
              </button>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={onCancel}
                disabled={loading}
                style={{ padding: '9px 20px', borderRadius: '9999px', border: '1px solid hsl(var(--border))', background: 'transparent', color: 'hsl(var(--foreground))', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', opacity: loading ? 0.5 : 1 }}
              >
                Annuler
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                style={{
                  padding: '9px 24px', borderRadius: '9999px', border: 'none',
                  background: loading ? 'hsl(var(--muted))' : 'hsl(142 76% 36%)',
                  color: loading ? 'hsl(var(--muted-foreground))' : '#fff',
                  fontSize: '0.85rem', fontWeight: 600,
                  cursor: loading ? 'wait' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  transition: 'background 0.2s',
                }}
              >
                {loading ? (
                  <><IconSpinner /> Envoi en cours…</>
                ) : (
                  <><IconCheck /> Confirmer & Envoyer</>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Modal CV ──────────────────────────────────────────────────────────────────
function CVModal({ candidate, onClose }) {
  const [mode, setMode] = useState('original');
  const [trituxLoading, setTrituxLoading] = useState(false);
  const [trituxUrl, setTrituxUrl] = useState(null);
  const [trituxError, setTrituxError] = useState('');
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(true);

  const originalUrl = `http://localhost:9091/api/candidats-externes/${candidate.id}/cv`;

  useEffect(() => {
    let blobUrl = null;
    const loadPdf = async () => {
      setPdfLoading(true);
      try {
        const res = await fetch(originalUrl, {
          headers: { Authorization: `Bearer ${keycloak.token}` },
        });
        if (!res.ok) throw new Error('Erreur chargement CV');
        const blob = await res.blob();
        blobUrl = URL.createObjectURL(blob);
        setPdfBlobUrl(blobUrl);
      } catch (e) {
        setTrituxError('Impossible de charger le CV : ' + e.message);
      } finally {
        setPdfLoading(false);
      }
    };
    loadPdf();
    return () => { if (blobUrl) URL.revokeObjectURL(blobUrl); };
  }, [candidate.id]);

  const loadTrituxCV = async () => {
    if (trituxUrl) { setMode('tritux'); return; }
    setTrituxLoading(true);
    setTrituxError('');
    try {
      const cvRes = await fetch(originalUrl, {
        headers: { Authorization: `Bearer ${keycloak.token}` },
      });
      const blob = await cvRes.blob();
      const file = new File([blob], 'cv.pdf', { type: 'application/pdf' });
      const fd = new FormData();
      fd.append('file', file);
      const extractRes = await fetch('http://localhost:8001/api/extract', { method: 'POST', body: fd });
      if (!extractRes.ok) throw new Error('Extraction FastAPI échouée');
      const profile = await extractRes.json();
      const transformRes = await fetch('http://localhost:8001/api/transform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      if (!transformRes.ok) throw new Error('Transformation échouée');
      const docxBlob = await transformRes.blob();
      const url = URL.createObjectURL(docxBlob);
      setTrituxUrl(url);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CV_Tritux_${candidate.fullName.replace(/ /g, '_')}.docx`;
      a.click();
      setMode('tritux');
    } catch (e) {
      setTrituxError('Erreur : ' + e.message);
    } finally {
      setTrituxLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div className="premium-card" style={{ width: '100%', maxWidth: '880px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid hsl(var(--border))' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'hsl(var(--foreground))' }}>{candidate.fullName}</h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))' }}>{candidate.email}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={() => setMode('original')} style={{ padding: '7px 16px', borderRadius: '9999px', border: '1px solid hsl(var(--border))', background: mode === 'original' ? 'hsl(var(--foreground))' : 'hsl(var(--card))', color: mode === 'original' ? 'hsl(var(--card))' : 'hsl(var(--foreground))', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
              CV Original
            </button>
            <button onClick={loadTrituxCV} disabled={trituxLoading} style={{ padding: '7px 16px', borderRadius: '9999px', border: '1px solid hsl(var(--border))', background: mode === 'tritux' ? 'hsl(var(--foreground))' : 'hsl(var(--card))', color: mode === 'tritux' ? 'hsl(var(--card))' : 'hsl(var(--foreground))', fontSize: '0.8rem', fontWeight: 600, cursor: trituxLoading ? 'wait' : 'pointer', opacity: trituxLoading ? 0.7 : 1 }}>
              {trituxLoading ? 'Génération…' : 'CV Tritux ↓'}
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted-foreground))', display: 'flex', alignItems: 'center' }}>
              <IconClose />
            </button>
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {trituxError && (
            <div style={{ padding: '12px 24px', background: 'hsl(var(--destructive) / 0.1)', color: 'hsl(var(--destructive))', fontSize: '0.85rem' }}>
              {trituxError}
            </div>
          )}
          {mode === 'original' && (
            pdfLoading
              ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '70vh', color: 'hsl(var(--muted-foreground))' }}>Chargement du CV…</div>
              : <iframe src={pdfBlobUrl} title="CV Original" style={{ width: '100%', height: '70vh', border: 'none' }} />
          )}
          {mode === 'tritux' && trituxUrl && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '70vh', gap: '16px', color: 'hsl(var(--muted-foreground))' }}>
              <div style={{ display: 'flex', justifyContent: 'center', color: 'hsl(var(--primary))' }}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg></div>
              <p style={{ margin: 0, fontWeight: 600, color: 'hsl(var(--foreground))' }}>CV Tritux généré et téléchargé</p>
              <button
                onClick={() => { const a = document.createElement('a'); a.href = trituxUrl; a.download = `CV_Tritux_${candidate.fullName.replace(/ /g, '_')}.docx`; a.click(); }}
                style={{ padding: '8px 20px', borderRadius: '9999px', border: 'none', background: 'hsl(var(--foreground))', color: 'hsl(var(--card))', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Re-télécharger
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page principale ────────────────────────────────────────────────────────────
export default function JobOfferDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [offer, setOffer] = useState(null);
  const [allCandidates, setAllCandidates] = useState([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // Modals
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [approveTarget, setApproveTarget] = useState(null);   // ← candidat à approuver

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      const offerRes = await api.get(`/job-offers/${id}`);
      setOffer(offerRes.data);
    } catch (e) {
      const status = e?.response?.status;
      if (status === 404) setError(`Offre introuvable (id: ${id}).`);
      else setError(`Impossible de joindre Spring Boot (port 9091). ${e?.message || ''}`);
      setLoading(false);
      return;
    }

    try {
      const candidatesRes = await api.get(`/candidats-externes/offre/${id}`);
      setAllCandidates(candidatesRes.data || []);
    } catch (e) {
      console.warn('[JobOfferDetail] Candidats non chargés :', e?.message);
      setAllCandidates([]);
    }

    setLoading(false);
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleStatusUpdate = async (candidateId, newStatus) => {
    try {
      await api.patch(`/candidats-externes/${candidateId}/status`, { status: newStatus });
      setAllCandidates((prev) => prev.map((c) => c.id === candidateId ? { ...c, status: newStatus } : c));
    } catch {
      setError('Erreur lors de la mise à jour du statut.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/candidats-externes/${deleteTarget.id}`);
      setAllCandidates((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    } catch {
      setError('Erreur lors de la suppression du candidat.');
    } finally {
      setDeleteTarget(null);
    }
  };

  /**
   * Appelé par ApproveModal une fois le meetType choisi.
   * Appelle POST /api/candidats-externes/{id}/approve
   * Lève une exception si erreur (pour que la modal reste ouverte avec loading=false).
   */
  const handleApprove = async (candidateId, meetType) => {
    const res = await api.post(`/candidats-externes/${candidateId}/approve`, { meetType });
    // Mettre à jour le statut localement
    setAllCandidates((prev) =>
      prev.map((c) => c.id === candidateId ? { ...c, status: 'SHORTLISTED' } : c)
    );
    return res.data;
  };

  const handleLoadMore = async () => {
    setLoadingMore(true);
    await new Promise((r) => setTimeout(r, 200));
    setVisibleCount((prev) => prev + PAGE_SIZE);
    setLoadingMore(false);
  };

  // ── Données dérivées ───────────────────────────────────────────────────────
  const top5Ids = new Set(
    allCandidates
      .filter((c) => c.score !== null && c.score !== undefined)
      .slice(0, 5)
      .map((c) => c.id)
  );

  const visibleCandidates = allCandidates.slice(0, visibleCount);
  const hasMore = visibleCount < allCandidates.length;

  // ── Render guards ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: 'hsl(var(--muted-foreground))' }}>
        Chargement…
      </div>
    );
  }

  if (!offer) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'flex-start' }}>
        <button onClick={() => navigate('/offres')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem' }}>
          <IconArrow /> Retour aux offres
        </button>
        <div style={{ color: 'hsl(var(--destructive))' }}>Offre introuvable.</div>
      </div>
    );
  }

  const tags = offer.tagList ?? (offer.tags ? offer.tags.split(',') : []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── Modals ── */}
      <DeleteModal
        open={!!deleteTarget}
        candidate={deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Nouvelle modal Approve avec choix du type de meet */}
      <ApproveModal
        open={!!approveTarget}
        candidate={approveTarget}
        onConfirm={handleApprove}
        onCancel={() => setApproveTarget(null)}
      />

      {/* ── Bouton retour ── */}
      <button
        onClick={() => navigate('/offres')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem', fontWeight: 500, alignSelf: 'flex-start', padding: 0 }}
      >
        <IconArrow /> Retour aux offres
      </button>

      {/* ── Infos de l'offre ── */}
      <div className="premium-card" style={{ padding: '24px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: '0 0 4px', fontSize: '1.4rem', fontWeight: 800, color: 'hsl(var(--foreground))' }}>{offer.titleFr}</h1>
            <p style={{ margin: '0 0 12px', fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>{offer.titleEn}</p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {offer.location && <span style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline",marginRight:"3px"}}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> {offer.location}</span>}
              {offer.typeFr && <span style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline",marginRight:"3px"}}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg> {offer.typeFr}</span>}
              {offer.experienceFr && <span style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline",marginRight:"3px"}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> {offer.experienceFr}</span>}
              {offer.departmentFr && <span style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}>{offer.departmentFr}</span>}
            </div>
          </div>
          <span className={`status-badge ${offer.active ? 'status-new' : 'status-completed'}`}>
            {offer.active ? 'Publiée' : 'Archivée'}
          </span>
        </div>
        {tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '16px' }}>
            {tags.map((tag) => (
              <span key={tag} style={{ padding: '3px 10px', borderRadius: '9999px', background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))', fontSize: '0.75rem', fontWeight: 500 }}>
                {tag.trim()}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Erreur ── */}
      {error && (
        <div style={{ padding: '12px 16px', borderRadius: '12px', background: 'hsl(var(--destructive) / 0.1)', border: '1px solid hsl(var(--destructive) / 0.3)', color: 'hsl(var(--destructive))', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {/* ── Tableau des candidats ── */}
      <div className="premium-card" style={{ padding: '0', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'hsl(var(--foreground))' }}>
            Candidats externes
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', fontWeight: 500 }}>
            {allCandidates.length} candidature{allCandidates.length !== 1 ? 's' : ''}
          </span>
        </div>

        {allCandidates.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>
            <div style={{ display: 'flex', justifyContent: 'center', margin: '0 0 8px', color: 'hsl(var(--muted-foreground))' }}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Aucune candidature pour l'instant.</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                    {['#', 'Nom', 'Email', 'Score', 'Statut', 'CV', 'Date', 'Actions'].map((h) => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: h === '#' ? 'center' : 'left', fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleCandidates.map((c, index) => {
                    const rank = index + 1;
                    const isTop5 = top5Ids.has(c.id);
                    return (
                      <tr
                        key={c.id}
                        style={{
                          borderBottom: '1px solid hsl(var(--border))',
                          borderLeft: isTop5 ? '3px solid hsl(38 92% 50%)' : '3px solid transparent',
                          background: isTop5 ? 'hsl(38 92% 50% / 0.04)' : 'transparent',
                          transition: 'background 0.15s',
                        }}
                      >
                        {/* Rang */}
                        <td style={{ padding: '14px 16px', textAlign: 'center', width: '40px' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: '26px', height: '26px', borderRadius: '50%', fontSize: '0.72rem', fontWeight: 700,
                            background: isTop5 ? 'hsl(38 92% 50%)' : 'hsl(var(--muted))',
                            color: isTop5 ? '#fff' : 'hsl(var(--muted-foreground))',
                            boxShadow: isTop5 ? '0 0 0 3px hsl(38 92% 50% / 0.25)' : 'none',
                          }}>
                            {rank}
                          </span>
                        </td>

                        {/* Nom */}
                        <td style={{ padding: '14px 16px', fontSize: '0.875rem', fontWeight: isTop5 ? 700 : 500, color: 'hsl(var(--foreground))', whiteSpace: 'nowrap' }}>
                          {isTop5 && <span style={{ marginRight: '6px', display: 'inline-flex', verticalAlign: 'middle', color: 'hsl(var(--primary))' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg></span>}
                          {c.fullName}
                        </td>

                        {/* Email */}
                        <td style={{ padding: '14px 16px', fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.email}
                        </td>

                        {/* Score */}
                        <td style={{ padding: '14px 16px' }}>
                          <ScoreBadge score={c.score} />
                        </td>

                        {/* Statut */}
                        <td style={{ padding: '14px 16px' }}>
                          <StatusBadge status={c.status} candidateId={c.id} onUpdate={handleStatusUpdate} />
                        </td>

                        {/* CV */}
                        <td style={{ padding: '14px 16px' }}>
                          <button
                            onClick={() => setSelectedCandidate(c)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '9999px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer' }}
                          >
                            <IconCV /> Voir CV
                          </button>
                        </td>

                        {/* Date */}
                        <td style={{ padding: '14px 16px', fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))', whiteSpace: 'nowrap' }}>
                          {c.createdAt ? new Date(c.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {/* Approuver — ouvre la modal meetType */}
                            <button
                              onClick={() => setApproveTarget(c)}
                              title="Approuver et convoquer ce candidat"
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                padding: '5px 12px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                                border: '1px solid hsl(142 76% 36% / 0.4)',
                                background: 'hsl(142 76% 36% / 0.08)',
                                color: 'hsl(142 76% 28%)',
                                transition: 'all 0.15s',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = 'hsl(142 76% 36%)'; e.currentTarget.style.color = '#fff'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'hsl(142 76% 36% / 0.08)'; e.currentTarget.style.color = 'hsl(142 76% 28%)'; }}
                            >
                              <IconCheck /> Approuver
                            </button>

                            {/* Supprimer */}
                            <button
                              onClick={() => setDeleteTarget(c)}
                              title="Supprimer ce candidat"
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                padding: '5px 12px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                                border: '1px solid hsl(var(--destructive) / 0.4)',
                                background: 'hsl(var(--destructive) / 0.08)',
                                color: 'hsl(var(--destructive))',
                                transition: 'all 0.15s',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = 'hsl(var(--destructive))'; e.currentTarget.style.color = '#fff'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'hsl(var(--destructive) / 0.08)'; e.currentTarget.style.color = 'hsl(var(--destructive))'; }}
                            >
                              <IconTrash /> Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'hsl(var(--muted) / 0.3)' }}>
              <span style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))' }}>
                Affichage de{' '}
                <strong style={{ color: 'hsl(var(--foreground))' }}>{visibleCandidates.length}</strong>
                {' '}sur{' '}
                <strong style={{ color: 'hsl(var(--foreground))' }}>{allCandidates.length}</strong>
                {' '}candidats
              </span>

              {hasMore ? (
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '8px 18px', borderRadius: '10px', border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--card))', color: 'hsl(var(--foreground))',
                    fontSize: '0.82rem', fontWeight: 600, cursor: loadingMore ? 'wait' : 'pointer',
                    opacity: loadingMore ? 0.6 : 1, transition: 'all 0.15s',
                  }}
                >
                  {loadingMore ? 'Chargement…' : `Voir ${Math.min(PAGE_SIZE, allCandidates.length - visibleCount)} de plus ↓`}
                </button>
              ) : (
                <span style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))', fontStyle: 'italic' }}>
                  Tous les candidats sont affichés
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Légende top 5 */}
      {top5Ids.size > 0 && (
        <p style={{ margin: 0, fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '2px', background: 'hsl(38 92% 50% / 0.3)', border: '2px solid hsl(38 92% 50%)' }} />
          Bordure dorée = Top 5 candidats par score
        </p>
      )}

      {/* Modal CV */}
      {selectedCandidate && (
        <CVModal candidate={selectedCandidate} onClose={() => setSelectedCandidate(null)} />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
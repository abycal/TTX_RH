import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import keycloak from '../../keycloak';
import { getAvatarUrl } from './Parametres';

// ── Icônes SVG professionnelles ────────────────────────────────────────────

const IconUsers = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const IconFile = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);

const IconArrowUpRight = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="7" y1="17" x2="17" y2="7"/>
    <polyline points="7 7 17 7 17 17"/>
  </svg>
);

const IconRefresh = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="17 1 21 5 17 9"/>
    <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
    <polyline points="7 23 3 19 7 15"/>
    <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
  </svg>
);

const IconBriefcase = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>
);

const IconCalendar = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const IconChevronRight = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

const IconMail = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

const IconTrendingUp = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
);

const IconTrendingDown = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
    <polyline points="17 18 23 18 23 12"/>
  </svg>
);

const IconUpload = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16"/>
    <line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
  </svg>
);

const IconPlus = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

// ── Mini courbe SVG ────────────────────────────────────────────────────────

function SparkLine({ data, color = 'hsl(152 55% 38%)', height = 48, fill = false }) {
  if (!data || data.length < 2) return null;
  const w = 200;
  const h = height;
  const pad = 4;
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  });
  const pathD = `M ${points.join(' L ')}`;
  const fillPath = `${pathD} L ${w - pad},${h} L ${pad},${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height }}>
      {fill && (
        <defs>
          <linearGradient id={`grad-${color.replace(/[^a-z0-9]/gi, '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18"/>
            <stop offset="100%" stopColor={color} stopOpacity="0.01"/>
          </linearGradient>
        </defs>
      )}
      {fill && (
        <path d={fillPath} fill={`url(#grad-${color.replace(/[^a-z0-9]/gi, '')})`}/>
      )}
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ── Mini agenda (7 jours) ──────────────────────────────────────────────────

function MiniCalendar({ candidates }) {
  const today = new Date();
  const days = [];
  for (let i = -3; i <= 3; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  const dayLabels = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

  // Simule des événements basés sur les candidats récents
  const eventDots = [0, 1, 3]; // indices (aujourd'hui + quelques jours)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px' }}>
        {days.map((d, i) => {
          const isToday = i === 3;
          const isPast = i < 3;
          return (
            <div
              key={i}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span style={{
                fontSize: '0.6rem',
                fontWeight: 500,
                color: isToday ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                {dayLabels[d.getDay()]}
              </span>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isToday
                  ? 'hsl(152 55% 38%)'
                  : isPast ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.07)',
                border: isToday ? 'none' : '1px solid rgba(255,255,255,0.08)',
              }}>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: isToday ? 700 : 400,
                  color: isToday ? '#fff' : isPast ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.65)',
                }}>
                  {d.getDate()}
                </span>
              </div>
              {/* Point événement */}
              <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: eventDots.includes(i) ? 'hsl(152 55% 38%)' : 'transparent' }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Stat card claire ───────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon, trend, trendVal, color, onClick, sparkData }) {
  const isUp = trend === 'up';
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0',
        padding: '20px 22px 16px',
        background: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border) / 0.6)',
        borderRadius: '1.25rem',
        boxShadow: 'var(--shadow-sm)',
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
        transition: 'box-shadow 0.25s ease, transform 0.25s ease',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{
          width: 34, height: 34, borderRadius: '10px',
          background: `${color}14`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: color,
          flexShrink: 0,
        }}>
          {icon}
        </div>
        {trendVal !== undefined && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '3px',
            fontSize: '0.72rem', fontWeight: 600,
            color: isUp ? 'hsl(152 55% 35%)' : 'hsl(0 65% 50%)',
            background: isUp ? 'hsl(152 55% 38% / 0.1)' : 'hsl(0 65% 50% / 0.1)',
            padding: '2px 7px', borderRadius: '20px',
          }}>
            {isUp ? <IconTrendingUp size={12} /> : <IconTrendingDown size={12} />}
            {trendVal}
          </div>
        )}
      </div>

      <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'hsl(var(--foreground))', margin: '0 0 2px', lineHeight: 1 }}>
        {value}
      </p>
      <p style={{ fontSize: '0.8rem', fontWeight: 500, color: 'hsl(var(--foreground))', margin: '0 0 2px' }}>{label}</p>
      {sub && <p style={{ fontSize: '0.72rem', color: 'hsl(var(--muted-foreground))', margin: '0 0 12px' }}>{sub}</p>}

      {sparkData && (
        <div style={{ marginTop: 'auto' }}>
          <SparkLine data={sparkData} color={color} height={40} fill={true} />
        </div>
      )}
    </button>
  );
}

// ── Activité récente (liste) ───────────────────────────────────────────────

function ActivityRow({ name, action, time, initials, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid hsl(var(--border) / 0.5)' }}>
      <div style={{
        width: 32, height: 32, borderRadius: '9px', flexShrink: 0,
        background: `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: color, fontSize: '0.65rem', fontWeight: 700,
      }}>
        {initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 500, color: 'hsl(var(--foreground))', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</p>
        <p style={{ margin: 0, fontSize: '0.72rem', color: 'hsl(var(--muted-foreground))' }}>{action}</p>
      </div>
      <span style={{ fontSize: '0.68rem', color: 'hsl(var(--muted-foreground))', flexShrink: 0 }}>{time}</span>
    </div>
  );
}

// ── Composant principal ────────────────────────────────────────────────────

export default function Dashboard() {
  const [stats, setStats] = useState({ candidates: 0, templates: 0, transformations: 0, offres: 0 });
  const [candidates, setCandidates] = useState([]);
  const [offres, setOffres] = useState([]);
  const [time, setTime] = useState(new Date());
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  const keycloakId = keycloak?.tokenParsed?.sub || '';

  const fetchProfile = () => {
    api.get('/profile').then(res => setProfile(res.data)).catch(() => {});
  };

  useEffect(() => {
    fetchProfile();
    window.addEventListener('tritux_profile_updated', fetchProfile);
    return () => window.removeEventListener('tritux_profile_updated', fetchProfile);
  }, []);

  // Infos utilisateur — profil backend en priorité, Keycloak en fallback
  const userFullName = (profile?.firstName && profile?.lastName)
    ? `${profile.firstName} ${profile.lastName}`
    : keycloak?.tokenParsed?.name
    || keycloak?.tokenParsed?.preferred_username
    || 'Responsable RH';
  const userEmail = keycloak?.tokenParsed?.email || '';
  const userInitials = userFullName.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();

  // Horloge live
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    Promise.all([
      api.get('/candidates').catch(() => ({ data: [] })),
      api.get('/templates').catch(() => ({ data: [] })),
      api.get('/job-offers').catch(() => ({ data: [] })),
    ]).then(([cands, tmpls, offs]) => {
      setCandidates(Array.isArray(cands.data) ? cands.data : []);
      setOffres(Array.isArray(offs.data) ? offs.data : []);
      setStats({
        candidates: Array.isArray(cands.data) ? cands.data.length : 0,
        templates: Array.isArray(tmpls.data) ? tmpls.data.length : 0,
        transformations: 0,
        offres: Array.isArray(offs.data) ? offs.data.length : 0,
      });
    });
  }, []);

  // Données sparkline simulées basées sur stats réels
  const baseVal = Math.max(stats.candidates, 1);
  const sparkCandidates = [
    Math.max(0, baseVal - 5),
    Math.max(0, baseVal - 3),
    Math.max(0, baseVal - 4),
    Math.max(0, baseVal - 1),
    Math.max(0, baseVal - 2),
    baseVal,
    baseVal,
  ];
  const sparkOffres = [
    Math.max(0, stats.offres - 2),
    Math.max(0, stats.offres - 1),
    Math.max(0, stats.offres - 1),
    stats.offres,
    Math.max(0, stats.offres - 1),
    stats.offres,
    stats.offres,
  ];

  // Derniers candidats pour activité
  const recentCandidates = candidates.slice(-4).reverse();

  const timeStr = time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const monthStr = time.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  const greeting = time.getHours() < 12 ? 'Bonjour' : time.getHours() < 18 ? 'Bon après-midi' : 'Bonsoir';

  // Couleurs
  const green = 'hsl(152, 55%, 38%)';
  const blue = 'hsl(210, 65%, 48%)';
  const orange = 'hsl(25, 85%, 50%)';
  const violet = 'hsl(262, 45%, 50%)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── Action bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', margin: 0 }}>
          Vue d'ensemble de la plateforme RH
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => navigate('/profiles')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '7px',
              padding: '8px 18px', borderRadius: '9999px',
              border: '1px solid hsl(var(--border))',
              background: 'hsl(var(--card))',
              color: 'hsl(var(--foreground))',
              fontSize: '0.8rem', fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <IconUpload size={14} /> Importer un CV
          </button>
          <button
            onClick={() => navigate('/profiles')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '7px',
              padding: '8px 18px', borderRadius: '9999px',
              border: 'none',
              background: 'hsl(var(--foreground))',
              color: 'hsl(var(--card))',
              fontSize: '0.8rem', fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <IconPlus size={14} /> Nouveau profil
          </button>
        </div>
      </div>

      {/* ── Layout principal : gauche stats + droite main card ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start' }}>

        {/* ── Colonne gauche ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Stats grid 2x2 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <StatCard
              label="Profils actifs"
              value={stats.candidates}
              sub="Candidats importés"
              icon={<IconUsers size={16} />}
              trend="up"
              trendVal="+2 ce mois"
              color={green}
              sparkData={sparkCandidates}
              onClick={() => navigate('/profiles')}
            />
            <StatCard
              label="Offres d'emploi"
              value={stats.offres}
              sub="Offres publiées"
              icon={<IconBriefcase size={16} />}
              trend="up"
              trendVal={`+${Math.max(1, Math.floor(stats.offres * 0.2))}`}
              color={blue}
              sparkData={sparkOffres}
              onClick={() => navigate('/offres')}
            />
            <StatCard
              label="Templates"
              value={stats.templates}
              sub="Prêts à l'emploi"
              icon={<IconFile size={16} />}
              color={orange}
              onClick={() => navigate('/templates')}
            />
            <StatCard
              label="CV transformés"
              value={stats.transformations}
              sub="Ce mois-ci"
              icon={<IconRefresh size={16} />}
              color={violet}
              onClick={() => navigate('/transformation')}
            />
          </div>

          {/* Activité récente */}
          <div style={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border) / 0.6)',
            borderRadius: '1.25rem',
            padding: '20px 22px',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'hsl(var(--foreground))', margin: 0 }}>
                Activité récente
              </h2>
              <button
                onClick={() => navigate('/profiles')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))',
                  background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px',
                  borderRadius: '8px',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'hsl(var(--muted))'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                Voir tout <IconChevronRight size={12} />
              </button>
            </div>

            {recentCandidates.length > 0 ? (
              recentCandidates.map((c, i) => {
                const colors = [green, blue, orange, violet];
                const name = `${c.firstName || ''} ${c.lastName || c.name || 'Candidat'}`.trim();
                const initials = name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase() || 'CV';
                return (
                  <ActivityRow
                    key={c.id || i}
                    name={name}
                    action="Profil importé"
                    time="Récent"
                    initials={initials}
                    color={colors[i % colors.length]}
                  />
                );
              })
            ) : (
              <div style={{ padding: '32px 0', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px', opacity: 0.4 }}>
                  <IconUsers size={32} />
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem' }}>Importez des profils pour voir l'activité</p>
              </div>
            )}
          </div>

          {/* Actions rapides */}
          <div style={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border) / 0.6)',
            borderRadius: '1.25rem',
            padding: '20px 22px',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'hsl(var(--foreground))', margin: '0 0 14px' }}>
              Actions rapides
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {[
                { label: 'Importer un CV', path: '/profiles', primary: true },
                { label: 'Voir les templates', path: '/templates', primary: false },
                { label: 'Transformer un CV', path: '/transformation', primary: false },
                { label: "Offres d'emploi", path: '/offres', primary: false },
              ].map(({ label, path, primary }) => (
                <button
                  key={label}
                  onClick={() => navigate(path)}
                  style={{
                    padding: '8px 16px', borderRadius: '9999px',
                    border: primary ? 'none' : '1px solid hsl(var(--border))',
                    background: primary ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
                    color: primary ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
                    fontSize: '0.8rem', fontWeight: 500,
                    cursor: 'pointer', transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* ── Main card sombre (droite) ── */}
        <div style={{
          background: 'hsl(var(--nav-bg))',
          borderRadius: '1.5rem',
          padding: '28px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          boxShadow: 'var(--shadow-nav)',
          position: 'sticky',
          top: '24px',
        }}>

          {/* Heure + salutation */}
          <div>
            <p style={{
              fontSize: '2.6rem', fontWeight: 700, color: '#fff',
              margin: '0 0 2px', lineHeight: 1, letterSpacing: '-0.03em',
              fontFamily: 'Instrument Serif, serif',
            }}>
              {timeStr}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', margin: 0, textTransform: 'capitalize' }}>
              {monthStr}
            </p>
          </div>

          {/* Séparateur */}
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)' }} />

          {/* Profil utilisateur */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: 44, height: 44, borderRadius: '12px', flexShrink: 0,
              background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
            }}>
              {profile?.avatarPath
                ? <img src={`${getAvatarUrl(keycloakId)}?t=${profile.updatedAt || ''}`} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 700 }}>{userInitials}</span>
              }
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {greeting}
              </p>
              {userEmail && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.35)' }}><IconMail size={11} /></span>
                  <p style={{ margin: 0, fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {userEmail}
                  </p>
                </div>
              )}
              <p style={{ margin: '2px 0 0', fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)' }}>
                Responsable RH · Tritux
              </p>
            </div>
          </div>

          {/* Séparateur */}
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)' }} />

          {/* Mini agenda */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}><IconCalendar size={13} /></span>
                <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 500, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Agenda
                </p>
              </div>
              <button
                onClick={() => navigate('/agenda')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '3px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem', padding: '2px 4px',
                  borderRadius: '6px',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
              >
                Ouvrir <IconChevronRight size={11} />
              </button>
            </div>

            <MiniCalendar candidates={candidates} />
          </div>

          {/* Séparateur */}
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)' }} />

          {/* Résumé rapide */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 500, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Résumé
            </p>
            {[
              { label: 'Profils actifs', val: stats.candidates, icon: <IconUsers size={13} />, color: green },
              { label: "Offres publiées", val: stats.offres, icon: <IconBriefcase size={13} />, color: blue },
              { label: 'Templates', val: stats.templates, icon: <IconFile size={13} />, color: orange },
            ].map(({ label, val, icon, color }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.35)' }}>{icon}</span>
                  <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.55)' }}>{label}</span>
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff' }}>{val}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={() => navigate('/agenda')}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', borderRadius: '12px',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.1)',
              cursor: 'pointer', transition: 'background 0.2s',
              marginTop: 'auto',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.11)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
          >
            <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'rgba(255,255,255,0.75)' }}>Voir l'agenda complet</span>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}><IconArrowUpRight size={14} /></span>
          </button>

        </div>
      </div>
    </div>
  );
}
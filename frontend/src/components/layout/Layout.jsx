import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import keycloak from '../../keycloak';
import api from '../../services/api';
import { getAvatarUrl } from '../pages/Parametres';

import logoFull from '../assets/logo-full.png';
import logoIcon from '../assets/logo-icon.png';

const navItems = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    path: '/profiles',
    label: 'Profils',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    path: '/templates',
    label: 'Templates',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
  {
    path: '/transformation',
    label: 'Transformation',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
        <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
      </svg>
    ),
  },
  {
    path: '/offres',
    label: "Offres d'emploi",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
      </svg>
    ),
  },
  {
    path: '/agenda',
    label: 'Agenda',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  // ── Messagerie ────────────────────────────────────────────────────────────
  {
    path: '/messagerie',
    label: 'Messagerie',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
];

const SIDEBAR_EXPANDED = 240;
const SIDEBAR_COLLAPSED = 64;

export default function Layout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [profile, setProfile] = useState(null);

  const keycloakId = keycloak?.tokenParsed?.sub || '';

  const fetchProfile = () => {
    api.get('/profile').then(res => setProfile(res.data)).catch(() => {});
  };

  useEffect(() => {
    fetchProfile();
    window.addEventListener('tritux_profile_updated', fetchProfile);
    return () => window.removeEventListener('tritux_profile_updated', fetchProfile);
  }, []);

  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;

  const now = new Date();
  const greeting =
    now.getHours() < 12 ? 'Bonjour' : now.getHours() < 18 ? 'Bon après-midi' : 'Bonsoir';
  const dateStr = now.toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  const isDashboard = location.pathname === '/dashboard';
  const currentNav = navItems.find((n) => location.pathname.startsWith(n.path));

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'hsl(var(--background))' }}>

      {/* ── Sidebar ── */}
      <aside
        style={{
          position: 'fixed',
          top: collapsed ? 0 : '7px',
          left: collapsed ? 0 : '10px',
          bottom: collapsed ? 0 : 'auto',
          height: collapsed ? '100vh' : 'calc(102.5vh - 32px)',
          width: `${sidebarWidth}px`,
          backgroundColor: 'hsl(var(--nav-bg))',
          color: 'hsl(var(--nav-foreground))',
          borderRadius: collapsed ? '0' : '1rem',
          boxShadow: collapsed ? 'var(--shadow-nav)' : 'var(--shadow-lg)',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Brand row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            padding: collapsed ? '20px 0' : '20px 20px 16px',
            transition: 'padding 0.4s ease',
            flexShrink: 0,
          }}
        >
          {!collapsed && (
            <NavLink to="/dashboard" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', minWidth: 0 }}>
              <img
                src={logoFull}
                alt="Tritux RH"
                style={{ height: '32px', width: 'auto', maxWidth: '160px', objectFit: 'contain', display: 'block' }}
              />
            </NavLink>
          )}

          {collapsed && (
            <NavLink to="/dashboard" style={{ textDecoration: 'none' }}>
              <img
                src={logoIcon}
                alt="Tritux RH"
                style={{ width: '32px', height: '26px', objectFit: 'contain', display: 'block', borderRadius: '12px' }}
              />
            </NavLink>
          )}

          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'hsl(var(--nav-muted))', padding: '4px', borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'color 0.2s, background 0.2s', flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'hsl(var(--nav-active) / 0.6)'; e.currentTarget.style.color = 'hsl(var(--nav-foreground))'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'hsl(var(--nav-muted))'; }}
              title="Réduire"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
          )}
        </div>

        {/* Expand button */}
        {collapsed && (
          <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '8px' }}>
            <button
              onClick={() => setCollapsed(false)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'hsl(var(--nav-muted))', padding: '4px', borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'color 0.2s, background 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'hsl(var(--nav-active) / 0.6)'; e.currentTarget.style.color = 'hsl(var(--nav-foreground))'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'hsl(var(--nav-muted))'; }}
              title="Étendre"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>
        )}

        {/* Divider */}
        <div style={{ height: '1px', background: 'hsl(var(--nav-active) / 0.4)', margin: collapsed ? '0 12px 8px' : '0 16px 8px' }} />

        {/* Nav items */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', padding: collapsed ? '8px 12px' : '8px 12px', overflowY: 'auto' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: collapsed ? '0' : '10px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                padding: collapsed ? '10px 0' : '9px 12px',
                borderRadius: '12px',
                textDecoration: 'none',
                color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--nav-foreground))',
                background: isActive ? 'hsl(var(--nav-active))' : 'transparent',
                fontWeight: isActive ? 500 : 400,
                fontSize: '0.875rem',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              })}
              onMouseEnter={e => {
                if (!e.currentTarget.style.background.includes('nav-active')) {
                  e.currentTarget.style.background = 'hsl(var(--nav-active) / 0.5)';
                }
              }}
              onMouseLeave={e => {
                if (!location.pathname.startsWith(item.path)) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <span style={{ flexShrink: 0, display: 'flex' }}>{item.icon}</span>
              {!collapsed && (
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Divider */}
        <div style={{ height: '1px', background: 'hsl(var(--nav-active) / 0.4)', margin: collapsed ? '8px 12px' : '8px 16px' }} />

        {/* User profile */}
        <NavLink
          to="/parametres"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: collapsed ? '0' : '10px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '16px 0' : '12px 16px 20px',
            textDecoration: 'none',
            transition: 'background 0.2s',
            flexShrink: 0,
          }}
          title={collapsed ? (profile?.firstName || 'Profil') : undefined}
          onMouseEnter={e => e.currentTarget.style.background = 'hsl(var(--nav-active) / 0.4)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <div style={{
            width: 32, height: 32, borderRadius: '9999px', flexShrink: 0,
            background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid hsl(var(--nav-active))',
            overflow: 'hidden',
          }}>
            {profile?.avatarPath
              ? <img src={`${getAvatarUrl(keycloakId)}?t=${profile.updatedAt || ''}`} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ color: 'white', fontSize: '0.75rem', fontWeight: 700 }}>
                  {`${profile?.firstName?.[0] || 'R'}${profile?.lastName?.[0] || 'H'}`.toUpperCase()}
                </span>
            }
          </div>
          {!collapsed && (
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2, overflow: 'hidden' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'hsl(var(--nav-foreground))', whiteSpace: 'nowrap' }}>
                {profile?.firstName && profile?.lastName
                  ? `${profile.firstName} ${profile.lastName}`
                  : 'RH Tritux'}
              </span>
              <span style={{ fontSize: '0.625rem', color: 'hsl(var(--nav-muted))', whiteSpace: 'nowrap' }}>
                {profile?.role || 'Responsable RH'}
              </span>
            </div>
          )}
        </NavLink>
      </aside>

      {/* ── Main content ── */}
      <div
        style={{
          marginLeft: collapsed ? `${SIDEBAR_COLLAPSED}px` : `${SIDEBAR_EXPANDED + 16}px`,
          flex: 1,
          transition: 'margin-left 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          minWidth: 0,
        }}
      >
        {/* Page header */}
        <div style={{ padding: '32px 32px 0' }}>
          <p style={{
            fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.2em',
            color: 'hsl(var(--nav-muted))', margin: '0 0 6px',
          }}>
            {currentNav?.label || 'Espace personnel'}
          </p>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'hsl(var(--nav-muted))', fontSize: '0.875rem', whiteSpace: 'nowrap', paddingBottom: '4px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <span style={{ textTransform: 'capitalize' }}>{dateStr}</span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main style={{ padding: '32px', animation: 'fade-in 0.4s ease-out' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
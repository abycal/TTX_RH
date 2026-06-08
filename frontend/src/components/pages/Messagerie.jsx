import React, { useState, useEffect, useRef, useCallback } from 'react';
import keycloak from '../../keycloak';
import api from '../../services/api';
import { getAvatarUrl } from './Parametres';

const API_BASE = 'http://localhost:9091/api';
const UPLOAD_DIR = `${API_BASE}/chat/files/`;

// ── Helpers ────────────────────────────────────────────────────────────────
function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}
function formatDate(iso) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === yesterday.toDateString()) return 'Hier';
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}
function sameDay(a, b) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}
function humanSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

// ── Icônes ──────────────────────────────────────────────────────────────────
const IconSend = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);
const IconPaperclip = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
  </svg>
);
const IconImage = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
);
const IconFile = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>
  </svg>
);
const IconDownload = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const IconX = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconUsers = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

// ── Avatar ──────────────────────────────────────────────────────────────────
function Avatar({ keycloakId, displayName, hasAvatar, size = 36 }) {
  const [failed, setFailed] = useState(false);
  const initials = displayName
    ? displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  const colors = [
    'linear-gradient(135deg,#6366f1,#8b5cf6)',
    'linear-gradient(135deg,#0ea5e9,#06b6d4)',
    'linear-gradient(135deg,#f59e0b,#ef4444)',
    'linear-gradient(135deg,#10b981,#059669)',
    'linear-gradient(135deg,#ec4899,#f43f5e)',
  ];
  const bg = colors[(displayName?.charCodeAt(0) || 0) % colors.length];

  if (hasAvatar && !failed) {
    return (
      <img
        src={`${getAvatarUrl(keycloakId)}`}
        alt={displayName}
        onError={() => setFailed(true)}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontSize: size * 0.33, fontWeight: 700, flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

// ── Message bubble ──────────────────────────────────────────────────────────
function MessageBubble({ msg, isOwn }) {
  const fileName = msg.fileName;
  const fileUrl = msg.filePath
    ? `${UPLOAD_DIR}${msg.filePath.split(/[/\\]/).pop()}`
    : null;

  return (
    <div style={{
      display: 'flex',
      flexDirection: isOwn ? 'row-reverse' : 'row',
      gap: '10px',
      alignItems: 'flex-end',
    }}>
      {/* Avatar */}
      {!isOwn && (
        <Avatar
          keycloakId={msg.senderKeycloakId}
          displayName={msg.senderDisplayName}
          hasAvatar={msg.senderHasAvatar}
          size={32}
        />
      )}

      <div style={{ maxWidth: '68%', display: 'flex', flexDirection: 'column', gap: '2px', alignItems: isOwn ? 'flex-end' : 'flex-start' }}>
        {/* Sender name (only for others) */}
        {!isOwn && (
          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'hsl(var(--nav-muted))', paddingLeft: '4px' }}>
            {msg.senderDisplayName}
          </span>
        )}

        {/* Bubble */}
        <div style={{
          background: isOwn ? 'hsl(var(--primary))' : 'hsl(var(--card))',
          color: isOwn ? '#fff' : 'hsl(var(--foreground))',
          border: isOwn ? 'none' : '1px solid hsl(var(--border))',
          borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          padding: '10px 14px',
          fontSize: '0.875rem',
          lineHeight: 1.5,
          wordBreak: 'break-word',
          boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
        }}>
          {/* Image */}
          {msg.messageType === 'IMAGE' && fileUrl && (
            <a href={fileUrl} target="_blank" rel="noreferrer">
              <img
                src={fileUrl}
                alt={fileName}
                style={{ maxWidth: '280px', maxHeight: '280px', borderRadius: '10px', display: 'block', marginBottom: msg.content ? '8px' : 0 }}
              />
            </a>
          )}

          {/* File attachment */}
          {msg.messageType === 'FILE' && fileUrl && (
            <a
              href={fileUrl}
              download={fileName}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: isOwn ? 'rgba(255,255,255,0.15)' : 'hsl(var(--background))',
                border: `1px solid ${isOwn ? 'rgba(255,255,255,0.25)' : 'hsl(var(--border))'}`,
                borderRadius: '10px', padding: '8px 12px',
                textDecoration: 'none',
                color: isOwn ? '#fff' : 'hsl(var(--foreground))',
                marginBottom: msg.content ? '8px' : 0,
                fontSize: '0.8rem',
              }}
            >
              <IconFile />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileName}</div>
                <div style={{ opacity: 0.7, fontSize: '0.7rem' }}>{humanSize(msg.fileSize)}</div>
              </div>
              <IconDownload />
            </a>
          )}

          {/* Text content */}
          {msg.content && <span>{msg.content}</span>}
        </div>

        {/* Timestamp */}
        <span style={{ fontSize: '0.65rem', color: 'hsl(var(--nav-muted))', paddingLeft: '4px', paddingRight: '4px' }}>
          {formatTime(msg.createdAt)}
        </span>
      </div>
    </div>
  );
}

// ── Date separator ──────────────────────────────────────────────────────────
function DateSeparator({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '16px 0 8px' }}>
      <div style={{ flex: 1, height: '1px', background: 'hsl(var(--border))' }} />
      <span style={{ fontSize: '0.7rem', color: 'hsl(var(--nav-muted))', fontWeight: 500, whiteSpace: 'nowrap', padding: '2px 10px', background: 'hsl(var(--background))', borderRadius: '999px', border: '1px solid hsl(var(--border))' }}>
        {label}
      </span>
      <div style={{ flex: 1, height: '1px', background: 'hsl(var(--border))' }} />
    </div>
  );
}

// ── File preview chip ───────────────────────────────────────────────────────
function FilePreview({ file, onRemove }) {
  const isImg = file.type.startsWith('image/');
  const [preview, setPreview] = useState(null);
  useEffect(() => {
    if (isImg) { const u = URL.createObjectURL(file); setPreview(u); return () => URL.revokeObjectURL(u); }
  }, [file, isImg]);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '10px', padding: '6px 10px', fontSize: '0.8rem', maxWidth: '260px' }}>
      {isImg && preview
        ? <img src={preview} alt="" style={{ width: 32, height: 32, borderRadius: '6px', objectFit: 'cover' }} />
        : <IconFile />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{file.name}</div>
        <div style={{ color: 'hsl(var(--nav-muted))', fontSize: '0.7rem' }}>{humanSize(file.size)}</div>
      </div>
      <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--nav-muted))', display: 'flex', padding: '2px' }}>
        <IconX />
      </button>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
export default function Messagerie() {
  const myKeycloakId = keycloak?.tokenParsed?.sub || '';
  const [messages, setMessages]       = useState([]);
  const [text, setText]               = useState('');
  const [pendingFile, setPendingFile] = useState(null);
  const [sending, setSending]         = useState(false);
  const [connected, setConnected]     = useState(false);
  const [onlineCount, setOnlineCount] = useState(1);
  const bottomRef   = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const textareaRef = useRef(null);
  const eventSourceRef = useRef(null);

  // ── Scroll to bottom ─────────────────────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // ── Load history ─────────────────────────────────────────────────────────
  useEffect(() => {
    api.get('/chat/messages').then(res => {
      setMessages(res.data);
      setTimeout(scrollToBottom, 100);
    }).catch(() => {});
  }, [scrollToBottom]);

  // ── SSE connection ────────────────────────────────────────────────────────
  useEffect(() => {
    const token = keycloak.token;
    const url = `${API_BASE}/chat/stream`;

    // EventSource ne supporte pas les headers — on passe le token via cookie
    // ou on utilise fetch SSE. On utilise fetch pour injecter le token.
    let controller = new AbortController();

    const connect = async () => {
      try {
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        if (!response.ok) { setConnected(false); return; }
        setConnected(true);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop();
          for (const part of parts) {
            const dataLine = part.split('\n').find(l => l.startsWith('data:'));
            const eventLine = part.split('\n').find(l => l.startsWith('event:'));
            if (!dataLine) continue;
            const data = dataLine.replace(/^data:\s?/, '');
            const event = eventLine?.replace(/^event:\s?/, '') || 'message';
            if (event === 'ping') continue;
            if (event === 'message') {
              try {
                const msg = JSON.parse(data);
                setMessages(prev => {
                  // Éviter les doublons
                  if (prev.some(m => m.id === msg.id)) return prev;
                  return [...prev, msg];
                });
                setTimeout(scrollToBottom, 50);
              } catch (_) {}
            }
          }
        }
      } catch (e) {
        if (e.name !== 'AbortError') {
          setConnected(false);
          // Reconnexion après 3s
          setTimeout(connect, 3000);
        }
      }
    };

    connect();
    return () => { controller.abort(); };
  }, [scrollToBottom]);

  // ── Send ──────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (sending) return;
    if (!text.trim() && !pendingFile) return;

    setSending(true);
    try {
      if (pendingFile) {
        const form = new FormData();
        form.append('file', pendingFile);
        if (text.trim()) form.append('caption', text.trim());
        await api.post('/chat/messages/file', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setPendingFile(null);
      } else {
        await api.post('/chat/messages', { content: text.trim() });
      }
      setText('');
      textareaRef.current?.focus();
    } catch (e) {
      console.error('Send error', e);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    e.target.value = '';
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 160px)',
      background: 'hsl(var(--background))',
      borderRadius: '16px',
      border: '1px solid hsl(var(--border))',
      overflow: 'hidden',
      boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
    }}>

      {/* ── Header ── */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid hsl(var(--border))',
        background: 'hsl(var(--card))',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexShrink: 0,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '12px',
          background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
        }}>
          <IconUsers />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'hsl(var(--foreground))' }}>
            Messagerie — Tritux RH
          </div>
          <div style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', color: 'hsl(var(--nav-muted))' }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: connected ? '#22c55e' : '#f59e0b',
              display: 'inline-block',
            }} />
            {connected ? 'Connecté · messages en temps réel' : 'Reconnexion…'}
          </div>
        </div>
      </div>

      {/* ── Messages ── */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'hsl(var(--nav-muted))', marginTop: '60px', fontSize: '0.9rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>💬</div>
            Soyez le premier à envoyer un message !
          </div>
        )}

        {messages.map((msg, idx) => {
          const prev = messages[idx - 1];
          const showDate = !prev || !sameDay(prev.createdAt, msg.createdAt);
          const isOwn = msg.senderKeycloakId === myKeycloakId;
          return (
            <React.Fragment key={msg.id}>
              {showDate && <DateSeparator label={formatDate(msg.createdAt)} />}
              <MessageBubble msg={msg} isOwn={isOwn} />
            </React.Fragment>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* ── File preview ── */}
      {pendingFile && (
        <div style={{ padding: '8px 24px 0', flexShrink: 0 }}>
          <FilePreview file={pendingFile} onRemove={() => setPendingFile(null)} />
        </div>
      )}

      {/* ── Input bar ── */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid hsl(var(--border))',
        background: 'hsl(var(--card))',
        display: 'flex',
        alignItems: 'flex-end',
        gap: '10px',
        flexShrink: 0,
      }}>
        {/* Image button */}
        <button
          onClick={() => imageInputRef.current?.click()}
          title="Envoyer une image"
          style={{
            background: 'none', border: '1px solid hsl(var(--border))',
            borderRadius: '10px', padding: '8px', cursor: 'pointer',
            color: 'hsl(var(--nav-muted))', display: 'flex', alignItems: 'center',
            transition: 'all 0.2s', flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'hsl(var(--nav-active))'; e.currentTarget.style.color = 'hsl(var(--primary))'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'hsl(var(--nav-muted))'; }}
        >
          <IconImage />
        </button>
        <input ref={imageInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFileSelect(e, 'image')} />

        {/* File button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          title="Envoyer un fichier"
          style={{
            background: 'none', border: '1px solid hsl(var(--border))',
            borderRadius: '10px', padding: '8px', cursor: 'pointer',
            color: 'hsl(var(--nav-muted))', display: 'flex', alignItems: 'center',
            transition: 'all 0.2s', flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'hsl(var(--nav-active))'; e.currentTarget.style.color = 'hsl(var(--primary))'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'hsl(var(--nav-muted))'; }}
        >
          <IconPaperclip />
        </button>
        <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={e => handleFileSelect(e, 'file')} />

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Écrivez un message… (Entrée pour envoyer, Maj+Entrée pour saut de ligne)"
          rows={1}
          style={{
            flex: 1,
            resize: 'none',
            border: '1px solid hsl(var(--border))',
            borderRadius: '12px',
            padding: '10px 14px',
            fontSize: '0.875rem',
            background: 'hsl(var(--background))',
            color: 'hsl(var(--foreground))',
            outline: 'none',
            lineHeight: 1.5,
            maxHeight: '120px',
            overflowY: 'auto',
            fontFamily: 'inherit',
            transition: 'border-color 0.2s',
          }}
          onFocus={e => e.target.style.borderColor = 'hsl(var(--primary))'}
          onBlur={e => e.target.style.borderColor = 'hsl(var(--border))'}
          onInput={e => {
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
          }}
        />

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={sending || (!text.trim() && !pendingFile)}
          style={{
            background: 'hsl(var(--primary))',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            padding: '10px 16px',
            cursor: sending || (!text.trim() && !pendingFile) ? 'not-allowed' : 'pointer',
            opacity: sending || (!text.trim() && !pendingFile) ? 0.5 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'opacity 0.2s, transform 0.1s',
            flexShrink: 0,
          }}
          onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.transform = 'scale(1.05)'; }}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          title="Envoyer (Entrée)"
        >
          <IconSend />
        </button>
      </div>
    </div>
  );
}
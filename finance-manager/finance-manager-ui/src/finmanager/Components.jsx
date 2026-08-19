// Components.jsx — shared chrome and primitives for FinManager v2

import { useState as useS, useEffect as useE, useRef as useR, useCallback as useCB } from 'react';
import { useTranslation } from 'react-i18next';
import { FM_DATA, FM_FMT } from './data';
import { Sparkline } from './Charts';
import { categoryApi, transactionApi } from '../api/transactionApi';
import { notificationApi } from '../api/notificationApi';

// ─── Icon factory ────────────────────────────────────────────────
const I = (path, opts = {}) => (props) => (
  <svg width={props.size || 18} height={props.size || 18} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={opts.sw || 1.6} strokeLinecap="round" strokeLinejoin="round"
    style={props.style} className={props.className}>{path}</svg>
);

export const Icon = {
  Dashboard:  I(<><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></>),
  Txn:        I(<><path d="M3 7h14l-3-3M21 17H7l3 3"/></>),
  Budget:     I(<><circle cx="12" cy="12" r="9"/><path d="M12 3v9l6 4"/></>),
  Goal:       I(<><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></>),
  Account:    I(<><path d="M3 8l9-5 9 5"/><path d="M5 10v8M19 10v8M9 10v8M15 10v8"/><path d="M3 21h18"/></>),
  Report:     I(<><path d="M3 21V5a2 2 0 012-2h11l5 5v13z"/><path d="M16 3v6h5"/><path d="M8 14l3-3 3 3 4-4"/></>),
  Bot:        I(<><rect x="4" y="7" width="16" height="12" rx="3"/><path d="M9 12h.01M15 12h.01"/><path d="M12 3v4M8 19v2M16 19v2"/></>),
  Market:     I(<><path d="M3 17l6-6 4 4 7-8"/><path d="M14 7h7v7"/></>),
  Tag:        I(<><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/><path d="M9 9h6v6H9z"/></>),
  User:       I(<><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></>),
  Shield:     I(<><path d="M12 2l8 4v6c0 5-4 9-8 10-4-1-8-5-8-10V6z"/></>),
  Logout:     I(<><path d="M9 4H5a2 2 0 00-2 2v12a2 2 0 002 2h4"/><path d="M16 17l5-5-5-5M21 12H9"/></>),
  Search:     I(<><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></>),
  Bell:       I(<><path d="M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 004 0"/></>),
  Plus:       I(<><path d="M12 5v14M5 12h14"/></>),
  Check:      I(<><path d="M5 12l5 5L20 7"/></>),
  X:          I(<><path d="M6 6l12 12M18 6L6 18"/></>),
  Sun:        I(<><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.42-1.42"/></>),
  Moon:       I(<><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></>),
  Eye:        I(<><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></>),
  EyeOff:     I(<><path d="M17.94 17.94A10.94 10.94 0 0112 19c-6 0-10-7-10-7a19.83 19.83 0 014.06-5.06M9.9 4.24A10.93 10.93 0 0112 4c6 0 10 7 10 7a19.5 19.5 0 01-2.5 3.5"/><path d="M1 1l22 22"/><path d="M14.12 14.12a3 3 0 11-4.24-4.24"/></>),
  Lock:       I(<><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></>),
  Trend:      I(<><path d="M3 17l6-6 4 4 7-8"/><path d="M14 7h7v7"/></>),
  Sparkles:   I(<><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/><path d="M19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7z"/></>),
  Alert:      I(<><path d="M10.3 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></>),
  Arrow:      I(<><path d="M5 12h14M13 6l6 6-6 6"/></>),
  Globe:      I(<><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></>),
  MapPin:     I(<><path d="M21 10c0 6-9 13-9 13S3 16 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></>),
  Camera:     I(<><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></>),
  Phone:      I(<><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.13 1 .37 1.96.72 2.86a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.22-1.22a2 2 0 012.11-.45c.9.35 1.86.59 2.86.72A2 2 0 0122 16.92z"/></>),
  Mail:       I(<><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></>),
  Refresh:    I(<><path d="M1 4v6h6"/><path d="M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15"/></>),
  Trash:      I(<><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></>),
  Filter:     I(<><path d="M3 5h18l-7 9v6l-4-2v-4z"/></>),
  Chevron:    I(<><path d="M9 6l6 6-6 6"/></>),
  ChevronDown:I(<><path d="M6 9l6 6 6-6"/></>),
};

function decodeJwt(token) {
  try { return JSON.parse(atob(token.split('.')[1])); } catch { return {}; }
}

// ─── Notification Panel ──────────────────────────────────────────
function NotificationPanel({ onClose, onUnreadChange }) {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useS([]);
  const [loading, setLoading] = useS(true);

  const load = useCB(() => {
    notificationApi.getAll()
      .then(res => setNotifications(res.data?.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useE(() => { load(); }, [load]);

  function relativeTime(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins  = Math.floor(diff / 60_000);
    const hours = Math.floor(diff / 3_600_000);
    const days  = Math.floor(diff / 86_400_000);
    if (mins < 1)  return t('notifications.justNow');
    if (mins < 60) return t('notifications.minutesAgo', { count: mins });
    if (hours < 24) return t('notifications.hoursAgo', { count: hours });
    return t('notifications.daysAgo', { count: days });
  }

  const typeIcon = {
    BUDGET_ALERT:    '💸',
    UNUSUAL_SPEND:   '⚠️',
    LOW_BALANCE:     '🔴',
    MONTHLY_REPORT:  '📊',
    MARKET_ALERT:    '📈',
    AI_INSIGHT:      '🤖',
    RECURRING_REMINDER: '🔔',
    GENERAL:         '💬',
  };

  async function markRead(id) {
    await notificationApi.markRead(id).catch(() => {});
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    const unread = notifications.filter(n => n.id !== id && !n.read).length;
    onUnreadChange?.(unread);
  }

  async function markAllRead() {
    await notificationApi.markAllRead().catch(() => {});
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    onUnreadChange?.(0);
  }

  async function clearAll() {
    await notificationApi.deleteAll().catch(() => {});
    setNotifications([]);
    onUnreadChange?.(0);
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="fm-notif-panel" onClick={e => e.stopPropagation()}>
      {/* Header */}
      <div className="fm-notif-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>{t('notifications.title')}</span>
          {unreadCount > 0 && (
            <span className="fm-badge danger">{unreadCount}</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {unreadCount > 0 && (
            <button className="fm-btn fm-ghost fm-sm" onClick={markAllRead}>
              {t('notifications.markAllRead')}
            </button>
          )}
          {notifications.length > 0 && (
            <button className="fm-btn fm-ghost fm-sm" style={{ color: 'var(--fm-danger)' }} onClick={clearAll}>
              {t('notifications.clearAll')}
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="fm-notif-list">
        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--fm-text-muted)', fontSize: 13 }}>
            {t('common.loading')}
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔔</div>
            <div style={{ fontSize: 13, color: 'var(--fm-text-muted)' }}>{t('notifications.noNotifications')}</div>
          </div>
        ) : notifications.map(n => (
          <div key={n.id} className={`fm-notif-item${n.read ? '' : ' unread'}`}
               onClick={() => !n.read && markRead(n.id)}>
            <div className="fm-notif-icon">{typeIcon[n.type] ?? '💬'}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: n.read ? 500 : 700, fontSize: 13, marginBottom: 2 }}>
                {n.title}
              </div>
              <div style={{ fontSize: 12, color: 'var(--fm-text-muted)', lineHeight: 1.5 }}>
                {n.message}
              </div>
              <div style={{ fontSize: 11, color: 'var(--fm-text-dim)', marginTop: 4 }}>
                {relativeTime(n.createdAt)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Language Switcher ────────────────────────────────────────────
function LangSwitcher({ lang, setLang }) {
  const [open, setOpen] = useS(false);
  const ref = useR(null);

  useE(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const langs = [
    { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'en', label: 'English',    flag: '🇬🇧' },
  ];
  const current = langs.find(l => l.code === lang) ?? langs[0];

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="fm-lang-btn" onClick={() => setOpen(o => !o)}>
        <span>{current.flag}</span>
        <span style={{ display: 'none' }}>{current.code.toUpperCase()}</span>
        <Icon.ChevronDown size={12}/>
      </button>
      {open && (
        <div className="fm-lang-dropdown">
          {langs.map(l => (
            <div key={l.code} className={`fm-lang-opt${lang === l.code ? ' active' : ''}`}
                 onClick={() => { setLang(l.code); setOpen(false); }}>
              <span style={{ fontSize: 18 }}>{l.flag}</span>
              <span>{l.label}</span>
              {lang === l.code && <Icon.Check size={13} style={{ marginLeft: 'auto', color: 'var(--fm-accent)' }}/>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────
export function Sidebar({ route, setRoute, mobileOpen, unreadCount = 0 }) {
  const { t } = useTranslation();

  const NAV_MAIN = [
    { id: 'dashboard',    icon: 'Dashboard', key: 'nav.dashboard' },
    { id: 'transactions', icon: 'Txn',       key: 'nav.transactions' },
    { id: 'budgets',      icon: 'Budget',    key: 'nav.budgets' },
    { id: 'goals',        icon: 'Goal',      key: 'nav.goals' },
    { id: 'accounts',     icon: 'Account',   key: 'nav.accounts' },
    { id: 'categories',   icon: 'Tag',       key: 'nav.categories' },
    { id: 'reports',      icon: 'Report',    key: 'nav.reports' },
    { id: 'insights',     icon: 'Bot',       key: 'nav.insights',  badge: 'AI' },
    { id: 'market',       icon: 'Market',    key: 'nav.market',    badge: 'LIVE' },
  ];
  const NAV_ACCOUNT = [
    { id: 'profile',  icon: 'User',   key: 'nav.profile' },
    { id: 'security', icon: 'Shield', key: 'nav.security' },
    { id: 'auth',     icon: 'Logout', key: 'nav.logout' },
  ];

  const { fullName, name, sub } = decodeJwt(localStorage.getItem('token') || '');
  const userName = fullName ?? name ?? sub ?? 'User';
  const initials = userName.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'U';

  return (
    <aside className={`fm-sidebar${mobileOpen ? ' fm-mobile-open' : ''}`}>
      {/* Brand */}
      <div className="fm-brand">
        <div className="fm-brand-mark">F</div>
        <div>
          <div className="fm-brand-name">FinManager</div>
          <div className="fm-brand-sub">AI · Personal Finance</div>
        </div>
      </div>

      <div className="fm-nav-section">{t('nav.main')}</div>

      {NAV_MAIN.map(n => {
        const IconC = Icon[n.icon];
        const isActive = route === n.id;
        return (
          <div key={n.id} className={`fm-nav-item${isActive ? ' active' : ''}`}
               onClick={() => setRoute(n.id)} title={t(n.key)}>
            <span className="fm-nav-icon"><IconC size={17}/></span>
            <span style={{ flex: 1 }}>{t(n.key)}</span>
            {n.badge === 'AI'   && <span className="fm-nav-badge new">AI</span>}
            {n.badge === 'LIVE' && (
              <span className="fm-nav-badge" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
                <span className="fm-live-dot" style={{ width: 5, height: 5, display: 'inline-block', marginRight: 3 }}/>
                LIVE
              </span>
            )}
          </div>
        );
      })}

      <div className="fm-nav-section" style={{ marginTop: 8 }}>{t('nav.settings')}</div>

      {NAV_ACCOUNT.map(n => {
        const IconC = Icon[n.icon];
        return (
          <div key={n.id} className={`fm-nav-item${route === n.id ? ' active' : ''}`}
               onClick={() => setRoute(n.id)} title={t(n.key)}>
            <span className="fm-nav-icon"><IconC size={17}/></span>
            <span>{t(n.key)}</span>
          </div>
        );
      })}

      {/* User foot */}
      <div className="fm-sidebar-foot">
        <div className="fm-avatar sz-md">{initials}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fm-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</div>
          <div style={{ fontSize: 10.5, color: 'var(--fm-text-muted)' }}>Personal · VND</div>
        </div>
        {unreadCount > 0 && (
          <div className="fm-badge danger" style={{ marginLeft: 'auto', flexShrink: 0 }}>{unreadCount}</div>
        )}
      </div>
    </aside>
  );
}

// ─── Topbar ──────────────────────────────────────────────────────
export function Topbar({
  title, dark, onToggleDark,
  onOpenAdd, onOpenChat, onOpenSmart, onOpenNav,
  unreadCount, notifOpen, setNotifOpen, onUnreadChange,
  lang, setLang,
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useS('');
  const notifRef = useR(null);

  // Close notif panel on outside click
  useE(() => {
    if (!notifOpen) return;
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notifOpen, setNotifOpen]);

  return (
    <div className="fm-topbar">
      {/* Hamburger (mobile) */}
      <button className="fm-ibtn fm-mob-menu" onClick={onOpenNav} style={{ display: 'none' }}>
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
          <path d="M3 6h18M3 12h18M3 18h18"/>
        </svg>
      </button>

      {/* Title */}
      <div className="fm-topbar-title">{title}</div>

      {/* Search */}
      <div className="fm-search">
        <span className="fm-search-icon"><Icon.Search size={14}/></span>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder={t('topbar.search')}/>
        <kbd>{t('topbar.searchShortcut')}</kbd>
      </div>

      {/* Actions */}
      <div className="fm-topbar-actions">
        {/* Language switcher */}
        <LangSwitcher lang={lang} setLang={setLang}/>

        {/* Dark/light toggle */}
        <button className="fm-ibtn" onClick={onToggleDark} title={dark ? t('topbar.lightMode') : t('topbar.darkMode')}>
          {dark ? <Icon.Sun size={16}/> : <Icon.Moon size={16}/>}
        </button>

        {/* Notification bell */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            className={`fm-ibtn${notifOpen ? ' active' : ''}`}
            onClick={() => setNotifOpen(o => !o)}
            title={t('topbar.notifications')}
          >
            <Icon.Bell size={16}/>
            {unreadCount > 0 && (
              <div className="fm-notif-badge">
                {unreadCount > 9 ? '9+' : unreadCount}
              </div>
            )}
          </button>
          {notifOpen && (
            <NotificationPanel
              onClose={() => setNotifOpen(false)}
              onUnreadChange={onUnreadChange}
            />
          )}
        </div>

        {/* AI Chat */}
        <button className="fm-ibtn" onClick={onOpenChat} title={t('topbar.aiAssistant')}>
          <Icon.Bot size={16}/>
        </button>

        {/* Smart Input */}
        <button className="fm-ibtn" onClick={onOpenSmart} title={t('topbar.smartInput')}
          style={{ color: 'var(--fm-accent)' }}>
          <Icon.Sparkles size={16}/>
        </button>

        {/* Add transaction */}
        <button className="fm-btn fm-primary fm-sm" onClick={onOpenAdd}>
          <Icon.Plus size={13}/>{t('transactions.add')}
        </button>
      </div>
    </div>
  );
}

// ─── StatCard ────────────────────────────────────────────────────
export function StatCard({ label, value, delta, deltaLabel, spark, sparkColor, currency = '₫', children }) {
  const isPos = (delta || 0) >= 0;
  const fmt = FM_FMT;
  return (
    <div className="fm-card fm-card-hover">
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--fm-text-muted)', fontWeight: 600, marginBottom: 8 }}>{label}</div>
      {children ?? (
        <div className="fm-stat-val">
          <span>{typeof value === 'number' ? fmt.vnd(value, { compact: Math.abs(value) >= 1e6 }) : value}</span>
          <span className="fm-stat-cur">{currency}</span>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, gap: 8 }}>
        {delta != null ? (
          <span className={`fm-stat-delta ${isPos ? 'pos' : 'neg'}`}>
            {isPos ? '↑' : '↓'} {fmt.vnd(Math.abs(delta), { compact: true })}
            {deltaLabel && <span style={{ color: 'var(--fm-text-dim)', marginLeft: 4 }}>{deltaLabel}</span>}
          </span>
        ) : <span/>}
        {spark && <Sparkline values={spark} color={sparkColor || (isPos ? '#10b981' : '#f97316')}/>}
      </div>
    </div>
  );
}

// ─── Toast ───────────────────────────────────────────────────────
export function Toast({ message, onClose }) {
  useE(() => {
    if (!message) return;
    const id = setTimeout(onClose, 3200);
    return () => clearTimeout(id);
  }, [message, onClose]);
  if (!message) return null;
  return (
    <div className="fm-toast">
      <Icon.Check size={16} style={{ color: 'var(--fm-accent)', flexShrink: 0 }}/>
      <span>{message}</span>
    </div>
  );
}

// ─── Modal ───────────────────────────────────────────────────────
export function Modal({ open, title, onClose, children, foot, wide }) {
  if (!open) return null;
  return (
    <div className="fm-modal-back" onClick={onClose}>
      <div className="fm-modal"
           style={wide ? { width: 'min(640px, calc(100% - 32px))' } : undefined}
           onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>{title}</div>
          <button className="fm-ibtn" onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8 }}>
            <Icon.X size={13}/>
          </button>
        </div>
        {children}
        {foot && <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>{foot}</div>}
      </div>
    </div>
  );
}

// ─── Drawer ──────────────────────────────────────────────────────
export function Drawer({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <>
      <div className="fm-drawer-back" onClick={onClose}/>
      <div className="fm-drawer">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexShrink: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>{title}</div>
          <button className="fm-ibtn" onClick={onClose} style={{ width: 28, height: 28 }}>
            <Icon.X size={13}/>
          </button>
        </div>
        {children}
      </div>
    </>
  );
}

// ─── Segmented Control ────────────────────────────────────────────
export function Segmented({ value, onChange, options }) {
  return (
    <div className="fm-seg">
      {options.map(o => (
        <button key={o.value ?? o} className={value === (o.value ?? o) ? 'active' : ''}
                onClick={() => onChange(o.value ?? o)}>
          {o.label ?? o}
        </button>
      ))}
    </div>
  );
}

// ─── Category Icon ────────────────────────────────────────────────
export function CatIcon({ catId, size = 34 }) {
  const cat = FM_DATA.catBy[catId];
  if (!cat) return null;
  return (
    <div className="fm-cat-ic" style={{
      width: size, height: size,
      background: `color-mix(in oklab, ${cat.color} 14%, var(--fm-surface-2))`,
      borderColor: `color-mix(in oklab, ${cat.color} 30%, transparent)`,
      color: cat.color,
    }}>{cat.icon}</div>
  );
}

// ─── Transaction Row ──────────────────────────────────────────────
export function TxnRow({ t: txn, onClick, showDate = false }) {
  const fmt = FM_FMT;
  const isPos = txn.amount > 0;
  const merchantLabel = txn.merchant ?? txn.note ?? txn.categoryName ?? '—';
  const catLabel = txn.categoryName ?? FM_DATA.catBy[txn.category]?.name ?? '—';
  const catIcon  = txn.categoryIcon ?? FM_DATA.catBy[txn.category]?.icon ?? '💳';
  return (
    <div className="fm-row" onClick={() => onClick && onClick(txn)}
         style={{ cursor: onClick ? 'pointer' : 'default' }}>
      {txn.category ? <CatIcon catId={txn.category}/> : (
        <div className="fm-cat-ic" style={{ width: 36, height: 36 }}>{catIcon}</div>
      )}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="fm-row-merchant">{merchantLabel}</div>
        <div className="fm-row-cat">{catLabel}{showDate && ` · ${fmt.date(txn.date)}`}</div>
      </div>
      <div className={`fm-row-amt${isPos ? ' pos' : ''}`}>
        {isPos ? '+' : '−'}{fmt.vnd(Math.abs(txn.amount))}<span style={{ color: 'var(--fm-text-dim)', marginLeft: 3, fontWeight: 400 }}>₫</span>
      </div>
    </div>
  );
}

// ─── Quick Add ────────────────────────────────────────────────────
const CAT_COLORS = ['#00d4aa','#f97316','#6366f1','#a855f7','#ec4899','#f59e0b','#3b82f6','#10b981','#ef4444','#64748b'];

export function QuickAdd({ onSave }) {
  const { t } = useTranslation();
  const [amount, setAmount] = useS('');
  const [note,   setNote]   = useS('');
  const [catId,  setCatId]  = useS(null);
  const [type,   setType]   = useS('expense');
  const [cats,   setCats]   = useS([]);
  const [saving, setSaving] = useS(false);
  const [error,  setError]  = useS(null);

  useE(() => {
    categoryApi.getAll()
      .then(res => {
        const list = res.data?.data ?? [];
        setCats(list);
        if (list.length > 0) setCatId(list[0].id);
      }).catch(() => {});
  }, []);

  async function handleSave() {
    if (!amount || !catId) return;
    const parsed = parseFloat(String(amount).replace(/[^0-9.]/g, ''));
    if (!parsed || parsed <= 0) { setError('Số tiền không hợp lệ'); return; }
    setSaving(true); setError(null);
    try {
      await transactionApi.create({
        amount: parsed,
        type: type === 'income' ? 'INCOME' : 'EXPENSE',
        date: new Date().toISOString().slice(0, 10),
        note: note || null,
        categoryId: catId,
      });
      onSave?.();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Lỗi lưu giao dịch');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {error && (
        <div style={{ background: 'var(--fm-danger-soft)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '10px 14px', color: 'var(--fm-danger)', fontSize: 13 }}>
          {error}
        </div>
      )}
      <Segmented value={type} onChange={setType} options={[
        { value: 'expense', label: t('transactions.expense') },
        { value: 'income',  label: t('transactions.income') },
      ]}/>
      <div>
        <label className="fm-label">{t('transactions.amount')} (₫)</label>
        <input className="fm-input fm-mono" value={amount} onChange={e => setAmount(e.target.value)}
          placeholder="0" style={{ fontSize: 22, height: 56, fontWeight: 700, letterSpacing: '-0.02em' }}
          onKeyDown={e => e.key === 'Enter' && handleSave()}/>
      </div>
      <div>
        <label className="fm-label">{t('transactions.note')}</label>
        <input className="fm-input" value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Phở Thìn, Grab…"/>
      </div>
      {cats.length > 0 && (
        <div>
          <label className="fm-label">{t('transactions.category')}</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {cats.map((c, i) => {
              const color = CAT_COLORS[i % CAT_COLORS.length];
              const selected = catId === c.id;
              return (
                <button key={c.id} className="fm-btn" onClick={() => setCatId(c.id)} style={{
                  height: 60, flexDirection: 'column', gap: 3, fontSize: 11, padding: '6px 4px',
                  borderColor: selected ? color : 'var(--fm-border)',
                  background: selected ? `color-mix(in oklab, ${color} 12%, var(--fm-surface))` : 'var(--fm-surface)',
                  boxShadow: selected ? `0 0 0 1px ${color}40` : 'none',
                }}>
                  <span style={{ fontSize: 17 }}>{c.icon || '💳'}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                    {c.name.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
      <button className="fm-btn fm-primary" onClick={handleSave} disabled={saving || !amount || !catId}
              style={{ justifyContent: 'center', height: 42 }}>
        <Icon.Check size={14}/>
        {saving ? t('common.loading') : t('common.save')}
      </button>
    </div>
  );
}

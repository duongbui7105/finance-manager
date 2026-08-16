// App.jsx — FinManager root with state-based routing + i18n + notifications + market

import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Sidebar, Topbar, Toast, Modal, Drawer, QuickAdd } from './finmanager/Components';
import { TweaksPanel, useTweaks } from './finmanager/TweaksPanel';
import { AiChatDrawer, SmartInputModal } from './finmanager/AiPanel';
import { DashboardScreen, TransactionsScreen, BudgetsScreen, GoalsScreen } from './finmanager/ScreensMain';
import { AccountsScreen, ReportsScreen, InsightsScreen, ProfileScreen, SecurityScreen, AuthScreen } from './finmanager/ScreensExtra';
import { MarketScreen } from './finmanager/MarketScreen';
import { FM_DATA, FM_FMT } from './finmanager/data';
import { notificationApi } from './api/notificationApi';

const ROUTES = [
  'dashboard','transactions','budgets','goals','accounts',
  'reports','insights','market','profile','security','auth'
];

export default function App() {
  const tweaks = useTweaks();
  const { t, i18n } = useTranslation();

  // ── Auth ──────────────────────────────────────────────
  const [authed, setAuthed]   = useState(() => !!localStorage.getItem('token'));
  const [route,  setRoute]    = useState('dashboard');
  const [range,  setRange]    = useState('6m');

  // ── UI state ──────────────────────────────────────────
  const [toast,       setToast]       = useState(null);
  const [txnDetail,   setTxnDetail]   = useState(null);
  const [quickAdd,    setQuickAdd]    = useState(false);
  const [chatOpen,    setChatOpen]    = useState(false);
  const [smartOpen,   setSmartOpen]   = useState(false);
  const [refreshKey,  setRefreshKey]  = useState(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // ── Theme ─────────────────────────────────────────────
  const [dark, setDark] = useState(() => localStorage.getItem('fm-theme') !== 'light');
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? '' : 'light';
    localStorage.setItem('fm-theme', dark ? 'dark' : 'light');
  }, [dark]);

  // ── Language ──────────────────────────────────────────
  const [lang, setLang] = useState(() => localStorage.getItem('fm-lang') || i18n.language || 'vi');
  useEffect(() => {
    i18n.changeLanguage(lang);
    localStorage.setItem('fm-lang', lang);
  }, [lang, i18n]);

  // ── Notifications ─────────────────────────────────────
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen,   setNotifOpen]   = useState(false);

  const fetchUnreadCount = useCallback(() => {
    if (!authed) return;
    notificationApi.getUnreadCount()
      .then(res => setUnreadCount(res.data?.data?.count ?? 0))
      .catch(() => {});
  }, [authed]);

  // Poll unread count every 30s while authed
  useEffect(() => {
    fetchUnreadCount();
    if (!authed) return;
    const interval = setInterval(fetchUnreadCount, 30_000);
    return () => clearInterval(interval);
  }, [authed, fetchUnreadCount]);

  // ── Force-logout on 401/403 ───────────────────────────
  useEffect(() => {
    const handler = () => { setAuthed(false); setRoute('dashboard'); };
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, []);

  // ── Helpers ───────────────────────────────────────────
  const addToast = useCallback((msg) => { setToast(msg); }, []);
  const hideToast = useCallback(() => setToast(null), []);

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuthed(false);
    setRoute('dashboard');
    setUnreadCount(0);
  }

  function navigate(r) {
    if (!ROUTES.includes(r)) return;
    if (r === 'auth') { handleLogout(); return; }
    setRoute(r);
    setMobileNavOpen(false);
    setNotifOpen(false);
  }

  function handleTxnSaved(msg) {
    setRefreshKey(k => k + 1);
    if (msg) addToast(msg);
  }

  // ── Auth screen ───────────────────────────────────────
  if (!authed) {
    return (
      <>
        <AuthScreen onAuth={(msg) => {
          setAuthed(true);
          addToast(msg ?? t('auth.loginSuccess'));
          setRoute('dashboard');
        }}/>
        <TweaksPanel tweaks={tweaks}/>
      </>
    );
  }

  const screenProps = { onOpenTxn: setTxnDetail, onGoto: navigate, range, setRange, refreshKey };

  return (
    <div className="fm-app">
      {/* Mobile nav backdrop */}
      {mobileNavOpen && (
        <div className="fm-mob-backdrop" onClick={() => setMobileNavOpen(false)}/>
      )}

      {/* Sidebar */}
      <Sidebar
        route={route}
        setRoute={navigate}
        mobileOpen={mobileNavOpen}
        unreadCount={unreadCount}
      />

      <div className="fm-main">
        <Topbar
          title={routeTitle(route, t)}
          dark={dark}
          onToggleDark={() => setDark(d => !d)}
          onOpenAdd={() => setQuickAdd(true)}
          onOpenChat={() => setChatOpen(true)}
          onOpenSmart={() => setSmartOpen(true)}
          onOpenNav={() => setMobileNavOpen(o => !o)}
          unreadCount={unreadCount}
          notifOpen={notifOpen}
          setNotifOpen={setNotifOpen}
          onUnreadChange={setUnreadCount}
          lang={lang}
          setLang={setLang}
        />

        <div className="fm-page">
          {route === 'dashboard'    && <DashboardScreen    {...screenProps}/>}
          {route === 'transactions' && <TransactionsScreen {...screenProps}/>}
          {route === 'budgets'      && <BudgetsScreen      {...screenProps}/>}
          {route === 'goals'        && <GoalsScreen        {...screenProps}/>}
          {route === 'accounts'     && <AccountsScreen     {...screenProps}/>}
          {route === 'reports'      && <ReportsScreen      {...screenProps}/>}
          {route === 'insights'     && <InsightsScreen     {...screenProps}/>}
          {route === 'market'       && <MarketScreen       {...screenProps}/>}
          {route === 'profile'      && <ProfileScreen      {...screenProps}/>}
          {route === 'security'     && <SecurityScreen     {...screenProps}/>}
        </div>
      </div>

      {/* Transaction detail drawer */}
      <Drawer open={!!txnDetail} onClose={() => setTxnDetail(null)} title={t('transactions.title')}>
        {txnDetail && <TxnDetailPanel txn={txnDetail}/>}
      </Drawer>

      {/* Quick-add modal */}
      <Modal open={quickAdd} onClose={() => setQuickAdd(false)} title={t('transactions.add')}>
        <QuickAdd onSave={() => { setQuickAdd(false); handleTxnSaved(t('transactions.saved')); }}/>
      </Modal>

      {/* AI Chat Drawer */}
      <AiChatDrawer
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        onTxnSaved={() => handleTxnSaved(t('transactions.saved'))}
      />

      {/* Smart Input Modal */}
      <SmartInputModal
        open={smartOpen}
        onClose={() => setSmartOpen(false)}
        onSaved={() => handleTxnSaved(t('transactions.saved'))}
      />

      {/* Toast */}
      <Toast message={toast} onClose={hideToast}/>

      {/* Tweaks panel */}
      <TweaksPanel tweaks={tweaks}/>
    </div>
  );
}

function routeTitle(route, t) {
  const map = {
    dashboard:    'nav.dashboard',
    transactions: 'nav.transactions',
    budgets:      'nav.budgets',
    goals:        'nav.goals',
    accounts:     'nav.accounts',
    reports:      'nav.reports',
    insights:     'nav.insights',
    market:       'nav.market',
    profile:      'nav.profile',
    security:     'nav.security',
  };
  return t(map[route] ?? 'FinManager');
}

// ── Transaction detail panel ──────────────────────────────────────
function TxnDetailPanel({ txn }) {
  const { t } = useTranslation();
  const fmt = FM_FMT;
  const isIncome = txn.amount > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ textAlign: 'center', padding: '24px 0' }}>
        <div style={{ fontSize: 38, marginBottom: 10 }}>{txn.categoryIcon ?? '💳'}</div>
        <div style={{
          fontFamily: 'var(--fm-font-display)', fontSize: 32, fontWeight: 800,
          letterSpacing: '-0.02em',
          color: isIncome ? 'var(--fm-success)' : 'var(--fm-text)',
        }}>
          {isIncome ? '+' : '−'}{fmt.vnd(Math.abs(txn.amount))} ₫
        </div>
        <div style={{ color: 'var(--fm-text-muted)', fontSize: 14, marginTop: 4 }}>
          {txn.merchant}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {[
          [t('transactions.date'),     txn.date],
          [t('transactions.category'), txn.categoryName ?? '—'],
          ['ID',                       String(txn.id)],
          txn.note ? [t('transactions.note'), txn.note] : null,
        ].filter(Boolean).map(([label, value]) => (
          <div key={label} style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '12px 0', borderBottom: '1px solid var(--fm-border)', fontSize: 14,
          }}>
            <span style={{ color: 'var(--fm-text-muted)' }}>{label}</span>
            <span style={{ fontWeight: 500 }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

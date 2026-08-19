// ScreensExtra.jsx — Accounts, Reports, Insights, Profile, Security, Auth

import { useState as xS, useEffect as xE, useMemo as xM, useRef as xR, useCallback as xCB } from 'react';
import { useTranslation } from 'react-i18next';
import { FM_DATA, FM_FMT } from './data';
import { AreaChart, BarPairChart, DonutChart, HBar } from './Charts';
import { StatCard, Segmented, CatIcon, TxnRow, Icon } from './Components';
import { authApi } from '../api/authApi';
import { reportApi } from '../api/reportApi';
import { profileApi } from '../api/profileApi';
import { aiApi } from '../api/aiApi';
import { transactionApi } from '../api/transactionApi';

// Shared category color palette
const CAT_COLORS_EX = ['#f97316','#22d3ee','#a78bfa','#ec4899','#10b981','#eab308','#94a3b8','#64748b'];
function catColorEx(i) { return CAT_COLORS_EX[i % CAT_COLORS_EX.length]; }

// ─────────────────────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────────────────────

function InsightCardLarge({ insight }) {
  const colors = { warn: '#f97316', good: '#10b981', info: '#22d3ee', tip: '#a78bfa' };
  const icons = { warn: '⚠', good: '↗', info: 'ℹ', tip: '💡' };
  const c = colors[insight.kind] ?? '#64748b';
  return (
    <div className="fm-card" style={{ borderLeft: `3px solid ${c}`, gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%', background: c + '22',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, flexShrink: 0
        }}>{icons[insight.kind]}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{insight.title}</div>
          <div style={{ color: 'var(--fm-text-muted)', fontSize: 13, lineHeight: 1.5 }}>{insight.body}</div>
        </div>
      </div>
      {insight.action && (
        <div style={{ paddingLeft: 48 }}>
          <button className="fm-btn fm-btn-ghost" style={{ fontSize: 13, padding: '4px 12px', color: c }}>{insight.action} →</button>
        </div>
      )}
    </div>
  );
}

function HabitCard({ label, value, target, unit, color, icon }) {
  const pct = Math.min(100, (value / target) * 100);
  return (
    <div className="fm-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 20 }}>{icon}</span>
          <span style={{ fontWeight: 600, fontSize: 14 }}>{label}</span>
        </div>
        <span style={{ fontFamily: 'var(--fm-font-mono)', fontSize: 13, color: 'var(--fm-text-muted)' }}>
          {value}{unit} / {target}{unit}
        </span>
      </div>
      <div style={{ height: 6, background: 'var(--fm-border)', borderRadius: 999 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 999, transition: 'width 0.6s cubic-bezier(.4,0,.2,1)' }}/>
      </div>
      <div style={{ fontSize: 12, color: 'var(--fm-text-muted)' }}>{pct.toFixed(0)}% of monthly target</div>
    </div>
  );
}

function RowToggle({ label, description, checked, onChange }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--fm-border)' }}>
      <div>
        <div style={{ fontWeight: 500, fontSize: 14 }}>{label}</div>
        {description && <div style={{ color: 'var(--fm-text-muted)', fontSize: 12, marginTop: 2 }}>{description}</div>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        style={{
          width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
          background: checked ? 'var(--fm-accent)' : 'var(--fm-border)',
          position: 'relative', transition: 'background 0.2s',
        }}
      >
        <span style={{
          position: 'absolute', top: 2, left: checked ? 20 : 2, width: 18, height: 18,
          borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }}/>
      </button>
    </div>
  );
}

function SecRow({ label, value, action, actionLabel, danger }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--fm-border)' }}>
      <div>
        <div style={{ fontWeight: 500, fontSize: 14 }}>{label}</div>
        {value && <div style={{ color: 'var(--fm-text-muted)', fontSize: 12, marginTop: 2 }}>{value}</div>}
      </div>
      {action && (
        <button
          className="fm-btn fm-btn-ghost"
          onClick={action}
          style={{ fontSize: 13, color: danger ? '#ef4444' : 'var(--fm-accent)' }}
        >{actionLabel}</button>
      )}
    </div>
  );
}

function SessionRow({ device, location, time, current, onRevoke }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 0', borderBottom: '1px solid var(--fm-border)' }}>
      <div style={{
        width: 36, height: 36, borderRadius: 8, background: 'var(--fm-surface-raised)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0
      }}>💻</div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontWeight: 500, fontSize: 14 }}>{device}</span>
          {current && <span style={{ background: 'var(--fm-accent)', color: '#fff', fontSize: 10, padding: '1px 6px', borderRadius: 99, fontWeight: 600 }}>This device</span>}
        </div>
        <div style={{ color: 'var(--fm-text-muted)', fontSize: 12, marginTop: 2 }}>{location} · {time}</div>
      </div>
      {!current && (
        <button className="fm-btn fm-btn-ghost" onClick={onRevoke} style={{ fontSize: 12, color: '#ef4444' }}>Revoke</button>
      )}
    </div>
  );
}

// Auth form helpers
function SignInForm({ onSwitch, onSuccess }) {
  const [email, setEmail] = xS('');
  const [pass, setPass] = xS('');
  const [loading, setLoading] = xS(false);
  const [error, setError] = xS(null);
  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.login({ email, password: pass });
      const token = res.data?.data?.token ?? res.data?.token;
      if (!token) throw new Error('Không nhận được token từ server');
      localStorage.setItem('token', token);
      onSuccess('Đăng nhập thành công');
    } catch (err) {
      setError(err.response?.data?.message ?? err.message ?? 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  }
  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {error && (
        <div style={{ background: '#ef444422', border: '1px solid #ef444440', borderRadius: 8, padding: '10px 14px', color: '#ef4444', fontSize: 13 }}>
          {error}
        </div>
      )}
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--fm-text-muted)' }}>Email address</label>
        <input className="fm-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required autoFocus/>
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--fm-text-muted)' }}>Password</label>
        <input className="fm-input" type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" required/>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="button" className="fm-btn fm-btn-ghost" style={{ fontSize: 13, padding: '4px 0' }} onClick={() => onSwitch('recover')}>Forgot password?</button>
      </div>
      <button className="fm-btn fm-btn-primary" type="submit" disabled={loading} style={{ marginTop: 4 }}>
        {loading ? 'Signing in…' : 'Sign in'}
      </button>
      <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--fm-text-muted)' }}>
        No account? <button type="button" className="fm-btn fm-btn-ghost" style={{ fontSize: 13 }} onClick={() => onSwitch('signup')}>Create one</button>
      </div>
    </form>
  );
}

function SignUpForm({ onSwitch, onSuccess }) {
  const [name, setName] = xS('');
  const [email, setEmail] = xS('');
  const [pass, setPass] = xS('');
  const [loading, setLoading] = xS(false);
  const [error, setError] = xS(null);
  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.register({ fullName: name, email, password: pass });
      const token = res.data?.data?.token ?? res.data?.token;
      if (!token) throw new Error('Không nhận được token từ server');
      localStorage.setItem('token', token);
      onSuccess('Tạo tài khoản thành công');
    } catch (err) {
      setError(err.response?.data?.message ?? err.message ?? 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  }
  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {error && (
        <div style={{ background: '#ef444422', border: '1px solid #ef444440', borderRadius: 8, padding: '10px 14px', color: '#ef4444', fontSize: 13 }}>
          {error}
        </div>
      )}
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--fm-text-muted)' }}>Full name</label>
        <input className="fm-input" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nguyen Van A" required autoFocus/>
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--fm-text-muted)' }}>Email address</label>
        <input className="fm-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required/>
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--fm-text-muted)' }}>Password</label>
        <input className="fm-input" type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="At least 8 characters" required/>
      </div>
      <button className="fm-btn fm-btn-primary" type="submit" disabled={loading} style={{ marginTop: 4 }}>
        {loading ? 'Creating account…' : 'Create account'}
      </button>
      <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--fm-text-muted)' }}>
        Have an account? <button type="button" className="fm-btn fm-btn-ghost" style={{ fontSize: 13 }} onClick={() => onSwitch('signin')}>Sign in</button>
      </div>
    </form>
  );
}

function RecoverForm({ onSwitch }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#eab308' }}>
        Password reset is not yet available. Please contact support or use a new account.
      </div>
      <button type="button" className="fm-btn fm-btn-ghost" style={{ fontSize: 13 }} onClick={() => onSwitch('signin')}>← Back to sign in</button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ACCOUNTS SCREEN
// ─────────────────────────────────────────────────────────────
export function AccountsScreen({ onOpenTxn }) {
  const { t } = useTranslation();
  const [accounts, setAccounts] = xS([]);
  const [summary, setSummary] = xS(null);
  const [loading, setLoading] = xS(true);
  const [selected, setSelected] = xS(null);
  const [filter, setFilter] = xS('all');
  const fmt = FM_FMT;

  // Fetch accounts and summary
  xE(() => {
    Promise.all([
      import('../api/accountApi').then(m => m.accountApi.getAll()),
      import('../api/accountApi').then(m => m.accountApi.getSummary()),
    ]).then(([accRes, sumRes]) => {
      setAccounts(accRes.data?.data || []);
      setSummary(sumRes.data?.data || {});
    }).catch(err => {
      console.error('Failed to fetch accounts:', err);
      // Fallback to mock data
      setAccounts(FM_DATA.accounts);
      setSummary({
        totalBalance: FM_DATA.accounts.reduce((s, a) => s + a.balance, 0),
        assets: FM_DATA.accounts.filter(a => a.balance > 0).reduce((s, a) => s + a.balance, 0),
        liabilities: FM_DATA.accounts.filter(a => a.balance < 0).reduce((s, a) => s + Math.abs(a.balance), 0),
        netWorth: FM_DATA.accounts.reduce((s, a) => s + a.balance, 0),
      });
    }).finally(() => setLoading(false));
  }, []);

  const typeFilters = [
    { value: 'all', label: 'All' },
    { value: 'CHECKING', label: 'Checking' },
    { value: 'SAVINGS', label: 'Savings' },
    { value: 'CREDIT', label: 'Credit' },
    { value: 'INVESTMENT', label: 'Investment' },
    { value: 'CASH', label: 'Cash' },
    { value: 'LOAN', label: 'Loans' },
  ];

  const visible = filter === 'all' ? accounts : accounts.filter(a => a.type === filter);
  const totalAssets = summary?.assets || 0;
  const totalLiab = summary?.liabilities || 0;
  const netWorth = summary?.netWorth || 0;

  const selAcc = selected ? accounts.find(a => a.id === selected) : null;
  const selTxns = xM(() => {
    if (!selected) return [];
    // In real app, fetch transactions for this account
    return FM_DATA.txns.filter(t => t.account === selected).slice(0, 30);
  }, [selected]);

  const typeLabel = { CHECKING: 'Checking', SAVINGS: 'Savings', CREDIT: 'Credit Card', INVESTMENT: 'Investment', CASH: 'Cash / Wallet', LOAN: 'Loan' };

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
      <div className="fm-spinner"/>
    </div>;
  }

  return (
    <div className="fm-fadein fm-rise" style={{ display: 'grid', gap: 'var(--fm-gap, 16px)' }}>
      {/* Summary row */}
      <div className="fm-grid cols-3">
        <StatCard label="Total Assets" value={totalAssets} sparkColor="#10b981"/>
        <StatCard label="Total Liabilities" value={-totalLiab} sparkColor="#f97316"/>
        <StatCard label="Net Worth" value={netWorth} sparkColor="#10b981"/>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {typeFilters.map(f => (
          <button key={f.value} className={`fm-btn ${filter === f.value ? 'fm-btn-primary' : 'fm-btn-ghost'}`}
            style={{ fontSize: 13 }} onClick={() => setFilter(f.value)}>{f.label}</button>
        ))}
      </div>

      {/* Accounts grid */}
      {visible.length === 0 ? (
        <div className="fm-card" style={{ textAlign: 'center', padding: 40, color: 'var(--fm-text-muted)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏦</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No accounts yet</div>
          <div style={{ fontSize: 14 }}>Create your first account to start tracking your finances</div>
        </div>
      ) : (
        <div className="fm-grid cols-3">
          {visible.map(acc => {
            const accColor = acc.color || '#6366f1';
            const accBalance = acc.balance || 0;
            return (
              <div key={acc.id} className="fm-card" style={{ cursor: 'pointer', outline: selected === acc.id ? `2px solid ${accColor}` : 'none', transition: 'outline 0.15s' }}
                onClick={() => setSelected(selected === acc.id ? null : acc.id)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: accColor, display: 'inline-block', marginRight: 8 }}/>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{acc.name}</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--fm-text-muted)', background: 'var(--fm-surface-raised)', padding: '2px 8px', borderRadius: 99 }}>
                    {typeLabel[acc.type] ?? acc.type}
                  </span>
                </div>
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontFamily: 'var(--fm-font-display)', fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', color: accBalance < 0 ? '#f97316' : 'var(--fm-text)' }}>
                    {fmt.vnd(accBalance, { compact: true })} <span style={{ fontSize: 14, color: 'var(--fm-text-muted)' }}>₫</span>
                  </div>
                </div>
                {acc.description && (
                  <div style={{ marginTop: 12, fontSize: 12, color: 'var(--fm-text-muted)' }}>{acc.description}</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Account detail panel */}
      {selAcc && (
        <div className="fm-card fm-fadein" style={{ borderTop: `3px solid ${selAcc.color || '#6366f1'}` }}>
          <div className="fm-card-h">
            <div>
              <h3>{selAcc.name}</h3>
              <div style={{ color: 'var(--fm-text-muted)', fontSize: 13, marginTop: 4 }}>
                {typeLabel[selAcc.type] || selAcc.type} · {selAcc.currency || 'VND'}
              </div>
            </div>
            <button className="fm-btn fm-btn-ghost" style={{ fontSize: 18, padding: '4px 8px' }} onClick={() => setSelected(null)}>×</button>
          </div>
          <div style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Recent Transactions</div>
            {selTxns.length === 0
              ? <div style={{ color: 'var(--fm-text-muted)', fontSize: 14, padding: '16px 0' }}>No transactions for this account.</div>
              : selTxns.map(t => <TxnRow key={t.id} t={t} onClick={() => onOpenTxn(t)}/>)
            }
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// REPORTS SCREEN
// ─────────────────────────────────────────────────────────────
export function ReportsScreen() {
  const fmt = FM_FMT;
  const now = new Date();
  const [period, setPeriod] = xS('6m');
  const [tab, setTab] = xS('cashflow');

  const [monthly,  setMonthly]  = xS([]);
  const [catSpend, setCatSpend] = xS([]);
  const [daily,    setDaily]    = xS([]);
  const [loading,  setLoading]  = xS(true);

  // Compute date range from period
  function getRange(p) {
    const to = new Date();
    const from = new Date();
    if (p === '3m') from.setMonth(from.getMonth() - 3);
    else if (p === '6m') from.setMonth(from.getMonth() - 6);
    else from.setMonth(from.getMonth() - 12);
    return {
      from: from.toISOString().slice(0, 10),
      to:   to.toISOString().slice(0, 10),
    };
  }

  xE(() => {
    setLoading(true);
    const { from, to } = getRange(period);
    Promise.allSettled([
      reportApi.monthly(now.getFullYear()),
      reportApi.categories(from, to),
      reportApi.daily(now.getFullYear(), now.getMonth() + 1),
    ]).then(([monRes, catRes, dayRes]) => {
      if (monRes.status === 'fulfilled') {
        const months = period === '3m' ? 3 : period === '6m' ? 6 : 12;
        const list = (monRes.value.data?.data ?? []).slice(-months);
        setMonthly(list.map(m => ({
          month: m.monthName?.slice(0, 3) ?? String(m.month),
          income: Number(m.income) || 0,
          expense: Number(m.expense) || 0,
        })));
      }
      if (catRes.status === 'fulfilled') setCatSpend(catRes.value.data?.data ?? []);
      if (dayRes.status === 'fulfilled') {
        const days = dayRes.value.data?.data ?? [];
        setDaily(days.map(d => ({ x: String(d.day), y: Number(d.expense) })).filter(d => d.y > 0));
      }
    }).finally(() => setLoading(false));
  }, [period]);

  const totalIncome  = xM(() => monthly.reduce((s, m) => s + m.income, 0),  [monthly]);
  const totalExpense = xM(() => monthly.reduce((s, m) => s + m.expense, 0), [monthly]);
  const avgSavings   = xM(() => totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome * 100).toFixed(1) : '0', [totalIncome, totalExpense]);

  return (
    <div className="fm-fadein fm-rise" style={{ display: 'grid', gap: 'var(--fm-gap, 16px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontFamily: 'var(--fm-font-display)', fontWeight: 700 }}>Reports</h2>
          <div style={{ color: 'var(--fm-text-muted)', fontSize: 13, marginTop: 4 }}>
            {period === '3m' ? 'Last 3 months' : period === '6m' ? 'Last 6 months' : 'Last 12 months'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <Segmented value={period} onChange={setPeriod} options={[{value:'3m',label:'3M'},{value:'6m',label:'6M'},{value:'12m',label:'1Y'}]}/>
          <Segmented value={tab} onChange={setTab} options={[{value:'cashflow',label:'Cash Flow'},{value:'spending',label:'Spending'},{value:'daily',label:'Daily'}]}/>
        </div>
      </div>

      <div className="fm-grid cols-3">
        <StatCard label={`Income (${period})`} value={totalIncome}/>
        <StatCard label={`Expenses (${period})`} value={totalExpense} sparkColor="#f97316"/>
        <StatCard label="Avg Savings Rate" value={null}>
          <div style={{ fontFamily: 'var(--fm-font-display)', fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>{avgSavings}%</div>
          <div style={{ color: 'var(--fm-text-muted)', fontSize: 12, marginTop: 4 }}>of income saved</div>
        </StatCard>
      </div>

      {loading && <div style={{ padding: 40, textAlign: 'center', color: 'var(--fm-text-muted)' }}>Loading reports…</div>}

      {!loading && tab === 'cashflow' && (
        <div className="fm-card">
          <div className="fm-card-h"><h3>Income vs. Expenses</h3></div>
          {monthly.length > 0
            ? <BarPairChart data={monthly} height={220}/>
            : <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fm-text-muted)' }}>No data for this period</div>
          }
          <div style={{ display: 'flex', gap: 24, marginTop: 16, padding: '0 8px' }}>
            <div>
              <div style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>● Total Income</div>
              <div style={{ fontFamily: 'var(--fm-font-mono)', fontWeight: 700, fontSize: 18, marginTop: 4 }}>{fmt.vnd(totalIncome, { compact: true })} ₫</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#f97316', fontWeight: 600 }}>● Total Expenses</div>
              <div style={{ fontFamily: 'var(--fm-font-mono)', fontWeight: 700, fontSize: 18, marginTop: 4 }}>{fmt.vnd(totalExpense, { compact: true })} ₫</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--fm-text-muted)', fontWeight: 600 }}>Net Saved</div>
              <div style={{ fontFamily: 'var(--fm-font-mono)', fontWeight: 700, fontSize: 18, marginTop: 4, color: '#10b981' }}>{fmt.vnd(totalIncome - totalExpense, { compact: true })} ₫</div>
            </div>
          </div>
        </div>
      )}

      {!loading && tab === 'spending' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--fm-gap, 16px)' }} className="fm-dash-2col">
          <div className="fm-card">
            <div className="fm-card-h"><h3>Spending by Category</h3></div>
            {catSpend.length > 0
              ? <DonutChart data={catSpend.map((c, i) => ({ name: c.categoryName, value: Number(c.total), color: catColorEx(i) }))} height={220}/>
              : <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fm-text-muted)' }}>No data</div>
            }
          </div>
          <div className="fm-card">
            <div className="fm-card-h"><h3>Category Breakdown</h3></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
              {catSpend.length === 0
                ? <div style={{ color: 'var(--fm-text-muted)', fontSize: 13 }}>No spending data</div>
                : catSpend.map((c, i) => (
                  <div key={c.categoryName} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 16 }}>{c.categoryIcon || '💳'}</span>
                        <span style={{ fontWeight: 500 }}>{c.categoryName}</span>
                      </div>
                      <span style={{ fontFamily: 'var(--fm-font-mono)', fontWeight: 600 }}>{fmt.vnd(Number(c.total), { compact: true })} ₫</span>
                    </div>
                    <HBar value={Number(c.total)} max={Number(catSpend[0]?.total ?? 1)} color={catColorEx(i)}/>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      )}

      {!loading && tab === 'daily' && (
        <div className="fm-card">
          <div className="fm-card-h">
            <h3>Daily Spending (current month)</h3>
            <span style={{ fontSize: 13, color: 'var(--fm-text-muted)' }}>
              Avg: {fmt.vnd(Math.round(daily.reduce((s, d) => s + d.y, 0) / (daily.length || 1)), { compact: true })} ₫/day
            </span>
          </div>
          {daily.length > 0
            ? <AreaChart data={daily} height={220} color="#f97316"/>
            : <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fm-text-muted)' }}>No spending data this month</div>
          }
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// INSIGHTS SCREEN
// ─────────────────────────────────────────────────────────────
export function InsightsScreen() {
  const fmt = FM_FMT;
  const [tab, setTab] = xS('ai');
  const [insights, setInsights] = xS([]);
  const [recurring, setRecurring] = xS([]);
  const [monthly, setMonthly] = xS([]);
  const [catSpendCurrent, setCatSpendCurrent] = xS([]);
  const [anomalies, setAnomalies] = xS([]);
  const [budget, setBudget] = xS(null);
  const [loading, setLoading] = xS(true);
  const [aiError, setAiError] = xS(null);

  xE(() => {
    setLoading(true);
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    // Current month range
    const thisFrom = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const thisTo   = new Date(year, month + 1, 0).toISOString().slice(0, 10);

    // Previous month range (handles Jan → Dec of prior year)
    const prevDate  = new Date(year, month - 1, 1);
    const prevYear  = prevDate.getFullYear();
    const prevMonth = prevDate.getMonth();
    const prevFrom  = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-01`;
    const prevTo    = new Date(prevYear, prevMonth + 1, 0).toISOString().slice(0, 10);

    // 90-day window for recurring merchants
    const ninetyAgo = new Date();
    ninetyAgo.setDate(ninetyAgo.getDate() - 90);
    const from90 = ninetyAgo.toISOString().slice(0, 10);
    const to90   = now.toISOString().slice(0, 10);

    Promise.allSettled([
      aiApi.insights(),
      transactionApi.getAll({ page: 0, size: 200, sort: 'date,desc', from: from90, to: to90 }),
      reportApi.monthly(year),
      reportApi.categories(thisFrom, thisTo),
      reportApi.categories(prevFrom, prevTo),
      profileApi.getBudget(),
    ]).then(([insRes, txnRes, monRes, currCatRes, prevCatRes, budgetRes]) => {
      if (insRes.status === 'fulfilled') {
        const raw = insRes.value.data?.data;
        if (Array.isArray(raw)) setInsights(raw);
        else if (typeof raw === 'string' && raw.length > 0) {
          // Split long AI text into paragraph-level insight cards
          const paras = raw.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
          if (paras.length > 1) {
            setInsights(paras.map((p, i) => ({ id: `ai${i}`, kind: i === 0 ? 'info' : 'tip', title: `AI Insight ${i + 1}`, body: p })));
          } else {
            setInsights([{ id: 'ai1', kind: 'tip', title: 'AI Insight', body: raw }]);
          }
        }
      } else {
        const err = insRes.reason;
        setAiError(err?.response?.data?.message ?? 'AI service unavailable — check your API key configuration');
      }
      if (txnRes.status === 'fulfilled') {
        const txns = txnRes.value.data?.data?.content ?? txnRes.value.data?.data ?? [];
        const counts = {};
        txns.forEach(t => {
          const key = t.note || t.categoryName || '—';
          if (!counts[key]) counts[key] = { merchant: key, categoryIcon: t.categoryIcon, count: 0, total: 0, last: t.date };
          counts[key].count++;
          counts[key].total += Number(t.amount);
          if (t.date > counts[key].last) counts[key].last = t.date;
        });
        setRecurring(Object.values(counts).filter(x => x.count >= 2).sort((a, b) => b.count - a.count).slice(0, 8));
      }
      if (monRes.status === 'fulfilled') {
        const list = monRes.value.data?.data ?? [];
        setMonthly(list.map(m => ({
          month: m.monthName?.slice(0, 3) ?? String(m.month),
          income: Number(m.income) || 0,
          expense: Number(m.expense) || 0,
        })));
      }

      let currentCats = [];
      let prevCats = [];
      if (currCatRes.status === 'fulfilled') {
        currentCats = currCatRes.value.data?.data ?? [];
        setCatSpendCurrent(currentCats);
      }
      if (prevCatRes.status === 'fulfilled') {
        prevCats = prevCatRes.value.data?.data ?? [];
      }
      if (budgetRes.status === 'fulfilled') setBudget(budgetRes.value.data?.data ?? null);

      // Anomaly detection: categories with 50%+ spike vs prior month
      if (currentCats.length > 0 && prevCats.length > 0) {
        const prevMap = {};
        prevCats.forEach(c => { prevMap[c.categoryName] = Number(c.total); });
        const found = currentCats
          .filter(c => {
            const prev = prevMap[c.categoryName];
            return prev > 0 && Number(c.total) > prev * 1.5;
          })
          .map(c => ({
            name: c.categoryName,
            icon: c.categoryIcon,
            current: Number(c.total),
            previous: prevMap[c.categoryName],
            pct: Math.round((Number(c.total) / prevMap[c.categoryName] - 1) * 100),
          }));
        setAnomalies(found);
      }
    }).finally(() => setLoading(false));
  }, []);

  const totalSpentThisMonth = xM(() => catSpendCurrent.reduce((s, c) => s + Number(c.total), 0), [catSpendCurrent]);
  const budgetPct = budget?.monthlyLimit ? (totalSpentThisMonth / Number(budget.monthlyLimit)) * 100 : 0;
  const showBudgetWarn = !!(budget?.alertEnabled && budgetPct >= Number(budget?.alertThreshold ?? 80));
  const budgetOver = showBudgetWarn && totalSpentThisMonth > Number(budget?.monthlyLimit);

  return (
    <div className="fm-fadein fm-rise" style={{ display: 'grid', gap: 'var(--fm-gap, 16px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontFamily: 'var(--fm-font-display)', fontWeight: 700 }}>Insights</h2>
          <div style={{ color: 'var(--fm-text-muted)', fontSize: 13, marginTop: 4 }}>AI-powered analysis of your finances</div>
        </div>
        <Segmented value={tab} onChange={setTab} options={[
          { value: 'ai',        label: 'AI Tips' },
          { value: 'anomalies', label: anomalies.length > 0 ? `⚠ Anomalies (${anomalies.length})` : 'Anomalies' },
          { value: 'habits',    label: 'Habits' },
          { value: 'recurring', label: 'Recurring' },
        ]}/>
      </div>

      {/* Budget warning banner */}
      {showBudgetWarn && (
        <div style={{
          background: budgetOver ? 'rgba(239,68,68,0.1)' : 'rgba(249,115,22,0.1)',
          border: `1px solid ${budgetOver ? 'rgba(239,68,68,0.25)' : 'rgba(249,115,22,0.25)'}`,
          borderRadius: 12, padding: '12px 18px',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>{budgetOver ? '🔴' : '⚠️'}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: budgetOver ? '#ef4444' : '#f97316' }}>
              {budgetOver ? 'Monthly budget exceeded!' : `Budget ${budgetPct.toFixed(0)}% used — approaching limit`}
            </div>
            <div style={{ fontSize: 12, color: 'var(--fm-text-muted)', marginTop: 2 }}>
              {fmt.vnd(totalSpentThisMonth, { compact: true })} / {fmt.vnd(Number(budget.monthlyLimit), { compact: true })} ₫ spent this month
            </div>
          </div>
        </div>
      )}

      {loading && (tab === 'ai' || tab === 'anomalies') && (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--fm-text-muted)' }}>Loading insights…</div>
      )}

      {!loading && tab === 'ai' && (
        <div style={{ display: 'grid', gap: 'var(--fm-gap, 16px)' }}>
          {aiError
            ? (
              <div className="fm-card" style={{ padding: 32, textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>AI service unavailable</div>
                <div style={{ color: 'var(--fm-text-muted)', fontSize: 13 }}>{aiError}</div>
              </div>
            )
            : insights.length === 0
              ? <div className="fm-card" style={{ padding: 32, textAlign: 'center', color: 'var(--fm-text-muted)' }}>No AI insights available yet</div>
              : insights.map((ins, i) => <InsightCardLarge key={ins.id ?? i} insight={ins}/>)
          }
        </div>
      )}

      {!loading && tab === 'anomalies' && (
        <div style={{ display: 'grid', gap: 'var(--fm-gap, 16px)' }}>
          {anomalies.length === 0 ? (
            <div className="fm-card" style={{ padding: 40, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 36 }}>✅</div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>No spending anomalies detected</div>
              <div style={{ color: 'var(--fm-text-muted)', fontSize: 13, lineHeight: 1.5 }}>
                Your spending patterns are consistent with last month. Keep it up!
              </div>
            </div>
          ) : (
            <>
              <div style={{ color: 'var(--fm-text-muted)', fontSize: 13 }}>
                Categories with 50%+ spending increase compared to last month
              </div>
              {anomalies.map(a => (
                <div key={a.name} className="fm-card" style={{ borderLeft: '3px solid #f97316', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(249,115,22,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                      {a.icon || '📈'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{a.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--fm-text-muted)', marginTop: 3 }}>
                        Last month: {fmt.vnd(a.previous, { compact: true })} ₫ → This month: {fmt.vnd(a.current, { compact: true })} ₫
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontFamily: 'var(--fm-font-mono)', fontWeight: 700, color: '#f97316', fontSize: 18 }}>+{a.pct}%</div>
                      <div style={{ fontSize: 11, color: 'var(--fm-text-muted)' }}>vs last month</div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {tab === 'habits' && (
        <div style={{ display: 'grid', gap: 'var(--fm-gap, 16px)' }}>
          <div style={{ color: 'var(--fm-text-muted)', fontSize: 13 }}>
            Where your money goes this month — share of total spending
          </div>
          {catSpendCurrent.length === 0
            ? <div className="fm-card" style={{ padding: 32, textAlign: 'center', color: 'var(--fm-text-muted)' }}>No spending data this month</div>
            : (
              <>
                <div className="fm-grid cols-2">
                  {catSpendCurrent.map((c, i) => {
                    const pct = totalSpentThisMonth > 0 ? Math.round(Number(c.total) / totalSpentThisMonth * 100) : 0;
                    return (
                      <HabitCard
                        key={c.categoryName}
                        label={c.categoryName}
                        icon={c.categoryIcon || '💳'}
                        value={pct}
                        target={100}
                        unit="%"
                        color={catColorEx(i)}
                      />
                    );
                  })}
                </div>
                {monthly.length > 0 && (
                  <div className="fm-card">
                    <div className="fm-card-h"><h3>Savings Rate Trend</h3></div>
                    <AreaChart data={monthly.filter(m => m.income > 0).map(m => ({ x: m.month, y: Math.round((m.income - m.expense) / m.income * 100) }))} height={160}/>
                  </div>
                )}
              </>
            )
          }
        </div>
      )}

      {tab === 'recurring' && (
        <div className="fm-card">
          <div className="fm-card-h">
            <h3>Recurring Merchants</h3>
            <span style={{ fontSize: 13, color: 'var(--fm-text-muted)' }}>Detected from last 90 days</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {recurring.length === 0
              ? <div style={{ color: 'var(--fm-text-muted)', fontSize: 14, padding: '16px 0' }}>No recurring transactions detected</div>
              : recurring.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--fm-border)' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: catColorEx(i) + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                    {r.categoryIcon || '💳'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{r.merchant}</div>
                    <div style={{ color: 'var(--fm-text-muted)', fontSize: 12, marginTop: 2 }}>
                      {r.count} transactions · Last: {fmt.date(r.last)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--fm-font-mono)', fontWeight: 600, fontSize: 14 }}>
                      {fmt.vnd(Math.round(r.total / r.count), { compact: true })} ₫
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--fm-text-muted)' }}>avg/txn</div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PROFILE SCREEN — Advanced with avatar upload, location, completion ring
// ─────────────────────────────────────────────────────────────
const PROFILE_FIELDS = ['fullName','username','phone','bio','dateOfBirth','gender','address','city','country','occupation','preferredCurrency','timezone'];
const TIMEZONES = [
  'Asia/Ho_Chi_Minh','Asia/Bangkok','Asia/Singapore','Asia/Tokyo','Asia/Seoul',
  'America/New_York','America/Los_Angeles','Europe/London','Europe/Berlin','UTC',
];
const CURRENCIES = ['VND','USD','EUR','JPY','SGD','THB','KRW','GBP','AUD'];

function CompletionRing({ pct, size = 80 }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * (pct / 100);
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--fm-surface-3)" strokeWidth={6}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--fm-accent)" strokeWidth={6}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.6s ease' }}/>
    </svg>
  );
}

export function ProfileScreen() {
  const { t } = useTranslation();
  const fileRef = xR(null);
  const [tab, setTab] = xS('info');
  const [profile, setProfile] = xS({});
  const [form, setForm] = xS({
    fullName: '', username: '', phone: '', bio: '', dateOfBirth: '', gender: '',
    address: '', city: '', country: '', occupation: '',
    preferredCurrency: 'VND', timezone: 'Asia/Ho_Chi_Minh', preferredLanguage: 'vi',
    avatarUrl: '',
  });
  const [loadingProfile, setLoadingProfile] = xS(true);
  const [saving, setSaving] = xS(false);
  const [saveMsg, setSaveMsg] = xS(null);
  const [saveError, setSaveError] = xS(null);
  const [locating, setLocating] = xS(false);

  const load = xCB(() => {
    profileApi.getProfile()
      .then(res => {
        const p = res.data?.data ?? res.data ?? {};
        setProfile(p);
        setForm(f => ({
          ...f,
          fullName:          p.fullName ?? '',
          username:          p.username ?? '',
          phone:             p.phone ?? '',
          bio:               p.bio ?? '',
          dateOfBirth:       p.dateOfBirth ?? '',
          gender:            p.gender ?? '',
          address:           p.address ?? '',
          city:              p.city ?? '',
          country:           p.country ?? '',
          occupation:        p.occupation ?? '',
          preferredCurrency: p.preferredCurrency ?? 'VND',
          timezone:          p.timezone ?? 'Asia/Ho_Chi_Minh',
          preferredLanguage: p.preferredLanguage ?? 'vi',
          avatarUrl:         p.avatarUrl ?? '',
        }));
      })
      .catch(() => {})
      .finally(() => setLoadingProfile(false));
  }, []);

  xE(() => { load(); }, [load]);

  const completion = xM(() => {
    const filled = PROFILE_FIELDS.filter(k => form[k] && String(form[k]).trim()).length;
    return Math.round((filled / PROFILE_FIELDS.length) * 100);
  }, [form]);

  function setField(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function handleAvatarFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setSaveError('Image too large (max 2 MB)'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setField('avatarUrl', ev.target.result);
    reader.readAsDataURL(file);
  }

  function detectLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setField('latitude',  pos.coords.latitude);
        setField('longitude', pos.coords.longitude);
        setSaveMsg(t('profile.locationSaved'));
        setTimeout(() => setSaveMsg(null), 2500);
        setLocating(false);
      },
      () => { setLocating(false); }
    );
  }

  async function saveProfile(e) {
    if (e) e.preventDefault();
    setSaving(true); setSaveError(null); setSaveMsg(null);
    try {
      await profileApi.updateProfile({
        fullName:          form.fullName,
        username:          form.username || null,
        phone:             form.phone || null,
        bio:               form.bio || null,
        dateOfBirth:       form.dateOfBirth || null,
        gender:            form.gender || null,
        address:           form.address || null,
        city:              form.city || null,
        country:           form.country || null,
        occupation:        form.occupation || null,
        preferredCurrency: form.preferredCurrency,
        timezone:          form.timezone,
        preferredLanguage: form.preferredLanguage,
        avatarUrl:         form.avatarUrl || null,
      });
      setSaveMsg(t('profile.saved'));
      setTimeout(() => setSaveMsg(null), 2500);
    } catch (err) {
      setSaveError(err.response?.data?.message ?? t('common.error'));
    } finally {
      setSaving(false);
    }
  }

  const initials = form.fullName
    ? form.fullName.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : (profile.email?.[0] ?? '?').toUpperCase();

  const FL = ({ label, children }) => (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--fm-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </label>
      {children}
    </div>
  );

  return (
    <div className="fm-fadein fm-rise" style={{ display: 'grid', gap: 16, maxWidth: 680 }}>

      {/* Hero card: avatar + completion ring */}
      <div className="fm-card">
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {form.avatarUrl ? (
              <img src={form.avatarUrl} alt="avatar" style={{
                width: 80, height: 80, borderRadius: '50%', objectFit: 'cover',
                boxShadow: '0 0 0 3px var(--fm-surface), 0 0 0 5px var(--fm-accent)',
              }}/>
            ) : (
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--fm-accent), var(--fm-indigo))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 30, fontWeight: 800, color: '#fff',
                boxShadow: '0 0 0 3px var(--fm-surface), 0 0 0 5px var(--fm-accent)',
              }}>
                {loadingProfile ? '…' : initials}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              style={{
                position: 'absolute', bottom: -2, right: -2,
                width: 26, height: 26, borderRadius: '50%',
                background: 'var(--fm-accent)', border: '2px solid var(--fm-surface)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', padding: 0,
              }}
              title={t('profile.uploadAvatar')}
            >
              <Icon.Camera size={13} style={{ color: '#000' }}/>
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarFile}/>
          </div>

          {/* Name + email */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--fm-font-display)', fontSize: 20, fontWeight: 800, letterSpacing: '-0.01em' }}>
              {loadingProfile ? '…' : (form.fullName || '—')}
            </div>
            <div style={{ color: 'var(--fm-text-muted)', fontSize: 13, marginTop: 3 }}>
              {profile.email ?? ''}
              {form.username && <span style={{ marginLeft: 8, color: 'var(--fm-accent)', fontSize: 12 }}>@{form.username}</span>}
            </div>
            {form.avatarUrl && (
              <button type="button" className="fm-btn fm-btn-ghost" style={{ fontSize: 11, padding: '2px 8px', marginTop: 6, color: 'var(--fm-danger)' }}
                onClick={() => setField('avatarUrl', '')}>
                {t('profile.removeAvatar')}
              </button>
            )}
          </div>

          {/* Completion ring */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <div style={{ position: 'relative', width: 72, height: 72 }}>
              <CompletionRing pct={completion} size={72}/>
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 15, fontWeight: 800, fontFamily: 'var(--fm-font-mono)', color: 'var(--fm-accent)' }}>{completion}%</span>
              </div>
            </div>
            <span style={{ fontSize: 10, color: 'var(--fm-text-muted)', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t('profile.completion')}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Segmented
        options={[
          { label: t('profile.editProfile'), value: 'info' },
          { label: t('profile.preferences'),  value: 'prefs' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {/* ── Profile Info Tab ── */}
      {tab === 'info' && (
        <div className="fm-card">
          <div className="fm-card-h"><h3>{t('profile.editProfile')}</h3></div>
          <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
            {saveError && (
              <div style={{ background: 'var(--fm-danger-soft)', border: '1px solid var(--fm-danger)', borderRadius: 8, padding: '10px 14px', color: 'var(--fm-danger)', fontSize: 13 }}>
                {saveError}
              </div>
            )}
            {saveMsg && (
              <div style={{ background: 'var(--fm-success-soft)', border: '1px solid var(--fm-success)', borderRadius: 8, padding: '10px 14px', color: 'var(--fm-success)', fontSize: 13 }}>
                ✓ {saveMsg}
              </div>
            )}

            {/* Row 1: fullName + username */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FL label={t('profile.fullName')}>
                <input className="fm-input" type="text" value={form.fullName} onChange={e => setField('fullName', e.target.value)} disabled={loadingProfile}/>
              </FL>
              <FL label={t('profile.username')}>
                <input className="fm-input" type="text" placeholder="@username" value={form.username} onChange={e => setField('username', e.target.value)}/>
              </FL>
            </div>

            {/* Row 2: email (readonly) + phone */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FL label={t('profile.email')}>
                <input className="fm-input" type="email" value={profile.email ?? ''} disabled style={{ opacity: 0.55 }}/>
              </FL>
              <FL label={t('profile.phone')}>
                <input className="fm-input" type="tel" value={form.phone} onChange={e => setField('phone', e.target.value)}/>
              </FL>
            </div>

            {/* Row 3: dateOfBirth + gender */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FL label={t('profile.dateOfBirth')}>
                <input className="fm-input" type="date" value={form.dateOfBirth} onChange={e => setField('dateOfBirth', e.target.value)}/>
              </FL>
              <FL label={t('profile.gender')}>
                <select className="fm-input" value={form.gender} onChange={e => setField('gender', e.target.value)}>
                  <option value="">—</option>
                  <option value="MALE">{t('profile.male')}</option>
                  <option value="FEMALE">{t('profile.female')}</option>
                  <option value="OTHER">{t('profile.other')}</option>
                </select>
              </FL>
            </div>

            {/* Bio */}
            <FL label={t('profile.bio')}>
              <textarea className="fm-input" rows={3} value={form.bio} onChange={e => setField('bio', e.target.value)}
                style={{ resize: 'vertical', minHeight: 72 }}/>
            </FL>

            {/* Occupation */}
            <FL label={t('profile.occupation')}>
              <input className="fm-input" type="text" value={form.occupation} onChange={e => setField('occupation', e.target.value)}/>
            </FL>

            {/* Location section */}
            <div style={{ borderTop: '1px solid var(--fm-border)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fm-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {t('profile.location')}
                </span>
                <button type="button" className="fm-btn fm-btn-ghost" style={{ fontSize: 12, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5 }}
                  onClick={detectLocation} disabled={locating}>
                  <Icon.MapPin size={12}/>
                  {locating ? t('profile.locating') : t('profile.detectLocation')}
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <FL label={t('profile.address')}>
                  <input className="fm-input" type="text" value={form.address} onChange={e => setField('address', e.target.value)}/>
                </FL>
                <FL label={t('profile.city')}>
                  <input className="fm-input" type="text" value={form.city} onChange={e => setField('city', e.target.value)}/>
                </FL>
                <FL label={t('profile.country')}>
                  <input className="fm-input" type="text" value={form.country} onChange={e => setField('country', e.target.value)}/>
                </FL>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
              <button className="fm-btn fm-btn-primary" type="submit" disabled={saving || loadingProfile}>
                {saving ? '…' : t('profile.saveChanges')}
              </button>
              <button className="fm-btn fm-btn-ghost" type="button" onClick={load} disabled={saving}>
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Preferences Tab ── */}
      {tab === 'prefs' && (
        <div className="fm-card">
          <div className="fm-card-h"><h3>{t('profile.preferences')}</h3></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FL label={t('profile.currency')}>
                <select className="fm-input" value={form.preferredCurrency} onChange={e => setField('preferredCurrency', e.target.value)}>
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </FL>
              <FL label={t('profile.timezone')}>
                <select className="fm-input" value={form.timezone} onChange={e => setField('timezone', e.target.value)}>
                  {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                </select>
              </FL>
            </div>
            <FL label={t('profile.language')}>
              <select className="fm-input" value={form.preferredLanguage} onChange={e => setField('preferredLanguage', e.target.value)}>
                <option value="vi">🇻🇳 Tiếng Việt</option>
                <option value="en">🇬🇧 English</option>
              </select>
            </FL>
            <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
              <button className="fm-btn fm-btn-primary" onClick={() => saveProfile(null)} disabled={saving}>
                {saving ? '…' : t('profile.saveChanges')}
              </button>
            </div>
            {saveMsg && (
              <div style={{ background: 'var(--fm-success-soft)', borderRadius: 8, padding: '10px 14px', color: 'var(--fm-success)', fontSize: 13 }}>
                ✓ {saveMsg}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notification toggles */}
      <div className="fm-card">
        <div className="fm-card-h"><h3>{t('notifications.title')}</h3></div>
        <div>
          <RowToggle label={t('notifications.budgetAlert')} description="Notify when near or over budget" checked={true} onChange={() => {}}/>
          <RowToggle label={t('notifications.unusualSpend')} description="Alert for out-of-character transactions" checked={true} onChange={() => {}}/>
          <RowToggle label={t('notifications.marketAlert')} description="Price alerts for crypto & forex" checked={false} onChange={() => {}}/>
          <RowToggle label={t('notifications.aiInsight')} description="Weekly AI-generated spending insights" checked={true} onChange={() => {}}/>
        </div>
      </div>

      {/* Danger zone */}
      <div className="fm-card" style={{ borderColor: 'var(--fm-danger)40' }}>
        <div className="fm-card-h"><h3 style={{ color: 'var(--fm-danger)' }}>Danger Zone</h3></div>
        <SecRow label="Export all data" value="Download a JSON archive of your entire account" action={() => {}} actionLabel="Export"/>
        <SecRow label="Delete account" value="Permanently remove your account and all data" action={() => {}} actionLabel="Delete account" danger/>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CHANGE PASSWORD FORM (inline)
// ─────────────────────────────────────────────────────────────
function ChangePasswordForm({ onClose }) {
  const [current, setCurrent] = xS('');
  const [next, setNext] = xS('');
  const [confirm, setConfirm] = xS('');
  const [loading, setLoading] = xS(false);
  const [error, setError] = xS(null);
  const [ok, setOk] = xS(false);

  async function submit(e) {
    e.preventDefault();
    if (next !== confirm) { setError('Passwords do not match'); return; }
    if (next.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true); setError(null);
    try {
      await profileApi.changePassword({ currentPassword: current, newPassword: next });
      setOk(true);
      setTimeout(onClose, 1500);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to change password');
    } finally {
      setLoading(false);
    }
  }

  if (ok) return (
    <div style={{ color: '#10b981', padding: '12px 0', fontSize: 14, fontWeight: 500 }}>✓ Password changed successfully</div>
  );
  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--fm-border)' }}>
      {error && <div style={{ color: '#ef4444', fontSize: 13 }}>{error}</div>}
      <input className="fm-input" type="password" placeholder="Current password" value={current} onChange={e => setCurrent(e.target.value)} required autoFocus/>
      <input className="fm-input" type="password" placeholder="New password (min 8 chars)" value={next} onChange={e => setNext(e.target.value)} required/>
      <input className="fm-input" type="password" placeholder="Confirm new password" value={confirm} onChange={e => setConfirm(e.target.value)} required/>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="fm-btn fm-btn-primary" type="submit" disabled={loading}>{loading ? 'Saving…' : 'Update password'}</button>
        <button className="fm-btn fm-btn-ghost" type="button" onClick={onClose}>Cancel</button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────
// SECURITY SCREEN
// ─────────────────────────────────────────────────────────────
export function SecurityScreen() {
  const [twoFA, setTwoFA] = xS(true);
  const [sessions] = xS([
    { id: 's1', device: 'MacBook Pro 14 · Chrome', location: 'Ho Chi Minh City, VN', time: 'Active now', current: true },
    { id: 's2', device: 'iPhone 15 · Safari', location: 'Ho Chi Minh City, VN', time: '2 hours ago', current: false },
    { id: 's3', device: 'Windows 11 · Edge', location: 'Hanoi, VN', time: '3 days ago', current: false },
  ]);
  const [activeSessions, setActiveSessions] = xS(sessions);
  const [changingPwd, setChangingPwd] = xS(false);

  function revokeSession(id) {
    setActiveSessions(s => s.filter(x => x.id !== id));
  }

  return (
    <div className="fm-fadein fm-rise" style={{ display: 'grid', gap: 'var(--fm-gap, 16px)', maxWidth: 640 }}>
      {/* Password */}
      <div className="fm-card">
        <div className="fm-card-h"><h3>Password</h3></div>
        <SecRow label="Current password" value="Last changed 3 months ago"
          action={() => setChangingPwd(v => !v)} actionLabel={changingPwd ? 'Cancel' : 'Change password'}/>
        {changingPwd && <ChangePasswordForm onClose={() => setChangingPwd(false)}/>}
      </div>

      {/* Two-factor auth */}
      <div className="fm-card">
        <div className="fm-card-h">
          <h3>Two-Factor Authentication</h3>
          <button
            onClick={() => setTwoFA(!twoFA)}
            style={{
              width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
              background: twoFA ? 'var(--fm-accent)' : 'var(--fm-border)',
              position: 'relative', transition: 'background 0.2s',
            }}
          >
            <span style={{
              position: 'absolute', top: 2, left: twoFA ? 20 : 2, width: 18, height: 18,
              borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            }}/>
          </button>
        </div>
        {twoFA ? (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#10b981', fontSize: 13, fontWeight: 500 }}>
              <span>✓</span> Two-factor authentication is enabled
            </div>
            <div style={{ color: 'var(--fm-text-muted)', fontSize: 13, marginTop: 4, lineHeight: 1.5 }}>
              Using authenticator app (TOTP). Your account is protected.
            </div>
            <div style={{ marginTop: 12 }}>
              <SecRow label="Authenticator app" value="Google Authenticator · Configured" action={() => {}} actionLabel="Reconfigure"/>
              <SecRow label="Backup codes" value="8 codes remaining" action={() => {}} actionLabel="View codes"/>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 12 }}>
            <div style={{ color: 'var(--fm-text-muted)', fontSize: 14, lineHeight: 1.5 }}>
              Add an extra layer of security. You'll be asked for a code when signing in.
            </div>
            <button className="fm-btn fm-btn-primary" style={{ marginTop: 12 }} onClick={() => setTwoFA(true)}>Enable 2FA</button>
          </div>
        )}
      </div>

      {/* Active sessions */}
      <div className="fm-card">
        <div className="fm-card-h">
          <h3>Active Sessions</h3>
          <button className="fm-btn fm-btn-ghost" style={{ fontSize: 13, color: '#ef4444' }}
            onClick={() => setActiveSessions(s => s.filter(x => x.current))}>
            Revoke all others
          </button>
        </div>
        <div>
          {activeSessions.map(s => (
            <SessionRow key={s.id} {...s} onRevoke={() => revokeSession(s.id)}/>
          ))}
        </div>
      </div>

      {/* Connected apps */}
      <div className="fm-card">
        <div className="fm-card-h"><h3>Connected Applications</h3></div>
        <SecRow label="Vietcombank Open Banking" value="Connected · Read-only access" action={() => {}} actionLabel="Disconnect"/>
        <SecRow label="Techcombank API" value="Connected · Transactions, Balances" action={() => {}} actionLabel="Disconnect"/>
        <SecRow label="TCBS Data Feed" value="Connected · Portfolio data" action={() => {}} actionLabel="Disconnect"/>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// AUTH SCREEN
// ─────────────────────────────────────────────────────────────
export function AuthScreen({ onAuth }) {
  const [view, setView] = xS('signin'); // 'signin' | 'signup' | 'recover'

  function handleSuccess(msg) {
    onAuth?.(msg);
  }

  const titles = { signin: 'Welcome back', signup: 'Create your account', recover: 'Reset your password' };
  const subtitles = {
    signin: 'Sign in to FinManager',
    signup: 'Start managing your finances today',
    recover: "We'll email you a reset link",
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--fm-bg)', padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            display: 'inline-flex', width: 52, height: 52, borderRadius: 14,
            background: 'linear-gradient(135deg, var(--fm-accent), #a78bfa)',
            alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 16,
            boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 8px 24px rgba(16,185,129,0.3)',
          }}>₫</div>
          <div style={{ fontFamily: 'var(--fm-font-display)', fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>FinManager</div>
          <div style={{ color: 'var(--fm-text-muted)', fontSize: 13, marginTop: 4 }}>Personal Finance, Reimagined</div>
        </div>

        {/* Card */}
        <div className="fm-card" style={{ padding: 32 }}>
          <h2 style={{ margin: '0 0 4px', fontFamily: 'var(--fm-font-display)', fontWeight: 700, fontSize: 22 }}>{titles[view]}</h2>
          <p style={{ color: 'var(--fm-text-muted)', fontSize: 14, margin: '0 0 24px', lineHeight: 1.5 }}>{subtitles[view]}</p>

          {view === 'signin' && <SignInForm onSwitch={setView} onSuccess={handleSuccess}/>}
          {view === 'signup' && <SignUpForm onSwitch={setView} onSuccess={handleSuccess}/>}
          {view === 'recover' && <RecoverForm onSwitch={setView}/>}
        </div>

        <p style={{ textAlign: 'center', color: 'var(--fm-text-muted)', fontSize: 12, marginTop: 24, lineHeight: 1.5 }}>
          By continuing, you agree to our Terms of Service and Privacy Policy.<br/>
          Your data is encrypted at rest and in transit.
        </p>
      </div>
    </div>
  );
}

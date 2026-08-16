// ScreensMain.jsx — Dashboard, Transactions, Budgets, Goals

import { useState as uS, useEffect as uE, useMemo as uM } from 'react';
import { useTranslation } from 'react-i18next';
import { FM_DATA, FM_FMT } from './data';
import { DonutChart, AreaChart, BarPairChart, HBar, RingProgress, Sparkline } from './Charts';
import { StatCard, Segmented, CatIcon, TxnRow, Icon } from './Components';
import { transactionApi } from '../api/transactionApi';
import { reportApi } from '../api/reportApi';
import { profileApi } from '../api/profileApi';
import { aiApi } from '../api/aiApi';
import { marketApi } from '../api/marketApi';

// Maps a backend TransactionResponse to the shape TxnRow accepts
function mapTxn(t) {
  return {
    id: t.id,
    date: t.date,
    merchant: t.note || t.categoryName || '—',
    categoryName: t.categoryName,
    categoryIcon: t.categoryIcon,
    amount: t.type === 'INCOME' ? Number(t.amount) : -Number(t.amount),
    pending: false,
    note: t.note,
  };
}

// Category color palette (backend categories carry no color field)
const CAT_PALETTE = ['#f97316','#22d3ee','#a78bfa','#ec4899','#10b981','#eab308','#94a3b8','#64748b','#22c55e','#ef4444'];
function catColor(index) { return CAT_PALETTE[index % CAT_PALETTE.length]; }

// ─────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────
export function DashboardScreen({ onOpenTxn, onGoto, range, setRange, refreshKey }) {
  const fmt = FM_FMT;
  const now = new Date();
  const year = now.getFullYear();
  const monthStr = String(now.getMonth() + 1).padStart(2, '0');
  const fromDate = `${year}-${monthStr}-01`;
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
  const toDate = `${year}-${monthStr}-${lastDay}`;

  // ── API state ──────────────────────────────────────────────
  const [summary,    setSummary]    = uS({ income: 0, expense: 0, balance: 0 });
  const [monthly,    setMonthly]    = uS([]);
  const [catSummary, setCatSummary] = uS([]);
  const [recentTxns, setRecentTxns] = uS([]);
  const [goals,      setGoals]      = uS([]);
  const [insights,   setInsights]   = uS([]);
  const [aiError,    setAiError]    = uS(null);
  const [budget,     setBudget]     = uS(null);
  const [loading,    setLoading]    = uS(true);

  // Data re-fetched when transactions change (via refreshKey)
  uE(() => {
    setLoading(true);
    Promise.allSettled([
      transactionApi.summary(),
      reportApi.monthly(year),
      reportApi.categories(fromDate, toDate),
      transactionApi.getAll({ page: 0, size: 6, sort: 'date,desc' }),
      profileApi.getSavingsGoals(),
      profileApi.getBudget(),
    ]).then(([sumRes, monRes, catRes, txnRes, goalsRes, budgetRes]) => {
      if (sumRes.status === 'fulfilled') {
        const d = sumRes.value.data?.data ?? {};
        setSummary({ income: Number(d.income ?? 0), expense: Number(d.expense ?? 0), balance: Number(d.balance ?? 0) });
      }
      if (monRes.status === 'fulfilled') {
        const list = monRes.value.data?.data ?? [];
        setMonthly(list.map(m => ({ month: m.monthName?.slice(0, 3) ?? String(m.month), income: Number(m.income) || 0, expense: Number(m.expense) || 0 })));
      }
      if (catRes.status === 'fulfilled') setCatSummary(catRes.value.data?.data ?? []);
      if (txnRes.status === 'fulfilled') setRecentTxns((txnRes.value.data?.data?.content ?? []).map(mapTxn));
      if (goalsRes.status === 'fulfilled') setGoals(goalsRes.value.data?.data ?? []);
      if (budgetRes.status === 'fulfilled') setBudget(budgetRes.value.data?.data ?? null);
    }).finally(() => setLoading(false));
  }, [refreshKey]);

  // AI insights fetched once on mount — independent of transaction refreshes
  uE(() => {
    aiApi.insights().then(res => {
      const raw = res.data?.data;
      if (Array.isArray(raw)) setInsights(raw);
      else if (typeof raw === 'string' && raw.length > 0) {
        setInsights([{ id: 'ai1', kind: 'tip', title: 'AI Insight', body: raw, action: null }]);
      }
    }).catch(err => {
      setAiError(err.response?.data?.message ?? 'AI service unavailable');
    });
  }, []);

  // ── Derived values ─────────────────────────────────────────
  const { income: monthIncome, expense: monthExpense, balance } = summary;
  const savingsRate = monthIncome > 0 ? ((monthIncome - monthExpense) / monthIncome * 100).toFixed(0) : '0';
  const monthlyTrim = uM(() => monthly.slice(-(range === '12m' ? 12 : range === '6m' ? 6 : 3)), [monthly, range]);

  // Month label for the "This month" chip
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const thisMonthLabel = `${monthNames[now.getMonth()]} ${year}`;
  const budgetPct    = budget?.monthlyLimit ? (monthExpense / Number(budget.monthlyLimit)) * 100 : 0;
  const showBudgetWarn = !!(budget?.alertEnabled && budgetPct >= Number(budget?.alertThreshold ?? 80));
  const budgetOver   = showBudgetWarn && monthExpense > Number(budget?.monthlyLimit);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--fm-text-muted)' }}>
      Loading dashboard…
    </div>
  );

  return (
    <div className="fm-fadein fm-rise" style={{ display: 'grid', gap: 'var(--fm-gap, 16px)' }}>
      {/* Top stat row */}
      <div className="fm-grid cols-4">
        <StatCard label="Net Balance" value={balance}/>
        <StatCard label={`${thisMonthLabel} Income`} value={monthIncome} sparkColor="#10b981"/>
        <StatCard label={`${thisMonthLabel} Spending`} value={monthExpense} sparkColor="#f97316"/>
        <StatCard label="Savings Rate" value={null}>
          <div style={{ fontFamily: 'var(--fm-font-display)', fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>{savingsRate}%</div>
          <div style={{ color: 'var(--fm-text-muted)', fontSize: 12, marginTop: 4 }}>of income saved</div>
        </StatCard>
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
              {fmt.vnd(monthExpense, { compact: true })} / {fmt.vnd(Number(budget.monthlyLimit), { compact: true })} ₫ spent this month
            </div>
          </div>
          <button className="fm-btn fm-ghost fm-sm" onClick={() => onGoto('budgets')} style={{ fontSize: 12, flexShrink: 0 }}>Manage →</button>
        </div>
      )}

      {/* Big chart + donut */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--fm-gap, 16px)' }} className="fm-dash-2col">
        <div className="fm-card">
          <div className="fm-card-h">
            <div>
              <h3>Income vs. Expenses</h3>
            </div>
            <Segmented value={range} onChange={setRange} options={[{value:'3m',label:'3M'},{value:'6m',label:'6M'},{value:'12m',label:'1Y'}]}/>
          </div>
          {monthlyTrim.length > 0
            ? <BarPairChart data={monthlyTrim} height={240} formatY={(v) => fmt.vnd(v, { compact: true })}/>
            : <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fm-text-muted)' }}>No data yet</div>
          }
        </div>

        <div className="fm-card">
          <div className="fm-card-h">
            <h3>This month</h3>
            <span className="fm-chip active">{thisMonthLabel}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '6px 0 18px' }}>
            <DonutChart
              data={[
                { name: 'Saved', value: Math.max(0, monthIncome - monthExpense), color: 'var(--fm-accent)' },
                { name: 'Spent', value: monthExpense, color: 'var(--fm-accent-2)' },
              ]}
              size={158}
              thickness={18}
              label="Savings rate"
              formatTotal={() => `${savingsRate}%`}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--fm-text-muted)', marginBottom: 2 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--fm-accent)' }}/>Income
                </div>
                <div className="fm-mono" style={{ fontSize: 16, fontWeight: 600 }}>{fmt.vnd(monthIncome, { compact: true })} ₫</div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--fm-text-muted)', marginBottom: 2 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--fm-accent-2)' }}/>Expenses
                </div>
                <div className="fm-mono" style={{ fontSize: 16, fontWeight: 600 }}>{fmt.vnd(monthExpense, { compact: true })} ₫</div>
              </div>
              <div style={{ borderTop: '1px dashed var(--fm-border)', paddingTop: 10 }}>
                <div style={{ fontSize: 11, color: 'var(--fm-text-muted)', marginBottom: 2 }}>Net flow</div>
                <div className="fm-mono" style={{ fontSize: 16, fontWeight: 700, color: monthIncome >= monthExpense ? 'var(--fm-accent)' : 'var(--fm-accent-2)' }}>
                  {monthIncome >= monthExpense ? '+' : '−'}{fmt.vnd(Math.abs(monthIncome - monthExpense), { compact: true })} ₫
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row: category spending, recent txns, goals */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.4fr 1fr', gap: 'var(--fm-gap, 16px)' }} className="fm-dash-3col">
        {/* Category spend bars */}
        <div className="fm-card">
          <div className="fm-card-h">
            <h3>Spending · {thisMonthLabel}</h3>
            <span className="fm-link" onClick={() => onGoto('budgets')} style={{ fontSize: 12 }}>All →</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {catSummary.length === 0
              ? <div style={{ color: 'var(--fm-text-muted)', fontSize: 13 }}>No spending data</div>
              : catSummary.slice(0, 5).map((b, i) => {
                  const color = catColor(i);
                  const maxSpent = Number(catSummary[0]?.total ?? 1);
                  const spent = Number(b.total);
                  return (
                    <div key={b.categoryName}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12.5 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 14 }}>{b.categoryIcon || '💳'}</span>
                          <span>{b.categoryName}</span>
                        </div>
                        <span className="fm-mono" style={{ color: 'var(--fm-text-muted)' }}>
                          {fmt.vnd(spent, { compact: true })} ₫
                        </span>
                      </div>
                      <HBar value={spent} max={maxSpent} color={color}/>
                    </div>
                  );
                })
            }
          </div>
        </div>

        {/* Recent transactions */}
        <div className="fm-card">
          <div className="fm-card-h">
            <h3>Recent transactions</h3>
            <span className="fm-link" onClick={() => onGoto('transactions')} style={{ fontSize: 12 }}>View all →</span>
          </div>
          <div>
            {recentTxns.length === 0
              ? <div style={{ color: 'var(--fm-text-muted)', fontSize: 13, padding: '12px 0' }}>No transactions yet</div>
              : recentTxns.map(t => <TxnRow key={t.id} t={t} onClick={onOpenTxn} showDate/>)
            }
          </div>
        </div>

        {/* Goals */}
        <div className="fm-card">
          <div className="fm-card-h">
            <h3>Active goals</h3>
            <span className="fm-link" onClick={() => onGoto('goals')} style={{ fontSize: 12 }}>All →</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {goals.length === 0
              ? <div style={{ color: 'var(--fm-text-muted)', fontSize: 13 }}>No goals yet</div>
              : goals.slice(0, 3).map(g => {
                  const target  = Number(g.targetAmount);
                  const current = Number(g.currentAmount ?? 0);
                  const pct = target > 0 ? (current / target) * 100 : 0;
                  const color = g.color || '#10b981';
                  return (
                    <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <RingProgress value={current} max={target} color={color} size={48} thickness={4}/>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{g.name}</div>
                        <div className="fm-mono" style={{ fontSize: 11, color: 'var(--fm-text-muted)' }}>
                          {fmt.vnd(current, { compact: true })} / {fmt.vnd(target, { compact: true })} ₫
                        </div>
                      </div>
                      <div className="fm-mono" style={{ fontSize: 12, color, fontWeight: 700 }}>{pct.toFixed(0)}%</div>
                    </div>
                  );
                })
            }
          </div>
        </div>
      </div>

      {/* Market mini widget */}
      <MarketMiniWidget onGoto={onGoto}/>

      {/* AI Insights */}
      {(insights.length > 0 || aiError) && (
        <div className="fm-card">
          <div className="fm-card-h">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon.Sparkles size={14} style={{ color: 'var(--fm-accent)' }}/>AI Insights
            </h3>
            {insights.length > 0 && <span className="fm-link" onClick={() => onGoto('insights')} style={{ fontSize: 12 }}>More →</span>}
          </div>
          {aiError
            ? <div style={{ fontSize: 13, color: 'var(--fm-text-muted)', padding: '6px 0' }}>⚠ {aiError}</div>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {insights.slice(0, 3).map((ins, i) => <InsightChip key={ins.id ?? i} ins={ins}/>)}
              </div>
          }
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MARKET MINI WIDGET
// ─────────────────────────────────────────────────────────────
const MARKET_FEATURED = ['BTC','ETH','USD_VND','GOLD'];

function MarketMiniWidget({ onGoto }) {
  const { t } = useTranslation();
  const [items, setItems] = uS([]);
  const [loading, setLoading] = uS(true);

  uE(() => {
    marketApi.getAll()
      .then(res => {
        const list = res.data?.data ?? res.data ?? [];
        const arr = Array.isArray(list) ? list : Object.values(list);
        const featured = MARKET_FEATURED
          .map(sym => arr.find(x => x.symbol === sym))
          .filter(Boolean);
        setItems(featured.length ? featured : arr.slice(0, 4));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function fmtP(price, currency) {
    if (currency === 'VND') {
      const n = price >= 1_000_000
        ? `${(price / 1_000_000).toFixed(1)}M`
        : price >= 1000 ? `${(price / 1000).toFixed(0)}K` : String(price);
      return `${n} ₫`;
    }
    if (price >= 1000) return `$${(price / 1000).toFixed(1)}K`;
    if (price >= 1)    return `$${price.toFixed(2)}`;
    return `$${price.toFixed(4)}`;
  }

  if (loading || items.length === 0) return null;

  return (
    <div className="fm-card">
      <div className="fm-card-h">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon.Market size={14} style={{ color: 'var(--fm-accent)' }}/>
          {t('dashboard.marketOverview')}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="fm-live-dot"/>
          <span className="fm-link" onClick={() => onGoto('market')} style={{ fontSize: 12 }}>
            {t('dashboard.viewAll')} →
          </span>
        </div>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${items.length}, 1fr)`,
        gap: 12,
      }}>
        {items.map(item => {
          const up = item.change24h >= 0;
          return (
            <div key={item.symbol} style={{
              display: 'flex', flexDirection: 'column', gap: 4,
              padding: '10px 12px', borderRadius: 10,
              background: 'var(--fm-surface-2)',
              border: '1px solid var(--fm-border)',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
              onClick={() => onGoto('market')}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--fm-border-strong)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--fm-border)'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                <span style={{
                  fontSize: 10, fontFamily: 'var(--fm-font-mono)', fontWeight: 600, padding: '1px 5px',
                  borderRadius: 4, color: up ? 'var(--fm-success)' : 'var(--fm-danger)',
                  background: up ? 'var(--fm-success-soft)' : 'var(--fm-danger-soft)',
                }}>
                  {up ? '▲' : '▼'} {Math.abs(item.change24h).toFixed(2)}%
                </span>
              </div>
              {item.sparkline?.length > 1 && (
                <Sparkline values={item.sparkline} width={100} height={22} color={up ? '#10b981' : '#ef4444'}/>
              )}
              <div style={{ fontFamily: 'var(--fm-font-mono)', fontSize: 13, fontWeight: 700, color: up ? 'var(--fm-success)' : 'var(--fm-danger)' }}>
                {fmtP(item.price, item.currency)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--fm-text-muted)' }}>{item.name}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InsightChip({ ins }) {
  const colorMap = {
    warn: { bg: 'var(--fm-accent-2-soft)', fg: 'var(--fm-accent-2)' },
    good: { bg: 'var(--fm-accent-soft)',   fg: 'var(--fm-accent)' },
    info: { bg: 'rgba(96,165,250,0.12)',   fg: '#60a5fa' },
    tip:  { bg: 'rgba(167,139,250,0.12)',  fg: '#a78bfa' },
  };
  const dotMap = { warn: <Icon.Alert size={14}/>, good: <Icon.Check size={14}/>, info: <Icon.Bell size={14}/>, tip: <Icon.Sparkles size={14}/> };
  const colors = colorMap[ins.kind] ?? { bg: 'var(--fm-surface-3)', fg: 'var(--fm-accent)' };
  const dot    = dotMap[ins.kind]   ?? <Icon.Sparkles size={14}/>;
  return (
    <div style={{ padding: 12, border: '1px solid var(--fm-border)', borderRadius: 12, background: 'var(--fm-surface-2)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ width: 22, height: 22, borderRadius: 6, background: colors.bg, color: colors.fg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{dot}</span>
        <span style={{ fontSize: 12.5, fontWeight: 600 }}>{ins.title}</span>
      </div>
      <div style={{ fontSize: 12, color: 'var(--fm-text-muted)', lineHeight: 1.5, marginBottom: ins.action ? 8 : 0 }}>{ins.body}</div>
      {ins.action && <span style={{ fontSize: 11.5, color: colors.fg, fontWeight: 600, cursor: 'pointer' }}>{ins.action} →</span>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TRANSACTIONS
// ─────────────────────────────────────────────────────────────
export function TransactionsScreen({ onOpenTxn, search, refreshKey }) {
  const fmt = FM_FMT;
  const [type, setType] = uS('all');
  const [period, setPeriod] = uS('30d');
  const [page, setPage] = uS(0);
  const PAGE_SIZE = 20;

  const [txns,       setTxns]       = uS([]);
  const [totalPages, setTotalPages] = uS(0);
  const [totalItems, setTotalItems] = uS(0);
  const [loading,    setLoading]    = uS(false);

  // Build date range from period selector
  function periodRange(p) {
    if (p === 'all') return {};
    const days = { '7d': 7, '30d': 30, '90d': 90 }[p];
    const to   = new Date();
    const from = new Date(); from.setDate(from.getDate() - days);
    return {
      from: from.toISOString().slice(0, 10),
      to:   to.toISOString().slice(0, 10),
    };
  }

  uE(() => {
    setLoading(true);
    const params = { page, size: PAGE_SIZE, sort: 'date,desc' };
    if (type !== 'all') params.type = type.toUpperCase();
    const range = periodRange(period);
    if (range.from) { params.from = range.from; params.to = range.to; }

    const req = search?.trim()
      ? transactionApi.search({ keyword: search.trim(), page, size: PAGE_SIZE })
      : transactionApi.getAll(params);

    req.then(res => {
      const data = res.data?.data ?? {};
      const content = data.content ?? [];
      setTxns(content.map(mapTxn));
      setTotalPages(data.totalPages ?? 0);
      setTotalItems(data.totalElements ?? 0);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [type, period, page, search, refreshKey]);

  // Reset to page 0 when filters or refreshKey change
  uE(() => { setPage(0); }, [type, period, search, refreshKey]);

  const grouped = uM(() => {
    const g = {};
    txns.forEach(t => { (g[t.date] = g[t.date] || []).push(t); });
    return Object.entries(g).sort(([a], [b]) => b.localeCompare(a));
  }, [txns]);

  const totalIncome  = txns.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalExpense = txns.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  function clearFilters() { setType('all'); setPeriod('30d'); setPage(0); }
  const filtersActive = type !== 'all' || period !== '30d';

  return (
    <div className="fm-fadein" style={{ display: 'grid', gap: 'var(--fm-gap, 16px)' }}>
      {/* Summary */}
      <div className="fm-grid cols-3">
        <StatCard label="Transactions" value={totalItems} currency=""/>
        <StatCard label="Income (page)" value={totalIncome} sparkColor="#10b981"/>
        <StatCard label="Expenses (page)" value={totalExpense} sparkColor="#f97316"/>
      </div>

      {/* Filter bar */}
      <div className="fm-card" style={{ padding: 14 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <Segmented value={period} onChange={v => { setPeriod(v); setPage(0); }}
            options={[{value:'7d',label:'7D'},{value:'30d',label:'30D'},{value:'90d',label:'90D'},{value:'all',label:'All'}]}/>
          <Segmented value={type} onChange={v => { setType(v); setPage(0); }}
            options={[{value:'all',label:'All'},{value:'income',label:'Income'},{value:'expense',label:'Expenses'}]}/>
          {filtersActive && (
            <button className="fm-btn fm-ghost fm-sm" onClick={clearFilters}>
              <Icon.X size={12}/> Clear filters
            </button>
          )}
          <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--fm-text-muted)' }}>
            {totalItems} total
          </div>
        </div>
      </div>

      {/* Transaction list grouped by day */}
      <div className="fm-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading
          ? <div style={{ padding: 60, textAlign: 'center', color: 'var(--fm-text-muted)' }}>Loading…</div>
          : (
          <div style={{ maxHeight: '65vh', overflowY: 'auto' }}>
            {grouped.length === 0
              ? <div style={{ padding: 60, textAlign: 'center', color: 'var(--fm-text-muted)' }}>No transactions match these filters.</div>
              : grouped.map(([date, dayTxns]) => {
                  const dayIncome  = dayTxns.filter(t => t.amount > 0).reduce((s,t)=>s+t.amount,0);
                  const dayExpense = dayTxns.filter(t => t.amount < 0).reduce((s,t)=>s+Math.abs(t.amount),0);
                  return (
                    <div key={date}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', background: 'var(--fm-surface-2)', borderTop: '1px solid var(--fm-border-subtle)', borderBottom: '1px solid var(--fm-border-subtle)', position: 'sticky', top: 0, zIndex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                          <span style={{ fontSize: 12, fontWeight: 600 }}>{fmt.relDay(date)}</span>
                          <span style={{ fontSize: 11, color: 'var(--fm-text-muted)' }}>{fmt.date(date, { long: true })}</span>
                        </div>
                        <div className="fm-mono" style={{ fontSize: 11, color: 'var(--fm-text-muted)' }}>
                          {dayIncome > 0 && <span style={{ color: 'var(--fm-accent)', marginRight: 12 }}>+{fmt.vnd(dayIncome, { compact: true })}</span>}
                          <span>−{fmt.vnd(dayExpense, { compact: true })} ₫</span>
                        </div>
                      </div>
                      <div style={{ padding: '0 18px' }}>
                        {dayTxns.map(t => <TxnRow key={t.id} t={t} onClick={onOpenTxn}/>)}
                      </div>
                    </div>
                  );
                })
            }
          </div>
        )}
        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '12px 18px', borderTop: '1px solid var(--fm-border)' }}>
            <button className="fm-btn fm-sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Prev</button>
            <span style={{ fontSize: 13, color: 'var(--fm-text-muted)' }}>Page {page + 1} / {totalPages}</span>
            <button className="fm-btn fm-sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// BUDGETS
// ─────────────────────────────────────────────────────────────
export function BudgetsScreen() {
  const fmt = FM_FMT;
  const now = new Date();
  const year = now.getFullYear();
  const monthStr = String(now.getMonth() + 1).padStart(2, '0');
  const fromDate = `${year}-${monthStr}-01`;
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
  const toDate = `${year}-${monthStr}-${lastDay}`;
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const thisMonthLabel = `${monthNames[now.getMonth()]} ${year}`;
  const daysLeft = Math.max(1, lastDay - now.getDate());

  const [budget,    setBudget]    = uS(null);
  const [catSpend,  setCatSpend]  = uS([]);
  const [loading,   setLoading]   = uS(true);
  const [editBudget, setEditBudget] = uS(false);

  uE(() => {
    setLoading(true);
    Promise.allSettled([
      profileApi.getBudget(),
      reportApi.categories(fromDate, toDate),
    ]).then(([budRes, catRes]) => {
      if (budRes.status === 'fulfilled') setBudget(budRes.value.data?.data ?? null);
      if (catRes.status === 'fulfilled') setCatSpend(catRes.value.data?.data ?? []);
    }).finally(() => setLoading(false));
  }, []);

  const monthlyLimit = Number(budget?.monthlyLimit ?? 0);
  const totalSpent   = catSpend.reduce((s, c) => s + Number(c.total), 0);
  const remaining    = monthlyLimit - totalSpent;
  const totalExpense = totalSpent; // catSpend is expense only

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: 'var(--fm-text-muted)' }}>Loading budget…</div>;

  return (
    <div className="fm-fadein" style={{ display: 'grid', gap: 'var(--fm-gap, 16px)' }}>
      <div className="fm-grid cols-3">
        <StatCard label={`${thisMonthLabel} Budget`} value={monthlyLimit || null}>
          {!monthlyLimit && <div style={{ color: 'var(--fm-text-muted)', fontSize: 13 }}>Not set — <button className="fm-btn fm-ghost fm-sm" style={{ fontSize: 13 }} onClick={() => setEditBudget(true)}>Set budget</button></div>}
        </StatCard>
        <StatCard label="Spent this month" value={totalSpent} sparkColor="#f97316"/>
        <StatCard label="Remaining" value={monthlyLimit ? remaining : null}>
          {monthlyLimit
            ? <div style={{ fontFamily: 'var(--fm-font-display)', fontSize: 24, fontWeight: 700, color: remaining >= 0 ? 'var(--fm-accent)' : 'var(--fm-accent-2)' }}>
                {fmt.vnd(Math.abs(remaining), { compact: true })} ₫ {remaining >= 0 ? 'left' : 'over'}
              </div>
            : <div style={{ color: 'var(--fm-text-muted)', fontSize: 13 }}>Set a budget first</div>
          }
        </StatCard>
      </div>

      {/* Budget edit form */}
      {editBudget && (
        <BudgetForm budget={budget} onSave={async (data) => {
          await profileApi.saveBudget(data).catch(() => {});
          setEditBudget(false);
          profileApi.getBudget().then(r => setBudget(r.data?.data ?? null)).catch(() => {});
        }} onCancel={() => setEditBudget(false)}/>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--fm-gap, 16px)' }} className="fm-dash-2col">
        <div className="fm-card">
          <div className="fm-card-h">
            <h3>Spending by category · {thisMonthLabel}</h3>
            <button className="fm-btn fm-sm" onClick={() => setEditBudget(true)}>
              <Icon.Plus size={12}/> {budget ? 'Edit budget' : 'Set budget'}
            </button>
          </div>
          {catSpend.length === 0
            ? <div style={{ color: 'var(--fm-text-muted)', fontSize: 13, padding: '16px 0' }}>No spending data for this month.</div>
            : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {catSpend.map((c, i) => {
                const spent = Number(c.total);
                const color = catColor(i);
                return (
                  <div key={c.categoryName} style={{ display: 'grid', gridTemplateColumns: '36px 1fr', gap: 14, alignItems: 'center' }}>
                    <div className="fm-cat-ic" style={{ width: 34, height: 34, background: color + '22', border: `1px solid ${color}44`, color }}>
                      {c.categoryIcon || '💳'}
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 500 }}>{c.categoryName}</div>
                        <div className="fm-mono" style={{ fontSize: 12, color: 'var(--fm-text-muted)' }}>
                          <span>{fmt.vnd(spent, { compact: true })}</span>
                          <span style={{ color: 'var(--fm-text-dim)' }}> ₫ ({c.percentage.toFixed(1)}%)</span>
                        </div>
                      </div>
                      <HBar value={spent} max={Math.max(spent, Number(catSpend[0]?.total ?? 1))} color={color}/>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="fm-card">
          <div className="fm-card-h">
            <h3>Breakdown</h3>
            <span className="fm-card-sub">By spending</span>
          </div>
          {catSpend.length > 0
            ? <>
                <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0 12px' }}>
                  <DonutChart
                    data={catSpend.map((c, i) => ({ name: c.categoryName, value: Number(c.total), color: catColor(i) }))}
                    size={188} thickness={22}
                    label="Total spent"
                    formatTotal={(v) => fmt.vnd(v, { compact: true }) + ' ₫'}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {catSpend.map((c, i) => (
                    <div key={c.categoryName} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: catColor(i), flexShrink: 0 }}/>
                      <span>{c.categoryIcon || ''} {c.categoryName}</span>
                      <span style={{ marginLeft: 'auto', color: 'var(--fm-text-muted)' }} className="fm-mono">{c.percentage.toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </>
            : <div style={{ color: 'var(--fm-text-muted)', fontSize: 13 }}>No spending data yet</div>
          }
        </div>
      </div>
    </div>
  );
}

function BudgetForm({ budget, onSave, onCancel }) {
  const [monthly, setMonthly] = uS(budget?.monthlyLimit ?? '');
  const [daily,   setDaily]   = uS(budget?.dailyLimit ?? '');
  const [alert,   setAlert]   = uS(budget?.alertEnabled ?? false);
  const [thresh,  setThresh]  = uS(budget?.alertThreshold ?? 80);
  const [saving,  setSaving]  = uS(false);
  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    await onSave({ monthlyLimit: Number(monthly) || null, dailyLimit: Number(daily) || null, alertEnabled: alert, alertThreshold: Number(thresh) });
    setSaving(false);
  }
  return (
    <div className="fm-card" style={{ borderColor: 'var(--fm-accent)' }}>
      <div className="fm-card-h"><h3>{budget ? 'Edit budget' : 'Set monthly budget'}</h3><button className="fm-btn fm-ghost fm-sm" onClick={onCancel}>Cancel</button></div>
      <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
        <div>
          <label className="fm-label">Monthly limit (₫)</label>
          <input className="fm-input fm-mono" type="number" value={monthly} onChange={e => setMonthly(e.target.value)} placeholder="e.g. 20000000" min="0"/>
        </div>
        <div>
          <label className="fm-label">Daily limit (₫)</label>
          <input className="fm-input fm-mono" type="number" value={daily} onChange={e => setDaily(e.target.value)} placeholder="e.g. 700000" min="0"/>
        </div>
        <div style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', gap: 12 }}>
          <input type="checkbox" id="alertChk" checked={alert} onChange={e => setAlert(e.target.checked)}/>
          <label htmlFor="alertChk" style={{ fontSize: 13 }}>Alert when spending reaches</label>
          <input className="fm-input" type="number" value={thresh} onChange={e => setThresh(e.target.value)} style={{ width: 70 }} min="1" max="100"/>
          <span style={{ fontSize: 13, color: 'var(--fm-text-muted)' }}>%</span>
        </div>
        <div style={{ gridColumn: '1/-1', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="submit" className="fm-btn fm-primary" disabled={saving}>{saving ? 'Saving…' : 'Save budget'}</button>
        </div>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// GOALS
// ─────────────────────────────────────────────────────────────
const GOAL_COLORS = ['#10b981','#f97316','#a78bfa','#22d3ee','#ec4899','#eab308'];

export function GoalsScreen() {
  const fmt = FM_FMT;
  const [goals,    setGoals]    = uS([]);
  const [loading,  setLoading]  = uS(true);
  const [showForm, setShowForm] = uS(false);
  const [addFundsGoal, setAddFundsGoal] = uS(null); // goal being funded

  function load() {
    setLoading(true);
    profileApi.getSavingsGoals()
      .then(res => setGoals(res.data?.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }
  uE(load, []);

  async function handleDelete(id) {
    if (!confirm('Delete this goal?')) return;
    await profileApi.deleteSavingsGoal(id).catch(() => {});
    load();
  }

  async function handleAddFunds(goal, extraAmount) {
    const newCurrent = Number(goal.currentAmount ?? 0) + Number(extraAmount);
    await profileApi.updateSavingsGoal(goal.id, {
      name: goal.name,
      targetAmount: Number(goal.targetAmount),
      currentAmount: newCurrent,
      deadline: goal.deadline,
      color: goal.color,
      icon: goal.icon,
    }).catch(() => {});
    setAddFundsGoal(null);
    load();
  }

  const totalTarget  = goals.reduce((s, g) => s + Number(g.targetAmount ?? 0), 0);
  const totalCurrent = goals.reduce((s, g) => s + Number(g.currentAmount ?? 0), 0);

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: 'var(--fm-text-muted)' }}>Loading goals…</div>;

  return (
    <div className="fm-fadein" style={{ display: 'grid', gap: 'var(--fm-gap, 16px)' }}>
      <div className="fm-grid cols-3">
        <StatCard label="Total saved" value={totalCurrent}/>
        <StatCard label="Total target" value={totalTarget}/>
        <StatCard label="Overall progress" value={null}>
          <div style={{ fontFamily: 'var(--fm-font-display)', fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>
            {totalTarget > 0 ? ((totalCurrent / totalTarget) * 100).toFixed(0) : 0}%
          </div>
        </StatCard>
      </div>

      {/* New goal form */}
      {showForm && <GoalForm onSave={async (data) => {
        await profileApi.createSavingsGoal(data).catch(() => {});
        setShowForm(false); load();
      }} onCancel={() => setShowForm(false)}/>}

      {/* Add funds inline form */}
      {addFundsGoal && <AddFundsForm goal={addFundsGoal} onSave={(amt) => handleAddFunds(addFundsGoal, amt)} onCancel={() => setAddFundsGoal(null)}/>}

      <div className="fm-grid cols-2">
        {goals.map((g, i) => {
          const target  = Number(g.targetAmount ?? 0);
          const current = Number(g.currentAmount ?? 0);
          const pct = target > 0 ? (current / target) * 100 : 0;
          const remaining = target - current;
          const color = g.color || GOAL_COLORS[i % GOAL_COLORS.length];
          return (
            <div key={g.id} className="fm-card fm-hover" style={{ overflow: 'hidden', position: 'relative' }}>
              <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: `radial-gradient(circle, ${color}22, transparent 70%)`, pointerEvents: 'none' }}/>
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: `color-mix(in oklab, ${color} 16%, var(--fm-surface-2))`, border: `1px solid color-mix(in oklab, ${color} 30%, transparent)`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                      {g.icon || '🎯'}
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{g.name}</div>
                      {g.deadline && <div style={{ fontSize: 11.5, color: 'var(--fm-text-muted)' }}>Target by {fmt.date(g.deadline, { long: true })}</div>}
                    </div>
                  </div>
                  <span className="fm-mono" style={{ fontSize: 22, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>{pct.toFixed(0)}%</span>
                </div>

                <HBar value={current} max={target} color={color} height={8}/>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--fm-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Saved</div>
                    <div className="fm-mono" style={{ fontSize: 16, fontWeight: 600 }}>{fmt.vnd(current, { compact: true })} ₫</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: 'var(--fm-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Remaining</div>
                    <div className="fm-mono" style={{ fontSize: 16, fontWeight: 600 }}>{fmt.vnd(Math.max(0, remaining), { compact: true })} ₫</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: 'var(--fm-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Target</div>
                    <div className="fm-mono" style={{ fontSize: 16, fontWeight: 600 }}>{fmt.vnd(target, { compact: true })} ₫</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <button className="fm-btn fm-primary fm-sm" style={{ background: color, boxShadow: `0 6px 18px ${color}30` }}
                    onClick={() => setAddFundsGoal(g)}>
                    <Icon.Plus size={12}/> Add funds
                  </button>
                  <button className="fm-btn fm-ghost fm-sm" style={{ marginLeft: 'auto', color: '#ef4444' }}
                    onClick={() => handleDelete(g.id)}>Delete</button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Add new goal card */}
        <div className="fm-card" onClick={() => setShowForm(true)}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', minHeight: 200, cursor: 'pointer', color: 'var(--fm-text-muted)' }}>
          <div style={{ width: 44, height: 44, borderRadius: 999, background: 'var(--fm-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
            <Icon.Plus size={20}/>
          </div>
          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--fm-text)' }}>New savings goal</div>
          <div style={{ fontSize: 12, marginTop: 2 }}>House, car, retirement, anything</div>
        </div>
      </div>
    </div>
  );
}

function GoalForm({ onSave, onCancel }) {
  const [name, setName] = uS('');
  const [target, setTarget] = uS('');
  const [current, setCurrent] = uS('');
  const [deadline, setDeadline] = uS('');
  const [icon, setIcon] = uS('🎯');
  const [color, setColor] = uS('#10b981');
  const [saving, setSaving] = uS(false);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    await onSave({ name, targetAmount: Number(target), currentAmount: Number(current) || 0, deadline: deadline || null, icon, color });
    setSaving(false);
  }
  return (
    <div className="fm-card" style={{ borderColor: 'var(--fm-accent)' }}>
      <div className="fm-card-h"><h3>New savings goal</h3><button className="fm-btn fm-ghost fm-sm" onClick={onCancel}>Cancel</button></div>
      <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
        <div style={{ gridColumn: '1/-1' }}>
          <label className="fm-label">Goal name</label>
          <input className="fm-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Emergency Fund" required/>
        </div>
        <div>
          <label className="fm-label">Target amount (₫)</label>
          <input className="fm-input fm-mono" type="number" value={target} onChange={e => setTarget(e.target.value)} placeholder="0" required min="1"/>
        </div>
        <div>
          <label className="fm-label">Already saved (₫)</label>
          <input className="fm-input fm-mono" type="number" value={current} onChange={e => setCurrent(e.target.value)} placeholder="0" min="0"/>
        </div>
        <div>
          <label className="fm-label">Deadline (optional)</label>
          <input className="fm-input" type="date" value={deadline} onChange={e => setDeadline(e.target.value)}/>
        </div>
        <div>
          <label className="fm-label">Icon & color</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="fm-input" value={icon} onChange={e => setIcon(e.target.value)} style={{ width: 60 }} placeholder="🎯"/>
            <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ width: 44, height: 38, padding: 4, border: '1px solid var(--fm-border)', borderRadius: 8, background: 'var(--fm-surface)', cursor: 'pointer' }}/>
          </div>
        </div>
        <div style={{ gridColumn: '1/-1', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="submit" className="fm-btn fm-primary" disabled={saving}>{saving ? 'Saving…' : 'Create goal'}</button>
        </div>
      </form>
    </div>
  );
}

function AddFundsForm({ goal, onSave, onCancel }) {
  const fmt = FM_FMT;
  const [amount, setAmount] = uS('');
  const [saving, setSaving] = uS(false);
  async function submit(e) {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;
    setSaving(true);
    await onSave(Number(amount));
    setSaving(false);
  }
  return (
    <div className="fm-card" style={{ borderColor: goal.color || 'var(--fm-accent)' }}>
      <div className="fm-card-h">
        <h3>Add funds to «{goal.name}»</h3>
        <button className="fm-btn fm-ghost fm-sm" onClick={onCancel}>Cancel</button>
      </div>
      <div style={{ color: 'var(--fm-text-muted)', fontSize: 13, marginBottom: 12 }}>
        Current: {fmt.vnd(Number(goal.currentAmount ?? 0), { compact: true })} ₫ / {fmt.vnd(Number(goal.targetAmount), { compact: true })} ₫
      </div>
      <form onSubmit={submit} style={{ display: 'flex', gap: 8 }}>
        <input className="fm-input fm-mono" type="number" value={amount} onChange={e => setAmount(e.target.value)}
          placeholder="Amount to add (₫)" min="1" required style={{ flex: 1 }}/>
        <button type="submit" className="fm-btn fm-primary" disabled={saving}>{saving ? '…' : 'Add'}</button>
      </form>
    </div>
  );
}

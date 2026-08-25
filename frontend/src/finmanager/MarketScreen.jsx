// MarketScreen.jsx — Real-time market intelligence: crypto, forex, commodities, fuel

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { marketApi } from '../api/marketApi';
import { Sparkline } from './Charts';
import { Segmented, Icon } from './Components';

const REFRESH_INTERVAL = 60_000; // 60s auto-refresh

// ── Category config ───────────────────────────────────────────────
const CATS = [
  { key: 'all',         labelKey: 'market.all' },
  { key: 'crypto',      labelKey: 'market.crypto' },
  { key: 'forex',       labelKey: 'market.forex' },
  { key: 'commodities', labelKey: 'market.commodities' },
  { key: 'fuel',        labelKey: 'market.fuel' },
];

const CAT_COLOR = {
  crypto:      '#f7931a',
  forex:       '#3b82f6',
  commodities: '#f59e0b',
  fuel:        '#ef4444',
};

const CAT_ICON_BG = {
  crypto:      'linear-gradient(135deg,#f7931a,#f59e0b)',
  forex:       'linear-gradient(135deg,#3b82f6,#6366f1)',
  commodities: 'linear-gradient(135deg,#f59e0b,#ef4444)',
  fuel:        'linear-gradient(135deg,#ef4444,#f97316)',
};

// ── Format helpers ────────────────────────────────────────────────
function fmtPrice(price, currency) {
  if (currency === 'VND') {
    return new Intl.NumberFormat('vi-VN').format(Math.round(price));
  }
  if (price >= 1000) {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price);
  }
  if (price >= 1) {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price);
  }
  return price.toFixed(6);
}

function fmtChange(pct) {
  const abs = Math.abs(pct).toFixed(2);
  return `${pct >= 0 ? '+' : '−'}${abs}%`;
}

function fmtVolume(v) {
  if (!v) return null;
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
  return String(v);
}

function relTime(iso) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const secs  = Math.floor(diff / 1000);
  const mins  = Math.floor(secs / 60);
  if (secs < 10) return 'just now';
  if (secs < 60) return `${secs}s ago`;
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

// ── Skeleton card ─────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="fm-market-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--fm-surface-3)', animation: 'fm-pulse 1.5s ease infinite' }}/>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ height: 14, width: '55%', borderRadius: 6, background: 'var(--fm-surface-3)', animation: 'fm-pulse 1.5s ease infinite' }}/>
          <div style={{ height: 11, width: '35%', borderRadius: 6, background: 'var(--fm-surface-2)', animation: 'fm-pulse 1.5s ease 0.2s infinite' }}/>
        </div>
        <div style={{ height: 22, width: 64, borderRadius: 6, background: 'var(--fm-surface-3)', animation: 'fm-pulse 1.5s ease 0.1s infinite' }}/>
      </div>
      <div style={{ height: 36, borderRadius: 8, background: 'var(--fm-surface-2)', animation: 'fm-pulse 1.5s ease 0.3s infinite' }}/>
      <div style={{ height: 20, width: '50%', borderRadius: 6, background: 'var(--fm-surface-2)', animation: 'fm-pulse 1.5s ease 0.15s infinite' }}/>
    </div>
  );
}

// ── Market price card ─────────────────────────────────────────────
function MarketCard({ item }) {
  const up = item.change24h >= 0;
  const sparkColor = up ? '#10b981' : '#ef4444';
  const accentColor = CAT_COLOR[item.category] ?? 'var(--fm-accent)';
  const iconBg = CAT_ICON_BG[item.category] ?? 'var(--fm-grad-brand)';

  return (
    <div className={`fm-market-card ${up ? 'up' : 'down'}`}>
      {/* Header: icon + name + change badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <div className="fm-market-icon" style={{ background: iconBg, fontSize: 18 }}>
          {item.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {item.name}
          </div>
          <div style={{ fontSize: 11, color: 'var(--fm-text-muted)', fontFamily: 'var(--fm-font-mono)', marginTop: 1 }}>
            {item.symbol}
          </div>
        </div>
        <span className={`fm-market-change ${up ? 'up' : 'down'}`}>
          {up ? '▲' : '▼'} {fmtChange(item.change24h)}
        </span>
      </div>

      {/* Sparkline */}
      {item.sparkline && item.sparkline.length > 1 && (
        <div className="fm-market-sparkline" style={{ marginBottom: 8 }}>
          <Sparkline
            values={item.sparkline}
            width={200}
            height={36}
            color={sparkColor}
          />
        </div>
      )}

      {/* Price */}
      <div className="fm-market-price" style={{ color: up ? 'var(--fm-success)' : 'var(--fm-danger)', marginBottom: 4 }}>
        {fmtPrice(item.price, item.currency)}
        <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--fm-text-muted)', marginLeft: 4 }}>
          {item.currency}
        </span>
      </div>

      {/* 24h range + volume */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
        <div style={{ fontSize: 11, color: 'var(--fm-text-muted)', fontFamily: 'var(--fm-font-mono)' }}>
          <span style={{ color: 'var(--fm-success)', marginRight: 4 }}>H {fmtPrice(item.high24h, item.currency)}</span>
          <span style={{ color: 'var(--fm-danger)' }}>L {fmtPrice(item.low24h, item.currency)}</span>
        </div>
        {item.volume24h > 0 && (
          <div style={{ fontSize: 11, color: 'var(--fm-text-dim)', fontFamily: 'var(--fm-font-mono)' }}>
            Vol {fmtVolume(item.volume24h)}
          </div>
        )}
      </div>

      {/* Source indicator */}
      {item.source && (
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{
            width: 5, height: 5, borderRadius: '50%',
            background: accentColor, flexShrink: 0
          }}/>
          <span style={{ fontSize: 10, color: 'var(--fm-text-dim)', fontFamily: 'var(--fm-font-mono)' }}>
            {item.source}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Summary stats bar ─────────────────────────────────────────────
function MarketSummary({ items }) {
  const total   = items.length;
  const gainers = items.filter(i => i.change24h >= 0).length;
  const losers  = total - gainers;
  const avgChg  = total ? items.reduce((s, i) => s + i.change24h, 0) / total : 0;

  return (
    <div style={{
      display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24,
    }}>
      {[
        { label: 'Gainers', value: gainers, color: 'var(--fm-success)', icon: '▲' },
        { label: 'Losers',  value: losers,  color: 'var(--fm-danger)',  icon: '▼' },
        { label: 'Avg Δ',   value: `${avgChg >= 0 ? '+' : ''}${avgChg.toFixed(2)}%`,
          color: avgChg >= 0 ? 'var(--fm-success)' : 'var(--fm-danger)', icon: '~' },
        { label: 'Assets',  value: total,   color: 'var(--fm-text-muted)', icon: '#' },
      ].map(({ label, value, color, icon }) => (
        <div key={label} style={{
          flex: '1 1 0', minWidth: 90, padding: '10px 16px',
          background: 'var(--fm-surface)', borderRadius: 'var(--fm-radius)',
          border: '1px solid var(--fm-border)', display: 'flex', flexDirection: 'column', gap: 2,
        }}>
          <span style={{ fontSize: 11, color: 'var(--fm-text-muted)' }}>{label}</span>
          <span style={{ fontFamily: 'var(--fm-font-mono)', fontWeight: 700, color, fontSize: 16 }}>
            {icon} {value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Main screen ───────────────────────────────────────────────────
export function MarketScreen() {
  const { t } = useTranslation();
  const [data, setData]         = useState({});   // symbol → MarketDataResponse
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [tab, setTab]           = useState('all');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing]   = useState(false);
  const [tick, setTick]         = useState(0);    // for relative time re-render
  const timerRef = useRef(null);

  const fetchAll = useCallback((isManual = false) => {
    if (isManual) setRefreshing(true);
    else if (!Object.keys(data).length) setLoading(true);

    marketApi.getAll()
      .then(res => {
        const list = res.data?.data ?? res.data ?? [];
        const map  = {};
        (Array.isArray(list) ? list : Object.values(list)).forEach(item => {
          if (item?.symbol) map[item.symbol] = item;
        });
        setData(map);
        setLastUpdated(new Date());
        setError(null);
      })
      .catch(() => {
        setError(t('market.errorLoad'));
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, [t, data]);

  // Initial fetch + 60s auto-refresh
  useEffect(() => {
    fetchAll();
    timerRef.current = setInterval(() => fetchAll(), REFRESH_INTERVAL);
    return () => clearInterval(timerRef.current);
  }, []); // eslint-disable-line

  // Relative-time tick every 15s
  useEffect(() => {
    const id = setInterval(() => setTick(x => x + 1), 15_000);
    return () => clearInterval(id);
  }, []);

  // Filter items by tab
  const items = Object.values(data);
  const filtered = tab === 'all' ? items : items.filter(i => i.category === tab);

  // Sort: gainers first within each category, then losers
  const sorted = [...filtered].sort((a, b) => b.change24h - a.change24h);

  const catOptions = CATS.map(c => ({ label: t(c.labelKey), value: c.key }));

  const handleManualRefresh = () => {
    fetchAll(true);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => fetchAll(), REFRESH_INTERVAL);
  };

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto' }}>

      {/* Header bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 20, gap: 12, flexWrap: 'wrap',
      }}>
        <div>
          <h2 style={{
            margin: 0, fontFamily: 'var(--fm-font-display)', fontWeight: 800,
            fontSize: 22, letterSpacing: '-0.02em',
          }}>
            {t('market.title')}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <div className="fm-live-dot" style={{ borderRadius: '50%' }}/>
            <span style={{ fontSize: 12, color: 'var(--fm-text-muted)', fontFamily: 'var(--fm-font-mono)' }}>
              {lastUpdated
                ? `${t('market.updated')} ${relTime(lastUpdated.toISOString())}`
                : t('market.loading')}
            </span>
          </div>
        </div>

        <button
          className="fm-btn fm-btn-ghost"
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
          onClick={handleManualRefresh}
          disabled={refreshing}
        >
          <Icon.Refresh size={14} style={{ animation: refreshing ? 'fm-spin 0.8s linear infinite' : 'none' }}/>
          {t('market.refresh')}
        </button>
      </div>

      {/* Summary stats */}
      {!loading && !error && items.length > 0 && (
        <MarketSummary items={items} />
      )}

      {/* Category tabs */}
      <div style={{ marginBottom: 20 }}>
        <Segmented
          options={catOptions}
          value={tab}
          onChange={setTab}
        />
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 16,
        }}>
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i}/>)}
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 16, padding: '64px 24px',
          background: 'var(--fm-surface)', borderRadius: 'var(--fm-radius-lg)',
          border: '1px solid var(--fm-border)',
        }}>
          <div style={{ fontSize: 40 }}>📡</div>
          <div style={{ fontWeight: 600, color: 'var(--fm-text)' }}>{t('market.errorTitle')}</div>
          <div style={{ color: 'var(--fm-text-muted)', fontSize: 14, textAlign: 'center', maxWidth: 360 }}>
            {error}
          </div>
          <button className="fm-btn fm-btn-primary" onClick={() => fetchAll(true)}>
            {t('market.retry')}
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && sorted.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '64px 24px',
          color: 'var(--fm-text-muted)',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <div>{t('market.noData')}</div>
        </div>
      )}

      {/* Market grid */}
      {!loading && !error && sorted.length > 0 && (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 16,
          }}>
            {sorted.map(item => (
              <MarketCard key={item.symbol} item={item} />
            ))}
          </div>

          {/* Footer info */}
          <div style={{
            marginTop: 28, padding: '16px 20px',
            background: 'var(--fm-surface)', borderRadius: 'var(--fm-radius)',
            border: '1px solid var(--fm-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 8,
          }}>
            <div style={{ fontSize: 12, color: 'var(--fm-text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon.Globe size={13} style={{ color: 'var(--fm-accent)' }}/>
              {t('market.sources')}: CoinGecko, open.er-api.com, metals.live
            </div>
            <div style={{ fontSize: 12, color: 'var(--fm-text-dim)', fontFamily: 'var(--fm-font-mono)' }}>
              {t('market.autoRefresh', { seconds: REFRESH_INTERVAL / 1000 })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

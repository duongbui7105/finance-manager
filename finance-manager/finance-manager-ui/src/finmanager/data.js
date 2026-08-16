// data.js — mock data for FinManager (VND)
// All amounts in VND (no decimals)

export const FM_DATA = (() => {
  const accounts = [
    { id: 'acc1', name: 'Vietcombank · Checking',  type: 'checking',   institution: 'Vietcombank',    last4: '4821', balance:  84_250_000, change:  +1_240_000, color: '#10b981' },
    { id: 'acc2', name: 'Techcombank · Savings',    type: 'savings',    institution: 'Techcombank',    last4: '9023', balance: 312_800_000, change:  +4_500_000, color: '#22c55e' },
    { id: 'acc3', name: 'VPBank · Credit',          type: 'credit',     institution: 'VPBank',         last4: '1156', balance: -18_420_000, change:    -680_000, color: '#f97316' },
    { id: 'acc4', name: 'TCBS · Brokerage',         type: 'investment', institution: 'TCBS',           last4: '7710', balance: 824_500_000, change: +12_300_000, color: '#a78bfa' },
    { id: 'acc5', name: 'MoMo · Wallet',            type: 'cash',       institution: 'MoMo',           last4: '0044', balance:   2_840_000, change:    -120_000, color: '#ec4899' },
    { id: 'acc6', name: 'Mortgage · BIDV',          type: 'loan',       institution: 'BIDV',           last4: '5532', balance: -1_840_000_000, change: +6_200_000, color: '#94a3b8' },
  ];

  const categories = [
    { id: 'food',      name: 'Food & Dining',   color: '#f97316', icon: '🍜' },
    { id: 'transport', name: 'Transport',       color: '#22d3ee', icon: '🛵' },
    { id: 'housing',   name: 'Housing',         color: '#a78bfa', icon: '🏠' },
    { id: 'shopping',  name: 'Shopping',        color: '#ec4899', icon: '🛍' },
    { id: 'health',    name: 'Health',          color: '#10b981', icon: '⚕' },
    { id: 'enter',     name: 'Entertainment',   color: '#eab308', icon: '🎬' },
    { id: 'bills',     name: 'Bills & Utilities', color: '#94a3b8', icon: '🧾' },
    { id: 'income',    name: 'Income',          color: '#10b981', icon: '↘' },
    { id: 'transfer',  name: 'Transfer',        color: '#64748b', icon: '⇄' },
    { id: 'invest',    name: 'Investment',      color: '#a78bfa', icon: '∆' },
  ];
  const catBy = Object.fromEntries(categories.map(c => [c.id, c]));

  const merchants = {
    food: ['Phở Thìn', 'Bún Chả Hương Liên', 'The Coffee House', 'Highlands Coffee', "Pizza 4P's", 'GrabFood', 'ShopeeFood', 'Cộng Cà Phê'],
    transport: ['Grab Bike', 'Be Taxi', 'Xanh SM', 'Petrolimex', 'VinBus', 'Vietnam Airlines'],
    housing: ['Apartment Rent', 'EVN Electricity', 'Sawaco Water', 'Internet · FPT', 'Cleaning Service'],
    shopping: ['Shopee', 'Lazada', 'Tiki', 'Uniqlo Vincom', 'Muji Crescent Mall', 'IKEA Long Biên'],
    health: ['Pharmacity', 'Long Châu', 'Vinmec Clinic', 'California Fitness'],
    enter: ['Netflix', 'Spotify', 'CGV Cinemas', 'Galaxy Cinema', 'Steam'],
    bills: ['Viettel Postpaid', 'VNPT Internet', 'VTV Cab', 'Insurance Premium'],
    income: ['Salary · Acme Co.', 'Freelance Invoice', 'Dividend · VNM', 'Interest · Techcombank'],
    transfer: ['Transfer to Savings', 'Transfer from Wallet', 'Internal Transfer'],
    invest: ['VN-Index ETF', 'Buy VNM', 'Sell HPG', 'Bond Coupon'],
  };

  // Deterministic pseudo-random
  let seed = 7;
  const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const pick = (a) => a[Math.floor(rand() * a.length)];
  const between = (lo, hi) => Math.floor(lo + rand() * (hi - lo));

  // Build 90 days of transactions
  const today = new Date('2026-05-23');
  const txns = [];
  for (let d = 0; d < 90; d++) {
    const date = new Date(today); date.setDate(today.getDate() - d);
    const count = between(3, 8);
    for (let i = 0; i < count; i++) {
      const isIncome = rand() < 0.07;
      const isInvest = rand() < 0.04;
      const isBill = rand() < 0.06 && date.getDate() < 6;
      let catId;
      if (isIncome) catId = 'income';
      else if (isInvest) catId = 'invest';
      else if (isBill) catId = 'bills';
      else catId = pick(['food','food','food','transport','shopping','enter','health','housing']);
      const cat = catBy[catId];
      const merchant = pick(merchants[catId]);
      let amount;
      if (catId === 'income')   amount = between(25_000_000, 65_000_000);
      else if (catId === 'housing') amount = -between(800_000, 5_000_000);
      else if (catId === 'food')    amount = -between(45_000, 380_000);
      else if (catId === 'transport') amount = -between(20_000, 280_000);
      else if (catId === 'shopping') amount = -between(120_000, 2_400_000);
      else if (catId === 'enter')    amount = -between(80_000, 600_000);
      else if (catId === 'health')   amount = -between(150_000, 1_200_000);
      else if (catId === 'bills')    amount = -between(300_000, 1_800_000);
      else if (catId === 'invest')   amount = (rand() < 0.5 ? -1 : 1) * between(2_000_000, 18_000_000);
      else amount = -between(50_000, 500_000);

      void cat; // used for catId resolution above
      txns.push({
        id: `t${d}_${i}`,
        date: date.toISOString().slice(0, 10),
        merchant,
        category: catId,
        amount,
        account: pick(['acc1','acc1','acc1','acc3','acc5']),
        pending: d === 0 && rand() < 0.3,
        note: rand() < 0.08 ? 'Recurring' : '',
      });
    }
  }
  txns.sort((a,b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

  // Budgets
  const budgets = [
    { catId: 'food',      limit: 8_000_000,  spent: 6_240_000 },
    { catId: 'transport', limit: 3_000_000,  spent: 1_980_000 },
    { catId: 'housing',   limit: 15_000_000, spent: 14_200_000 },
    { catId: 'shopping',  limit: 5_000_000,  spent: 5_840_000 },
    { catId: 'enter',     limit: 2_000_000,  spent: 1_120_000 },
    { catId: 'bills',     limit: 4_000_000,  spent: 3_280_000 },
    { catId: 'health',    limit: 2_500_000,  spent:   720_000 },
  ];

  const goals = [
    { id: 'g1', name: 'Emergency Fund',     target: 200_000_000, current: 162_400_000, eta: '2026-09-01', accent: '#10b981', icon: '🛡' },
    { id: 'g2', name: 'Da Nang Trip',       target:  35_000_000, current:  18_200_000, eta: '2026-08-15', accent: '#f97316', icon: '✈' },
    { id: 'g3', name: 'New MacBook Pro',    target:  72_000_000, current:  44_800_000, eta: '2026-07-20', accent: '#a78bfa', icon: '⌘' },
    { id: 'g4', name: 'Apartment Down Payment', target: 1_200_000_000, current: 412_000_000, eta: '2027-12-01', accent: '#22d3ee', icon: '⌂' },
  ];

  // 12-month income/expense series
  const months = ['Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May'];
  const monthly = months.map((m, i) => ({
    month: m,
    income:  42_000_000 + Math.round(8_000_000 * Math.sin(i / 2)) + i * 600_000,
    expense: 28_000_000 + Math.round(5_000_000 * Math.cos(i / 1.7)) + i * 280_000,
  }));

  // Daily net worth (last 90d)
  const netWorthSeries = [];
  let nw = 1_180_000_000;
  for (let d = 89; d >= 0; d--) {
    nw += between(-3_000_000, 5_000_000);
    const date = new Date(today); date.setDate(today.getDate() - d);
    netWorthSeries.push({ date: date.toISOString().slice(0,10), value: nw });
  }

  // Spending breakdown current month
  const breakdown = budgets
    .filter(b => b.catId !== 'income')
    .map(b => ({ ...catBy[b.catId], value: b.spent }))
    .sort((a,b) => b.value - a.value);

  const insights = [
    { id: 'i1', kind: 'warn',  title: 'Shopping over budget',      body: "You've spent 117% of your Shopping budget with 8 days left in May. Consider deferring non-essentials to June.", action: 'Adjust budget' },
    { id: 'i2', kind: 'good',  title: 'Savings rate trending up',  body: 'Your savings rate climbed to 34% this month — 6 points above your 3-month average.', action: 'See trend' },
    { id: 'i3', kind: 'info',  title: 'Recurring subscription',    body: 'We detected a new ₫249,000/mo charge from Netflix. Add it to your recurring list?', action: 'Track' },
    { id: 'i4', kind: 'tip',   title: 'Idle cash in checking',     body: "You're holding 84M in Vietcombank Checking. Moving 40M to a 6-mo CD could earn ~₫1.2M/year.", action: 'Open CD' },
  ];

  return { accounts, categories, catBy, txns, budgets, goals, monthly, netWorthSeries, breakdown, insights };
})();

export const FM_FMT = {
  vnd(n, opts = {}) {
    const sign = n < 0 ? '-' : '';
    const abs = Math.abs(n);
    if (opts.compact && abs >= 1_000_000_000) return `${sign}${(abs/1_000_000_000).toFixed(2)}B`;
    if (opts.compact && abs >= 1_000_000) return `${sign}${(abs/1_000_000).toFixed(1)}M`;
    if (opts.compact && abs >= 1_000) return `${sign}${(abs/1_000).toFixed(0)}K`;
    return sign + abs.toLocaleString('en-US');
  },
  vndSym(n, opts = {}) { return this.vnd(n, opts) + ' ₫'; },
  date(s, opts={}) {
    const d = new Date(s);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    if (opts.long) return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    return `${months[d.getMonth()]} ${d.getDate()}`;
  },
  relDay(s) {
    const today = new Date();
    const d = new Date(s);
    const diff = Math.round((today - d) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff} days ago`;
    return this.date(s);
  }
};

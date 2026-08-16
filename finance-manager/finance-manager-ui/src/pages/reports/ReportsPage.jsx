import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie,
  Cell, Legend, LineChart, Line,
} from "recharts";
import { Calendar, TrendingUp, TrendingDown, PieChartIcon } from "lucide-react";
import { reportApi }    from "../../api/reportApi";
import { formatCurrency, shortAmount } from "../../utils/formatters";
import Spinner from "../../components/common/Spinner";

// ── palette for pie chart ─────────────────────────────────
const PIE_COLORS = [
  "#6366f1","#10b981","#f59e0b","#ef4444",
  "#8b5cf6","#06b6d4","#f97316","#14b8a6",
];

// ── helpers ───────────────────────────────────────────────
const MONTHS = [
  "Tháng 1","Tháng 2","Tháng 3","Tháng 4",
  "Tháng 5","Tháng 6","Tháng 7","Tháng 8",
  "Tháng 9","Tháng 10","Tháng 11","Tháng 12",
];

function toApiDate(year, month, day) {
  return `${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
}

// ── custom tooltips ───────────────────────────────────────
function BarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border rounded-xl shadow-lg p-3 text-xs
                    min-w-36">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-white border rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-700">{d.name}</p>
      <p style={{ color: d.payload.fill }} className="font-medium mt-1">
        {formatCurrency(d.value)}
      </p>
      <p className="text-gray-400">{d.payload.percentage}%</p>
    </div>
  );
}

function LineTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border rounded-xl shadow-lg p-3 text-xs
                    min-w-40">
      <p className="font-semibold text-gray-700 mb-2">Ngày {label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
}

// ── stat card ─────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
function StatCard({ label, value, sub, icon: Icon, color }) {
  const colors = {
    green:  "bg-green-50  text-green-700",
    red:    "bg-red-50    text-red-600",
    indigo: "bg-indigo-50 text-indigo-700",
  };
  return (
    <div className="card flex items-center gap-4">
      <div className={`p-3 rounded-xl ${colors[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-lg font-bold text-gray-900 truncate">{value}</p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}

// ── tab button ────────────────────────────────────────────
function Tab({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-lg
                  transition-colors
                  ${active
                    ? "bg-primary-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"}`}>
      {children}
    </button>
  );
}

// ── main page ─────────────────────────────────────────────
export default function ReportsPage({ toast }) {
  const now          = new Date();
  const currentYear  = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const [tab,          setTab]          = useState("monthly");
  const [year,         setYear]         = useState(currentYear);
  const [month,        setMonth]        = useState(currentMonth);
  const [monthlyData,  setMonthlyData]  = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [dailyData,    setDailyData]    = useState([]);
  const [loading,      setLoading]      = useState(false);

  const years = Array.from(
    { length: 5 },
    (_, i) => currentYear - i
  );

  // ── fetch monthly ─────────────────────────────────────
  useEffect(() => {
    if (tab !== "monthly") return;
    const run = async () => {
      setLoading(true);
      try {
        const res  = await reportApi.monthly(year);
        const data = res.data.data ?? [];
        setMonthlyData(data.map((m) => ({
          month:      m.monthName.slice(0, 3),
          fullMonth:  m.monthName,
          income:     Number(m.income),
          expense:    Number(m.expense),
          balance:    Number(m.balance),
        })));
      } catch {
        toast?.error("Không thể tải báo cáo tháng");
      } finally {
        setLoading(false);
      }
    };
    run();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, year]);

  // ── fetch category breakdown ──────────────────────────
  useEffect(() => {
    if (tab !== "category") return;
    const run = async () => {
      setLoading(true);
      try {
        const from = toApiDate(year, month, 1);
        const lastDay = new Date(year, month, 0).getDate();
        const to   = toApiDate(year, month, lastDay);
        const res  = await reportApi.categories(from, to);
        const data = res.data.data ?? [];
        setCategoryData(data.map((c, i) => ({
          name:       c.categoryName,
          value:      Number(c.total),
          percentage: c.percentage,
          fill:       PIE_COLORS[i % PIE_COLORS.length],
        })));
      } catch {
        toast?.error("Không thể tải báo cáo danh mục");
      } finally {
        setLoading(false);
      }
    };
    run();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, year, month]);

  // ── fetch daily ───────────────────────────────────────
  useEffect(() => {
    if (tab !== "daily") return;
    const run = async () => {
      setLoading(true);
      try {
        const res  = await reportApi.daily(year, month);
        const data = res.data.data ?? [];
        setDailyData(data.map((d) => ({
          day:     d.day,
          income:  Number(d.income),
          expense: Number(d.expense),
        })));
      } catch {
        toast?.error("Không thể tải báo cáo ngày");
      } finally {
        setLoading(false);
      }
    };
    run();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, year, month]);

  // ── derived stats for monthly tab ────────────────────
  const totalIncome  = monthlyData.reduce((s, m) => s + m.income,  0);
  const totalExpense = monthlyData.reduce((s, m) => s + m.expense, 0);
  const totalBalance = totalIncome - totalExpense;
  const bestMonth    = monthlyData.reduce(
    (best, m) => m.balance > (best?.balance ?? -Infinity) ? m : best,
    null
  );

  // ── derived stats for category tab ───────────────────
  const totalCategoryExpense = categoryData.reduce(
    (s, c) => s + c.value, 0
  );
  const topCategory = categoryData[0];

  // ── render ────────────────────────────────────────────
  return (
    <div className="space-y-5 max-w-5xl mx-auto">

      {/* header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Báo cáo</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Thống kê tài chính chi tiết
        </p>
      </div>

      {/* controls */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row
                        items-start sm:items-center
                        justify-between gap-4">

          {/* tabs */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            <Tab active={tab === "monthly"}
              onClick={() => setTab("monthly")}>
              📅 Theo tháng
            </Tab>
            <Tab active={tab === "category"}
              onClick={() => setTab("category")}>
              🥧 Danh mục
            </Tab>
            <Tab active={tab === "daily"}
              onClick={() => setTab("daily")}>
              📈 Theo ngày
            </Tab>
          </div>

          {/* year / month pickers */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <select value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="input w-28 text-sm">
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            {(tab === "category" || tab === "daily") && (
              <select value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="input w-36 text-sm">
                {MONTHS.map((m, i) => (
                  <option key={i + 1} value={i + 1}>{m}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* loading */}
      {loading ? (
        <Spinner size="lg" className="py-20" />
      ) : (
        <>
          {/* ── MONTHLY TAB ── */}
          {tab === "monthly" && (
            <div className="space-y-5">

              {/* stat cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                  label="Tổng thu nhập"
                  value={formatCurrency(totalIncome)}
                  sub={`Năm ${year}`}
                  icon={TrendingUp}
                  color="green" />
                <StatCard
                  label="Tổng chi tiêu"
                  value={formatCurrency(totalExpense)}
                  sub={`Năm ${year}`}
                  icon={TrendingDown}
                  color="red" />
                <StatCard
                  label="Số dư cuối năm"
                  value={formatCurrency(totalBalance)}
                  sub={bestMonth
                    ? `Tốt nhất: ${bestMonth.fullMonth}`
                    : "—"}
                  icon={PieChartIcon}
                  color="indigo" />
              </div>

              {/* bar chart */}
              <div className="card">
                <h2 className="font-semibold text-gray-900 mb-1">
                  Thu chi theo từng tháng
                </h2>
                <p className="text-xs text-gray-400 mb-5">
                  Năm {year}
                </p>
                {monthlyData.every(
                  (m) => m.income === 0 && m.expense === 0
                ) ? (
                  <div className="flex flex-col items-center
                                  justify-center py-16 text-gray-400">
                    <p className="text-4xl mb-2">📊</p>
                    <p className="text-sm">
                      Chưa có dữ liệu năm {year}
                    </p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={monthlyData} barGap={4}
                      margin={{ top: 0, right: 0,
                                left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3"
                        stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="month"
                        tick={{ fontSize: 11 }}
                        axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11 }}
                        axisLine={false} tickLine={false}
                        tickFormatter={(v) => shortAmount(v)} />
                      <Tooltip content={<BarTooltip />} />
                      <Legend
                        wrapperStyle={{ fontSize: 12,
                                        paddingTop: 12 }} />
                      <Bar dataKey="income" name="Thu nhập"
                        fill="#10b981"
                        radius={[4,4,0,0]} maxBarSize={28} />
                      <Bar dataKey="expense" name="Chi tiêu"
                        fill="#ef4444"
                        radius={[4,4,0,0]} maxBarSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* monthly table */}
              <div className="card p-0 overflow-hidden">
                <div className="px-6 py-4 border-b">
                  <h2 className="font-semibold text-gray-900">
                    Chi tiết từng tháng
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        {["Tháng","Thu nhập",
                          "Chi tiêu","Số dư"].map((h) => (
                          <th key={h}
                            className="px-4 py-3 text-left text-xs
                                       font-semibold text-gray-500
                                       uppercase tracking-wide">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {monthlyData.map((m) => (
                        <tr key={m.month}
                          className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium
                                         text-gray-700">
                            {m.fullMonth}
                          </td>
                          <td className="px-4 py-3 text-green-600
                                         font-medium">
                            {m.income > 0
                              ? formatCurrency(m.income)
                              : <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-4 py-3 text-red-500
                                         font-medium">
                            {m.expense > 0
                              ? formatCurrency(m.expense)
                              : <span className="text-gray-300">—</span>}
                          </td>
                          <td className={`px-4 py-3 font-semibold
                                          ${m.balance >= 0
                                            ? "text-green-600"
                                            : "text-red-500"}`}>
                            {m.income > 0 || m.expense > 0
                              ? formatCurrency(m.balance)
                              : <span className="text-gray-300">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── CATEGORY TAB ── */}
          {tab === "category" && (
            <div className="space-y-5">

              {/* stat cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <StatCard
                  label="Tổng chi tiêu"
                  value={formatCurrency(totalCategoryExpense)}
                  sub={`${MONTHS[month - 1]} ${year}`}
                  icon={TrendingDown}
                  color="red" />
                <StatCard
                  label="Danh mục nhiều nhất"
                  value={topCategory?.name ?? "—"}
                  sub={topCategory
                    ? `${topCategory.percentage}% tổng chi`
                    : "Chưa có dữ liệu"}
                  icon={PieChartIcon}
                  color="indigo" />
              </div>

              {categoryData.length === 0 ? (
                <div className="card flex flex-col items-center
                                justify-center py-16 text-gray-400">
                  <p className="text-4xl mb-2">🥧</p>
                  <p className="text-sm">
                    Chưa có chi tiêu trong{" "}
                    {MONTHS[month - 1]} {year}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                  {/* pie chart */}
                  <div className="card">
                    <h2 className="font-semibold text-gray-900 mb-5">
                      Biểu đồ tròn
                    </h2>
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie data={categoryData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%" cy="50%"
                          outerRadius={100}
                          innerRadius={50}
                          paddingAngle={2}>
                          {categoryData.map((c, i) => (
                            <Cell key={i} fill={c.fill} />
                          ))}
                        </Pie>
                        <Tooltip content={<PieTooltip />} />
                        <Legend
                          wrapperStyle={{ fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* category list */}
                  <div className="card">
                    <h2 className="font-semibold text-gray-900 mb-4">
                      Chi tiết danh mục
                    </h2>
                    <div className="space-y-3">
                      {categoryData.map((c, i) => (
                        <div key={i}>
                          <div className="flex justify-between
                                          text-sm mb-1">
                            <span className="font-medium
                                             text-gray-700">
                              {c.name}
                            </span>
                            <div className="text-right">
                              <span className="font-semibold
                                               text-gray-900">
                                {formatCurrency(c.value)}
                              </span>
                              <span className="text-gray-400
                                               text-xs ml-2">
                                {c.percentage}%
                              </span>
                            </div>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full
                                          overflow-hidden">
                            <div
                              className="h-full rounded-full
                                         transition-all duration-500"
                              style={{
                                width:      `${c.percentage}%`,
                                background: c.fill,
                              }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── DAILY TAB ── */}
          {tab === "daily" && (
            <div className="space-y-5">
              <div className="card">
                <h2 className="font-semibold text-gray-900 mb-1">
                  Thu chi theo ngày
                </h2>
                <p className="text-xs text-gray-400 mb-5">
                  {MONTHS[month - 1]} {year}
                </p>

                {dailyData.length === 0 ? (
                  <div className="flex flex-col items-center
                                  justify-center py-16 text-gray-400">
                    <p className="text-4xl mb-2">📈</p>
                    <p className="text-sm">
                      Chưa có dữ liệu {MONTHS[month - 1]} {year}
                    </p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dailyData}
                      margin={{ top: 0, right: 10,
                                left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3"
                        stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="day"
                        tick={{ fontSize: 11 }}
                        axisLine={false} tickLine={false}
                        label={{ value: "Ngày",
                                 position: "insideBottom",
                                 offset: -2,
                                 fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }}
                        axisLine={false} tickLine={false}
                        tickFormatter={(v) => shortAmount(v)} />
                      <Tooltip content={<LineTooltip />} />
                      <Legend
                        wrapperStyle={{ fontSize: 12,
                                        paddingTop: 12 }} />
                      <Line type="monotone"
                        dataKey="income" name="Thu nhập"
                        stroke="#10b981" strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }} />
                      <Line type="monotone"
                        dataKey="expense" name="Chi tiêu"
                        stroke="#ef4444" strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* daily table */}
              {dailyData.length > 0 && (
                <div className="card p-0 overflow-hidden">
                  <div className="px-6 py-4 border-b">
                    <h2 className="font-semibold text-gray-900">
                      Chi tiết theo ngày
                    </h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          {["Ngày","Thu nhập",
                            "Chi tiêu","Số dư"].map((h) => (
                            <th key={h}
                              className="px-4 py-3 text-left
                                         text-xs font-semibold
                                         text-gray-500 uppercase
                                         tracking-wide">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {dailyData.map((d) => {
                          const bal = d.income - d.expense;
                          return (
                            <tr key={d.day}
                              className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-medium
                                             text-gray-700">
                                Ngày {d.day}
                              </td>
                              <td className="px-4 py-3
                                             text-green-600 font-medium">
                                {d.income > 0
                                  ? formatCurrency(d.income)
                                  : <span className="text-gray-300">
                                      —
                                    </span>}
                              </td>
                              <td className="px-4 py-3
                                             text-red-500 font-medium">
                                {d.expense > 0
                                  ? formatCurrency(d.expense)
                                  : <span className="text-gray-300">
                                      —
                                    </span>}
                              </td>
                              <td className={`px-4 py-3 font-semibold
                                              ${bal >= 0
                                                ? "text-green-600"
                                                : "text-red-500"}`}>
                                {formatCurrency(bal)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
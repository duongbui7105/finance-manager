import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  TrendingUp, TrendingDown, Wallet,
  Plus, ArrowRight, RefreshCw,
} from "lucide-react";
import { transactionApi } from "../../api/transactionApi";
import { reportApi }      from "../../api/reportApi";
import { formatCurrency, formatDate, shortAmount } from "../../utils/formatters";
import Spinner from "../../components/common/Spinner";

// eslint-disable-next-line no-unused-vars
function SummaryCard({ label, amount, icon: Icon, color, trend }) {
  const colors = {
    indigo: {
      bg:   "bg-indigo-50",
      icon: "bg-indigo-600",
      text: "text-indigo-700",
    },
    green: {
      bg:   "bg-green-50",
      icon: "bg-green-600",
      text: "text-green-700",
    },
    red: {
      bg:   "bg-red-50",
      icon: "bg-red-500",
      text: "text-red-600",
    },
  };
  const c = colors[color];

  return (
    <div className={`rounded-2xl p-5 ${c.bg} flex items-center gap-4`}>
      <div className={`${c.icon} p-3 rounded-xl shrink-0`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className={`text-xl font-bold truncate ${c.text}`}>
          {formatCurrency(amount)}
        </p>
        {trend !== undefined && (
          <p className="text-xs text-gray-400 mt-0.5">{trend}</p>
        )}
      </div>
    </div>
  );
}

function TransactionRow({ tx }) {
  const isIncome = tx.type === "INCOME";
  return (
    <div className="flex items-center gap-3 py-3
                    border-b last:border-0 border-gray-50">
      <div className={`h-9 w-9 rounded-xl flex items-center justify-center
                       text-base shrink-0
                       ${isIncome ? "bg-green-50" : "bg-red-50"}`}>
        {tx.categoryIcon ?? (isIncome ? "💰" : "💸")}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">
          {tx.note || tx.categoryName || "Giao dịch"}
        </p>
        <p className="text-xs text-gray-400">{formatDate(tx.date)}</p>
      </div>
      <p className={`text-sm font-semibold shrink-0
                     ${isIncome ? "text-green-600" : "text-red-500"}`}>
        {isIncome ? "+" : "-"}{formatCurrency(tx.amount)}
      </p>
    </div>
  );
}

// custom recharts tooltip
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">
          {p.name}: {shortAmount(p.value)}₫
        </p>
      ))}
    </div>
  );
}

// ── main page ────────────────────────────────────────────

export default function DashboardPage({ toast }) {
  const navigate = useNavigate();
  const year     = new Date().getFullYear();

  const [summary,      setSummary]      = useState(null);
  const [recent,       setRecent]       = useState([]);
  const [monthlyData,  setMonthlyData]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);

const loadAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else         setRefreshing(true);
    try {
      const [summaryRes, recentRes, monthlyRes] = await Promise.all([
        transactionApi.summary(),
        transactionApi.getAll({ page: 0, size: 6, sort: "date,desc" }),
        reportApi.monthly(year),
      ]);

      const summaryData  = summaryRes.data.data;
      const recentData   = recentRes.data.data.content ?? [];
      const shaped       = (monthlyRes.data.data ?? []).map((m) => ({
        month:       m.monthName.slice(0, 3),
        "Thu nhập":  Number(m.income),
        "Chi tiêu":  Number(m.expense),
      }));

      setSummary(summaryData);
      setRecent(recentData);
      setMonthlyData(shaped);
    } catch {
      toast?.error("Không thể tải dữ liệu dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [year, toast]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      await loadAll();
    };
    if (!cancelled) run();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const balance = Number(summary?.balance  ?? 0);
  const income  = Number(summary?.totalIncome  ?? 0);
  const expense = Number(summary?.totalExpense ?? 0);
  const savingsRate = income > 0
    ? Math.round(((income - expense) / income) * 100)
    : 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      {/* ── header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Tổng quan tài chính của bạn
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => loadAll(true)} disabled={refreshing}
            className="btn-secondary flex items-center gap-2 text-sm">
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Làm mới
          </button>
          <button onClick={() => navigate("/transactions")}
            className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="h-4 w-4" />
            Thêm giao dịch
          </button>
        </div>
      </div>

      {/* ── summary cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          label="Số dư hiện tại"
          amount={balance}
          icon={Wallet}
          color="indigo"
          trend={`Tỷ lệ tiết kiệm: ${savingsRate}%`}
        />
        <SummaryCard
          label="Tổng thu nhập"
          amount={income}
          icon={TrendingUp}
          color="green"
        />
        <SummaryCard
          label="Tổng chi tiêu"
          amount={expense}
          icon={TrendingDown}
          color="red"
        />
      </div>

      {/* ── chart + recent ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* monthly chart — takes 3 cols */}
        <div className="card lg:col-span-3">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold text-gray-900">
                Thu chi theo tháng
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">Năm {year}</p>
            </div>
          </div>

          {monthlyData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48
                            text-gray-400">
              <p className="text-4xl mb-2">📊</p>
              <p className="text-sm">Chưa có dữ liệu năm {year}</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyData} barGap={4}
                margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3"
                               stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }}
                       axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false}
                       tickLine={false}
                       tickFormatter={(v) => shortAmount(v)} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Bar dataKey="Thu nhập" fill="#10b981"
                     radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="Chi tiêu" fill="#ef4444"
                     radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* recent transactions — takes 2 cols */}
        <div className="card lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">
              Giao dịch gần đây
            </h2>
            <button onClick={() => navigate("/transactions")}
              className="text-xs text-primary-600 hover:text-primary-700
                         flex items-center gap-1 font-medium">
              Xem tất cả
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center
                            flex-1 text-gray-400 py-8">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-sm text-center">
                Chưa có giao dịch nào
              </p>
              <button onClick={() => navigate("/transactions")}
                className="mt-3 btn-primary text-xs px-3 py-1.5">
                Thêm ngay
              </button>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {recent.map((tx) => (
                <TransactionRow key={tx.id} tx={tx} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── quick stats row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Tỷ lệ tiết kiệm",
            value: `${savingsRate}%`,
            sub:   savingsRate >= 20 ? "Tốt" : "Cần cải thiện",
            good:  savingsRate >= 20,
          },
          {
            label: "Chi tiêu / Thu nhập",
            value: income > 0
              ? `${Math.round((expense / income) * 100)}%`
              : "—",
            sub:   "Tỷ lệ chi",
            good:  income > 0 && expense / income <= 0.8,
          },
          {
            label: "Giao dịch gần đây",
            value: recent.length,
            sub:   "6 giao dịch mới nhất",
            good:  true,
          },
          {
            label: "Năm hiện tại",
            value: year,
            sub:   `Tháng ${new Date().getMonth() + 1}`,
            good:  true,
          },
        ].map((stat) => (
          <div key={stat.label}
            className="card flex flex-col gap-1 hover:shadow-md
                       transition-shadow">
            <p className="text-xs text-gray-400 font-medium">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className={`text-xs font-medium
                           ${stat.good
                             ? "text-green-600"
                             : "text-amber-500"}`}>
              {stat.sub}
            </p>
          </div>
        ))}
      </div>

    </div>
  );
}
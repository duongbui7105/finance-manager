// format number as Vietnamese currency
export const formatCurrency = (amount) =>
  new Intl.NumberFormat("vi-VN", {
    style:    "currency",
    currency: "VND",
  }).format(amount ?? 0);

// format date to dd/MM/yyyy
export const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
};

// format date to yyyy-MM-dd for API
export const toApiDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  return d.toISOString().split("T")[0];
};

// get current year-month boundaries
export const currentMonthRange = () => {
  const now  = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to   = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { from: toApiDate(from), to: toApiDate(to) };
};

// short number for display (e.g. 1.5M, 300K)
export const shortAmount = (amount) => {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000)     return `${(amount / 1_000).toFixed(0)}K`;
  return `${amount}`;
};
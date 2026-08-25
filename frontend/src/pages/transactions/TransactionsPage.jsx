import { useState, useEffect, useCallback } from "react";
import {
  Plus, Search, Filter, Pencil,
  Trash2, ChevronLeft, ChevronRight, X, Sparkles,
} from "lucide-react";
import { transactionApi, categoryApi } from "../../api/transactionApi";
import { aiApi } from "../../api/aiApi";
import { formatCurrency, formatDate }  from "../../utils/formatters";
import Modal      from "../../components/common/Modal";
import Spinner    from "../../components/common/Spinner";
import EmptyState from "../../components/common/EmptyState";

// ── constants ─────────────────────────────────────────────
const TYPE_COLORS = {
  INCOME:  "bg-green-50 text-green-700 border-green-200",
  EXPENSE: "bg-red-50  text-red-600   border-red-200",
};
const TYPE_LABELS = { INCOME: "Thu nhập", EXPENSE: "Chi tiêu" };
const EMPTY_FORM  = {
  amount: "", type: "EXPENSE", date: "", note: "", categoryId: "",
};

// ── TransactionForm ───────────────────────────────────────
function TransactionForm({
  initial, onSubmit, onCancel, loading, categories = [],
}) {
  const [form,   setForm]   = useState(initial ?? EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [suggestLoading, setSuggestLoading] = useState(false);

  // Auto-suggest category when note changes
  useEffect(() => {
    if (!form.note || form.note.length < 3) {
      setAiSuggestion(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSuggestLoading(true);
        const res = await aiApi.categorize(form.note, form.amount);
        const suggestedName = res.data?.data?.suggestedCategory;
        if (suggestedName) {
          const matchedCat = categories.find(
            (c) => c.name.toLowerCase() === suggestedName.toLowerCase()
          );
          if (matchedCat && matchedCat.id !== Number(form.categoryId)) {
            setAiSuggestion(matchedCat);
          } else {
            setAiSuggestion(null);
          }
        }
      } catch (err) {
        console.error("AI categorize failed:", err);
      } finally {
        setSuggestLoading(false);
      }
    }, 800); // Debounce 800ms

    return () => clearTimeout(timer);
  }, [form.note, form.amount, categories, form.categoryId]);

  const validate = () => {
    const e = {};
    if (!form.amount || Number(form.amount) <= 0)
      e.amount = "Số tiền phải lớn hơn 0";
    if (!form.date)
      e.date = "Ngày là bắt buộc";
    if (!form.categoryId)
      e.categoryId = "Vui lòng chọn danh mục";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: null }));
  };

  const applySuggestion = () => {
    if (aiSuggestion) {
      setForm((p) => ({ ...p, categoryId: String(aiSuggestion.id) }));
      setAiSuggestion(null);
      if (errors.categoryId) setErrors((p) => ({ ...p, categoryId: null }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      amount:     Number(form.amount),
      type:       form.type,
      date:       form.date,
      note:       form.note,
      categoryId: Number(form.categoryId),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>

      {/* type toggle */}
      <div>
        <label className="label">Loại giao dịch</label>
        <div className="grid grid-cols-2 gap-2">
          {["EXPENSE", "INCOME"].map((t) => (
            <button key={t} type="button"
              onClick={() => setForm((p) => ({ ...p, type: t }))}
              className={`py-2 rounded-lg border text-sm font-medium
                          transition-colors
                          ${form.type === t
                            ? t === "INCOME"
                              ? "bg-green-500 text-white border-green-500"
                              : "bg-red-500 text-white border-red-500"
                            : "bg-white text-gray-600 border-gray-200\
                               hover:bg-gray-50"}`}>
              {t === "INCOME" ? "💰 Thu nhập" : "💸 Chi tiêu"}
            </button>
          ))}
        </div>
      </div>

      {/* amount */}
      <div>
        <label className="label">Số tiền (VND)</label>
        <input type="number" min="1" value={form.amount}
          onChange={handleChange("amount")}
          placeholder="0"
          className={`input ${errors.amount
            ? "border-red-400 focus:ring-red-400" : ""}`} />
        {errors.amount && (
          <p className="text-red-500 text-xs mt-1">{errors.amount}</p>
        )}
      </div>

      {/* date */}
      <div>
        <label className="label">Ngày</label>
        <input type="date" value={form.date}
          onChange={handleChange("date")}
          className={`input ${errors.date
            ? "border-red-400 focus:ring-red-400" : ""}`} />
        {errors.date && (
          <p className="text-red-500 text-xs mt-1">{errors.date}</p>
        )}
      </div>

      {/* category */}
      <div>
        <label className="label">Danh mục</label>
        {categories.length === 0 ? (
          <div className="input flex items-center gap-2 text-gray-400">
            <span className="h-3 w-3 border-2 border-gray-300
                             border-t-gray-500 rounded-full animate-spin" />
            Đang tải danh mục...
          </div>
        ) : (
          <select value={form.categoryId}
            onChange={handleChange("categoryId")}
            className={`input ${errors.categoryId
              ? "border-red-400 focus:ring-red-400" : ""}`}>
            <option value="">-- Chọn danh mục --</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon ?? ""} {c.name}
              </option>
            ))}
          </select>
        )}
        {errors.categoryId && (
          <p className="text-red-500 text-xs mt-1">{errors.categoryId}</p>
        )}
        
        {/* AI Suggestion */}
        {suggestLoading && (
          <div className="mt-2 flex items-center gap-2 text-xs text-blue-600">
            <Sparkles className="w-3 h-3 animate-pulse" />
            <span>AI đang phân tích...</span>
          </div>
        )}
        {aiSuggestion && !suggestLoading && (
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span className="text-gray-700">
                  AI gợi ý: <strong>{aiSuggestion.icon} {aiSuggestion.name}</strong>
                </span>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={applySuggestion}
                  className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded transition-colors"
                >
                  Áp dụng
                </button>
                <button
                  type="button"
                  onClick={() => setAiSuggestion(null)}
                  className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* note */}
      <div>
        <label className="label">Ghi chú (tuỳ chọn)</label>
        <input type="text" value={form.note}
          onChange={handleChange("note")}
          placeholder="Ví dụ: Ăn trưa với bạn bè"
          className="input" />
      </div>

      {/* actions */}
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel}
          className="btn-secondary flex-1">
          Huỷ
        </button>
        <button type="submit" disabled={loading || categories.length === 0}
          className="btn-primary flex-1 flex items-center
                     justify-center gap-2">
          {loading
            ? <><span className="h-4 w-4 border-2 border-white/30
                                  border-t-white rounded-full animate-spin" />
               Đang lưu...</>
            : "Lưu giao dịch"}
        </button>
      </div>
    </form>
  );
}

// ── DeleteConfirm ─────────────────────────────────────────
function DeleteConfirm({ tx, onConfirm, onCancel, loading }) {
  return (
    <div className="text-center space-y-4">
      <div className="text-5xl">🗑️</div>
      <div>
        <p className="font-semibold text-gray-800">Xoá giao dịch này?</p>
        <p className="text-sm text-gray-500 mt-1">
          {tx?.note || tx?.categoryName || "Giao dịch"} —{" "}
          <span className={
            tx?.type === "INCOME" ? "text-green-600" : "text-red-500"
          }>
            {formatCurrency(tx?.amount)}
          </span>
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Hành động này không thể hoàn tác.
        </p>
      </div>
      <div className="flex gap-3">
        <button onClick={onCancel} className="btn-secondary flex-1">
          Huỷ
        </button>
        <button onClick={onConfirm} disabled={loading}
          className="btn-danger flex-1 flex items-center
                     justify-center gap-2">
          {loading
            ? <span className="h-4 w-4 border-2 border-white/30
                               border-t-white rounded-full animate-spin" />
            : "Xoá"}
        </button>
      </div>
    </div>
  );
}

// ── main page ─────────────────────────────────────────────
export default function TransactionsPage({ toast }) {
  const [transactions, setTransactions] = useState([]);
  const [categories,   setCategories]   = useState([]);
  const [totalPages,   setTotalPages]   = useState(0);
  const [totalItems,   setTotalItems]   = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);

  // filters
  const [page,        setPage]        = useState(0);
  const [search,      setSearch]      = useState("");
  const [typeFilter,  setTypeFilter]  = useState("");
  const [searchInput, setSearchInput] = useState("");

  // modals
  const [showAdd,  setShowAdd]  = useState(false);
  const [editTx,   setEditTx]   = useState(null);
  const [deleteTx, setDeleteTx] = useState(null);

  const SIZE = 10;

  // ── load categories once ──────────────────────────────
 useEffect(() => {
  const loadCategories = async () => {
    console.log("1. Starting category fetch...");
    try {
      const res = await categoryApi.getAll();

      console.log("2. Raw response:", res);
      console.log("3. res.data:", res.data);
      console.log("4. res.data.data:", res.data.data);

      const cats = res.data.data ?? [];

      console.log("5. Final categories array:", cats);

      setCategories(cats);
    } catch (err) {
      console.error("6. Category fetch FAILED:", err.response ?? err);
    }
  };

  loadCategories();
}, []);

  // ── fetch transactions ────────────────────────────────
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (search) {
        res = await transactionApi.search({
          keyword: search, page, size: SIZE, sort: "date,desc",
        });
      } else {
        res = await transactionApi.getAll({
          page,
          size: SIZE,
          sort: "date,desc",
          ...(typeFilter && { type: typeFilter }),
        });
      }
      const data = res.data.data;
      setTransactions(data.content      ?? []);
      setTotalPages(data.totalPages     ?? 0);
      setTotalItems(data.totalElements  ?? 0);
    } catch {
      toast?.error("Không thể tải danh sách giao dịch");
    } finally {
      setLoading(false);
    }
  }, [page, search, typeFilter, toast]);

  useEffect(() => {
    const run = async () => { await fetchTransactions(); };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, typeFilter]);

  // reset to page 0 when filters change
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setPage(0); }, [search, typeFilter]);

  // ── handlers ─────────────────────────────────────────
  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearch("");
  };

  const handleAdd = async (data) => {
    setSaving(true);
    try {
      await transactionApi.create(data);
      toast?.success("Thêm giao dịch thành công!");
      setShowAdd(false);
      fetchTransactions();
    } catch (err) {
      console.error("Add error:", err.response);
      toast?.error(
        err.response?.data?.message || "Thêm giao dịch thất bại"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (data) => {
    setSaving(true);
    try {
      await transactionApi.update(editTx.id, data);
      toast?.success("Cập nhật thành công!");
      setEditTx(null);
      fetchTransactions();
    } catch (err) {
      console.error("Edit error:", err.response);
      toast?.error(
        err.response?.data?.message || "Cập nhật thất bại"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await transactionApi.remove(deleteTx.id);
      toast?.success("Đã xoá giao dịch!");
      setDeleteTx(null);
      fetchTransactions();
    } catch (err) {
      console.error("Delete error:", err.response);
      toast?.error(
        err.response?.data?.message || "Xoá thất bại"
      );
    } finally {
      setSaving(false);
    }
  };

  // build initial values for edit form
  const editInitial = editTx ? {
    amount:     String(editTx.amount),
    type:       editTx.type,
    date:       editTx.date,
    note:       editTx.note ?? "",
    categoryId: String(
      categories.find((c) => c.name === editTx.categoryName)?.id ?? ""
    ),
  } : null;

  // ── render ────────────────────────────────────────────
  return (
    <div className="space-y-5 max-w-5xl mx-auto">

      {/* header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Giao dịch</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {totalItems > 0
              ? `${totalItems} giao dịch`
              : "Quản lý thu chi"}
          </p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="h-4 w-4" />
          Thêm giao dịch
        </button>
      </div>

      {/* search + filter bar */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">

          {/* search */}
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2
                                  h-4 w-4 text-gray-400 pointer-events-none" />
              <input value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Tìm kiếm ghi chú..."
                className="input pl-9 pr-8" />
              {searchInput && (
                <button type="button" onClick={clearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2
                             text-gray-400 hover:text-gray-600">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <button type="submit" className="btn-secondary px-3">
              <Search className="h-4 w-4" />
            </button>
          </form>

          {/* type filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400 shrink-0" />
            <select value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input w-36">
              <option value="">Tất cả</option>
              <option value="INCOME">Thu nhập</option>
              <option value="EXPENSE">Chi tiêu</option>
            </select>
          </div>
        </div>

        {/* active filter pills */}
        {(search || typeFilter) && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {search && (
              <span className="inline-flex items-center gap-1 px-2 py-1
                               bg-primary-50 text-primary-700
                               rounded-lg text-xs">
                Tìm: "{search}"
                <button onClick={clearSearch}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {typeFilter && (
              <span className="inline-flex items-center gap-1 px-2 py-1
                               bg-primary-50 text-primary-700
                               rounded-lg text-xs">
                {TYPE_LABELS[typeFilter]}
                <button onClick={() => setTypeFilter("")}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <Spinner size="lg" className="py-16" />
        ) : transactions.length === 0 ? (
          <EmptyState
            icon="📭"
            title="Không có giao dịch nào"
            description={
              search || typeFilter
                ? "Thử thay đổi bộ lọc để tìm giao dịch"
                : "Bắt đầu bằng cách thêm giao dịch đầu tiên"
            }
            action={
              !search && !typeFilter
                ? (
                  <button onClick={() => setShowAdd(true)}
                    className="btn-primary text-sm">
                    Thêm giao dịch
                  </button>
                )
                : null
            }
          />
        ) : (
          <>
            {/* desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    {["Ngày","Danh mục","Ghi chú",
                      "Loại","Số tiền",""].map((h) => (
                      <th key={h}
                        className="px-4 py-3 text-left text-xs font-semibold
                                   text-gray-500 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {transactions.map((tx) => (
                    <tr key={tx.id}
                      className="hover:bg-gray-50 transition-colors group">
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {formatDate(tx.date)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-2">
                          <span className="text-lg">
                            {tx.categoryIcon ?? "📦"}
                          </span>
                          <span className="text-gray-700 font-medium">
                            {tx.categoryName ?? "—"}
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600
                                     max-w-xs truncate">
                        {tx.note || (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full
                                         text-xs font-medium border
                                         ${TYPE_COLORS[tx.type]}`}>
                          {TYPE_LABELS[tx.type]}
                        </span>
                      </td>
                      <td className={`px-4 py-3 font-semibold
                                      whitespace-nowrap
                                      ${tx.type === "INCOME"
                                        ? "text-green-600"
                                        : "text-red-500"}`}>
                        {tx.type === "INCOME" ? "+" : "-"}
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1
                                        opacity-0 group-hover:opacity-100
                                        transition-opacity">
                          <button onClick={() => setEditTx(tx)}
                            className="p-1.5 rounded-lg text-gray-400
                                       hover:text-primary-600
                                       hover:bg-primary-50
                                       transition-colors">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setDeleteTx(tx)}
                            className="p-1.5 rounded-lg text-gray-400
                                       hover:text-red-500 hover:bg-red-50
                                       transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* mobile cards */}
            <div className="sm:hidden divide-y">
              {transactions.map((tx) => (
                <div key={tx.id}
                  className="p-4 flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center
                                   justify-center text-xl shrink-0
                                   ${tx.type === "INCOME"
                                     ? "bg-green-50"
                                     : "bg-red-50"}`}>
                    {tx.categoryIcon ?? "📦"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">
                      {tx.note || tx.categoryName}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDate(tx.date)} · {tx.categoryName}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-semibold text-sm
                                   ${tx.type === "INCOME"
                                     ? "text-green-600"
                                     : "text-red-500"}`}>
                      {tx.type === "INCOME" ? "+" : "-"}
                      {formatCurrency(tx.amount)}
                    </p>
                    <div className="flex gap-1 mt-1 justify-end">
                      <button onClick={() => setEditTx(tx)}
                        className="p-1 text-gray-400
                                   hover:text-primary-600">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setDeleteTx(tx)}
                        className="p-1 text-gray-400
                                   hover:text-red-500">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between
                              px-4 py-3 border-t bg-gray-50">
                <p className="text-xs text-gray-500">
                  Trang {page + 1} / {totalPages}
                </p>
                <div className="flex gap-1">
                  <button onClick={() => setPage((p) => p - 1)}
                    disabled={page === 0}
                    className="p-1.5 rounded-lg border text-gray-500
                               hover:bg-white disabled:opacity-40
                               disabled:cursor-not-allowed
                               transition-colors">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {Array.from(
                    { length: Math.min(5, totalPages) },
                    (_, i) => {
                      const pageNum = Math.max(
                        0,
                        Math.min(page - 2, totalPages - 5)
                      ) + i;
                      return (
                        <button key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`px-3 py-1 rounded-lg text-xs
                                      font-medium border transition-colors
                                      ${pageNum === page
                                        ? "bg-primary-600 text-white\
                                           border-primary-600"
                                        : "text-gray-600 hover:bg-white"
                                      }`}>
                          {pageNum + 1}
                        </button>
                      );
                    }
                  )}
                  <button onClick={() => setPage((p) => p + 1)}
                    disabled={page >= totalPages - 1}
                    className="p-1.5 rounded-lg border text-gray-500
                               hover:bg-white disabled:opacity-40
                               disabled:cursor-not-allowed
                               transition-colors">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* add modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)}
        title="Thêm giao dịch mới">
        <TransactionForm
          categories={categories}
          onSubmit={handleAdd}
          onCancel={() => setShowAdd(false)}
          loading={saving} />
      </Modal>

      {/* edit modal */}
      <Modal isOpen={!!editTx} onClose={() => setEditTx(null)}
        title="Chỉnh sửa giao dịch">
        {editTx && (
          <TransactionForm
            categories={categories}
            initial={editInitial}
            onSubmit={handleEdit}
            onCancel={() => setEditTx(null)}
            loading={saving} />
        )}
      </Modal>

      {/* delete modal */}
      <Modal isOpen={!!deleteTx} onClose={() => setDeleteTx(null)}
        title="Xác nhận xoá" size="sm">
        {deleteTx && (
          <DeleteConfirm
            tx={deleteTx}
            onConfirm={handleDelete}
            onCancel={() => setDeleteTx(null)}
            loading={saving} />
        )}
      </Modal>

    </div>
  );
}
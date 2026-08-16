import { useState, useRef } from "react";
import {
  Zap, Upload, Send, Check, X,
  Trash2, RefreshCw, ImageIcon,
} from "lucide-react";
import { aiApi }          from "../../api/aiApi";
import { transactionApi, categoryApi } from "../../api/transactionApi";
import { formatCurrency } from "../../utils/formatters";
import Spinner            from "../../components/common/Spinner";
import { useEffect } from "react";

// ── ParsedCard ────────────────────────────────────────────
function ParsedCard({ tx, index, categories, onRemove, onChange }) {
  const cat = categories.find(
    (c) => c.name.toLowerCase() === tx.category?.toLowerCase()
  );

  return (
    <div className={`card border-l-4 ${
      tx.type === "INCOME"
        ? "border-l-green-500"
        : "border-l-red-400"
    } relative group`}>

      <button onClick={() => onRemove(index)}
        className="absolute top-3 right-3 p-1 rounded-lg
                   text-gray-300 hover:text-red-500
                   hover:bg-red-50 opacity-0 group-hover:opacity-100
                   transition-all">
        <X className="h-4 w-4" />
      </button>

      <div className="grid grid-cols-2 gap-3">

        {/* description */}
        <div className="col-span-2">
          <label className="label">Mô tả</label>
          <input value={tx.description ?? ""}
            onChange={(e) => onChange(index, "description", e.target.value)}
            className="input text-sm" />
        </div>

        {/* amount */}
        <div>
          <label className="label">Số tiền</label>
          <input type="number" value={tx.amount ?? ""}
            onChange={(e) => onChange(index, "amount",
              Number(e.target.value))}
            className="input text-sm" />
        </div>

        {/* date */}
        <div>
          <label className="label">Ngày</label>
          <input type="date" value={tx.date ?? ""}
            onChange={(e) => onChange(index, "date", e.target.value)}
            className="input text-sm" />
        </div>

        {/* type */}
        <div>
          <label className="label">Loại</label>
          <select value={tx.type ?? "EXPENSE"}
            onChange={(e) => onChange(index, "type", e.target.value)}
            className="input text-sm">
            <option value="EXPENSE">💸 Chi tiêu</option>
            <option value="INCOME">💰 Thu nhập</option>
          </select>
        </div>

        {/* category */}
        <div>
          <label className="label">Danh mục</label>
          <select
            value={cat?.id ?? ""}
            onChange={(e) => onChange(index, "_categoryId",
              Number(e.target.value))}
            className="input text-sm">
            <option value="">-- Chọn --</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon ?? ""} {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* note */}
        <div className="col-span-2">
          <label className="label">Ghi chú</label>
          <input value={tx.note ?? ""}
            onChange={(e) => onChange(index, "note", e.target.value)}
            className="input text-sm" placeholder="Tuỳ chọn" />
        </div>
      </div>

      {/* amount badge */}
      <div className={`mt-3 text-right font-bold text-lg
                       ${tx.type === "INCOME"
                         ? "text-green-600"
                         : "text-red-500"}`}>
        {tx.type === "INCOME" ? "+" : "-"}
        {formatCurrency(tx.amount)}
      </div>
    </div>
  );
}

// ── main page ─────────────────────────────────────────────
export default function SmartInputPage({ toast }) {
  const [mode,         setMode]         = useState("text");
  const [text,         setText]         = useState("");
  const [imageFile,    setImageFile]    = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [parsed,       setParsed]       = useState([]);
  const [categories,   setCategories]   = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [done,         setDone]         = useState(false);
  const fileRef = useRef(null);

  // load categories
  useEffect(() => {
    const load = async () => {
      try {
        const res  = await categoryApi.getAll();
        const cats = res.data.data ?? res.data ?? [];
        setCategories(Array.isArray(cats) ? cats : []);
      } catch {
        toast?.error("Không thể tải danh mục");
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── handle image pick ──────────────────────────────────
  const handleImagePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
    setDone(false);
    setParsed([]);
  };

  // ── analyse text ───────────────────────────────────────
  const analyseText = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setDone(false);
    try {
      const res  = await aiApi.smartInput(text);
      const data = res.data.data;
      setParsed(enrichWithCategoryId(data.transactions));
      if (data.count === 0) {
        toast?.error("Không tìm thấy giao dịch nào trong văn bản");
      }
    } catch (err) {
      toast?.error(err.response?.data?.message
        ?? "Phân tích thất bại");
    } finally {
      setLoading(false);
    }
  };

  // ── scan receipt ───────────────────────────────────────
  const scanReceipt = async () => {
    if (!imageFile) return;
    setLoading(true);
    setDone(false);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const dataUrl   = ev.target.result;
        const base64    = dataUrl.split(",")[1];
        const mimeType  = imageFile.type || "image/jpeg";
        try {
          const res  = await aiApi.scanReceipt(base64, mimeType);
          const data = res.data.data;
          setParsed(enrichWithCategoryId(data.transactions));
          if (data.count === 0) {
            toast?.error("Không tìm thấy mặt hàng nào trong ảnh");
          }
        } catch (err) {
          toast?.error(err.response?.data?.message
            ?? "Quét hóa đơn thất bại");
        } finally {
          setLoading(false);
        }
      };
      reader.readAsDataURL(imageFile);
    } catch {
      setLoading(false);
      toast?.error("Không thể đọc file ảnh");
    }
  };

  // map category name → id
  const enrichWithCategoryId = (transactions) =>
    (transactions ?? []).map((tx) => {
      const cat = categories.find(
        (c) => c.name.toLowerCase() ===
               (tx.category ?? "").toLowerCase()
      );
      return { ...tx, _categoryId: cat?.id ?? null };
    });

  // ── edit parsed item ───────────────────────────────────
  const handleChange = (index, field, value) => {
    setParsed((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemove = (index) => {
    setParsed((prev) => prev.filter((_, i) => i !== index));
  };

  // ── save all ───────────────────────────────────────────
  const saveAll = async () => {
    if (parsed.length === 0) return;

    // validate
    const invalid = parsed.filter(
      (tx) => !tx.amount || !tx.date || !tx._categoryId
    );
    if (invalid.length > 0) {
      toast?.error(
        "Vui lòng điền đầy đủ số tiền, ngày và danh mục"
      );
      return;
    }

    setSaving(true);
    try {
      const requests = parsed.map((tx) => ({
        amount:     Number(tx.amount),
        type:       tx.type || "EXPENSE",
        date:       tx.date,
        note:       tx.description || tx.note || "",
        categoryId: tx._categoryId,
      }));

      await transactionApi.batch(requests);
      toast?.success(
        `Đã lưu ${parsed.length} giao dịch thành công!`
      );
      setDone(true);
      setParsed([]);
      setText("");
      setImageFile(null);
      setImagePreview(null);
    } catch (err) {
      toast?.error(
        err.response?.data?.message ?? "Lưu thất bại"
      );
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setParsed([]);
    setText("");
    setImageFile(null);
    setImagePreview(null);
    setDone(false);
  };

  // ── render ─────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="bg-primary-600 p-2.5 rounded-xl">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Nhập thông minh
          </h1>
        </div>
        <p className="text-sm text-gray-500">
          Nhập tự nhiên hoặc chụp hóa đơn — AI tự động
          tạo giao dịch
        </p>
      </div>

      {/* mode toggle */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl
                      w-fit">
        <button onClick={() => { setMode("text"); reset(); }}
          className={`flex items-center gap-2 px-4 py-2 text-sm
                      font-medium rounded-lg transition-colors
                      ${mode === "text"
                        ? "bg-white text-primary-700 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"}`}>
          <Send className="h-4 w-4" />
          Nhập văn bản
        </button>
        <button onClick={() => { setMode("image"); reset(); }}
          className={`flex items-center gap-2 px-4 py-2 text-sm
                      font-medium rounded-lg transition-colors
                      ${mode === "image"
                        ? "bg-white text-primary-700 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"}`}>
          <ImageIcon className="h-4 w-4" />
          Quét hóa đơn
        </button>
      </div>

      {/* ── TEXT MODE ── */}
      {mode === "text" && (
        <div className="card space-y-4">
          <div>
            <label className="label">
              Mô tả chi tiêu / thu nhập của bạn
            </label>
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setDone(false);
                if (parsed.length > 0) setParsed([]);
              }}
              placeholder={
                "Ví dụ:\n" +
                "Hôm nay ăn phở 40k, uống trà sữa 35k, " +
                "đổ xăng 100k\n" +
                "Nhận lương tháng 5: 15 triệu\n" +
                "Mua sách lập trình 250k và cafe 45k"
              }
              rows={4}
              className="input resize-none text-sm leading-relaxed"
            />
            <p className="text-xs text-gray-400 mt-1">
              Hỗ trợ: "40k", "1.5tr", "30,000 VND", nhiều
              giao dịch cùng lúc
            </p>
          </div>

          <button onClick={analyseText}
            disabled={!text.trim() || loading}
            className="btn-primary w-full flex items-center
                       justify-center gap-2">
            {loading
              ? <><RefreshCw className="h-4 w-4 animate-spin" />
                 Đang phân tích...</>
              : <><Zap className="h-4 w-4" />
                 Phân tích với AI</>}
          </button>
        </div>
      )}

      {/* ── IMAGE MODE ── */}
      {mode === "image" && (
        <div className="card space-y-4">
          <div>
            <label className="label">
              Tải ảnh hóa đơn / biên lai
            </label>

            {/* drop zone */}
            <div
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl
                          flex flex-col items-center justify-center
                          cursor-pointer transition-colors min-h-40
                          ${imagePreview
                            ? "border-primary-300 bg-primary-50"
                            : "border-gray-200 hover:border-primary-300\
                               hover:bg-gray-50"}`}>
              {imagePreview ? (
                <img src={imagePreview} alt="Receipt preview"
                  className="max-h-64 rounded-lg object-contain" />
              ) : (
                <>
                  <Upload className="h-10 w-10 text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500 font-medium">
                    Click để chọn ảnh
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    JPG, PNG — tối đa 10MB
                  </p>
                </>
              )}
            </div>

            <input ref={fileRef} type="file"
              accept="image/*" className="hidden"
              onChange={handleImagePick} />
          </div>

          {imageFile && (
            <p className="text-xs text-gray-500">
              📎 {imageFile.name} ({
                (imageFile.size / 1024).toFixed(0)
              } KB)
            </p>
          )}

          <button onClick={scanReceipt}
            disabled={!imageFile || loading}
            className="btn-primary w-full flex items-center
                       justify-center gap-2">
            {loading
              ? <><RefreshCw className="h-4 w-4 animate-spin" />
                 Đang quét hóa đơn...</>
              : <><ImageIcon className="h-4 w-4" />
                 Quét với AI</>}
          </button>
        </div>
      )}

      {/* loading state */}
      {loading && (
        <div className="card flex flex-col items-center py-10">
          <Spinner size="lg" className="mb-4" />
          <p className="text-sm font-medium text-gray-700">
            AI đang phân tích...
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Thường mất 3–8 giây
          </p>
        </div>
      )}

      {/* success state */}
      {done && (
        <div className="card flex flex-col items-center py-10
                        border-green-200 bg-green-50">
          <div className="h-14 w-14 rounded-full bg-green-500
                          flex items-center justify-center mb-4">
            <Check className="h-7 w-7 text-white" />
          </div>
          <p className="text-lg font-semibold text-green-800">
            Đã lưu thành công!
          </p>
          <button onClick={reset}
            className="mt-4 btn-secondary text-sm">
            Nhập tiếp
          </button>
        </div>
      )}

      {/* parsed results */}
      {!loading && !done && parsed.length > 0 && (
        <div className="space-y-4">

          {/* summary bar */}
          <div className="flex items-center justify-between
                          bg-primary-50 border border-primary-200
                          rounded-xl px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-primary-800">
                Tìm thấy {parsed.length} giao dịch
              </p>
              <p className="text-xs text-primary-600 mt-0.5">
                Kiểm tra và chỉnh sửa trước khi lưu
              </p>
            </div>
            <button onClick={reset}
              className="text-xs text-gray-400 hover:text-red-500
                         flex items-center gap-1">
              <Trash2 className="h-3.5 w-3.5" />
              Xoá tất cả
            </button>
          </div>

          {/* parsed cards */}
          <div className="space-y-3">
            {parsed.map((tx, i) => (
              <ParsedCard key={i} index={i} tx={tx}
                categories={categories}
                onRemove={handleRemove}
                onChange={handleChange} />
            ))}
          </div>

          {/* total */}
          <div className="card bg-gray-50">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">
                Tổng chi tiêu
              </span>
              <span className="font-semibold text-red-500">
                -{formatCurrency(
                  parsed
                    .filter((t) => t.type === "EXPENSE")
                    .reduce((s, t) => s + Number(t.amount), 0)
                )}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-500">
                Tổng thu nhập
              </span>
              <span className="font-semibold text-green-600">
                +{formatCurrency(
                  parsed
                    .filter((t) => t.type === "INCOME")
                    .reduce((s, t) => s + Number(t.amount), 0)
                )}
              </span>
            </div>
          </div>

          {/* save button */}
          <button onClick={saveAll} disabled={saving}
            className="btn-primary w-full py-3 text-base
                       flex items-center justify-center gap-2">
            {saving
              ? <><RefreshCw className="h-5 w-5 animate-spin" />
                 Đang lưu...</>
              : <><Check className="h-5 w-5" />
                 Lưu {parsed.length} giao dịch</>}
          </button>
        </div>
      )}
    </div>
  );
}
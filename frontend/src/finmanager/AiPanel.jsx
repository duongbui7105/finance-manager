// AiPanel.jsx — AI Chat Drawer + Smart Input Modal

import { useState, useEffect, useRef } from 'react';
import { aiApi } from '../api/aiApi';
import { transactionApi, categoryApi } from '../api/transactionApi';
import { FM_FMT } from './data';
import { Icon } from './Components';

// Detect if a message looks like it contains a transaction amount
const AMOUNT_RE = /\d+\s*(k|tr|triệu|nghìn|000|₫|vnd|đồng|million)/i;

const SUGGESTIONS = [
  'Tháng này tôi chi tiêu như thế nào?',
  'Hãy phân tích tài chính của tôi',
  'Tôi nên tiết kiệm bao nhiêu mỗi tháng?',
  'Danh mục nào tôi chi nhiều nhất?',
];

const QUICK_ACTIONS = [
  { label: 'Phân tích thu chi', prompt: 'Phân tích thu nhập và chi tiêu của tôi tháng này' },
  { label: 'Lời khuyên tiết kiệm', prompt: 'Cho tôi 3 lời khuyên cụ thể để tiết kiệm hơn' },
  { label: 'Dự báo tháng tới', prompt: 'Dự báo tình hình tài chính tháng tới của tôi' },
];

const WELCOME_MSG = {
  id: 0,
  role: 'bot',
  content:
    'Xin chào! Tôi là FinBot 🤖\n\n' +
    'Tôi có thể giúp bạn:\n' +
    '• Phân tích thu chi và số dư\n' +
    '• Đưa ra lời khuyên tiết kiệm\n' +
    '• Nhận xét về danh mục chi tiêu\n' +
    '• Dự đoán xu hướng tài chính\n\n' +
    'Hoặc nhập giao dịch (vd: "phở 50k", "lương 15tr") — AI tự động phân loại!',
};

// ─────────────────────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────────────────────

function ChatBubble({ msg }) {
  const isBot = msg.role === 'bot';

  if (msg.loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <div style={avatarStyle}> 🤖</div>
        <div style={{ ...bubbleStyle(true), padding: '12px 16px' }}>
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            {[0, 150, 300].map(d => (
              <span key={d} style={{
                width: 6, height: 6, borderRadius: '50%',
                background: 'var(--fm-accent)', display: 'inline-block',
                animation: `fm-pulse 1.2s ease-in-out ${d}ms infinite`,
              }}/>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flexDirection: isBot ? 'row' : 'row-reverse' }}>
      {isBot && <div style={avatarStyle}>🤖</div>}
      <div style={{ ...bubbleStyle(isBot), maxWidth: '82%' }}>
        {msg.content}
      </div>
    </div>
  );
}

const avatarStyle = {
  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
  background: 'linear-gradient(135deg, var(--fm-accent), #a78bfa)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
};

function bubbleStyle(isBot) {
  return {
    background: isBot ? 'var(--fm-surface-2)' : 'var(--fm-accent)',
    border: isBot ? '1px solid var(--fm-border)' : 'none',
    color: isBot ? 'var(--fm-text)' : '#fff',
    borderRadius: isBot ? '0 12px 12px 12px' : '12px 0 12px 12px',
    padding: '10px 14px',
    fontSize: 13,
    lineHeight: 1.65,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  };
}

// Editable card for a single parsed transaction
function TxnPreviewCard({ tx, index, categories, onChange, onRemove }) {
  const isIncome = tx.type === 'INCOME';
  const fmt = FM_FMT;
  return (
    <div style={{
      background: 'var(--fm-surface-3)',
      border: '1px solid var(--fm-border)',
      borderLeft: `3px solid ${isIncome ? '#10b981' : '#f97316'}`,
      borderRadius: 10,
      padding: '12px 14px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontFamily: 'var(--fm-font-mono)', fontWeight: 700, fontSize: 15, color: isIncome ? '#10b981' : '#f97316' }}>
          {isIncome ? '+' : '−'}{fmt.vnd(Number(tx.amount || 0), { compact: true })} ₫
        </div>
        <button className="fm-ibtn" style={{ width: 24, height: 24, borderRadius: 6 }} onClick={() => onRemove(index)}>
          <Icon.X size={11}/>
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <label className="fm-label">Mô tả</label>
          <input className="fm-input" style={{ fontSize: 12, height: 32 }}
            value={tx.description ?? tx.note ?? ''}
            onChange={e => onChange(index, 'description', e.target.value)}/>
        </div>
        <div>
          <label className="fm-label">Số tiền</label>
          <input className="fm-input" type="number" style={{ fontSize: 12, height: 32 }}
            value={tx.amount ?? ''}
            onChange={e => onChange(index, 'amount', e.target.value)}/>
        </div>
        <div>
          <label className="fm-label">Ngày</label>
          <input className="fm-input" type="date" style={{ fontSize: 12, height: 32 }}
            value={tx.date ?? ''}
            onChange={e => onChange(index, 'date', e.target.value)}/>
        </div>
        <div>
          <label className="fm-label">Loại</label>
          <select className="fm-input" style={{ fontSize: 12, height: 32 }}
            value={tx.type ?? 'EXPENSE'}
            onChange={e => onChange(index, 'type', e.target.value)}>
            <option value="EXPENSE">💸 Chi tiêu</option>
            <option value="INCOME">💰 Thu nhập</option>
          </select>
        </div>
        <div>
          <label className="fm-label">Danh mục</label>
          <select className="fm-input" style={{ fontSize: 12, height: 32 }}
            value={tx._categoryId ?? ''}
            onChange={e => onChange(index, '_categoryId', Number(e.target.value))}>
            <option value="">-- Chọn --</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// AI CHAT DRAWER
// ─────────────────────────────────────────────────────────────
export function AiChatDrawer({ open, onClose, onTxnSaved }) {
  const [messages, setMessages] = useState([WELCOME_MSG]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [pendingTxns, setPendingTxns] = useState([]);
  const [categories, setCategories] = useState([]);
  const [savingTxns, setSavingTxns] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Load categories once — skip if already populated; reset in-flight state on close
  useEffect(() => {
    if (!open) { setSending(false); return; }
    if (categories.length > 0) return;
    categoryApi.getAll()
      .then(res => setCategories(res.data?.data ?? []))
      .catch(() => {});
  }, [open]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, pendingTxns]);

  // Focus input when drawer opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120);
  }, [open]);

  function enrichTxns(txns) {
    return (txns ?? []).map((tx, i) => {
      const cat = categories.find(c => c.name.toLowerCase() === (tx.category ?? '').toLowerCase());
      return { ...tx, _categoryId: cat?.id ?? null, _key: `${Date.now()}-${i}` };
    });
  }

  async function send(text) {
    const content = (text ?? input).trim();
    if (!content || sending) return;
    setInput('');
    setPendingTxns([]);
    setSaveError(null);

    const userMsg = { id: Date.now(), role: 'user', content };
    const loadingMsg = { id: Date.now() + 1, role: 'bot', loading: true };
    setMessages(prev => [...prev, userMsg, loadingMsg]);
    setSending(true);

    const isTransactional = AMOUNT_RE.test(content);

    try {
      // Always call chat; also call smartInput when message looks transactional
      const [chatRes, smartRes] = await Promise.allSettled([
        aiApi.chat(content),
        isTransactional ? aiApi.smartInput(content) : Promise.reject('skip'),
      ]);

      const botContent = chatRes.status === 'fulfilled'
        ? (chatRes.value.data?.data?.reply ?? 'Không có phản hồi')
        : '❌ Không thể kết nối AI. Kiểm tra kết nối mạng.';

      setMessages(prev => [
        ...prev.filter(m => !m.loading),
        { id: Date.now(), role: 'bot', content: botContent },
      ]);

      // If smartInput found transactions, show preview
      if (smartRes.status === 'fulfilled') {
        const txns = smartRes.value.data?.data?.transactions ?? [];
        if (txns.length > 0) {
          setPendingTxns(enrichTxns(txns));
        }
      }
    } catch (err) {
      setMessages(prev => [
        ...prev.filter(m => !m.loading),
        { id: Date.now(), role: 'bot', content: '❌ ' + (err.response?.data?.message ?? 'Lỗi kết nối AI') },
      ]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  async function generateInsights() {
    if (sending) return;
    setSending(true);
    setPendingTxns([]);
    setMessages(prev => [
      ...prev,
      { id: Date.now() - 1, role: 'user', content: '📊 Phân tích tài chính tổng quan của tôi' },
      { id: Date.now(), role: 'bot', loading: true },
    ]);
    try {
      const res = await aiApi.insights();
      const data = res.data?.data;
      const reply = typeof data === 'string' ? data : (data?.reply ?? 'Không có phân tích');
      setMessages(prev => [
        ...prev.filter(m => !m.loading),
        { id: Date.now(), role: 'bot', content: reply },
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev.filter(m => !m.loading),
        { id: Date.now(), role: 'bot', content: '❌ ' + (err.response?.data?.message ?? 'Không thể tải phân tích AI. Thử lại sau.') },
      ]);
    } finally {
      setSending(false);
    }
  }

  async function savePendingTxns() {
    const invalid = pendingTxns.filter(tx => !tx.amount || !tx.date || !tx._categoryId);
    if (invalid.length > 0) {
      setSaveError('Vui lòng chọn danh mục cho tất cả giao dịch');
      return;
    }
    setSavingTxns(true);
    setSaveError(null);
    try {
      const requests = pendingTxns.map(tx => ({
        amount: Number(tx.amount),
        type: tx.type || 'EXPENSE',
        date: tx.date,
        note: tx.description || tx.note || '',
        categoryId: tx._categoryId,
      }));
      await transactionApi.batch(requests);
      setPendingTxns([]);
      setMessages(prev => [...prev, {
        id: Date.now(), role: 'bot',
        content: `✅ Đã lưu ${requests.length} giao dịch thành công!`,
      }]);
      onTxnSaved?.();
    } catch (err) {
      setSaveError(err.response?.data?.message ?? 'Lỗi lưu giao dịch');
    } finally {
      setSavingTxns(false);
    }
  }

  if (!open) return null;

  return (
    <>
      <div className="fm-drawer-back" onClick={onClose}/>
      <div className="fm-drawer" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* ── Header ── */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--fm-border)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg, var(--fm-accent), #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>🤖</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: '-0.01em' }}>FinBot AI</div>
            <div style={{ fontSize: 11, color: 'var(--fm-text-muted)', display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', display: 'inline-block' }}/>Trực tuyến
            </div>
          </div>
          <button className="fm-btn fm-ghost fm-sm" onClick={generateInsights} disabled={sending} style={{ fontSize: 11, gap: 5 }}>
            <Icon.Sparkles size={11}/>Phân tích
          </button>
          <button className="fm-ibtn" style={{ width: 28, height: 28, borderRadius: 8, fontSize: 16 }} title="Làm mới hội thoại"
            onClick={() => { setMessages([WELCOME_MSG]); setPendingTxns([]); }}>
            ↺
          </button>
          <button className="fm-ibtn" style={{ width: 28, height: 28, borderRadius: 8 }} onClick={onClose}>
            <Icon.X size={14}/>
          </button>
        </div>

        {/* ── Messages ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {messages.map((msg, i) => <ChatBubble key={msg.id ?? i} msg={msg}/>)}

          {/* Transaction preview block */}
          {pendingTxns.length > 0 && (
            <div style={{ background: 'var(--fm-surface)', border: '1px solid var(--fm-accent)33', borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--fm-accent)' }}>
                <Icon.Sparkles size={12}/>Tìm thấy {pendingTxns.length} giao dịch — kiểm tra và lưu
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pendingTxns.map((tx, i) => (
                  <TxnPreviewCard
                    key={tx._key ?? i} tx={tx} index={i} categories={categories}
                    onChange={(idx, field, val) => setPendingTxns(prev => {
                      const c = [...prev]; c[idx] = { ...c[idx], [field]: val }; return c;
                    })}
                    onRemove={idx => setPendingTxns(prev => prev.filter((_, j) => j !== idx))}
                  />
                ))}
              </div>
              {saveError && (
                <div style={{ color: '#ef4444', fontSize: 12, marginTop: 8 }}>{saveError}</div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="fm-btn fm-primary fm-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={savePendingTxns} disabled={savingTxns}>
                  <Icon.Check size={12}/>{savingTxns ? 'Đang lưu…' : `Lưu ${pendingTxns.length} giao dịch`}
                </button>
                <button className="fm-btn fm-ghost fm-sm" onClick={() => { setPendingTxns([]); setSaveError(null); }}>
                  Bỏ qua
                </button>
              </div>
            </div>
          )}

          <div ref={bottomRef}/>
        </div>

        {/* ── Quick actions (welcome screen only) ── */}
        {messages.length === 1 && (
          <div style={{ padding: '0 20px 12px', flexShrink: 0 }}>
            <div style={{ fontSize: 10, color: 'var(--fm-text-dim)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Gợi ý</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {SUGGESTIONS.map(s => (
                <button key={s} className="fm-btn fm-ghost fm-sm" style={{ fontSize: 11, height: 28 }} onClick={() => send(s)}>{s}</button>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 8 }}>
              {QUICK_ACTIONS.map(a => (
                <button key={a.label} className="fm-btn" style={{ flexDirection: 'column', height: 'auto', padding: '8px', fontSize: 11, gap: 3, textAlign: 'center' }}
                  onClick={() => send(a.prompt)}>
                  <Icon.Sparkles size={12} style={{ color: 'var(--fm-accent)' }}/>
                  <span style={{ fontWeight: 600 }}>{a.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Input area ── */}
        <div style={{ padding: '12px 20px 16px', borderTop: '1px solid var(--fm-border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              disabled={sending}
              placeholder="Hỏi về tài chính hoặc nhập giao dịch… (Enter để gửi)"
              rows={1}
              className="fm-input"
              style={{ flex: 1, resize: 'none', fontSize: 13, lineHeight: 1.5, minHeight: 40, maxHeight: 108, padding: '10px 12px' }}
              onInput={e => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 108) + 'px';
              }}
            />
            <button
              className="fm-btn fm-primary"
              style={{ height: 40, padding: '0 14px', flexShrink: 0 }}
              onClick={() => send()}
              disabled={!input.trim() || sending}
            >
              {sending ? '…' : <Icon.Arrow size={14}/>}
            </button>
          </div>
          <div style={{ fontSize: 10, color: 'var(--fm-text-dim)', marginTop: 5, textAlign: 'center' }}>
            Nhập giao dịch (vd: "phở 50k") — AI tự động phân loại và gợi ý lưu
          </div>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// SMART INPUT MODAL
// ─────────────────────────────────────────────────────────────
export function SmartInputModal({ open, onClose, onSaved }) {
  const fmt = FM_FMT;
  const [mode, setMode] = useState('text');
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [parsed, setParsed] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  // Load categories once — skip if already populated
  useEffect(() => {
    if (!open || categories.length > 0) return;
    categoryApi.getAll()
      .then(res => setCategories(res.data?.data ?? []))
      .catch(() => {});
  }, [open]);

  function enrichTxns(txns) {
    return (txns ?? []).map((tx, i) => {
      const cat = categories.find(c => c.name.toLowerCase() === (tx.category ?? '').toLowerCase());
      return { ...tx, _categoryId: cat?.id ?? null, _key: `${Date.now()}-${i}` };
    });
  }

  async function analyseText() {
    if (!text.trim()) return;
    setLoading(true); setError(null); setDone(false);
    try {
      const res = await aiApi.smartInput(text);
      const data = res.data?.data ?? {};
      const txns = enrichTxns(data.transactions ?? []);
      setParsed(txns);
      if (txns.length === 0) setError('Không tìm thấy giao dịch nào. Thử viết rõ hơn, vd: "phở 50k"');
    } catch (err) {
      setError(err.response?.data?.message ?? 'Phân tích thất bại. Kiểm tra kết nối mạng.');
    } finally {
      setLoading(false);
    }
  }

  async function scanReceipt() {
    if (!imageFile) return;
    setLoading(true); setError(null); setDone(false);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result.split(',')[1];
      const mimeType = imageFile.type || 'image/jpeg';
      try {
        const res = await aiApi.scanReceipt(base64, mimeType);
        const data = res.data?.data ?? {};
        const txns = enrichTxns(data.transactions ?? []);
        setParsed(txns);
        if (txns.length === 0) setError('Không tìm thấy mặt hàng nào trong ảnh');
      } catch (err) {
        setError(err.response?.data?.message ?? 'Quét hóa đơn thất bại');
      } finally {
        setLoading(false);
      }
    };
    reader.onerror = () => { setError('Không thể đọc file ảnh'); setLoading(false); };
    reader.readAsDataURL(imageFile);
  }

  function handleImagePick(e) {
    const file = e.target?.files?.[0] || e.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Chỉ hỗ trợ file ảnh (JPG, PNG, WebP…)'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('File ảnh quá lớn — tối đa 10MB'); return; }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = ev => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
    setDone(false); setParsed([]); setError(null);
  }

  function handleChange(index, field, value) {
    setParsed(prev => { const c = [...prev]; c[index] = { ...c[index], [field]: value }; return c; });
  }

  function handleRemove(index) {
    setParsed(prev => prev.filter((_, i) => i !== index));
  }

  async function saveAll() {
    if (parsed.length === 0) return;
    const invalid = parsed.filter(tx => !tx.amount || !tx.date || !tx._categoryId);
    if (invalid.length > 0) { setError('Vui lòng điền đầy đủ số tiền, ngày và danh mục'); return; }
    setSaving(true); setError(null);
    try {
      const requests = parsed.map(tx => ({
        amount: Number(tx.amount),
        type: tx.type || 'EXPENSE',
        date: tx.date,
        note: tx.description || tx.note || '',
        categoryId: tx._categoryId,
      }));
      await transactionApi.batch(requests);
      setDone(true);
      setParsed([]); setText(''); setImageFile(null); setImagePreview(null);
      onSaved?.();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setParsed([]); setText(''); setImageFile(null); setImagePreview(null);
    setDone(false); setError(null);
  }

  function switchMode(m) { setMode(m); reset(); }

  if (!open) return null;

  const totalExpense = parsed.filter(t => t.type !== 'INCOME').reduce((s, t) => s + Number(t.amount || 0), 0);
  const totalIncome  = parsed.filter(t => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount || 0), 0);

  return (
    <div className="fm-modal-back" onClick={onClose}>
      <div
        className="fm-modal"
        style={{ width: 'min(560px, calc(100% - 32px))', maxHeight: '88vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--fm-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #f97316, #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>⚡</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em' }}>Smart Add</div>
              <div style={{ fontSize: 11, color: 'var(--fm-text-muted)', marginTop: 1 }}>Nhập tự nhiên hoặc quét hóa đơn — AI tự động tạo giao dịch</div>
            </div>
          </div>
          <button className="fm-ibtn" onClick={onClose}><Icon.X size={14}/></button>
        </div>

        {/* ── Mode toggle ── */}
        <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--fm-border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 4, background: 'var(--fm-surface-2)', borderRadius: 10, padding: 4 }}>
            {[{ value: 'text', label: '⌨️  Nhập văn bản' }, { value: 'image', label: '📷  Quét hóa đơn' }].map(m => (
              <button key={m.value}
                className={`fm-btn ${mode === m.value ? 'fm-primary' : 'fm-ghost'}`}
                style={{ flex: 1, justifyContent: 'center', fontSize: 12, height: 32 }}
                onClick={() => switchMode(m.value)}>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {done ? (
            <div style={{ textAlign: 'center', padding: '40px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--fm-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>✅</div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Đã lưu thành công!</div>
              <div style={{ color: 'var(--fm-text-muted)', fontSize: 13 }}>Dashboard và danh sách giao dịch đã được cập nhật.</div>
              <button className="fm-btn fm-ghost" style={{ fontSize: 13 }} onClick={reset}>Nhập tiếp</button>
            </div>
          ) : (
            <>
              {/* Text mode */}
              {mode === 'text' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label className="fm-label">Mô tả chi tiêu / thu nhập</label>
                    <textarea
                      value={text}
                      onChange={e => { setText(e.target.value); if (parsed.length > 0) setParsed([]); setError(null); }}
                      placeholder={'Ví dụ:\nHôm nay ăn phở 40k, uống trà sữa 35k, đổ xăng 100k\nNhận lương tháng 5: 15 triệu\nMua sách lập trình 250k và cafe 45k'}
                      rows={4}
                      className="fm-input"
                      style={{ resize: 'none', fontSize: 13, lineHeight: 1.65 }}
                    />
                    <div style={{ fontSize: 11, color: 'var(--fm-text-dim)', marginTop: 5 }}>
                      Hỗ trợ: "40k", "1.5tr", "30,000 VND", nhiều giao dịch cùng lúc
                    </div>
                  </div>
                  <button className="fm-btn fm-primary" onClick={analyseText} disabled={!text.trim() || loading}
                    style={{ width: '100%', justifyContent: 'center', gap: 8 }}>
                    {loading ? '⏳ Đang phân tích…' : '⚡ Phân tích với AI'}
                  </button>
                </div>
              )}

              {/* Image mode */}
              {mode === 'image' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label className="fm-label">Tải ảnh hóa đơn / biên lai</label>
                    <div
                      onClick={() => fileRef.current?.click()}
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleImagePick({ target: { files: [f] } }); }}
                      style={{
                        border: `2px dashed ${imagePreview ? 'var(--fm-accent)' : 'var(--fm-border)'}`,
                        borderRadius: 12, minHeight: 148,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', transition: 'border-color 0.2s, background 0.2s',
                        background: imagePreview ? 'var(--fm-accent-soft)' : 'var(--fm-surface-2)',
                        overflow: 'hidden',
                      }}>
                      {imagePreview
                        ? <img src={imagePreview} alt="Receipt" style={{ maxHeight: 200, maxWidth: '100%', objectFit: 'contain', borderRadius: 8 }}/>
                        : <>
                            <div style={{ fontSize: 36, marginBottom: 8 }}>📷</div>
                            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--fm-text-muted)' }}>Click hoặc kéo thả ảnh vào đây</div>
                            <div style={{ fontSize: 11, color: 'var(--fm-text-dim)', marginTop: 4 }}>JPG, PNG — tối đa 10MB</div>
                          </>
                      }
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImagePick}/>
                  </div>
                  {imageFile && (
                    <div style={{ fontSize: 11, color: 'var(--fm-text-muted)' }}>📎 {imageFile.name} ({(imageFile.size / 1024).toFixed(0)} KB)</div>
                  )}
                  <button className="fm-btn fm-primary" onClick={scanReceipt} disabled={!imageFile || loading}
                    style={{ width: '100%', justifyContent: 'center', gap: 8 }}>
                    {loading ? '⏳ Đang quét hóa đơn…' : '📷 Quét với AI'}
                  </button>
                </div>
              )}

              {/* Loading indicator */}
              {loading && (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--fm-text-muted)', fontSize: 13, marginTop: 12 }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
                  AI đang phân tích… thường mất 3–8 giây
                </div>
              )}

              {/* Error */}
              {error && (
                <div style={{ background: '#ef444422', border: '1px solid #ef444440', borderRadius: 8, padding: '10px 14px', color: '#ef4444', fontSize: 13, marginTop: 12 }}>
                  {error}
                </div>
              )}

              {/* Parsed results */}
              {!loading && parsed.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--fm-accent)' }}>
                      ✓ Tìm thấy {parsed.length} giao dịch
                    </div>
                    <button className="fm-btn fm-ghost fm-sm" style={{ fontSize: 11, color: 'var(--fm-danger)' }} onClick={reset}>
                      Xoá tất cả
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {parsed.map((tx, i) => (
                      <TxnPreviewCard key={tx._key ?? i} tx={tx} index={i} categories={categories}
                        onChange={handleChange} onRemove={handleRemove}/>
                    ))}
                  </div>
                  {/* Totals summary */}
                  <div style={{ background: 'var(--fm-surface-2)', borderRadius: 10, padding: '12px 14px', marginTop: 12, display: 'flex', gap: 24 }}>
                    <div>
                      <div style={{ color: 'var(--fm-text-muted)', fontSize: 11, marginBottom: 2 }}>Tổng chi tiêu</div>
                      <div style={{ fontFamily: 'var(--fm-font-mono)', fontWeight: 700, color: '#f97316', fontSize: 14 }}>
                        −{fmt.vnd(totalExpense, { compact: true })} ₫
                      </div>
                    </div>
                    {totalIncome > 0 && (
                      <div>
                        <div style={{ color: 'var(--fm-text-muted)', fontSize: 11, marginBottom: 2 }}>Tổng thu nhập</div>
                        <div style={{ fontFamily: 'var(--fm-font-mono)', fontWeight: 700, color: '#10b981', fontSize: 14 }}>
                          +{fmt.vnd(totalIncome, { compact: true })} ₫
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Footer save button ── */}
        {parsed.length > 0 && !done && (
          <div style={{ padding: '14px 24px', borderTop: '1px solid var(--fm-border)', flexShrink: 0 }}>
            <button className="fm-btn fm-primary" style={{ width: '100%', justifyContent: 'center', fontSize: 14, height: 44 }} onClick={saveAll} disabled={saving}>
              <Icon.Check size={14}/>{saving ? 'Đang lưu…' : `Lưu ${parsed.length} giao dịch`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

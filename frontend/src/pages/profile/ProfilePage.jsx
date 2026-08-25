import { useState, useEffect, useCallback } from "react";
import {
  User, Phone, Mail, Calendar, Venus, Mars, CircleDot,
  Lock, Shield, Sun, Moon, Bell, BellOff, Target,
  PiggyBank, Trash2, Edit3, Plus, Check, ChevronRight,
  Camera, Save, Eye, EyeOff, TrendingUp, Wallet,
  AlertTriangle, CheckCircle2, Info
} from "lucide-react";
import { profileApi } from "../../api/profileApi";
import { useTheme } from "../../context/ThemeContext";
import useAuth from "../../hooks/useAuth";
import { formatCurrency } from "../../utils/formatters";

// ── Reusable sub-components ──────────────────────────────

function FormField({ label, error, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {error && (
        <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" /> {error}
        </p>
      )}
    </div>
  );
}

function PasswordInput({ value, onChange, placeholder, name }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="input pr-10"
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function PasswordStrength({ password }) {
  const checks = [
    { label: "Ít nhất 8 ký tự", ok: password.length >= 8 },
    { label: "Có chữ hoa",       ok: /[A-Z]/.test(password) },
    { label: "Có số",             ok: /\d/.test(password) },
    { label: "Có ký tự đặc biệt", ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const strength = checks.filter(c => c.ok).length;
  const colors   = ["bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-emerald-400"];
  const labels   = ["Yếu", "Trung bình", "Khá", "Mạnh"];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i < strength ? colors[strength - 1] : "bg-gray-200 dark:bg-gray-700"
            }`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium ${
        strength <= 1 ? "text-red-500" :
        strength === 2 ? "text-orange-500" :
        strength === 3 ? "text-yellow-600" : "text-emerald-600"
      }`}>
        {labels[strength - 1] || ""}
      </p>
      <ul className="space-y-1">
        {checks.map(c => (
          <li key={c.label} className={`text-xs flex items-center gap-1.5 ${
            c.ok ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400"
          }`}>
            <Check className={`h-3 w-3 ${c.ok ? "opacity-100" : "opacity-30"}`} />
            {c.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

// goal accent colours
const GOAL_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
  "#f97316", "#eab308", "#10b981", "#06b6d4",
];

function GoalModal({ goal, onSave, onClose }) {
  const isEdit = !!goal?.id;
  const [form, setForm] = useState({
    name:          goal?.name         ?? "",
    targetAmount:  goal?.targetAmount ?? "",
    currentAmount: goal?.currentAmount ?? 0,
    deadline:      goal?.deadline     ?? "",
    color:         goal?.color        ?? "#6366f1",
    icon:          goal?.icon         ?? "piggy-bank",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    if (!form.name.trim() || !form.targetAmount) {
      setError("Vui lòng điền tên và số tiền mục tiêu"); return;
    }
    setSaving(true);
    try {
      await onSave({
        ...form,
        targetAmount:  parseFloat(form.targetAmount),
        currentAmount: parseFloat(form.currentAmount) || 0,
        deadline:      form.deadline || null,
      });
      onClose();
    } catch {
      setError("Không thể lưu mục tiêu. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <h3 className="text-lg font-semibold dark:text-white">
            {isEdit ? "Sửa mục tiêu" : "Thêm mục tiêu tiết kiệm"}
          </h3>
          <button onClick={onClose} className="btn-ghost p-1.5">✕</button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          <FormField label="Tên mục tiêu">
            <input name="name" value={form.name} onChange={handle}
              placeholder="Vd: Mua xe, Du lịch Nhật Bản..." className="input" />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Số tiền mục tiêu (VND)">
              <input type="number" name="targetAmount" value={form.targetAmount}
                onChange={handle} placeholder="50000000" className="input" min={1} />
            </FormField>
            <FormField label="Đã tiết kiệm (VND)">
              <input type="number" name="currentAmount" value={form.currentAmount}
                onChange={handle} placeholder="0" className="input" min={0} />
            </FormField>
          </div>

          <FormField label="Hạn chót (không bắt buộc)">
            <input type="date" name="deadline" value={form.deadline}
              onChange={handle} className="input" />
          </FormField>

          <div>
            <label className="label">Màu sắc</label>
            <div className="flex gap-2 flex-wrap">
              {GOAL_COLORS.map(c => (
                <button
                  key={c} type="button"
                  onClick={() => setForm(f => ({ ...f, color: c }))}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    form.color === c ? "scale-125 ring-2 ring-offset-2 ring-gray-400" : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Hủy
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo mục tiêu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Avatar component ─────────────────────────────────────
function Avatar({ name, url, size = "lg" }) {
  const initials = (name || "?")
    .split(" ")
    .map(w => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const dim = size === "lg" ? "h-24 w-24 text-2xl" : "h-10 w-10 text-sm";

  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className={`${dim} rounded-full object-cover ring-4 ring-white dark:ring-surface-800 shadow-lg`}
      />
    );
  }
  return (
    <div className={`${dim} rounded-full bg-gradient-to-br from-primary-500 to-primary-700
         flex items-center justify-center ring-4 ring-white dark:ring-surface-800 shadow-lg`}>
      <span className="font-bold text-white">{initials}</span>
    </div>
  );
}

// ── Savings Goal card ────────────────────────────────────
function GoalCard({ goal, onEdit, onDelete }) {
  const pct = Math.min(
    100,
    goal.targetAmount > 0
      ? Math.round((goal.currentAmount / goal.targetAmount) * 100)
      : 0
  );

  const daysLeft = goal.deadline
    ? Math.ceil((new Date(goal.deadline) - new Date()) / 86400000)
    : null;

  return (
    <div className="card-hover group relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-5"
        style={{ background: `linear-gradient(135deg, ${goal.color}, transparent)` }}
      />
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl" style={{ backgroundColor: goal.color + "22" }}>
              <PiggyBank className="h-5 w-5" style={{ color: goal.color }} />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
                {goal.name}
              </h4>
              {daysLeft !== null && (
                <p className={`text-xs mt-0.5 ${
                  daysLeft < 0 ? "text-red-500" :
                  daysLeft < 30 ? "text-orange-500" : "text-gray-400"
                }`}>
                  {daysLeft < 0
                    ? "Đã quá hạn"
                    : daysLeft === 0
                    ? "Hết hạn hôm nay"
                    : `Còn ${daysLeft} ngày`}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onEdit(goal)} className="btn-ghost p-1.5">
              <Edit3 className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => onDelete(goal.id)} className="btn-ghost p-1.5 text-red-400 hover:text-red-600">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              {formatCurrency(goal.currentAmount)}
            </span>
            <span className="font-semibold dark:text-gray-200">
              {formatCurrency(goal.targetAmount)}
            </span>
          </div>
          <div className="progress-track h-2">
            <div
              className="progress-bar h-2"
              style={{ width: `${pct}%`, backgroundColor: goal.color }}
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatCurrency(goal.targetAmount - goal.currentAmount)} còn thiếu
            </span>
            <span
              className="text-xs font-bold"
              style={{ color: goal.color }}
            >
              {pct}%
            </span>
          </div>
        </div>

        {goal.completed && (
          <div className="mt-2 flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
            <CheckCircle2 className="h-3.5 w-3.5" /> Đã hoàn thành!
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────

const TABS = [
  { id: "profile",   label: "Hồ sơ",            icon: User },
  { id: "goals",     label: "Ngân sách & Mục tiêu", icon: Target },
  { id: "security",  label: "Bảo mật",           icon: Shield },
  { id: "settings",  label: "Cài đặt",           icon: Sun },
];

export default function ProfilePage({ toast }) {
  const { user: authUser } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // ── State ───────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("profile");

  // profile
  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({
    fullName: "", phone: "", bio: "", dateOfBirth: "", gender: "", avatarUrl: "",
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});

  // budget
  const [budget, setBudget] = useState(null);
  const [budgetForm, setBudgetForm] = useState({
    monthlyLimit: "", dailyLimit: "", alertEnabled: true, alertThreshold: 80,
  });
  const [budgetSaving, setBudgetSaving] = useState(false);

  // savings goals
  const [goals, setGoals]         = useState([]);
  const [goalModal, setGoalModal] = useState(null); // null | { mode: 'add'|'edit', goal }

  // security
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwSaving, setPwSaving]   = useState(false);
  const [pwErrors, setPwErrors]   = useState({});

  // ── Load data ────────────────────────────────────────
  const loadAll = useCallback(async () => {
    try {
      const [profRes, budgetRes, goalsRes] = await Promise.all([
        profileApi.getProfile(),
        profileApi.getBudget(),
        profileApi.getSavingsGoals(),
      ]);
      const p = profRes.data?.data ?? profRes.data;
      setProfile(p);
      setProfileForm({
        fullName:    p.fullName    ?? "",
        phone:       p.phone       ?? "",
        bio:         p.bio         ?? "",
        dateOfBirth: p.dateOfBirth ?? "",
        gender:      p.gender      ?? "",
        avatarUrl:   p.avatarUrl   ?? "",
      });

      const b = budgetRes.data?.data ?? budgetRes.data;
      setBudget(b);
      setBudgetForm({
        monthlyLimit:   b?.monthlyLimit   ?? "",
        dailyLimit:     b?.dailyLimit     ?? "",
        alertEnabled:   b?.alertEnabled   ?? true,
        alertThreshold: b?.alertThreshold ?? 80,
      });

      const g = goalsRes.data?.data ?? goalsRes.data;
      setGoals(Array.isArray(g) ? g : []);
    } catch {
      toast?.error("Không thể tải dữ liệu hồ sơ");
    }
  }, [toast]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Profile save ─────────────────────────────────────
  const validateProfile = () => {
    const errs = {};
    if (!profileForm.fullName.trim()) errs.fullName = "Vui lòng nhập họ tên";
    if (profileForm.fullName.trim().length < 2) errs.fullName = "Tên phải có ít nhất 2 ký tự";
    if (profileForm.phone && !/^\+?[0-9]{9,15}$/.test(profileForm.phone))
      errs.phone = "Số điện thoại không hợp lệ";
    return errs;
  };

  const saveProfile = async e => {
    e.preventDefault();
    const errs = validateProfile();
    if (Object.keys(errs).length) { setProfileErrors(errs); return; }
    setProfileErrors({});
    setProfileSaving(true);
    try {
      const res = await profileApi.updateProfile({
        ...profileForm,
        dateOfBirth: profileForm.dateOfBirth || null,
        gender:      profileForm.gender      || null,
      });
      const updated = res.data?.data ?? res.data;
      setProfile(updated);
      toast?.success("Cập nhật hồ sơ thành công!");
    } catch (err) {
      toast?.error(err.response?.data?.message ?? "Cập nhật thất bại");
    } finally {
      setProfileSaving(false);
    }
  };

  // ── Budget save ──────────────────────────────────────
  const saveBudget = async e => {
    e.preventDefault();
    setBudgetSaving(true);
    try {
      const res = await profileApi.saveBudget({
        monthlyLimit:   budgetForm.monthlyLimit   ? parseFloat(budgetForm.monthlyLimit)   : null,
        dailyLimit:     budgetForm.dailyLimit     ? parseFloat(budgetForm.dailyLimit)     : null,
        alertEnabled:   budgetForm.alertEnabled,
        alertThreshold: parseInt(budgetForm.alertThreshold) || 80,
      });
      setBudget(res.data?.data ?? res.data);
      toast?.success("Đã lưu ngân sách!");
    } catch {
      toast?.error("Không thể lưu ngân sách");
    } finally {
      setBudgetSaving(false);
    }
  };

  // ── Goal CRUD ────────────────────────────────────────
  const handleGoalSave = async (data) => {
    if (goalModal?.goal?.id) {
      const res = await profileApi.updateSavingsGoal(goalModal.goal.id, data);
      const updated = res.data?.data ?? res.data;
      setGoals(gs => gs.map(g => g.id === updated.id ? updated : g));
      toast?.success("Đã cập nhật mục tiêu!");
    } else {
      const res = await profileApi.createSavingsGoal(data);
      const created = res.data?.data ?? res.data;
      setGoals(gs => [created, ...gs]);
      toast?.success("Đã tạo mục tiêu mới!");
    }
  };

  const deleteGoal = async (id) => {
    if (!window.confirm("Xóa mục tiêu này?")) return;
    try {
      await profileApi.deleteSavingsGoal(id);
      setGoals(gs => gs.filter(g => g.id !== id));
      toast?.success("Đã xóa mục tiêu");
    } catch {
      toast?.error("Không thể xóa mục tiêu");
    }
  };

  // ── Password change ──────────────────────────────────
  const validatePw = () => {
    const errs = {};
    if (!pwForm.currentPassword) errs.currentPassword = "Vui lòng nhập mật khẩu hiện tại";
    if (!pwForm.newPassword)      errs.newPassword     = "Vui lòng nhập mật khẩu mới";
    if (pwForm.newPassword.length < 8) errs.newPassword = "Mật khẩu tối thiểu 8 ký tự";
    if (pwForm.newPassword !== pwForm.confirmPassword)
      errs.confirmPassword = "Mật khẩu xác nhận không khớp";
    return errs;
  };

  const changePassword = async e => {
    e.preventDefault();
    const errs = validatePw();
    if (Object.keys(errs).length) { setPwErrors(errs); return; }
    setPwErrors({});
    setPwSaving(true);
    try {
      await profileApi.changePassword(pwForm);
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast?.success("Đổi mật khẩu thành công!");
    } catch (err) {
      const msg = err.response?.data?.message ?? "Đổi mật khẩu thất bại";
      setPwErrors({ currentPassword: msg });
    } finally {
      setPwSaving(false);
    }
  };

  // ── Render tabs ──────────────────────────────────────
  const profileTab = (
    <form onSubmit={saveProfile} className="space-y-6 animate-fade-in">
      {/* Avatar section */}
      <div className="card">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative shrink-0">
            <Avatar name={profileForm.fullName} url={profileForm.avatarUrl} size="lg" />
            <div className="absolute -bottom-1 -right-1 bg-primary-600 p-1.5 rounded-full shadow-md cursor-pointer hover:bg-primary-700 transition-colors">
              <Camera className="h-3.5 w-3.5 text-white" />
            </div>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {profile?.fullName ?? authUser?.email}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{profile?.email}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Tham gia từ{" "}
              {profile?.createdAt
                ? new Date(profile.createdAt).toLocaleDateString("vi-VN", {
                    year: "numeric", month: "long",
                  })
                : "..."}
            </p>
            <div className="mt-3">
              <FormField label="URL ảnh đại diện" error={null}>
                <input
                  value={profileForm.avatarUrl}
                  onChange={e => setProfileForm(f => ({ ...f, avatarUrl: e.target.value }))}
                  placeholder="https://example.com/avatar.jpg"
                  className="input text-xs"
                />
              </FormField>
            </div>
          </div>
        </div>
      </div>

      {/* Personal info */}
      <div className="card space-y-5">
        <h3 className="section-title flex items-center gap-2">
          <User className="h-4 w-4 text-primary-500" /> Thông tin cá nhân
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Họ và tên *" error={profileErrors.fullName}>
            <input
              value={profileForm.fullName}
              onChange={e => setProfileForm(f => ({ ...f, fullName: e.target.value }))}
              placeholder="Nguyễn Văn An"
              className={`input ${profileErrors.fullName ? "input-error" : ""}`}
            />
          </FormField>

          <FormField label="Email" error={null}>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={profile?.email ?? ""}
                readOnly
                className="input pl-9 bg-gray-50 dark:bg-surface-700 cursor-not-allowed"
              />
            </div>
          </FormField>

          <FormField label="Số điện thoại" error={profileErrors.phone}>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={profileForm.phone}
                onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="0912 345 678"
                className={`input pl-9 ${profileErrors.phone ? "input-error" : ""}`}
              />
            </div>
          </FormField>

          <FormField label="Ngày sinh" error={null}>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={profileForm.dateOfBirth}
                onChange={e => setProfileForm(f => ({ ...f, dateOfBirth: e.target.value }))}
                className="input pl-9"
              />
            </div>
          </FormField>
        </div>

        <FormField label="Giới tính" error={null}>
          <div className="flex gap-3">
            {[
              { value: "MALE",   label: "Nam",   icon: Mars },
              { value: "FEMALE", label: "Nữ",    icon: Venus },
              { value: "OTHER",  label: "Khác",  icon: CircleDot },
            ].map(({ value, label, icon: Icon }) => (
              <label
                key={value}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 cursor-pointer
                            transition-all text-sm font-medium flex-1 justify-center
                  ${profileForm.gender === value
                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 text-gray-600 dark:text-gray-400"
                  }`}
              >
                <input
                  type="radio" name="gender" value={value} className="sr-only"
                  checked={profileForm.gender === value}
                  onChange={e => setProfileForm(f => ({ ...f, gender: e.target.value }))}
                />
                <Icon className="h-4 w-4" />
                {label}
              </label>
            ))}
          </div>
        </FormField>

        <FormField label="Giới thiệu bản thân" error={null}>
          <textarea
            value={profileForm.bio}
            onChange={e => setProfileForm(f => ({ ...f, bio: e.target.value }))}
            placeholder="Viết vài dòng về bản thân bạn..."
            rows={3}
            maxLength={500}
            className="input resize-none"
          />
          <p className="text-right text-xs text-gray-400 mt-1">
            {profileForm.bio.length}/500
          </p>
        </FormField>

        <div className="flex justify-end">
          <button type="submit" disabled={profileSaving} className="btn-primary flex items-center gap-2">
            <Save className="h-4 w-4" />
            {profileSaving ? "Đang lưu..." : "Lưu hồ sơ"}
          </button>
        </div>
      </div>
    </form>
  );

  const goalsTab = (
    <div className="space-y-6 animate-fade-in">
      {/* Budget card */}
      <form onSubmit={saveBudget} className="card space-y-5">
        <h3 className="section-title flex items-center gap-2">
          <Wallet className="h-4 w-4 text-primary-500" /> Giới hạn chi tiêu
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Giới hạn tháng (VND)" error={null}>
            <input
              type="number"
              value={budgetForm.monthlyLimit}
              onChange={e => setBudgetForm(f => ({ ...f, monthlyLimit: e.target.value }))}
              placeholder="10,000,000"
              className="input"
              min={0}
            />
          </FormField>
          <FormField label="Giới hạn ngày (VND)" error={null}>
            <input
              type="number"
              value={budgetForm.dailyLimit}
              onChange={e => setBudgetForm(f => ({ ...f, dailyLimit: e.target.value }))}
              placeholder="500,000"
              className="input"
              min={0}
            />
          </FormField>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-surface-700 rounded-xl">
          <div className="flex items-center gap-3">
            {budgetForm.alertEnabled
              ? <Bell className="h-5 w-5 text-primary-500" />
              : <BellOff className="h-5 w-5 text-gray-400" />}
            <div>
              <p className="text-sm font-medium dark:text-gray-200">Cảnh báo chi tiêu</p>
              <p className="text-xs text-gray-500">Nhận cảnh báo khi đạt {budgetForm.alertThreshold}% giới hạn</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setBudgetForm(f => ({ ...f, alertEnabled: !f.alertEnabled }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
              budgetForm.alertEnabled ? "bg-primary-600" : "bg-gray-300 dark:bg-gray-600"
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
              budgetForm.alertEnabled ? "translate-x-6" : "translate-x-1"
            }`} />
          </button>
        </div>

        {budgetForm.alertEnabled && (
          <div>
            <label className="label">
              Ngưỡng cảnh báo: <span className="text-primary-600 font-bold">{budgetForm.alertThreshold}%</span>
            </label>
            <input
              type="range"
              min={50} max={100} step={5}
              value={budgetForm.alertThreshold}
              onChange={e => setBudgetForm(f => ({ ...f, alertThreshold: e.target.value }))}
              className="w-full accent-primary-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>50%</span><span>75%</span><span>100%</span>
            </div>
          </div>
        )}

        {budget?.monthlyLimit && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-start gap-2 text-sm text-blue-700 dark:text-blue-300">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <span>Giới hạn tháng hiện tại: <strong>{formatCurrency(budget.monthlyLimit)}</strong></span>
          </div>
        )}

        <div className="flex justify-end">
          <button type="submit" disabled={budgetSaving} className="btn-primary flex items-center gap-2">
            <Save className="h-4 w-4" />
            {budgetSaving ? "Đang lưu..." : "Lưu ngân sách"}
          </button>
        </div>
      </form>

      {/* Savings goals */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="section-title flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary-500" />
            Mục tiêu tiết kiệm ({goals.length})
          </h3>
          <button
            onClick={() => setGoalModal({ goal: null })}
            className="btn-primary flex items-center gap-2 text-sm py-2"
          >
            <Plus className="h-4 w-4" /> Thêm mục tiêu
          </button>
        </div>

        {goals.length === 0 ? (
          <div className="card text-center py-12">
            <PiggyBank className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">Chưa có mục tiêu tiết kiệm</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Tạo mục tiêu đầu tiên để bắt đầu hành trình tiết kiệm!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {goals.map(g => (
              <GoalCard
                key={g.id} goal={g}
                onEdit={(goal) => setGoalModal({ goal })}
                onDelete={deleteGoal}
              />
            ))}
          </div>
        )}
      </div>

      {goalModal !== null && (
        <GoalModal
          goal={goalModal.goal}
          onSave={handleGoalSave}
          onClose={() => setGoalModal(null)}
        />
      )}
    </div>
  );

  const securityTab = (
    <div className="space-y-6 animate-fade-in">
      <div className="card space-y-5">
        <h3 className="section-title flex items-center gap-2">
          <Lock className="h-4 w-4 text-primary-500" /> Đổi mật khẩu
        </h3>

        <form onSubmit={changePassword} className="space-y-4">
          <FormField label="Mật khẩu hiện tại" error={pwErrors.currentPassword}>
            <PasswordInput
              name="currentPassword"
              value={pwForm.currentPassword}
              onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
              placeholder="Nhập mật khẩu hiện tại"
            />
          </FormField>

          <FormField label="Mật khẩu mới" error={pwErrors.newPassword}>
            <PasswordInput
              name="newPassword"
              value={pwForm.newPassword}
              onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
              placeholder="Tối thiểu 8 ký tự"
            />
            <PasswordStrength password={pwForm.newPassword} />
          </FormField>

          <FormField label="Xác nhận mật khẩu mới" error={pwErrors.confirmPassword}>
            <PasswordInput
              name="confirmPassword"
              value={pwForm.confirmPassword}
              onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))}
              placeholder="Nhập lại mật khẩu mới"
            />
            {pwForm.confirmPassword && pwForm.newPassword && (
              <p className={`mt-1 text-xs flex items-center gap-1 ${
                pwForm.newPassword === pwForm.confirmPassword
                  ? "text-emerald-600" : "text-red-500"
              }`}>
                {pwForm.newPassword === pwForm.confirmPassword
                  ? <><Check className="h-3 w-3" /> Mật khẩu khớp</>
                  : <><AlertTriangle className="h-3 w-3" /> Mật khẩu không khớp</>}
              </p>
            )}
          </FormField>

          <div className="flex justify-end">
            <button type="submit" disabled={pwSaving} className="btn-primary flex items-center gap-2">
              <Shield className="h-4 w-4" />
              {pwSaving ? "Đang đổi..." : "Đổi mật khẩu"}
            </button>
          </div>
        </form>
      </div>

      {/* Account info */}
      <div className="card space-y-4">
        <h3 className="section-title flex items-center gap-2">
          <Info className="h-4 w-4 text-primary-500" /> Thông tin tài khoản
        </h3>
        <div className="divide-y dark:divide-gray-700">
          {[
            { label: "Email",          value: profile?.email },
            { label: "Vai trò",        value: profile?.role === "ADMIN" ? "Quản trị viên" : "Người dùng" },
            { label: "Ngày tham gia",  value: profile?.createdAt
                ? new Date(profile.createdAt).toLocaleDateString("vi-VN", { dateStyle: "long" })
                : "—" },
            { label: "Cập nhật lần cuối", value: profile?.updatedAt
                ? new Date(profile.updatedAt).toLocaleDateString("vi-VN", { dateStyle: "long" })
                : "Chưa cập nhật" },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between py-3 text-sm">
              <span className="text-gray-500 dark:text-gray-400">{label}</span>
              <span className="font-medium dark:text-gray-200">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const settingsTab = (
    <div className="space-y-6 animate-fade-in">
      {/* Theme */}
      <div className="card space-y-4">
        <h3 className="section-title flex items-center gap-2">
          {theme === "dark"
            ? <Moon className="h-4 w-4 text-primary-500" />
            : <Sun  className="h-4 w-4 text-primary-500" />}
          Giao diện
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: "light", label: "Sáng",  icon: Sun,  desc: "Giao diện trắng sáng" },
            { value: "dark",  label: "Tối",   icon: Moon, desc: "Giao diện tối dịu mắt" },
          ].map(({ value, label, icon: Icon, desc }) => (
            <button
              key={value}
              onClick={() => toggleTheme()}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                theme === value
                  ? "border-primary-500 bg-primary-50 dark:bg-primary-900/30"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
              }`}
            >
              <Icon className={`h-6 w-6 mb-2 ${
                theme === value ? "text-primary-600" : "text-gray-400"
              }`} />
              <p className={`font-medium text-sm ${
                theme === value ? "text-primary-700 dark:text-primary-300" : "dark:text-gray-300"
              }`}>{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
              {theme === value && (
                <Check className="h-4 w-4 text-primary-600 mt-2" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Notification preferences */}
      <div className="card space-y-4">
        <h3 className="section-title flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary-500" /> Thông báo
        </h3>
        {[
          { key: "tx",      label: "Giao dịch mới",       desc: "Nhận thông báo khi có giao dịch mới" },
          { key: "budget",  label: "Cảnh báo ngân sách",   desc: "Khi chi tiêu vượt ngưỡng đặt ra" },
          { key: "insight", label: "Phân tích hàng tuần",  desc: "Báo cáo tài chính tự động mỗi tuần" },
        ].map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium dark:text-gray-200">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
            </div>
            <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary-600 cursor-pointer">
              <span className="translate-x-6 inline-block h-4 w-4 transform rounded-full bg-white shadow" />
            </div>
          </div>
        ))}
        <p className="text-xs text-gray-400 flex items-center gap-1.5 pt-1">
          <Info className="h-3.5 w-3.5" />
          Tính năng thông báo đầy đủ sẽ có trong phiên bản sắp tới.
        </p>
      </div>

      {/* App info */}
      <div className="card">
        <h3 className="section-title flex items-center gap-2 mb-4">
          <ChevronRight className="h-4 w-4 text-primary-500" /> Ứng dụng
        </h3>
        <div className="divide-y dark:divide-gray-700 text-sm">
          {[
            { label: "Phiên bản",  value: "1.1.0" },
            { label: "Ngôn ngữ",  value: "Tiếng Việt" },
            { label: "Tiền tệ",   value: "VND (₫)" },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between py-3">
              <span className="text-gray-500 dark:text-gray-400">{label}</span>
              <span className="font-medium dark:text-gray-200">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const tabContent = {
    profile:  profileTab,
    goals:    goalsTab,
    security: securityTab,
    settings: settingsTab,
  };

  // ── Render ───────────────────────────────────────────
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 page-enter">
      {/* Header */}
      <div>
        <h1 className="page-title">Hồ sơ của tôi</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Quản lý thông tin cá nhân, ngân sách và cài đặt tài khoản
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tab nav (sidebar on large, top bar on mobile) */}
        <aside className="lg:w-52 shrink-0">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={activeTab === id ? "tab-btn-active" : "tab-btn-inactive"}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="whitespace-nowrap">{label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Tab content */}
        <main className="flex-1 min-w-0">
          {tabContent[activeTab]}
        </main>
      </div>
    </div>
  );
}

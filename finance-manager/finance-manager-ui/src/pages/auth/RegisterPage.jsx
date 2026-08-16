import { useState } from "react";
import { Link } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { Eye, EyeOff, Wallet, Mail, Lock, User } from "lucide-react";

export default function RegisterPage({ toast }) {
  const { register, loading } = useAuth();

  const [form, setForm] = useState({
    fullName: "", email: "", password: "", confirm: "",
  });
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors,      setErrors]      = useState({});

  const validate = () => {
    const e = {};
    if (!form.fullName.trim())
      e.fullName = "Họ tên là bắt buộc";

    if (!form.email)
      e.email = "Email là bắt buộc";
    else if (!/\S+@\S+\.\S+/.test(form.email))
      e.email = "Email không hợp lệ";

    if (!form.password)
      e.password = "Mật khẩu là bắt buộc";
    else if (form.password.length < 6)
      e.password = "Mật khẩu phải có ít nhất 6 ký tự";

    if (!form.confirm)
      e.confirm = "Vui lòng xác nhận mật khẩu";
    else if (form.confirm !== form.password)
      e.confirm = "Mật khẩu không khớp";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await register(form.fullName, form.email, form.password);
      toast?.success("Đăng ký thành công!");
    } catch (err) {
  console.error("Register error full detail:", err.response ?? err);
  toast?.error(err.response?.data?.message || "Đăng ký thất bại");
}
  };

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const strengthScore = () => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 6)                    s++;
    if (p.length >= 10)                   s++;
    if (/[A-Z]/.test(p))                  s++;
    if (/[0-9]/.test(p))                  s++;
    if (/[^A-Za-z0-9]/.test(p))           s++;
    return s;
  };

  const strengthLabel = ["", "Rất yếu", "Yếu", "Trung bình", "Mạnh", "Rất mạnh"];
  const strengthColor = ["", "bg-red-400", "bg-orange-400",
                             "bg-yellow-400", "bg-blue-400", "bg-green-500"];
  const score = strengthScore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white
                    to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center
                          bg-primary-600 p-3 rounded-2xl mb-4 shadow-lg">
            <Wallet className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">FinManager</h1>
          <p className="text-gray-500 mt-1">Tạo tài khoản miễn phí</p>
        </div>

        {/* card */}
        <div className="card shadow-xl border-0">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Đăng ký</h2>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>

            {/* full name */}
            <div>
              <label className="label">Họ và tên</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2
                                  h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={form.fullName}
                  onChange={handleChange("fullName")}
                  placeholder="Nguyễn Văn A"
                  className={`input pl-10 ${errors.fullName
                    ? "border-red-400 focus:ring-red-400" : ""}`}
                />
              </div>
              {errors.fullName && (
                <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
              )}
            </div>

            {/* email */}
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2
                                  h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type="email"
                  value={form.email}
                  onChange={handleChange("email")}
                  placeholder="you@example.com"
                  className={`input pl-10 ${errors.email
                    ? "border-red-400 focus:ring-red-400" : ""}`}
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* password */}
            <div>
              <label className="label">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2
                                  h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange("password")}
                  placeholder="Tối thiểu 6 ký tự"
                  className={`input pl-10 pr-10 ${errors.password
                    ? "border-red-400 focus:ring-red-400" : ""}`}
                />
                <button type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                             text-gray-400 hover:text-gray-600">
                  {showPass
                    ? <EyeOff className="h-4 w-4" />
                    : <Eye    className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}

              {/* password strength bar */}
              {form.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1,2,3,4,5].map((i) => (
                      <div key={i}
                        className={`h-1 flex-1 rounded-full transition-colors
                                    ${i <= score
                                      ? strengthColor[score]
                                      : "bg-gray-200"}`} />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    Độ mạnh:{" "}
                    <span className="font-medium">{strengthLabel[score]}</span>
                  </p>
                </div>
              )}
            </div>

            {/* confirm password */}
            <div>
              <label className="label">Xác nhận mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2
                                  h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type={showConfirm ? "text" : "password"}
                  value={form.confirm}
                  onChange={handleChange("confirm")}
                  placeholder="Nhập lại mật khẩu"
                  className={`input pl-10 pr-10 ${errors.confirm
                    ? "border-red-400 focus:ring-red-400" : ""}`}
                />
                <button type="button"
                  onClick={() => setShowConfirm((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                             text-gray-400 hover:text-gray-600">
                  {showConfirm
                    ? <EyeOff className="h-4 w-4" />
                    : <Eye    className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirm && (
                <p className="text-red-500 text-xs mt-1">{errors.confirm}</p>
              )}
            </div>

            {/* submit */}
            <button type="submit" disabled={loading}
              className="btn-primary w-full py-2.5
                         flex items-center justify-center gap-2">
              {loading
                ? <><span className="h-4 w-4 border-2 border-white/30
                                      border-t-white rounded-full animate-spin" />
                   Đang tạo tài khoản...</>
                : "Tạo tài khoản"}
            </button>
          </form>

          {/* footer link */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Đã có tài khoản?{" "}
            <Link to="/login"
              className="text-primary-600 hover:text-primary-700 font-medium">
              Đăng nhập
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
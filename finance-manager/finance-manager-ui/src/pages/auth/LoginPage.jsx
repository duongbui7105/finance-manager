import { useState } from "react";
import { Link } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { Eye, EyeOff, Wallet, Mail, Lock } from "lucide-react";

export default function LoginPage({ toast }) {
  const { login, loading } = useAuth();

  const [form,      setForm]      = useState({ email: "", password: "" });
  const [showPass,  setShowPass]  = useState(false);
  const [errors,    setErrors]    = useState({});

  const validate = () => {
    const e = {};
    if (!form.email)                          e.email    = "Email là bắt buộc";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email  = "Email không hợp lệ";
    if (!form.password)                        e.password = "Mật khẩu là bắt buộc";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await login(form.email, form.password);
      toast?.success("Đăng nhập thành công!");
    } catch (err) {
  console.error("Login error full detail:", err.response ?? err);
  toast?.error(err.response?.data?.message || "Đăng nhập thất bại");
}
  };

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

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
          <p className="text-gray-500 mt-1">Quản lý tài chính thông minh</p>
        </div>

        {/* card */}
        <div className="card shadow-xl border-0">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Đăng nhập</h2>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>

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
                  placeholder="••••••••"
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
            </div>

            {/* submit */}
            <button type="submit" disabled={loading}
              className="btn-primary w-full py-2.5 flex items-center justify-center gap-2">
              {loading
                ? <><span className="h-4 w-4 border-2 border-white/30
                                      border-t-white rounded-full animate-spin" />
                   Đang đăng nhập...</>
                : "Đăng nhập"}
            </button>
          </form>

          {/* footer link */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Chưa có tài khoản?{" "}
            <Link to="/register"
              className="text-primary-600 hover:text-primary-700 font-medium">
              Đăng ký ngay
            </Link>
          </p>
        </div>

        {/* demo hint */}
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200
                        rounded-xl text-center">
          <p className="text-xs text-amber-700 font-medium">
            Demo: test@gmail.com / 123456
          </p>
        </div>

      </div>
    </div>
  );
}
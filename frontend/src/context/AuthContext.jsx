import { createContext, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../api/authApi";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null);

function decodeJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64    = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded    = base64.padEnd(
      base64.length + (4 - (base64.length % 4)) % 4, "="
    );
    return JSON.parse(atob(padded));
  } catch (e) {
    console.error("JWT decode failed:", e);
    return null;
  }
}

export function AuthProvider({ children }) {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const handleAuthResponse = useCallback((res) => {
    const payload = res.data;
    const token   = payload?.data?.token ?? payload?.token;
    if (!token) throw new Error("Không nhận được token từ server");

    const decoded  = decodeJwt(token);
    const userData = {
      email:  decoded?.sub    ?? "",
      role:   decoded?.role   ?? "USER",
      userId: decoded?.userId ?? null,
    };
    localStorage.setItem("token", token);
    localStorage.setItem("user",  JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.login({ email, password });
      handleAuthResponse(res);
      navigate("/dashboard");
    } catch (err) {
      const msg = err.response?.data?.message ?? err.message ?? "Đăng nhập thất bại";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [navigate, handleAuthResponse]);

  const register = useCallback(async (fullName, email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.register({ fullName, email, password });
      handleAuthResponse(res);
      navigate("/dashboard");
    } catch (err) {
      const msg = err.response?.data?.message ?? err.message ?? "Đăng ký thất bại";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [navigate, handleAuthResponse]);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  }, [navigate]);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider
      value={{ user, loading, error, login, register, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}
import React, { useState } from 'react';
import { loginWithEmail, logout } from '../firebase';

export default function Login({ onLogin, onForgotPassword, onRegister }: { onLogin: (name: string) => void, onForgotPassword: () => void, onRegister: () => void }) {
  const [username, setUsername] = useState(() => sessionStorage.getItem("draft_login_username") || "");
  const [password, setPassword] = useState(() => sessionStorage.getItem("draft_login_password") || "");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    sessionStorage.setItem("draft_login_username", username);
  }, [username]);

  React.useEffect(() => {
    sessionStorage.setItem("draft_login_password", password);
  }, [password]);

  const handleLogin = async () => {
    if (!username || !password) {
      setError("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    // Fallback for mock login
    if (username === "abc" && password === "1") {
      setError("");
      sessionStorage.removeItem("draft_login_username");
      sessionStorage.removeItem("draft_login_password");
      onLogin("Nguyễn Văn An");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const user = await loginWithEmail(username, password);
      if (user) {
        if (!user.emailVerified) {
          await logout();
          setError("Vui lòng xác thực email của bạn trước khi đăng nhập. Kiểm tra hộp thư đến (hoặc thư rác).");
          return;
        }
        sessionStorage.removeItem("draft_login_username");
        sessionStorage.removeItem("draft_login_password");
        onLogin(user.displayName || "Người dùng");
      }
    } catch (err: any) {
      setError("Tài khoản hoặc mật khẩu không chính xác.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
      {/* Top Navigation */}
      <div className="flex items-center p-4 pb-2 justify-center">
        <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-[-0.015em] text-center">Đăng nhập</h2>
      </div>
      {/* Logo/Header Section */}
      <div className="flex flex-col items-center pt-4 pb-2">
        <div className="size-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-3">
          <span className="material-symbols-outlined text-primary text-4xl">savings</span>
        </div>
        <h1 className="text-slate-900 dark:text-slate-100 tracking-light text-[32px] font-bold leading-tight px-4 text-center">Chào mừng trở lại</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">Quản lý tài chính cá nhân dễ dàng hơn</p>
      </div>
      {/* Login Form */}
      <div className="max-w-[480px] w-full mx-auto px-4 py-6 space-y-4">
        {/* Email/Phone Input */}
        <label className="flex flex-col w-full">
          <p className="text-slate-700 dark:text-slate-300 text-sm font-semibold leading-normal pb-2">Email hoặc Số điện thoại</p>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">mail</span>
            <input 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="form-input flex w-full rounded-xl border border-primary/20 bg-white dark:bg-slate-800 focus:outline-0 focus:ring-2 focus:ring-primary/50 focus:border-primary h-14 pl-12 pr-4 text-base font-normal" 
              placeholder="Nhập tài khoản của bạn" 
              type="text" 
            />
          </div>
        </label>
        {/* Password Input */}
        <label className="flex flex-col w-full">
          <p className="text-slate-700 dark:text-slate-300 text-sm font-semibold leading-normal pb-2">Mật khẩu</p>
          <div className="flex w-full items-stretch relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">lock</span>
            <input 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input flex w-full rounded-xl border border-primary/20 bg-white dark:bg-slate-800 focus:outline-0 focus:ring-2 focus:ring-primary/50 focus:border-primary h-14 pl-12 pr-12 text-base font-normal tracking-tight" 
              placeholder="Nhập mật khẩu" 
              type="password" 
            />
            <button className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors">
              <span className="material-symbols-outlined">visibility</span>
            </button>
          </div>
        </label>
        {/* Forgot Password */}
        <div className="flex justify-between items-center">
          <span className="text-red-500 text-sm font-medium">{error}</span>
          <button onClick={onForgotPassword} className="text-primary text-sm font-semibold hover:underline">Quên mật khẩu?</button>
        </div>
        {/* Login Button */}
        <div className="pt-1.5">
          <button disabled={isLoading} onClick={handleLogin} className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-14 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center">
            {isLoading ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "Đăng nhập"}
          </button>
        </div>
      </div>
      {/* Signup Footer */}
      <div className="mt-4 mb-8 p-4 text-center">
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          Chưa có tài khoản? 
          <button onClick={onRegister} className="text-primary font-bold hover:underline ml-1">Đăng ký với Gmail</button>
        </p>
      </div>
      {/* Decoration Element */}
      <div className="fixed -bottom-20 -left-20 size-64 bg-primary/5 rounded-full blur-3xl -z-10"></div>
      <div className="fixed -top-20 -right-20 size-64 bg-primary/5 rounded-full blur-3xl -z-10"></div>
    </div>
  );
}

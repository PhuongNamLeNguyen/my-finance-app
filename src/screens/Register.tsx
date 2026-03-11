import React, { useState } from 'react';
import { registerWithEmail } from '../firebase';

export default function Register({ onRegister, onBackToLogin }: { onRegister: (name: string) => void, onBackToLogin: () => void }) {
  const [name, setName] = useState(() => sessionStorage.getItem("draft_reg_name") || "");
  const [email, setEmail] = useState(() => sessionStorage.getItem("draft_reg_email") || "");
  const [password, setPassword] = useState(() => sessionStorage.getItem("draft_reg_password") || "");
  const [confirmPassword, setConfirmPassword] = useState(() => sessionStorage.getItem("draft_reg_confirm") || "");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  React.useEffect(() => {
    sessionStorage.setItem("draft_reg_name", name);
  }, [name]);

  React.useEffect(() => {
    sessionStorage.setItem("draft_reg_email", email);
  }, [email]);

  React.useEffect(() => {
    sessionStorage.setItem("draft_reg_password", password);
  }, [password]);

  React.useEffect(() => {
    sessionStorage.setItem("draft_reg_confirm", confirmPassword);
  }, [confirmPassword]);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setError("Vui lòng nhập đầy đủ thông tin.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const user = await registerWithEmail(email, password, name);
      if (user) {
        sessionStorage.removeItem("draft_reg_name");
        sessionStorage.removeItem("draft_reg_email");
        sessionStorage.removeItem("draft_reg_password");
        sessionStorage.removeItem("draft_reg_confirm");
        setIsSuccess(true);
      }
    } catch (err: any) {
      console.error("Registration error:", err);
      if (err.code === 'auth/email-already-in-use') {
        setError("Email này đã được sử dụng.");
      } else if (err.code === 'auth/invalid-email') {
        setError("Email không hợp lệ.");
      } else if (err.code === 'auth/operation-not-allowed') {
        setError("Chức năng đăng ký bằng Email chưa được bật trên Firebase.");
      } else if (err.code === 'auth/weak-password') {
        setError("Mật khẩu quá yếu.");
      } else {
        setError(`Lỗi: ${err.message || "Đã xảy ra lỗi khi đăng ký."}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
      {/* Top Navigation */}
      <div className="flex items-center p-4 pb-2 justify-between">
        <div onClick={onBackToLogin} className="text-primary flex size-12 shrink-0 items-center justify-center cursor-pointer">
          <span className="material-symbols-outlined text-2xl">arrow_back</span>
        </div>
        <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">Đăng ký</h2>
      </div>
      {/* Logo/Header Section */}
      <div className="flex flex-col items-center pt-4 pb-4">
        <div className="size-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-primary text-4xl">person_add</span>
        </div>
        <h1 className="text-slate-900 dark:text-slate-100 tracking-light text-[28px] font-bold leading-tight px-4 text-center">Tạo tài khoản mới</h1>
      </div>
      {/* Register Form */}
      {isSuccess ? (
        <div className="max-w-[480px] w-full mx-auto px-4 py-8 space-y-6 text-center">
          <div className="size-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-green-500 text-4xl">mark_email_read</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Kiểm tra email của bạn</h2>
          <p className="text-slate-600 dark:text-slate-400">
            Chúng tôi đã gửi một email xác thực đến <span className="font-semibold text-slate-900 dark:text-slate-200">{email}</span>. Vui lòng kiểm tra hộp thư đến (hoặc thư rác) và làm theo hướng dẫn để kích hoạt tài khoản.
          </p>
          <button onClick={onBackToLogin} className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-14 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] mt-4">
            Quay lại Đăng nhập
          </button>
        </div>
      ) : (
        <div className="max-w-[480px] w-full mx-auto px-4 py-2 space-y-4">
          {/* Name Input */}
        <label className="flex flex-col w-full">
          <p className="text-slate-700 dark:text-slate-300 text-sm font-semibold leading-normal pb-2">Họ và tên</p>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">person</span>
            <input 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input flex w-full rounded-xl border border-primary/20 bg-white dark:bg-slate-800 focus:outline-0 focus:ring-2 focus:ring-primary/50 focus:border-primary h-14 pl-12 pr-4 text-base font-normal" 
              placeholder="Nhập họ và tên" 
              type="text" 
            />
          </div>
        </label>
        {/* Email Input */}
        <label className="flex flex-col w-full">
          <p className="text-slate-700 dark:text-slate-300 text-sm font-semibold leading-normal pb-2">Email</p>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">mail</span>
            <input 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input flex w-full rounded-xl border border-primary/20 bg-white dark:bg-slate-800 focus:outline-0 focus:ring-2 focus:ring-primary/50 focus:border-primary h-14 pl-12 pr-4 text-base font-normal" 
              placeholder="Nhập email của bạn" 
              type="email" 
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
          </div>
        </label>
        {/* Confirm Password Input */}
        <label className="flex flex-col w-full">
          <p className="text-slate-700 dark:text-slate-300 text-sm font-semibold leading-normal pb-2">Xác nhận mật khẩu</p>
          <div className="flex w-full items-stretch relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">lock_reset</span>
            <input 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="form-input flex w-full rounded-xl border border-primary/20 bg-white dark:bg-slate-800 focus:outline-0 focus:ring-2 focus:ring-primary/50 focus:border-primary h-14 pl-12 pr-12 text-base font-normal tracking-tight" 
              placeholder="Nhập lại mật khẩu" 
              type="password" 
            />
          </div>
        </label>
        
        {error && <div className="text-red-500 text-sm font-medium text-center">{error}</div>}
        
        {/* Register Button */}
        <div className="pt-2">
          <button disabled={isLoading} onClick={handleRegister} className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-14 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center">
            {isLoading ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "Đăng ký"}
          </button>
        </div>
        {/* Divider */}
        <div className="flex items-center gap-4 py-2">
          <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
          <span className="text-slate-500 text-sm">Hoặc tiếp tục với</span>
          <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
        </div>
      </div>
      )}
      {/* Login Footer */}
      <div className="mt-auto p-4 text-center">
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          Đã có tài khoản? 
          <button onClick={onBackToLogin} className="text-primary font-bold hover:underline ml-1">Đăng nhập</button>
        </p>
      </div>
      {/* Decoration Element */}
      <div className="fixed -bottom-20 -left-20 size-64 bg-primary/5 rounded-full blur-3xl -z-10"></div>
      <div className="fixed -top-20 -right-20 size-64 bg-primary/5 rounded-full blur-3xl -z-10"></div>
    </div>
  );
}

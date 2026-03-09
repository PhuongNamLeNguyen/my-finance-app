import React from 'react';

export default function ForgotPassword({ onBack }: { onBack: () => void }) {
  return (
    <div className="relative flex h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased">
      {/* Top Navigation */}
      <div className="flex items-center p-4 pb-2 justify-between max-w-lg mx-auto w-full">
        <button onClick={onBack} aria-label="Quay lại" className="flex size-12 shrink-0 items-center justify-start text-primary transition-colors hover:bg-primary/10 rounded-full">
          <span className="material-symbols-outlined text-[28px]">arrow_back</span>
        </button>
        <h2 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-12">Quên mật khẩu</h2>
      </div>
      {/* Main Content Area */}
      <div className="flex flex-col flex-1 max-w-lg mx-auto w-full px-4 pt-8">
        {/* Header Section */}
        <div className="mb-8">
          <h3 className="text-3xl font-extrabold leading-tight tracking-tight mb-2">Quên mật khẩu?</h3>
          <p className="text-slate-600 dark:text-slate-400 text-base font-normal leading-relaxed">
            Đừng lo lắng! Nhập email liên kết với tài khoản của bạn để nhận mã khôi phục mật khẩu.
          </p>
        </div>
        {/* Illustration / Branding Element */}
        <div className="flex justify-center mb-10">
          <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-6xl">lock_reset</span>
          </div>
        </div>
        {/* Form Section */}
        <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1" htmlFor="email">
              Địa chỉ Email
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">mail</span>
              <input className="form-input flex w-full rounded-xl border border-primary/20 bg-white dark:bg-background-dark/50 focus:border-primary focus:ring-2 focus:ring-primary/20 h-14 pl-12 pr-4 text-base font-normal placeholder:text-slate-400 transition-all" id="email" name="email" placeholder="example@email.com" type="email" />
            </div>
          </div>
          <div className="pt-2">
            <button className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl h-14 bg-primary text-white text-base font-bold leading-normal tracking-wide shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-[0.98]">
              Gửi yêu cầu
            </button>
          </div>
        </div>
        {/* Footer Help */}
        <div className="mt-auto pb-10 text-center">
          <p className="text-slate-500 text-sm">
            Bạn đã nhớ ra mật khẩu? 
            <button onClick={onBack} className="text-primary font-bold hover:underline ml-1">Đăng nhập ngay</button>
          </p>
        </div>
      </div>
      {/* Decorative Elements */}
      <div className="fixed top-0 right-0 -z-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
      <div className="fixed bottom-0 left-0 -z-10 w-48 h-48 bg-primary/5 rounded-full blur-2xl -ml-24 -mb-24"></div>
    </div>
  );
}

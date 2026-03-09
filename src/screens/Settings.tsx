import React, { useState, useEffect } from "react";
import { auth } from "../firebase";
import { updatePassword } from "firebase/auth";

export default function Settings({ onLogout, userName, onUserNameChange, userEmail }: { onLogout: () => void, userName: string, onUserNameChange: (name: string) => void, userEmail: string | null }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [themeColor, setThemeColor] = useState("#cf6317");

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const handleNameChange = () => {
    const newName = prompt("Nhập tên mới:", userName);
    if (newName) onUserNameChange(newName);
  };

  const handleThemeChange = (color: string) => {
    setThemeColor(color);
    document.documentElement.style.setProperty('--primary-color', color);
  };

  const handleChangePassword = async () => {
    if (!auth.currentUser) {
      alert("Bạn cần đăng nhập để thực hiện chức năng này.");
      return;
    }
    const newPassword = prompt("Nhập mật khẩu mới (ít nhất 6 ký tự):");
    if (!newPassword) return;
    if (newPassword.length < 6) {
      alert("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }
    try {
      await updatePassword(auth.currentUser, newPassword);
      alert("Đổi mật khẩu thành công!");
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        alert("Vì lý do bảo mật, vui lòng đăng xuất và đăng nhập lại trước khi đổi mật khẩu.");
      } else {
        alert("Đã xảy ra lỗi khi đổi mật khẩu: " + error.message);
      }
    }
  };

  const handleSupport = () => {
    alert("Chức năng hỗ trợ & phản hồi đang được phát triển.");
  };

  const handleFontChange = () => {
    alert("Chức năng đổi phông chữ đang được phát triển.");
  };

  return (
    <div className="relative flex min-h-full w-full flex-col max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-xl pb-6">
      <div className="sticky top-0 z-10 flex items-center bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md p-4 pb-2 justify-center border-b border-primary/10">
        <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-[-0.015em] text-center">
          Cài đặt
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex p-6 border-b border-primary/5">
          <div className="flex w-full items-center gap-4">
            <div className="relative group">
              <div
                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-20 border-2 border-primary/20 bg-slate-200 dark:bg-slate-800"
                style={{
                  backgroundImage: `url('https://placehold.co/150x150?text=Avatar')`,
                }}
              ></div>
              <div className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-1 border-2 border-background-light dark:border-background-dark">
                <span className="material-symbols-outlined text-sm !text-[16px]">
                  edit
                </span>
              </div>
            </div>
            <div className="flex flex-col justify-center">
              <p className="text-slate-900 dark:text-slate-100 text-xl font-bold leading-tight tracking-[-0.015em]">
                {userName}
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-normal">
                {userEmail || "Chưa cập nhật email"}
              </p>
              <span className="mt-1 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full w-fit">
                Thành viên Premium
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-6 pt-4">
          <section>
            <h3 className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider px-6 mb-2">
              Thông tin cá nhân
            </h3>
            <div className="space-y-1">
              <button onClick={handleNameChange} className="w-full flex items-center gap-4 px-6 py-3 hover:bg-primary/5 transition-colors group">
                <div className="text-primary flex items-center justify-center rounded-lg bg-primary/10 shrink-0 size-10">
                  <span className="material-symbols-outlined">person</span>
                </div>
                <div className="flex flex-1 items-center justify-between border-b border-primary/5 pb-1 group-last:border-none">
                  <p className="text-slate-800 dark:text-slate-200 text-base font-medium">
                    Đổi tên người dùng
                  </p>
                  <span className="material-symbols-outlined text-slate-400">
                    chevron_right
                  </span>
                </div>
              </button>
            </div>
          </section>

          <section>
            <h3 className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider px-6 mb-2">
              Giao diện
            </h3>
            <div className="space-y-1">
              <div className="w-full flex items-center gap-4 px-6 py-3">
                <div className="text-primary flex items-center justify-center rounded-lg bg-primary/10 shrink-0 size-10">
                  <span className="material-symbols-outlined">dark_mode</span>
                </div>
                <div className="flex flex-1 items-center justify-between border-b border-primary/5 pb-1">
                  <p className="text-slate-800 dark:text-slate-200 text-base font-medium">
                    Chế độ tối
                  </p>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input 
                      className="sr-only peer" 
                      type="checkbox" 
                      checked={isDarkMode}
                      onChange={(e) => setIsDarkMode(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                  </div>
                </div>
              </div>

              <div className="w-full flex items-center gap-4 px-6 py-3">
                <div className="text-primary flex items-center justify-center rounded-lg bg-primary/10 shrink-0 size-10">
                  <span className="material-symbols-outlined">palette</span>
                </div>
                <div className="flex flex-1 flex-col border-b border-primary/5 pb-1">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-slate-800 dark:text-slate-200 text-base font-medium">
                      Màu chủ đề
                    </p>
                    <span className="text-xs text-primary font-bold">
                      Nâu Đất
                    </span>
                  </div>
                  <div className="flex gap-3 mb-2">
                    {["#cf6317", "#10b981", "#3b82f6", "#ef4444", "#8b5cf6"].map(color => (
                      <div 
                        key={color}
                        onClick={() => handleThemeChange(color)}
                        className={`size-6 rounded-full cursor-pointer ${themeColor === color ? 'border-2 border-primary ring-2 ring-primary/20' : ''}`}
                        style={{ backgroundColor: color }}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>

              <button onClick={handleFontChange} className="w-full flex items-center gap-4 px-6 py-3 hover:bg-primary/5 transition-colors group">
                <div className="text-primary flex items-center justify-center rounded-lg bg-primary/10 shrink-0 size-10">
                  <span className="material-symbols-outlined">text_fields</span>
                </div>
                <div className="flex flex-1 items-center justify-between border-b border-primary/5 pb-1 group-last:border-none">
                  <p className="text-slate-800 dark:text-slate-200 text-base font-medium">
                    Phông chữ & Cỡ chữ
                  </p>
                  <span className="material-symbols-outlined text-slate-400">
                    chevron_right
                  </span>
                </div>
              </button>
            </div>
          </section>

          <section>
            <h3 className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider px-6 mb-2">
              Bảo mật
            </h3>
            <div className="space-y-1">
              <button onClick={handleChangePassword} className="w-full flex items-center gap-4 px-6 py-3 hover:bg-primary/5 transition-colors group">
                <div className="text-primary flex items-center justify-center rounded-lg bg-primary/10 shrink-0 size-10">
                  <span className="material-symbols-outlined">lock</span>
                </div>
                <div className="flex flex-1 items-center justify-between border-b border-primary/5 pb-1">
                  <p className="text-slate-800 dark:text-slate-200 text-base font-medium">
                    Đổi mật khẩu
                  </p>
                  <span className="material-symbols-outlined text-slate-400">
                    chevron_right
                  </span>
                </div>
              </button>
              <button className="w-full flex items-center gap-4 px-6 py-3 hover:bg-primary/5 transition-colors group">
                <div className="text-primary flex items-center justify-center rounded-lg bg-primary/10 shrink-0 size-10">
                  <span className="material-symbols-outlined">face</span>
                </div>
                <div className="flex flex-1 items-center justify-between border-b border-primary/5 pb-1 group-last:border-none">
                  <p className="text-slate-800 dark:text-slate-200 text-base font-medium">
                    PIN / FaceID
                  </p>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                  </div>
                </div>
              </button>
            </div>
          </section>

          <section>
            <h3 className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider px-6 mb-2">
              Khác
            </h3>
            <div className="space-y-1">
              <button onClick={handleSupport} className="w-full flex items-center gap-4 px-6 py-3 hover:bg-primary/5 transition-colors group">
                <div className="text-primary flex items-center justify-center rounded-lg bg-primary/10 shrink-0 size-10">
                  <span className="material-symbols-outlined">
                    contact_support
                  </span>
                </div>
                <div className="flex flex-1 items-center justify-between">
                  <p className="text-slate-800 dark:text-slate-200 text-base font-medium">
                    Hỗ trợ & Phản hồi
                  </p>
                  <span className="material-symbols-outlined text-slate-400">
                    chevron_right
                  </span>
                </div>
              </button>
              <button onClick={onLogout} className="w-full flex items-center gap-4 px-6 py-6 mt-4">
                <div className="text-red-500 flex flex-1 items-center justify-center gap-2 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
                  <span className="material-symbols-outlined">logout</span>
                  <p className="font-bold">Đăng xuất</p>
                </div>
              </button>
            </div>
          </section>

          <div className="text-center pb-8">
            <p className="text-slate-400 text-xs">
              Phiên bản 2.4.0 (Build 102)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

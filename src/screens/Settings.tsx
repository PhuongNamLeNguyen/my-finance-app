import React, { useState, useEffect, useRef } from "react";
import { auth, storage } from "../firebase";
import { updatePassword, updateProfile, EmailAuthProvider, reauthenticateWithCredential, onAuthStateChanged } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Transaction } from "../types";
import TransactionItem from "../components/TransactionItem";
import { restoreTransaction, permanentlyDeleteTransaction } from "../services/db";
import { motion, AnimatePresence } from "framer-motion";

export default function Settings({ onLogout, userName, onUserNameChange, userEmail, deletedTransactions, onRestoreTransaction, onPermanentDeleteTransaction, themeColor, onThemeColorChange }: { onLogout: () => void, userName: string, onUserNameChange: (name: string) => void, userEmail: string | null, deletedTransactions: Transaction[], onRestoreTransaction: (t: Transaction) => void, onPermanentDeleteTransaction: (t: Transaction) => void, themeColor: string, onThemeColorChange: (color: string) => void }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => {
    if (auth.currentUser?.photoURL) return auth.currentUser.photoURL;
    if (!auth.currentUser) return localStorage.getItem("mock_avatar");
    return null;
  });
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<{t: Transaction, resolve: (value: boolean) => void} | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user?.photoURL) {
        setAvatarUrl(user.photoURL);
      } else if (!user) {
        setAvatarUrl(localStorage.getItem("mock_avatar"));
      }
    });
    return () => unsubscribe();
  }, []);

  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState(() => sessionStorage.getItem("draft_pwd_old") || "");
  const [newPassword, setNewPassword] = useState(() => sessionStorage.getItem("draft_pwd_new") || "");
  const [confirmPassword, setConfirmPassword] = useState(() => sessionStorage.getItem("draft_pwd_confirm") || "");
  const [passwordError, setPasswordError] = useState("");
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  useEffect(() => {
    sessionStorage.setItem("draft_pwd_old", oldPassword);
  }, [oldPassword]);

  useEffect(() => {
    sessionStorage.setItem("draft_pwd_new", newPassword);
  }, [newPassword]);

  useEffect(() => {
    sessionStorage.setItem("draft_pwd_confirm", confirmPassword);
  }, [confirmPassword]);

  const themeColorNames: Record<string, string> = {
    "#cf6317": "Nâu Đất",
    "#10b981": "Xanh Ngọc",
    "#3b82f6": "Xanh Dương",
    "#ef4444": "Đỏ",
    "#8b5cf6": "Tím"
  };

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
    onThemeColorChange(color);
  };

  const handleChangePassword = () => {
    if (!auth.currentUser) {
      alert("Bạn cần đăng nhập để thực hiện chức năng này.");
      return;
    }
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError("");
    setIsChangePasswordModalOpen(true);
  };

  const handleSubmitPasswordChange = async () => {
    if (!auth.currentUser || !auth.currentUser.email) {
      setPasswordError("Tài khoản không hợp lệ hoặc chưa có email.");
      return;
    }
    
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError("Vui lòng điền đầy đủ thông tin.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Mật khẩu mới không khớp.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }

    setIsSubmittingPassword(true);
    setPasswordError("");

    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, oldPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      await updatePassword(auth.currentUser, newPassword);
      alert("Đổi mật khẩu thành công! Vui lòng đăng nhập lại.");
      sessionStorage.removeItem("draft_pwd_old");
      sessionStorage.removeItem("draft_pwd_new");
      sessionStorage.removeItem("draft_pwd_confirm");
      setIsChangePasswordModalOpen(false);
      onLogout();
    } catch (error: any) {
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setPasswordError("Mật khẩu cũ không đúng.");
      } else if (error.code === 'auth/requires-recent-login') {
        setPasswordError("Vui lòng đăng xuất và đăng nhập lại trước khi đổi mật khẩu.");
      } else {
        setPasswordError("Đã xảy ra lỗi: " + error.message);
      }
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const handleSupport = () => {
    alert("Chức năng hỗ trợ & phản hồi đang được phát triển.");
  };

  const handleFontChange = () => {
    alert("Chức năng đổi phông chữ đang được phát triển.");
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!auth.currentUser) {
      // Handle mock user
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setAvatarUrl(base64String);
        localStorage.setItem("mock_avatar", base64String);
        alert("Cập nhật ảnh đại diện thành công (chế độ dùng thử)!");
      };
      reader.readAsDataURL(file);
      if (e.target) e.target.value = '';
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const storageRef = ref(storage, `avatars/${auth.currentUser.uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await updateProfile(auth.currentUser, { photoURL: url });
      setAvatarUrl(url);
      alert("Cập nhật ảnh đại diện thành công!");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      alert("Lỗi khi tải ảnh lên. Vui lòng thử lại.");
    } finally {
      setIsUploadingAvatar(false);
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleRestore = async (t: Transaction) => {
    onRestoreTransaction(t);
  };

  const handlePermanentDelete = (t: Transaction): Promise<boolean> => {
    return new Promise((resolve) => {
      setTransactionToDelete({ t, resolve });
    });
  };

  const confirmPermanentDelete = () => {
    if (transactionToDelete) {
      onPermanentDeleteTransaction(transactionToDelete.t);
      transactionToDelete.resolve(true);
      setTransactionToDelete(null);
    }
  };

  const cancelPermanentDelete = () => {
    if (transactionToDelete) {
      transactionToDelete.resolve(false);
      setTransactionToDelete(null);
    }
  };

  if (showDeleted) {
    return (
      <div className="relative flex min-h-full w-full flex-col max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-xl pb-6">
        <div className="sticky top-0 z-50 flex items-center bg-background-light dark:bg-background-dark p-4 pb-2 justify-between border-b border-primary/10">
          <button onClick={() => setShowDeleted(false)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-[-0.015em] text-center">
            Giao dịch đã xóa
          </h2>
          <div className="w-10"></div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {deletedTransactions.length === 0 ? (
            <p className="text-center text-slate-500 mt-10">Không có giao dịch nào đã xóa.</p>
          ) : (
            deletedTransactions.map(t => (
              <TransactionItem 
                key={t.id} 
                transaction={t} 
                onClick={() => {}} 
                onDelete={handlePermanentDelete}
                onRestore={handleRestore}
              />
            ))
          )}
        </div>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {transactionToDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
              >
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4 mx-auto">
                  <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-2xl">warning</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 text-center mb-2">
                  Xóa vĩnh viễn giao dịch?
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-center mb-6 text-sm">
                  Hành động này không thể hoàn tác. Giao dịch sẽ bị xóa khỏi hệ thống vĩnh viễn.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={cancelPermanentDelete}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={confirmPermanentDelete}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors"
                  >
                    Xóa
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-full w-full flex-col max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-xl pb-6">
      <div className="sticky top-0 z-50 flex items-center bg-background-light dark:bg-background-dark p-4 pb-2 justify-center border-b border-primary/10">
        <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-[-0.015em] text-center">
          Cài đặt
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex p-6 border-b border-primary/5">
          <div className="flex w-full items-center gap-4">
            <label className="relative group cursor-pointer block">
              <div
                className={`bg-center bg-no-repeat aspect-square bg-cover rounded-full size-20 border-2 border-primary/20 bg-slate-200 dark:bg-slate-800 ${isUploadingAvatar ? 'opacity-50' : ''}`}
                style={{
                  backgroundImage: `url('${avatarUrl || 'https://placehold.co/150x150?text=Avatar'}')`,
                }}
              ></div>
              {isUploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              <div className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-1 border-2 border-background-light dark:border-background-dark">
                <span className="material-symbols-outlined text-sm !text-[16px]">
                  edit
                </span>
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
            </label>
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
                      {themeColorNames[themeColor] || "Tuỳ chỉnh"}
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
              Dữ liệu
            </h3>
            <div className="space-y-1">
              <button onClick={() => setShowDeleted(true)} className="w-full flex items-center gap-4 px-6 py-3 hover:bg-primary/5 transition-colors group">
                <div className="text-primary flex items-center justify-center rounded-lg bg-primary/10 shrink-0 size-10">
                  <span className="material-symbols-outlined">delete</span>
                </div>
                <div className="flex flex-1 items-center justify-between border-b border-primary/5 pb-1 group-last:border-none">
                  <p className="text-slate-800 dark:text-slate-200 text-base font-medium">
                    Giao dịch đã xóa
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
            <p className="text-slate-400 text-xs mt-1">
              Tạo ra bởi PhuongLNN
            </p>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <AnimatePresence>
        {isChangePasswordModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                <span className="material-symbols-outlined text-primary text-2xl">lock_reset</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 text-center mb-6">
                Đổi mật khẩu
              </h3>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mật khẩu cũ</label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 border-none text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Nhập mật khẩu cũ"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mật khẩu mới</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 border-none text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Nhập mật khẩu mới"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Xác nhận mật khẩu mới</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 border-none text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Nhập lại mật khẩu mới"
                  />
                </div>
                {passwordError && (
                  <p className="text-red-500 text-sm text-center">{passwordError}</p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsChangePasswordModalOpen(false)}
                  disabled={isSubmittingPassword}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSubmitPasswordChange}
                  disabled={isSubmittingPassword}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-primary hover:bg-primary/90 transition-colors flex items-center justify-center disabled:opacity-50"
                >
                  {isSubmittingPassword ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    "Xác nhận"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

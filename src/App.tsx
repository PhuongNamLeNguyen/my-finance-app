import React, { useState, useEffect } from "react";
import { Transaction } from "./types";
import { analyzeReceipt } from "./services/ai";
import { resizeImage } from "./utils/image";
import BottomNav from "./components/BottomNav";
import UploadSheet from "./components/UploadSheet";
import TransactionDetailModal from "./components/TransactionDetailModal";
import Home from "./screens/Home";
import Transactions from "./screens/Transactions";
import Settings from "./screens/Settings";
import Login from "./screens/Login";
import Register from "./screens/Register";
import ForgotPassword from "./screens/ForgotPassword";
import { auth, logout } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function App() {
  const [userName, setUserName] = useState(() => {
    return localStorage.getItem("userName") || "Nguyễn Văn An";
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return document.cookie.includes("isAuthenticated=true");
  });
  const [authScreen, setAuthScreen] = useState<"login" | "forgot" | "register">("login");
  const [activeTab, setActiveTab] = useState("home");
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isUploadSheetOpen, setIsUploadSheetOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Prevent auto-login if email is not verified (for password accounts)
        const isPasswordAccount = user.providerData.some(p => p.providerId === 'password');
        if (isPasswordAccount && !user.emailVerified) {
          logout();
          setIsAuthenticated(false);
          return;
        }

        setIsAuthenticated(true);
        setUserId(user.uid);
        setUserEmail(user.email);
        document.cookie = "isAuthenticated=true; path=/; max-age=31536000"; // 1 year
        if (user.displayName) {
          setUserName(user.displayName);
          localStorage.setItem(`userName_${user.uid}`, user.displayName);
        }
      } else {
        // Only log out if there's no cookie (to support the mock login)
        if (!document.cookie.includes("isAuthenticated=true")) {
          setIsAuthenticated(false);
          setUserId(null);
          setUserEmail(null);
        } else {
          setUserId("mock-user");
          setUserEmail("mock@example.com");
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Load transactions from localStorage when userId changes
  useEffect(() => {
    if (!userId) return;
    const savedName = localStorage.getItem(`userName_${userId}`);
    if (savedName) setUserName(savedName);

    const key = `transactions_${userId}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        setTransactions(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved transactions");
        setTransactions([]);
      }
    } else {
      setTransactions([]);
    }
  }, [userId]);

  // Save transactions to localStorage when changed
  useEffect(() => {
    if (!userId) return;
    const key = `transactions_${userId}`;
    localStorage.setItem(key, JSON.stringify(transactions));
  }, [transactions, userId]);

  // Save userName to localStorage when changed
  useEffect(() => {
    if (!userId) return;
    localStorage.setItem(`userName_${userId}`, userName);
  }, [userName, userId]);

  const handleUpload = async (files: File[]) => {
    setIsUploadSheetOpen(false);
    setIsProcessing(true);
    try {
      const uploadPromises = files.map(async (file) => {
        try {
          // Resize image to max 1024x1024 and convert to JPEG
          const base64DataUrl = await resizeImage(file, 1024, 1024);
          const base64Image = base64DataUrl.split(",")[1];

          // We pass "image/jpeg" because resizeImage converts to JPEG
          const aiResult = await analyzeReceipt(base64Image, "image/jpeg");

          return {
            id: Math.random().toString(36).substring(2, 15),
            date: aiResult.date || new Date().toISOString(),
            amount: aiResult.amount || 0,
            content: aiResult.content || "Không rõ",
            category: aiResult.category || "Khác",
            imageUrl: base64DataUrl,
          } as Transaction;
        } catch (error) {
          console.error("Lỗi khi phân tích hóa đơn:", error);
          return null;
        }
      });

      const results = await Promise.all(uploadPromises);
      const newTransactions = results.filter((t): t is Transaction => t !== null);

      if (newTransactions.length > 0) {
        setTransactions((prev) => [...newTransactions, ...prev]);
        showToast(`Đã thêm ${newTransactions.length} giao dịch thành công!`);
      } else {
        showToast("Không có giao dịch nào được thêm thành công.");
      }
    } catch (error) {
      showToast("Lỗi khi đọc file");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateTransaction = (updated: Transaction) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === updated.id ? updated : t)),
    );
    setSelectedTransaction(updated);
  };

  const handleLogin = (name: string) => {
    setUserName(name);
    setIsAuthenticated(true);
    document.cookie = "isAuthenticated=true; path=/; max-age=31536000"; // 1 year
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error(e);
    }
    setIsAuthenticated(false);
    document.cookie = "isAuthenticated=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  };

  if (!isAuthenticated) {
    if (authScreen === "forgot") {
      return <ForgotPassword onBack={() => setAuthScreen("login")} />;
    }
    if (authScreen === "register") {
      return <Register onRegister={handleLogin} onBackToLogin={() => setAuthScreen("login")} />;
    }
    return (
      <Login
        onLogin={handleLogin}
        onForgotPassword={() => setAuthScreen("forgot")}
        onRegister={() => setAuthScreen("register")}
      />
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
      {/* Screens */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
        {activeTab === "home" && (
          <Home
            transactions={transactions}
            userName={userName}
            onUploadClick={() => setIsUploadSheetOpen(true)}
            onTransactionClick={setSelectedTransaction}
            onAddTransaction={(t) => {
              setTransactions((prev) => [t, ...prev]);
              showToast("Đã thêm giao dịch thành công!");
            }}
            onAddIncome={(t) => {
              setTransactions((prev) => [t, ...prev]);
              showToast("Đã thêm nguồn thu thành công!");
            }}
          />
        )}
        {activeTab === "transactions" && (
          <Transactions
            transactions={transactions}
            onTransactionClick={setSelectedTransaction}
          />
        )}
        {activeTab === "settings" && <Settings onLogout={handleLogout} userName={userName} onUserNameChange={setUserName} userEmail={userEmail} />}
      </div>

      {/* Overlays */}
      <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />

      <UploadSheet
        isOpen={isUploadSheetOpen}
        onClose={() => setIsUploadSheetOpen(false)}
        onUpload={handleUpload}
      />

      <TransactionDetailModal
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        onUpdate={handleUpdateTransaction}
      />

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="font-bold text-slate-900 dark:text-slate-100">
              Đang phân tích hóa đơn AI...
            </p>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[70] bg-slate-800 text-white px-6 py-3 rounded-full shadow-lg text-sm font-medium animate-in slide-in-from-top fade-in duration-300">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

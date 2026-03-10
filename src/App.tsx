import React, { useState, useEffect, useCallback } from "react";
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
import { subscribeToTransactions, saveTransaction, updateTransaction as updateDbTransaction, deleteTransaction, getTransactionByImageHash, restoreTransaction, permanentlyDeleteTransaction } from "./services/db";
import { uploadReceiptImage } from "./services/storage";

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
        setActiveTab("home"); // Default to home after login
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
          setActiveTab("home"); // Default to home after login
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Load transactions from Firestore when userId changes
  useEffect(() => {
    if (!userId) return;
    const savedName = localStorage.getItem(`userName_${userId}`);
    if (savedName) setUserName(savedName);

    // Migrate local storage data to Firestore if needed
    const key = `transactions_${userId}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const localTransactions: Transaction[] = JSON.parse(saved);
        if (localTransactions.length > 0) {
          localTransactions.forEach(t => {
            saveTransaction(userId, t).catch(console.error);
          });
          localStorage.removeItem(key); // Clear local storage after migration
        }
      } catch (e) {
        console.error("Failed to parse saved transactions");
      }
    }

    const unsubscribe = subscribeToTransactions(userId, (data) => {
      setTransactions(data);
    });

    return () => unsubscribe();
  }, [userId]);

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

          // Generate hash for the image to avoid re-processing
          const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(base64Image));
          const imageHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

          if (userId) {
            const existingTx = await getTransactionByImageHash(userId, imageHash);
            if (existingTx) {
              console.log("Image already processed, skipping AI analysis.");
              // We can either return the existing transaction or create a new one with the same AI result
              // Let's create a new transaction with the same AI result but a new ID
              const txId = Math.random().toString(36).substring(2, 15);
              const newTx = {
                ...existingTx,
                id: txId,
                date: new Date().toISOString(), // Use current date for the new transaction
              };
              await saveTransaction(userId, newTx);
              return newTx;
            }
          }

          // We pass "image/jpeg" because resizeImage converts to JPEG
          const aiResult = await analyzeReceipt(base64Image, "image/jpeg");

          const txId = Math.random().toString(36).substring(2, 15);
          let imageUrl = base64DataUrl;

          if (userId) {
            try {
              const filename = `receipt_${txId}.jpg`;
              imageUrl = await uploadReceiptImage(userId, base64DataUrl, filename);
            } catch (uploadError) {
              console.error("Lỗi khi upload ảnh lên storage:", uploadError);
              // Fallback to base64 if upload fails, or you could throw an error
            }
          }

          const newTx = {
            id: txId,
            date: aiResult.date || new Date().toISOString(),
            amount: aiResult.amount || 0,
            content: aiResult.content || "Không rõ",
            category: aiResult.category || "Khác",
            imageUrl: imageUrl,
            imageHash: imageHash,
            type: "expense"
          } as Transaction;
          
          if (userId) {
            await saveTransaction(userId, newTx);
          }
          return newTx;
        } catch (error) {
          console.error("Lỗi khi phân tích hóa đơn:", error);
          return null;
        }
      });

      const results = await Promise.all(uploadPromises);
      const newTransactions = results.filter((t): t is Transaction => t !== null);

      if (newTransactions.length > 0) {
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

  const handleUpdateTransaction = async (updated: Transaction) => {
    if (userId) {
      await updateDbTransaction(userId, updated);
    }
    setSelectedTransaction(updated);
  };

  const handleLogin = (name: string) => {
    setUserName(name);
    setIsAuthenticated(true);
    setActiveTab("home"); // Default to home after login
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

  const handleAddTransaction = useCallback(async (t: Transaction) => {
    if (userId) {
      await saveTransaction(userId, t);
    }
    showToast("Đã thêm giao dịch thành công!");
  }, [userId]);

  const handleAddIncome = useCallback(async (t: Transaction) => {
    if (userId) {
      await saveTransaction(userId, t);
    }
    showToast("Đã thêm nguồn thu thành công!");
  }, [userId]);

  const handleDeleteTransaction = useCallback(async (t: Transaction) => {
    if (userId && userId !== "mock-user") {
      await deleteTransaction(userId, t.id);
    } else {
      setTransactions(prev => prev.map(tx => tx.id === t.id ? { ...tx, isDeleted: true } : tx));
    }
    showToast("Đã xóa giao dịch!");
  }, [userId]);

  const handleRestoreTransaction = useCallback(async (t: Transaction) => {
    if (userId && userId !== "mock-user") {
      await restoreTransaction(userId, t.id);
    } else {
      setTransactions(prev => prev.map(tx => tx.id === t.id ? { ...tx, isDeleted: false } : tx));
    }
    showToast("Đã khôi phục giao dịch!");
  }, [userId]);

  const handlePermanentDeleteTransaction = useCallback(async (t: Transaction) => {
    if (userId && userId !== "mock-user") {
      await permanentlyDeleteTransaction(userId, t.id);
    } else {
      setTransactions(prev => prev.filter(tx => tx.id !== t.id));
    }
    showToast("Đã xóa vĩnh viễn giao dịch!");
  }, [userId]);

  const handleUploadClick = useCallback(() => {
    setIsUploadSheetOpen(true);
  }, []);

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
            transactions={transactions.filter(t => !t.isDeleted)}
            userName={userName}
            onUploadClick={handleUploadClick}
            onTransactionClick={setSelectedTransaction}
            onAddTransaction={handleAddTransaction}
            onAddIncome={handleAddIncome}
            onDeleteTransaction={handleDeleteTransaction}
          />
        )}
        {activeTab === "transactions" && (
          <Transactions
            transactions={transactions.filter(t => !t.isDeleted)}
            onTransactionClick={setSelectedTransaction}
            onDeleteTransaction={handleDeleteTransaction}
          />
        )}
        {activeTab === "settings" && <Settings onLogout={handleLogout} userName={userName} onUserNameChange={setUserName} userEmail={userEmail} deletedTransactions={transactions.filter(t => t.isDeleted)} onRestoreTransaction={handleRestoreTransaction} onPermanentDeleteTransaction={handlePermanentDeleteTransaction} />}
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
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

import React from "react";
import { Transaction } from "../types";
import { format } from "date-fns";

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  onUpdate: (t: Transaction) => void;
}

export default function TransactionDetailModal({
  transaction,
  onClose,
  onUpdate,
}: TransactionDetailModalProps) {
  if (!transaction) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative flex h-full max-h-[90vh] w-full max-w-lg flex-col bg-background-light dark:bg-background-dark rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-primary/10">
          <button
            onClick={onClose}
            className="flex size-10 items-center justify-center rounded-full hover:bg-primary/10 cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-slate-900 dark:text-slate-100">
              close
            </span>
          </button>
          <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
            Chi tiết hóa đơn
          </h2>
          <div className="flex w-10 items-center justify-end">
            <button className="flex size-10 cursor-pointer items-center justify-center rounded-full hover:bg-primary/10 text-slate-900 dark:text-slate-100 transition-colors">
              <span className="material-symbols-outlined">share</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="flex w-full bg-background-light dark:bg-background-dark py-4 px-4">
            <div className="w-full overflow-hidden rounded-xl border border-primary/20 shadow-sm aspect-[3/4] relative">
              <div
                className="absolute inset-0 bg-center bg-no-repeat bg-contain bg-slate-200 dark:bg-slate-800"
                style={{
                  backgroundImage: `url(${transaction.imageUrl || "https://placehold.co/400x600?text=No+Image"})`,
                }}
              ></div>
            </div>
          </div>

          <div className="px-6 py-4">
            <h3 className="text-primary text-sm font-bold uppercase tracking-wider mb-4">
              Thông tin tóm tắt
            </h3>
            <div className="space-y-1">
              <div className="flex justify-between items-center py-3 border-b border-primary/5">
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                  Nội dung
                </p>
                <p className="text-slate-900 dark:text-slate-100 text-sm font-bold text-right">
                  {transaction.content}
                </p>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-primary/5">
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                  Số tiền
                </p>
                <p className="text-primary text-lg font-bold text-right">
                  {transaction.amount.toLocaleString("vi-VN")}đ
                </p>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-primary/5">
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                  Ngày giờ
                </p>
                <p className="text-slate-900 dark:text-slate-100 text-sm font-medium text-right">
                  {format(new Date(transaction.date), "HH:mm - dd/MM/yyyy")}
                </p>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-primary/5">
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                  Danh mục
                </p>
                <select
                  value={transaction.category}
                  onChange={(e) =>
                    onUpdate({ ...transaction, category: e.target.value as any })
                  }
                  className="text-slate-900 dark:text-slate-100 text-sm font-medium text-right font-bold bg-transparent border-none focus:ring-0 p-0"
                  dir="rtl"
                >
                  {[
                    "Mua sắm",
                    "Ăn uống",
                    "Gia đình",
                    "Di chuyển",
                    "Quà tặng",
                    "Y tế",
                    "Học tập",
                    "Khác",
                  ].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-primary/5">
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                  Mã giao dịch
                </p>
                <p className="text-slate-900 dark:text-slate-100 text-sm font-medium text-right font-mono">
                  {transaction.id.substring(0, 12).toUpperCase()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

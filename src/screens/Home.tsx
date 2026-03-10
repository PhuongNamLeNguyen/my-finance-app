import React, { useState, useMemo, useEffect } from "react";
import { Transaction } from "../types";
import TransactionItem from "../components/TransactionItem";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subWeeks,
  subMonths,
  subYears,
  isWithinInterval,
} from "date-fns";

interface HomeProps {
  transactions: Transaction[];
  userName: string;
  onUploadClick: () => void;
  onTransactionClick: (t: Transaction) => void;
  onAddTransaction: (t: Transaction) => void;
  onAddIncome: (t: Transaction) => void;
  onDeleteTransaction: (t: Transaction) => void;
}

const COLORS = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];

export default React.memo(function Home({
  transactions,
  userName,
  onUploadClick,
  onTransactionClick,
  onAddTransaction,
  onAddIncome,
  onDeleteTransaction,
}: HomeProps) {
  const [filter, setFilter] = useState<"Tuần" | "Tháng" | "Năm">("Tuần");
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  const [isManualIncomeOpen, setIsManualIncomeOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("Tất cả");
  const categories = [
    "Tất cả",
    "Ăn uống",
    "Học tập",
    "Di chuyển",
    "Sinh hoạt",
    "Y tế",
    "Quà tặng",
    "Thời trang",
    "Phí phát sinh",
    "Khác",
  ];

  const filteredTransactions = useMemo(() => {
    if (categoryFilter === "Tất cả") return transactions;
    return transactions.filter((t) => t.category === categoryFilter);
  }, [transactions, categoryFilter]);

    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    useEffect(() => {
      setLastUpdated(new Date());
    }, [transactions]);

    const lastUpdatedText = useMemo(() => {
      const now = new Date();
      const diffMs = now.getTime() - lastUpdated.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "Vừa cập nhật";
      if (diffMins < 60) return `Cập nhật ${diffMins} phút trước`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `Cập nhật ${diffHours} giờ trước`;
      return `Cập nhật ${Math.floor(diffHours / 24)} ngày trước`;
    }, [lastUpdated]);

  const { currentTotal, previousTotal, currentTransactions } = useMemo(() => {
    const now = new Date();
    let currentStart: Date, currentEnd: Date, prevStart: Date, prevEnd: Date;

    if (filter === "Tuần") {
      currentStart = startOfWeek(now, { weekStartsOn: 1 });
      currentEnd = endOfWeek(now, { weekStartsOn: 1 });
      prevStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
      prevEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
    } else if (filter === "Tháng") {
      currentStart = startOfMonth(now);
      currentEnd = endOfMonth(now);
      prevStart = startOfMonth(subMonths(now, 1));
      prevEnd = endOfMonth(subMonths(now, 1));
    } else {
      currentStart = startOfYear(now);
      currentEnd = endOfYear(now);
      prevStart = startOfYear(subYears(now, 1));
      prevEnd = endOfYear(subYears(now, 1));
    }

    let currentSum = 0;
    let prevSum = 0;
    const currentTx: Transaction[] = [];

    transactions.forEach((t) => {
      if (t.type === "income" || ["Tiền lương", "Tiền thưởng", "Tiền quà tặng"].includes(t.category)) return;
      const d = new Date(t.date);
      if (isWithinInterval(d, { start: currentStart, end: currentEnd })) {
        currentSum += t.amount;
        currentTx.push(t);
      } else if (isWithinInterval(d, { start: prevStart, end: prevEnd })) {
        prevSum += t.amount;
      }
    });

    return {
      currentTotal: currentSum,
      previousTotal: prevSum,
      currentTransactions: currentTx,
    };
  }, [transactions, filter]);

  const percentageChange = useMemo(() => {
    if (previousTotal === 0) {
      return currentTotal > 0 ? 100 : 0;
    }
    return Math.round(((currentTotal - previousTotal) / previousTotal) * 100);
  }, [currentTotal, previousTotal]);

  const isIncrease = percentageChange >= 0;
  const changeText = `${Math.abs(percentageChange)}% so với ${filter.toLowerCase()} trước`;

  const categoryData = useMemo(() => {
    const data: Record<string, number> = {};
    currentTransactions.forEach((t) => {
      data[t.category] = (data[t.category] || 0) + t.amount;
    });
    return Object.entries(data)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [currentTransactions]);

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    index,
    name,
  }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null;

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={10}
        fontWeight="bold"
      >
        <tspan x={x} dy="0">
          {`${(percent * 100).toFixed(0)}%`}
        </tspan>
      </text>
    );
  };

  const totalIncome = transactions
    .filter((t) => t.type === "income" || ["Tiền lương", "Tiền thưởng", "Tiền quà tặng"].includes(t.category))
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type !== "income" && !["Tiền lương", "Tiền thưởng", "Tiền quà tặng"].includes(t.category))
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  return (
    <main className="max-w-md mx-auto px-4 pb-6">
      <header className="sticky top-0 z-50 bg-background-light dark:bg-background-dark py-4 px-4 -mx-4 flex items-center justify-between border-b border-primary/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary">
              account_circle
            </span>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Chào buổi sáng,
            </p>
            <h1 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              {userName}
            </h1>
          </div>
        </div>
        <button className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <span className="material-symbols-outlined">notifications</span>
        </button>
      </header>

      <section className="mt-4">
        <div className="bg-primary rounded-xl p-6 text-white shadow-lg shadow-primary/20 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-primary/20 text-sm font-medium uppercase tracking-wider mb-1 text-white/80">
              Tổng số dư
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold">
                {balance.toLocaleString("vi-VN")}
              </span>
              <span className="text-lg font-semibold">đ</span>
            </div>
            <div className="mt-6 flex justify-between items-end">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full border-2 border-primary bg-white/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-xs">
                    account_balance_wallet
                  </span>
                </div>
              </div>
              <span className="text-xs text-white/70 italic">
                {lastUpdatedText}
              </span>
            </div>
          </div>
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -ml-4 -mb-4 w-24 h-24 bg-black/10 rounded-full blur-xl"></div>
        </div>
      </section>

      <section className="mt-4">
        <button
          onClick={() => setIsManualIncomeOpen(true)}
          className="w-full bg-primary rounded-xl flex items-center justify-center gap-3 text-white shadow-lg shadow-primary/20 hover:scale-[0.98] transition-transform py-3"
        >
          <span className="material-symbols-outlined text-2xl">add_circle</span>
          <span className="font-bold">Nhập nguồn thu</span>
        </button>
      </section>

      <div className="my-6 border-t border-primary/10"></div>

      <section className="flex gap-3">
        <button
          onClick={onUploadClick}
          className="flex-1 bg-emerald-500 rounded-xl flex items-center justify-center gap-2 text-white shadow-lg shadow-emerald-500/20 hover:scale-[0.98] transition-transform py-3"
        >
          <span className="material-symbols-outlined text-xl">
            add_a_photo
          </span>
          <span className="font-bold text-sm">Tải giao dịch</span>
        </button>

        <button
          onClick={() => setIsManualEntryOpen(true)}
          className="flex-1 bg-emerald-500 rounded-xl flex items-center justify-center gap-2 text-white shadow-lg shadow-emerald-500/20 hover:scale-[0.98] transition-transform py-3"
        >
          <span className="material-symbols-outlined text-xl">edit_note</span>
          <span className="font-bold text-sm">Nhập giao dịch</span>
        </button>
      </section>

      <section className="mt-8">
        <div className="flex flex-col mb-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
            Thống kê chi tiêu theo
          </h2>
          <div className="flex gap-1 bg-primary/10 p-1 rounded-lg w-fit">
            {["Tuần", "Tháng", "Năm"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-3 py-1 text-xs font-semibold rounded-md ${
                  filter === f
                    ? "bg-primary text-white"
                    : "text-primary font-medium"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {categoryData.length > 0 ? (
          <div className="bg-white dark:bg-slate-800/50 rounded-xl px-5 py-2.5 shadow-sm border border-primary/5">
            <div className="flex flex-col items-center mb-6">
              <p className="text-slate-500 text-sm mb-1">
                Tổng chi tiêu {filter.toLowerCase()} này
              </p>
              <h3 className="text-3xl font-extrabold text-primary">
                {currentTotal.toLocaleString("vi-VN")}đ
              </h3>
              <div
                className={`flex items-center gap-1 mt-1 text-xs font-bold ${
                  isIncrease ? "text-red-600" : "text-emerald-600"
                }`}
              >
                <span className="material-symbols-outlined text-sm">
                  {isIncrease ? "trending_up" : "trending_down"}
                </span>
                <span>{changeText}</span>
              </div>
            </div>

            <div className="flex items-center justify-center mb-6 gap-8">
              <div className="relative w-32 h-32 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={0}
                      outerRadius={60}
                      dataKey="value"
                      stroke="none"
                      labelLine={false}
                      label={renderCustomizedLabel}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex flex-col gap-3">
                {categoryData.slice(0, 4).map((cat, index) => (
                  <div key={cat.name} className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></span>
                    <span className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">
                      {cat.name} ({Math.round((cat.value / currentTotal) * 100)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800/50 rounded-xl px-5 py-8 shadow-sm border border-primary/5 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-3xl text-slate-400">
                receipt_long
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
              Chưa có chi tiêu nào trong {filter.toLowerCase()} này
            </p>
          </div>
        )}
      </section>

      {isManualEntryOpen && (
        <ManualEntryModal
          onClose={() => setIsManualEntryOpen(false)}
          onSubmit={(t) => {
            onAddTransaction(t);
            setIsManualEntryOpen(false);
          }}
        />
      )}

      {isManualIncomeOpen && (
        <ManualIncomeModal
          onClose={() => setIsManualIncomeOpen(false)}
          onSubmit={(t) => {
            onAddIncome(t);
            setIsManualIncomeOpen(false);
          }}
        />
      )}
    </main>
  );
});

function ManualEntryModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (t: Transaction) => void;
}) {
  const [amount, setAmount] = useState("");
  const [displayAmount, setDisplayAmount] = useState("");
  const [content, setContent] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16));
  const [category, setCategory] = useState("Khác");

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/,/g, "");
    if (!isNaN(Number(rawValue))) {
      setAmount(rawValue);
      setDisplayAmount(rawValue ? Number(rawValue).toLocaleString("en-US") : "");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !date) return;

    const newTransaction: Transaction = {
      id: Math.random().toString(36).substring(2, 15),
      amount: parseInt(amount, 10),
      content,
      date: new Date(date).toISOString(),
      category: category as any,
    };

    onSubmit(newTransaction);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4">
      <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-primary/10 flex justify-between items-center">
          <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
            Nhập giao dịch
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              Số tiền (VND)
            </label>
            <input
              type="tel"
              required
              value={displayAmount}
              onChange={handleAmountChange}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-primary/10 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              placeholder="Ví dụ: 50,000"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              Danh mục
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-primary/10 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 h-[38px]"
            >
              {[
                "Ăn uống",
                "Học tập",
                "Di chuyển",
                "Sinh hoạt",
                "Y tế",
                "Quà tặng",
                "Thời trang",
                "Phí phát sinh",
                "Khác",
              ].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              Ngày giờ
            </label>
            <input
              type="datetime-local"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-primary/10 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              Nội dung (Không bắt buộc)
            </label>
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-primary/10 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              placeholder="Ví dụ: Ăn trưa"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-emerald-500 text-white font-bold py-3 rounded-xl mt-2 shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-colors"
          >
            Lưu giao dịch
          </button>
        </form>
      </div>
    </div>
  );
}

function ManualIncomeModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (t: Transaction) => void;
}) {
  const [amount, setAmount] = useState("");
  const [displayAmount, setDisplayAmount] = useState("");
  const [content, setContent] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16));
  const [category, setCategory] = useState("Tiền lương");

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/,/g, "");
    if (!isNaN(Number(rawValue))) {
      setAmount(rawValue);
      setDisplayAmount(rawValue ? Number(rawValue).toLocaleString("en-US") : "");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !date) return;

    const newTransaction: Transaction = {
      id: Math.random().toString(36).substring(2, 15),
      amount: parseInt(amount, 10),
      content,
      date: new Date(date).toISOString(),
      category: category as any,
      type: "income",
    };

    onSubmit(newTransaction);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4">
      <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-primary/10 flex justify-between items-center">
          <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
            Nhập nguồn thu
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              Số tiền (VND)
            </label>
            <input
              type="tel"
              required
              value={displayAmount}
              onChange={handleAmountChange}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-primary/10 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              placeholder="Ví dụ: 5,000,000"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              Danh mục
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-primary/10 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 h-[38px]"
            >
              {["Tiền lương", "Tiền thưởng", "Tiền quà tặng"].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              Ngày giờ
            </label>
            <input
              type="datetime-local"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-primary/10 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              Nội dung (Không bắt buộc)
            </label>
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-primary/10 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              placeholder="Ví dụ: Lương tháng 10"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-emerald-500 text-white font-bold py-3 rounded-xl mt-2 shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-colors"
          >
            Lưu nguồn thu
          </button>
        </form>
      </div>
    </div>
  );
}

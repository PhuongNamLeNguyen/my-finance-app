import React, { useState, useMemo, useRef, useEffect } from "react";
import { Transaction } from "../types";
import TransactionItem from "../components/TransactionItem";
import {
  format,
  isToday,
  isYesterday,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
} from "date-fns";

interface TransactionsProps {
  transactions: Transaction[];
  onTransactionClick: (t: Transaction) => void;
  onDeleteTransaction: (t: Transaction) => void;
}

function CustomSelect({
  value,
  onChange,
  options,
  prefix = "",
}: {
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
  prefix?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = options.find((o) => o.value === value)?.label || value;

  return (
    <div className="relative flex-1" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2 bg-primary/5 border border-primary/10 rounded-xl text-slate-900 dark:text-slate-100 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50"
      >
        <span>
          {prefix}
          {selectedLabel}
        </span>
        <span
          className={`material-symbols-outlined text-xl text-primary transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          expand_more
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-primary/10 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto py-1 no-scrollbar">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                value === opt.value
                  ? "bg-primary/10 text-primary font-bold"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default React.memo(function Transactions({
  transactions,
  onTransactionClick,
  onDeleteTransaction,
}: TransactionsProps) {
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear().toString(),
  );
  const [selectedMonth, setSelectedMonth] = useState<string>(
    (new Date().getMonth() + 1).toString(),
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [showCalendar, setShowCalendar] = useState(true);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const date = new Date(t.date);
      const yearMatch =
        selectedYear === "all" ||
        date.getFullYear().toString() === selectedYear;
      const monthMatch =
        selectedMonth === "all" ||
        (date.getMonth() + 1).toString() === selectedMonth;
      const categoryMatch =
        selectedCategory === "all" || t.category === selectedCategory;
      return yearMatch && monthMatch && categoryMatch;
    });
  }, [transactions, selectedYear, selectedMonth, selectedCategory]);

  // Group transactions by date
  const transactionsByDate = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    filteredTransactions.forEach((t) => {
      const dateStr = format(new Date(t.date), "yyyy-MM-dd");
      if (!map.has(dateStr)) map.set(dateStr, []);
      map.get(dateStr)!.push(t);
    });
    return map;
  }, [filteredTransactions]);

  const grouped = filteredTransactions.reduce(
    (acc, t) => {
      const dateStr = format(new Date(t.date), "yyyy-MM-dd");
      if (!acc[dateStr]) acc[dateStr] = [];
      acc[dateStr].push(t);
      return acc;
    },
    {} as Record<string, Transaction[]>,
  );

  const sortedDates = Object.keys(grouped).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime(),
  );

  const getDayLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return `HÔM NAY, ${format(date, "dd/MM")}`;
    if (isYesterday(date)) return `HÔM QUA, ${format(date, "dd/MM")}`;
    return format(date, "dd/MM/yyyy");
  };

  const calendarDays = useMemo(() => {
    if (selectedYear === "all" || selectedMonth === "all") return [];
    const year = parseInt(selectedYear);
    const month = parseInt(selectedMonth) - 1;
    const monthStart = new Date(year, month, 1);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [selectedYear, selectedMonth]);

  const selectedDateTransactions = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    return transactionsByDate.get(dateStr) || [];
  }, [selectedDate, transactionsByDate]);

  const isCalendarView = selectedYear !== "all" && selectedMonth !== "all";

  const years = [
    { label: "Toàn bộ", value: "all" },
    ...Array.from(new Array(5), (_, i) => ({
      label: (new Date().getFullYear() - i).toString(),
      value: (new Date().getFullYear() - i).toString(),
    })),
  ];

  const months = [
    { label: "Cả năm", value: "all" },
    ...Array.from(new Array(12), (_, i) => ({
      label: `${i + 1}`,
      value: (i + 1).toString(),
    })),
  ];

  const categories = [
    { label: "Toàn bộ", value: "all" },
    { label: "Ăn uống", value: "Ăn uống" },
    { label: "Học tập", value: "Học tập" },
    { label: "Di chuyển", value: "Di chuyển" },
    { label: "Sinh hoạt", value: "Sinh hoạt" },
    { label: "Y tế", value: "Y tế" },
    { label: "Quà tặng", value: "Quà tặng" },
    { label: "Thời trang", value: "Thời trang" },
    { label: "Phí phát sinh", value: "Phí phát sinh" },
    { label: "Khác", value: "Khác" },
  ];

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden max-w-md mx-auto">
      <header className="sticky top-0 z-50 flex items-center bg-background-light dark:bg-background-dark p-4 pb-2 justify-center shrink-0 border-b border-primary/10">
        <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-tight text-center">
          Chi tiết giao dịch
        </h2>
      </header>

      <div className="sticky top-[53px] px-4 py-3 bg-background-light dark:bg-background-dark border-b border-primary/10 flex flex-col gap-2 shrink-0 z-40">
        <div className="flex gap-2">
          <CustomSelect
            value={selectedYear}
            onChange={setSelectedYear}
            options={years}
            prefix="Năm: "
          />
          <CustomSelect
            value={selectedMonth}
            onChange={setSelectedMonth}
            options={months}
            prefix="Tháng: "
          />
        </div>
        <div className="flex gap-2 items-center">
          <CustomSelect
            value={selectedCategory}
            onChange={setSelectedCategory}
            options={categories}
            prefix="Mục: "
          />
          {isCalendarView && (
            <button
              onClick={() => setShowCalendar(!showCalendar)}
              className="px-3 py-2 bg-primary/10 text-primary rounded-xl font-bold flex items-center justify-center shrink-0"
            >
              <span className="material-symbols-outlined">
                {showCalendar ? "view_list" : "calendar_view_month"}
              </span>
            </button>
          )}
        </div>
      </div>

      <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark pb-6 z-0">
        {isCalendarView && showCalendar ? (
          <div className="px-4 mt-4">
            <div className="grid grid-cols-7 mb-2">
              {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d, i) => (
                <div
                  key={d}
                  className={`text-center text-xs font-bold py-2 ${
                    i === 6 ? "text-primary" : "text-slate-400"
                  }`}
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
              {calendarDays.map((day) => {
                const dateStr = format(day, "yyyy-MM-dd");
                const dayTransactions = transactionsByDate.get(dateStr) || [];
                const totalExpense = dayTransactions
                  .filter((t) => t.type !== "income" && !["Tiền lương", "Tiền thưởng", "Tiền quà tặng"].includes(t.category))
                  .reduce((sum, t) => sum + t.amount, 0);
                const totalIncome = dayTransactions
                  .filter((t) => t.type === "income" || ["Tiền lương", "Tiền thưởng", "Tiền quà tặng"].includes(t.category))
                  .reduce((sum, t) => sum + t.amount, 0);
                const isCurrentMonth =
                  day.getMonth() === parseInt(selectedMonth) - 1;
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isTodayDate = isToday(day);

                return (
                  <div
                    key={dateStr}
                    onClick={() => setSelectedDate(day)}
                    className={`p-1 min-h-[4rem] relative cursor-pointer transition-colors ${
                      !isCurrentMonth
                        ? "bg-background-light dark:bg-background-dark opacity-40"
                        : isSelected
                          ? "bg-primary/20 dark:bg-primary/30 ring-2 ring-primary ring-inset"
                          : "bg-background-light dark:bg-background-dark hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <span
                      className={`text-xs ${
                        isTodayDate || isSelected
                          ? "font-bold text-primary"
                          : "font-medium"
                      }`}
                    >
                      {format(day, "d")}
                    </span>
                    {totalIncome > 0 && (
                      <div className="mt-0">
                        <p className="text-[9px] text-emerald-500 leading-tight font-bold">
                          +
                          {totalIncome >= 1000000
                            ? (totalIncome / 1000000).toFixed(1) + "M"
                            : (totalIncome / 1000).toFixed(0) + "k"}
                        </p>
                      </div>
                    )}
                    {totalExpense > 0 && (
                      <div className="mt-0">
                        <p className="text-[9px] text-red-500 leading-tight font-bold">
                          -
                          {totalExpense >= 1000000
                            ? (totalExpense / 1000000).toFixed(1) + "M"
                            : (totalExpense / 1000).toFixed(0) + "k"}
                        </p>
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-primary rounded-full"></div>
                    )}
                  </div>
                );
              })}
            </div>

            {selectedDate && (
              <>
                <h3 className="mt-6 text-sm font-bold text-primary/80 uppercase tracking-widest">
                  Chi tiết ngày {format(selectedDate, "dd/MM")}
                </h3>
                <div className="mt-2 space-y-3 pb-8">
                  {selectedDateTransactions.map((t) => (
                    <TransactionItem
                      key={t.id}
                      transaction={t}
                      onClick={onTransactionClick}
                      onDelete={onDeleteTransaction}
                    />
                  ))}
                  {selectedDateTransactions.length === 0 && (
                    <p className="text-center text-slate-500 py-4 text-sm">
                      Không có giao dịch nào.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="pb-8">
            {sortedDates.map((dateStr) => (
              <section key={dateStr}>
                <div className="px-4 py-3 bg-primary/5 mt-2">
                  <h3 className="text-slate-900 dark:text-slate-100 text-sm font-bold uppercase tracking-wider">
                    {getDayLabel(dateStr)}
                  </h3>
                </div>
                <div className="space-y-1">
                  {grouped[dateStr].map((t) => (
                    <div key={t.id} className="px-4 py-1">
                      <TransactionItem
                        transaction={t}
                        onClick={onTransactionClick}
                        onDelete={onDeleteTransaction}
                      />
                    </div>
                  ))}
                </div>
              </section>
            ))}
            {filteredTransactions.length === 0 && (
              <p className="text-center text-slate-500 py-8">
                Chưa có giao dịch nào trong thời gian này.
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
});

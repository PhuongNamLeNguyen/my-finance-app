import React, { useState } from "react";
import { Transaction } from "../types";
import { format } from "date-fns";
import { motion, useAnimation, PanInfo } from "framer-motion";

interface TransactionItemProps {
  key?: React.Key;
  transaction: Transaction;
  onClick: (t: Transaction) => void;
  onDelete?: (t: Transaction) => void;
  onRestore?: (t: Transaction) => void;
}

const categoryConfig: Record<
  string,
  { icon: string; colorClass: string; bgClass: string }
> = {
  "Ăn uống": {
    icon: "restaurant",
    colorClass: "text-primary",
    bgClass: "bg-orange-100 dark:bg-primary/20",
  },
  "Mua sắm": {
    icon: "shopping_bag",
    colorClass: "text-blue-600",
    bgClass: "bg-blue-100 dark:bg-blue-900/20",
  },
  "Di chuyển": {
    icon: "directions_car",
    colorClass: "text-green-600",
    bgClass: "bg-green-100 dark:bg-green-900/20",
  },
  "Gia đình": {
    icon: "home",
    colorClass: "text-teal-600",
    bgClass: "bg-teal-100 dark:bg-teal-900/20",
  },
  "Quà tặng": {
    icon: "redeem",
    colorClass: "text-pink-600",
    bgClass: "bg-pink-100 dark:bg-pink-900/20",
  },
  "Y tế": {
    icon: "medical_services",
    colorClass: "text-red-600",
    bgClass: "bg-red-100 dark:bg-red-900/20",
  },
  "Học tập": {
    icon: "school",
    colorClass: "text-indigo-600",
    bgClass: "bg-indigo-100 dark:bg-indigo-900/20",
  },
  "Giải trí": {
    icon: "movie",
    colorClass: "text-purple-600",
    bgClass: "bg-purple-100 dark:bg-purple-900/20",
  },
  "Tiền lương": {
    icon: "payments",
    colorClass: "text-emerald-600",
    bgClass: "bg-emerald-100 dark:bg-emerald-900/20",
  },
  "Tiền thưởng": {
    icon: "emoji_events",
    colorClass: "text-yellow-600",
    bgClass: "bg-yellow-100 dark:bg-yellow-900/20",
  },
  "Tiền quà tặng": {
    icon: "card_giftcard",
    colorClass: "text-pink-600",
    bgClass: "bg-pink-100 dark:bg-pink-900/20",
  },
  Khác: {
    icon: "receipt_long",
    colorClass: "text-slate-600",
    bgClass: "bg-slate-100 dark:bg-slate-800",
  },
};

export default function TransactionItem({
  transaction,
  onClick,
  onDelete,
  onRestore,
}: TransactionItemProps) {
  const config = categoryConfig[transaction.category] || categoryConfig["Khác"];
  const controls = useAnimation();
  const [isDeleting, setIsDeleting] = useState(false);
  const [dragDirection, setDragDirection] = useState<'left' | 'right' | null>(null);

  const handleDrag = (event: any, info: PanInfo) => {
    if (info.offset.x < 0) {
      setDragDirection('left');
    } else if (info.offset.x > 0) {
      setDragDirection('right');
    }
  };

  const handleDragEnd = async (event: any, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (onDelete && (offset < -100 || velocity < -500)) {
      setIsDeleting(true);
      await controls.start({ x: "-100%", opacity: 0, transition: { duration: 0.2 } });
      onDelete(transaction);
    } else if (onRestore && (offset > 100 || velocity > 500)) {
      setIsDeleting(true);
      await controls.start({ x: "100%", opacity: 0, transition: { duration: 0.2 } });
      onRestore(transaction);
    } else {
      controls.start({ x: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 30 } });
      setDragDirection(null);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl mb-3">
      {/* Backgrounds */}
      <div className={`absolute inset-0 flex items-center justify-between rounded-xl overflow-hidden transition-colors duration-200 ${dragDirection === 'left' && onDelete ? 'bg-red-500' : dragDirection === 'right' && onRestore ? 'bg-emerald-500' : 'bg-slate-100 dark:bg-slate-800'}`}>
        {/* Restore Background (Left) */}
        <div className={`absolute inset-y-0 left-0 w-1/2 flex items-center justify-start px-6 transition-opacity duration-200 ${onRestore && dragDirection === 'right' ? 'opacity-100' : 'opacity-0'}`}>
          <span className="material-symbols-outlined text-white text-2xl">restore</span>
        </div>
        
        {/* Delete Background (Right) */}
        <div className={`absolute inset-y-0 right-0 w-1/2 flex items-center justify-end px-6 transition-opacity duration-200 ${onDelete && dragDirection === 'left' ? 'opacity-100' : 'opacity-0'}`}>
          <span className="material-symbols-outlined text-white text-2xl">delete_forever</span>
        </div>
      </div>

      <motion.div
        drag={onDelete || onRestore ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: onDelete ? 1 : 0, right: onRestore ? 1 : 0 }}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        animate={controls}
        onClick={() => !isDeleting && onClick(transaction)}
        className="relative bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-primary/5 flex items-center justify-between cursor-pointer hover:border-primary/30 transition-colors gap-3 z-10"
      >
        {/* Icon (left) */}
        <div
          className={`w-12 h-12 shrink-0 rounded-lg ${config.bgClass} flex items-center justify-center ${config.colorClass}`}
        >
          <span className="material-symbols-outlined">{config.icon}</span>
        </div>

        {/* Amount and Content (middle) */}
        <div className="flex-1 flex flex-col justify-center">
          <p className={`font-extrabold text-base ${transaction.type === 'income' || ["Tiền lương", "Tiền thưởng", "Tiền quà tặng"].includes(transaction.category) ? 'text-emerald-600' : 'text-slate-900 dark:text-slate-100'}`}>
            {transaction.type === 'income' || ["Tiền lương", "Tiền thưởng", "Tiền quà tặng"].includes(transaction.category) ? '+' : '-'}{transaction.amount.toLocaleString("vi-VN")}đ
          </p>
          <p className="font-medium text-sm text-slate-600 dark:text-slate-300 line-clamp-1">
            {transaction.content}
          </p>
        </div>

        {/* Category and Time (right) */}
        <div className="flex flex-col items-end justify-center gap-1 shrink-0">
          <span
            className={`text-[10px] ${config.bgClass} ${config.colorClass} px-2 py-0.5 rounded-full font-bold uppercase`}
          >
            {transaction.category}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">
            {format(new Date(transaction.date), "HH:mm • dd/MM")}
          </span>
        </div>
      </motion.div>
    </div>
  );
}

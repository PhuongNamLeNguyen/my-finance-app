import React from "react";

interface BottomNavProps {
  activeTab: string;
  onChangeTab: (tab: string) => void;
}

export default function BottomNav({ activeTab, onChangeTab }: BottomNavProps) {
  const tabs = [
    { id: "home", icon: "home", label: "Trang chủ" },
    { id: "transactions", icon: "list_alt", label: "Chi tiết" },
    { id: "settings", icon: "settings", label: "Cài đặt" },
  ];

  return (
    <nav className="bg-white/90 dark:bg-background-dark/90 backdrop-blur-lg border-t border-primary/10 px-2 py-3 grid grid-cols-3 z-50 shrink-0">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChangeTab(tab.id)}
            className={`flex flex-col items-center justify-center gap-1 ${isActive ? "text-primary" : "text-slate-400 dark:text-slate-500"}`}
          >
            <span
              className={`material-symbols-outlined ${isActive ? "fill-1" : ""}`}
              style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              {tab.icon}
            </span>
            <span
              className={`text-[10px] ${isActive ? "font-bold" : "font-medium"}`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

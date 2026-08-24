"use client";

import { AppView } from "@/lib/types";

type WorkspaceNavProps = {
  activeView: AppView;
  onChangeView: (view: AppView) => void;
};

const navigationItems: {
  id: AppView;
  label: string;
  icon: string;
}[] = [
  {
    id: "my-day",
    label: "My Day",
    icon: "☀",
  },
  {
    id: "routines",
    label: "Routines",
    icon: "↻",
  },
  {
    id: "projects",
    label: "Projects",
    icon: "□",
  },
  {
    id: "goals",
    label: "Goals",
    icon: "◎",
  },
  {
    id: "dreams",
    label: "Dreams",
    icon: "✦",
  },
  {
    id: "planner",
    label: "Planner",
    icon: "▦",
  },
  {
    id: "shopping",
    label: "Shopping",
    icon: "🛒",
  },
  {
    id: "food",
    label: "Food",
    icon: "🍽",
  },
  {
    id: "settings",
    label: "Settings",
    icon: "⚙",
  },

];

export default function WorkspaceNav({
  activeView,
  onChangeView,
}: WorkspaceNavProps) {
  return (
    <nav className="rounded-3xl bg-white/85 p-4 shadow-xl backdrop-blur-md">
      <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
        Workspace
      </p>

      <div className="space-y-1">
        {navigationItems.map((item) => {
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChangeView(item.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition ${
                isActive
                  ? "bg-[#1f0825] text-white"
                  : "text-slate-700 hover:bg-[#eeeaea]"
              }`}
            >
              <span className="w-5 text-center">
                {item.icon}
              </span>

              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
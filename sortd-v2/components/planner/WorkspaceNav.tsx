
"use client";

import { AppView } from "@/lib/types";
import {
  LayoutDashboard,
  Sun,
  ListTodo,
  CalendarDays,
  Repeat2,
  FolderKanban,
  Target,
  Sparkles,
  ShoppingBag,
  UtensilsCrossed,
  Settings2,
} from "lucide-react";

type WorkspaceNavProps = {
  activeView: AppView;
  onChangeView: (view: AppView) => void;
  onToggleSidebar: () => void;
};

const navigationItems = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "my-day", label: "My Day", icon: Sun },
  { id: "planner", label: "To-dos", icon: ListTodo },
  { id: "routines", label: "Routines", icon: Repeat2 },
  { id: "projects", label: "Projects", icon: FolderKanban },
  { id: "goals", label: "Goals", icon: Target },
  { id: "dreams", label: "Dreams", icon: Sparkles },
  { id: "shopping", label: "Shopping", icon: ShoppingBag },
  { id: "food", label: "Food", icon: UtensilsCrossed },
  { id: "settings", label: "Settings", icon: Settings2 },
] as const;

export default function WorkspaceNav({
  activeView,
  onChangeView,
}: WorkspaceNavProps) {
  return (
    <nav className="rounded-2xl border border-[var(--sortd-border)] bg-[var(--sortd-surface)] p-3 shadow-sm">
      <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-[0.15em] text-[var(--sortd-text-muted)]">
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
              aria-current={isActive ? "page" : undefined}
              className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sortd-teal-dark)] ${
                isActive
                  ? "bg-[var(--sortd-navy)] text-white"
                  : "text-[var(--sortd-text)] hover:bg-[var(--sortd-muted)]"
              }`}
            >
            <span
              className="flex w-6 shrink-0 items-center justify-center"
              aria-hidden="true"
            >
              <item.icon size={18} strokeWidth={1.8} />
            </span>

              <span className="min-w-0 truncate">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

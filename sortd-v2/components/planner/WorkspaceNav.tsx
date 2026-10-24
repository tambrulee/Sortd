
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
    id: "overview",
    label: "Overview",
    icon: "◫",
  },
  {
    id: "my-day",
    label: "My Day",
    icon: "☀",
  },
  {
    id: "planner",
    label: "Planner",
    icon: "▦",
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
                className="w-6 shrink-0 text-center text-base"
                aria-hidden="true"
              >
                {item.icon}
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

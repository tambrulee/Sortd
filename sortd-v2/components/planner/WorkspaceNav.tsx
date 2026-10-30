"use client";

import type { AppView } from "@/lib/types";
import {
  LayoutDashboard, Sun, CalendarDays, Repeat2, FolderKanban,
  Target, Sparkles, ShoppingBag, UtensilsCrossed, Settings2,
  PanelLeftClose,
} from "lucide-react";

type WorkspaceNavProps = {
  activeView: AppView;
  onChangeView: (view: AppView) => void;
  onToggleSidebar?: () => void;
};

const navigationItems = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "my-day", label: "My Day", icon: Sun },
  { id: "planner", label: "Planner", icon: CalendarDays },
  { id: "routines", label: "Routines", icon: Repeat2 },
  { id: "projects", label: "Projects", icon: FolderKanban },
  { id: "goals", label: "Goals", icon: Target },
  { id: "dreams", label: "Dreams", icon: Sparkles },
  { id: "shopping", label: "Shopping", icon: ShoppingBag },
  { id: "food", label: "Food", icon: UtensilsCrossed },
  { id: "settings", label: "Settings", icon: Settings2 },
] as const;

export default function WorkspaceNav({ activeView, onChangeView, onToggleSidebar }: WorkspaceNavProps) {
  return (
    <nav aria-label="Workspace navigation" className="rounded-2xl border border-[var(--sortd-border)] bg-[var(--sortd-surface)] p-3 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2 px-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--sortd-text-muted)]">Workspace</p>
        {onToggleSidebar && <button type="button" onClick={onToggleSidebar} title="Collapse sidebar" aria-label="Collapse sidebar" className="hidden rounded-lg p-2 text-[var(--sortd-text-muted)] hover:bg-[var(--sortd-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sortd-teal-dark)] md:inline-flex"><PanelLeftClose size={18}/></button>}
      </div>
      <div className="space-y-1">
        {navigationItems.map(({id,label,icon:Icon}) => {
          const isActive = activeView === id;
          return (
            <button key={id} type="button" onClick={() => onChangeView(id)} aria-current={isActive ? "page" : undefined}
              className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sortd-teal-dark)] ${isActive ? "bg-[var(--sortd-navy)] text-white" : "text-[var(--sortd-text)] hover:bg-[var(--sortd-muted)]"}`}>
              <Icon size={18} strokeWidth={isActive ? 2.25 : 1.8} aria-hidden="true" className={isActive ? "text-[#76d9ce]" : "text-[var(--sortd-teal-dark)]"}/>
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

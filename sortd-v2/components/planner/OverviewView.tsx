"use client";

import { useState } from "react";
import { ArrowUpRight, CalendarClock, FolderKanban, Target, ShoppingBag, UtensilsCrossed, ChevronRight, Sparkles } from "lucide-react";
import type { AppView, Dream, FoodData, Goal, Routine, ShoppingList, SortdList } from "@/lib/types";

type Props = {
  projects: SortdList[];
  routines: Routine[];
  goals: Goal[];
  dreams: Dream[];
  shoppingLists: ShoppingList[];
  foodData: FoodData;
  onNavigate: (view: AppView) => void;
  onOpenProject: (id: string) => void;
  onCompleteProjectTask: (projectId: string, taskId: string) => void;
  onCompleteRoutineTask: (routineId: string, taskId: string) => void;
  onChangeShoppingLists: (lists: ShoppingList[]) => void;
};

function localKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
const money = (amount: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(amount);
const shortDate = (date: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(`${date}T12:00:00`));
const buttonClass = "min-h-10 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sortd-teal-dark)]";

function Panel({ title, action, children, kind = "calendar", meta }: { title: string; action: () => void; children: React.ReactNode; kind?: "calendar" | "projects" | "goals" | "shopping" | "food"; meta?: string }) {
  const icons = { calendar: CalendarClock, projects: FolderKanban, goals: Target, shopping: ShoppingBag, food: UtensilsCrossed };
  const Icon = icons[kind];
  return <section className="min-w-0 overflow-hidden rounded-[22px] border border-[#d7e3df] bg-white shadow-[0_3px_14px_rgba(16,42,67,.035)] transition-shadow hover:shadow-[0_8px_24px_rgba(16,42,67,.075)]">
    <div className="h-1 bg-gradient-to-r from-[#0f766e] via-[#48b4a7] to-[#dceee7]" />
    <div className="p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e9f4f0] text-[#0f766e]"><Icon size={19} strokeWidth={1.8} /></span>
          <div><h2 className="text-base font-semibold tracking-tight text-[#102a43]">{title}</h2>{meta && <p className="mt-0.5 text-xs text-[#64748b]">{meta}</p>}</div>
        </div>
        <button type="button" onClick={action} aria-label={`View all ${title}`} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#0f766e] transition hover:bg-[#e9f4f0]"><ArrowUpRight size={19}/></button>
      </div>
      {children}
    </div>
  </section>;
}

export default function OverviewView({ projects, routines, goals, dreams, shoppingLists, foodData, onNavigate, onOpenProject, onCompleteProjectTask, onCompleteRoutineTask, onChangeShoppingLists }: Props) {
  const [dayTab, setDayTab] = useState<"routines" | "tasks" | "overdue" | null>(null);
  const [shoppingTab, setShoppingTab] = useState<"today" | "week">("week");
  const [showAllDay, setShowAllDay] = useState(false);
  const [showAllShopping, setShowAllShopping] = useState(false);
  const now = new Date();
  const today = localKey(now);
  const weekEnd = localKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7));
  const openTasks = projects.flatMap(p => p.tasks.filter(t => !t.completed && t.title.trim()).map(t => ({ ...t, projectId: p.id, projectName: p.name })));
  const activeRoutines = routines.filter(r => !r.archived).flatMap(r => r.tasks.filter(t => t.active).map(t => ({ ...t, routineId: r.id, routineName: r.name })));
  const tasksToday = openTasks.filter(t => t.dueDate && t.dueDate <= today);
  const routinesToday = activeRoutines.filter(t => t.nextDueDate <= today);
  const overdueTasks = tasksToday.filter(t => t.dueDate! < today);
  const overdueRoutines = routinesToday.filter(t => t.nextDueDate < today);
  const overdue = overdueTasks.length + overdueRoutines.length;
  const upcoming = openTasks.filter(t => t.dueDate && t.dueDate > today && t.dueDate <= weekEnd).sort((a,b) => a.dueDate!.localeCompare(b.dueDate!));
  const currentProjects = projects.filter(p => p.status === "active" || p.status === "planned");
  const nextProjects = [...currentProjects].sort((a,b) => (a.targetDate ?? "9999").localeCompare(b.targetDate ?? "9999"));
  const planned = shoppingLists.filter(l => !l.archived).flatMap(l => l.items.map(item => ({ ...item, listId: l.id, listName: l.name }))).filter(item => !item.purchased && item.plannedPurchaseDate && item.plannedPurchaseDate <= weekEnd).sort((a,b) => a.plannedPurchaseDate!.localeCompare(b.plannedPurchaseDate!));
  const todayShopping = planned.filter(item => item.plannedPurchaseDate! <= today);
  const weekShopping = planned.filter(item => item.plannedPurchaseDate! > today);
  const selectedShopping = shoppingTab === "today" ? todayShopping : weekShopping;
  const selectedDayItems = dayTab === "routines"
    ? routinesToday.map(t => ({ kind: "routine" as const, id: `${t.routineId}:${t.id}`, title: t.title, subtitle: t.routineName, date: t.nextDueDate, parentId: t.routineId, taskId: t.id }))
    : dayTab === "tasks"
      ? tasksToday.map(t => ({ kind: "task" as const, id: `${t.projectId}:${t.id}`, title: t.title, subtitle: t.projectName, date: t.dueDate!, parentId: t.projectId, taskId: t.id }))
      : [...overdueRoutines.map(t => ({ kind: "routine" as const, id: `${t.routineId}:${t.id}`, title: t.title, subtitle: t.routineName, date: t.nextDueDate, parentId: t.routineId, taskId: t.id })), ...overdueTasks.map(t => ({ kind: "task" as const, id: `${t.projectId}:${t.id}`, title: t.title, subtitle: t.projectName, date: t.dueDate!, parentId: t.projectId, taskId: t.id }))];
  selectedDayItems.sort((a,b) => a.date.localeCompare(b.date));
  const mealEntries = foodData.mealPlan.filter(entry => entry.date === today);
  const mealTypes = ["breakfast", "lunch", "dinner"] as const;
  const insight = overdue > 0
    ? `${overdue} item${overdue === 1 ? " is" : "s are"} overdue across your tasks and routines.`
    : upcoming.length > 0
      ? `${upcoming.length} project task${upcoming.length === 1 ? " is" : "s are"} due in the next seven days.`
      : "Nothing overdue or due in the next seven days. You have room to choose what matters next.";

  function updateShopping(listId: string, itemId: string, updates: { purchased?: boolean; plannedPurchaseDate?: string | null }) {
    onChangeShoppingLists(shoppingLists.map(list => list.id !== listId ? list : {
      ...list,
      items: list.items.map(item => item.id === itemId ? { ...item, ...updates } : item),
    }));
  }

  return <div className="sortd-overview min-w-0 w-full space-y-5 rounded-3xl border border-[var(--sortd-border)] bg-[#f8faf9] p-3 shadow-sm sm:p-5 md:p-7">
    <header style={{ background: "radial-gradient(circle at 85% 10%, rgba(20,184,166,.28), transparent 38%), linear-gradient(115deg, #102a43 0%, #164854 100%)" }} className="sortd-overview-hero relative overflow-hidden rounded-2xl px-5 py-8 shadow-lg sm:px-8 sm:py-10">
      <div className="relative z-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.17em] text-[#b3e7dc]">{new Intl.DateTimeFormat("en-GB", { weekday:"long", day:"numeric", month:"long" }).format(now)}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Overview<span className="text-[#45d3c2]">.</span></h1>
        </div>
        <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-white/85">Your space, your pace</span>
      </div>
    </header>
    <Panel title="Your day" action={() => onNavigate("my-day")}>
      <div className="grid grid-cols-3 gap-2">
        {([ ["routines", "Routines due", routinesToday.length], ["tasks", "Tasks due", tasksToday.length], ["overdue", "Overdue", overdue] ] as const).map(([tab,label,value]) =>
          <button key={tab} type="button" aria-pressed={dayTab === tab} onClick={() => { setDayTab(dayTab === tab ? null : tab); setShowAllDay(false); }} className={`min-w-0 rounded-xl border p-2 text-center transition sm:p-3 ${dayTab === tab ? "border-[var(--sortd-teal-dark)] bg-[var(--sortd-muted)] ring-1 ring-[var(--sortd-teal-dark)]" : "border-transparent bg-[var(--sortd-muted)] hover:border-[var(--sortd-border)]"}`}>
            <p className="text-2xl font-bold tabular-nums">{value}</p><p className="mt-1 text-xs text-[var(--sortd-text-muted)]">{label}</p>
          </button>)}
      </div>
      {dayTab && <div className="mt-4 border-t border-[var(--sortd-border)] pt-3">
        <div className="mb-2 flex items-center justify-between gap-2"><h3 className="text-sm font-semibold">{dayTab === "routines" ? "Routines due (including overdue)" : dayTab === "tasks" ? "Tasks due (including overdue)" : "Overdue items"}</h3><button type="button" onClick={() => setDayTab(null)} className={`${buttonClass} text-[var(--sortd-text-muted)]`}>Close</button></div>
        {selectedDayItems.length ? <div className="space-y-1">{selectedDayItems.slice(0,showAllDay ? undefined : 6).map(item => <div key={`${item.kind}:${item.id}`} className="flex min-w-0 items-center gap-2 rounded-lg border-b border-[var(--sortd-border)] py-2 last:border-b-0">
          <button type="button" aria-label={`Complete ${item.title}`} title={`Complete ${item.title}`} onClick={() => item.kind === "routine" ? onCompleteRoutineTask(item.parentId,item.taskId) : onCompleteProjectTask(item.parentId,item.taskId)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--sortd-teal-dark)] text-[var(--sortd-teal-dark)] hover:bg-[var(--sortd-muted)]">✓</button>
          <div className="min-w-0 flex-1"><p className="break-words text-sm font-medium">{item.title}</p><p className="text-xs text-[var(--sortd-text-muted)]">{item.subtitle} · {shortDate(item.date)}</p></div>
          {item.kind === "task" && <button type="button" onClick={() => onOpenProject(item.parentId)} className={`${buttonClass} shrink-0 text-xs text-[var(--sortd-teal-dark)]`}>Open</button>}
        </div>)}{selectedDayItems.length > 6 && <button type="button" onClick={() => setShowAllDay(!showAllDay)} className={`${buttonClass} text-[var(--sortd-teal-dark)]`}>{showAllDay ? "Show fewer" : `Show all ${selectedDayItems.length}`}</button>}</div> : <p className="text-sm text-[var(--sortd-text-muted)]">Nothing in this category right now.</p>}
      </div>}
    </Panel>
    <section style={{ background: "linear-gradient(110deg, #e1f0e9, #f1f7ee)" }} className="sortd-insight-card rounded-2xl border border-[#c7ddd4] p-4 sm:p-5" aria-label="Worth knowing">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/75 text-xl text-[var(--sortd-teal-dark)]" aria-hidden="true">✦</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-[var(--sortd-navy)]">Worth knowing</h2>
            <span className="rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-medium text-[var(--sortd-teal-dark)]">From your workspace</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-[var(--sortd-text)]">{insight}</p>
          <button type="button" onClick={() => { setDayTab(overdue > 0 ? "overdue" : "tasks"); setShowAllDay(false); }} className="mt-3 text-sm font-semibold text-[var(--sortd-teal-dark)] hover:underline">{overdue > 0 ? "Review overdue items" : "Review your day"} →</button>
        </div>
      </div>
    </section>
    <div className="grid min-w-0 grid-cols-1 items-start gap-4 lg:grid-cols-2">
      <Panel title="Coming up" meta="Next seven days" kind="calendar" action={() => onNavigate("my-day")}>
        {upcoming.length ? <div className="space-y-2">{upcoming.slice(0,4).map(t => <button key={`${t.projectId}:${t.id}`} type="button" onClick={() => onOpenProject(t.projectId)} className="flex w-full items-center justify-between gap-3 rounded-xl bg-[#f4f8f6] px-3 py-3 text-left text-sm transition hover:bg-[#e9f4f0] hover:text-[var(--sortd-teal-dark)]"><span className="min-w-0 break-words">{t.title}</span><span className="shrink-0 text-xs text-[var(--sortd-text-muted)]">{shortDate(t.dueDate!)}</span></button>)}{upcoming.length > 4 && <p className="text-xs text-[var(--sortd-text-muted)]">+{upcoming.length-4} more</p>}</div> : <p className="text-sm text-[var(--sortd-text-muted)]">No project tasks due in the next seven days.</p>}
      </Panel>
      <Panel title="Projects" kind="projects" action={() => onNavigate("projects")}>
        <div className="mb-4 flex items-baseline gap-2"><span className="text-3xl font-semibold tabular-nums text-[#102a43]">{currentProjects.length}</span><span className="text-xs text-[#64748b]">active or planned</span></div>
        {nextProjects.length ? <div className="space-y-2">{nextProjects.slice(0,3).map(p => <button key={p.id} type="button" onClick={() => onOpenProject(p.id)} className="flex w-full items-center justify-between gap-2 rounded-xl border border-[#e6edeb] px-3 py-2.5 text-left text-sm transition hover:border-[#8fc8bb] hover:bg-[#f5faf8]"><span className="min-w-0 truncate">{p.name}</span><span className="shrink-0 text-xs text-[var(--sortd-text-muted)]">{p.targetDate ? shortDate(p.targetDate) : "No target"}</span></button>)}</div> : <p className="text-sm text-[var(--sortd-text-muted)]">No active or planned projects.</p>}
      </Panel>
      <Panel title="Goals & dreams" kind="goals" action={() => onNavigate("goals")}>
        <div className="mb-4 flex gap-2"><span className="rounded-full bg-[#e9f4f0] px-3 py-1.5 text-xs font-medium text-[#0f766e]">{goals.filter(g => g.status === "active").length} active goals</span><span className="rounded-full bg-[#f1f4f7] px-3 py-1.5 text-xs font-medium text-[#52677b]">{dreams.length} dreams</span></div>
        <div className="space-y-2">{goals.filter(g => g.status === "active").slice(0,3).map(g => <p key={g.id} className="flex items-start gap-2 rounded-xl border border-[#e6edeb] px-3 py-2.5 text-sm"><Target size={15} className="mt-0.5 shrink-0 text-[#0f766e]"/>{g.title}</p>)}{!goals.some(g => g.status === "active") && <p className="text-sm text-[var(--sortd-text-muted)]">No active goals.</p>}</div>
        <button type="button" onClick={() => onNavigate("dreams")} className={`${buttonClass} mt-2 text-xs text-[var(--sortd-teal-dark)]`}>Explore dreams →</button>
      </Panel>
      <Panel title="Shopping plans" kind="shopping" action={() => onNavigate("shopping")}>
        <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Shopping date filter">
          {([ ["today", "Today & overdue", todayShopping.length], ["week", "Next 7 days", weekShopping.length] ] as const).map(([tab,label,count]) => <button key={tab} type="button" aria-pressed={shoppingTab === tab} onClick={() => {setShoppingTab(tab);setShowAllShopping(false);}} className={`${buttonClass} border ${shoppingTab === tab ? "border-[var(--sortd-teal-dark)] bg-[var(--sortd-muted)] text-[var(--sortd-text)]" : "border-[var(--sortd-border)] text-[var(--sortd-text-muted)]"}`}>{label} · {count}</button>)}
        </div>
        <p className="text-xl font-semibold">{money(selectedShopping.reduce((sum,item) => sum + (item.estimatedCost ?? 0), 0))} <span className="text-xs font-normal text-[var(--sortd-text-muted)]">estimated for selected items</span></p>
        <div className="mt-3 space-y-1">{selectedShopping.slice(0,showAllShopping ? undefined : 5).map(item => <div key={`${item.listId}:${item.id}`} className="flex min-w-0 flex-wrap items-center gap-2 border-b border-[var(--sortd-border)] py-2 last:border-b-0">
          <input type="checkbox" checked={false} onChange={() => updateShopping(item.listId,item.id,{purchased:true})} aria-label={`Mark ${item.title} purchased`} className="h-5 w-5 shrink-0 accent-[var(--sortd-teal-dark)]" />
          <div className="min-w-0 flex-1"><p className="break-words text-sm font-medium">{item.title}</p><p className="text-xs text-[var(--sortd-text-muted)]">{item.shop || item.listName}{item.estimatedCost != null ? ` · ${money(item.estimatedCost)}` : ""}</p></div>
          <input type="date" value={item.plannedPurchaseDate ?? ""} onChange={event => updateShopping(item.listId,item.id,{plannedPurchaseDate:event.target.value || null})} aria-label={`Reschedule ${item.title}`} className="min-h-10 w-[135px] max-w-full rounded-lg border border-[var(--sortd-border)] bg-[var(--sortd-card)] px-2 text-xs" />
        </div>)}{selectedShopping.length > 5 && <button type="button" onClick={() => setShowAllShopping(!showAllShopping)} className={`${buttonClass} text-[var(--sortd-teal-dark)]`}>{showAllShopping ? "Show fewer" : `Show all ${selectedShopping.length}`}</button>}{selectedShopping.length === 0 && <p className="text-sm text-[var(--sortd-text-muted)]">No purchases planned for this period.</p>}</div>
      </Panel>
      <Panel title="Today's food" kind="food" action={() => onNavigate("food")}>
        <div className="space-y-2">{mealTypes.map(type => { const entries = mealEntries.filter(e => e.mealType === type); const names = entries.map(e => foodData.meals.find(m => m.id === e.mealId)?.name).filter(Boolean); return <div key={type} className="flex items-center gap-3 rounded-xl bg-[#f4f8f6] px-3 py-3 text-sm"><span className="w-20 shrink-0 text-xs font-medium capitalize text-[#0f766e]">{type}</span><span className="min-w-0 break-words">{names.length ? names.join(", ") : "Not planned"}</span></div>; })}</div>
      </Panel>
    </div>

  </div>;
}

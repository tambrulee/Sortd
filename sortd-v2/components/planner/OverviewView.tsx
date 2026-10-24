"use client";

import { useState } from "react";
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

function Panel({ title, action, children }: { title: string; action: () => void; children: React.ReactNode }) {
  return <section className="min-w-0 rounded-2xl border border-[var(--sortd-border)] bg-[var(--sortd-card)] p-4 sm:p-5">
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="font-semibold text-[var(--sortd-text)]">{title}</h2>
      <button type="button" onClick={action} className={`${buttonClass} shrink-0 text-xs text-[var(--sortd-teal-dark)] hover:underline`}>View all →</button>
    </div>
    {children}
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

  return <div className="min-w-0 w-full space-y-4 rounded-3xl border border-[var(--sortd-border)] bg-[var(--sortd-surface)] p-3 shadow-sm sm:p-5 md:p-7">
    <header className="mb-2">
      <p className="text-sm font-medium text-[var(--sortd-teal-dark)]">{new Intl.DateTimeFormat("en-GB", { weekday:"long", day:"numeric", month:"long" }).format(now)}</p>
      <h1 className="mt-1 text-3xl font-bold text-[var(--sortd-text)]">Overview</h1>
      <p className="mt-1 text-sm text-[var(--sortd-text-muted)]">Your life, at a glance.</p>
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
    <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
      <Panel title="Coming up · 7 days" action={() => onNavigate("my-day")}>
        {upcoming.length ? <div className="space-y-2">{upcoming.slice(0,4).map(t => <button key={`${t.projectId}:${t.id}`} type="button" onClick={() => onOpenProject(t.projectId)} className="flex w-full items-start justify-between gap-3 text-left text-sm hover:text-[var(--sortd-teal-dark)]"><span className="min-w-0 break-words">{t.title}</span><span className="shrink-0 text-xs text-[var(--sortd-text-muted)]">{shortDate(t.dueDate!)}</span></button>)}{upcoming.length > 4 && <p className="text-xs text-[var(--sortd-text-muted)]">+{upcoming.length-4} more</p>}</div> : <p className="text-sm text-[var(--sortd-text-muted)]">No project tasks due in the next seven days.</p>}
      </Panel>
      <Panel title="Projects" action={() => onNavigate("projects")}>
        <p className="mb-3 text-sm text-[var(--sortd-text-muted)]">{currentProjects.length} active or planned</p>
        {nextProjects.length ? <div className="space-y-2">{nextProjects.slice(0,3).map(p => <button key={p.id} type="button" onClick={() => onOpenProject(p.id)} className="flex w-full items-center justify-between gap-2 text-left text-sm hover:text-[var(--sortd-teal-dark)]"><span className="min-w-0 truncate">{p.name}</span><span className="shrink-0 text-xs text-[var(--sortd-text-muted)]">{p.targetDate ? shortDate(p.targetDate) : "No target"}</span></button>)}</div> : <p className="text-sm text-[var(--sortd-text-muted)]">No active or planned projects.</p>}
      </Panel>
      <Panel title="Goals & dreams" action={() => onNavigate("goals")}>
        <p className="mb-3 text-sm text-[var(--sortd-text-muted)]">{goals.filter(g => g.status === "active").length} active goals · {dreams.length} dreams</p>
        <div className="space-y-2">{goals.filter(g => g.status === "active").slice(0,3).map(g => <p key={g.id} className="text-sm">{g.title}</p>)}{!goals.some(g => g.status === "active") && <p className="text-sm text-[var(--sortd-text-muted)]">No active goals.</p>}</div>
        <button type="button" onClick={() => onNavigate("dreams")} className={`${buttonClass} mt-2 text-xs text-[var(--sortd-teal-dark)]`}>Explore dreams →</button>
      </Panel>
      <Panel title="Shopping plans" action={() => onNavigate("shopping")}>
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
      <Panel title="Today's food" action={() => onNavigate("food")}>
        <div className="space-y-2">{mealTypes.map(type => { const entries = mealEntries.filter(e => e.mealType === type); const names = entries.map(e => foodData.meals.find(m => m.id === e.mealId)?.name).filter(Boolean); return <div key={type} className="flex gap-3 text-sm"><span className="w-20 shrink-0 capitalize text-[var(--sortd-text-muted)]">{type}</span><span className="min-w-0 break-words">{names.length ? names.join(", ") : "Not planned"}</span></div>; })}</div>
      </Panel>
    </div>
    <section className="rounded-2xl border border-[var(--sortd-border)] bg-[var(--sortd-card)] p-4 sm:p-5">
      <h2 className="mb-2 font-semibold">✦ Worth knowing</h2>
      <p className="text-sm text-[var(--sortd-text-muted)]">{insight}</p>
      <p className="mt-2 text-xs text-[var(--sortd-text-muted)]">Based on your current dates and completion status. Deeper insights can come later.</p>
    </section>
  </div>;
}

"use client";

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
};

function localKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

const money = (amount: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(amount);
const shortDate = (date: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(`${date}T12:00:00`));

function Panel({ title, action, children }: { title: string; action: () => void; children: React.ReactNode }) {
  return <section className="min-w-0 rounded-2xl border border-[var(--sortd-border)] bg-[var(--sortd-card)] p-4 sm:p-5">
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="font-semibold text-[var(--sortd-text)]">{title}</h2>
      <button type="button" onClick={action} className="shrink-0 text-xs font-semibold text-[var(--sortd-teal-dark)] hover:underline">View all →</button>
    </div>
    {children}
  </section>;
}

export default function OverviewView({ projects, routines, goals, dreams, shoppingLists, foodData, onNavigate, onOpenProject }: Props) {
  const now = new Date();
  const today = localKey(now);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);
  const weekEnd = localKey(end);
  const openTasks = projects.flatMap(p => p.tasks.filter(t => !t.completed && t.title.trim()));
  const activeRoutines = routines.filter(r => !r.archived).flatMap(r => r.tasks.filter(t => t.active));
  const tasksToday = openTasks.filter(t => t.dueDate && t.dueDate <= today);
  const routinesToday = activeRoutines.filter(t => t.nextDueDate <= today);
  const overdue = tasksToday.filter(t => t.dueDate! < today).length + routinesToday.filter(t => t.nextDueDate < today).length;
  const upcoming = openTasks.filter(t => t.dueDate && t.dueDate > today && t.dueDate <= weekEnd).sort((a,b) => a.dueDate!.localeCompare(b.dueDate!));
  const currentProjects = projects.filter(p => p.status === "active" || p.status === "planned");
  const nextProjects = [...currentProjects].sort((a,b) => (a.targetDate ?? "9999").localeCompare(b.targetDate ?? "9999"));
  const planned = shoppingLists.filter(l => !l.archived).flatMap(l => l.items.map(item => ({...item, listName:l.name}))).filter(item => !item.purchased && item.plannedPurchaseDate && item.plannedPurchaseDate <= weekEnd);
  const todayShopping = planned.filter(item => item.plannedPurchaseDate! <= today);
  const weekShopping = planned.filter(item => item.plannedPurchaseDate! > today);
  const mealEntries = foodData.mealPlan.filter(entry => entry.date === today);
  const mealTypes = ["breakfast", "lunch", "dinner"] as const;
  const insight = overdue > 0
    ? `${overdue} item${overdue === 1 ? " is" : "s are"} overdue across your tasks and routines.`
    : upcoming.length > 0
      ? `${upcoming.length} project task${upcoming.length === 1 ? " is" : "s are"} due in the next seven days.`
      : "Nothing overdue or due in the next seven days. You have room to choose what matters next.";

  return <div className="min-w-0 w-full space-y-4 rounded-3xl border border-[var(--sortd-border)] bg-[var(--sortd-surface)] p-3 shadow-sm sm:p-5 md:p-7">
    <header className="mb-2">
      <p className="text-sm font-medium text-[var(--sortd-teal-dark)]">{new Intl.DateTimeFormat("en-GB", { weekday:"long", day:"numeric", month:"long" }).format(now)}</p>
      <h1 className="mt-1 text-3xl font-bold text-[var(--sortd-text)]">Overview</h1>
      <p className="mt-1 text-sm text-[var(--sortd-text-muted)]">Your life, at a glance.</p>
    </header>
    <Panel title="Your day" action={() => onNavigate("my-day")}>
      <div className="grid grid-cols-3 gap-2">
        {[["Routines due", routinesToday.length], ["Tasks due", tasksToday.length], ["Overdue", overdue]].map(([label,value]) => <div key={label} className="rounded-xl bg-[var(--sortd-muted)] p-3 text-center"><p className="text-2xl font-bold tabular-nums">{value}</p><p className="mt-1 text-xs text-[var(--sortd-text-muted)]">{label}</p></div>)}
      </div>
    </Panel>
    <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
      <Panel title="Coming up · 7 days" action={() => onNavigate("my-day")}>
        {upcoming.length ? <div className="space-y-2">{upcoming.slice(0,4).map(t => <div key={t.id} className="flex items-start justify-between gap-3 text-sm"><span className="min-w-0 break-words">{t.title}</span><span className="shrink-0 text-xs text-[var(--sortd-text-muted)]">{shortDate(t.dueDate!)}</span></div>)}{upcoming.length > 4 && <p className="text-xs text-[var(--sortd-text-muted)]">+{upcoming.length-4} more</p>}</div> : <p className="text-sm text-[var(--sortd-text-muted)]">No project tasks due in the next seven days.</p>}
      </Panel>
      <Panel title="Projects" action={() => onNavigate("projects")}>
        <p className="mb-3 text-sm text-[var(--sortd-text-muted)]">{currentProjects.length} active or planned</p>
        {nextProjects.length ? <div className="space-y-2">{nextProjects.slice(0,3).map(p => <button key={p.id} type="button" onClick={() => onOpenProject(p.id)} className="flex w-full items-center justify-between gap-2 text-left text-sm hover:text-[var(--sortd-teal-dark)]"><span className="min-w-0 truncate">{p.name}</span><span className="shrink-0 text-xs text-[var(--sortd-text-muted)]">{p.targetDate ? shortDate(p.targetDate) : "No target"}</span></button>)}</div> : <p className="text-sm text-[var(--sortd-text-muted)]">No active or planned projects.</p>}
      </Panel>
      <Panel title="Goals & dreams" action={() => onNavigate("goals")}>
        <p className="mb-3 text-sm text-[var(--sortd-text-muted)]">{goals.filter(g => g.status === "active").length} active goals · {dreams.length} dreams</p>
        <div className="space-y-2">{goals.filter(g => g.status === "active").slice(0,3).map(g => <p key={g.id} className="text-sm">{g.title}</p>)}{!goals.some(g => g.status === "active") && <p className="text-sm text-[var(--sortd-text-muted)]">No active goals.</p>}</div>
        <button type="button" onClick={() => onNavigate("dreams")} className="mt-3 text-xs font-medium text-[var(--sortd-teal-dark)]">Explore dreams →</button>
      </Panel>
      <Panel title="Shopping plans" action={() => onNavigate("shopping")}>
        <p className="text-sm text-[var(--sortd-text-muted)]">{todayShopping.length} today or overdue · {weekShopping.length} later this week</p>
        <p className="mt-2 text-xl font-semibold">{money(planned.reduce((sum,item) => sum + (item.estimatedCost ?? 0), 0))} <span className="text-xs font-normal text-[var(--sortd-text-muted)]">estimated</span></p>
        <div className="mt-3 space-y-2">{planned.slice(0,3).map(item => <div key={item.id} className="flex justify-between gap-2 text-sm"><span className="min-w-0 truncate">{item.title}</span><span className="shrink-0 text-xs text-[var(--sortd-text-muted)]">{shortDate(item.plannedPurchaseDate!)}</span></div>)}{planned.length === 0 && <p className="text-sm text-[var(--sortd-text-muted)]">No purchases planned through the next seven days.</p>}</div>
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

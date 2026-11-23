"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Sparkles, Pin, Check } from "lucide-react";
import ProjectUploadedCover from "@/components/planner/project/ProjectUploadedCover";
import type { AppView, Dream, FoodData, FitnessData, Goal, Routine, ShoppingList, SortdList, ProjectCover, OverviewPins } from "@/lib/types";

type Props = {
  projects: SortdList[];
  routines: Routine[];
  goals: Goal[];
  dreams: Dream[];
  shoppingLists: ShoppingList[];
  foodData: FoodData;
  fitnessData: FitnessData;
  overviewPins: OverviewPins;
  onChangeOverviewPins: (pins: OverviewPins) => void;
  onNavigate: (view: AppView) => void;
  onOpenProject: (id: string) => void;
  onCompleteProjectTask: (projectId: string, taskId: string) => void;
  onCompleteRoutineTask: (routineId: string, taskId: string) => void;
  onChangeShoppingLists: (lists: ShoppingList[]) => void;
};

type InsightFeedback = Record<string, { status: "helpful" | "not-useful" | "later"; until?: string }>;
const INSIGHT_FEEDBACK_KEY = "sortd-insights-feedback-v2";

function localKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
const money = (amount: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(amount);
const shortDate = (date: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(`${date}T12:00:00`));


function CoverImage({
  cover,
  alt,
  className = "",
}: {
  cover?: ProjectCover;
  alt: string;
  className?: string;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  const imageUrl = cover?.source === "unsplash" ? cover.url : null;
  const failed = imageUrl !== null && failedUrl === imageUrl;

  return (
    <div
      className={`relative isolate min-w-0 overflow-hidden bg-gradient-to-br from-[#dcefe9] via-[#c4d9dc] to-[#8ca9ad] ${className}`}
    >
      {cover?.source === "unsplash" && !failed ? (
        <img
          src={cover.url}
          alt={alt}
          loading="lazy"
          onError={() => {
            if (imageUrl) setFailedUrl(imageUrl);
          }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : cover?.source === "upload" ? (
        <div className="absolute inset-0 [&_img]:h-full [&_img]:w-full [&_img]:object-cover [&>div]:h-full [&>div]:w-full">
          <ProjectUploadedCover path={cover.path} />
        </div>
      ) : (
        <div className="flex h-full items-center justify-center text-[#427e79]">
          <Sparkles size={27} strokeWidth={1.3} />
        </div>
      )}

      {cover?.source === "unsplash" &&
        !failed &&
        cover.photographerUrl && (
          <a
            href={cover.photographerUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => event.stopPropagation()}
            className="absolute bottom-1 right-1 z-10 rounded bg-black/55 px-1.5 py-0.5 text-[9px] text-white"
          >
            
          </a>
        )}
    </div>
  );
}


export default function OverviewView({ projects, routines, goals, dreams, shoppingLists, foodData, fitnessData, overviewPins, onChangeOverviewPins, onNavigate, onOpenProject, onCompleteProjectTask, onCompleteRoutineTask }: Props) {
  const [dayTab, setDayTab] = useState<"routines" | "tasks" | "overdue" | null>(null);
  const [insightFeedback, setInsightFeedback] = useState<InsightFeedback>({});
  const [feedbackReady, setFeedbackReady] = useState(false);
  const [hiddenCategories, setHiddenCategories] = useState<string[]>([]);

  // Load browser-only preferences after mount. Deferring the state updates
  // avoids synchronous setState in an effect and keeps SSR hydration consistent.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(INSIGHT_FEEDBACK_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as {
            feedback?: InsightFeedback;
            hiddenCategories?: string[];
          };
          setInsightFeedback(parsed.feedback ?? {});
          setHiddenCategories(
            Array.isArray(parsed.hiddenCategories) ? parsed.hiddenCategories : []
          );
        }
      } catch {
        // Browser storage may be unavailable or contain invalid old data.
      } finally {
        setFeedbackReady(true);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!feedbackReady) return;
    try {
      window.localStorage.setItem(INSIGHT_FEEDBACK_KEY, JSON.stringify({ feedback: insightFeedback, hiddenCategories }));
    } catch { /* Keep the interface usable if browser storage is disabled. */ }
  }, [feedbackReady, insightFeedback, hiddenCategories]);
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
  const planned = shoppingLists.filter(l => !l.archived).flatMap(l => l.items.map(item => ({ ...item, listId: l.id, listName: l.name }))).filter(item => !item.purchased && item.plannedPurchaseDate && item.plannedPurchaseDate <= weekEnd).sort((a,b) => a.plannedPurchaseDate!.localeCompare(b.plannedPurchaseDate!));
  const todayShopping = planned.filter(item => item.plannedPurchaseDate! <= today);
  const selectedDayItems = dayTab === "routines"
    ? routinesToday.map(t => ({ kind: "routine" as const, id: `${t.routineId}:${t.id}`, title: t.title, subtitle: t.routineName, date: t.nextDueDate, parentId: t.routineId, taskId: t.id }))
    : dayTab === "tasks"
      ? tasksToday.map(t => ({ kind: "task" as const, id: `${t.projectId}:${t.id}`, title: t.title, subtitle: t.projectName, date: t.dueDate!, parentId: t.projectId, taskId: t.id }))
      : [...overdueRoutines.map(t => ({ kind: "routine" as const, id: `${t.routineId}:${t.id}`, title: t.title, subtitle: t.routineName, date: t.nextDueDate, parentId: t.routineId, taskId: t.id })), ...overdueTasks.map(t => ({ kind: "task" as const, id: `${t.projectId}:${t.id}`, title: t.title, subtitle: t.projectName, date: t.dueDate!, parentId: t.projectId, taskId: t.id }))];
  selectedDayItems.sort((a,b) => a.date.localeCompare(b.date));
  const mealEntries = foodData.mealPlan.filter(entry => entry.date === today);
  const mealTypes = ["breakfast", "lunch", "dinner"] as const;
  // Explainable, local insights: no AI request or external data transfer.
  // Each insight has a stable ID so it can be dismissed for this visit.
  type WorkspaceInsight = {
    id: string;
    priority: number;
    label: string;
    message: string;
    actionLabel: string;
    action: () => void;
  };
  const insights: WorkspaceInsight[] = [];
  const addInsight = (item: WorkspaceInsight) => insights.push(item);

  const projectsDueSoon = currentProjects.filter(p => p.targetDate && p.targetDate >= today && p.targetDate <= weekEnd);
  const projectsPastTarget = currentProjects.filter(p => p.targetDate && p.targetDate < today);
  const unlinkedDreams = dreams.filter(d => !goals.some(g => g.dreamId === d.id));
  const activeGoals = goals.filter(g => g.status === "active");
  const goalsWithoutProjects = activeGoals.filter(g => !projects.some(p => p.goalId === g.id));
  const unplannedProjectTasks = openTasks.filter(t => !t.dueDate);
  const shoppingCost = planned.reduce((sum, item) => sum + (item.estimatedCost ?? 0), 0);

  if (projectsPastTarget.length) addInsight({
    id: "projects-past-target", priority: 100, label: "Projects",
    message: `${projectsPastTarget.length} active or planned project${projectsPastTarget.length === 1 ? " has" : "s have"} passed its target date. It may be worth reviewing the dates or next steps.`,
    actionLabel: "Review projects", action: () => onNavigate("projects"),
  });
  if (projectsDueSoon.length) addInsight({
    id: "projects-due-soon", priority: 90, label: "Coming up",
    message: `${projectsDueSoon.length} project${projectsDueSoon.length === 1 ? " has" : "s have"} a target date within the next seven days.`,
    actionLabel: "View projects", action: () => onNavigate("projects"),
  });
  if (upcoming.length) addInsight({
    id: "tasks-due-soon", priority: 80, label: "Coming up",
    message: `${upcoming.length} project task${upcoming.length === 1 ? " is" : "s are"} due within the next seven days.`,
    actionLabel: "See upcoming tasks", action: () => onNavigate("my-day"),
  });
  if (overdue) addInsight({
    id: "overdue-items", priority: 65, label: "Your day",
    message: `${overdue} item${overdue === 1 ? " is" : "s are"} overdue across your routines and project tasks. You can review them at your own pace.`,
    actionLabel: "Review overdue items", action: () => {
  setDayTab("overdue");
  onNavigate("my-day");
},
  });
  if (todayShopping.length) addInsight({
    id: "shopping-today", priority: 60, label: "Shopping",
    message: `${todayShopping.length} planned purchase${todayShopping.length === 1 ? " is" : "s are"} scheduled for today or earlier.`,
    actionLabel: "Review shopping", action: () => onNavigate("shopping"),
  });
  if (unplannedProjectTasks.length >= 3) addInsight({
    id: "tasks-without-dates", priority: 40, label: "Projects",
    message: `${unplannedProjectTasks.length} open project tasks have no due date. That's fine if they're flexible — no need to schedule them unless it helps.`,
    actionLabel: "Explore projects", action: () => onNavigate("projects"),
  });
  if (goalsWithoutProjects.length) addInsight({
    id: "goals-without-projects", priority: 30, label: "Goals",
    message: `${goalsWithoutProjects.length} active goal${goalsWithoutProjects.length === 1 ? " isn't" : "s aren't"} linked to a project yet. You could connect one when you're ready to take action.`,
    actionLabel: "Explore goals", action: () => onNavigate("goals"),
  });
  if (unlinkedDreams.length) addInsight({
    id: "dreams-to-explore", priority: 20, label: "Dreams",
    message: `${unlinkedDreams.length} dream${unlinkedDreams.length === 1 ? " has" : "s have"} no linked goals. Some ideas are worth keeping without a plan.`,
    actionLabel: "Explore dreams", action: () => onNavigate("dreams"),
  });
  if (planned.length && shoppingCost > 0) addInsight({
    id: "shopping-budget", priority: 15, label: "Shopping",
    message: `Your planned purchases through the next seven days total approximately ${money(shoppingCost)} in entered estimates.`,
    actionLabel: "View shopping plans", action: () => onNavigate("shopping"),
  });
  const visibleInsights = insights
    .filter(item => !hiddenCategories.includes(item.label))
    .filter(item => {
      const feedback = insightFeedback[item.id];
      if (!feedback) return true;
      if (feedback.status === "not-useful") return false;
      if (feedback.status === "later" && feedback.until && feedback.until > today) return false;
      return true;
    })
    .sort((a, b) => {
      const aBoost = insightFeedback[a.id]?.status === "helpful" ? 5 : 0;
      const bBoost = insightFeedback[b.id]?.status === "helpful" ? 5 : 0;
      return (b.priority + bBoost) - (a.priority + aBoost);
    });
  const insightCategories = Array.from(new Set(insights.map(item => item.label)));
  function recordInsightFeedback(id: string, status: "helpful" | "not-useful" | "later") {
    const until = status === "later" ? localKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7)) : undefined;
    setInsightFeedback(prev => ({ ...prev, [id]: { status, until } }));
  }
  const featuredInsight = visibleInsights[0];

  const pinnedProjects = overviewPins.projects.map(id => currentProjects.find(p => p.id === id)).filter((p): p is SortdList => Boolean(p));
  const pinnedGoals = overviewPins.goals.map(id => goals.find(g => g.id === id)).filter((g): g is Goal => Boolean(g));
  const pinnedDreams = overviewPins.dreams.map(id => dreams.find(d => d.id === id)).filter((d): d is Dream => Boolean(d));
  const scheduledRegimeId = fitnessData.weeklyPlan?.find(entry => entry.day === now.getDay())?.regimeId;
  const todaysRegime = fitnessData.regimes?.find(regime => regime.id === scheduledRegimeId);
  const todaysLegacyWorkout = fitnessData.schedule?.filter(s => s.date === today).map(s => fitnessData.workouts?.find(w => w.id === s.workoutId)).find(Boolean);
  const workoutName = todaysRegime?.name ?? todaysLegacyWorkout?.name;
  const workoutCover = todaysRegime ? fitnessData.covers?.[todaysRegime.id] : todaysLegacyWorkout ? fitnessData.covers?.[todaysLegacyWorkout.id] : undefined;
  const todayMealNames = mealTypes.map(type => ({ type, names: mealEntries.filter(e => e.mealType === type).map(e => foodData.meals.find(m => m.id === e.mealId)?.name).filter((name): name is string => Boolean(name)) }));
  const togglePin = (kind: keyof OverviewPins, id: string) => {
    const current = overviewPins[kind];
    const next = current.includes(id) ? current.filter(item => item !== id) : current.length < 4 ? [...current, id] : current;
    onChangeOverviewPins({ ...overviewPins, [kind]: next });
  };
  const projectDisplay = pinnedProjects.length ? pinnedProjects : currentProjects.slice(0, 4);
  const featuredProject = projectDisplay[0];
  const goalDisplay = pinnedGoals.length ? pinnedGoals : goals.filter(g => g.status === "active").slice(0, 4);
  const dreamDisplay = pinnedDreams.length ? pinnedDreams : dreams.slice(0, 4);
  const miniCard = (id: string, name: string, cover: ProjectCover | undefined, pinned: boolean, onPin: () => void, onOpen: () => void, subtitle?: string) => (
    <article key={id} className="group min-w-0 overflow-hidden rounded-2xl bg-white ring-1 ring-[#dce7e3] transition-shadow hover:shadow-md">
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <button type="button" onClick={onOpen} className="absolute inset-0 block h-full w-full overflow-hidden" aria-label={`Open ${name}`}>
          <CoverImage cover={cover} alt={name} className="absolute inset-0 h-full w-full" />
        </button>
        <button type="button" onClick={onPin} title={pinned ? `Unpin ${name}` : `Pin ${name}`} aria-label={pinned ? `Unpin ${name}` : `Pin ${name}`} className="absolute left-2 top-2 z-10 rounded-full bg-white/95 p-2 text-[#0f766e] shadow-sm hover:bg-white">
          <Pin size={15} fill={pinned ? "currentColor" : "none"}/>
        </button>
      </div>
      <button type="button" onClick={onOpen} className="block w-full min-w-0 px-3 py-3 text-left">
        <p className="line-clamp-2 text-sm font-semibold leading-5 text-[#102a43]">{name}</p>
        {subtitle && <p className="mt-1 line-clamp-2 text-xs text-[#64748b]">{subtitle}</p>}
      </button>
    </article>
  );
  const sectionHeading = (title: string, action: () => void, label: string, kicker?: string) => (
    <div className="mb-4 flex min-w-0 items-end justify-between gap-3">
      <div className="min-w-0">{kicker && <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#0f766e]">{kicker}</p>}<h2 className="text-lg font-semibold tracking-tight text-[#102a43] sm:text-xl">{title}</h2></div>
      <button type="button" onClick={action} className="flex shrink-0 items-center gap-1 text-xs font-semibold text-[#0f766e] hover:underline">{label}<ArrowUpRight size={15}/></button>
    </div>
  );
  const pinPicker = (kind: keyof OverviewPins, choices: { id: string; name: string }[]) => overviewPins[kind].length < 4 && (
    <details className="mt-3 text-xs text-[#0f766e]">
      <summary className="inline-flex cursor-pointer rounded-lg px-1 py-2 font-semibold hover:bg-[#eaf4f0]">+ Choose {kind === "projects" ? "projects" : kind} ({overviewPins[kind].length}/4 pinned)</summary>
      <div className="mt-2 flex flex-wrap gap-2">{choices.filter(c => !overviewPins[kind].includes(c.id)).map(c => <button key={c.id} type="button" onClick={() => togglePin(kind,c.id)} className="rounded-lg border border-[#d7e3df] bg-white px-3 py-2 text-left hover:border-[#0f766e]">{c.name}</button>)}</div>
    </details>
  );

  return <div className="sortd-overview w-full min-w-0 space-y-7 overflow-x-hidden rounded-3xl bg-[#f8faf9]/95 px-3 py-5 text-[#102a43] sm:px-6 lg:px-8">
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[#d7e3df] pb-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0f766e]">{new Intl.DateTimeFormat("en-GB", { weekday:"long", day:"numeric", month:"long" }).format(now)}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Your overview<span className="text-[#0f9b8f]">.</span></h1>
        <p className="mt-1 text-sm text-[#64748b]">A little perspective on what&apos;s ahead.</p>
      </div>
      <button type="button" onClick={() => onNavigate("my-day")} className="rounded-full bg-[#102a43] px-4 py-2 text-xs font-semibold text-white hover:bg-[#145d60]">Open my day ↗</button>
    </header>

    <section aria-label="Coming up" className="min-w-0 rounded-2xl border border-[#dce7e3] bg-white p-4 shadow-sm sm:p-5">
      {sectionHeading("Coming up", () => onNavigate("my-day"), "See my day", "Your agenda")}
      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div className="grid min-w-0 gap-2 sm:grid-cols-2">
          {upcoming.slice(0,4).map(t => <button key={`${t.projectId}:${t.id}`} type="button" onClick={() => onOpenProject(t.projectId)} className="flex min-w-0 items-center gap-3 rounded-xl bg-[#f1f6f4] px-3 py-3 text-left hover:bg-[#e2f0ea]">
            <span className="flex w-12 shrink-0 flex-col items-center rounded-lg bg-white py-1 text-[#0f766e]"><span className="text-[10px] uppercase">{new Intl.DateTimeFormat("en-GB",{month:"short"}).format(new Date(`${t.dueDate}T12:00:00`))}</span><span className="text-lg font-semibold">{new Date(`${t.dueDate}T12:00:00`).getDate()}</span></span>
            <span className="min-w-0 truncate text-sm font-medium">{t.title}</span><ArrowUpRight size={15} className="ml-auto shrink-0 text-[#0f766e]"/>
          </button>)}
          {!upcoming.length && <p className="rounded-xl bg-[#f1f6f4] px-4 py-5 text-sm text-[#64748b]">No project tasks due in the next seven days.</p>}
        </div>
        <div className="flex flex-wrap items-start gap-2 lg:justify-end">
          <button type="button" onClick={() => setDayTab(dayTab === "routines" ? null : "routines")} className="rounded-full bg-[#e9f4f0] px-3 py-2 text-xs font-medium text-[#0f766e]">{routinesToday.length} routines due</button>
          <button type="button" onClick={() => setDayTab(dayTab === "tasks" ? null : "tasks")} className="rounded-full bg-[#e9f4f0] px-3 py-2 text-xs font-medium text-[#0f766e]">{tasksToday.length} tasks due</button>
          <button type="button" onClick={() => setDayTab(dayTab === "overdue" ? null : "overdue")} className="rounded-full bg-[#fff2ed] px-3 py-2 text-xs font-medium text-[#9b5038]">{overdue} overdue</button>
        </div>
      </div>
      {dayTab && <div className="mt-3 rounded-xl border border-[#dce7e3] bg-white p-3"><div className="mb-2 flex justify-between text-xs font-semibold capitalize text-[#64748b]"><span>{dayTab} · {selectedDayItems.length}</span><button type="button" onClick={() => setDayTab(null)}>Close ×</button></div><div className="grid gap-2 sm:grid-cols-2">{selectedDayItems.slice(0,6).map(item => <div key={item.id} className="flex min-w-0 items-center gap-2 rounded-lg bg-[#f3f7f5] p-2 text-sm"><button type="button" aria-label={`Complete ${item.title}`} onClick={() => item.kind === "routine" ? onCompleteRoutineTask(item.parentId,item.taskId) : onCompleteProjectTask(item.parentId,item.taskId)} className="shrink-0 rounded-full border border-[#0f766e] p-1 text-[#0f766e]"><Check size={14}/></button><span className="min-w-0 flex-1 truncate">{item.title}</span><span className="shrink-0 text-xs text-[#64748b]">{shortDate(item.date)}</span></div>)}{!selectedDayItems.length && <p className="text-sm text-[#64748b]">Nothing to show.</p>}</div>{selectedDayItems.length > 6 && <button type="button" onClick={() => onNavigate("my-day")} className="mt-2 text-xs font-semibold text-[#0f766e]">View more ↗</button>}</div>}
    </section>

    <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <section className="min-w-0 rounded-2xl bg-[#eaf3ef] p-4 sm:p-5">
        {sectionHeading("On the menu", () => onNavigate("food"), "Meal plan", "Today")}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">{todayMealNames.map(meal => <div key={meal.type} className="min-w-0 border-t border-[#c8ddd4] pt-3"><p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#0f766e]">{meal.type}</p><p className="mt-1 break-words text-sm font-medium leading-5">{meal.names.join(", ") || "Not planned"}</p></div>)}</div>
      </section>
      <section className="min-w-0 rounded-2xl bg-[#102a43] p-3 text-white shadow-sm sm:p-4">
        <div className="mb-3 flex items-center justify-between gap-2"><div><p className="text-[10px] uppercase tracking-[0.17em] text-[#a7e1d6]">Today</p><h2 className="text-lg font-semibold">Your workout</h2></div><button type="button" onClick={() => onNavigate("fitness")} className="flex items-center gap-1 text-xs font-semibold text-[#b3e7dc]">Fitness <ArrowUpRight size={15}/></button></div>
        <button type="button" onClick={() => onNavigate("fitness")} className="flex w-full min-w-0 items-center gap-3 overflow-hidden rounded-xl bg-white/10 p-2 text-left hover:bg-white/15">
          <span className="relative block h-24 w-28 max-w-[40%] shrink-0 overflow-hidden rounded-lg"><CoverImage cover={workoutCover} alt={workoutName ?? "Fitness"} className="absolute inset-0 h-full w-full" /></span>
          <span className="block min-w-0 flex-1"><span className="block break-words text-sm font-semibold">{workoutName ?? "No workout planned today"}</span><span className="mt-1 block text-xs text-white/70">{todaysRegime ? `${todaysRegime.exercises.length} exercises` : workoutName ? "Scheduled workout" : "Open Fitness to plan a session"}</span></span>
          <ArrowUpRight size={16} className="shrink-0 text-[#b3e7dc]"/>
        </button>
      </section>
    </div>

    <section className="min-w-0 border-t border-[#d7e3df] pt-6">
      {sectionHeading("Priority projects", () => onNavigate("projects"), "All projects", "In focus")}
      {featuredProject ? <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <article className="group relative min-h-[250px] min-w-0 overflow-hidden rounded-2xl bg-[#173c48] sm:min-h-[310px]">
          <CoverImage cover={featuredProject.cover} alt={featuredProject.name} className="absolute inset-0 h-full w-full"/>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0a2637]/90 via-[#0a2637]/30 to-transparent"/>
          <button type="button" onClick={() => onOpenProject(featuredProject.id)} className="absolute inset-0 z-[1] text-left" aria-label={`Open ${featuredProject.name}`}/>
          <button type="button" onClick={() => togglePin("projects",featuredProject.id)} aria-label={overviewPins.projects.includes(featuredProject.id) ? "Unpin featured project" : "Pin featured project"} className="absolute right-3 top-3 z-[2] rounded-full bg-white/90 p-2 text-[#0f766e]"><Pin size={16} fill={overviewPins.projects.includes(featuredProject.id) ? "currentColor" : "none"}/></button>
          <div className="pointer-events-none absolute bottom-0 left-0 z-[2] p-5 text-white"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b4e6db]">Featured project</p><h3 className="mt-2 text-2xl font-semibold sm:text-3xl">{featuredProject.name}</h3><p className="mt-1 text-sm text-white/75">{featuredProject.targetDate ? `Target ${shortDate(featuredProject.targetDate)}` : featuredProject.status}</p></div>
        </article>
        <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-1">{projectDisplay.slice(1,4).map(p => <article key={p.id} className="relative flex min-w-0 overflow-hidden rounded-xl bg-white ring-1 ring-[#dce7e3] lg:min-h-[90px]"><button type="button" onClick={() => onOpenProject(p.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left"><span className="relative block h-24 w-24 shrink-0 overflow-hidden sm:w-28"><CoverImage cover={p.cover} alt={p.name} className="absolute inset-0 h-full w-full"/></span><span className="min-w-0 flex-1 pr-2"><span className="block line-clamp-2 text-sm font-semibold">{p.name}</span><span className="mt-1 block text-xs text-[#64748b]">{p.targetDate ? `Target ${shortDate(p.targetDate)}` : p.status}</span></span></button><button type="button" onClick={() => togglePin("projects",p.id)} aria-label={overviewPins.projects.includes(p.id) ? `Unpin ${p.name}` : `Pin ${p.name}`} className="absolute right-1 top-1 rounded-full bg-white/90 p-1.5 text-[#0f766e]"><Pin size={13} fill={overviewPins.projects.includes(p.id) ? "currentColor" : "none"}/></button></article>)}</div>
      </div> : <div className="rounded-xl bg-white p-6 text-sm text-[#64748b]">Add a project to feature it here.</div>}
      {pinPicker("projects",currentProjects.map(p=>({id:p.id,name:p.name})))}
    </section>

    <div className="grid min-w-0 gap-6 border-t border-[#d7e3df] pt-6 lg:grid-cols-2">
      <section className="min-w-0">{sectionHeading("Goals", () => onNavigate("goals"), "All goals", "What you're working towards")}
        <div className="grid min-w-0 grid-cols-2 gap-4">{goalDisplay.map(g => miniCard(g.id,g.title,g.cover,overviewPins.goals.includes(g.id),()=>togglePin("goals",g.id),()=>onNavigate("goals")))}</div>
        {pinPicker("goals",goals.filter(g=>g.status==="active").map(g=>({id:g.id,name:g.title})))}
      </section>
      <section className="min-w-0">{sectionHeading("Dreams", () => onNavigate("dreams"), "All dreams", "The bigger picture")}
        <div className="grid min-w-0 grid-cols-2 gap-4">{dreamDisplay.map(d => miniCard(d.id,d.title,d.cover,overviewPins.dreams.includes(d.id),()=>togglePin("dreams",d.id),()=>onNavigate("dreams")))}</div>
        {pinPicker("dreams",dreams.map(d=>({id:d.id,name:d.title})))}
      </section>
    </div>

    <div className="grid min-w-0 gap-6 border-t border-[#d7e3df] pt-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <section className="min-w-0" aria-label="Worth knowing">
        <div className="mb-4 flex items-center gap-2"><Sparkles size={20} className="text-[#0f766e]"/><h2 className="text-xl font-semibold">Worth knowing</h2><span className="ml-auto text-[11px] text-[#64748b]">Workspace insights</span></div>
        {featuredInsight ? <div className="border-l-[3px] border-[#0f766e] pl-4"><p className="text-[11px] font-semibold uppercase tracking-wider text-[#0f766e]">{featuredInsight.label}</p><p className="mt-2 text-base leading-7">{featuredInsight.message}</p><div className="mt-3 flex flex-wrap items-center gap-3"><button type="button" onClick={featuredInsight.action} className="text-xs font-semibold text-[#0f766e] hover:underline">{featuredInsight.actionLabel} →</button><button type="button" onClick={() => recordInsightFeedback(featuredInsight.id,"helpful")} className="text-xs text-[#52677b]">Useful</button><button type="button" onClick={() => recordInsightFeedback(featuredInsight.id,"later")} className="text-xs text-[#52677b]">Later</button><button type="button" onClick={() => recordInsightFeedback(featuredInsight.id,"not-useful")} className="text-xs text-[#52677b]">Not useful</button></div></div> : <p className="text-sm text-[#52677b]">Nothing needs highlighting right now.</p>}
        {visibleInsights.length > 1 && <details className="mt-5 border-t border-[#d7e3df] pt-3"><summary className="cursor-pointer text-xs font-semibold text-[#0f766e]">See {visibleInsights.length - 1} more insights</summary><div className="mt-3 space-y-3">{visibleInsights.slice(1).map(item => <div key={item.id} className="border-l-2 border-[#c7ddd4] pl-3"><p className="text-xs font-semibold text-[#0f766e]">{item.label}</p><p className="mt-1 text-sm">{item.message}</p><div className="mt-2 flex flex-wrap gap-3 text-xs"><button type="button" onClick={item.action} className="font-semibold text-[#0f766e]">{item.actionLabel} →</button><button type="button" onClick={() => recordInsightFeedback(item.id,"helpful")}>Useful</button><button type="button" onClick={() => recordInsightFeedback(item.id,"later")}>Later</button><button type="button" onClick={() => recordInsightFeedback(item.id,"not-useful")}>Not useful</button></div></div>)}</div></details>}
        <details className="mt-3"><summary className="cursor-pointer text-xs text-[#52677b]">Customise insights</summary><div className="mt-2 flex flex-wrap gap-3">{insightCategories.map(category => <label key={category} className="flex items-center gap-1.5 text-xs"><input type="checkbox" checked={!hiddenCategories.includes(category)} onChange={event => setHiddenCategories(prev => event.target.checked ? prev.filter(c => c !== category) : [...prev,category])}/>{category}</label>)}<button type="button" onClick={() => {setInsightFeedback({});setHiddenCategories([]);}} className="text-xs font-semibold text-[#0f766e]">Reset</button></div></details>
      </section>
      <section className="min-w-0 rounded-2xl bg-[#eaf3ef] p-4 sm:p-5">
        {sectionHeading("Shopping plans", () => onNavigate("shopping"), "Open shopping", "Next seven days")}
        <p className="text-3xl font-semibold tracking-tight">{money(shoppingCost)}</p><p className="mt-1 text-xs text-[#64748b]">Estimated · {planned.length} planned purchases</p>
        <div className="mt-4 flex flex-wrap gap-2">{planned.slice(0,3).map(item => <span key={`${item.listId}:${item.id}`} className="max-w-full truncate rounded-full bg-white px-3 py-1.5 text-xs">{item.title}</span>)}{planned.length > 3 && <button type="button" onClick={() => onNavigate("shopping")} className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#0f766e]">+{planned.length - 3} more</button>}</div>
      </section>
    </div>
  </div>;
}

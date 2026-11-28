"use client";

import { useEffect, useState } from "react";
import CoverDisplay from "@/components/covers/CoverDisplay";
import type { FoodData } from "@/lib/types";
import ProjectUploadedCover from "@/components/planner/project/ProjectUploadedCover";
import {
  Routine,
  AdhocTask,
  SortdList,
  Task,
} from "@/lib/types";

import ItemDetailsModal from "@/components/task_management/ItemDetailsModal";

type TaskWithProject = Task & {
  projectId: string;
  projectName: string;
};

type RoutineTaskForDay = Routine["tasks"][number] & {
  routineId: string;
  routineName: string;
};

type MyDayViewProps = {
  foodData: FoodData;
  onOpenFood: () => void;
  tasks: TaskWithProject[];
  adhocTasks: AdhocTask[];
  onCompleteAdhocTask: (id: string) => void;
  onUpdateAdhocTask: (id: string, updates: Partial<AdhocTask>) => void;
  routines: Routine[];
  projects: SortdList[];

  onChangeRoutines: (
    routines: Routine[],
  ) => void;

  onOpenProject: (
    projectId: string,
  ) => void;

  onCompleteProjectTask: (
    projectId: string,
    taskId: string,
  ) => void;

  onCompleteRoutineTask: (
    routineId: string,
    taskId: string,
  ) => void;

  onUpdateProjectTask: (
    projectId: string,
    taskId: string,
    updates: Partial<Task>
  ) => void;

  onUpdateRoutineTask: (
    routineId: string,
    taskId: string,
    updates: Partial<Routine["tasks"][number]>,
  ) => void;

  onDeleteRoutineTask: (
    routineId: string,
    taskId: string,
  ) => void;
};

function getLocalDateKey() {
  const date = new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatDuration(minutes?: number) {
  if (!minutes) return "No estimate";
  if (minutes < 60) return `${minutes} min`;

  const hours = minutes / 60;

  return Number.isInteger(hours) ? `${hours} hr` : `${hours.toFixed(1)} hrs`;
}

function parseDateKey(
  date: string,
) {
  const [year, month, day] =
    date.split("-").map(Number);

  return new Date(
    year,
    month - 1,
    day,
  );
}

function toDateKey(
  date: Date,
) {
  return [
    date.getFullYear(),
    String(
      date.getMonth() + 1,
    ).padStart(2, "0"),
    String(
      date.getDate(),
    ).padStart(2, "0"),
  ].join("-");
}

function addDays(
  date: Date,
  days: number,
) {
  const next =
    new Date(date);

  next.setDate(
    next.getDate() + days,
  );

  return next;
}

function formatShortDate(
  date?: string,
) {
  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "numeric",
      month: "short",
    },
  ).format(
    parseDateKey(date),
  );
}

export default function MyDayView({
  foodData, onOpenFood,
  tasks,
  adhocTasks,
  onCompleteAdhocTask,
  routines,
  projects,
  onChangeRoutines,
  onOpenProject,
  onCompleteProjectTask,
  onCompleteRoutineTask,
  onUpdateRoutineTask,
  onDeleteRoutineTask,
}: MyDayViewProps) {
  const [today, setToday] = useState(getLocalDateKey);
  useEffect(() => {
    const refresh = () => setToday(getLocalDateKey());
    const timer = window.setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, []);

  const [dayViewMode, setDayViewMode] = useState<"today" | "upcoming">("today");

  const [itemDisplayMode, setItemDisplayMode] = useState<"all" | "grouped" | "board">("grouped");

  // Board progress is independent of scheduling and persists across sessions.
  type BoardStatus = "in-progress" | "completed";
  type BoardEntry = { status: BoardStatus; completedOn?: string; title?: string; subtitle?: string };
  const [boardEntries, setBoardEntries] = useState<Record<string, BoardEntry>>({});
  const [boardReady, setBoardReady] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = JSON.parse(window.localStorage.getItem("sortd-my-day-board-v1") || "{}");
        if (saved && typeof saved === "object" && !Array.isArray(saved)) setBoardEntries(saved);
      } catch { /* Storage unavailable or corrupt; start fresh. */ }
      setBoardReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (!boardReady) return;
    try {
      const currentDay = getLocalDateKey();
      const cleaned = Object.fromEntries(Object.entries(boardEntries).filter(([, entry]) =>
        entry?.status === "in-progress" || (entry?.status === "completed" && entry.completedOn === currentDay)
      ));
      window.localStorage.setItem("sortd-my-day-board-v1", JSON.stringify(cleaned));
    } catch { /* Storage may be blocked. */ }
  }, [boardEntries, boardReady, today]);
  const setBoardEntry = (key: string, entry?: BoardEntry) => {
    setBoardEntries(previous => {
      const next = { ...previous };
      if (entry) next[key] = entry;
      else delete next[key];
      return next;
    });
  };

  const [activeGroup, setActiveGroup] = useState<{kind: "routine" | "project"; id: string; date?: string} | null>(null);
  useEffect(() => { if (!activeGroup) return; const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setActiveGroup(null); }; window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, [activeGroup]);
  const [
    selectedRoutineTask,
    setSelectedRoutineTask,
  ] = useState<RoutineTaskForDay | null>(null);

  const currentRoutineTask = selectedRoutineTask
    ? routines.find((routine) => routine.id === selectedRoutineTask.routineId)?.tasks.find((task) => task.id === selectedRoutineTask.id)
    : undefined;

  const openAdhocTasks = adhocTasks.filter(t => !t.completed && !!t.plannedDate);
  const adhocToday = openAdhocTasks.filter(t => t.plannedDate === today);
  const adhocOverdue = openAdhocTasks.filter(t => t.plannedDate! < today);
  const actionableAdhoc = [...adhocOverdue, ...adhocToday].sort((a,b) => a.plannedDate!.localeCompare(b.plannedDate!));
  const upcomingAdhoc = openAdhocTasks.filter(t => t.plannedDate! > today && t.plannedDate! <= toDateKey(addDays(parseDateKey(today), 7))).sort((a,b) => a.plannedDate!.localeCompare(b.plannedDate!));
  const openTasks = tasks.filter((task) => !task.completed);

  const openRoutineTasks = routines
    .filter((routine) => !routine.archived)
    .flatMap((routine) =>
      routine.tasks
        .filter((task) => task.active)
        .map((task) => ({
          ...task,
          routineId: routine.id,
          routineName: routine.name,
        })),
    );

  const routineTasksDueToday = openRoutineTasks.filter(
    (task) => task.nextDueDate === today,
  );

  const overdueRoutineTasks = openRoutineTasks.filter(
    (task) => task.nextDueDate < today,
  );

  const actionableRoutineTasks = [
    ...overdueRoutineTasks,
    ...routineTasksDueToday,
  ].sort((a, b) => {
    const aOrder =
      a.myDayOrder ??
      Number.MAX_SAFE_INTEGER;

    const bOrder =
      b.myDayOrder ??
      Number.MAX_SAFE_INTEGER;

    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }

    return (
      (a.order ?? 0) -
      (b.order ?? 0)
    );
  });

  const dueToday = openTasks.filter((task) => task.dueDate === today);

  const overdue = openTasks.filter(
    (task) => task.dueDate && task.dueDate < today,
  );

  const actionableProjectTasks = [
    ...overdue,
    ...dueToday,
  ];

  actionableProjectTasks.sort((a, b) => (a.dueDate ?? today).localeCompare(b.dueDate ?? today));

  const taskGroups = Array.from(
    actionableProjectTasks.reduce((groups, task) => {
      const group = groups.get(task.projectId);
      if (group) group.tasks.push(task);
      else groups.set(task.projectId, { projectId: task.projectId, projectName: task.projectName, tasks: [task] });
      return groups;
    }, new Map<string, { projectId: string; projectName: string; tasks: TaskWithProject[] }>()).values(),
  );

  const routineGroups = Array.from(
    actionableRoutineTasks.reduce((groups, task) => {
      const group = groups.get(task.routineId);
      if (group) group.tasks.push(task);
      else groups.set(task.routineId, { routineId: task.routineId, routineName: task.routineName, tasks: [task] });
      return groups;
    }, new Map<string, { routineId: string; routineName: string; tasks: RoutineTaskForDay[] }>()).values(),
  );

  const allActionableItems = [
    ...actionableRoutineTasks.map((task) => ({ kind: "routine" as const, date: task.nextDueDate, task })),
    ...actionableProjectTasks.map((task) => ({ kind: "project" as const, date: task.dueDate ?? today, task })),
    ...actionableAdhoc.map((task) => ({ kind: "adhoc" as const, date: task.plannedDate!, task })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  type BoardItem = { key: string; title: string; subtitle: string; date: string; complete: () => void; open?: () => void };
  const makeBoardItems = (items: typeof allActionableItems): BoardItem[] => items.map(item => {
    if (item.kind === "project") {
      const task = item.task;
      return {
      key: `project:${task.projectId}:${task.id}`, title: task.title || "Untitled task",
      subtitle: task.projectName, date: item.date,
      complete: () => onCompleteProjectTask(task.projectId, task.id),
      open: () => onOpenProject(task.projectId),
    };
    }
    if (item.kind === "routine") {
      const task = item.task;
      return {
      key: `routine:${task.routineId}:${task.id}`, title: task.title || "Untitled routine task",
      subtitle: task.routineName, date: item.date,
      complete: () => onCompleteRoutineTask(task.routineId, task.id),
      open: () => setSelectedRoutineTask(task),
    };
    }
    const task = item.task;
    return { key: `adhoc:${task.id}`, title: task.title || "Untitled to-do", subtitle: "To-do",
      date: item.date, complete: () => onCompleteAdhocTask(task.id) };
  });

  function renderBoard(items: BoardItem[], boardDate: string) {
    const activeKeys = new Set(items.map(item => item.key));
    // Completed cards are kept as snapshots after the parent removes the task.
    const completedSnapshots: BoardItem[] = (boardDate === today ? Object.entries(boardEntries) : [])
      .filter(([key, entry]) => !activeKeys.has(key) && entry.status === "completed" && entry.completedOn === boardDate)
      .map(([key, entry]) => ({ key, title: entry.title || "Completed task", subtitle: entry.subtitle || "", date: boardDate, complete: () => {} }));
    const columns = [
      { id: "not-started", label: "Not Started", tint: "bg-slate-100" },
      { id: "in-progress", label: "In Progress", tint: "bg-amber-50" },
      { id: "completed", label: "Completed", tint: "bg-emerald-50" },
    ] as const;
    return <div className="grid min-w-0 gap-3 lg:grid-cols-3">
      {columns.map(column => {
        const visible = [...items, ...completedSnapshots].filter(item => {
          const entry = boardEntries[item.key];
          const status = entry?.status === "completed" && entry.completedOn !== today
            ? "not-started" : (entry?.status || "not-started");
          return status === column.id;
        });
        return <section key={column.id} className={`min-w-0 rounded-2xl border border-[var(--sortd-border)] ${column.tint} p-3 sm:p-4`}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="font-semibold text-[var(--sortd-navy)]">{column.label}</h3>
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">{visible.length}</span>
          </div>
          <div className="space-y-2">
            {visible.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">No tasks</p>}
            {visible.map(item => <article key={item.key} className="min-w-0 rounded-xl border border-[var(--sortd-border)] bg-white p-3 shadow-sm">
              <p className="break-words text-sm font-semibold text-slate-900">{item.title}</p>
              <p className="mt-1 break-words text-xs text-slate-500">{item.subtitle}{item.date < boardDate ? " · Overdue" : ""}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {column.id === "not-started" && <button type="button" onClick={() => setBoardEntry(item.key, { status: "in-progress" })} className="rounded-lg bg-amber-100 px-2.5 py-1.5 text-xs font-semibold text-amber-900">Start</button>}
                {column.id === "in-progress" && <button type="button" onClick={() => setBoardEntry(item.key)} className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700">Not started</button>}
                {column.id !== "completed" && <button type="button" onClick={() => {
                  setBoardEntry(item.key, { status: "completed", completedOn: today, title: item.title, subtitle: item.subtitle });
                  item.complete();
                }} className="rounded-lg bg-[#176269] px-2.5 py-1.5 text-xs font-semibold text-white">✓ Complete</button>}
                {item.open && column.id !== "completed" && <button type="button" onClick={item.open} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600">Details</button>}
              </div>
            </article>)}
          </div>
        </section>;
      })}
    </div>;
  }

  const persistentInProgress = makeBoardItems([
    ...openRoutineTasks.map(task => ({ kind: "routine" as const, date: task.nextDueDate, task })),
    ...openTasks.map(task => ({ kind: "project" as const, date: task.dueDate ?? today, task })),
    ...openAdhocTasks.map(task => ({ kind: "adhoc" as const, date: task.plannedDate!, task })),
  ]).filter(item => boardEntries[item.key]?.status === "in-progress");
  const todayBoardItems = Array.from(
    new Map([...makeBoardItems(allActionableItems), ...persistentInProgress].map(item => [item.key, item])).values()
  );

  const todayDate =
    parseDateKey(today);

  const nextWeekDate =
    addDays(
      todayDate,
      7,
    );

  const nextWeek =
    toDateKey(
      nextWeekDate,
    );

  const upcomingTasks =
    openTasks
      .filter(
        (task) =>
          task.dueDate &&
          task.dueDate > today &&
          task.dueDate <= nextWeek,
      )
      .sort((a, b) =>
        (a.dueDate ?? "").localeCompare(
          b.dueDate ?? "",
        ),
      );

  const upcomingRoutineTasks =
    openRoutineTasks
      .filter(
        (task) =>
          task.nextDueDate > today &&
          task.nextDueDate <= nextWeek,
      )
      .sort((a, b) =>
        a.nextDueDate.localeCompare(
          b.nextDueDate,
        ),
      );

  const projectWorkloadMinutes = dueToday.reduce(
    (total, task) => total + (task.durationMinutes ?? 0),
    0,
  );

  const routineWorkloadMinutes = routineTasksDueToday.reduce(
    (total, task) => total + (task.durationMinutes ?? 0),
    0,
  );

  const workloadMinutes = projectWorkloadMinutes + routineWorkloadMinutes;

  const formattedDate = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  function renderAdhoc(task: AdhocTask) {
    const overdue = !!task.plannedDate && task.plannedDate < today;
    return <div key={`adhoc:${task.id}`} className="flex min-w-0 items-center gap-3 rounded-xl border border-[var(--sortd-border)] bg-white px-3 py-2 sm:px-4">
      <button type="button" onClick={() => onCompleteAdhocTask(task.id)} aria-label={`Complete ${task.title}`} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-[var(--sortd-teal-dark)] text-[var(--sortd-teal-dark)]">✓</button>
      <div className="min-w-0 flex-1"><p className="break-words font-medium text-slate-900">{task.title}</p><p className="text-xs text-slate-500">To-do{task.priority ? ` · ${task.priority} priority` : ""}</p></div>
      <span className={`shrink-0 text-xs ${overdue ? "text-red-700" : "text-slate-500"}`}>{overdue ? "Overdue" : formatShortDate(task.plannedDate)}</span>
    </div>;
  }

  function renderTask(
    task: TaskWithProject,
    options?: {
      showStatus?: boolean;
      showProject?: boolean;
    },
  ) {
    const isOverdue =
      !!task.dueDate &&
      task.dueDate < today;
    return (
      <div
        key={`${task.projectId}-${task.id}`}
        className="flex min-w-0 w-full flex-wrap items-center gap-2 rounded-xl border border-[var(--sortd-border)] bg-[var(--sortd-card)] px-3 py-1.5 sm:px-4"
      >
        <button
          type="button"
          onClick={() => onCompleteProjectTask(task.projectId, task.id)}
          aria-label={`Complete ${task.title}`}
          title="Mark task complete"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-[var(--sortd-teal-dark)] text-xs font-bold text-[var(--sortd-teal-dark)] transition hover:bg-[var(--sortd-teal-dark)] hover:text-white"
        >
          ✓
        </button>

        <button
          type="button"
          onClick={() => onOpenProject(task.projectId)}
          className="min-h-11 min-w-0 flex-1 text-left"
        >
          <p className="break-words [overflow-wrap:anywhere] font-medium text-slate-900">
            {task.title || "Untitled task"}
          </p>

          {options?.showProject !== false && <p className="mt-1 break-words [overflow-wrap:anywhere] text-xs text-slate-500">{task.projectName}</p>}
        </button>

        <div className="order-last flex w-full min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-left text-xs text-slate-500 sm:order-none sm:block sm:w-auto sm:shrink-0 sm:text-right">
          {options?.showStatus && (
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                isOverdue
                  ? "bg-red-100 text-red-700"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {isOverdue ? "Overdue" : task.dueDate === today ? "Due today" : formatShortDate(task.dueDate)}
            </span>
          )}

          <p className={options?.showStatus ? "mt-1" : ""}>
            {formatDuration(task.durationMinutes)}
          </p>

          {task.priority && (
            <p className="mt-1 capitalize">
              {task.priority} priority
            </p>
          )}
        </div>
      </div>
    );
  }

  function renderRoutineTask(task: RoutineTaskForDay) {
    const isOverdue = task.nextDueDate < today;

    return (
      <div
        key={`${task.routineId}-${task.id}`}
        className="flex min-w-0 flex-wrap items-center gap-2 rounded-xl border border-[var(--sortd-border)] bg-[var(--sortd-card)] px-3 py-1.5 sm:px-4"
      >
        <button
          type="button"
          onClick={() => onCompleteRoutineTask(task.routineId, task.id)}
          aria-label={`Complete ${task.title}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-[var(--sortd-teal-dark)] text-xs font-bold text-[var(--sortd-teal-dark)] transition hover:bg-[var(--sortd-teal-dark)] hover:text-white"
        >
          ✓
        </button>

        <div className="min-w-0 flex-1">
          <p className="break-words [overflow-wrap:anywhere] font-medium text-slate-900">
            {task.title || "Untitled routine task"}
          </p>

          <p className="mt-1 break-words [overflow-wrap:anywhere] text-xs text-slate-500">{task.routineName}</p>
        </div>

        <span
          className={`order-last max-w-full sm:ml-0 rounded-full sm:order-none sm:shrink-0 px-2 py-0.5 text-xs font-medium ${
            isOverdue
              ? "bg-red-100 text-red-700"
              : "bg-amber-100 text-amber-800"
          }`}
        >
          {isOverdue ? "Overdue" : task.nextDueDate === today ? "Due today" : formatShortDate(task.nextDueDate)}
        </span>

        <button
          type="button"
          onClick={() =>
            setSelectedRoutineTask(task)
          }
          aria-label={`Edit ${task.title}`}
          title="Routine task details"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm text-slate-500 transition hover:bg-[var(--sortd-muted)] hover:text-slate-900"
        >
          •••
        </button>
      </div>
    );
  }

    function renderGroupCard(kind: "routine" | "project", id: string, name: string, count: number, overdueCount: number, date?: string) {
    const source = kind === "routine" ? routines.find(r => r.id === id) : projects.find(p => p.id === id);
    const cover = source?.cover;
    return (
      <button key={`${kind}:${id}:${date ?? "today"}`} type="button" onClick={() => setActiveGroup({kind,id,date})}
        className="group min-w-0 overflow-hidden rounded-2xl border border-[var(--sortd-border)] bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sortd-teal-dark)]">
        <div className="relative h-32 overflow-hidden bg-gradient-to-br from-[#193c45] via-[#34756f] to-[#c6d8d2]">
          {cover?.source === "unsplash" && <img src={cover.url} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" />}
          {cover?.source === "upload" && <ProjectUploadedCover path={cover.path} />}
          {!cover && <span className="absolute inset-0 flex items-center justify-center text-4xl text-white/70">{kind === "routine" ? "↻" : "✦"}</span>}
          <span className="absolute bottom-2 left-3 rounded-md bg-black/45 px-2 py-1 text-[11px] font-medium text-white">{kind === "routine" ? "Routine" : "Project"}</span>
        </div>
        <div className="flex items-center justify-between gap-3 p-4">
          <div className="min-w-0"><h3 className="truncate font-semibold text-[var(--sortd-navy)]">{name || "Untitled"}</h3>
            <p className="mt-1 text-xs text-slate-500">{count} {count === 1 ? "task" : "tasks"} remaining{overdueCount ? ` · ${overdueCount} overdue` : ""}</p></div>
          <span className="shrink-0 text-xl text-[var(--sortd-teal-dark)]" aria-hidden="true">→</span>
        </div>
      </button>
    );
  }

  const activeGroupTasks = activeGroup ? activeGroup.kind === "routine"
    ? openRoutineTasks.filter(t => t.routineId === activeGroup.id && (activeGroup.date ? t.nextDueDate === activeGroup.date : t.nextDueDate <= today))
    : openTasks.filter(t => t.projectId === activeGroup.id && (activeGroup.date ? t.dueDate === activeGroup.date : !!t.dueDate && t.dueDate <= today)) : [];
  const activeGroupName = activeGroup ? activeGroup.kind === "routine"
    ? routines.find(r => r.id === activeGroup.id)?.name
    : projects.find(p => p.id === activeGroup.id)?.name : "";

const upcomingDays = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(todayDate, index + 1);
    const key = toDateKey(date);
    return {
      key,
      label: index === 0 ? "Tomorrow" : new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "short" }).format(date),
      tasks: upcomingTasks.filter((task) => task.dueDate === key),
      routines: upcomingRoutineTasks.filter((task) => task.nextDueDate === key),
      adhoc: upcomingAdhoc.filter(task => task.plannedDate === key),
      projectGroups: Array.from(new Set(upcomingTasks.filter((task) => task.dueDate === key).map((task) => task.projectId))).map((projectId) => {
        const tasks = upcomingTasks.filter((task) => task.dueDate === key && task.projectId === projectId);
        return { projectId, projectName: tasks[0].projectName, tasks };
      }),
      routineGroups: Array.from(new Set(upcomingRoutineTasks.filter((task) => task.nextDueDate === key).map((task) => task.routineId))).map((routineId) => {
        const tasks = upcomingRoutineTasks.filter((task) => task.nextDueDate === key && task.routineId === routineId);
        return { routineId, routineName: tasks[0].routineName, tasks };
      }),
    };
  }).filter((day) => day.tasks.length + day.routines.length + day.adhoc.length > 0);

  const emptyClassName = "rounded-xl border border-[var(--sortd-border)] bg-[var(--sortd-muted)] px-4 py-6 text-sm text-slate-500";

  return (
    <div className="min-w-0 w-full max-w-full rounded-3xl border border-[var(--sortd-border)] bg-[var(--sortd-surface)] p-3 shadow-sm sm:p-5 md:p-8">
      <header className="mb-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#102a43] via-[#123b4c] to-[#176269] px-5 py-7 text-white shadow-lg sm:px-8 sm:py-9">
          <div className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full border border-white/10" />
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-200">{formattedDate}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">My Day<span className="text-teal-400">.</span></h1>
          <p className="mt-2 text-sm text-white/70">Your priorities, at your pace.</p>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <nav aria-label="My Day views" className="flex min-w-0 rounded-xl bg-[var(--sortd-muted)] p-1">
            {(["today", "upcoming"] as const).map((view) => (
              <button key={view} type="button" aria-pressed={dayViewMode === view}
                onClick={() => setDayViewMode(view)}
                className={`min-h-10 rounded-lg px-5 py-2 text-sm font-semibold capitalize transition ${dayViewMode === view ? "bg-white text-[#102a43] shadow-sm" : "text-slate-500 hover:text-slate-900"}`}>
                {view === "today" ? "Today" : "Next 7 days"}
              </button>
            ))}
          </nav>
          <div className="flex flex-wrap items-center gap-2">
            <div role="group" aria-label="Routine and task grouping" className="flex rounded-xl bg-[var(--sortd-muted)] p-1">
              {(["grouped", "all", "board"] as const).map((mode) => (
                <button key={mode} type="button" aria-pressed={itemDisplayMode === mode} onClick={() => setItemDisplayMode(mode)}
                  className={`min-h-9 rounded-lg px-3 py-1.5 text-sm font-medium ${itemDisplayMode === mode ? "bg-white text-[#102a43] shadow-sm" : "text-slate-500"}`}>
                  {mode === "all" ? "All" : mode === "board" ? "Board" : "Grouped"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {dayViewMode === "today" && (
        <div className="space-y-7">
          <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-2xl border border-[var(--sortd-border)] bg-white px-5 py-4 text-sm text-slate-500">
            <p><strong className="font-semibold text-slate-900">{dueToday.length + routineTasksDueToday.length + adhocToday.length}</strong> due today</p>
            <p><strong className={overdue.length + overdueRoutineTasks.length > 0 ? "font-semibold text-red-700" : "font-semibold text-slate-900"}>{overdue.length + overdueRoutineTasks.length + adhocOverdue.length}</strong> overdue</p>
            <p title="Estimates for items due today; excludes overdue items and items without an estimate.">{workloadMinutes > 0 ? `${formatDuration(workloadMinutes)} estimated today` : "No time estimated today"}</p>
          </div>
          <section className="rounded-2xl border border-[#dce7e3] bg-[#eaf3ef] p-4 sm:p-5"><div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-lg font-semibold text-[#102a43]">On the menu</h2><button type="button" onClick={onOpenFood} className="text-xs font-semibold text-[#0f766e]">Open Food ↗</button></div><div className="grid gap-3 sm:grid-cols-3">{(["breakfast","lunch","dinner"] as const).map(type => {const entries = foodData.mealPlan.filter(entry => entry.date === today && entry.mealType === type); return <div key={type} className="min-w-0 rounded-xl bg-white p-3"><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#0f766e]">{type}</p>{entries.length ? entries.map(entry => {const meal = foodData.meals.find(m => m.id === entry.mealId); return <div key={entry.id} className="mb-2 flex items-center gap-2">{meal?.cover && <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg"><CoverDisplay className="h-full w-full" cover={meal.cover} alt={meal.name} /></div>}<span className="min-w-0 text-sm font-medium">{meal?.name ?? entry.adhocTitle ?? "Meal"}</span></div>;}) : <p className="text-sm text-slate-500">Not planned</p>}</div>;})}</div></section>
          {itemDisplayMode === "board" ? renderBoard(todayBoardItems, today) : itemDisplayMode === "all" ? (
            <section aria-label="All routines and tasks" className="space-y-2">
              {allActionableItems.length > 0 ? allActionableItems.map((item) => item.kind === "routine" ? renderRoutineTask(item.task) : item.kind === "adhoc" ? renderAdhoc(item.task) : renderTask(item.task, { showStatus: true })) : <p className={emptyClassName}>Nothing needs your attention today.</p>}
            </section>
          ) : (
            <>
              <section aria-labelledby="my-day-routines" className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h2 id="my-day-routines" className="text-lg font-semibold text-[var(--sortd-navy)]">Routines</h2>
                  <span className="rounded-full bg-[var(--sortd-muted)] px-3 py-1 text-xs font-medium text-slate-600">{actionableRoutineTasks.length} remaining</span>
                </div>
                {actionableRoutineTasks.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {routineGroups.map((group) => renderGroupCard("routine", group.routineId, group.routineName, group.tasks.length, group.tasks.filter(t => t.nextDueDate < today).length))}
                  </div>
                ) : <p className={emptyClassName}>No routines due today.</p>}
              </section>
              <section aria-labelledby="my-day-adhoc" className="space-y-3">
                <h2 id="my-day-adhoc" className="text-lg font-semibold text-[var(--sortd-navy)]">To-dos · {actionableAdhoc.length}</h2>
                {actionableAdhoc.length ? <div className="space-y-2">{actionableAdhoc.map(renderAdhoc)}</div> : <p className={emptyClassName}>No scheduled to-dos due today.</p>}
              </section>
              <section aria-labelledby="my-day-tasks" className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h2 id="my-day-tasks" className="text-lg font-semibold text-[var(--sortd-navy)]">Project tasks</h2>
                  <span className="rounded-full bg-[var(--sortd-muted)] px-3 py-1 text-xs font-medium text-slate-600">{actionableProjectTasks.length} remaining</span>
                </div>
                {taskGroups.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {taskGroups.map((group) => renderGroupCard("project", group.projectId, group.projectName, group.tasks.length, group.tasks.filter(t => !!t.dueDate && t.dueDate < today).length))}
                  </div>
                ) : <p className={emptyClassName}>No project tasks due today.</p>}
              </section>
            </>
          )}
        </div>
      )}

      {dayViewMode === "upcoming" && (
        <section aria-labelledby="my-day-upcoming">
          <div className="mb-5"><section className="rounded-2xl border border-[#dce7e3] bg-[#eaf3ef] p-4 sm:p-5"><div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-lg font-semibold text-[#102a43]">On the menu</h2><button type="button" onClick={onOpenFood} className="text-xs font-semibold text-[#0f766e]">Open Food ↗</button></div><div className="grid gap-3 sm:grid-cols-3">{(["breakfast","lunch","dinner"] as const).map(type => {const entries = foodData.mealPlan.filter(entry => entry.date === today && entry.mealType === type); return <div key={type} className="min-w-0 rounded-xl bg-white p-3"><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#0f766e]">{type}</p>{entries.length ? entries.map(entry => {const meal = foodData.meals.find(m => m.id === entry.mealId); return <div key={entry.id} className="mb-2 flex items-center gap-2">{meal?.cover && <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg"><CoverDisplay className="h-full w-full" cover={meal.cover} alt={meal.name} /></div>}<span className="min-w-0 text-sm font-medium">{meal?.name ?? entry.adhocTitle ?? "Meal"}</span></div>;}) : <p className="text-sm text-slate-500">Not planned</p>}</div>;})}</div></section></div>
          <h2 id="my-day-upcoming" className="text-lg font-semibold text-slate-900">Next 7 days</h2>
          <p className="mt-1 mb-5 text-sm text-slate-500">Scheduled tasks and next routine due dates.</p>
          <div className="space-y-6">
            {upcomingDays.length > 0 ? upcomingDays.map((day) => (
              <section key={day.key} aria-label={day.label}>
                <h3 className="mb-3 text-sm font-semibold text-slate-700">{day.label}</h3>
                {itemDisplayMode === "board" ? renderBoard(makeBoardItems([
                  ...day.routines.map(task => ({ kind: "routine" as const, date: day.key, task })),
                  ...day.tasks.map(task => ({ kind: "project" as const, date: day.key, task })),
                  ...day.adhoc.map(task => ({ kind: "adhoc" as const, date: day.key, task })),
                ]), day.key) : itemDisplayMode === "all" ? (
                  <div className="space-y-2">
                    {day.routines.map((task) => renderRoutineTask(task))}
                    {day.tasks.map((task) => renderTask(task))}
                    {day.adhoc.map(renderAdhoc)}
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {day.routineGroups.map(group => renderGroupCard("routine", group.routineId, group.routineName, group.tasks.length, 0, day.key))}
                    {day.projectGroups.map(group => renderGroupCard("project", group.projectId, group.projectName, group.tasks.length, 0, day.key))}
                    {day.adhoc.length > 0 && <div className="rounded-2xl border border-[var(--sortd-border)] bg-white p-4"><h4 className="mb-3 font-semibold text-[var(--sortd-navy)]">To-dos · {day.adhoc.length}</h4><div className="space-y-2">{day.adhoc.map(renderAdhoc)}</div></div>}
                  </div>
                )}
              </section>
            )) : <p className={emptyClassName}>Nothing scheduled for this day.</p>}
          </div>
        </section>
      )}

             {activeGroup && (
         <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 p-3 sm:p-6" onMouseDown={e => { if (e.target === e.currentTarget) setActiveGroup(null); }}>
           <section role="dialog" aria-modal="true" aria-labelledby="my-day-group-title" className="flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-[var(--sortd-surface)] shadow-2xl">
             <header className="flex items-start justify-between gap-3 border-b border-[var(--sortd-border)] p-5">
               <div><p className="text-xs font-semibold uppercase tracking-widest text-[var(--sortd-teal-dark)]">{activeGroup.kind}</p>
                 <h2 id="my-day-group-title" className="mt-1 text-xl font-bold text-[var(--sortd-navy)]">{activeGroupName}</h2>
                 <p className="mt-1 text-sm text-slate-500">{activeGroupTasks.length} remaining · {activeGroup.date ? formatShortDate(activeGroup.date) : "Today & overdue"}</p></div>
               <button type="button" onClick={() => setActiveGroup(null)} aria-label="Close" className="rounded-lg px-3 py-2 text-xl text-slate-600 hover:bg-[var(--sortd-muted)]">×</button>
             </header>
             <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4 sm:p-5">
               {activeGroupTasks.length ? activeGroupTasks.map(task => activeGroup.kind === "routine"
                 ? renderRoutineTask(task as RoutineTaskForDay)
                 : renderTask(task as TaskWithProject, {showStatus:true, showProject:false}))
                 : <p className="py-10 text-center text-sm text-slate-500">All caught up!</p>}
             </div>
             <footer className="flex justify-end gap-3 border-t border-[var(--sortd-border)] p-4">
               {activeGroup.kind === "project" && <button type="button" onClick={() => {onOpenProject(activeGroup.id);setActiveGroup(null);}} className="rounded-xl px-4 py-2 text-sm font-semibold text-[var(--sortd-teal-dark)]">Open project</button>}
               <button type="button" onClick={() => setActiveGroup(null)} className="rounded-xl bg-[var(--sortd-navy)] px-4 py-2 text-sm font-semibold text-white">Done</button>
             </footer>
           </section>
         </div>
       )}

{selectedRoutineTask && (
          <ItemDetailsModal
            kind="routine"
            item={{ ...selectedRoutineTask, ...currentRoutineTask }}
            containerLabel="Routine"
            currentContainerId={
              selectedRoutineTask.routineId
            }
            containerOptions={routines.map(
              (routine) => ({
                id: routine.id,
                name:
                  routine.name ||
                  "Untitled routine",
              }),
            )}
            onMove={(destinationRoutineId) => {
              const sourceRoutine =
                routines.find(
                  (routine) =>
                    routine.id ===
                    selectedRoutineTask.routineId,
                );

              const destinationRoutine =
                routines.find(
                  (routine) =>
                    routine.id ===
                    destinationRoutineId,
                );

              if (
                !sourceRoutine ||
                !destinationRoutine ||
                sourceRoutine.id ===
                  destinationRoutine.id
              ) {
                return;
              }

              const taskToMove =
                sourceRoutine.tasks.find(
                  (task) =>
                    task.id ===
                    selectedRoutineTask.id,
                );

              if (!taskToMove) {
                return;
              }

              const nextOrder =
                destinationRoutine.tasks.length > 0
                  ? Math.max(
                      ...destinationRoutine.tasks.map(
                        (task) =>
                          task.order ?? 0,
                      ),
                    ) + 1
                  : 1;

              onChangeRoutines(
                routines.map((routine) => {
                  if (
                    routine.id ===
                    sourceRoutine.id
                  ) {
                    return {
                      ...routine,
                      tasks:
                        routine.tasks.filter(
                          (task) =>
                            task.id !==
                            selectedRoutineTask.id,
                        ),
                    };
                  }

                  if (
                    routine.id ===
                    destinationRoutine.id
                  ) {
                    return {
                      ...routine,
                      tasks: [
                        ...routine.tasks,
                        {
                          ...taskToMove,
                          order: nextOrder,
                        },
                      ],
                    };
                  }

                  return routine;
                }),
              );

              setSelectedRoutineTask(null);
            }}
            onChange={(updates) =>
              onUpdateRoutineTask(
                selectedRoutineTask.routineId,
                selectedRoutineTask.id,
                updates,
              )
            }
            onDelete={() => {
              onDeleteRoutineTask(
                selectedRoutineTask.routineId,
                selectedRoutineTask.id,
              );

              setSelectedRoutineTask(null);
            }}
            onClose={() =>
              setSelectedRoutineTask(null)
            }
          />
        )}
    </div>
  );
}

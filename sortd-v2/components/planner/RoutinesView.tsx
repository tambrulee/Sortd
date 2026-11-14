"use client";

import { useMemo, useState } from "react";

import { ProjectCover, RecurrenceUnit, Routine, RoutineTask } from "@/lib/types";

import ItemDetailsModal from "@/components/task_management/ItemDetailsModal";
import ConfirmDialog from "@/components/prompts/ConfirmDialog";
import ProjectUploadedCover from "@/components/planner/ProjectUploadedCover";
import RoutineCoverPicker from "@/components/planner/RoutineCoverPicker";

import { closestCenter, DndContext, DragEndEvent } from "@dnd-kit/core";

import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

type RoutinesViewProps = {
  routines: Routine[];

  onChangeRoutines: (routines: Routine[]) => void;
};

type RoutineFilter = "all" | "due" | "overdue" | "paused";

type RoutineSort =
  | "due-date"
  | "name"
  | "frequency"
  | "manual";

type RoutineTaskWithRoutine = RoutineTask & {
  routineId: string;
  routineName: string;
};

type SortableRoutineTaskProps = {
  task: RoutineTaskWithRoutine;

  showRoutineName?: boolean;

  onComplete: (taskId: string) => void;

  onEdit: (taskId: string) => void;
};

function getTodayKey() {
  const date = new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function toDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function addRecurrence(
  dateKey: string,
  interval: number,
  unit: RecurrenceUnit,
) {
  const date = parseDateKey(dateKey);

  const safeInterval = Math.max(1, interval);

  if (unit === "day") {
    date.setDate(date.getDate() + safeInterval);
  }

  if (unit === "week") {
    date.setDate(date.getDate() + safeInterval * 7);
  }

  if (unit === "month") {
    const originalDay = date.getDate();

    date.setDate(1);

    date.setMonth(date.getMonth() + safeInterval);

    const finalDayOfMonth = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0,
    ).getDate();

    date.setDate(Math.min(originalDay, finalDayOfMonth));
  }

  return toDateKey(date);
}

function formatDate(dateKey: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parseDateKey(dateKey));
}

function getFrequencyLabel(task: RoutineTask) {
  if (task.interval === 1 && task.recurrenceUnit === "day") {
    return "Daily";
  }

  if (task.interval === 1 && task.recurrenceUnit === "week") {
    return "Weekly";
  }

  if (task.interval === 2 && task.recurrenceUnit === "week") {
    return "Fortnightly";
  }

  if (task.interval === 1 && task.recurrenceUnit === "month") {
    return "Monthly";
  }

  return `Every ${task.interval} ${task.recurrenceUnit}${
    task.interval === 1 ? "" : "s"
  }`;
}

function getDueStatus(dateKey: string) {
  const today = getTodayKey();

  if (dateKey < today) {
    return {
      label: "Overdue",
      className: "bg-red-100 text-red-700",
    };
  }

  if (dateKey === today) {
    return {
      label: "Due today",
      className: "bg-amber-100 text-amber-800",
    };
  }

  return {
    label: `Due ${formatDate(dateKey)}`,
    className: "bg-slate-100 text-slate-600",
  };
}

function getRoutineTaskCount(routine: Routine) {
  return routine.tasks.filter((task) => task.active).length;
}

function getRoutineStatusColour(routine: Routine) {
  return routine.archived ? "bg-slate-400" : "bg-emerald-400";
}

function formatDuration(minutes?: number) {
  if (!minutes) {
    return null;
  }

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = minutes / 60;

  return Number.isInteger(hours) ? `${hours} hr` : `${hours.toFixed(1)} hrs`;
}

function SortableRoutineTask({
  task,
  showRoutineName = false,
  onComplete,
  onEdit,
}: SortableRoutineTaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
  });

  const dueStatus = getDueStatus(task.nextDueDate);

  const style = {
    transform: CSS.Transform.toString(transform),

    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`w-full rounded-xl border px-3 py-2.5 transition ${
        task.active
          ? "border-slate-200 bg-[var(--sortd-bg)]"
          : "border-slate-100 bg-slate-50 opacity-60"
      } ${isDragging ? "z-30 opacity-60 shadow-lg" : ""}`}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Reorder ${task.title}`}
          title="Drag to reorder"
          className="cursor-grab rounded-md px-1 py-1 text-xs text-slate-400 active:cursor-grabbing"
        >
          ⋮⋮
        </button>

        <button
          type="button"
          onClick={() => onComplete(task.id)}
          disabled={!task.active}
          aria-label={`Complete ${task.title}`}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-[var(--sortd-teal-dark)] text-base text-[var(--sortd-teal-dark)] transition hover:bg-[var(--sortd-teal-dark)] hover:text-white disabled:cursor-not-allowed"
        >
          ✓
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-900">
            {task.title ||
              "Untitled routine task"}
          </p>

          {showRoutineName && (
            <span className="text-xs text-slate-400">
              {task.routineName}
            </span>
          )}

          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            <span
              className={`rounded-full px-2 py-0.5 ${dueStatus.className}`}
            >
              {dueStatus.label}
            </span>

            <span className="rounded-full bg-purple-50 px-2 py-0.5 text-purple-700">
              {getFrequencyLabel(task)}
            </span>

            {formatDuration(task.durationMinutes) && (
              <span className="text-slate-500">
                {formatDuration(task.durationMinutes)}
              </span>
            )}

            {!task.active && (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-800">
                Paused
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onEdit(task.id)}
          aria-label={`Edit ${task.title}`}
          title="Routine task details"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
        >
          •••
        </button>
      </div>
    </div>
  );
}

export default function RoutinesView({
  routines,
  onChangeRoutines,
}: RoutinesViewProps) {
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [showRoutineMenu, setShowRoutineMenu] = useState(false);
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<boolean[]>([true]);
  const [activeRoutineId, setActiveRoutineId] = useState(routines[0]?.id ?? "");

  const [newRoutineName, setNewRoutineName] = useState("");

  const [showCreateRoutine, setShowCreateRoutine] = useState(false);

  const [showAddTask, setShowAddTask] = useState(false);

  const [newTaskTitle, setNewTaskTitle] = useState("");

  const [newInterval, setNewInterval] = useState(1);

  const [newUnit, setNewUnit] = useState<RecurrenceUnit>("week");

  const [newDueDate, setNewDueDate] = useState(getTodayKey());

  const [
    editingRoutineTaskRef,
    setEditingRoutineTaskRef,
  ] = useState<{
    routineId: string;
    taskId: string;
  } | null>(null);

  const [routineFilter, setRoutineFilter] = useState<RoutineFilter>("all");

  const [showAllRoutines, setShowAllRoutines] =
    useState(false);

  const [showRoutineGallery, setShowRoutineGallery] = useState(true);

  const [routineSort, setRoutineSort] =
    useState<RoutineSort>("due-date");

  const [deleteRoutineOpen, setDeleteRoutineOpen] =
    useState(false);

  const [
    deleteRoutineTaskId,
    setDeleteRoutineTaskId,
  ] = useState<string | null>(null);

  const resolvedActiveRoutineId = routines.some(
    (routine) => routine.id === activeRoutineId,
  )
    ? activeRoutineId
    : (routines[0]?.id ?? "");

  const activeRoutine = routines.find(
    (routine) => routine.id === resolvedActiveRoutineId,
  );

  const editingRoutine = editingRoutineTaskRef
    ? routines.find(
        (routine) =>
          routine.id === editingRoutineTaskRef.routineId,
      )
    : undefined;

  const editingRoutineTask = editingRoutine?.tasks.find(
    (task) =>
      task.id === editingRoutineTaskRef?.taskId,
  );

  const routineTasks = useMemo(() => {
    if (showAllRoutines) {
      return routines.flatMap((routine) =>
        routine.tasks.map((task) => ({
          ...task,
          routineId: routine.id,
          routineName: routine.name,
        })),
      );
    }

    if (!activeRoutine) {
      return [];
    }

    return activeRoutine.tasks.map((task) => ({
      ...task,
      routineId: activeRoutine.id,
      routineName: activeRoutine.name,
    }));
  }, [
    routines,
    activeRoutine,
    showAllRoutines,
  ]);

  const visibleTasks = useMemo(() => {
    const today = getTodayKey();

    const filtered = routineTasks.filter(
      (task) => {
        if (routineFilter === "paused") {
          return !task.active;
        }

        if (!task.active) {
          return false;
        }

        if (routineFilter === "due") {
          return task.nextDueDate === today;
        }

        if (routineFilter === "overdue") {
          return task.nextDueDate < today;
        }

        return true;
      },
    );

    return [...filtered].sort(
      (firstTask, secondTask) => {
        if (routineSort === "name") {
          return firstTask.title.localeCompare(
            secondTask.title,
          );
        }

        if (routineSort === "frequency") {
          const firstDays =
            firstTask.recurrenceUnit === "day"
              ? firstTask.interval
              : firstTask.recurrenceUnit === "week"
                ? firstTask.interval * 7
                : firstTask.interval * 30;

          const secondDays =
            secondTask.recurrenceUnit === "day"
              ? secondTask.interval
              : secondTask.recurrenceUnit === "week"
                ? secondTask.interval * 7
                : secondTask.interval * 30;

          return firstDays - secondDays;
        }

        if (routineSort === "manual") {
          return (
            (firstTask.order ?? 0) -
            (secondTask.order ?? 0)
          );
        }

        // Default: due date
        return firstTask.nextDueDate.localeCompare(
          secondTask.nextDueDate,
        );
      },
    );
  }, [
    routineTasks,
    routineFilter,
    routineSort,
  ]);

  const activeRoutineCount = routines.filter(
    (routine) => !routine.archived,
  ).length;

  const activeTaskCount = routines.reduce(
    (total, routine) => total + getRoutineTaskCount(routine),
    0,
  );

  function setRoutineCover(cover?: ProjectCover) {
    if (activeRoutine) updateRoutine({ ...activeRoutine, cover });
  }

  function updateRoutine(updatedRoutine: Routine) {
    onChangeRoutines(
      routines.map((routine) =>
        routine.id === updatedRoutine.id ? updatedRoutine : routine,
      ),
    );
  }

  function createRoutine() {
    const name = newRoutineName.trim();

    if (!name) {
      setShowCreateRoutine(true);

      return;
    }

    const newRoutine: Routine = {
      id: crypto.randomUUID(),
      name,
      description: "",
      tasks: [],
      createdAt: new Date().toISOString(),
      archived: false,
    };

    onChangeRoutines([...routines, newRoutine]);

    setActiveRoutineId(newRoutine.id);
    setShowRoutineGallery(false);

    setNewRoutineName("");
    setShowCreateRoutine(false);
  }

  function deleteRoutine() {
    if (!activeRoutine) {
      return;
    }

    const remainingRoutines =
      routines.filter(
        (routine) =>
          routine.id !== activeRoutine.id,
      );

    onChangeRoutines(
      remainingRoutines,
    );

    setActiveRoutineId(
      remainingRoutines[0]?.id ?? "",
    );
    setShowRoutineGallery(true);
  }

  function renameRoutine(routineId: string, name: string) {
    onChangeRoutines(
      routines.map((routine) =>
        routine.id === routineId
          ? {
              ...routine,
              name,
            }
          : routine,
      ),
    );
  }

  function reorderRoutines(reorderedRoutines: Routine[]) {
    onChangeRoutines(reorderedRoutines);
  }

  function addRoutineTask() {
    if (!activeRoutine) {
      return;
    }

    const title = newTaskTitle.trim();

    if (!title) {
      return;
    }

    const nextOrder =
      activeRoutine.tasks.length > 0
        ? Math.max(...activeRoutine.tasks.map((task) => task.order ?? 0)) + 1
        : 1;

    const newTask: RoutineTask = {
      id: crypto.randomUUID(),
      title,
      order: nextOrder,
      interval: Math.max(1, newInterval),
      recurrenceUnit: newUnit,
      nextDueDate: newDueDate || getTodayKey(),
      priority: "medium",
      durationMinutes: 30,
      scheduleContext: "personal",
      completionHistory: [],
      active: true,
      createdAt: new Date().toISOString(),
      maxSessionMinutes: 120,
    };

    updateRoutine({
      ...activeRoutine,
      tasks: [...activeRoutine.tasks, newTask],
    });

    setNewTaskTitle("");
    setShowAddTask(false);
  }

  function updateRoutineTask(taskId: string, updates: Partial<RoutineTask>) {
    const owner = routines.find((routine) => routine.tasks.some((task) => task.id === taskId));
    if (!owner) return;

    updateRoutine({
      ...owner,
      tasks: owner.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              ...updates,
            }
          : task,
      ),
    });
  }

  function completeRoutineTask(taskId: string) {
    const owner = routines.find((routine) => routine.tasks.some((task) => task.id === taskId));
    if (!owner) return;

    const completedAt = new Date().toISOString();

    const today = getTodayKey();

    updateRoutine({
      ...owner,
      tasks: owner.tasks.map((task) => {
        if (task.id !== taskId) {
          return task;
        }

        return {
          ...task,
          lastCompletedAt: completedAt,
          completionHistory: [...(task.completionHistory ?? []), completedAt],
          nextDueDate: addRecurrence(today, task.interval, task.recurrenceUnit),
        };
      }),
    });
  }

  function deleteRoutineTask(
    taskId: string,
  ) {
    const owner = routines.find((routine) => routine.tasks.some((task) => task.id === taskId));
    if (!owner) return;

    updateRoutine({
      ...owner,

      tasks: owner.tasks.filter(
        (routineTask) =>
          routineTask.id !== taskId,
      ),
    });
  }

  function moveRoutineTask(taskId: string, destinationRoutineId: string) {
    if (!activeRoutine || destinationRoutineId === activeRoutine.id) {
      return;
    }

    const taskToMove = activeRoutine.tasks.find((task) => task.id === taskId);

    const destinationRoutine = routines.find(
      (routine) => routine.id === destinationRoutineId,
    );

    if (!taskToMove || !destinationRoutine) {
      return;
    }

    const destinationOrder =
      destinationRoutine.tasks.length > 0
        ? Math.max(...destinationRoutine.tasks.map((task) => task.order ?? 0)) +
          1
        : 1;

    const movedTask = {
      ...taskToMove,
      order: destinationOrder,
    };

    onChangeRoutines(
      routines.map((routine) => {
        if (routine.id === activeRoutine.id) {
          return {
            ...routine,
            tasks: routine.tasks.filter((task) => task.id !== taskId),
          };
        }

        if (routine.id === destinationRoutineId) {
          return {
            ...routine,
            tasks: [...routine.tasks, movedTask],
          };
        }

        return routine;
      }),
    );

    setEditingRoutineTaskRef(null)

    setActiveRoutineId(destinationRoutineId);
  }

  function handleTaskDragEnd(event: DragEndEvent) {
    if (!activeRoutine || showAllRoutines) {
      return;
    }

    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const allOrderedTasks = [...activeRoutine.tasks].sort(
      (firstTask, secondTask) =>
        (firstTask.order ?? 0) - (secondTask.order ?? 0),
    );

    const oldIndex = allOrderedTasks.findIndex((task) => task.id === active.id);

    const newIndex = allOrderedTasks.findIndex((task) => task.id === over.id);

    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    const reordered = arrayMove(allOrderedTasks, oldIndex, newIndex).map(
      (task, index) => ({
        ...task,
        order: index + 1,
      }),
    );

    updateRoutine({
      ...activeRoutine,
      tasks: reordered,
    });
  }

  return (
    <div className="min-w-0 rounded-2xl border border-[var(--sortd-border)] bg-[var(--sortd-surface)] p-4 text-[var(--sortd-text)] shadow-sm sm:p-5">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
            Routines
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            The repeating parts of life, kept ticking over.
          </p>
        </div>

        <div className="flex items-center gap-3 pt-1 text-sm text-slate-500">
          <span>
            <span className="font-semibold text-slate-900">
              {activeRoutineCount}
            </span>{" "}
            {activeRoutineCount === 1 ? "routine" : "routines"}
          </span>

          <span aria-hidden="true" className="text-slate-300">
            ·
          </span>

          <span>
            <span className="font-semibold text-slate-900">
              {activeTaskCount}
            </span>{" "}
            active tasks
          </span>
        </div>
      </header>

      {showRoutineGallery ? (
        <section>
          <div className="mb-6 grid grid-cols-3 gap-2 sm:gap-3">
            {([[activeRoutineCount, "Routines"], [activeTaskCount, "Active tasks"], [routines.filter(r => !r.archived).flatMap(r => r.tasks).filter(t => t.active && t.nextDueDate <= getTodayKey()).length, "Due or overdue"]] as const).map(([value, label]) => (
              <div key={label} className="rounded-xl border border-[var(--sortd-border)] bg-[var(--sortd-card)] p-3 sm:p-4"><p className="text-xl font-semibold">{value}</p><p className="text-xs text-[var(--sortd-text-muted)]">{label}</p></div>
            ))}
          </div>
          <div className="mb-6 rounded-xl border border-[var(--sortd-border)] bg-[var(--sortd-card)] p-4">
            <p className="text-sm font-semibold">✦ Routine Pulse</p>
            {(() => { const today = getTodayKey(); const tasks = routines.filter(r => !r.archived).flatMap(r => r.tasks).filter(t => t.active); const due = tasks.filter(t => t.nextDueDate <= today); const overdue = due.filter(t => t.nextDueDate < today); return <p className="mt-1 text-sm text-[var(--sortd-text-muted)]">{due.length ? `${due.length} repeating task${due.length === 1 ? " needs" : "s need"} attention${overdue.length ? `, including ${overdue.length} overdue` : " today"}.` : "You're up to date with your scheduled routine tasks."}</p>; })()}
          </div>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <input aria-label="Search routines" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search routines..." className="w-full rounded-xl border border-[var(--sortd-border)] bg-[var(--sortd-card)] px-4 py-3 text-sm sm:max-w-sm" />
            <button type="button" onClick={() => setShowCreateRoutine(true)} className="rounded-xl bg-[var(--sortd-navy)] px-4 py-2.5 text-sm font-medium text-white">+ New routine</button>
          </div>
          {([false, true] as const).map(archived => {
            const matches = routines.filter(r => Boolean(r.archived) === archived && `${r.name} ${r.description ?? ""}`.toLowerCase().includes(search.toLowerCase()));
            if (!matches.length && search) return null;
            const isCollapsed = collapsed.includes(archived);
            return <section key={String(archived)} className="mb-7">
              <button type="button" onClick={() => setCollapsed(current => current.includes(archived) ? current.filter(v => v !== archived) : [...current, archived])} aria-expanded={!isCollapsed} className="mb-3 flex w-full items-center justify-between text-left"><span className="font-semibold">{archived ? "Archived" : "Active routines"} <span className="text-sm font-normal text-[var(--sortd-text-muted)]">({matches.length})</span></span><span>{isCollapsed ? "▸" : "▾"}</span></button>
              {!isCollapsed && <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{matches.map(routine => {
                const tasks = routine.tasks.filter(t => t.active);
                const due = tasks.filter(t => t.nextDueDate <= getTodayKey()).length;
                return <button key={routine.id} type="button" onClick={() => { setActiveRoutineId(routine.id); setShowAllRoutines(false); setShowRoutineGallery(false); setRoutineFilter("all"); setEditingTitle(false); }} className="group overflow-hidden rounded-2xl border border-[var(--sortd-border)] bg-[var(--sortd-card)] text-left transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-[var(--sortd-teal)]">
                  <div className="relative h-36 overflow-hidden bg-gradient-to-br from-[#1f0825] via-[#477b73] to-[#cdbfd1]">
                    {routine.cover?.source === "unsplash" && <img src={routine.cover.url} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />}
                    {routine.cover?.source === "upload" && <ProjectUploadedCover path={routine.cover.path} />}
                    {!routine.cover && <div className="flex h-full items-center justify-center text-4xl text-white/70">✦</div>}
                    <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-800">{archived ? "Archived" : due ? `${due} due` : "Up to date"}</span>
                  </div>
                  <div className="space-y-2 p-4"><p className="font-semibold">{routine.name || "Untitled routine"}</p><p className="line-clamp-2 min-h-9 text-xs leading-5 text-[var(--sortd-text-muted)]">{routine.description || "Your recurring tasks, all in one place."}</p><div className="flex justify-between text-xs text-[var(--sortd-text-muted)]"><span>{tasks.length} repeating {tasks.length === 1 ? "task" : "tasks"}</span><span>{due} due or overdue</span></div></div>
                </button>;
              })}</div>}
              {!isCollapsed && !matches.length && <p className="rounded-xl border border-dashed border-[var(--sortd-border)] p-4 text-sm text-[var(--sortd-text-muted)]">No routines here yet.</p>}
            </section>;
          })}
        </section>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3"><button type="button" onClick={() => { setShowRoutineGallery(true); setShowAllRoutines(false); }} className="text-sm font-medium text-[var(--sortd-teal-dark)]">← All routines</button><button type="button" onClick={() => setShowAllRoutines(v => !v)} className="rounded-lg border border-[var(--sortd-border)] px-3 py-2 text-sm">{showAllRoutines ? "Selected routine" : "View all tasks"}</button></div>
          {activeRoutine && <>
            <div className="relative h-44 overflow-hidden rounded-2xl bg-gradient-to-br from-[#1f0825] via-[#477b73] to-[#cdbfd1]">
              {activeRoutine.cover?.source === "unsplash" && <img src={activeRoutine.cover.url} alt="" className="h-full w-full object-cover" />}
              {activeRoutine.cover?.source === "upload" && <ProjectUploadedCover path={activeRoutine.cover.path} />}
              <button type="button" onClick={() => setCoverPickerOpen(true)} className="absolute bottom-3 right-3 rounded-lg bg-white/95 px-3 py-2 text-xs font-semibold text-slate-900 shadow">Change cover</button>
            </div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">{editingTitle ? <input autoFocus aria-label="Routine name" value={titleDraft} onChange={e => setTitleDraft(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { if (titleDraft.trim()) renameRoutine(activeRoutine.id, titleDraft.trim()); setEditingTitle(false); } if (e.key === "Escape") setEditingTitle(false); }} onBlur={() => { if (titleDraft.trim()) renameRoutine(activeRoutine.id, titleDraft.trim()); setEditingTitle(false); }} className="w-full max-w-lg rounded-lg border border-[var(--sortd-border)] bg-[var(--sortd-card)] px-3 py-2 text-2xl font-semibold" /> : <div className="flex items-center gap-2"><h2 className="text-2xl font-semibold">{activeRoutine.name}</h2><button type="button" aria-label="Edit routine name" onClick={() => { setTitleDraft(activeRoutine.name); setEditingTitle(true); }} className="rounded-lg px-2 py-1 text-[var(--sortd-text-muted)]">✎</button></div>}
                <p className="mt-1 text-sm text-[var(--sortd-text-muted)]">{activeRoutine.description || "Your recurring tasks, all in one place."}</p></div>
              <span className="rounded-full bg-[var(--sortd-muted)] px-3 py-1 text-xs">{activeRoutine.archived ? "Archived" : "Active"}</span>
              <div className="relative"><button type="button" aria-label="Routine actions" aria-expanded={showRoutineMenu} onClick={() => setShowRoutineMenu(v => !v)} className="rounded-lg border border-[var(--sortd-border)] px-3 py-1 text-lg">⋯</button>{showRoutineMenu && <div className="absolute right-0 top-full z-20 mt-2 min-w-40 rounded-xl border border-[var(--sortd-border)] bg-[var(--sortd-card)] p-1 shadow-lg"><button type="button" onClick={() => { setShowRoutineMenu(false); setDeleteRoutineOpen(true); }} className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-700">Delete routine</button></div>}</div>
            </div>
            {(() => { const today = getTodayKey(); const tasks = activeRoutine.tasks.filter(t => t.active); const due = tasks.filter(t => t.nextDueDate === today).length; const overdue = tasks.filter(t => t.nextDueDate < today).length; const upcoming = tasks.filter(t => t.nextDueDate > today).length; return <section className="rounded-2xl border border-[var(--sortd-border)] bg-[var(--sortd-card)] p-4 sm:p-5"><h3 className="mb-1 text-lg font-semibold">✦ Routine Pulse</h3><p className="mb-4 text-xs text-[var(--sortd-text-muted)]">A snapshot of your repeating tasks</p><div className="grid grid-cols-3 gap-2">{([[due, "Due today"], [overdue, "Overdue"], [upcoming, "Upcoming"]] as const).map(([count, label]) => <div key={label} className="rounded-xl bg-[var(--sortd-muted)] p-3"><p className="text-xl font-semibold">{count}</p><p className="text-xs text-[var(--sortd-text-muted)]">{label}</p></div>)}</div><p className="mt-4 text-sm text-[var(--sortd-text-muted)]">{overdue ? `${overdue} task${overdue === 1 ? " is" : "s are"} overdue. Review what needs attention.` : due ? `${due} task${due === 1 ? " is" : "s are"} scheduled for today.` : "Nothing is due today. You're up to date."}</p></section>; })()}
          </>}
        </div>
      )}

      {showCreateRoutine && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            createRoutine();
          }}
          className="mt-4 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:flex-row"
        >
          <input
            autoFocus
            value={newRoutineName}
            onChange={(event) => setNewRoutineName(event.target.value)}
            placeholder="Routine name, e.g. Home care"
            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-[var(--sortd-bg)] px-4 py-2.5 outline-none focus:border-[var(--sortd-teal-dark)] focus:ring-2 focus:ring-[var(--sortd-teal-dark)]/20"
          />

          <button
            type="submit"
            className="rounded-xl bg-[#230028] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#3b0842]"
          >
            Create
          </button>

          <button
            type="button"
            onClick={() => {
              setShowCreateRoutine(false);

              setNewRoutineName("");
            }}
            className="rounded-xl px-4 py-2.5 text-sm text-slate-500 transition hover:bg-[var(--sortd-bg)] hover:text-slate-900"
          >
            Cancel
          </button>
        </form>
      )}

      {showRoutineGallery ? null : !activeRoutine && !showAllRoutines ? (
        <div className="mt-8 px-5 py-10 text-center">
          <p className="font-medium text-slate-700">No routine selected.</p>

          <p className="mt-1 text-sm text-slate-500">
            Create a routine to get started.
          </p>
        </div>
      ) : (
        <>
        {!showAllRoutines && activeRoutine && (
          <details className="group mt-5 rounded-2xl border border-slate-200 bg-white/80 p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-1 py-2 text-sm text-slate-600 transition hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700 [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-2">
                <span className="font-medium">Routine settings</span>

                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    activeRoutine.archived
                      ? "bg-slate-100 text-slate-600"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {activeRoutine.archived ? "archived" : "active"}
                </span>
              </span>

              <span className="text-slate-400 transition group-open:rotate-180">
                ▾
              </span>
            </summary>

            <div className="grid gap-4 pt-4 md:grid-cols-[1fr_auto]">
              <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-600">
                Routine name
                <input
                  value={activeRoutine.name}
                  onChange={(event) =>
                    renameRoutine(activeRoutine.id, event.target.value)
                  }
                  className="rounded-xl border border-slate-200 bg-[var(--sortd-bg)] px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[var(--sortd-teal-dark)] focus:ring-2 focus:ring-[var(--sortd-teal-dark)]/20"
                />
              </label>

              <button
                type="button"
                onClick={() =>
                  updateRoutine({
                    ...activeRoutine,
                    archived: !activeRoutine.archived,
                  })
                }
                className="self-end rounded-xl border border-slate-200 bg-[var(--sortd-bg)] px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                {activeRoutine.archived ? "Restore routine" : "Archive routine"}
              </button>
            </div>
          </details>
        )}

          <section className="mt-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Tasks
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Drag tasks to choose their normal order.
                </p>
              </div>

              <span className="text-xs text-slate-500">
                {visibleTasks.length}{" "}
                {visibleTasks.length === 1 ? "item" : "items"}
              </span>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddTask((current) => !current)}
                className="rounded-xl bg-[#1f0825] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#3b0842]"
              >
                + Add task
              </button>

              {(
                [
                  ["all", "All"],
                  ["due", "Due today"],
                  ["overdue", "Overdue"],
                  ["paused", "Paused"],
                ] as Array<[RoutineFilter, string]>
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRoutineFilter(value)}
                  className={`rounded-xl px-3 py-2 text-sm transition ${
                    routineFilter === value
                      ? "bg-[#f3e8f5] font-medium text-[#7c2d92]"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {label}
                </button>
                
              ))}
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs text-slate-400">
                  Sort
                </span>

                <select
                  value={routineSort}
                  onChange={(event) =>
                    setRoutineSort(
                      event.target.value as RoutineSort,
                    )
                  }
                  className="rounded-xl border border-slate-200 bg-[var(--sortd-bg)] px-3 py-2 text-sm text-slate-600"
                >
                  <option value="due-date">
                    Due date
                  </option>

                  <option value="name">
                    Name
                  </option>

                  <option value="frequency">
                    Frequency
                  </option>

                  {!showAllRoutines && (
                    <option value="manual">
                      Manual order
                    </option>
                  )}
                </select>
              </div>
            </div>

            {showAddTask && (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  addRoutineTask();
                }}
                className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_90px_130px_160px_auto]"
              >
                <input
                  autoFocus
                  value={newTaskTitle}
                  onChange={(event) => setNewTaskTitle(event.target.value)}
                  placeholder="e.g. Change the bedding"
                  className="rounded-xl border border-slate-200 bg-[var(--sortd-bg)] px-3 py-2 outline-none focus:border-[var(--sortd-teal-dark)]"
                />

                <input
                  type="number"
                  min="1"
                  value={newInterval}
                  onChange={(event) =>
                    setNewInterval(Math.max(1, Number(event.target.value)))
                  }
                  aria-label="Repeat interval"
                  className="rounded-xl border border-slate-200 bg-[var(--sortd-bg)] px-3 py-2"
                />

                <select
                  value={newUnit}
                  onChange={(event) =>
                    setNewUnit(event.target.value as RecurrenceUnit)
                  }
                  className="rounded-xl border border-slate-200 bg-[var(--sortd-bg)] px-3 py-2"
                >
                  <option value="day">Day(s)</option>
                  <option value="week">Week(s)</option>
                  <option value="month">Month(s)</option>
                </select>

                <input
                  type="date"
                  value={newDueDate}
                  onChange={(event) => setNewDueDate(event.target.value)}
                  aria-label="First due date"
                  className="rounded-xl border border-slate-200 bg-[var(--sortd-bg)] px-3 py-2"
                />

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="rounded-xl bg-[#230028] px-4 py-2 font-medium text-white"
                  >
                    Add
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowAddTask(false)}
                    className="rounded-xl px-3 py-2 text-sm text-slate-500 transition hover:bg-[var(--sortd-bg)] hover:text-slate-900"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="w-full max-h-[65vh] overflow-y-auto overscroll-contain pr-1">
              {visibleTasks.length === 0 ? (
                <div className="rounded-2xl bg-[var(--sortd-grey)] p-8 text-center text-sm text-slate-500">
                  {routineFilter === "all"
                    ? "This routine has no active tasks yet."
                    : "Nothing matches this filter."}
                </div>
              ) : (
                <DndContext
                  collisionDetection={closestCenter}
                  onDragEnd={handleTaskDragEnd}
                >
                  <SortableContext
                    items={visibleTasks.map((task) => task.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="w-full space-y-2">
                      {visibleTasks.map((task) => (
                        <SortableRoutineTask
                          key={`${task.routineId}-${task.id}`}
                          task={task}
                          showRoutineName={showAllRoutines}
                          onComplete={completeRoutineTask}
                          onEdit={(taskId) => {
                            setEditingRoutineTaskRef({
                              routineId: task.routineId,
                              taskId,
                            });
                          }}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </section>

          {editingRoutineTask && editingRoutine && (
            <ItemDetailsModal
              kind="routine"
              item={editingRoutineTask}
              containerLabel="Routine"
              currentContainerId={editingRoutine.id}
              containerOptions={routines.map((routine) => ({
                id: routine.id,
                name: routine.name || "Untitled routine",
              }))}
              onMove={(destinationRoutineId) =>
                moveRoutineTask(editingRoutineTask.id, destinationRoutineId)
              }
              onChange={(updates) =>
                updateRoutineTask(editingRoutineTask.id, updates)
              }
              onDelete={() => {
                setDeleteRoutineTaskId(
                  editingRoutineTask.id,
                );
              }}
              onClose={() =>
                setEditingRoutineTaskRef(null)
              }
            />
          )}
        </>
      )}
      
      {coverPickerOpen && activeRoutine && (
        <RoutineCoverPicker
          projectId={activeRoutine.id}
          current={activeRoutine.cover}
          onSelect={(cover?: ProjectCover) => {
            setRoutineCover(cover);
            setCoverPickerOpen(false);
          }}
          onClose={() => setCoverPickerOpen(false)}
        />
      )}

      <ConfirmDialog
        open={deleteRoutineOpen}
        title="Delete routine?"
        description={
          activeRoutine
            ? `Delete “${activeRoutine.name}” and all of its tasks? This can't be undone.`
            : "Delete this routine? This can't be undone."
        }
        confirmLabel="Delete routine"
        onCancel={() => {
          setDeleteRoutineOpen(false);
        }}
        onConfirm={() => {
          setDeleteRoutineOpen(false);
          deleteRoutine();
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteRoutineTaskId)}
        title="Delete routine task?"
        description={
          editingRoutineTask
            ? `Delete “${editingRoutineTask.title}”? This can't be undone.`
            : "Delete this routine task? This can't be undone."
        }
        confirmLabel="Delete task"
        onCancel={() => {
          setDeleteRoutineTaskId(null);
        }}
        onConfirm={() => {
          if (!deleteRoutineTaskId) return;

          deleteRoutineTask(
            deleteRoutineTaskId,
          );

          setDeleteRoutineTaskId(null);
          setEditingRoutineTaskRef(null)
        }}
      />
    </div>
  );
}

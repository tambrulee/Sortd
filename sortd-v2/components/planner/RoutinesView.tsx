"use client";

import { useMemo, useState } from "react";

import { RecurrenceUnit, Routine, RoutineTask } from "@/lib/types";

import CollectionSwitcher from "@/components/planner/CollectionSwitcher";
import ItemDetailsModal from "@/components/task_management/ItemDetailsModal";
import ConfirmDialog from "@/components/prompts/ConfirmDialog";

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

type SortableRoutineTaskProps = {
  task: RoutineTask;

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
      className={`rounded-2xl border p-4 transition ${
        task.active
          ? "border-slate-200 bg-white"
          : "border-slate-100 bg-slate-50 opacity-60"
      } ${isDragging ? "z-30 opacity-60 shadow-lg" : ""}`}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Reorder ${task.title}`}
          title="Drag to reorder"
          className="mt-1 cursor-grab rounded-md px-1 py-1 text-sm text-slate-400 active:cursor-grabbing"
        >
          ⋮⋮
        </button>

        <button
          type="button"
          onClick={() => onComplete(task.id)}
          disabled={!task.active}
          aria-label={`Complete ${task.title}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-[#cd6ce7] text-lg text-[#a93ac5] transition hover:bg-[#cd6ce7] hover:text-white disabled:cursor-not-allowed"
        >
          ✓
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-900">
            {task.title || "Untitled routine task"}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className={`rounded-full px-2.5 py-1 ${dueStatus.className}`}>
              {dueStatus.label}
            </span>

            <span className="rounded-full bg-purple-50 px-2.5 py-1 text-purple-700">
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
  const [activeRoutineId, setActiveRoutineId] = useState(routines[0]?.id ?? "");

  const [newRoutineName, setNewRoutineName] = useState("");

  const [showCreateRoutine, setShowCreateRoutine] = useState(false);

  const [showAddTask, setShowAddTask] = useState(false);

  const [newTaskTitle, setNewTaskTitle] = useState("");

  const [newInterval, setNewInterval] = useState(1);

  const [newUnit, setNewUnit] = useState<RecurrenceUnit>("week");

  const [newDueDate, setNewDueDate] = useState(getTodayKey());

  const [editingRoutineTaskId, setEditingRoutineTaskId] = useState<
    string | null
  >(null);

  const [routineFilter, setRoutineFilter] = useState<RoutineFilter>("all");

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

  const editingRoutineTask = activeRoutine?.tasks.find(
    (task) => task.id === editingRoutineTaskId,
  );

  const orderedTasks = useMemo(
    () =>
      [...(activeRoutine?.tasks ?? [])].sort(
        (firstTask, secondTask) =>
          (firstTask.order ?? 0) - (secondTask.order ?? 0),
      ),
    [activeRoutine?.tasks],
  );

  const visibleTasks = useMemo(() => {
    const today = getTodayKey();

    return orderedTasks.filter((task) => {
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
    });
  }, [orderedTasks, routineFilter]);

  const activeRoutineCount = routines.filter(
    (routine) => !routine.archived,
  ).length;

  const activeTaskCount = routines.reduce(
    (total, routine) => total + getRoutineTaskCount(routine),
    0,
  );

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
    if (!activeRoutine) {
      return;
    }

    updateRoutine({
      ...activeRoutine,
      tasks: activeRoutine.tasks.map((task) =>
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
    if (!activeRoutine) {
      return;
    }

    const completedAt = new Date().toISOString();

    const today = getTodayKey();

    updateRoutine({
      ...activeRoutine,
      tasks: activeRoutine.tasks.map((task) => {
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
    if (!activeRoutine) {
      return;
    }

    updateRoutine({
      ...activeRoutine,

      tasks: activeRoutine.tasks.filter(
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

    setEditingRoutineTaskId(null);

    setActiveRoutineId(destinationRoutineId);
  }

  function handleTaskDragEnd(event: DragEndEvent) {
    if (!activeRoutine) {
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
    <div className="min-w-0 rounded-3xl bg-white/90 p-5 shadow-xl backdrop-blur-md md:p-7">
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

      <CollectionSwitcher
        items={routines}
        activeItemId={resolvedActiveRoutineId}
        label="Current routine"
        placeholder="Select a routine"
        itemPluralLabel="Routines"
        createLabel="+ New"
        deleteLabel="Delete routine"
        onChangeItem={setActiveRoutineId}
        onCreateItem={() => setShowCreateRoutine(true)}
        onDeleteItem={() => {
          setDeleteRoutineOpen(true);
        }}
        onRenameItem={renameRoutine}
        onReorderItems={reorderRoutines}
        getCount={getRoutineTaskCount}
        getStatusColour={getRoutineStatusColour}
        getStatusLabel={(routine) => (routine.archived ? "archived" : "active")}
        canDelete={routines.length > 0}
      />

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
            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 outline-none focus:border-[#cd6ce7] focus:ring-2 focus:ring-[#cd6ce7]/20"
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
            className="rounded-xl px-4 py-2.5 text-sm text-slate-500 transition hover:bg-white hover:text-slate-900"
          >
            Cancel
          </button>
        </form>
      )}

      {!activeRoutine ? (
        <div className="mt-8 px-5 py-10 text-center">
          <p className="font-medium text-slate-700">No routine selected.</p>

          <p className="mt-1 text-sm text-slate-500">
            Create a routine to get started.
          </p>
        </div>
      ) : (
        <>
          <details className="group mt-5 border-b border-slate-100 pb-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-1 py-2 text-sm text-slate-600 transition hover:text-slate-900 [&::-webkit-details-marker]:hidden">
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
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#cd6ce7] focus:ring-2 focus:ring-[#cd6ce7]/20"
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
                className="self-end rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                {activeRoutine.archived ? "Restore routine" : "Archive routine"}
              </button>
            </div>
          </details>

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
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:border-[#cd6ce7]"
                />

                <input
                  type="number"
                  min="1"
                  value={newInterval}
                  onChange={(event) =>
                    setNewInterval(Math.max(1, Number(event.target.value)))
                  }
                  aria-label="Repeat interval"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2"
                />

                <select
                  value={newUnit}
                  onChange={(event) =>
                    setNewUnit(event.target.value as RecurrenceUnit)
                  }
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2"
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
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2"
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
                    className="rounded-xl px-3 py-2 text-sm text-slate-500 transition hover:bg-white hover:text-slate-900"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="max-h-[52vh] overflow-y-auto overscroll-contain pr-1">
              {visibleTasks.length === 0 ? (
                <div className="rounded-2xl bg-[#eeeaea] p-8 text-center text-sm text-slate-500">
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
                    <div className="space-y-3">
                      {visibleTasks.map((task) => (
                        <SortableRoutineTask
                          key={task.id}
                          task={task}
                          onComplete={completeRoutineTask}
                          onEdit={setEditingRoutineTaskId}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </section>

          {editingRoutineTask && (
            <ItemDetailsModal
              kind="routine"
              item={editingRoutineTask}
              containerLabel="Routine"
              currentContainerId={activeRoutine.id}
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
              onClose={() => setEditingRoutineTaskId(null)}
            />
          )}
        </>
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
          setEditingRoutineTaskId(null);
        }}
      />
    </div>
  );
}

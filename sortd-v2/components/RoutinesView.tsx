"use client";

import { useState } from "react";

import {
  RecurrenceUnit,
  Routine,
  RoutineTask,
} from "@/lib/types";

import ItemDetailsModal from "@/components/ItemDetailsModal";

type RoutinesViewProps = {
  routines: Routine[];
  onChangeRoutines: (routines: Routine[]) => void;
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
  unit: RecurrenceUnit
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
      0
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
  if (
    task.interval === 1 &&
    task.recurrenceUnit === "day"
  ) {
    return "Daily";
  }

  if (
    task.interval === 1 &&
    task.recurrenceUnit === "week"
  ) {
    return "Weekly";
  }

  if (
    task.interval === 2 &&
    task.recurrenceUnit === "week"
  ) {
    return "Fortnightly";
  }

  if (
    task.interval === 1 &&
    task.recurrenceUnit === "month"
  ) {
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

export default function RoutinesView({
  routines,
  onChangeRoutines,
}: RoutinesViewProps) {
  const [activeRoutineId, setActiveRoutineId] =
    useState(routines[0]?.id ?? "");

  const [newRoutineName, setNewRoutineName] =
    useState("");

  const [newTaskTitle, setNewTaskTitle] =
    useState("");

  const [newInterval, setNewInterval] =
    useState(1);

  const [newUnit, setNewUnit] =
    useState<RecurrenceUnit>("week");

  const [newDueDate, setNewDueDate] =
    useState(getTodayKey());

  const [
    editingRoutineTaskId,
    setEditingRoutineTaskId,
  ] = useState<string | null>(null);

  const activeRoutine =
    routines.find(
      (routine) => routine.id === activeRoutineId
    ) ?? routines[0];

  const editingRoutineTask =
    activeRoutine?.tasks.find(
      (task) =>
        task.id === editingRoutineTaskId
    );

  function updateRoutine(updatedRoutine: Routine) {
    onChangeRoutines(
      routines.map((routine) =>
        routine.id === updatedRoutine.id
          ? updatedRoutine
          : routine
      )
    );
  }

  function createRoutine() {
    const name = newRoutineName.trim();

    if (!name) return;

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
  }

  function deleteRoutine() {
    if (!activeRoutine) return;

    const confirmed = window.confirm(
      `Delete the routine "${activeRoutine.name}" and all of its tasks?`
    );

    if (!confirmed) return;

    const remainingRoutines = routines.filter(
      (routine) => routine.id !== activeRoutine.id
    );

    onChangeRoutines(remainingRoutines);
    setActiveRoutineId(
      remainingRoutines[0]?.id ?? ""
    );
  }

  function addRoutineTask() {
    if (!activeRoutine) return;

    const title = newTaskTitle.trim();

    if (!title) return;

    const newTask: RoutineTask = {
    id: crypto.randomUUID(),
    title,

    order:
      activeRoutine.tasks.length + 1,

    interval:
      Math.max(1, newInterval),

    recurrenceUnit: newUnit,

    nextDueDate:
      newDueDate || getTodayKey(),

    priority: "medium",
    durationMinutes: 30,
    scheduleContext: "personal",
    preferredPeriod: "any",

    completionHistory: [],
    active: true,

    createdAt:
      new Date().toISOString(),

    maxSessionMinutes: 120,
  };

    updateRoutine({
      ...activeRoutine,
      tasks: [...activeRoutine.tasks, newTask],
    });

    setNewTaskTitle("");
  }

  function updateRoutineTask(
    taskId: string,
    updates: Partial<RoutineTask>
  ) {
    if (!activeRoutine) return;

    updateRoutine({
      ...activeRoutine,
      tasks: activeRoutine.tasks.map((task) =>
        task.id === taskId
          ? { ...task, ...updates }
          : task
      ),
    });
  }

  function completeRoutineTask(taskId: string) {
    if (!activeRoutine) return;

    const completedAt = new Date().toISOString();
    const today = getTodayKey();

    updateRoutine({
      ...activeRoutine,
      tasks: activeRoutine.tasks.map((task) => {
        if (task.id !== taskId) return task;

        return {
          ...task,
          lastCompletedAt: completedAt,
          completionHistory: [
            ...(task.completionHistory ?? []),
            completedAt,
          ],
          nextDueDate: addRecurrence(
            today,
            task.interval,
            task.recurrenceUnit
          ),
        };
      }),
    });
  }

  function deleteRoutineTask(taskId: string) {
    if (!activeRoutine) return;

    const task = activeRoutine.tasks.find(
      (routineTask) => routineTask.id === taskId
    );

    if (!task) return;

    const confirmed = window.confirm(
      `Delete the routine task "${task.title}"?`
    );

    if (!confirmed) return;

    updateRoutine({
      ...activeRoutine,
      tasks: activeRoutine.tasks.filter(
        (routineTask) => routineTask.id !== taskId
      ),
    });
  }

  return (
    <div className="rounded-3xl bg-white/85 p-5 shadow-xl backdrop-blur-md md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
            Routines
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-950">
            Keep life moving
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Complete a routine task and Sort&apos;d
            will schedule its next occurrence.
          </p>
        </div>

        {activeRoutine && (
          <button
            type="button"
            onClick={deleteRoutine}
            className="rounded-xl px-3 py-2 text-sm text-slate-400 transition hover:bg-red-50 hover:text-red-600"
          >
            Delete routine
          </button>
        )}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          createRoutine();
        }}
        className="mt-6 flex gap-2"
      >
        <input
          value={newRoutineName}
          onChange={(event) =>
            setNewRoutineName(event.target.value)
          }
          placeholder="New routine, e.g. Home care"
          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2 outline-none focus:border-[#cd6ce7] focus:ring-2 focus:ring-[#cd6ce7]/20"
        />

        <button
          type="submit"
          className="rounded-xl bg-[#230028] px-4 py-2 font-medium text-white transition hover:bg-[#3b0842]"
        >
          Add routine
        </button>
      </form>

      {routines.length > 0 && (
        <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
          {routines.map((routine) => {
            const isActive =
              routine.id === activeRoutine?.id;

            return (
              <button
                key={routine.id}
                type="button"
                onClick={() =>
                  setActiveRoutineId(routine.id)
                }
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-[#230028] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {routine.name}
                <span className="ml-2 opacity-60">
                  {routine.tasks.length}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {!activeRoutine ? (
        <div className="mt-8 rounded-2xl bg-slate-50 px-6 py-12 text-center">
          <p className="font-medium text-slate-700">
            No routines yet
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Create one for home, health, work or
            anything you want to repeat.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="font-semibold text-slate-900">
              Add a repeating task
            </h2>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                addRoutineTask();
              }}
              className="mt-3 grid gap-3 lg:grid-cols-[1fr_90px_130px_160px_auto]"
            >
              <input
                value={newTaskTitle}
                onChange={(event) =>
                  setNewTaskTitle(event.target.value)
                }
                placeholder="e.g. Change the bedding"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:border-[#cd6ce7]"
              />

              <input
                type="number"
                min="1"
                value={newInterval}
                onChange={(event) =>
                  setNewInterval(
                    Math.max(
                      1,
                      Number(event.target.value)
                    )
                  )
                }
                aria-label="Repeat interval"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2"
              />

              <select
                value={newUnit}
                onChange={(event) =>
                  setNewUnit(
                    event.target.value as RecurrenceUnit
                  )
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
                onChange={(event) =>
                  setNewDueDate(event.target.value)
                }
                aria-label="First due date"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2"
              />

              <button
                type="submit"
                className="rounded-xl bg-[#230028] px-4 py-2 font-medium text-white"
              >
                Add task
              </button>
            </form>

            <p className="mt-2 text-xs text-slate-400">
              Fortnightly = every 2 weeks.
            </p>
          </div>

          <div className="mt-5 space-y-3">
            {activeRoutine.tasks.length === 0 ? (
              <div className="rounded-2xl bg-[#eeeaea] p-8 text-center text-slate-500">
                This routine has no tasks yet.
              </div>
            ) : (
              [...activeRoutine.tasks]
                .sort(
                  (
                    firstTask,
                    secondTask
                  ) =>
                    firstTask.nextDueDate.localeCompare(
                      secondTask.nextDueDate
                    )
                )
                .map((task) => {
                  const dueStatus =
                    getDueStatus(
                      task.nextDueDate
                    );

                  return (
                    <div
                      key={task.id}
                      className={`rounded-2xl border p-4 transition ${
                        task.active
                          ? "border-slate-200 bg-white"
                          : "border-slate-100 bg-slate-50 opacity-60"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            completeRoutineTask(
                              task.id
                            )
                          }
                          disabled={
                            !task.active
                          }
                          aria-label={`Complete ${task.title}`}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-[#cd6ce7] text-lg text-[#a93ac5] transition hover:bg-[#cd6ce7] hover:text-white disabled:cursor-not-allowed"
                        >
                          ✓
                        </button>

                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-slate-900">
                            {task.title ||
                              "Untitled routine task"}
                          </p>

                          <div className="mt-2 flex flex-wrap gap-2 text-xs">
                            <span
                              className={`rounded-full px-2.5 py-1 ${dueStatus.className}`}
                            >
                              {
                                dueStatus.label
                              }
                            </span>

                            <span className="rounded-full bg-purple-50 px-2.5 py-1 text-purple-700">
                              {getFrequencyLabel(
                                task
                              )}
                            </span>

                            {task.priority ===
                              "high" && (
                              <span className="rounded-full bg-red-100 px-2.5 py-1 text-red-700">
                                High priority
                              </span>
                            )}

                            {task.durationMinutes && (
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                                {task.durationMinutes <
                                60
                                  ? `${task.durationMinutes} min`
                                  : `${Number(
                                      (
                                        task.durationMinutes /
                                        60
                                      ).toFixed(1)
                                    )} hr`}
                              </span>
                            )}

                            {!task.active && (
                              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-800">
                                Paused
                              </span>
                            )}

                            {(task
                              .completionHistory
                              ?.length ??
                              0) > 0 && (
                              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
                                Completed{" "}
                                {
                                  task
                                    .completionHistory
                                    .length
                                }{" "}
                                times
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setEditingRoutineTaskId(
                              task.id
                            )
                          }
                          aria-label={`Edit ${task.title}`}
                          title="Routine task details"
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                        >
                          •••
                        </button>
                      </div>
                    </div>
                  );
                })
            )}
          </div>

          {editingRoutineTask && (
            <ItemDetailsModal
              kind="routine"
              item={editingRoutineTask}
              onChange={(updates) =>
                updateRoutineTask(
                  editingRoutineTask.id,
                  updates
                )
              }
              onDelete={() =>
                deleteRoutineTask(
                  editingRoutineTask.id
                )
              }
              onClose={() =>
                setEditingRoutineTaskId(null)
              }
            />
          )}
        </>
      )}
    </div>
  );
}
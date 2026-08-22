"use client";

import { useState } from "react";
import { Routine, Task } from "@/lib/types";
import { createPortal } from "react-dom";

type TaskWithProject = Task & {
  projectId: string;
  projectName: string;
};

type RoutineTaskForDay =
  Routine["tasks"][number] & {
    routineId: string;
    routineName: string;
  };

type MyDayViewProps = {
  tasks: TaskWithProject[];
  routines: Routine[];

  onOpenProject: (
    projectId: string
  ) => void;

  onCompleteProjectTask: (
    projectId: string,
    taskId: string
  ) => void;

  onCompleteRoutineTask: (
    routineId: string,
    taskId: string
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

  return Number.isInteger(hours)
    ? `${hours} hr`
    : `${hours.toFixed(1)} hrs`;
}

export default function MyDayView({
  tasks,
  routines,
  onOpenProject,
  onCompleteProjectTask,
  onCompleteRoutineTask,
}: MyDayViewProps) {
  const today = getLocalDateKey();

  const [
    activeSummary,
    setActiveSummary,
  ] = useState<
    | "due-today"
    | "overdue"
    | "workload"
    | null
  >(null);

  const openTasks = tasks.filter(
    (task) => !task.completed
  );

  const openRoutineTasks = routines
    .filter((routine) => !routine.archived)
    .flatMap((routine) =>
      routine.tasks
        .filter((task) => task.active)
        .map((task) => ({
          ...task,
          routineId: routine.id,
          routineName: routine.name,
        }))
    );

  const routineTasksDueToday =
    openRoutineTasks.filter(
      (task) =>
        task.nextDueDate === today
    );

  const overdueRoutineTasks =
    openRoutineTasks.filter(
      (task) =>
        task.nextDueDate < today
    );

  const actionableRoutineTasks = [
    ...overdueRoutineTasks,
    ...routineTasksDueToday,
  ];

  const dueToday = openTasks.filter(
    (task) => task.dueDate === today
  );

  const overdue = openTasks.filter(
    (task) =>
      task.dueDate &&
      task.dueDate < today
  );

  const projectWorkloadMinutes =
    dueToday.reduce(
      (total, task) =>
        total +
        (task.durationMinutes ?? 0),
      0
    );

  const routineWorkloadMinutes =
    routineTasksDueToday.reduce(
      (total, task) =>
        total +
        (task.durationMinutes ?? 0),
      0
    );

  const workloadMinutes =
    projectWorkloadMinutes +
    routineWorkloadMinutes;

  const summaryProjectTasks =
    activeSummary === "overdue"
      ? overdue
      : dueToday;

  const summaryRoutineTasks =
    activeSummary === "overdue"
      ? overdueRoutineTasks
      : routineTasksDueToday;

  const summaryTitle =
    activeSummary === "overdue"
      ? "Overdue items"
      : activeSummary === "workload"
        ? "Today’s workload"
        : "Due today";

  const summaryDescription =
    activeSummary === "overdue"
      ? "Items that still need your attention."
      : activeSummary === "workload"
        ? "Tasks and routines contributing to today’s workload."
        : "Everything due today across your projects and routines.";

  const formattedDate =
    new Intl.DateTimeFormat("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(new Date());

  function renderTask(
    task: TaskWithProject
  ) {
    return (
      <div
        key={`${task.projectId}-${task.id}`}
        className="flex w-full items-center gap-3 rounded-xl bg-[#eeeaea] px-4 py-3"
      >
        <button
          type="button"
          onClick={() =>
            onCompleteProjectTask(
              task.projectId,
              task.id
            )
          }
          aria-label={`Complete ${task.title}`}
          title="Mark task complete"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-[#cd6ce7] font-bold text-[#9d3db7] transition hover:bg-[#cd6ce7] hover:text-white"
        >
          ✓
        </button>

        <button
          type="button"
          onClick={() =>
            onOpenProject(
              task.projectId
            )
          }
          className="min-w-0 flex-1 text-left"
        >
          <p className="truncate font-medium text-slate-900">
            {task.title ||
              "Untitled task"}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {task.projectName}
          </p>
        </button>

        <div className="shrink-0 text-right text-xs text-slate-500">
          <p>
            {formatDuration(
              task.durationMinutes
            )}
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

  function renderRoutineTask(
    task: RoutineTaskForDay
  ) {
    const isOverdue =
      task.nextDueDate < today;

    return (
      <div
        key={`${task.routineId}-${task.id}`}
        className="flex items-center gap-3 rounded-xl bg-[#eeeaea] px-4 py-3"
      >
        <button
          type="button"
          onClick={() =>
            onCompleteRoutineTask(
              task.routineId,
              task.id
            )
          }
          aria-label={`Complete ${task.title}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-[#cd6ce7] font-bold text-[#9d3db7] transition hover:bg-[#cd6ce7] hover:text-white"
        >
          ✓
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-slate-900">
            {task.title ||
              "Untitled routine task"}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {task.routineName}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
            isOverdue
              ? "bg-red-100 text-red-700"
              : "bg-amber-100 text-amber-800"
          }`}
        >
          {isOverdue
            ? "Overdue"
            : "Due today"}
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white/85 p-5 shadow-xl backdrop-blur-md md:p-8">
      <div className="mb-8">
        <p className="text-sm font-medium text-[#9d3db7]">
          {formattedDate}
        </p>

        <h1 className="mt-1 text-3xl font-bold text-slate-950">
          My Day
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Here’s what needs your attention today.
        </p>
      </div>

      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={() =>
            setActiveSummary("due-today")
          }
          className="rounded-2xl bg-[#f3eeee] p-4 text-left transition hover:bg-[#e9dfe9] focus:outline-none focus:ring-2 focus:ring-[#cd6ce7]"
        >
          <p className="text-2xl font-bold">
            {dueToday.length +
              routineTasksDueToday.length}
          </p>

          <p className="text-sm text-slate-500">
            Due today
          </p>

          <p className="mt-2 text-xs text-[#9d3db7]">
            View items →
          </p>
        </button>

        <button
          type="button"
          onClick={() =>
            setActiveSummary("overdue")
          }
          className="rounded-2xl bg-[#f3eeee] p-4 text-left transition hover:bg-[#e9dfe9] focus:outline-none focus:ring-2 focus:ring-[#cd6ce7]"
        >
          <p className="text-2xl font-bold text-red-600">
            {overdue.length +
              overdueRoutineTasks.length}
          </p>

          <p className="text-sm text-slate-500">
            Overdue
          </p>

          <p className="mt-2 text-xs text-[#9d3db7]">
            View items →
          </p>
        </button>

        <button
          type="button"
          onClick={() =>
            setActiveSummary("workload")
          }
          className="rounded-2xl bg-[#f3eeee] p-4 text-left transition hover:bg-[#e9dfe9] focus:outline-none focus:ring-2 focus:ring-[#cd6ce7]"
        >
          <p className="text-2xl font-bold">
            {formatDuration(
              workloadMinutes
            )}
          </p>

          <p className="text-sm text-slate-500">
            Estimated workload
          </p>

          <p className="mt-2 text-xs text-[#9d3db7]">
            View breakdown →
          </p>
        </button>
      </div>

      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">
              Routines
            </h2>

            <p className="text-sm text-slate-500">
              Repeating things that are ready today.
            </p>
          </div>

          {actionableRoutineTasks.length >
            0 && (
            <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-700">
              {
                actionableRoutineTasks.length
              }{" "}
              ready
            </span>
          )}
        </div>

        <div className="space-y-2">
          {actionableRoutineTasks.length >
          0 ? (
            actionableRoutineTasks.map(
              renderRoutineTask
            )
          ) : (
            <p className="rounded-xl bg-[#f3eeee] px-4 py-6 text-center text-sm text-slate-500">
              No routines need your attention today.
            </p>
          )}
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-lg font-semibold">
            Due today
          </h2>

          <div className="space-y-2">
            {dueToday.length > 0 ? (
              dueToday.map(renderTask)
            ) : (
              <p className="rounded-xl bg-[#f3eeee] px-4 py-6 text-center text-sm text-slate-500">
                Nothing due today.
              </p>
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">
            Overdue
          </h2>

          <div className="space-y-2">
            {overdue.length > 0 ? (
              overdue.map(renderTask)
            ) : (
              <p className="rounded-xl bg-[#f3eeee] px-4 py-6 text-center text-sm text-slate-500">
                Nothing overdue. Lovely.
              </p>
            )}
          </div>
        </section>
      </div>

      {activeSummary &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                setActiveSummary(null);
              }
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="my-day-summary-title"
              className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl md:p-7"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9d3db7]">
                    My Day
                  </p>

                  <h2
                    id="my-day-summary-title"
                    className="mt-1 text-2xl font-semibold text-slate-950"
                  >
                    {summaryTitle}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {
                      summaryDescription
                    }
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setActiveSummary(null)
                  }
                  aria-label="Close summary"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  ×
                </button>
              </div>

              {activeSummary ===
                "workload" && (
                <div className="mt-5 rounded-2xl bg-purple-50 px-4 py-3">
                  <p className="text-sm text-purple-800">
                    Estimated total:{" "}
                    <span className="font-semibold">
                      {formatDuration(
                        workloadMinutes
                      )}
                    </span>
                  </p>

                  <p className="mt-1 text-xs text-purple-600">
                    Items without an estimate are listed but do not add to the total.
                  </p>
                </div>
              )}

              <div className="mt-6 space-y-6">
                {summaryProjectTasks.length >
                  0 && (
                  <section>
                    <h3 className="mb-3 text-sm font-semibold text-slate-900">
                      Project tasks
                    </h3>

                    <div className="space-y-2">
                      {summaryProjectTasks.map(
                        renderTask
                      )}
                    </div>
                  </section>
                )}

                {summaryRoutineTasks.length >
                  0 && (
                  <section>
                    <h3 className="mb-3 text-sm font-semibold text-slate-900">
                      Routine tasks
                    </h3>

                    <div className="space-y-2">
                      {summaryRoutineTasks.map(
                        renderRoutineTask
                      )}
                    </div>
                  </section>
                )}

                {summaryProjectTasks.length ===
                  0 &&
                  summaryRoutineTasks.length ===
                    0 && (
                    <div className="rounded-2xl bg-slate-50 px-5 py-10 text-center">
                      <p className="font-medium text-slate-700">
                        Nothing here.
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {activeSummary ===
                        "overdue"
                          ? "You have no overdue items."
                          : "There are no items due today."}
                      </p>
                    </div>
                  )}
              </div>

              <div className="mt-7 flex justify-end border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={() =>
                    setActiveSummary(null)
                  }
                  className="rounded-xl bg-[#1f0825] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#3b0842]"
                >
                  Done
                </button>
              </div>
            </section>
          </div>,
          document.body
        )}
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  Routine,
  SortdList,
  Task,
} from "@/lib/types";
import { createPortal } from "react-dom";

import {
  closestCenter,
  DndContext,
  DragEndEvent,
} from "@dnd-kit/core";

import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

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
  tasks: TaskWithProject[];
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

function SortableMyDayRoutineTask({
  task,
  today,
  onComplete,
  onEdit,
}: {
  task: RoutineTaskForDay;
  today: string;

  onComplete: (
    routineId: string,
    taskId: string,
  ) => void;

  onEdit: (
    task: RoutineTaskForDay,
  ) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `${task.routineId}-${task.id}`,
  });

  const style = {
    transform:
      CSS.Transform.toString(
        transform,
      ),

    transition,
  };

  const isOverdue =
    task.nextDueDate < today;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2.5 rounded-xl bg-[#eeeaea] px-4 py-2 transition ${
        isDragging
          ? "z-50 opacity-60 shadow-lg"
          : ""
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="shrink-0 cursor-grab rounded-lg px-1 py-0.5 text-xs text-slate-400 active:cursor-grabbing"
        aria-label={`Reorder ${task.title}`}
        title="Drag to reorder"
      >
        ⋮⋮
      </button>

      <button
        type="button"
        onClick={() =>
          onComplete(
            task.routineId,
            task.id,
          )
        }
        aria-label={`Complete ${task.title}`}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-[var(--sortd-teal-dark)] text-sm font-bold text-[var(--sortd-teal-dark)] transition hover:bg-[var(--sortd-teal-dark)] hover:text-white"
      >
        ✓
      </button>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-slate-900">
          {task.title ||
            "Untitled routine task"}
        </p>

        <p className="mt-0.5 text-xs text-slate-500">
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

      <button
        type="button"
        onClick={() => onEdit(task)}
        aria-label={`Edit ${task.title}`}
        title="Routine task details"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs text-slate-500 transition hover:bg-white hover:text-slate-900"
      >
        •••
      </button>
    </div>
  );
}

export default function MyDayView({
  tasks,
  routines,
  projects,
  onChangeRoutines,
  onOpenProject,
  onCompleteProjectTask,
  onCompleteRoutineTask,
  onUpdateRoutineTask,
  onDeleteRoutineTask,
}: MyDayViewProps) {
  const today = getLocalDateKey();

  const [
    dayViewMode,
    setDayViewMode,
  ] = useState<
    "today" | "review"
  >("today");

  const [activeSummary, setActiveSummary] = useState<
    "due-today" | "overdue" | "workload" | null
  >(null);

  const [
    selectedRoutineTask,
    setSelectedRoutineTask,
  ] = useState<RoutineTaskForDay | null>(null);

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

  const monthStart =
    new Date(
      todayDate.getFullYear(),
      todayDate.getMonth(),
      1,
    );

  const monthEnd =
    new Date(
      todayDate.getFullYear(),
      todayDate.getMonth() + 1,
      0,
    );

  const currentMonthProjects =
    projects
      .filter((project) => {
        if (
          project.status ===
          "completed"
        ) {
          return false;
        }

        const start =
          project.startDate
            ? parseDateKey(
                project.startDate,
              )
            : null;

        const end =
          project.targetDate
            ? parseDateKey(
                project.targetDate,
              )
            : null;

        /*
        * No dates at all:
        * don't include it in the
        * month section.
        */
        if (!start && !end) {
          return false;
        }

        /*
        * Only target date:
        * show it if the target is
        * in this month.
        */
        if (!start && end) {
          return (
            end >= monthStart &&
            end <= monthEnd
          );
        }

        /*
        * Start date but no target:
        * treat it as an ongoing
        * active project.
        */
        if (start && !end) {
          return start <= monthEnd;
        }

        return (
          start! <= monthEnd &&
          end! >= monthStart
        );
      })
      .sort((a, b) => {
        if (
          a.targetDate &&
          b.targetDate
        ) {
          return (
            parseDateKey(
              a.targetDate,
            ).getTime() -
            parseDateKey(
              b.targetDate,
            ).getTime()
          );
        }

        if (a.targetDate) {
          return -1;
        }

        if (b.targetDate) {
          return 1;
        }

        return 0;
      });

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

  const summaryProjectTasks = activeSummary === "overdue" ? overdue : dueToday;

  const summaryRoutineTasks =
    activeSummary === "overdue" ? overdueRoutineTasks : routineTasksDueToday;

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

  const formattedDate = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  function handleRoutineDragEnd(
    event: DragEndEvent,
  ) {
    const { active, over } = event;

    if (
      !over ||
      active.id === over.id
    ) {
      return;
    }

    const oldIndex =
      actionableRoutineTasks.findIndex(
        (task) =>
          `${task.routineId}-${task.id}` ===
          active.id,
      );

    const newIndex =
      actionableRoutineTasks.findIndex(
        (task) =>
          `${task.routineId}-${task.id}` ===
          over.id,
      );

    if (
      oldIndex < 0 ||
      newIndex < 0
    ) {
      return;
    }

    const reordered =
      arrayMove(
        actionableRoutineTasks,
        oldIndex,
        newIndex,
      );

    const orderMap = new Map(
      reordered.map(
        (task, index) => [
          `${task.routineId}-${task.id}`,
          index + 1,
        ],
      ),
    );

    onChangeRoutines(
      routines.map((routine) => ({
        ...routine,

        tasks: routine.tasks.map(
          (task) => {
            const nextOrder =
              orderMap.get(
                `${routine.id}-${task.id}`,
              );

            if (
              nextOrder === undefined
            ) {
              return task;
            }

            return {
              ...task,
              myDayOrder:
                nextOrder,
            };
          },
        ),
      })),
    );
  }

  function renderReviewProject(
    project: SortdList,
  ) {
    const totalTasks =
      project.tasks.length;

    const completedTasks =
      project.tasks.filter(
        (task) =>
          task.completed,
      ).length;

    const openCount =
      project.tasks.filter(
        (task) =>
          !task.completed,
      ).length;

    const progress =
      totalTasks > 0
        ? Math.round(
            (completedTasks /
              totalTasks) *
              100,
          )
        : 0;

    return (
      <button
        key={project.id}
        type="button"
        onClick={() =>
          onOpenProject(
            project.id,
          )
        }
        className="w-full border-b border-slate-100 px-1 py-4 text-left transition last:border-b-0 hover:bg-slate-50"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-slate-900">
              {project.name ||
                "Untitled project"}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {openCount}{" "}
              {openCount === 1
                ? "task"
                : "tasks"}{" "}
              left
            </p>
          </div>

          {project.targetDate && (
            <div className="shrink-0 text-right">
              <p className="text-xs text-slate-400">
                Ends
              </p>

              <p className="mt-0.5 text-sm font-medium text-slate-700">
                {formatShortDate(
                  project.targetDate,
                )}
              </p>
            </div>
          )}
        </div>

        {totalTasks > 0 && (
          <div className="mt-3">
            <div className="mb-1.5 flex items-center justify-between text-[11px] text-slate-400">
              <span>
                Progress
              </span>

              <span>
                {progress}%
              </span>
            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[var(--sortd-teal-dark)] transition-all"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>
          </div>
        )}
      </button>
    );
  }

  function renderTask(task: TaskWithProject) {
    return (
      <div
        key={`${task.projectId}-${task.id}`}
        className="flex w-full items-center gap-3 rounded-xl bg-[#eeeaea] px-4 py-3"
      >
        <button
          type="button"
          onClick={() => onCompleteProjectTask(task.projectId, task.id)}
          aria-label={`Complete ${task.title}`}
          title="Mark task complete"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-[var(--sortd-teal-dark)] font-bold text-[var(--sortd-teal-dark)] transition hover:bg-[var(--sortd-teal-dark)] hover:text-white"
        >
          ✓
        </button>

        <button
          type="button"
          onClick={() => onOpenProject(task.projectId)}
          className="min-w-0 flex-1 text-left"
        >
          <p className="truncate font-medium text-slate-900">
            {task.title || "Untitled task"}
          </p>

          <p className="mt-1 text-xs text-slate-500">{task.projectName}</p>
        </button>

        <div className="shrink-0 text-right text-xs text-slate-500">
          <p>{formatDuration(task.durationMinutes)}</p>

          {task.priority && (
            <p className="mt-1 capitalize">{task.priority} priority</p>
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
        className="flex items-center gap-3 rounded-xl bg-[#eeeaea] px-4 py-3"
      >
        <button
          type="button"
          onClick={() => onCompleteRoutineTask(task.routineId, task.id)}
          aria-label={`Complete ${task.title}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-[var(--sortd-teal-dark)] font-bold text-[var(--sortd-teal-dark)] transition hover:bg-[var(--sortd-teal-dark)] hover:text-white"
        >
          ✓
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-slate-900">
            {task.title || "Untitled routine task"}
          </p>

          <p className="mt-1 text-xs text-slate-500">{task.routineName}</p>
        </div>

        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
            isOverdue
              ? "bg-red-100 text-red-700"
              : "bg-amber-100 text-amber-800"
          }`}
        >
          {isOverdue ? "Overdue" : "Due today"}
        </span>

        <button
          type="button"
          onClick={() =>
            setSelectedRoutineTask(task)
          }
          aria-label={`Edit ${task.title}`}
          title="Routine task details"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm text-slate-500 transition hover:bg-white hover:text-slate-900"
        >
          •••
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white/85 p-5 shadow-xl backdrop-blur-md md:p-8">
      <div className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[var(--sortd-teal-dark)]">
              {formattedDate}
            </p>

            <h1 className="mt-1 text-3xl font-bold text-slate-950">
              My Day
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {dayViewMode ===
              "today"
                ? "Here’s what needs your attention today."
                : "Step back and see what you've got going on."}
            </p>
          </div>

          <div className="flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() =>
                setDayViewMode(
                  "today",
                )
              }
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                dayViewMode ===
                "today"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Today
            </button>

            <button
              type="button"
              onClick={() =>
                setDayViewMode(
                  "review",
                )
              }
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                dayViewMode ===
                "review"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Review
            </button>
          </div>
        </div>
      </div>

      {dayViewMode ===
        "today" && (
        <>

      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => setActiveSummary("due-today")}
          className="rounded-2xl bg-[#f3eeee] p-4 text-left transition hover:bg-[#e9dfe9] focus:outline-none focus:ring-2 focus:ring-[var(--sortd-teal-dark)]"
        >
          <p className="text-2xl font-bold">
            {dueToday.length + routineTasksDueToday.length}
          </p>

          <p className="text-sm text-slate-500">Due today</p>

          <p className="mt-2 text-xs text-[var(--sortd-teal-dark)]">View items →</p>
        </button>

        <button
          type="button"
          onClick={() => setActiveSummary("overdue")}
          className="rounded-2xl bg-[#f3eeee] p-4 text-left transition hover:bg-[#e9dfe9] focus:outline-none focus:ring-2 focus:ring-[var(--sortd-teal-dark)]"
        >
          <p className="text-2xl font-bold text-red-600">
            {overdue.length + overdueRoutineTasks.length}
          </p>

          <p className="text-sm text-slate-500">Overdue</p>

          <p className="mt-2 text-xs text-[var(--sortd-teal-dark)]">View items →</p>
        </button>

        <button
          type="button"
          onClick={() => setActiveSummary("workload")}
          className="rounded-2xl bg-[#f3eeee] p-4 text-left transition hover:bg-[#e9dfe9] focus:outline-none focus:ring-2 focus:ring-[var(--sortd-teal-dark)]"
        >
          <p className="text-2xl font-bold">
            {formatDuration(workloadMinutes)}
          </p>

          <p className="text-sm text-slate-500">Estimated workload</p>

          <p className="mt-2 text-xs text-[var(--sortd-teal-dark)]">View breakdown →</p>
        </button>
      </div>

      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Routines</h2>

            <p className="text-sm text-slate-500">
              Repeating things that are ready today.
            </p>
          </div>

          {actionableRoutineTasks.length > 0 && (
            <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-700">
              {actionableRoutineTasks.length} ready
            </span>
          )}
        </div>

        <div className="space-y-2">
          {actionableRoutineTasks.length > 0 ? (
            <DndContext
              collisionDetection={
                closestCenter
              }
              onDragEnd={
                handleRoutineDragEnd
              }
            >
              <SortableContext
                items={actionableRoutineTasks.map(
                  (task) =>
                    `${task.routineId}-${task.id}`,
                )}
                strategy={
                  verticalListSortingStrategy
                }
              >
                <div className="space-y-1.5">
                  {actionableRoutineTasks.map(
                    (task) => (
                    <SortableMyDayRoutineTask
                      key={`${task.routineId}-${task.id}`}
                      task={task}
                      today={today}
                      onComplete={
                        onCompleteRoutineTask
                      }
                      onEdit={
                        setSelectedRoutineTask
                      }
                    />
                    ),
                  )}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <p className="rounded-xl bg-[#f3eeee] px-4 py-6 text-center text-sm text-slate-500">
              No routines need your attention today.
            </p>
          )}
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-lg font-semibold">Due today</h2>

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
          <h2 className="mb-3 text-lg font-semibold">Overdue</h2>

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

        </>
        )}
      {dayViewMode ===
        "review" && (
        <div>
          {/* This month */}

          <section className="mb-10">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--sortd-teal-dark)]">
                  This month
                </p>

                <h2 className="mt-1 text-xl font-semibold text-slate-950">
                  {new Intl.DateTimeFormat(
                    "en-GB",
                    {
                      month:
                        "long",
                      year:
                        "numeric",
                    },
                  ).format(
                    todayDate,
                  )}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  The projects
                  you&aposre currently
                  moving forward.
                </p>
              </div>

              <span className="text-sm text-slate-400">
                {
                  currentMonthProjects.length
                }{" "}
                {currentMonthProjects.length ===
                1
                  ? "project"
                  : "projects"}
              </span>
            </div>

            {currentMonthProjects.length >
            0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white px-4">
                {currentMonthProjects.map(
                  renderReviewProject,
                )}
              </div>
            ) : (
              <div className="rounded-2xl bg-[#f3eeee] px-5 py-8 text-center">
                <p className="font-medium text-slate-700">
                  No projects
                  scheduled this
                  month.
                </p>
              </div>
            )}
          </section>

          {/* Needs attention */}

          <section className="mb-10">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--sortd-teal-dark)]">
                Needs attention
              </p>

              <h2 className="mt-1 text-xl font-semibold text-slate-950">
                Outstanding
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Things that have
                already passed their
                due date.
              </p>
            </div>

            {overdue.length +
              overdueRoutineTasks.length >
            0 ? (
              <div className="grid gap-6 lg:grid-cols-2">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-700">
                      Project tasks
                    </h3>

                    <span className="text-xs text-red-500">
                      {
                        overdue.length
                      }
                    </span>
                  </div>

                  <div className="space-y-2">
                    {overdue.length >
                    0 ? (
                      overdue.map(
                        renderTask,
                      )
                    ) : (
                      <p className="text-sm text-slate-400">
                        Nothing
                        overdue.
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-700">
                      Routines
                    </h3>

                    <span className="text-xs text-red-500">
                      {
                        overdueRoutineTasks.length
                      }
                    </span>
                  </div>

                  <div className="space-y-2">
                    {overdueRoutineTasks.length >
                    0 ? (
                      overdueRoutineTasks.map(
                        renderRoutineTask,
                      )
                    ) : (
                      <p className="text-sm text-slate-400">
                        Nothing
                        overdue.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-[#f3eeee] px-5 py-6 text-center text-sm text-slate-500">
                Nothing overdue.
                Lovely.
              </div>
            )}
          </section>

          {/* Coming up */}

          <section>
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--sortd-teal-dark)]">
                Coming up
              </p>

              <h2 className="mt-1 text-xl font-semibold text-slate-950">
                Next 7 days
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Tasks and routines
                that are heading your
                way.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-700">
                    Project tasks
                  </h3>

                  <span className="text-xs text-slate-400">
                    {
                      upcomingTasks.length
                    }
                  </span>
                </div>

                <div className="space-y-2">
                  {upcomingTasks.length >
                  0 ? (
                    upcomingTasks.map(
                      (task) => (
                        <div
                          key={`${task.projectId}-${task.id}`}
                        >
                          {renderTask(
                            task,
                          )}

                          <p className="mt-1 px-3 text-right text-[11px] text-[var(--sortd-teal-dark)]">
                            Due{" "}
                            {formatShortDate(
                              task.dueDate,
                            )}
                          </p>
                        </div>
                      ),
                    )
                  ) : (
                    <p className="rounded-xl bg-[#f3eeee] px-4 py-6 text-center text-sm text-slate-500">
                      Nothing due
                      over the next
                      week.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-700">
                    Routines
                  </h3>

                  <span className="text-xs text-slate-400">
                    {
                      upcomingRoutineTasks.length
                    }
                  </span>
                </div>

                <div className="space-y-2">
                  {upcomingRoutineTasks.length >
                  0 ? (
                    upcomingRoutineTasks.map(
                      (task) => (
                        <button
                          key={`${task.routineId}-${task.id}`}
                          type="button"
                          onClick={() =>
                            setSelectedRoutineTask(
                              task,
                            )
                          }
                          className="flex w-full items-center justify-between gap-4 rounded-xl bg-[#eeeaea] px-4 py-3 text-left transition hover:bg-[#e9e4e9]"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-900">
                              {task.title ||
                                "Untitled routine task"}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {
                                task.routineName
                              }
                            </p>
                          </div>

                          <span className="shrink-0 text-xs font-medium text-[var(--sortd-teal-dark)]">
                            {formatShortDate(
                              task.nextDueDate,
                            )}
                          </span>
                        </button>
                      ),
                    )
                  ) : (
                    <p className="rounded-xl bg-[#f3eeee] px-4 py-6 text-center text-sm text-slate-500">
                      No routines
                      coming up this
                      week.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {activeSummary &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
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
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sortd-teal-dark)]">
                    My Day
                  </p>

                  <h2
                    id="my-day-summary-title"
                    className="mt-1 text-2xl font-semibold text-slate-950"
                  >
                    {summaryTitle}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {summaryDescription}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveSummary(null)}
                  aria-label="Close summary"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  ×
                </button>
              </div>

              {activeSummary === "workload" && (
                <div className="mt-5 rounded-2xl bg-purple-50 px-4 py-3">
                  <p className="text-sm text-purple-800">
                    Estimated total:{" "}
                    <span className="font-semibold">
                      {formatDuration(workloadMinutes)}
                    </span>
                  </p>

                  <p className="mt-1 text-xs text-purple-600">
                    Items without an estimate are listed but do not add to the
                    total.
                  </p>
                </div>
              )}

              <div className="mt-6 space-y-6">
                {summaryProjectTasks.length > 0 && (
                  <section>
                    <h3 className="mb-3 text-sm font-semibold text-slate-900">
                      Project tasks
                    </h3>

                    <div className="space-y-2">
                      {summaryProjectTasks.map(renderTask)}
                    </div>
                  </section>
                )}

                {summaryRoutineTasks.length > 0 && (
                  <section>
                    <h3 className="mb-3 text-sm font-semibold text-slate-900">
                      Routine tasks
                    </h3>

                    <div className="space-y-2">
                      {summaryRoutineTasks.map(renderRoutineTask)}
                    </div>
                  </section>
                )}

                {summaryProjectTasks.length === 0 &&
                  summaryRoutineTasks.length === 0 && (
                    <div className="rounded-2xl bg-slate-50 px-5 py-10 text-center">
                      <p className="font-medium text-slate-700">
                        Nothing here.
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {activeSummary === "overdue"
                          ? "You have no overdue items."
                          : "There are no items due today."}
                      </p>
                    </div>
                  )}
              </div>

              <div className="mt-7 flex justify-end border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={() => setActiveSummary(null)}
                  className="rounded-xl bg-[#1f0825] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#3b0842]"
                >
                  Done
                </button>
              </div>
            </section>
          </div>,
          document.body,
        )}
        {selectedRoutineTask && (
          <ItemDetailsModal
            kind="routine"
            item={selectedRoutineTask}
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

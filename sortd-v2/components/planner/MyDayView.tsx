"use client";

import { useState } from "react";
import {
  Routine,
  SortdList,
  Task,
} from "@/lib/types";

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
      className={`flex items-center gap-2.5 rounded-xl border border-[var(--sortd-border)] bg-[var(--sortd-card)] px-4 py-2 transition ${
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
        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
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
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs text-slate-500 transition hover:bg-[var(--sortd-muted)] hover:text-slate-900"
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

  const [dayViewMode, setDayViewMode] = useState<"today" | "upcoming" | "review">("today");

  const [itemDisplayMode, setItemDisplayMode] = useState<"all" | "grouped">("grouped");

  const [
    selectedRoutineTask,
    setSelectedRoutineTask,
  ] = useState<RoutineTaskForDay | null>(null);

  const currentRoutineTask = selectedRoutineTask
    ? routines.find((routine) => routine.id === selectedRoutineTask.routineId)?.tasks.find((task) => task.id === selectedRoutineTask.id)
    : undefined;

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
  ].sort((a, b) => a.date.localeCompare(b.date));

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
        className="w-full border-b border-[var(--sortd-border)] px-1 py-4 text-left transition last:border-b-0 hover:bg-[var(--sortd-muted)]"
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

            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--sortd-muted)]">
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
        className="flex w-full items-center gap-3 rounded-xl border border-[var(--sortd-border)] bg-[var(--sortd-card)] px-4 py-2"
      >
        <button
          type="button"
          onClick={() => onCompleteProjectTask(task.projectId, task.id)}
          aria-label={`Complete ${task.title}`}
          title="Mark task complete"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-[var(--sortd-teal-dark)] font-bold text-[var(--sortd-teal-dark)] transition hover:bg-[var(--sortd-teal-dark)] hover:text-white"
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

          {options?.showProject !== false && <p className="mt-1 text-xs text-slate-500">{task.projectName}</p>}
        </button>

        <div className="shrink-0 text-right text-xs text-slate-500">
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
        className="flex items-center gap-3 rounded-xl border border-[var(--sortd-border)] bg-[var(--sortd-card)] px-4 py-2"
      >
        <button
          type="button"
          onClick={() => onCompleteRoutineTask(task.routineId, task.id)}
          aria-label={`Complete ${task.title}`}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-[var(--sortd-teal-dark)] font-bold text-[var(--sortd-teal-dark)] transition hover:bg-[var(--sortd-teal-dark)] hover:text-white"
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
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
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
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm text-slate-500 transition hover:bg-[var(--sortd-muted)] hover:text-slate-900"
        >
          •••
        </button>
      </div>
    );
  }

  const upcomingDays = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(todayDate, index + 1);
    const key = toDateKey(date);
    return {
      key,
      label: index === 0 ? "Tomorrow" : new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "short" }).format(date),
      tasks: upcomingTasks.filter((task) => task.dueDate === key),
      routines: upcomingRoutineTasks.filter((task) => task.nextDueDate === key),
    };
  }).filter((day) => day.tasks.length + day.routines.length > 0);

  const emptyClassName = "rounded-xl border border-[var(--sortd-border)] bg-[var(--sortd-muted)] px-4 py-6 text-sm text-slate-500";

  return (
    <div className="rounded-3xl border border-[var(--sortd-border)] bg-[var(--sortd-surface)] p-5 shadow-sm md:p-8">
      <header className="mb-6">
        <p className="text-sm font-medium text-[var(--sortd-teal-dark)]">{formattedDate}</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-950">My Day</h1>
        <p className="mt-2 text-sm text-slate-500">Everything you need, in one place.</p>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="My Day views" className="flex w-fit max-w-full rounded-xl bg-[var(--sortd-muted)] p-1">
          {(["today", "upcoming", "review"] as const).map((view) => (
            <button
              key={view}
              type="button"
              aria-pressed={dayViewMode === view}
              onClick={() => setDayViewMode(view)}
              className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sortd-teal-dark)] ${dayViewMode === view ? "bg-[var(--sortd-card)] text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
            >{view}</button>
          ))}
        </nav>
        {dayViewMode === "today" && (
          <div role="group" aria-label="Routine and task grouping" className="flex rounded-xl bg-[var(--sortd-muted)] p-1">
            {(["grouped", "all"] as const).map((mode) => (
              <button key={mode} type="button" aria-pressed={itemDisplayMode === mode} onClick={() => setItemDisplayMode(mode)} className={`rounded-lg px-3 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sortd-teal-dark)] ${itemDisplayMode === mode ? "bg-[var(--sortd-card)] text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}>
                {mode === "all" ? "All" : "Grouped"}
              </button>
            ))}
          </div>
        )}
        </div>
      </header>

      {dayViewMode === "today" && (
        <div className="space-y-7">
          <div className="flex flex-wrap gap-x-5 gap-y-2 border-b border-[var(--sortd-border)] pb-4 text-sm text-slate-500">
            <p><strong className="font-semibold text-slate-900">{dueToday.length + routineTasksDueToday.length}</strong> due today</p>
            <p><strong className={overdue.length + overdueRoutineTasks.length > 0 ? "font-semibold text-red-700" : "font-semibold text-slate-900"}>{overdue.length + overdueRoutineTasks.length}</strong> overdue</p>
            <p title="Estimates for items due today; excludes overdue items and items without an estimate.">{workloadMinutes > 0 ? `${formatDuration(workloadMinutes)} estimated today` : "No time estimated today"}</p>
          </div>
          {itemDisplayMode === "all" ? (
            <section aria-label="All routines and tasks" className="space-y-2">
              {allActionableItems.length > 0 ? allActionableItems.map((item) => item.kind === "routine" ? renderRoutineTask(item.task) : renderTask(item.task, { showStatus: true })) : <p className={emptyClassName}>Nothing needs your attention today.</p>}
            </section>
          ) : (
            <>
              <section aria-labelledby="my-day-routines">
                <h2 id="my-day-routines" className="mb-3 text-base font-semibold text-slate-900">Routines <span className="ml-2 text-xs font-normal text-slate-500">{actionableRoutineTasks.length}</span></h2>
                {actionableRoutineTasks.length > 0 ? (
                  <DndContext collisionDetection={closestCenter} onDragEnd={handleRoutineDragEnd}>
                    <SortableContext items={routineGroups.flatMap((group) => group.tasks.map((task) => `${task.routineId}-${task.id}`))} strategy={verticalListSortingStrategy}>
                      <div className="space-y-5">
                        {routineGroups.map((group) => (
                          <section key={group.routineId} aria-label={group.routineName || "Untitled routine"}>
                            <div className="mb-2 flex items-center justify-between gap-3">
                              <h3 className="text-sm font-medium text-slate-700">{group.routineName || "Untitled routine"}</h3>
                              <span className="text-xs text-slate-500">{group.tasks.length}</span>
                            </div>
                            <div className="space-y-2">
                              {group.tasks.map((task) => <SortableMyDayRoutineTask key={`${task.routineId}-${task.id}`} task={task} today={today} onComplete={onCompleteRoutineTask} onEdit={setSelectedRoutineTask} />)}
                            </div>
                          </section>
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                ) : <p className={emptyClassName}>No routines due today.</p>}
              </section>
              <section aria-labelledby="my-day-tasks">
                <h2 id="my-day-tasks" className="mb-3 text-base font-semibold text-slate-900">Tasks <span className="ml-2 text-xs font-normal text-slate-500">{actionableProjectTasks.length}</span></h2>
                {taskGroups.length > 0 ? (
                  <div className="space-y-5">
                    {taskGroups.map((group) => (
                      <section key={group.projectId} aria-label={group.projectName || "Untitled project"}>
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <button type="button" onClick={() => onOpenProject(group.projectId)} className="text-left text-sm font-medium text-slate-700 hover:text-[var(--sortd-teal-dark)]">{group.projectName || "Untitled project"}</button>
                          <span className="text-xs text-slate-500">{group.tasks.length}</span>
                        </div>
                        <div className="space-y-2">{group.tasks.map((task) => renderTask(task, { showStatus: true, showProject: false }))}</div>
                      </section>
                    ))}
                  </div>
                ) : <p className={emptyClassName}>No tasks due today.</p>}
              </section>
            </>
          )}
        </div>
      )}

      {dayViewMode === "upcoming" && (
        <section aria-labelledby="my-day-upcoming">
          <h2 id="my-day-upcoming" className="text-lg font-semibold text-slate-900">Next 7 days</h2>
          <p className="mt-1 mb-5 text-sm text-slate-500">Scheduled tasks and next routine due dates.</p>
          <div className="space-y-6">
            {upcomingDays.length > 0 ? upcomingDays.map((day) => (
              <section key={day.key} aria-label={day.label}>
                <h3 className="mb-3 text-sm font-semibold text-slate-700">{day.label}</h3>
                <div className="space-y-2">
                  {day.routines.map((task) => renderRoutineTask(task))}
                  {day.tasks.map((task) => renderTask(task))}
                </div>
              </section>
            )) : <p className={emptyClassName}>Nothing scheduled over the next week.</p>}
          </div>
        </section>
      )}

      {dayViewMode === "review" && (
        <div className="space-y-7">
          <section aria-labelledby="my-day-month">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 id="my-day-month" className="text-lg font-semibold text-slate-900">{new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(todayDate)}</h2>
              <span className="text-xs text-slate-500">{currentMonthProjects.length} {currentMonthProjects.length === 1 ? "project" : "projects"}</span>
            </div>
            {currentMonthProjects.length > 0 ? <div className="rounded-xl border border-[var(--sortd-border)] bg-[var(--sortd-card)] px-4">{currentMonthProjects.map((project) => renderReviewProject(project))}</div> : <p className={emptyClassName}>No projects scheduled this month.</p>}
          </section>
          <section aria-labelledby="my-day-attention">
            <h2 id="my-day-attention" className="mb-3 text-base font-semibold text-slate-900">Needs attention</h2>
            <div className="space-y-2">
              {overdueRoutineTasks.map((task) => renderRoutineTask(task))}
              {overdue.map((task) => renderTask(task, { showStatus: true }))}
              {overdue.length + overdueRoutineTasks.length === 0 && <p className={emptyClassName}>Nothing overdue. Lovely.</p>}
            </div>
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

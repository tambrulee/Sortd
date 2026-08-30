"use client";

import {
  PointerEvent as ReactPointerEvent,
  useRef,
  useState,
} from "react";

import ArchivedTasks from "@/components/task_management/ArchivedTasks";
import CollectionSwitcher from "@/components/planner/CollectionSwitcher";
import ControlPanel from "@/components/ControlPanel";
import ProjectDetails from "@/components/planner/ProjectDetails";
import TaskList from "@/components/TaskList";
import ConfirmDialog from "@/components/prompts/ConfirmDialog";

import {
  Dream,
  Goal,
  ProjectStatus,
  ScheduleContext,
  SortdList,
  Task,
} from "@/lib/types";

type TaskFilter =
  | "all"
  | "high"
  | "low-energy";

type ProjectViewMode =
  | "list"
  | "board"
  | "timeline";


type TimelineInteractionMode =
  | "move"
  | "resize-start"
  | "resize-end";

type TimelineInteraction = {
  projectId: string;
  mode: TimelineInteractionMode;

  pointerStartX: number;

  originalStart: string;
  originalEnd: string;

  previewStart: string;
  previewEnd: string;
};

const TIMELINE_DAY_WIDTH = 8;

const PROJECT_COLUMNS: {
  status: ProjectStatus;
  label: string;
  description: string;
}[] = [
  {
    status: "backlog",
    label: "Backlog",
    description: "Ideas and future projects",
  },
  {
    status: "planned",
    label: "Planned",
    description: "Ready to start",
  },
  {
    status: "active",
    label: "In Progress",
    description: "Currently moving",
  },
  {
    status: "paused",
    label: "Waiting",
    description: "Paused or blocked",
  },
  {
    status: "completed",
    label: "Done",
    description: "Finished projects",
  },
];

function getProjectStatus(
  project: SortdList,
): ProjectStatus {
  return project.status ?? "active";
}

function getProjectStatusLabel(
  status?: ProjectStatus,
) {
  switch (status) {
    case "backlog":
      return "Backlog";

    case "planned":
      return "Planned";

    case "paused":
      return "Waiting";

    case "completed":
      return "Done";

    case "active":
    default:
      return "In Progress";
  }
}

function getProjectStatusColour(
  project: SortdList,
) {
  switch (project.status) {
    case "backlog":
      return "bg-slate-300";

    case "planned":
      return "bg-sky-400";

    case "paused":
      return "bg-amber-400";

    case "completed":
      return "bg-slate-500";

    case "active":
    default:
      return "bg-emerald-400";
  }
}

function getOpenTaskCount(
  project: SortdList,
) {
  return project.tasks.filter(
    (task) => !task.completed,
  ).length;
}

function formatProjectDate(
  date?: string,
) {
  if (!date) {
    return undefined;
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "numeric",
      month: "short",
    },
  ).format(
    new Date(`${date}T12:00:00`),
  );
}

function parseProjectDate(
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

function toDateString(
  date: Date,
) {
  const year =
    date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
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

function differenceInDays(
  start: Date,
  end: Date,
) {
  const DAY_MS =
    1000 * 60 * 60 * 24;

  return Math.round(
    (end.getTime() -
      start.getTime()) /
      DAY_MS,
  );
}

function formatTimelineMonth(
  date: Date,
) {
  return date.toLocaleDateString(
    "en-GB",
    {
      month: "long",
      year: "numeric",
    },
  );
}

function formatTimelineMarker(
  date: Date,
) {
  return date.toLocaleDateString(
    "en-GB",
    {
      day: "numeric",
      month: "short",
    },
  );
}

type ProjectsViewProps = {
  projects: SortdList[];
  goals: Goal[];
  dreams: Dream[];

  onOpenGoal?: (
    goalId: string,
  ) => void;

  onOpenDream?: (
    dreamId: string,
  ) => void;

  activeProject:
    | SortdList
    | undefined;

  activeProjectId: string;

  visibleTasks: Task[];

  hideCompleted: boolean;

  taskFilter: TaskFilter;

  onCreateProject: () => void;

  onDeleteProject: () => void;

  onRenameProject: (
    projectId: string,
    name: string,
  ) => void;

  onReorderProjects: (
    projects: SortdList[],
  ) => void;

  onChangeProjectName: (
    name: string,
  ) => void;

  onChangeProjectDescription: (
    description: string,
  ) => void;

  onChangeProjectStatus: (
    status: ProjectStatus,
  ) => void;

  onChangeProjectStartDate: (
    startDate?: string,
  ) => void;

  onChangeProjectTargetDate: (
    targetDate?: string,
  ) => void;

  onChangeProjectScheduleContext: (
    context: ScheduleContext,
  ) => void;

  onChangeProjectEarliestStartTime: (
    earliestStartTime?: string,
  ) => void;

  onChangeProjectLatestEndTime: (
    latestEndTime?: string,
  ) => void;

  onChangeProjectGoal: (
    goalId?: string,
  ) => void;

  onChangeProject: (
    projectId: string,
  ) => void;

  onAddTask: () => void;

  onToggleHideCompleted:
    () => void;

  onArchiveCompleted:
    () => void;

  onChangeTaskFilter: (
    filter: TaskFilter,
  ) => void;

  onUpdateTask: (
    id: string,
    title: string,
  ) => void;

  onUpdateTaskPriority: (
    id: string,
    priority:
      | "low"
      | "medium"
      | "high",
  ) => void;

  onUpdateTaskEnergy: (
    id: string,
    energy:
      | "low"
      | "medium"
      | "high",
  ) => void;

  onUpdateTaskDueDate: (
    id: string,
    dueDate: string,
  ) => void;

  onUpdateTaskDuration: (
    id: string,
    durationMinutes?: number,
  ) => void;

  onUpdateTaskMaxSession: (
    id: string,
    maxSessionMinutes?: number,
  ) => void;

  onUpdateTaskScheduleContext: (
    id: string,
    context?: ScheduleContext,
  ) => void;

  onUpdateTaskEarliestStartTime?: (
    id: string,
    earliestStartTime?: string,
  ) => void;

  onUpdateTaskLatestEndTime?: (
    id: string,
    latestEndTime?: string,
  ) => void;

  onToggleTask: (
    id: string,
  ) => void;

  onDeleteTask: (
    id: string,
  ) => void;

  onReorderTasks: (
    tasks: Task[],
  ) => void;

  onRestoreTask: (
    taskId: string,
  ) => void;
};

export default function ProjectsView({
  projects,
  goals,
  dreams,
  onOpenGoal,
  onOpenDream,
  activeProject,
  activeProjectId,
  visibleTasks,
  hideCompleted,
  taskFilter,
  onChangeProject,
  onCreateProject,
  onDeleteProject,
  onRenameProject,
  onReorderProjects,
  onChangeProjectName,
  onChangeProjectDescription,
  onChangeProjectStatus,
  onChangeProjectStartDate,
  onChangeProjectTargetDate,
  onChangeProjectGoal,
  onChangeProjectScheduleContext,
  onChangeProjectEarliestStartTime,
  onChangeProjectLatestEndTime,
  onAddTask,
  onToggleHideCompleted,
  onArchiveCompleted,
  onChangeTaskFilter,
  onUpdateTask,
  onUpdateTaskPriority,
  onUpdateTaskEnergy,
  onUpdateTaskDueDate,
  onUpdateTaskDuration,
  onUpdateTaskMaxSession,
  onUpdateTaskScheduleContext,
  onUpdateTaskEarliestStartTime,
  onUpdateTaskLatestEndTime,
  onToggleTask,
  onDeleteTask,
  onReorderTasks,
  onRestoreTask,
}: ProjectsViewProps) {
  const [
    viewMode,
    setViewMode,
  ] =
    useState<ProjectViewMode>(
      "list",
    );

  const [
    draggedProjectId,
    setDraggedProjectId,
  ] =
    useState<string | null>(
      null,
    );

  const [
    timelineInteraction,
    setTimelineInteraction,
  ] =
    useState<TimelineInteraction | null>(
      null,
    );

  const [
    projectCardOpen,
    setProjectCardOpen,
  ] = useState(false);

  const [
    deleteProjectOpen,
    setDeleteProjectOpen,
  ] = useState(false);

  const suppressTimelineClick =
    useRef(false);

  const datedProjects =
    projects.filter(
      (project) =>
        project.startDate ||
        project.targetDate,
    );

  const timelineStart = (() => {
    const dates =
      datedProjects
        .flatMap(
          (project) => [
            project.startDate,
            project.targetDate,
          ],
        )
        .filter(
          (
            date,
          ): date is string =>
            Boolean(date),
        )
        .map(
          parseProjectDate,
        );

    if (
      dates.length === 0
    ) {
      return new Date();
    }

    return new Date(
      Math.min(
        ...dates.map(
          (date) =>
            date.getTime(),
        ),
      ),
    );
  })();

  const timelineEnd = (() => {
    const dates =
      datedProjects
        .flatMap(
          (project) => [
            project.startDate,
            project.targetDate,
          ],
        )
        .filter(
          (
            date,
          ): date is string =>
            Boolean(date),
        )
        .map(
          parseProjectDate,
        );

    if (
      dates.length === 0
    ) {
      return addDays(
        new Date(),
        30,
      );
    }

    return new Date(
      Math.max(
        ...dates.map(
          (date) =>
            date.getTime(),
        ),
      ),
    );
  })();

  const paddedTimelineStart =
    addDays(
      timelineStart,
      -14,
    );

  const paddedTimelineEnd =
    addDays(
      timelineEnd,
      21,
    );

  const timelineDays =
    Math.max(
      1,
      differenceInDays(
        paddedTimelineStart,
        paddedTimelineEnd,
      ) + 1,
    );

  const timelineWidth =
    timelineDays *
    TIMELINE_DAY_WIDTH;

  const timelineDates =
    Array.from(
      {
        length:
          timelineDays,
      },
      (_, index) =>
        addDays(
          paddedTimelineStart,
          index,
        ),
    );

  const weekMarkers =
    timelineDates
      .map(
        (date, index) => ({
          date,
          index,
        }),
      )
      .filter(
        ({ index }) =>
          index % 7 === 0,
      );

  const monthSegments: {
    key: string;
    label: string;
    startIndex: number;
    dayCount: number;
  }[] = [];

  timelineDates.forEach(
    (date, index) => {
      const key = `${date.getFullYear()}-${date.getMonth()}`;

      const existing =
        monthSegments[
          monthSegments.length - 1
        ];

      if (
        existing?.key === key
      ) {
        existing.dayCount += 1;
      } else {
        monthSegments.push({
          key,
          label:
            formatTimelineMonth(
              date,
            ),
          startIndex: index,
          dayCount: 1,
        });
      }
    },
  );

  const todayString =
    toDateString(
      new Date(),
    );

  const todayDate =
    parseProjectDate(
      todayString,
    );

  const todayOffset =
    differenceInDays(
      paddedTimelineStart,
      todayDate,
    );

  const showTodayLine =
    todayOffset >= 0 &&
    todayOffset <=
      timelineDays;

  const openTaskCount =
    projects.reduce(
      (
        total,
        project,
      ) =>
        total +
        getOpenTaskCount(
          project,
        ),
      0,
    );

  const activeTasks =
    activeProject?.tasks ??
    [];

  const linkedGoal =
    activeProject?.goalId
      ? goals.find(
          (goal) =>
            goal.id ===
            activeProject.goalId,
        )
      : undefined;

  const linkedDream =
    linkedGoal?.dreamId
      ? dreams.find(
          (dream) =>
            dream.id ===
            linkedGoal.dreamId,
        )
      : undefined;

  function changeTask(
    taskId: string,
    updates: Partial<Task>,
  ) {
    if (
      updates.title !==
      undefined
    ) {
      onUpdateTask(
        taskId,
        updates.title,
      );
    }

    if (
      updates.priority !==
      undefined
    ) {
      onUpdateTaskPriority(
        taskId,
        updates.priority,
      );
    }

    if (
      updates.energy !==
      undefined
    ) {
      onUpdateTaskEnergy(
        taskId,
        updates.energy,
      );
    }

    if (
      "dueDate" in
      updates
    ) {
      onUpdateTaskDueDate(
        taskId,
        updates.dueDate ??
          "",
      );
    }

    if (
      "durationMinutes" in
      updates
    ) {
      onUpdateTaskDuration(
        taskId,
        updates.durationMinutes,
      );
    }

    if (
      "maxSessionMinutes" in
      updates
    ) {
      onUpdateTaskMaxSession(
        taskId,
        updates.maxSessionMinutes,
      );
    }

    if (
      "scheduleContext" in
      updates
    ) {
      onUpdateTaskScheduleContext(
        taskId,
        updates.scheduleContext,
      );
    }

    if (
      "earliestStartTime" in
      updates
    ) {
      onUpdateTaskEarliestStartTime?.(
        taskId,
        updates.earliestStartTime,
      );
    }

    if (
      "latestEndTime" in
      updates
    ) {
      onUpdateTaskLatestEndTime?.(
        taskId,
        updates.latestEndTime,
      );
    }
  }

  function moveTaskToProject(
    taskId: string,
    destinationProjectId: string,
  ) {
    if (
      !activeProject ||
      destinationProjectId ===
        activeProject.id
    ) {
      return;
    }

    const taskToMove =
      activeProject.tasks.find(
        (task) =>
          task.id === taskId,
      );

    const destinationProject =
      projects.find(
        (project) =>
          project.id ===
          destinationProjectId,
      );

    if (
      !taskToMove ||
      !destinationProject
    ) {
      return;
    }

    const destinationOrder =
      destinationProject.tasks
        .length > 0
        ? Math.max(
            ...destinationProject.tasks.map(
              (task) =>
                task.order ??
                0,
            ),
          ) + 1
        : 1;

    const movedTask = {
      ...taskToMove,
      order:
        destinationOrder,
    };

    const updatedProjects =
      projects.map(
        (project) => {
          if (
            project.id ===
            activeProject.id
          ) {
            return {
              ...project,
              tasks:
                project.tasks.filter(
                  (task) =>
                    task.id !==
                    taskId,
                ),
            };
          }

          if (
            project.id ===
            destinationProjectId
          ) {
            return {
              ...project,
              tasks: [
                ...project.tasks,
                movedTask,
              ],
            };
          }

          return project;
        },
      );

    onReorderProjects(
      updatedProjects,
    );

    onChangeProject(
      destinationProjectId,
    );
  }

  function reorderProject(
  draggedId: string,
  targetId: string,
) {
  if (draggedId === targetId) {
    return;
  }

  const nextProjects = [...projects];

  const draggedIndex =
    nextProjects.findIndex(
      (project) =>
        project.id === draggedId,
    );

  const targetIndex =
    nextProjects.findIndex(
      (project) =>
        project.id === targetId,
    );

  if (
    draggedIndex === -1 ||
    targetIndex === -1
  ) {
    return;
  }

  const [movedProject] =
    nextProjects.splice(
      draggedIndex,
      1,
    );

  nextProjects.splice(
    targetIndex,
    0,
    movedProject,
  );

  onReorderProjects(
    nextProjects.map(
      (project, index) => ({
        ...project,
        order: index + 1,
      }),
    ),
  );
}

  function moveProjectToStatus(
    projectId: string,
    status: ProjectStatus,
  ) {
    const project =
      projects.find(
        (item) =>
          item.id ===
          projectId,
      );

    if (
      !project ||
      getProjectStatus(
        project,
      ) === status
    ) {
      return;
    }

    const updatedProjects =
      projects.map(
        (item) =>
          item.id ===
          projectId
            ? {
                ...item,
                status,
              }
            : item,
      );

    onReorderProjects(
      updatedProjects,
    );
  }

  function updateProjectDates(
    projectId: string,
    startDate?: string,
    targetDate?: string,
  ) {
    const updatedProjects =
      projects.map(
        (project) =>
          project.id ===
          projectId
            ? {
                ...project,
                startDate,
                targetDate,
              }
            : project,
      );

    onReorderProjects(
      updatedProjects,
    );
  }

  function openProject(projectId: string) {
    onChangeProject(projectId);
    setProjectCardOpen(true);
  }

  function beginTimelineInteraction(
    event: ReactPointerEvent,
    project: SortdList,
    mode: TimelineInteractionMode,
  ) {
    event.preventDefault();
    event.stopPropagation();

    const startDate =
      project.startDate ??
      project.targetDate;

    const targetDate =
      project.targetDate ??
      project.startDate;

    if (
      !startDate ||
      !targetDate
    ) {
      return;
    }

    event.currentTarget.setPointerCapture(
      event.pointerId,
    );

    suppressTimelineClick.current =
      false;

    setTimelineInteraction({
      projectId:
        project.id,

      mode,

      pointerStartX:
        event.clientX,

      originalStart:
        startDate,

      originalEnd:
        targetDate,

      previewStart:
        startDate,

      previewEnd:
        targetDate,
    });
  }

  function handleTimelinePointerMove(
    event: ReactPointerEvent,
  ) {
    if (
      !timelineInteraction
    ) {
      return;
    }

    const deltaPixels =
      event.clientX -
      timelineInteraction.pointerStartX;

    const deltaDays =
      Math.round(
        deltaPixels /
          TIMELINE_DAY_WIDTH,
      );

    if (
      deltaDays !== 0
    ) {
      suppressTimelineClick.current =
        true;
    }

    const originalStart =
      parseProjectDate(
        timelineInteraction.originalStart,
      );

    const originalEnd =
      parseProjectDate(
        timelineInteraction.originalEnd,
      );

    let nextStart =
      originalStart;

    let nextEnd =
      originalEnd;

    if (
      timelineInteraction.mode ===
      "move"
    ) {
      nextStart =
        addDays(
          originalStart,
          deltaDays,
        );

      nextEnd =
        addDays(
          originalEnd,
          deltaDays,
        );
    }

    if (
      timelineInteraction.mode ===
      "resize-start"
    ) {
      const proposedStart =
        addDays(
          originalStart,
          deltaDays,
        );

      nextStart =
        proposedStart >
        originalEnd
          ? originalEnd
          : proposedStart;
    }

    if (
      timelineInteraction.mode ===
      "resize-end"
    ) {
      const proposedEnd =
        addDays(
          originalEnd,
          deltaDays,
        );

      nextEnd =
        proposedEnd <
        originalStart
          ? originalStart
          : proposedEnd;
    }

    setTimelineInteraction(
      (current) =>
        current
          ? {
              ...current,

              previewStart:
                toDateString(
                  nextStart,
                ),

              previewEnd:
                toDateString(
                  nextEnd,
                ),
            }
          : null,
    );
  }

  function finishTimelineInteraction(
    event: ReactPointerEvent,
  ) {
    if (
      !timelineInteraction
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    updateProjectDates(
      timelineInteraction.projectId,
      timelineInteraction.previewStart,
      timelineInteraction.previewEnd,
    );

    setTimelineInteraction(
      null,
    );
  }

  function cancelTimelineInteraction() {
    setTimelineInteraction(
      null,
    );
  }

  return (
    <div className="min-w-0 rounded-3xl bg-white/90 p-5 shadow-xl backdrop-blur-md md:p-7">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
            Projects
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Everything you’re
            working on, in one
            place.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span>
              <span className="font-semibold text-slate-900">
                {
                  projects.length
                }
              </span>{" "}
              {projects.length ===
              1
                ? "project"
                : "projects"}
            </span>

            <span
              aria-hidden="true"
              className="text-slate-300"
            >
              ·
            </span>

            <span>
              <span className="font-semibold text-slate-900">
                {
                  openTaskCount
                }
              </span>{" "}
              open
            </span>
          </div>

          
          <div className="flex rounded-xl bg-slate-100 p-1">
            {/* List */}
            <button
              type="button"
              onClick={() =>
                setViewMode(
                  "list",
                )
              }
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                viewMode ===
                "list"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              List
            </button>
            {/* Board */}
            <button
              type="button"
              onClick={() =>
                setViewMode(
                  "board",
                )
              }
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                viewMode ===
                "board"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Board
            </button>
            {/* Timeline */}
            <button
              type="button"
              onClick={() =>
                setViewMode(
                  "timeline",
                )
              }
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                viewMode ===
                "timeline"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Timeline
            </button>
          </div>
        </div>
      </header>

      {viewMode ===
        "board" && (
        <div className="mb-6 overflow-x-auto pb-2">
          <div className="grid min-w-[1100px] grid-cols-5 gap-3">
            {PROJECT_COLUMNS.map(
              (
                column,
              ) => {
                const columnProjects =
                  projects.filter(
                    (
                      project,
                    ) =>
                      getProjectStatus(
                        project,
                      ) ===
                      column.status,
                  );

                return (
                  <section
                    key={
                      column.status
                    }
                    onDragOver={(
                      event,
                    ) => {
                      event.preventDefault();
                    }}
                    onDrop={(
                      event,
                    ) => {
                      event.preventDefault();

                      if (
                        draggedProjectId
                      ) {
                        moveProjectToStatus(
                          draggedProjectId,
                          column.status,
                        );
                      }

                      setDraggedProjectId(
                        null,
                      );
                    }}
                    className="min-h-[360px] rounded-2xl bg-slate-50 p-3"
                  >
                    <div className="mb-3 flex items-start justify-between gap-2 px-1">
                      <div>
                        <h2 className="text-sm font-semibold text-slate-900">
                          {
                            column.label
                          }
                        </h2>

                        <p className="mt-0.5 text-[11px] text-slate-400">
                          {
                            column.description
                          }
                        </p>
                      </div>

                      <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500 shadow-sm">
                        {
                          columnProjects.length
                        }
                      </span>
                    </div>

                    <div className="space-y-2">
                      {columnProjects.map(
                        (
                          project,
                        ) => {
                          const openTasks =
                            getOpenTaskCount(
                              project,
                            );

                          const completedTasks =
                            project.tasks.filter(
                              (
                                task,
                              ) =>
                                task.completed,
                            ).length;

                          const totalTasks =
                            project
                              .tasks
                              .length;

                          const progress =
                            totalTasks >
                            0
                              ? Math.round(
                                  (completedTasks /
                                    totalTasks) *
                                    100,
                                )
                              : 0;

                          return (
                            <article
                              key={
                                project.id
                              }
                              draggable
                              onDragStart={() =>
                                setDraggedProjectId(
                                  project.id,
                                )
                              }
                              onDragEnd={() =>
                                setDraggedProjectId(
                                  null,
                                )
                              }
                              onClick={() =>
                                openProject(
                                  project.id,
                                )
                              }
                              className={`cursor-pointer rounded-xl border bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md ${
                                draggedProjectId ===
                                project.id
                                  ? "opacity-40"
                                  : "border-slate-200"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="min-w-0 truncate text-sm font-semibold text-slate-900">
                                  {project.name ||
                                    "Untitled project"}
                                </h3>

                                {project.id ===
                                  activeProjectId && (
                                  <span
                                    className="mt-1 h-2 w-2 shrink-0 rounded-full bg-fuchsia-400"
                                    title="Current project"
                                  />
                                )}
                              </div>

                              {project.description && (
                                <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-slate-500">
                                  {
                                    project.description
                                  }
                                </p>
                              )}

                              {(project.startDate ||
                                project.targetDate) && (
                                <div className="mt-3 flex items-center gap-1 text-[11px] text-slate-500">
                                  <span>
                                    {formatProjectDate(
                                      project.startDate,
                                    ) ??
                                      "No start"}
                                  </span>

                                  <span className="text-slate-300">
                                    →
                                  </span>

                                  <span>
                                    {formatProjectDate(
                                      project.targetDate,
                                    ) ??
                                      "No target"}
                                  </span>
                                </div>
                              )}

                              {totalTasks >
                                0 && (
                                <div className="mt-3">
                                  <div className="mb-1.5 flex items-center justify-between text-[11px] text-slate-500">
                                    <span>
                                      {
                                        openTasks
                                      }{" "}
                                      {openTasks ===
                                      1
                                        ? "task"
                                        : "tasks"}{" "}
                                      left
                                    </span>

                                    <span>
                                      {
                                        progress
                                      }
                                      %
                                    </span>
                                  </div>

                                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                                    <div
                                      className="h-full rounded-full bg-slate-400 transition-all"
                                      style={{
                                        width: `${progress}%`,
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                            </article>
                          );
                        },
                      )}

                      {columnProjects.length ===
                        0 && (
                        <div className="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-xs text-slate-400">
                          Drop a
                          project
                          here
                        </div>
                      )}
                    </div>
                  </section>
                );
              },
            )}
          </div>
        </div>
      )}

      {viewMode ===
        "timeline" && (
        <div className="mb-6">
          {datedProjects.length >
          0 ? (
            <>
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Project
                    timeline
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Drag a bar
                    to move a
                    project. Drag
                    either edge
                    to change its
                    dates.
                  </p>
                </div>

                <span className="text-xs text-slate-400">
                  {
                    datedProjects.length
                  }{" "}
                  scheduled{" "}
                  {datedProjects.length ===
                  1
                    ? "project"
                    : "projects"}
                </span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50">
                <div
                  style={{
                    width:
                      220 +
                      timelineWidth,
                  }}
                >
                  {/* Calendar header */}

                  <div
                    className="grid border-b border-slate-200 bg-white"
                    style={{
                      gridTemplateColumns: `220px ${timelineWidth}px`,
                    }}
                  >
                    <div className="sticky left-0 z-30 flex items-end border-r border-slate-200 bg-white px-4 py-3">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Project
                      </span>
                    </div>

                    <div className="relative h-[72px] overflow-hidden">
                      {/* Month row */}

                      {monthSegments.map(
                        (
                          month,
                        ) => (
                          <div
                            key={
                              month.key
                            }
                            className="absolute top-0 flex h-8 items-center border-r border-slate-200 px-2 text-xs font-semibold text-slate-700"
                            style={{
                              left:
                                month.startIndex *
                                TIMELINE_DAY_WIDTH,

                              width:
                                month.dayCount *
                                TIMELINE_DAY_WIDTH,
                            }}
                          >
                            <span className="truncate">
                              {
                                month.label
                              }
                            </span>
                          </div>
                        ),
                      )}

                      {/* Week marker row */}

                      {weekMarkers.map(
                        ({
                          date,
                          index,
                        }) => (
                          <div
                            key={`${toDateString(
                              date,
                            )}-header`}
                            className="absolute bottom-0 h-10 border-l border-slate-200"
                            style={{
                              left:
                                index *
                                TIMELINE_DAY_WIDTH,
                            }}
                          >
                            <span className="absolute left-1 top-3 whitespace-nowrap text-[10px] text-slate-400">
                              {formatTimelineMarker(
                                date,
                              )}
                            </span>
                          </div>
                        ),
                      )}

                      {showTodayLine && (
                        <div
                          className="absolute bottom-0 top-0 z-20 w-px bg-fuchsia-400"
                          style={{
                            left:
                              todayOffset *
                              TIMELINE_DAY_WIDTH,
                          }}
                        >
                          <span className="absolute right-1 top-9 rounded bg-fuchsia-50 px-1.5 py-0.5 text-[9px] font-semibold text-fuchsia-700">
                            Today
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Project rows */}

                  {datedProjects.map(
                    (
                      project,
                    ) => {
                      const fallbackStart =
                        project.startDate ??
                        project.targetDate!;

                      const fallbackEnd =
                        project.targetDate ??
                        project.startDate!;

                      const interaction =
                        timelineInteraction?.projectId ===
                        project.id
                          ? timelineInteraction
                          : null;

                      const displayStart =
                        interaction?.previewStart ??
                        fallbackStart;

                      const displayEnd =
                        interaction?.previewEnd ??
                        fallbackEnd;

                      const projectStart =
                        parseProjectDate(
                          displayStart,
                        );

                      const projectEnd =
                        parseProjectDate(
                          displayEnd,
                        );

                      const startOffset =
                        differenceInDays(
                          paddedTimelineStart,
                          projectStart,
                        );

                      const durationDays =
                        Math.max(
                          1,
                          differenceInDays(
                            projectStart,
                            projectEnd,
                          ) + 1,
                        );

                      const barLeft =
                        startOffset *
                        TIMELINE_DAY_WIDTH;

                      const logicalWidth =
                        durationDays *
                        TIMELINE_DAY_WIDTH;

                      const barWidth =
                        Math.max(
                          logicalWidth,
                          26,
                        );

                      return (
                        <div
                          key={
                            project.id
                          }
                          className="grid border-b border-slate-200 last:border-b-0"
                          style={{
                            gridTemplateColumns: `220px ${timelineWidth}px`,
                          }}
                        >
                          <div
                            draggable
                            onDragStart={() => {
                              setDraggedProjectId(project.id);
                            }}
                            onDragOver={(event) => {
                              event.preventDefault();
                            }}
                            onDrop={(event) => {
                              event.preventDefault();

                              if (draggedProjectId) {
                                reorderProject(
                                  draggedProjectId,
                                  project.id,
                                );
                              }

                              setDraggedProjectId(null);
                            }}
                            onDragEnd={() => {
                              setDraggedProjectId(null);
                            }}
                            className="sticky left-0 z-40 flex min-w-0 items-center gap-2 border-r border-slate-200 bg-white px-4 py-4"
                          >
                            <span
                              className="shrink-0 cursor-grab select-none text-slate-300 active:cursor-grabbing"
                              title="Drag to reorder"
                            >
                              ⋮⋮
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                openProject(project.id)
                              }
                              className="min-w-0 flex-1 text-left"
                            >
                              <p className="truncate text-sm font-medium text-slate-900">
                                {project.name ||
                                  "Untitled project"}
                              </p>

                              <div className="mt-1 flex items-center gap-2">
                                <span
                                  className={`h-2 w-2 rounded-full ${getProjectStatusColour(
                                    project,
                                  )}`}
                                />

                                <p className="text-[11px] text-slate-400">
                                  {getProjectStatusLabel(
                                    project.status,
                                  )}
                                </p>
                              </div>
                            </button>
                          </div>

                          <div className="relative h-[76px] overflow-hidden bg-white/50">
                            {/* Weekly grid */}

                            {weekMarkers.map(
                              ({
                                date,
                                index,
                              }) => (
                                <div
                                  key={`${toDateString(
                                    date,
                                  )}-${project.id}`}
                                  className="absolute inset-y-0 border-l border-slate-100"
                                  style={{
                                    left:
                                      index *
                                      TIMELINE_DAY_WIDTH,
                                  }}
                                />
                              ),
                            )}

                            {/* Today */}

                            {showTodayLine && (
                              <div
                                className="absolute inset-y-0 z-10 w-px bg-fuchsia-300"
                                style={{
                                  left:
                                    todayOffset *
                                    TIMELINE_DAY_WIDTH,
                                }}
                              />
                            )}

                            {/* Project bar */}

                            <div
                              role="button"
                              tabIndex={
                                0
                              }
                              aria-label={`Open ${project.name}`}
                              onKeyDown={(
                                event,
                              ) => {
                                if (
                                  event.key ===
                                    "Enter" ||
                                  event.key ===
                                    " "
                                ) {
                                  event.preventDefault();

                                  openProject(
                                    project.id,
                                  );
                                }
                              }}
                              onClick={() => {
                                if (
                                  suppressTimelineClick.current
                                ) {
                                  suppressTimelineClick.current =
                                    false;

                                  return;
                                }

                                openProject(
                                  project.id,
                                );
                              }}
                              onPointerDown={(
                                event,
                              ) =>
                                beginTimelineInteraction(
                                  event,
                                  project,
                                  "move",
                                )
                              }
                              onPointerMove={
                                handleTimelinePointerMove
                              }
                              onPointerUp={
                                finishTimelineInteraction
                              }
                              onPointerCancel={
                                cancelTimelineInteraction
                              }
                              className={`absolute top-1/2 z-10 flex h-[48px] -translate-y-1/2 touch-none select-none items-center overflow-hidden rounded-xl bg-slate-700 text-white shadow-sm transition ${
                                interaction?.mode ===
                                "move"
                                  ? "cursor-grabbing shadow-md"
                                  : "cursor-grab hover:bg-slate-800"
                              }`}
                              style={{
                                left:
                                  barLeft,

                                width:
                                  barWidth,
                              }}
                            >
                              {/* Left resize handle */}

                              <span
                                role="presentation"
                                onPointerDown={(
                                  event,
                                ) =>
                                  beginTimelineInteraction(
                                    event,
                                    project,
                                    "resize-start",
                                  )
                                }
                                onPointerMove={
                                  handleTimelinePointerMove
                                }
                                onPointerUp={
                                  finishTimelineInteraction
                                }
                                onPointerCancel={
                                  cancelTimelineInteraction
                                }
                                className="flex h-full w-3 shrink-0 cursor-ew-resize touch-none items-center justify-center bg-white/10 hover:bg-white/20"
                              >
                                <span className="h-5 w-px rounded-full bg-white/60" />
                              </span>

                              <div className="min-w-0 flex-1 px-2">
                                <p className="truncate text-xs font-semibold">
                                  {
                                    project.name
                                  }
                                </p>

                                <p className="truncate text-[10px] text-slate-200">
                                  {formatProjectDate(
                                    displayStart,
                                  )}{" "}
                                  →{" "}
                                  {formatProjectDate(
                                    displayEnd,
                                  )}
                                </p>
                              </div>

                              {/* Right resize handle */}

                              <span
                                role="presentation"
                                onPointerDown={(
                                  event,
                                ) =>
                                  beginTimelineInteraction(
                                    event,
                                    project,
                                    "resize-end",
                                  )
                                }
                                onPointerMove={
                                  handleTimelinePointerMove
                                }
                                onPointerUp={
                                  finishTimelineInteraction
                                }
                                onPointerCancel={
                                  cancelTimelineInteraction
                                }
                                className="flex h-full w-3 shrink-0 cursor-ew-resize touch-none items-center justify-center bg-white/10 hover:bg-white/20"
                              >
                                <span className="h-5 w-px rounded-full bg-white/60" />
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 px-6 py-12 text-center">
              <p className="font-medium text-slate-700">
                No projects
                have dates yet.
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Add a start
                or target date
                to see projects
                here.
              </p>
            </div>
          )}

          {projects.some(
            (project) =>
              !project.startDate &&
              !project.targetDate,
          ) && (
            <div className="mt-5">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                Not scheduled
              </p>

              <div className="flex flex-wrap gap-2">
                {projects
                  .filter(
                    (
                      project,
                    ) =>
                      !project.startDate &&
                      !project.targetDate,
                  )
                  .map(
                    (
                      project,
                    ) => (
                      <button
                        key={
                          project.id
                        }
                        type="button"
                        onClick={() =>
                          openProject(
                            project.id,
                          )
                        }
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                      >
                        {
                          project.name
                        }
                      </button>
                    ),
                  )}
              </div>
            </div>
          )}
        </div>
      )}

      {viewMode ===
        "list" && (
        <>
          <CollectionSwitcher
            items={
              projects
            }
            activeItemId={
              activeProjectId
            }
            label="Current project"
            placeholder="Select a project"
            itemPluralLabel="Projects"
            createLabel="+ New"
            deleteLabel="Delete project"
            onChangeItem={
              onChangeProject
            }
            onCreateItem={
              onCreateProject
            }
            onDeleteItem={() => {
              setDeleteProjectOpen(true);
            }}
            onRenameItem={
              onRenameProject
            }
            onReorderItems={
              onReorderProjects
            }
            getCount={
              getOpenTaskCount
            }
            getStatusColour={
              getProjectStatusColour
            }
            getStatusLabel={(
              project,
            ) =>
              project.status ??
              "active"
            }
            canDelete={
              projects.length >
              1
            }
          />

          {activeProject && (
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
              {linkedDream && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      onOpenDream?.(
                        linkedDream.id,
                      )
                    }
                    className="font-medium text-fuchsia-700 transition hover:text-fuchsia-900"
                  >
                    ✦{" "}
                    {
                      linkedDream.title
                    }
                  </button>

                  <span className="text-slate-300">
                    →
                  </span>
                </>
              )}

              {linkedGoal ? (
                <button
                  type="button"
                  onClick={() =>
                    onOpenGoal?.(
                      linkedGoal.id,
                    )
                  }
                  className="font-medium text-slate-700 transition hover:text-slate-950"
                >
                  {
                    linkedGoal.title
                  }
                </button>
              ) : (
                <span className="text-slate-400">
                  No goal
                  attached
                </span>
              )}

              <span className="text-slate-300">
                →
              </span>

              <span className="font-medium text-slate-900">
                {
                  activeProject.name
                }
              </span>
            </div>
          )}

          {activeProject ? (
            <>
              <details className="group mt-5 border-b border-slate-100 pb-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-1 py-2 text-sm text-slate-600 transition hover:text-slate-900 [&::-webkit-details-marker]:hidden">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">
                      Project
                      settings
                    </span>

                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        activeProject.status ===
                        "backlog"
                          ? "bg-slate-100 text-slate-600"
                          : activeProject.status ===
                              "planned"
                            ? "bg-sky-50 text-sky-700"
                            : activeProject.status ===
                                "paused"
                              ? "bg-amber-50 text-amber-700"
                              : activeProject.status ===
                                  "completed"
                                ? "bg-slate-200 text-slate-600"
                                : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {getProjectStatusLabel(
                        activeProject.status,
                      )}
                    </span>
                  </span>

                  <span className="text-slate-400 transition group-open:rotate-180">
                    ▾
                  </span>
                </summary>

                <div className="pt-4">
                  <label className="mb-4 flex flex-col gap-1.5 text-xs font-medium text-slate-600">
                    Project name

                    <input
                      value={
                        activeProject.name
                      }
                      onChange={(
                        event,
                      ) =>
                        onChangeProjectName(
                          event
                            .target
                            .value,
                        )
                      }
                      placeholder="Project name"
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#cd6ce7] focus:ring-2 focus:ring-[#cd6ce7]/20"
                    />
                  </label>

                  <label className="mb-4 flex flex-col gap-1.5 text-xs font-medium text-slate-600">
                    Supports goal

                    <select
                      value={
                        activeProject.goalId ??
                        ""
                      }
                      onChange={(
                        event,
                      ) =>
                        onChangeProjectGoal(
                          event
                            .target
                            .value ||
                            undefined,
                        )
                      }
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#cd6ce7] focus:ring-2 focus:ring-[#cd6ce7]/20"
                    >
                      <option value="">
                        No linked
                        goal
                      </option>

                      {goals
                        .filter(
                          (
                            goal,
                          ) =>
                            goal.status !==
                            "completed",
                        )
                        .map(
                          (
                            goal,
                          ) => (
                            <option
                              key={
                                goal.id
                              }
                              value={
                                goal.id
                              }
                            >
                              {
                                goal.title
                              }
                            </option>
                          ),
                        )}
                    </select>
                  </label>

                  <ProjectDetails
                    description={
                      activeProject.description ??
                      ""
                    }
                    status={
                      activeProject.status ??
                      "active"
                    }
                    startDate={
                      activeProject.startDate
                    }
                    targetDate={
                      activeProject.targetDate
                    }
                    scheduleContext={
                      activeProject.scheduleContext ??
                      "personal"
                    }
                    earliestStartTime={
                      activeProject.earliestStartTime
                    }
                    latestEndTime={
                      activeProject.latestEndTime
                    }
                    onChangeDescription={
                      onChangeProjectDescription
                    }
                    onChangeStatus={
                      onChangeProjectStatus
                    }
                    onChangeStartDate={
                      onChangeProjectStartDate
                    }
                    onChangeTargetDate={
                      onChangeProjectTargetDate
                    }
                    onChangeScheduleContext={
                      onChangeProjectScheduleContext
                    }
                    onChangeEarliestStartTime={
                      onChangeProjectEarliestStartTime
                    }
                    onChangeLatestEndTime={
                      onChangeProjectLatestEndTime
                    }
                  />
                </div>
              </details>

              <section className="mt-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="text-base font-semibold text-slate-900">
                    Tasks
                  </h2>

                  <span className="text-xs text-slate-500">
                    {
                      visibleTasks.length
                    }{" "}
                    {visibleTasks.length ===
                    1
                      ? "item"
                      : "items"}
                  </span>
                </div>

                <ControlPanel
                  onAddTask={
                    onAddTask
                  }
                  hideCompleted={
                    hideCompleted
                  }
                  onToggleHideCompleted={
                    onToggleHideCompleted
                  }
                  onArchiveCompleted={
                    onArchiveCompleted
                  }
                  hasCompleted={activeTasks.some(
                    (
                      task,
                    ) =>
                      task.completed,
                  )}
                  taskFilter={
                    taskFilter
                  }
                  onChangeTaskFilter={
                    onChangeTaskFilter
                  }
                />

                <div className="max-h-[52vh] overflow-y-auto overscroll-contain pr-1">
                  <TaskList
                    tasks={
                      visibleTasks
                    }
                    currentProjectId={
                      activeProject.id
                    }
                    projectOptions={projects.map(
                      (
                        project,
                      ) => ({
                        id:
                          project.id,

                        name:
                          project.name ||
                          "Untitled project",
                      }),
                    )}
                    onAddTask={
                      onAddTask
                    }
                    onChangeTask={
                      changeTask
                    }
                    onToggleTask={
                      onToggleTask
                    }
                    onDeleteTask={
                      onDeleteTask
                    }
                    onReorderTasks={
                      onReorderTasks
                    }
                    onMoveTask={
                      moveTaskToProject
                    }
                  />
                </div>
              </section>

              {(activeProject
                .archivedTasks
                ?.length ??
                0) >
                0 && (
                <details className="group mt-5 border-t border-slate-100 pt-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between text-sm text-slate-500 transition hover:text-slate-800 [&::-webkit-details-marker]:hidden">
                    <span>
                      Archived
                      tasks{" "}
                      <span className="text-slate-400">
                        (
                        {
                          activeProject
                            .archivedTasks
                            .length
                        }
                        )
                      </span>
                    </span>

                    <span className="transition group-open:rotate-180">
                      ▾
                    </span>
                  </summary>

                  <div className="mt-3">
                    <ArchivedTasks
                      tasks={
                        activeProject.archivedTasks ??
                        []
                      }
                      onRestoreTask={
                        onRestoreTask
                      }
                    />
                  </div>
                </details>
              )}
            </>
          ) : (
            <div className="mt-8 px-5 py-10 text-center">
              <p className="font-medium text-slate-700">
                No project
                selected.
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Create a
                project to get
                started.
              </p>
            </div>
          )}
        </>
      )}
      {projectCardOpen && activeProject && (
  <div
    className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-sm"
    onMouseDown={(event) => {
      if (event.target === event.currentTarget) {
        setProjectCardOpen(false);
      }
    }}
  >
    <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Project
          </p>

          <input
            value={activeProject.name}
            onChange={(event) =>
              onChangeProjectName(event.target.value)
            }
            className="mt-1 w-full bg-transparent text-xl font-semibold text-slate-950 outline-none"
          />

          <div className="mt-2 flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${getProjectStatusColour(
                activeProject,
              )}`}
            />

            <span className="text-sm text-slate-500">
              {getProjectStatusLabel(activeProject.status)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setProjectCardOpen(false)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
          aria-label="Close project"
        >
          ✕
        </button>
      </div>

      <ProjectDetails
        description={activeProject.description ?? ""}
        status={activeProject.status ?? "active"}
        startDate={activeProject.startDate}
        targetDate={activeProject.targetDate}
        scheduleContext={
          activeProject.scheduleContext ?? "personal"
        }
        earliestStartTime={
          activeProject.earliestStartTime
        }
        latestEndTime={
          activeProject.latestEndTime
        }
        onChangeDescription={
          onChangeProjectDescription
        }
        onChangeStatus={
          onChangeProjectStatus
        }
        onChangeStartDate={
          onChangeProjectStartDate
        }
        onChangeTargetDate={
          onChangeProjectTargetDate
        }
        onChangeScheduleContext={
          onChangeProjectScheduleContext
        }
        onChangeEarliestStartTime={
          onChangeProjectEarliestStartTime
        }
        onChangeLatestEndTime={
          onChangeProjectLatestEndTime
        }
      />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <span className="text-sm text-slate-500">
          {getOpenTaskCount(activeProject)} open{" "}
          {getOpenTaskCount(activeProject) === 1
            ? "task"
            : "tasks"}
        </span>

        <button
          type="button"
          onClick={() => {
            setProjectCardOpen(false);
            setViewMode("list");
          }}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          View project tasks →
        </button>
      </div>
    </div>
  </div>
)}
<ConfirmDialog
  open={deleteProjectOpen}
  title="Delete project?"
  description={
    activeProject
      ? `Delete “${activeProject.name}” and its tasks? This can't be undone.`
      : "Delete this project? This can't be undone."
  }
  confirmLabel="Delete project"
  onCancel={() => {
    setDeleteProjectOpen(false);
  }}
  onConfirm={() => {
    setDeleteProjectOpen(false);
    setProjectCardOpen(false);
    onDeleteProject();
  }}
/>
    </div>
  );
}
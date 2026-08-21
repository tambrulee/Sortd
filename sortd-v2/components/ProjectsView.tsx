"use client";

import ArchivedTasks from "@/components/ArchivedTasks";
import ControlPanel from "@/components/ControlPanel";
import ListSwitcher from "@/components/ListSwitcher";
import ProjectDetails from "@/components/ProjectDetails";
import TaskList from "@/components/TaskList";

import {
  ProjectStatus,
  ScheduleContext,
  SchedulePeriod,
  SortdList,
  Task,
} from "@/lib/types";

type TaskFilter =
  | "all"
  | "high"
  | "low-energy";

type ProjectsViewProps = {
  projects: SortdList[];

  activeProject:
    | SortdList
    | undefined;

  activeProjectId: string;

  visibleTasks: Task[];

  hideCompleted: boolean;

  taskFilter: TaskFilter;

  onChangeProject: (
    projectId: string
  ) => void;

  onCreateProject: () => void;

  onDeleteProject: () => void;

  onRenameProject: (
    projectId: string,
    name: string
  ) => void;

  onReorderProjects: (
    projects: SortdList[]
  ) => void;

  onChangeProjectName: (
    name: string
  ) => void;

  onChangeProjectDescription: (
    description: string
  ) => void;

  onChangeProjectStatus: (
    status: ProjectStatus
  ) => void;

  onChangeProjectScheduleContext: (
    context: ScheduleContext
  ) => void;

  onChangeProjectPreferredPeriod: (
    period: SchedulePeriod
  ) => void;

  onAddTask: () => void;

  onToggleHideCompleted: () => void;

  onArchiveCompleted: () => void;

  onChangeTaskFilter: (
    filter: TaskFilter
  ) => void;

  onUpdateTask: (
    id: string,
    title: string
  ) => void;

  onUpdateTaskPriority: (
    id: string,
    priority:
      | "low"
      | "medium"
      | "high"
  ) => void;

  onUpdateTaskEnergy: (
    id: string,
    energy:
      | "low"
      | "medium"
      | "high"
  ) => void;

  onUpdateTaskDueDate: (
    id: string,
    dueDate: string
  ) => void;

  onUpdateTaskDuration: (
    id: string,
    durationMinutes?: number
  ) => void;

  onUpdateTaskMaxSession: (
    id: string,
    maxSessionMinutes?: number
  ) => void;

  onUpdateTaskScheduleContext: (
    id: string,
    context?: ScheduleContext
  ) => void;

  onUpdateTaskPreferredPeriod: (
    id: string,
    period?: SchedulePeriod
  ) => void;

  onToggleTask: (
    id: string
  ) => void;

  onDeleteTask: (
    id: string
  ) => void;

  onReorderTasks: (
    tasks: Task[]
  ) => void;

  onRestoreTask: (
    taskId: string
  ) => void;
};

export default function ProjectsView({
  projects,

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
  onChangeProjectScheduleContext,
  onChangeProjectPreferredPeriod,

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
  onUpdateTaskPreferredPeriod,

  onToggleTask,
  onDeleteTask,
  onReorderTasks,
  onRestoreTask,
}: ProjectsViewProps) {
  const openTaskCount = projects.reduce(
    (total, project) =>
      total +
      project.tasks.filter(
        (task) => !task.completed
      ).length,

    0
  );

  const activeTasks =
    activeProject?.tasks ?? [];

  return (
  <div className="min-w-0 rounded-3xl bg-white/90 p-5 shadow-xl backdrop-blur-md md:p-7">
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
          Projects
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Everything you’re working on,
          in one place.
        </p>
      </div>

      <div className="flex items-center gap-3 pt-1 text-sm text-slate-500">
        <span>
          <span className="font-semibold text-slate-900">
            {projects.length}
          </span>{" "}
          {projects.length === 1
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
            {openTaskCount}
          </span>{" "}
          open
        </span>
      </div>
    </header>

    <ListSwitcher
      lists={projects}
      activeListId={
        activeProjectId
      }
      onChangeList={
        onChangeProject
      }
      onCreateList={
        onCreateProject
      }
      onDeleteList={
        onDeleteProject
      }
      onRenameList={
        onRenameProject
      }
      onReorderLists={
        onReorderProjects
      }
    />

    {activeProject ? (
      <>
        <details className="group mt-5 border-b border-slate-100 pb-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-1 py-2 text-sm text-slate-600 transition hover:text-slate-900 [&::-webkit-details-marker]:hidden">
            <span className="flex flex-wrap items-center gap-2">
              <span className="font-medium">
                Project settings
              </span>

              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  activeProject.status ===
                  "paused"
                    ? "bg-amber-50 text-amber-700"
                    : activeProject.status ===
                        "completed"
                      ? "bg-slate-100 text-slate-600"
                      : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {activeProject.status ??
                  "active"}
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
                onChange={(event) =>
                  onChangeProjectName(
                    event.target.value
                  )
                }
                placeholder="Project name"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#cd6ce7] focus:ring-2 focus:ring-[#cd6ce7]/20"
              />
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
              scheduleContext={
                activeProject.scheduleContext ??
                "personal"
              }
              preferredPeriod={
                activeProject.preferredPeriod ??
                "any"
              }
              onChangeDescription={
                onChangeProjectDescription
              }
              onChangeStatus={
                onChangeProjectStatus
              }
              onChangeScheduleContext={
                onChangeProjectScheduleContext
              }
              onChangePreferredPeriod={
                onChangeProjectPreferredPeriod
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
              {visibleTasks.length === 1
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
            hasCompleted={
              activeTasks.some(
                (task) =>
                  task.completed
              )
            }
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
              onAddTask={
                onAddTask
              }
              onUpdateTask={
                onUpdateTask
              }
              onUpdateTaskPriority={
                onUpdateTaskPriority
              }
              onUpdateTaskEnergy={
                onUpdateTaskEnergy
              }
              onUpdateTaskDueDate={
                onUpdateTaskDueDate
              }
              onUpdateTaskDuration={
                onUpdateTaskDuration
              }
              onUpdateTaskMaxSession={
                onUpdateTaskMaxSession
              }
              onUpdateTaskScheduleContext={
                onUpdateTaskScheduleContext
              }
              onUpdateTaskPreferredPeriod={
                onUpdateTaskPreferredPeriod
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
            />
          </div>
        </section>

        {(activeProject.archivedTasks
          ?.length ?? 0) > 0 && (
          <details className="group mt-5 border-t border-slate-100 pt-4">
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm text-slate-500 transition hover:text-slate-800 [&::-webkit-details-marker]:hidden">
              <span>
                Archived tasks{" "}
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
          No project selected.
        </p>

        <p className="mt-1 text-sm text-slate-500">
          Create a project to get
          started.
        </p>
      </div>
    )}
  </div>
);
}
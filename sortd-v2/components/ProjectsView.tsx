"use client";

import ArchivedTasks from "@/components/ArchivedTasks";
import ControlPanel from "@/components/ControlPanel";
import ListSwitcher from "@/components/ListSwitcher";
import ListTitle from "@/components/ListTitle";
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
    <div className="rounded-3xl bg-white/85 p-5 shadow-xl backdrop-blur-md md:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#9d3db7]">
            Projects
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-950">
            Your projects
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Keep everything organised,
            one project at a time.
          </p>
        </div>

        <div className="flex gap-3">
          <div className="rounded-xl bg-[#f3eeee] px-4 py-3 text-center">
            <p className="text-xl font-bold text-slate-950">
              {projects.length}
            </p>

            <p className="text-xs text-slate-500">
              {projects.length === 1
                ? "Project"
                : "Projects"}
            </p>
          </div>

          <div className="rounded-xl bg-[#f3eeee] px-4 py-3 text-center">
            <p className="text-xl font-bold text-slate-950">
              {openTaskCount}
            </p>

            <p className="text-xs text-slate-500">
              Open tasks
            </p>
          </div>
        </div>
      </div>

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
        <div className="mt-7 border-t border-slate-200 pt-6">
          <ListTitle
            listName={
              activeProject.name
            }
            onChangeListName={
              onChangeProjectName
            }
          />

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
      ) : (
        <div className="mt-7 rounded-2xl bg-slate-50 px-5 py-10 text-center">
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
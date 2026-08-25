"use client";

import ArchivedTasks from "@/components/ArchivedTasks";
import CollectionSwitcher from "@/components/CollectionSwitcher";
import ControlPanel from "@/components/ControlPanel";
import ProjectDetails from "@/components/ProjectDetails";
import TaskList from "@/components/TaskList";

import {
  Dream,
  Goal,
  ProjectStatus,
  ScheduleContext,
  SortdList,
  Task,
} from "@/lib/types";

type TaskFilter = "all" | "high" | "low-energy";

type ProjectsViewProps = {
  projects: SortdList[];
  goals: Goal[];
  dreams: Dream[];

  onOpenGoal?: (goalId: string) => void;

  onOpenDream?: (dreamId: string) => void;

  activeProject: SortdList | undefined;

  activeProjectId: string;
  visibleTasks: Task[];
  hideCompleted: boolean;
  taskFilter: TaskFilter;

  onCreateProject: () => void;
  onDeleteProject: () => void;

  onRenameProject: (projectId: string, name: string) => void;

  onReorderProjects: (projects: SortdList[]) => void;

  onChangeProjectName: (name: string) => void;

  onChangeProjectDescription: (description: string) => void;

  onChangeProjectStatus: (status: ProjectStatus) => void;

  onChangeProjectScheduleContext: (context: ScheduleContext) => void;

  onChangeProjectEarliestStartTime: (earliestStartTime?: string) => void;

  onChangeProjectLatestEndTime: (latestEndTime?: string) => void;

  onChangeProjectGoal: (goalId?: string) => void;

  onChangeProject: (projectId: string) => void;

  onAddTask: () => void;
  onToggleHideCompleted: () => void;
  onArchiveCompleted: () => void;

  onChangeTaskFilter: (filter: TaskFilter) => void;

  onUpdateTask: (id: string, title: string) => void;

  onUpdateTaskPriority: (
    id: string,
    priority: "low" | "medium" | "high",
  ) => void;

  onUpdateTaskEnergy: (id: string, energy: "low" | "medium" | "high") => void;

  onUpdateTaskDueDate: (id: string, dueDate: string) => void;

  onUpdateTaskDuration: (id: string, durationMinutes?: number) => void;

  onUpdateTaskMaxSession: (id: string, maxSessionMinutes?: number) => void;

  onUpdateTaskScheduleContext: (id: string, context?: ScheduleContext) => void;

  onUpdateTaskEarliestStartTime?: (
    id: string,
    earliestStartTime?: string,
  ) => void;

  onUpdateTaskLatestEndTime?: (id: string, latestEndTime?: string) => void;

  onToggleTask: (id: string) => void;

  onDeleteTask: (id: string) => void;

  onReorderTasks: (tasks: Task[]) => void;

  onRestoreTask: (taskId: string) => void;
};

function getProjectStatusColour(project: SortdList) {
  switch (project.status) {
    case "paused":
      return "bg-amber-400";

    case "completed":
      return "bg-slate-400";

    default:
      return "bg-emerald-400";
  }
}

function getOpenTaskCount(project: SortdList) {
  return project.tasks.filter((task) => !task.completed).length;
}

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
  const openTaskCount = projects.reduce(
    (total, project) => total + getOpenTaskCount(project),
    0,
  );

  const activeTasks = activeProject?.tasks ?? [];

  const linkedGoal = activeProject?.goalId
    ? goals.find((goal) => goal.id === activeProject.goalId)
    : undefined;

  const linkedDream = linkedGoal?.dreamId
    ? dreams.find((dream) => dream.id === linkedGoal.dreamId)
    : undefined;

  function changeTask(taskId: string, updates: Partial<Task>) {
    if (updates.title !== undefined) {
      onUpdateTask(taskId, updates.title);
    }

    if (updates.priority !== undefined) {
      onUpdateTaskPriority(taskId, updates.priority);
    }

    if (updates.energy !== undefined) {
      onUpdateTaskEnergy(taskId, updates.energy);
    }

    if ("dueDate" in updates) {
      onUpdateTaskDueDate(taskId, updates.dueDate ?? "");
    }

    if ("durationMinutes" in updates) {
      onUpdateTaskDuration(taskId, updates.durationMinutes);
    }

    if ("maxSessionMinutes" in updates) {
      onUpdateTaskMaxSession(taskId, updates.maxSessionMinutes);
    }

    if ("scheduleContext" in updates) {
      onUpdateTaskScheduleContext(taskId, updates.scheduleContext);
    }

    if ("earliestStartTime" in updates) {
      onUpdateTaskEarliestStartTime?.(taskId, updates.earliestStartTime);
    }

    if ("latestEndTime" in updates) {
      onUpdateTaskLatestEndTime?.(taskId, updates.latestEndTime);
    }
  }

  function moveTaskToProject(taskId: string, destinationProjectId: string) {
    if (!activeProject || destinationProjectId === activeProject.id) {
      return;
    }

    const taskToMove = activeProject.tasks.find((task) => task.id === taskId);

    const destinationProject = projects.find(
      (project) => project.id === destinationProjectId,
    );

    if (!taskToMove || !destinationProject) {
      return;
    }

    const destinationOrder =
      destinationProject.tasks.length > 0
        ? Math.max(...destinationProject.tasks.map((task) => task.order ?? 0)) +
          1
        : 1;

    const movedTask = {
      ...taskToMove,
      order: destinationOrder,
    };

    const updatedProjects = projects.map((project) => {
      if (project.id === activeProject.id) {
        return {
          ...project,
          tasks: project.tasks.filter((task) => task.id !== taskId),
        };
      }

      if (project.id === destinationProjectId) {
        return {
          ...project,
          tasks: [...project.tasks, movedTask],
        };
      }

      return project;
    });

    onReorderProjects(updatedProjects);

    onChangeProject(destinationProjectId);
  }

  return (
    <div className="min-w-0 rounded-3xl bg-white/90 p-5 shadow-xl backdrop-blur-md md:p-7">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
            Projects
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Everything you’re working on, in one place.
          </p>
        </div>

        <div className="flex items-center gap-3 pt-1 text-sm text-slate-500">
          <span>
            <span className="font-semibold text-slate-900">
              {projects.length}
            </span>{" "}
            {projects.length === 1 ? "project" : "projects"}
          </span>

          <span aria-hidden="true" className="text-slate-300">
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

      <CollectionSwitcher
        items={projects}
        activeItemId={activeProjectId}
        label="Current project"
        placeholder="Select a project"
        itemPluralLabel="Projects"
        createLabel="+ New"
        deleteLabel="Delete project"
        onChangeItem={onChangeProject}
        onCreateItem={onCreateProject}
        onDeleteItem={onDeleteProject}
        onRenameItem={onRenameProject}
        onReorderItems={onReorderProjects}
        getCount={getOpenTaskCount}
        getStatusColour={getProjectStatusColour}
        getStatusLabel={(project) => project.status ?? "active"}
        canDelete={projects.length > 1}
      />

      {activeProject && (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          {linkedDream && (
            <>
              <button
                type="button"
                onClick={() => onOpenDream?.(linkedDream.id)}
                className="font-medium text-fuchsia-700 transition hover:text-fuchsia-900"
              >
                ✦ {linkedDream.title}
              </button>

              <span className="text-slate-300">→</span>
            </>
          )}

          {linkedGoal ? (
            <button
              type="button"
              onClick={() => onOpenGoal?.(linkedGoal.id)}
              className="font-medium text-slate-700 transition hover:text-slate-950"
            >
              {linkedGoal.title}
            </button>
          ) : (
            <span className="text-slate-400">No goal attached</span>
          )}

          <span className="text-slate-300">→</span>

          <span className="font-medium text-slate-900">
            {activeProject.name}
          </span>
        </div>
      )}

      {activeProject ? (
        <>
          <details className="group mt-5 border-b border-slate-100 pb-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-1 py-2 text-sm text-slate-600 transition hover:text-slate-900 [&::-webkit-details-marker]:hidden">
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-medium">Project settings</span>

                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    activeProject.status === "paused"
                      ? "bg-amber-50 text-amber-700"
                      : activeProject.status === "completed"
                        ? "bg-slate-100 text-slate-600"
                        : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {activeProject.status ?? "active"}
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
                  value={activeProject.name}
                  onChange={(event) => onChangeProjectName(event.target.value)}
                  placeholder="Project name"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#cd6ce7] focus:ring-2 focus:ring-[#cd6ce7]/20"
                />
              </label>

              <label className="mb-4 flex flex-col gap-1.5 text-xs font-medium text-slate-600">
                Supports goal
                <select
                  value={activeProject.goalId ?? ""}
                  onChange={(event) =>
                    onChangeProjectGoal(event.target.value || undefined)
                  }
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#cd6ce7] focus:ring-2 focus:ring-[#cd6ce7]/20"
                >
                  <option value="">No linked goal</option>

                  {goals
                    .filter((goal) => goal.status !== "completed")
                    .map((goal) => (
                      <option key={goal.id} value={goal.id}>
                        {goal.title}
                      </option>
                    ))}
                </select>
              </label>

              <ProjectDetails
                description={activeProject.description ?? ""}
                status={activeProject.status ?? "active"}
                scheduleContext={activeProject.scheduleContext ?? "personal"}
                earliestStartTime={activeProject.earliestStartTime}
                latestEndTime={activeProject.latestEndTime}
                onChangeDescription={onChangeProjectDescription}
                onChangeStatus={onChangeProjectStatus}
                onChangeScheduleContext={onChangeProjectScheduleContext}
                onChangeEarliestStartTime={onChangeProjectEarliestStartTime}
                onChangeLatestEndTime={onChangeProjectLatestEndTime}
              />
            </div>
          </details>

          <section className="mt-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-slate-900">Tasks</h2>

              <span className="text-xs text-slate-500">
                {visibleTasks.length}{" "}
                {visibleTasks.length === 1 ? "item" : "items"}
              </span>
            </div>

            <ControlPanel
              onAddTask={onAddTask}
              hideCompleted={hideCompleted}
              onToggleHideCompleted={onToggleHideCompleted}
              onArchiveCompleted={onArchiveCompleted}
              hasCompleted={activeTasks.some((task) => task.completed)}
              taskFilter={taskFilter}
              onChangeTaskFilter={onChangeTaskFilter}
            />

            <div className="max-h-[52vh] overflow-y-auto overscroll-contain pr-1">
              <TaskList
                tasks={visibleTasks}
                currentProjectId={activeProject.id}
                projectOptions={projects.map((project) => ({
                  id: project.id,
                  name: project.name || "Untitled project",
                }))}
                onAddTask={onAddTask}
                onChangeTask={changeTask}
                onToggleTask={onToggleTask}
                onDeleteTask={onDeleteTask}
                onReorderTasks={onReorderTasks}
                onMoveTask={moveTaskToProject}
              />
            </div>
          </section>

          {(activeProject.archivedTasks?.length ?? 0) > 0 && (
            <details className="group mt-5 border-t border-slate-100 pt-4">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm text-slate-500 transition hover:text-slate-800 [&::-webkit-details-marker]:hidden">
                <span>
                  Archived tasks{" "}
                  <span className="text-slate-400">
                    ({activeProject.archivedTasks.length})
                  </span>
                </span>

                <span className="transition group-open:rotate-180">▾</span>
              </summary>

              <div className="mt-3">
                <ArchivedTasks
                  tasks={activeProject.archivedTasks ?? []}
                  onRestoreTask={onRestoreTask}
                />
              </div>
            </details>
          )}
        </>
      ) : (
        <div className="mt-8 px-5 py-10 text-center">
          <p className="font-medium text-slate-700">No project selected.</p>

          <p className="mt-1 text-sm text-slate-500">
            Create a project to get started.
          </p>
        </div>
      )}
    </div>
  );
}

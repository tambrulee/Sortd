"use client";
import { useState } from "react";
import ArchivedTasks from "@/components/task_management/ArchivedTasks";
import ControlPanel from "@/components/settings/ControlPanel";
import ProjectDetails from "@/components/planner/project/ProjectDetails";
import TaskList from "@/components/task_management/TaskList";
import ConfirmDialog from "@/components/prompts/ConfirmDialog";
import ProjectUploadedCover from "@/components/planner/project/ProjectUploadedCover";
import ProjectCoverPicker from "@/components/planner/project/ProjectCoverPicker";
import { Dream, Goal, ProjectStatus, ProjectCover, ScheduleContext, SortdList, Task } from "@/lib/types";

type TaskFilter = "all" | "high" | "low-energy";
const STATUS_GROUPS: {status: ProjectStatus; label: string}[] = [
  {status:"active",label:"In progress"}, {status:"planned",label:"Planned"},
  {status:"paused",label:"Waiting"}, {status:"backlog",label:"Ideas & backlog"},
  {status:"completed",label:"Completed"}
];
function getOpenTaskCount(project: SortdList) {return project.tasks.filter(t=>!t.completed).length;}
function getProjectStatusLabel(status?: ProjectStatus) {return STATUS_GROUPS.find(s=>s.status===status)?.label ?? "In progress";}
function formatProjectDate(date?: string) {return date ? new Date(`${date}T12:00:00`).toLocaleDateString("en-GB",{day:"numeric",month:"short"}) : undefined;}
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

  onChangeProjectCover: (cover?: ProjectCover) => void;

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
  visibleTasks,
  hideCompleted,
  taskFilter,
  onChangeProject,
  onCreateProject,
  onDeleteProject,
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
  onChangeProjectCover,
}: ProjectsViewProps) {

  const [openedProjectId, setOpenedProjectId] = useState<string | null>(null);
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);
  const [deleteProjectOpen, setDeleteProjectOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [collapsed, setCollapsed] = useState<ProjectStatus[]>(["completed"]);
  const [search, setSearch] = useState("");
  const openTaskCount = projects.reduce((sum,p)=>sum+getOpenTaskCount(p),0);
  const activeTasks = activeProject?.tasks ?? [];
  const linkedGoal = activeProject?.goalId ? goals.find(g=>g.id===activeProject.goalId) : undefined;
  const linkedDream = linkedGoal?.dreamId ? dreams.find(d=>d.id===linkedGoal.dreamId) : undefined;
  const showWorkspace = openedProjectId !== null && activeProject?.id === openedProjectId;
  function openProject(id:string) {onChangeProject(id);setOpenedProjectId(id);setEditingTitle(false);setShowProjectMenu(false);}
  function toggleGroup(status:ProjectStatus) {setCollapsed(current=>current.includes(status)?current.filter(s=>s!==status):[...current,status]);}
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


  return (
    <div className="min-w-0 rounded-2xl border border-[var(--sortd-border)] bg-[var(--sortd-surface)] p-4 text-[var(--sortd-text)] shadow-sm sm:p-5">
      {!showWorkspace ? (
        <>
          <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div><h1 className="text-2xl font-semibold">Projects</h1><p className="text-sm text-[var(--sortd-text-muted)]">The things you&apos;re bringing to life.</p></div>
            <button onClick={()=>{onCreateProject();setOpenedProjectId(null);}} className="rounded-xl bg-[var(--sortd-navy)] px-4 py-2.5 text-sm font-medium text-white">+ New project</button>
          </header>
          <div className="mb-6 grid grid-cols-3 gap-2 sm:gap-3">
            {[[projects.length,"Projects"],[openTaskCount,"Open tasks"],[projects.filter(p=>p.status==="active").length,"In progress"]].map(([value,label])=>(
              <div key={label} className="rounded-xl border border-[var(--sortd-border)] bg-[var(--sortd-card)] p-3 sm:p-4"><p className="text-xl font-semibold">{value}</p><p className="text-xs text-[var(--sortd-text-muted)]">{label}</p></div>
            ))}
          </div>
          <div className="mb-6 rounded-xl border border-[var(--sortd-border)] bg-[var(--sortd-card)] p-4">
            <p className="text-sm font-semibold">✦ Project pulse</p>
            <p className="mt-1 text-sm text-[var(--sortd-text-muted)]">{projects.filter(p=>p.status==="active" && getOpenTaskCount(p)===0).length > 0 ? `${projects.filter(p=>p.status==="active" && getOpenTaskCount(p)===0).length} in-progress projects have no outstanding tasks. Consider adding a next step or marking them complete.` : `${projects.filter(p=>p.status==="active").length} projects are in progress, with ${openTaskCount} tasks open across all projects.`}</p>
          </div>
          <label className="mb-5 block"><span className="sr-only">Search projects</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search projects..." className="w-full rounded-xl border border-[var(--sortd-border)] bg-[var(--sortd-card)] px-4 py-3 text-sm sm:max-w-sm" /></label>
          {STATUS_GROUPS.map(group=>{
            const matches=projects.filter(p=>(p.status??"active")===group.status && `${p.name} ${p.description??""}`.toLowerCase().includes(search.toLowerCase()));
            if (!matches.length && search) return null;
            const isCollapsed=collapsed.includes(group.status);
            return <section key={group.status} className="mb-7">
              <button type="button" onClick={()=>toggleGroup(group.status)} aria-expanded={!isCollapsed} className="mb-3 flex w-full items-center justify-between gap-2 text-left"><span className="font-semibold">{group.label} <span className="ml-1 text-sm font-normal text-[var(--sortd-text-muted)]">({matches.length})</span></span><span className="text-[var(--sortd-text-muted)]">{isCollapsed?"▸":"▾"}</span></button>
              {!isCollapsed && <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{matches.map(project=>{
                const completed=project.tasks.filter(t=>t.completed).length;
                const progress=project.tasks.length?Math.round(100*completed/project.tasks.length):0;
                return <button key={project.id} type="button" onClick={()=>openProject(project.id)} className="group overflow-hidden rounded-2xl border border-[var(--sortd-border)] bg-[var(--sortd-card)] text-left transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-[var(--sortd-teal)]">
                  <div className="relative h-36 overflow-hidden bg-gradient-to-br from-[#1f0825] via-[#477b73] to-[#cdbfd1]">
                    {project.cover?.source==="unsplash" && <img src={project.cover.url} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />}
                    {project.cover?.source==="upload" && <ProjectUploadedCover path={project.cover.path} />}
                    {!project.cover && <div className="flex h-full items-center justify-center text-4xl text-white/70">✦</div>}
                  </div>
                  <div className="space-y-2 p-4"><p className="font-semibold">{project.name||"Untitled project"}</p><p className="line-clamp-2 min-h-9 text-xs leading-5 text-[var(--sortd-text-muted)]">{project.description||"Add a description to bring this project to life."}</p>
                    <div className="flex justify-between text-xs text-[var(--sortd-text-muted)]"><span>{getOpenTaskCount(project)} open tasks</span><span>{project.targetDate?`Due ${formatProjectDate(project.targetDate)}`:`${progress}% complete`}</span></div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[var(--sortd-muted)]"><div className="h-full rounded-full bg-[var(--sortd-teal)]" style={{width:`${progress}%`}} /></div>
                    {project.cover?.source==="unsplash" && <span className="block text-[10px] text-[var(--sortd-text-muted)]"></span>}
                  </div>
                </button>;
              })}</div>}
              {!isCollapsed && !matches.length && <p className="rounded-xl border border-dashed border-[var(--sortd-border)] p-4 text-sm text-[var(--sortd-text-muted)]">No projects here yet.</p>}
            </section>;
          })}
        </>
      ) : (
        <>
          <button type="button" onClick={()=>setOpenedProjectId(null)} className="mb-4 text-sm text-[var(--sortd-teal-dark)]">← All projects</button>
          <div className="relative mb-4 h-44 overflow-hidden rounded-2xl bg-gradient-to-br from-[#1f0825] via-[#477b73] to-[#cdbfd1]">
            {activeProject?.cover?.source==="unsplash" && <img src={activeProject.cover.url} alt="" className="h-full w-full object-cover" />}
            {activeProject?.cover?.source==="upload" && <ProjectUploadedCover path={activeProject.cover.path} />}
            <button type="button" onClick={()=>setCoverPickerOpen(true)} className="absolute bottom-3 right-3 rounded-lg bg-white/95 px-3 py-2 text-xs font-semibold text-slate-900 shadow">Change cover</button>
          </div>
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              {editingTitle ? (
                <input autoFocus aria-label="Project name" value={titleDraft} onChange={e=>setTitleDraft(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter"){if(titleDraft.trim())onChangeProjectName(titleDraft.trim());setEditingTitle(false);}if(e.key==="Escape")setEditingTitle(false);}}
                  onBlur={()=>{if(titleDraft.trim())onChangeProjectName(titleDraft.trim());setEditingTitle(false);}}
                  className="w-full max-w-lg rounded-lg border border-[var(--sortd-border)] bg-[var(--sortd-card)] px-3 py-2 text-2xl font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[var(--sortd-teal)]" />
              ) : (
                <div className="flex items-center gap-2"><h1 className="text-2xl font-semibold">{activeProject?.name}</h1>
                  <button type="button" aria-label="Edit project name" title="Edit project name" onClick={()=>{setTitleDraft(activeProject?.name??"");setEditingTitle(true);}} className="rounded-lg px-2 py-1 text-sm text-[var(--sortd-text-muted)] hover:bg-[var(--sortd-muted)] focus-visible:outline-2 focus-visible:outline-[var(--sortd-teal)]">✎</button>
                </div>
              )}
              {activeProject?.description && <p className="mt-1 text-sm text-[var(--sortd-text-muted)]">{activeProject.description}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--sortd-text-muted)]">
                {activeProject?.targetDate && <span className="rounded-full bg-[var(--sortd-muted)] px-3 py-1">Target {formatProjectDate(activeProject.targetDate)}</span>}
                <span className="rounded-full bg-[var(--sortd-muted)] px-3 py-1">{activeProject ? getOpenTaskCount(activeProject) : 0} open tasks</span>
              </div>
            </div>
            <div className="flex items-center gap-2"><span className="rounded-full bg-[var(--sortd-muted)] px-3 py-1 text-xs">{getProjectStatusLabel(activeProject?.status)}</span>
              <div className="relative"><button type="button" aria-label="Project actions" aria-expanded={showProjectMenu} onClick={()=>setShowProjectMenu(v=>!v)} className="rounded-lg border border-[var(--sortd-border)] px-3 py-1 text-lg focus-visible:outline-2 focus-visible:outline-[var(--sortd-teal)]">⋯</button>
                {showProjectMenu && <div className="absolute right-0 top-full z-20 mt-2 min-w-40 rounded-xl border border-[var(--sortd-border)] bg-[var(--sortd-card)] p-1 shadow-lg"><button type="button" className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50" onClick={()=>{setShowProjectMenu(false);setDeleteProjectOpen(true);}}>Delete project</button></div>}
              </div>
            </div>
          </div>
          {activeProject && (()=>{
            const total=activeProject.tasks.length;
            const open=getOpenTaskCount(activeProject);
            const done=total-open;
            const overdue=Boolean(activeProject.targetDate && activeProject.targetDate < new Date().toISOString().slice(0,10) && activeProject.status!=="completed");
            const observation=overdue
              ? `The target date has passed${open ? ` and ${open} task${open===1?" remains":"s remain"}` : ""}. Would reviewing the deadline or remaining scope help?`
              : open===0 ? "No open tasks remain. Is this project ready to be marked complete?"
              : done===0 ? `${open} task${open===1?" is":"s are"} open. Choose a next step that feels manageable.`
              : `${done} of ${total} tasks completed. ${open} remaining — you've made progress.`;
            return <section aria-label="Project Pulse" className="mb-5 rounded-2xl border border-[var(--sortd-border)] bg-[var(--sortd-card)] p-4 sm:p-5">
              <div className="mb-4 flex items-center gap-3"><span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--sortd-muted)] text-lg text-[var(--sortd-teal-dark)]">✦</span><div><h2 className="text-lg font-semibold">Project Pulse</h2><p className="text-xs text-[var(--sortd-text-muted)]">A snapshot of where things stand</p></div></div>
              <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                <div className="rounded-xl bg-[var(--sortd-muted)] p-3"><p className="text-xl font-semibold">{open}</p><p className="text-xs text-[var(--sortd-text-muted)]">Open tasks</p></div>
                <div className="rounded-xl bg-[var(--sortd-muted)] p-3"><p className="text-xl font-semibold">{done}</p><p className="text-xs text-[var(--sortd-text-muted)]">Completed tasks</p></div>
                <div className="col-span-2 rounded-xl bg-[var(--sortd-muted)] p-3 sm:col-span-1"><p className="text-xl font-semibold">{total ? `${Math.round(done/total*100)}%` : "—"}</p><p className="text-xs text-[var(--sortd-text-muted)]">Task completion</p></div>
              </div>
              <p className="text-sm font-semibold">What deserves attention</p><p className="mt-1 text-sm leading-6 text-[var(--sortd-text-muted)]">{observation}</p>
            </section>;
          })()}
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
                    className="font-medium text-[var(--sortd-teal-dark)] transition hover:text-[var(--sortd-navy)]"
                  >
                    ✦{" "}
                    {
                      linkedDream.title
                    }
                  </button>

                  <span className="text-[var(--sortd-border)]">
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
                  className="font-medium text-[var(--sortd-text)] transition hover:text-[var(--sortd-text)]"
                >
                  {
                    linkedGoal.title
                  }
                </button>
              ) : (
                <span className="text-[var(--sortd-text-muted)]">
                  No goal
                  attached
                </span>
              )}

            </div>
          )}

          {activeProject ? (
            <>
              <section className="mt-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="text-base font-semibold text-[var(--sortd-text)]">
                    Tasks
                  </h2>

                  <span className="text-xs text-[var(--sortd-text-muted)]">
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

                <div className="min-w-0 space-y-2 pb-4">
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
              <details className="group mt-7 rounded-2xl border border-[var(--sortd-border)] bg-[var(--sortd-card)] p-4 sm:p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm text-[var(--sortd-text)] transition hover:bg-[var(--sortd-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sortd-teal)] [&::-webkit-details-marker]:hidden">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">
                      Project
                      settings
                    </span>

                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        activeProject.status ===
                        "backlog"
                          ? "bg-[var(--sortd-muted)] text-[var(--sortd-text-muted)]"
                          : activeProject.status ===
                              "planned"
                            ? "bg-[var(--sortd-muted)] text-[var(--sortd-teal-dark)]"
                            : activeProject.status ===
                                "paused"
                              ? "bg-amber-50 text-amber-700"
                              : activeProject.status ===
                                  "completed"
                                ? "bg-[var(--sortd-border)] text-[var(--sortd-text-muted)]"
                                : "bg-[var(--sortd-muted)] text-[var(--sortd-teal-dark)]"
                      }`}
                    >
                      {getProjectStatusLabel(
                        activeProject.status,
                      )}
                    </span>
                  </span>

                  <span className="text-[var(--sortd-text-muted)] transition group-open:rotate-180">
                    ▾
                  </span>
                </summary>

                <div className="mt-4 border-t border-[var(--sortd-border)] pt-4 [&_input]:min-w-0 [&_input]:border-[var(--sortd-border)] [&_input]:bg-[var(--sortd-card)] [&_select]:border-[var(--sortd-border)] [&_select]:bg-[var(--sortd-card)] [&_textarea]:border-[var(--sortd-border)] [&_textarea]:bg-[var(--sortd-card)]">
                  <label className="mb-4 flex flex-col gap-1.5 text-xs font-medium text-[var(--sortd-text-muted)]">
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
                      className="rounded-xl border border-[var(--sortd-border)] bg-[var(--sortd-card)] px-3 py-2 text-sm text-[var(--sortd-text)] outline-none transition focus:border-[var(--sortd-teal-dark)] focus:ring-2 focus:ring-[var(--sortd-teal-dark)]/20"
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



              {(activeProject
                .archivedTasks
                ?.length ??
                0) >
                0 && (
                <details className="group mt-5 border-t border-[var(--sortd-border)] pt-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between text-sm text-[var(--sortd-text-muted)] transition hover:text-[var(--sortd-text)] [&::-webkit-details-marker]:hidden">
                    <span>
                      Archived
                      tasks{" "}
                      <span className="text-[var(--sortd-text-muted)]">
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
              <p className="font-medium text-[var(--sortd-text)]">
                No project
                selected.
              </p>

              <p className="mt-1 text-sm text-[var(--sortd-text-muted)]">
                Create a
                project to get
                started.
              </p>
            </div>
          )}

        </>
      )}
      {coverPickerOpen && activeProject && <ProjectCoverPicker projectId={activeProject.id} current={activeProject.cover} onSelect={cover=>{onChangeProjectCover(cover);setCoverPickerOpen(false);}} onClose={()=>setCoverPickerOpen(false)} />}
      <ConfirmDialog open={deleteProjectOpen} title="Delete project?" description={`Delete “${activeProject?.name??"this project"}” and its tasks? This cannot be undone.`} confirmLabel="Delete project" onCancel={()=>setDeleteProjectOpen(false)} onConfirm={()=>{setDeleteProjectOpen(false);setOpenedProjectId(null);onDeleteProject();}} />
    </div>
  );
}

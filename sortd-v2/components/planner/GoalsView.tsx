"use client";

import { useId, useMemo, useState } from "react";
import { Dream, Goal, SortdList } from "@/lib/types";
import ConfirmDialog from "@/components/prompts/ConfirmDialog";

type GoalsViewProps = {
  goals: Goal[];
  dreams: Dream[];
  projects: SortdList[];
  onChangeGoals: (goals: Goal[]) => void;
  onCreateProjectForGoal?: (goalId: string) => void;
  onOpenDream?: (dreamId: string) => void;
  onOpenProject?: (projectId: string) => void;
};

type GoalDraft = Pick<Goal, "title" | "description" | "status" | "dreamId">;
const statuses = ["active", "paused", "completed"] as const;
const statusLabels = { active: "Active", paused: "Paused", completed: "Completed" };
const buttonClass = "inline-flex min-h-11 items-center justify-center rounded-lg px-3 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sortd-teal-dark)]";
const fieldClass = "mt-1 min-h-11 w-full min-w-0 rounded-lg border border-[var(--sortd-border)] bg-[var(--sortd-card)] px-3 py-2 text-base text-[var(--sortd-text)] outline-none focus:border-[var(--sortd-teal-dark)] focus:ring-2 focus:ring-[var(--sortd-teal)]/20 sm:text-sm";

function getGoalProgress(goalId: string, projects: SortdList[]) {
  const linkedProjects = projects.filter((project) => project.goalId === goalId);
  const totalTasks = linkedProjects.reduce((total, project) => total + project.tasks.length, 0);
  const completedTasks = linkedProjects.reduce((total, project) => total + project.tasks.filter((task) => task.completed).length, 0);
  return { linkedProjects, totalTasks, completedTasks,
    progress: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0 };
}

function GoalCard({ goal, dreams, progress, onSave, onDelete, onCreateProjectForGoal, onOpenDream, onOpenProject }: {
  goal: Goal;
  dreams: Dream[];
  progress: ReturnType<typeof getGoalProgress>;
  onSave: (updates: GoalDraft) => void;
  onDelete: () => void;
  onCreateProjectForGoal?: GoalsViewProps["onCreateProjectForGoal"];
  onOpenDream?: GoalsViewProps["onOpenDream"];
  onOpenProject?: GoalsViewProps["onOpenProject"];
}) {
  const id = useId();
  const [editing, setEditing] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [draft, setDraft] = useState<GoalDraft>(() => ({ title: goal.title, description: goal.description ?? "", status: goal.status, dreamId: goal.dreamId }));
  const linkedDream = dreams.find((dream) => dream.id === goal.dreamId);
  const { linkedProjects, totalTasks, completedTasks, progress: percent } = progress;
  function startEditing() {
    setDraft({ title: goal.title, description: goal.description ?? "", status: goal.status, dreamId: goal.dreamId });
    setEditing(true);
  }
  return (
    <article className="min-w-0 rounded-xl border border-[var(--sortd-border)] bg-[var(--sortd-card)] p-4 sm:p-5">
      {editing ? (
        <form onSubmit={(event) => {
          event.preventDefault();
          if (!draft.title.trim()) return;
          onSave({ ...draft, title: draft.title.trim() });
          setEditing(false);
        }} onKeyDown={(event) => { if (event.key === "Escape") { event.stopPropagation(); setEditing(false); } }} className="space-y-4">
          <label htmlFor={`${id}-title`} className="block text-sm font-medium">
            Goal title
            <input id={`${id}-title`} autoFocus required value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} className={fieldClass} />
          </label>
          <label htmlFor={`${id}-description`} className="block text-sm font-medium">
            What would achieving this change?
            <textarea id={`${id}-description`} rows={3} value={draft.description ?? ""} onChange={(event) => setDraft({ ...draft, description: event.target.value })} className={`${fieldClass} resize-y`} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label htmlFor={`${id}-dream`} className="block min-w-0 text-sm font-medium">
              Linked dream
              <select id={`${id}-dream`} value={draft.dreamId ?? ""} onChange={(event) => setDraft({ ...draft, dreamId: event.target.value || undefined })} className={fieldClass}>
                <option value="">No linked dream</option>
                {draft.dreamId && !dreams.some((dream) => dream.id === draft.dreamId) && <option value={draft.dreamId}>Unavailable dream</option>}
                {dreams.map((dream) => <option key={dream.id} value={dream.id}>{dream.title}</option>)}
              </select>
            </label>
            <label htmlFor={`${id}-status`} className="block text-sm font-medium">
              Status
              <select id={`${id}-status`} value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as Goal["status"] })} className={fieldClass}>
                {statuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
              </select>
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-[var(--sortd-border)] pt-3">
            <button type="submit" disabled={!draft.title.trim()} className={`${buttonClass} bg-[var(--sortd-navy)] text-white hover:bg-[var(--sortd-navy-dark)] disabled:opacity-50`}>Save changes</button>
            <button type="button" onClick={() => setEditing(false)} className={`${buttonClass} bg-[var(--sortd-muted)]`}>Cancel</button>
            <button type="button" onClick={onDelete} className={`${buttonClass} ml-auto text-[var(--sortd-text-muted)] hover:bg-[var(--sortd-muted)]`}>Delete goal</button>
          </div>
        </form>
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="break-words text-base font-semibold sm:text-lg">{goal.title}</h2>
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${goal.status === "completed" ? "bg-[var(--sortd-teal)]/15 text-[var(--sortd-teal-dark)]" : "bg-[var(--sortd-muted)] text-[var(--sortd-text-muted)]"}`}>{statusLabels[goal.status]}</span>
              </div>
              {goal.description && <p className="mt-2 line-clamp-2 break-words text-sm text-[var(--sortd-text-muted)]">{goal.description}</p>}
            </div>
            <button type="button" onClick={startEditing} aria-label={`Edit ${goal.title}`} className={`${buttonClass} shrink-0 bg-[var(--sortd-muted)] hover:bg-[var(--sortd-surface)]`}>Edit</button>
          </div>
          {totalTasks > 0 ? (
            <div className="mt-4">
              <div className="flex flex-wrap items-center justify-between gap-1 text-xs text-[var(--sortd-text-muted)]">
                <span>Project task progress · {completedTasks}/{totalTasks} complete</span>
                <span className="font-semibold text-[var(--sortd-text)]">{percent}%</span>
              </div>
              <div role="progressbar" aria-label={`Project task progress for ${goal.title}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-valuetext={`${completedTasks} of ${totalTasks} project tasks complete`} className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--sortd-muted)]">
                <div className="h-full rounded-full bg-[var(--sortd-teal-dark)] transition-[width]" style={{ width: `${percent}%` }} />
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-[var(--sortd-text-muted)]">{goal.status === "completed" ? "Goal completed." : linkedProjects.length ? "Add tasks to your projects to track progress." : "Start with a project that moves this goal forward."}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {linkedDream && (onOpenDream ? <button type="button" onClick={() => onOpenDream(linkedDream.id)} className={`${buttonClass} max-w-full text-[var(--sortd-teal-dark)] hover:bg-[var(--sortd-muted)]`}><span className="truncate">✦ {linkedDream.title}</span></button> : <span className="max-w-full truncate text-sm text-[var(--sortd-text-muted)]">✦ {linkedDream.title}</span>)}
            {linkedProjects.length > 0 && <button type="button" onClick={() => setProjectsOpen((open) => !open)} aria-expanded={projectsOpen} aria-controls={`${id}-projects`} className={`${buttonClass} bg-[var(--sortd-muted)]`}><span aria-hidden="true" className="mr-2">{projectsOpen ? "−" : "+"}</span>{linkedProjects.length} {linkedProjects.length === 1 ? "project" : "projects"}</button>}
            {onCreateProjectForGoal && <button type="button" onClick={() => onCreateProjectForGoal(goal.id)} className={`${buttonClass} text-[var(--sortd-teal-dark)] hover:bg-[var(--sortd-muted)]`}>+ Create project</button>}
          </div>
          <div id={`${id}-projects`} hidden={!projectsOpen}>
            <ul className="mt-3 space-y-2 border-t border-[var(--sortd-border)] pt-3">
              {linkedProjects.map((project) => {
                const completed = project.tasks.filter((task) => task.completed).length;
                const content = <><span className="min-w-0 flex-1"><span className="block break-words text-sm font-medium">{project.name}</span><span className="mt-1 block text-xs text-[var(--sortd-text-muted)]">{project.tasks.length ? `${completed}/${project.tasks.length} tasks complete` : "No tasks yet"} · {project.status ?? "active"}</span></span>{onOpenProject && <span aria-hidden="true">→</span>}</>;
                const className = "flex min-h-11 w-full items-center gap-3 rounded-lg bg-[var(--sortd-surface)] px-3 py-3 text-left";
                return <li key={project.id}>{onOpenProject ? <button type="button" onClick={() => onOpenProject(project.id)} className={`${className} hover:bg-[var(--sortd-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sortd-teal-dark)]`}>{content}</button> : <div className={className}>{content}</div>}</li>;
              })}
            </ul>
          </div>
        </>
      )}
    </article>
  );
}

export default function GoalsView({ goals, dreams, projects, onChangeGoals, onCreateProjectForGoal, onOpenDream, onOpenProject }: GoalsViewProps) {
  const newTitleId = useId();
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [filter, setFilter] = useState<Goal["status"] | "all">("active");
  const [goalToDeleteId, setGoalToDeleteId] = useState<string | null>(null);
  const visibleGoals = useMemo(() => goals.filter((goal) => filter === "all" || goal.status === filter), [goals, filter]);
  const progressByGoal = useMemo(() => new Map(goals.map((goal) => [goal.id, getGoalProgress(goal.id, projects)])), [goals, projects]);
  const deletingGoal = goals.find((goal) => goal.id === goalToDeleteId);
  const linkedProjectCount = goalToDeleteId ? projects.filter((project) => project.goalId === goalToDeleteId).length : 0;
  return (
    <section className="min-w-0 rounded-2xl border border-[var(--sortd-border)] bg-[var(--sortd-surface)] p-4 text-[var(--sortd-text)] shadow-sm sm:p-5">
      <header className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Goals</h1>
        <span className="text-sm text-[var(--sortd-text-muted)]">{goals.filter((goal) => goal.status === "active").length} active</span>
      </header>
      <form onSubmit={(event) => {
        event.preventDefault();
        const title = newGoalTitle.trim();
        if (!title) return;
        onChangeGoals([...goals, { id: crypto.randomUUID(), title, description: "", status: "active", createdAt: new Date().toISOString() }]);
        setNewGoalTitle("");
        setFilter("active");
      }} className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor={newTitleId} className="sr-only">New goal title</label>
        <input id={newTitleId} value={newGoalTitle} onChange={(event) => setNewGoalTitle(event.target.value)} placeholder="What do you want to achieve?" className={`${fieldClass} mt-0 flex-1`} />
        <button type="submit" disabled={!newGoalTitle.trim()} className={`${buttonClass} shrink-0 bg-[var(--sortd-navy)] text-white hover:bg-[var(--sortd-navy-dark)] disabled:opacity-50`}>Add goal</button>
      </form>
      <div aria-label="Filter goals" className="my-4 flex flex-wrap gap-1 rounded-xl bg-[var(--sortd-muted)] p-1">
        {[...statuses, "all" as const].map((value) => {
          const count = value === "all" ? goals.length : goals.filter((goal) => goal.status === value).length;
          return <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)} className={`${buttonClass} flex-1 gap-2 ${filter === value ? "bg-[var(--sortd-card)] text-[var(--sortd-text)] shadow-sm" : "text-[var(--sortd-text-muted)] hover:bg-[var(--sortd-surface)]"}`}>{value === "all" ? "All" : statusLabels[value]}<span className="text-xs tabular-nums">{count}</span></button>;
        })}
      </div>
      {visibleGoals.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--sortd-border)] px-4 py-8 text-center">
          <p className="font-medium">{goals.length === 0 ? "What would you like to work towards?" : filter === "all" ? "No goals yet." : `No ${filter} goals.`}</p>
          <p className="mt-2 text-sm text-[var(--sortd-text-muted)]">{goals.length === 0 ? "Add a goal above, then break it into projects when you’re ready." : "Choose another filter to see your other goals."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleGoals.map((goal) => <GoalCard key={goal.id} goal={goal} dreams={dreams} progress={progressByGoal.get(goal.id)!} onSave={(updates) => onChangeGoals(goals.map((current) => current.id === goal.id ? { ...current, ...updates } : current))} onDelete={() => setGoalToDeleteId(goal.id)} onCreateProjectForGoal={onCreateProjectForGoal} onOpenDream={onOpenDream} onOpenProject={onOpenProject} />)}
        </div>
      )}
      <ConfirmDialog open={Boolean(deletingGoal)} title="Delete goal?" description={deletingGoal ? `Delete “${deletingGoal.title}”? This can't be undone.${linkedProjectCount ? ` Your ${linkedProjectCount === 1 ? "linked project will" : `${linkedProjectCount} linked projects will`} remain; only this goal is deleted.` : ""}` : undefined} confirmLabel="Delete goal" onCancel={() => setGoalToDeleteId(null)} onConfirm={() => { if (!deletingGoal) return; onChangeGoals(goals.filter((goal) => goal.id !== deletingGoal.id)); setGoalToDeleteId(null); }} />
    </section>
  );
}

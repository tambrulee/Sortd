"use client";

import { useMemo, useState } from "react";
import { ArrowRight, ChevronDown, ChevronUp, Compass, Plus, Sparkles, Target, Trash2 } from "lucide-react";
import { Dream, Goal, SortdList } from "@/lib/types";
import ConfirmDialog from "@/components/prompts/ConfirmDialog";

type DreamsViewProps = {
  dreams: Dream[];
  goals: Goal[];
  projects: SortdList[];
  onChangeDreams: (dreams: Dream[]) => void;
  onChangeGoals: (goals: Goal[]) => void;
  onOpenGoal?: (goalId: string) => void;
};

type Filter = "all" | "exploring" | "in-motion";

export default function DreamsView({ dreams, goals, projects, onChangeDreams, onChangeGoals, onOpenGoal }: DreamsViewProps) {
  const [newTitle, setNewTitle] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const summaries = useMemo(() => new Map(dreams.map(dream => {
    const linkedGoals = goals.filter(goal => goal.dreamId === dream.id);
    const goalIds = new Set(linkedGoals.map(goal => goal.id));
    const linkedProjects = projects.filter(project => project.goalId && goalIds.has(project.goalId));
    const totalTasks = linkedProjects.reduce((sum, project) => sum + project.tasks.length, 0);
    const completedTasks = linkedProjects.reduce((sum, project) => sum + project.tasks.filter(task => task.completed).length, 0);
    return [dream.id, { linkedGoals, linkedProjects, totalTasks, completedTasks, progress: totalTasks ? Math.round(completedTasks / totalTasks * 100) : null }] as const;
  })), [dreams, goals, projects]);

  const activeCount = dreams.filter(dream => (summaries.get(dream.id)?.linkedGoals.length ?? 0) > 0).length;
  const visible = dreams.filter(dream => filter === "all" || (filter === "in-motion" ? (summaries.get(dream.id)?.linkedGoals.length ?? 0) > 0 : (summaries.get(dream.id)?.linkedGoals.length ?? 0) === 0));
  const selectedDream = dreams.find(dream => dream.id === deleteId);
  const selectedGoalCount = goals.filter(goal => goal.dreamId === deleteId).length;

  function addDream() {
    const title = newTitle.trim();
    if (!title) return;
    const id = crypto.randomUUID();
    onChangeDreams([...dreams, { id, title, description: "", category: "", createdAt: new Date().toISOString() }]);
    setNewTitle("");
    setFilter("all");
    setExpandedIds(current => [...current, id]);
  }

  function updateDream(id: string, updates: Partial<Dream>) {
    onChangeDreams(dreams.map(dream => dream.id === id ? { ...dream, ...updates } : dream));
  }

  function addGoal(dreamId: string) {
    const goal: Goal = { id: crypto.randomUUID(), title: "New goal", description: "", status: "active", createdAt: new Date().toISOString(), dreamId };
    onChangeGoals([...goals, goal]);
    onOpenGoal?.(goal.id);
  }

  const fieldClass = "w-full min-w-0 rounded-xl border border-[var(--sortd-border)] bg-white px-3 py-2.5 text-sm text-[var(--sortd-text)] outline-none focus:border-[var(--sortd-teal-dark)] focus:ring-2 focus:ring-[var(--sortd-teal)]/15";

  return (
    <section className="min-w-0 space-y-5 pb-8 text-[var(--sortd-text)]">
      <header className="rounded-3xl bg-[var(--sortd-navy)] px-5 py-6 text-white sm:px-7 sm:py-7">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-teal-200"><Sparkles size={15} /> Your bigger picture</div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Dreams<span className="text-[var(--sortd-teal)]">.</span></h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-200">A space for the things you&apos;d love to make happen. No deadline required.</p>
      </header>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {[
          { label: "Dreams", value: dreams.length },
          { label: "In motion", value: activeCount },
          { label: "Exploring", value: dreams.length - activeCount },
        ].map(stat => (
          <div key={stat.label} className="rounded-2xl border border-[var(--sortd-border)] bg-[var(--sortd-surface)] p-3 sm:p-4">
            <div className="text-xl font-semibold tabular-nums text-[var(--sortd-navy)] sm:text-2xl">{stat.value}</div>
            <div className="mt-1 text-xs text-[var(--sortd-text-muted)] sm:text-sm">{stat.label}</div>
          </div>
        ))}
      </div>

      <form onSubmit={event => { event.preventDefault(); addDream(); }} className="rounded-2xl border border-[var(--sortd-border)] bg-[var(--sortd-surface)] p-4 sm:p-5">
        <label htmlFor="new-dream-title" className="mb-2 block text-sm font-semibold text-[var(--sortd-navy)]">What&apos;s on your horizon?</label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input id="new-dream-title" value={newTitle} onChange={event => setNewTitle(event.target.value)} placeholder="Something I'd love to do someday…" className={fieldClass + " flex-1"} />
          <button type="submit" disabled={!newTitle.trim()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--sortd-navy)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"><Plus size={17} /> Add dream</button>
        </div>
      </form>

      {dreams.length > 0 && (
        <div className="flex flex-wrap items-center gap-2" aria-label="Filter dreams">
          {([{ id: "all", label: "All" }, { id: "in-motion", label: "In motion" }, { id: "exploring", label: "Exploring" }] as const).map(item => (
            <button key={item.id} type="button" aria-pressed={filter === item.id} onClick={() => setFilter(item.id)} className={`rounded-full border px-3.5 py-2 text-xs font-medium transition sm:text-sm ${filter === item.id ? "border-[var(--sortd-navy)] bg-[var(--sortd-navy)] text-white" : "border-[var(--sortd-border)] bg-[var(--sortd-surface)] text-[var(--sortd-text)] hover:bg-[var(--sortd-muted)]"}`}>{item.label}</button>
          ))}
        </div>
      )}

      {dreams.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--sortd-border)] bg-[var(--sortd-surface)] px-5 py-12 text-center">
          <Compass className="mx-auto text-[var(--sortd-teal-dark)]" size={30} />
          <h2 className="mt-3 font-semibold text-[var(--sortd-navy)]">Your bigger picture starts here</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--sortd-text-muted)]">Not every dream needs a plan. Capture what matters to you, and come back whenever you&apos;re ready.</p>
        </div>
      ) : visible.length === 0 ? (
        <p className="rounded-2xl border border-[var(--sortd-border)] bg-[var(--sortd-surface)] p-6 text-center text-sm text-[var(--sortd-text-muted)]">Nothing in this view yet.</p>
      ) : (
        <div className="grid items-start gap-3 lg:grid-cols-2">
          {visible.map(dream => {
            const summary = summaries.get(dream.id)!;
            const expanded = expandedIds.includes(dream.id);
            const inMotion = summary.linkedGoals.length > 0;
            return (
              <article key={dream.id} className="min-w-0 overflow-hidden rounded-2xl border border-[var(--sortd-border)] bg-[var(--sortd-surface)] shadow-sm">
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="mt-0.5 rounded-xl bg-[var(--sortd-muted)] p-2 text-[var(--sortd-teal-dark)]"><Sparkles size={17} /></span>
                      <div className="min-w-0">
                        <h2 className="break-words text-base font-semibold leading-6 text-[var(--sortd-navy)]">{dream.title || "Untitled dream"}</h2>
                        <p className="mt-1 text-xs text-[var(--sortd-text-muted)]">{inMotion ? `${summary.linkedGoals.length} linked ${summary.linkedGoals.length === 1 ? "goal" : "goals"}` : "Just an idea — for now"}</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => setExpandedIds(current => expanded ? current.filter(id => id !== dream.id) : [...current, dream.id])} aria-label={`${expanded ? "Collapse" : "Expand"} ${dream.title}`} aria-expanded={expanded} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--sortd-text-muted)] hover:bg-[var(--sortd-muted)]">{expanded ? <ChevronUp size={19} /> : <ChevronDown size={19} />}</button>
                  </div>
                  {dream.description && !expanded && <p className="mt-3 line-clamp-2 whitespace-pre-wrap break-words text-sm leading-6 text-[var(--sortd-text-muted)]">{dream.description}</p>}
                  {summary.progress !== null && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between gap-2 text-xs text-[var(--sortd-text-muted)]"><span>Linked task progress</span><span className="font-semibold text-[var(--sortd-navy)]">{summary.progress}%</span></div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--sortd-muted)]"><div className="h-full rounded-full bg-[var(--sortd-teal-dark)] transition-all" style={{ width: `${summary.progress}%` }} /></div>
                    </div>
                  )}
                  {!expanded && inMotion && <div className="mt-4 flex items-center gap-2 text-xs text-[var(--sortd-text-muted)]"><Target size={14} /> {summary.linkedGoals.filter(goal => goal.status === "completed").length} goals completed</div>}
                </div>
                {expanded && (
                  <div className="space-y-4 border-t border-[var(--sortd-border)] px-4 py-4 sm:px-5">
                    <div><label htmlFor={`dream-title-${dream.id}`} className="mb-1.5 block text-xs font-semibold text-[var(--sortd-text-muted)]">Dream</label><input id={`dream-title-${dream.id}`} value={dream.title} onChange={event => updateDream(dream.id, { title: event.target.value })} className={fieldClass} /></div>
                    <div><label htmlFor={`dream-description-${dream.id}`} className="mb-1.5 block text-xs font-semibold text-[var(--sortd-text-muted)]">What does this look or feel like?</label><textarea id={`dream-description-${dream.id}`} rows={3} value={dream.description ?? ""} onChange={event => updateDream(dream.id, { description: event.target.value })} placeholder="A few words about why this matters to you…" className={fieldClass + " resize-y"} /></div>
                    <div>
                      <div className="mb-2 flex items-center justify-between gap-2"><h3 className="text-sm font-semibold text-[var(--sortd-navy)]">Linked goals</h3><button type="button" onClick={() => addGoal(dream.id)} className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--sortd-teal-dark)] hover:underline"><Plus size={14} /> Add goal</button></div>
                      {summary.linkedGoals.length === 0 ? <p className="text-sm text-[var(--sortd-text-muted)]">No goals linked. You can leave this as a dream for as long as you like.</p> : <div className="space-y-2">{summary.linkedGoals.map(goal => {
                        const goalProjects = projects.filter(project => project.goalId === goal.id);
                        return <button key={goal.id} type="button" onClick={() => onOpenGoal?.(goal.id)} disabled={!onOpenGoal} className="flex w-full min-w-0 items-center justify-between gap-2 rounded-xl bg-[var(--sortd-muted)] px-3 py-3 text-left transition hover:opacity-80 disabled:cursor-default"><span className="min-w-0"><span className={`block truncate text-sm font-medium ${goal.status === "completed" ? "text-[var(--sortd-text-muted)] line-through" : "text-[var(--sortd-navy)]"}`}>{goal.title}</span><span className="mt-1 block text-xs text-[var(--sortd-text-muted)]">{goalProjects.length} {goalProjects.length === 1 ? "project" : "projects"} · {goal.status}</span></span><ArrowRight size={16} className="shrink-0 text-[var(--sortd-text-muted)]" /></button>;
                      })}</div>}
                    </div>
                    <div className="flex justify-end border-t border-[var(--sortd-border)] pt-3"><button type="button" onClick={() => setDeleteId(dream.id)} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"><Trash2 size={14} /> Delete dream</button></div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
      <ConfirmDialog open={Boolean(deleteId)} title="Delete dream?" description={selectedDream ? `Delete “${selectedDream.title}”?${selectedGoalCount ? ` It has ${selectedGoalCount} linked ${selectedGoalCount === 1 ? "goal" : "goals"}, which will remain in Goals.` : ""} This can't be undone.` : "Delete this dream? This can't be undone."} confirmLabel="Delete dream" onCancel={() => setDeleteId(null)} onConfirm={() => { if (!deleteId) return; onChangeDreams(dreams.filter(dream => dream.id !== deleteId)); setDeleteId(null); }} />
    </section>
  );
}

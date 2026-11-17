"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Compass, Plus, Sparkles, Target, Trash2 } from "lucide-react";
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

const fieldClass = "w-full min-w-0 rounded-xl border border-[var(--sortd-border)] bg-white px-4 py-3 text-sm text-[var(--sortd-text)] outline-none focus:border-[var(--sortd-teal-dark)] focus:ring-2 focus:ring-[var(--sortd-teal)]/15";
const covers = [
  "from-[#203e49] via-[#537b79] to-[#c4b79c]",
  "from-[#352d4b] via-[#77708e] to-[#d3b6aa]",
  "from-[#244b40] via-[#6b8c73] to-[#d7c9a6]",
  "from-[#443b4a] via-[#a17e80] to-[#d8bfa3]",
  "from-[#24405b] via-[#638ca2] to-[#b9c9c5]",
  "from-[#534438] via-[#a48c69] to-[#e0c9a2]",
];

export default function DreamsView({ dreams, goals, projects, onChangeDreams, onChangeGoals, onOpenGoal }: DreamsViewProps) {
  const [newTitle, setNewTitle] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);

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
  const activeDream = dreams.find(dream => dream.id === activeId);
  const deleteDream = dreams.find(dream => dream.id === deleteId);
  const deleteGoalCount = goals.filter(goal => goal.dreamId === deleteId).length;

  function addDream() {
    const title = newTitle.trim();
    if (!title) return;
    const id = crypto.randomUUID();
    onChangeDreams([...dreams, { id, title, description: "", category: "", createdAt: new Date().toISOString() }]);
    setNewTitle("");
    setFilter("all");
    setActiveId(id);
  }

  function updateDream(id: string, updates: Partial<Dream>) {
    onChangeDreams(dreams.map(dream => dream.id === id ? { ...dream, ...updates } : dream));
  }

  function addGoal(dreamId: string) {
    const goal: Goal = { id: crypto.randomUUID(), title: "New goal", description: "", status: "active", createdAt: new Date().toISOString(), dreamId };
    onChangeGoals([...goals, goal]);
    onOpenGoal?.(goal.id);
  }

  function openDream(id: string) {
    setEditingTitle(false);
    setActiveId(id);
  }

  const summary = activeDream ? summaries.get(activeDream.id) : undefined;
  const activeIndex = activeDream ? dreams.findIndex(dream => dream.id === activeDream.id) : -1;
  const coverClass = covers[(activeIndex < 0 ? 0 : activeIndex) % covers.length];

  return (
    <section className="min-w-0 space-y-6 pb-8 text-[var(--sortd-text)]">
      {!activeDream ? (
        <>
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-[var(--sortd-navy)]">Dreams</h1>
              <p className="mt-1 text-sm text-[var(--sortd-text-muted)]">Your bigger picture. Things worth imagining, exploring and making happen.</p>
            </div>
            <div className="flex items-center gap-3 text-sm text-[var(--sortd-text-muted)]">
              <span><strong className="text-[var(--sortd-navy)]">{dreams.length}</strong> dreams</span>
              <span aria-hidden="true">·</span>
              <span><strong className="text-[var(--sortd-navy)]">{activeCount}</strong> in motion</span>
            </div>
          </header>

          <form onSubmit={event => { event.preventDefault(); addDream(); }} className="flex flex-col gap-3 rounded-2xl border border-[var(--sortd-border)] bg-[var(--sortd-surface)] p-4 sm:flex-row sm:items-center">
            <input aria-label="New dream" value={newTitle} onChange={event => setNewTitle(event.target.value)} placeholder="What's something you'd love to do?" className={fieldClass + " flex-1"} />
            <button type="submit" disabled={!newTitle.trim()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--sortd-navy)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-40"><Plus size={17} /> Add dream</button>
          </form>

          <div className="flex flex-wrap gap-2" aria-label="Filter dreams">
            {([{ id: "all", label: "All dreams" }, { id: "in-motion", label: "In motion" }, { id: "exploring", label: "Exploring" }] as const).map(item => (
              <button key={item.id} type="button" aria-pressed={filter === item.id} onClick={() => setFilter(item.id)} className={`rounded-full px-4 py-2 text-sm font-medium transition ${filter === item.id ? "bg-[var(--sortd-navy)] text-white" : "border border-[var(--sortd-border)] bg-[var(--sortd-surface)] text-[var(--sortd-text-muted)] hover:bg-[var(--sortd-muted)]"}`}>{item.label}</button>
            ))}
          </div>

          {dreams.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--sortd-border)] bg-[var(--sortd-surface)] px-5 py-14 text-center">
              <Compass className="mx-auto text-[var(--sortd-teal-dark)]" size={32} />
              <h2 className="mt-3 font-semibold text-[var(--sortd-navy)]">Your bigger picture starts here</h2>
              <p className="mt-2 text-sm text-[var(--sortd-text-muted)]">Not every dream needs a deadline or a plan.</p>
            </div>
          ) : visible.length === 0 ? (
            <p className="rounded-2xl border border-[var(--sortd-border)] bg-[var(--sortd-surface)] p-8 text-center text-sm text-[var(--sortd-text-muted)]">Nothing in this view yet.</p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map(dream => {
                const item = summaries.get(dream.id)!;
                const index = dreams.findIndex(candidate => candidate.id === dream.id);
                return (
                  <button key={dream.id} type="button" onClick={() => openDream(dream.id)} className="group min-w-0 overflow-hidden rounded-2xl border border-[var(--sortd-border)] bg-[var(--sortd-surface)] text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                    <div className={`relative flex h-40 items-end overflow-hidden bg-gradient-to-br ${covers[index % covers.length]} p-4 sm:h-44`}>
                      <div className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-[var(--sortd-navy)]">{item.linkedGoals.length ? "In motion" : "Exploring"}</div>
                      <Sparkles className="text-white/70" size={29} strokeWidth={1.5} />
                    </div>
                    <div className="space-y-3 p-5">
                      <h2 className="break-words text-lg font-semibold text-[var(--sortd-navy)]">{dream.title || "Untitled dream"}</h2>
                      <p className="min-h-10 line-clamp-2 text-sm leading-5 text-[var(--sortd-text-muted)]">{dream.description || "Add a description to bring this dream to life."}</p>
                      <div className="flex items-center justify-between gap-2 text-xs text-[var(--sortd-text-muted)]"><span>{item.linkedGoals.length} linked {item.linkedGoals.length === 1 ? "goal" : "goals"}</span><span>{item.linkedProjects.length} {item.linkedProjects.length === 1 ? "project" : "projects"}</span></div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--sortd-muted)]"><div className="h-full rounded-full bg-[var(--sortd-teal-dark)]" style={{ width: `${item.progress ?? 0}%` }} /></div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-6">
          <button type="button" onClick={() => { setActiveId(null); setEditingTitle(false); }} className="inline-flex items-center gap-2 text-sm font-medium text-[var(--sortd-teal-dark)] hover:underline"><ArrowLeft size={17} /> All dreams</button>
          <div className="overflow-hidden rounded-3xl border border-[var(--sortd-border)] bg-[var(--sortd-surface)]">
            <div className={`relative flex h-48 items-end bg-gradient-to-br ${coverClass} p-6 sm:h-64`}><Sparkles className="text-white/75" size={40} strokeWidth={1.4} /><span className="absolute right-5 top-5 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-[var(--sortd-navy)]">{summary?.linkedGoals.length ? "In motion" : "Exploring"}</span></div>
            <div className="space-y-5 p-5 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-3">
                {editingTitle ? <input autoFocus aria-label="Dream title" value={activeDream.title} onChange={event => updateDream(activeDream.id, { title: event.target.value })} onBlur={() => setEditingTitle(false)} onKeyDown={event => { if (event.key === "Enter") setEditingTitle(false); }} className={fieldClass + " max-w-xl text-xl font-semibold"} /> : <button type="button" onClick={() => setEditingTitle(true)} title="Click to edit dream title" className="break-words text-left text-2xl font-semibold tracking-tight text-[var(--sortd-navy)] hover:text-[var(--sortd-teal-dark)] sm:text-3xl">{activeDream.title || "Untitled dream"}</button>}
                <button type="button" onClick={() => setDeleteId(activeDream.id)} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm text-red-600 hover:bg-red-50"><Trash2 size={15} /> Delete dream</button>
              </div>
              <div><label htmlFor="dream-description" className="mb-2 block text-sm font-semibold text-[var(--sortd-navy)]">What does this dream look or feel like?</label><textarea id="dream-description" rows={3} value={activeDream.description ?? ""} onChange={event => updateDream(activeDream.id, { description: event.target.value })} placeholder="Why does this matter to you?" className={fieldClass + " resize-y"} /></div>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--sortd-border)] bg-[var(--sortd-surface)] p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--sortd-navy)]"><Sparkles size={18} className="text-[var(--sortd-teal-dark)]" /> Dream progress</h2><p className="mt-1 text-sm text-[var(--sortd-text-muted)]">How your goals and projects contribute to this dream.</p></div><span className="text-xl font-semibold text-[var(--sortd-navy)]">{summary?.progress === null ? "—" : `${summary?.progress ?? 0}%`}</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--sortd-muted)]"><div className="h-full rounded-full bg-[var(--sortd-teal-dark)]" style={{ width: `${summary?.progress ?? 0}%` }} /></div>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-[var(--sortd-text-muted)]"><span>{summary?.linkedGoals.length ?? 0} linked goals</span><span>{summary?.linkedProjects.length ?? 0} linked projects</span><span>{summary?.completedTasks ?? 0} of {summary?.totalTasks ?? 0} linked tasks completed</span></div>
          </div>

          <div className="rounded-2xl border border-[var(--sortd-border)] bg-[var(--sortd-surface)] p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--sortd-navy)]"><Target size={19} className="text-[var(--sortd-teal-dark)]" /> Linked goals</h2><p className="mt-1 text-sm text-[var(--sortd-text-muted)]">The steps that bring this dream closer.</p></div><button type="button" onClick={() => addGoal(activeDream.id)} className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--sortd-navy)] px-4 py-2.5 text-sm font-semibold text-white"><Plus size={16} /> Add goal</button></div>
            {!summary?.linkedGoals.length ? <p className="rounded-xl bg-[var(--sortd-muted)] p-5 text-sm text-[var(--sortd-text-muted)]">No goals linked yet. You can leave this as a dream for as long as you like.</p> : <div className="grid gap-3 md:grid-cols-2">{summary.linkedGoals.map(goal => {
              const goalProjects = projects.filter(project => project.goalId === goal.id);
              return <button key={goal.id} type="button" onClick={() => onOpenGoal?.(goal.id)} disabled={!onOpenGoal} className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-[var(--sortd-border)] bg-white p-4 text-left transition hover:bg-[var(--sortd-muted)] disabled:cursor-default"><div className="min-w-0"><div className={`break-words text-sm font-semibold ${goal.status === "completed" ? "text-[var(--sortd-text-muted)] line-through" : "text-[var(--sortd-navy)]"}`}>{goal.title}</div><p className="mt-1 text-xs text-[var(--sortd-text-muted)]">{goalProjects.length} {goalProjects.length === 1 ? "project" : "projects"} · {goal.status}</p></div><ArrowRight size={17} className="shrink-0 text-[var(--sortd-teal-dark)]" /></button>;
            })}</div>}
          </div>
        </div>
      )}

      <ConfirmDialog open={Boolean(deleteId)} title="Delete dream?" description={deleteDream ? `Delete “${deleteDream.title}”?${deleteGoalCount ? ` It has ${deleteGoalCount} linked ${deleteGoalCount === 1 ? "goal" : "goals"}, which will remain in Goals.` : ""} This can't be undone.` : "Delete this dream? This can't be undone."} confirmLabel="Delete dream" onCancel={() => setDeleteId(null)} onConfirm={() => { if (!deleteId) return; onChangeDreams(dreams.filter(dream => dream.id !== deleteId)); if (activeId === deleteId) setActiveId(null); setDeleteId(null); }} />
    </section>
  );
}

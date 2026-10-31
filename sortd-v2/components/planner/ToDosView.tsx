"use client";

import { useMemo, useState } from "react";
import { Check, Plus, Search, Trash2, CalendarDays, RotateCcw } from "lucide-react";
import type { AdhocTask } from "@/lib/types";

type Filter = "inbox" | "today" | "upcoming" | "completed" | "all";
type Props = {
  adhocTasks: AdhocTask[];
  onAddAdhocTask: (task: AdhocTask) => void;
  onCompleteAdhocTask: (id: string) => void;
  onUpdateAdhocTask: (id: string, updates: Partial<AdhocTask>) => void;
  onDeleteAdhocTask: (id: string) => void;
};

const dateKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const fmt = (value: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(`${value}T12:00:00`));

export default function ToDosView({ adhocTasks, onAddAdhocTask, onCompleteAdhocTask, onUpdateAdhocTask, onDeleteAdhocTask }: Props) {
  const [filter, setFilter] = useState<Filter>("inbox");
  const [title, setTitle] = useState("");
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const today = dateKey();

  const counts = useMemo(() => ({
    inbox: adhocTasks.filter(t => !t.completed && !t.plannedDate).length,
    today: adhocTasks.filter(t => !t.completed && t.plannedDate && t.plannedDate <= today).length,
    upcoming: adhocTasks.filter(t => !t.completed && t.plannedDate && t.plannedDate > today).length,
    completed: adhocTasks.filter(t => t.completed).length,
    all: adhocTasks.filter(t => !t.completed).length,
  }), [adhocTasks, today]);

  const visible = useMemo(() => adhocTasks.filter(t => {
    if (filter === "inbox" && (t.completed || t.plannedDate)) return false;
    if (filter === "today" && (t.completed || !t.plannedDate || t.plannedDate > today)) return false;
    if (filter === "upcoming" && (t.completed || !t.plannedDate || t.plannedDate <= today)) return false;
    if (filter === "completed" && !t.completed) return false;
    if (filter === "all" && t.completed) return false;
    return `${t.title} ${t.notes ?? ""}`.toLowerCase().includes(query.toLowerCase());
  }).sort((a, b) => (a.plannedDate ?? "9999").localeCompare(b.plannedDate ?? "9999") || a.order - b.order), [adhocTasks, filter, query, today]);

  function add() {
    const trimmed = title.trim();
    if (!trimmed) return;
    onAddAdhocTask({ id: crypto.randomUUID(), title: trimmed, completed: false, context: "personal", createdAt: new Date().toISOString(), order: Math.max(0, ...adhocTasks.map(t => t.order)) + 1 });
    setTitle("");
    setFilter("inbox");
  }

  const tabs: { key: Filter; label: string }[] = [
    { key: "inbox", label: "Inbox" }, { key: "today", label: "Today" },
    { key: "upcoming", label: "Upcoming" }, { key: "all", label: "All" },
    { key: "completed", label: "Completed" },
  ];

  return <div className="min-w-0 space-y-5 rounded-3xl border border-[var(--sortd-border)] bg-[var(--sortd-surface)] p-3 sm:p-6">
    <header className="rounded-2xl bg-[var(--sortd-navy)] p-5 text-white sm:p-7">
      <h1 className="text-2xl font-semibold sm:text-3xl">To-dos<span className="text-[var(--sortd-teal)]">.</span></h1>
      <p className="mt-2 text-sm text-white/75">Capture it now. Decide when to do it later.</p>
    </header>

    <form onSubmit={e => { e.preventDefault(); add(); }} className="flex min-w-0 gap-2 rounded-2xl border border-[var(--sortd-border)] bg-white p-3 shadow-sm">
      <input aria-label="New to-do" value={title} onChange={e => setTitle(e.target.value)} placeholder="What do you need to do?" className="min-h-11 min-w-0 flex-1 bg-transparent px-2 text-base outline-none placeholder:text-[var(--sortd-text-muted)]" />
      <button type="submit" disabled={!title.trim()} className="flex min-h-11 items-center gap-1 rounded-xl bg-[var(--sortd-teal-dark)] px-4 text-sm font-semibold text-white disabled:opacity-40"><Plus size={17}/> Add</button>
    </form>

    <div className="flex flex-wrap gap-2" role="group" aria-label="To-do views">
      {tabs.map(tab => <button key={tab.key} type="button" onClick={() => { setFilter(tab.key); setExpandedId(null); }} aria-pressed={filter === tab.key} className={`min-h-10 rounded-xl border px-3 py-2 text-sm font-medium ${filter === tab.key ? "border-[var(--sortd-teal-dark)] bg-[#e9f4f0] text-[var(--sortd-teal-dark)]" : "border-[var(--sortd-border)] bg-white text-[var(--sortd-text-muted)]"}`}>{tab.label} <span className="ml-1 tabular-nums opacity-70">{counts[tab.key]}</span></button>)}
    </div>

    <section className="min-w-0 rounded-2xl border border-[var(--sortd-border)] bg-white p-3 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold text-[var(--sortd-navy)]">{tabs.find(t => t.key === filter)?.label}</h2>
        <label className="flex min-h-10 min-w-0 items-center gap-2 rounded-lg border border-[var(--sortd-border)] px-3"><Search size={15} className="text-[var(--sortd-text-muted)]"/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Find a to-do" aria-label="Search to-dos" className="min-w-0 bg-transparent text-sm outline-none" /></label>
      </div>
      {!visible.length && <p className="rounded-xl bg-[var(--sortd-muted)] p-5 text-sm text-[var(--sortd-text-muted)]">{query ? "No matching to-dos." : filter === "inbox" ? "Your inbox is clear. Add anything you want to remember." : "Nothing here at the moment."}</p>}
      <div className="divide-y divide-[var(--sortd-border)]">
        {visible.map(task => <article key={task.id} className="py-2">
          <div className="flex min-w-0 items-center gap-2">
            <button type="button" onClick={() => task.completed ? onUpdateAdhocTask(task.id, { completed: false }) : onCompleteAdhocTask(task.id)} aria-label={task.completed ? `Reopen ${task.title}` : `Complete ${task.title}`} className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${task.completed ? "border-[var(--sortd-teal-dark)] bg-[#e9f4f0] text-[var(--sortd-teal-dark)]" : "border-[var(--sortd-border)] text-[var(--sortd-teal-dark)] hover:bg-[#e9f4f0]"}`}>{task.completed ? <Check size={18}/> : <span className="h-4 w-4 rounded-full border border-current"/>}</button>
            <button type="button" onClick={() => setExpandedId(expandedId === task.id ? null : task.id)} aria-expanded={expandedId === task.id} className="min-w-0 flex-1 py-2 text-left"><span className={`block break-words text-sm font-medium ${task.completed ? "text-[var(--sortd-text-muted)] line-through" : "text-[var(--sortd-text)]"}`}>{task.title}</span><span className="mt-1 block text-xs text-[var(--sortd-text-muted)]">{task.plannedDate ? `${task.plannedDate < today && !task.completed ? "Planned earlier · " : ""}${fmt(task.plannedDate)}` : "Unscheduled"}{task.priority ? ` · ${task.priority} priority` : ""}</span></button>
            <button type="button" onClick={() => setExpandedId(expandedId === task.id ? null : task.id)} aria-label={`Edit ${task.title}`} className="min-h-10 shrink-0 rounded-lg px-2 text-xs font-semibold text-[var(--sortd-teal-dark)]">Edit</button>
          </div>
          {expandedId === task.id && <div className="ml-0 mt-2 grid gap-3 rounded-xl bg-[var(--sortd-muted)] p-3 sm:ml-12 sm:grid-cols-2">
            <label className="text-xs font-medium">Title<input value={task.title} onChange={e => onUpdateAdhocTask(task.id, { title: e.target.value })} className="mt-1 min-h-10 w-full min-w-0 rounded-lg border border-[var(--sortd-border)] bg-white px-3 text-base" /></label>
            <label className="text-xs font-medium">Plan for<input type="date" value={task.plannedDate ?? ""} onChange={e => onUpdateAdhocTask(task.id, { plannedDate: e.target.value || undefined })} className="mt-1 min-h-10 w-full min-w-0 rounded-lg border border-[var(--sortd-border)] bg-white px-3 text-base" /></label>
            <label className="text-xs font-medium">Priority<select value={task.priority ?? ""} onChange={e => onUpdateAdhocTask(task.id, { priority: (e.target.value || undefined) as AdhocTask["priority"] })} className="mt-1 min-h-10 w-full rounded-lg border border-[var(--sortd-border)] bg-white px-3 text-base"><option value="">None</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
            <label className="text-xs font-medium">Notes<textarea value={task.notes ?? ""} onChange={e => onUpdateAdhocTask(task.id, { notes: e.target.value })} rows={2} className="mt-1 w-full rounded-lg border border-[var(--sortd-border)] bg-white px-3 py-2 text-base" /></label>
            <div className="flex flex-wrap gap-2 sm:col-span-2"><button type="button" onClick={() => onUpdateAdhocTask(task.id, { plannedDate: undefined })} className="flex min-h-10 items-center gap-1 rounded-lg bg-white px-3 text-xs"><CalendarDays size={14}/> Clear planned date</button>{task.completed && <button type="button" onClick={() => onUpdateAdhocTask(task.id, { completed: false })} className="flex min-h-10 items-center gap-1 rounded-lg bg-white px-3 text-xs"><RotateCcw size={14}/> Reopen</button>}<button type="button" onClick={() => { if (window.confirm(`Delete “${task.title}”?`)) onDeleteAdhocTask(task.id); }} className="flex min-h-10 items-center gap-1 rounded-lg bg-white px-3 text-xs text-red-700"><Trash2 size={14}/> Delete</button></div>
          </div>}
        </article>)}
      </div>
    </section>
  </div>;
}

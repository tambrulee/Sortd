"use client";

import { useEffect, useMemo, useState } from "react";
import CoverPicker from "@/components/covers/CoverPicker";
import { supabase } from "@/lib/supabase";
import type { ProjectCover } from "@/lib/types";
import { Activity, ArrowDown, ArrowUp, Bike, Check, ChevronLeft, Dumbbell, Footprints, HeartPulse, Plus, Search, Trash2, Waves, X } from "lucide-react";
import type { FitnessData, FitnessLibraryExercise, FitnessMeasure, FitnessRegime, FitnessRegimeExercise, FitnessSession } from "@/lib/types";

type Props = { data: FitnessData; onChange: (data: FitnessData) => void; saveStatus?: "loading" | "saving" | "saved" | "error" };
type Tab = "overview" | "exercises" | "history";
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const CATEGORIES = ["Strength", "Cardio", "Calisthenics", "Swimming", "Yoga", "Pilates", "Mobility & Stretching", "HIIT & Circuit Training", "Functional Fitness", "Sports & Activities", "Core", "Running", "Cycling", "Other"];
const MEASURES: { id: FitnessMeasure; label: string }[] = [{ id: "weight", label: "Weight (kg)" }, { id: "reps", label: "Reps" }, { id: "distance", label: "Distance" }, { id: "duration", label: "Duration (min)" }];
const uid = () => crypto.randomUUID();
const card = "rounded-2xl border border-[var(--sortd-border)] bg-[var(--sortd-card)] shadow-sm";
const input = "w-full min-w-0 rounded-xl border border-[var(--sortd-border)] bg-white px-3 py-2.5 text-sm text-[var(--sortd-text)] outline-none focus:border-[var(--sortd-teal-dark)]";
const primary = "inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--sortd-navy)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40";
const secondary = "inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--sortd-border)] bg-white px-3 py-2 text-sm hover:bg-[var(--sortd-muted)] disabled:opacity-40";
function CategoryIcon({ category, size = 21 }: { category: string; size?: number }) {
  const Icon = category === "Swimming" ? Waves : category === "Running" ? Footprints : category === "Cycling" ? Bike : category === "Strength" ? Dumbbell : category === "Cardio" ? HeartPulse : Activity;
  return <Icon size={size} strokeWidth={1.7} />;
}
function WorkoutCover({ cover, className = "" }: { cover?: ProjectCover; className?: string }) {
  const [signed, setSigned] = useState<{ path: string; url: string } | null>(null);
  const uploadPath = cover?.source === "upload" ? cover.path : null;
  useEffect(() => {
    if (!uploadPath) return;
    let cancelled = false;
    void supabase.storage.from("project-covers").createSignedUrl(uploadPath, 3600).then(({ data, error }) => {
      if (!cancelled) setSigned(error || !data?.signedUrl ? null : { path: uploadPath, url: data.signedUrl });
    });
    return () => { cancelled = true; };
  }, [uploadPath]);
  const url = cover?.source === "unsplash" ? cover.url : uploadPath && signed?.path === uploadPath ? signed.url : null;
  return url ? <img src={url} alt="" className={`absolute inset-0 h-full w-full object-cover ${className}`} /> : null;
}
export default function FitnessView({ data, onChange, saveStatus }: Props) {
  const [tab, setTab] = useState<Tab>("overview");
  const [coverFor, setCoverFor] = useState<string | null>(null);
  const covers = (data as FitnessData & { covers?: Record<string, ProjectCover> }).covers ?? {};
  const setCover = (workoutId: string, cover?: ProjectCover) => {
    const next = { ...covers };
    if (cover) next[workoutId] = cover; else delete next[workoutId];
    onChange({ ...data, covers: next } as FitnessData);
    setCoverFor(null);
  };
  const [editing, setEditing] = useState<string | null>(null);
  const [creatingWorkout, setCreatingWorkout] = useState(false);
  const [workoutName, setWorkoutName] = useState("");
  const [workoutCategory, setWorkoutCategory] = useState("Strength");
  const [search, setSearch] = useState("");
  const [libraryCategoryFilter, setLibraryCategoryFilter] = useState("all");
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [bulkCategory, setBulkCategory] = useState("");
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerCategoryFilter, setPickerCategoryFilter] = useState("all");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [exerciseForm, setExerciseForm] = useState(false);
  const [editingExercise, setEditingExercise] = useState<string | null>(null);
  const [exerciseName, setExerciseName] = useState("");
  const [exerciseCategory, setExerciseCategory] = useState("Strength");
  const [measures, setMeasures] = useState<FitnessMeasure[]>(["weight", "reps"]);
  const [distanceUnit, setDistanceUnit] = useState<"km" | "m">("km");
  const [showAllHistory, setShowAllHistory] = useState(false);

  const migrated = useMemo(() => {
    const exercises: FitnessLibraryExercise[] = [];
    const regimes: FitnessRegime[] = [];
    const seen = new Map<string, string>();
    for (const workout of data.workouts ?? []) {
      const entries: FitnessRegimeExercise[] = [];
      for (const old of workout.exercises) {
        const key = old.name.trim().toLowerCase();
        let exerciseId = seen.get(key);
        if (!exerciseId) { exerciseId = `legacy-exercise-${old.id}`; seen.set(key, exerciseId); exercises.push({ id: exerciseId, name: old.name, category: "Strength", measures: ["weight", "reps"] }); }
        entries.push({ id: `legacy-entry-${old.id}`, exerciseId, sets: old.sets, reps: old.reps, weightKg: old.weightKg });
      }
      regimes.push({ id: `legacy-regime-${workout.id}`, name: workout.name, category: "Strength", description: workout.description, exercises: entries, createdAt: workout.createdAt });
    }
    return { exercises, regimes };
  }, [data.workouts]);
  const exercises = data.exercises ?? migrated.exercises;
  const regimes = data.regimes ?? migrated.regimes;
  const weeklyPlan = data.weeklyPlan ?? [];
  const sessions = data.sessions ?? [];
  const active = [...sessions].reverse().find(s => !s.completedAt) ?? null;
  const completed = [...sessions].filter(s => s.completedAt).sort((a,b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""));
  const current = regimes.find(r => r.id === editing);
  const lookup = (exerciseId: string) => exercises.find(e => e.id === exerciseId);
  function update(patch: Partial<FitnessData>) { onChange({ ...data, exercises, regimes, weeklyPlan, ...patch }); }
  function saveWorkout(workout: FitnessRegime) { update({ regimes: regimes.map(r => r.id === workout.id ? workout : r) }); }
  function newWorkout() {
    if (!workoutName.trim()) return;
    const workout: FitnessRegime = { id: uid(), name: workoutName.trim(), category: workoutCategory, exercises: [], createdAt: new Date().toISOString() };
    update({ regimes: [...regimes, workout] }); setCreatingWorkout(false); setWorkoutName(""); setEditing(workout.id); setPickerOpen(false); setTab("overview");
  }
  function beginExerciseEdit(exercise?: FitnessLibraryExercise) {
    setEditingExercise(exercise?.id ?? null); setExerciseName(exercise?.name ?? ""); setExerciseCategory(exercise?.category ?? "Strength"); setMeasures(exercise?.measures ?? ["weight", "reps"]); setDistanceUnit(exercise?.distanceUnit ?? "km"); setExerciseForm(true); setTab("exercises");
  }
  function saveExercise() {
    if (!exerciseName.trim() || !measures.length) return;
    const next: FitnessLibraryExercise = { id: editingExercise ?? uid(), name: exerciseName.trim(), category: exerciseCategory, measures, distanceUnit };
    update({ exercises: editingExercise ? exercises.map(e => e.id === editingExercise ? next : e) : [...exercises, next] });
    setExerciseForm(false); setExerciseName(""); setEditingExercise(null);
  }
  function addToWorkout(exercise: FitnessLibraryExercise) {
    if (!current) return;
    const entry: FitnessRegimeExercise = { id: uid(), exerciseId: exercise.id, sets: exercise.measures.some(m => m === "weight" || m === "reps") ? 3 : undefined, reps: exercise.measures.includes("reps") ? 10 : undefined, weightKg: exercise.measures.includes("weight") ? 0 : undefined, distance: exercise.measures.includes("distance") ? 0 : undefined, durationMinutes: exercise.measures.includes("duration") ? 0 : undefined };
    saveWorkout({ ...current, exercises: [...current.exercises, entry] }); setPickerSearch("");
  }
  function moveEntry(index: number, delta: number) {
    if (!current) return;
    const target = index + delta; if (target < 0 || target >= current.exercises.length) return;
    const entries = [...current.exercises]; [entries[index], entries[target]] = [entries[target], entries[index]];
    saveWorkout({ ...current, exercises: entries });
  }
  function startWorkout(workout: FitnessRegime) {
    if (active && !window.confirm("Discard the current workout and start a new one?")) return;
    const session: FitnessSession = {
      id: uid(), workoutId: workout.id, workoutName: workout.name,
      startedAt: new Date().toISOString(),
      exercises: workout.exercises.map(entry => ({
        id: uid(), exerciseId: entry.exerciseId,
        name: lookup(entry.exerciseId)?.name ?? "Exercise",
        sets: Array.from({ length: Math.max(1, entry.sets ?? 1) }, () => ({
          id: uid(), reps: entry.reps ?? 0, weightKg: entry.weightKg ?? 0, completed: false
        }))
      }))
    };
    update({ sessions: [...sessions.filter(s => s.completedAt), session] });
    setTab("overview"); setEditing(null);
  }
  function markExercise(exerciseId: string, checked: boolean) {
    if (!active) return;
    update({ sessions: sessions.map(s => s.id !== active.id ? s : {
      ...s, exercises: s.exercises.map(item => item.id !== exerciseId ? item : {
        ...item, sets: item.sets.map(set => ({ ...set, completed: checked }))
      })
    }) });
  }
  function discardWorkout() {
    if (!active || !window.confirm("Discard this session? Your progress will be deleted.")) return;
    update({ sessions: sessions.filter(s => s.id !== active.id) });
  }
  function finishWorkout() {
    if (!active) return;
    update({ sessions: sessions.map(s => s.id === active.id ? { ...s, completedAt: new Date().toISOString() } : s) });
    setEditing(null); setTab("history");
  }
  const visibleExercises = exercises.filter(e => (libraryCategoryFilter === "all" || e.category === libraryCategoryFilter) && `${e.name} ${e.category}`.toLowerCase().includes(search.trim().toLowerCase()));
  const pickerExercises = exercises.filter(e => (pickerCategoryFilter === "all" || e.category === pickerCategoryFilter) && `${e.name} ${e.category}`.toLowerCase().includes(pickerSearch.trim().toLowerCase()));
  return <main className="min-w-0 space-y-5 rounded-2xl border border-[var(--sortd-border)] bg-[var(--sortd-surface)] p-4 text-[var(--sortd-text)] shadow-sm sm:p-5">
    <header className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-semibold">Fitness</h1><p className="mt-1 text-sm text-[var(--sortd-text-muted)]">Build your workouts. Train your way.</p>{saveStatus && <p role="status" className={`mt-1 text-xs ${saveStatus === "error" ? "font-semibold text-red-700" : "text-[var(--sortd-text-muted)]"}`}>{saveStatus === "loading" ? "Loading workspace…" : saveStatus === "saving" ? "Saving changes…" : saveStatus === "saved" ? "All changes saved" : "Save failed — do not refresh"}</p>}</div><button className={primary} onClick={() => { setTab("overview"); setEditing(null); setCreatingWorkout(true); }}><Plus size={17}/> New workout</button></header>
    {active && tab !== "history" ? <section className={`${card} space-y-4 p-4 sm:p-6`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="text-xs font-semibold uppercase tracking-wider text-[var(--sortd-teal-dark)]">In progress</p><h2 className="mt-1 text-xl font-semibold">{active.workoutName}</h2><p className="mt-1 text-sm text-[var(--sortd-text-muted)]">{active.exercises.filter(e => e.sets.every(s => s.completed)).length} of {active.exercises.length} exercises completed</p></div>
        <div className="flex flex-wrap gap-2"><button className={secondary} onClick={() => setTab("history")}>History &amp; progress</button><button className={secondary} onClick={discardWorkout}>Discard</button></div>
      </div>
      <p className="text-sm text-[var(--sortd-text-muted)]">Tick each exercise when you&apos;ve finished all its sets. Your targets are shown alongside it.</p>
      <div className="overflow-hidden rounded-xl border border-[var(--sortd-border)] bg-white divide-y divide-[var(--sortd-border)]">
        {active.exercises.map((exercise, index) => {
          const done = exercise.sets.every(set => set.completed);
          const first = exercise.sets[0];
          const regimeEntry = regimes.find(r => r.id === active.workoutId)?.exercises[index];
          const libraryExercise = lookup(exercise.exerciseId);
          const targets = [
            `${exercise.sets.length} ${exercise.sets.length === 1 ? "set" : "sets"}`,
            libraryExercise?.measures.includes("reps") && first?.reps != null ? `${first.reps} reps` : null,
            libraryExercise?.measures.includes("weight") && first?.weightKg != null ? `${first.weightKg} kg` : null,
            libraryExercise?.measures.includes("distance") && regimeEntry?.distance != null ? `${regimeEntry.distance} ${libraryExercise.distanceUnit ?? "km"}` : null,
            libraryExercise?.measures.includes("duration") && regimeEntry?.durationMinutes != null ? `${regimeEntry.durationMinutes} min` : null,
          ].filter(Boolean).join(" · ");
          return <label key={exercise.id} className={`flex cursor-pointer items-center gap-3 px-3 py-3 sm:px-4 ${done ? "bg-[#e6f3ef]" : "hover:bg-[var(--sortd-muted)]"}`}>
            <input type="checkbox" className="h-5 w-5 shrink-0 accent-[var(--sortd-teal-dark)]" checked={done} onChange={event => markExercise(exercise.id, event.target.checked)}/>
            <span className="flex min-w-0 flex-1 flex-col gap-1"><span className={`block text-sm font-semibold leading-5 ${done ? "text-[var(--sortd-teal-dark)]" : ""}`}>{exercise.name}</span><span className="block text-xs leading-5 text-[var(--sortd-text-muted)] sm:text-sm">{targets}</span></span>
            {done && <Check size={17} className="shrink-0 text-[var(--sortd-teal-dark)]"/>}
          </label>;
        })}
      </div>
      <button className={primary} onClick={finishWorkout}><Check size={17}/> Finish workout</button>
    </section> : <>
    <nav aria-label="Fitness sections" className="flex flex-wrap gap-2">{([["overview","Overview"],["exercises","Exercises"],["history","History & progress"]] as const).map(([key,label]) => <button key={key} className={tab === key ? primary : secondary} onClick={() => { setTab(key); setEditing(null); }}>{label}</button>)}</nav>
    {tab === "overview" && <div className="space-y-6">
      {creatingWorkout && <form onSubmit={e => { e.preventDefault(); newWorkout(); }} className={`${card} space-y-3 p-4`}><div className="flex items-center justify-between"><h2 className="font-semibold">New workout</h2><button type="button" aria-label="Close" onClick={() => setCreatingWorkout(false)}><X size={18}/></button></div><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">Workout name<input autoFocus className={`${input} mt-1`} value={workoutName} placeholder="e.g. Leg Day" onChange={e => setWorkoutName(e.target.value)}/></label><label className="text-sm">Workout type<select className={`${input} mt-1`} value={workoutCategory} onChange={e => setWorkoutCategory(e.target.value)}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></label></div><button type="submit" disabled={!workoutName.trim()} className={primary}>Create workout</button></form>}
      {current ? <section className={`${card} overflow-hidden`}>
        <div className="relative h-44 overflow-hidden rounded-t-2xl bg-gradient-to-br from-[#1f0825] via-[#477b73] to-[#cdbfd1] sm:h-48" style={{ backgroundImage: "linear-gradient(115deg, #1f0825 0%, #477b73 58%, #cdbfd1 100%)" }}>
          <WorkoutCover cover={covers[current.id]} />
          {!covers[current.id] && <div className="absolute inset-0 flex items-center justify-center text-white/70"><CategoryIcon category={current.category ?? "Strength"} size={64}/></div>}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 to-transparent" />
          <button type="button" onClick={() => setCoverFor(current.id)} className="absolute bottom-3 right-3 z-10 rounded-lg bg-white/95 px-3 py-2 text-xs font-semibold text-slate-900 shadow-sm hover:bg-white">{covers[current.id] ? "Change cover" : "Change cover"}</button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-5 sm:px-6">
          <div className="min-w-0"><button type="button" className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-[var(--sortd-teal-dark)] hover:underline" onClick={() => setEditing(null)}><ChevronLeft size={16}/> All workouts</button><h2 className="break-words text-2xl font-semibold text-[var(--sortd-text)]">{current.name || "Untitled workout"}</h2><p className="mt-1 text-sm text-[var(--sortd-text-muted)]">{current.category ?? "Strength"} · {current.exercises.length} exercises</p></div>
          <span className="rounded-full bg-[#e6f3ef] px-3 py-1 text-xs font-semibold text-[#0f766e]">{current.category ?? "Strength"}</span>
        </div>
        <div className="space-y-5 bg-white p-4 sm:p-6">
          <div className="space-y-3 rounded-xl bg-[var(--sortd-muted)] p-3 sm:p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-end">
              <label className="min-w-0 flex-1 text-xs font-medium text-[var(--sortd-text-muted)]">Workout name<input className={`${input} mt-1`} value={current.name} onChange={e => saveWorkout({ ...current, name: e.target.value })}/></label>
              <label className="min-w-0 text-xs font-medium text-[var(--sortd-text-muted)] md:w-56 md:shrink-0">Type<select className={`${input} mt-1`} value={current.category ?? "Strength"} onChange={e => saveWorkout({ ...current, category: e.target.value })}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></label>
            </div>
            <label className="block text-xs font-medium text-[var(--sortd-text-muted)]">Description (optional)<input className={`${input} mt-1`} value={current.description ?? ""} onChange={e => saveWorkout({ ...current, description: e.target.value })} placeholder="A short note about this workout"/></label>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#e6f3ef] px-4 py-4"><div><h3 className="font-semibold text-[var(--sortd-navy)]">Exercises <span className="ml-1 text-sm font-normal text-[var(--sortd-text-muted)]">({current.exercises.length})</span></h3><p className="text-xs text-[var(--sortd-text-muted)]">Reorder or adjust your targets.</p></div><button className={secondary} onClick={() => setPickerOpen(v => !v)}><Plus size={15}/> Add exercise</button></div>
        <div className="space-y-2 rounded-xl bg-[var(--sortd-muted)] p-2 sm:p-3">
          {current.exercises.map((entry,i) => {
            const exercise = lookup(entry.exerciseId);
            if (!exercise) return null;
            const fields: { key: keyof FitnessRegimeExercise; label: string; step: string }[] = [
              ...(exercise.measures.some(m => m === "weight" || m === "reps") ? [{ key: "sets" as const, label: "Sets", step: "1" }] : []),
              ...(exercise.measures.includes("reps") ? [{ key: "reps" as const, label: "Reps", step: "1" }] : []),
              ...(exercise.measures.includes("weight") ? [{ key: "weightKg" as const, label: "kg", step: "0.5" }] : []),
              ...(exercise.measures.includes("distance") ? [{ key: "distance" as const, label: exercise.distanceUnit ?? "km", step: "0.1" }] : []),
              ...(exercise.measures.includes("duration") ? [{ key: "durationMinutes" as const, label: "Minutes", step: "1" }] : []),
            ];
            return <div key={entry.id} className="flex min-w-0 flex-col gap-3 rounded-lg border border-[var(--sortd-border)] bg-[var(--sortd-surface)] px-3 py-3 lg:flex-row lg:items-center">
              <div className="flex w-full min-w-0 items-center gap-2 lg:w-auto lg:min-w-[180px] lg:flex-1 lg:max-w-[300px]">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white text-[var(--sortd-teal-dark)]"><CategoryIcon category={exercise.category} size={15}/></div>
                <div className="min-w-0"><p className="truncate text-sm font-semibold" title={exercise.name}>{exercise.name}</p><p className="truncate text-[11px] text-[var(--sortd-text-muted)]">{exercise.category}</p></div>
              </div>
              <div className="grid w-full min-w-0 grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:w-auto lg:flex-1 lg:items-end">
                {fields.map(f => <label key={f.key} className="min-w-0 flex-1 text-[11px] text-[var(--sortd-text-muted)]">{f.label}<input type="number" min="0" step={f.step} className={`${input} mt-0.5 !h-9 !min-w-0 !px-2 !py-1 text-sm`} value={entry[f.key] ?? 0} onChange={ev => saveWorkout({ ...current, exercises: current.exercises.map(x => x.id === entry.id ? { ...x, [f.key]: Math.max(0, Number(ev.target.value)||0) } : x) })}/></label>)}
              </div>
              <div className="flex w-full items-center justify-end gap-2 border-t border-[var(--sortd-border)] pt-2 lg:ml-auto lg:w-auto lg:shrink-0 lg:border-0 lg:pt-0">
                <button aria-label={`Move ${exercise.name} up`} title="Move up" className={`${secondary} !p-2.5`} disabled={i===0} onClick={() => moveEntry(i,-1)}><ArrowUp size={14}/></button>
                <button aria-label={`Move ${exercise.name} down`} title="Move down" className={`${secondary} !p-2.5`} disabled={i===current.exercises.length-1} onClick={() => moveEntry(i,1)}><ArrowDown size={14}/></button>
                <button aria-label={`Remove ${exercise.name}`} title="Remove exercise" className={`${secondary} !p-2.5`} onClick={() => saveWorkout({ ...current, exercises: current.exercises.filter(x => x.id !== entry.id) })}><X size={14}/></button>
              </div>
            </div>;
          })}
          {!current.exercises.length && <p className="rounded-xl border border-dashed border-[var(--sortd-border)] p-5 text-center text-sm text-[var(--sortd-text-muted)]">No exercises yet. Choose from your library below.</p>}
        </div>
{pickerOpen && <div className="rounded-xl border border-[var(--sortd-border)] bg-[var(--sortd-surface)] p-3"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h4 className="text-sm font-semibold">Add from exercise library</h4><button className="text-xs font-medium text-[var(--sortd-teal-dark)]" onClick={() => beginExerciseEdit()}>+ Create exercise</button></div><div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_minmax(180px,240px)]"><div className="relative min-w-0"><Search size={17} className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-[var(--sortd-text-muted)]"/><input aria-label="Search workout exercises" className={`${input} !pl-11`} placeholder="Search exercises..." value={pickerSearch} onChange={e => setPickerSearch(e.target.value)}/></div><select aria-label="Filter workout exercises by category" className={`${input} min-w-0`} value={pickerCategoryFilter} onChange={e=>setPickerCategoryFilter(e.target.value)}><option value="all">All categories</option>{CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</select></div><div className="max-h-56 space-y-1 overflow-y-auto">{pickerExercises.map(e => <button key={e.id} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-[var(--sortd-muted)]" onClick={() => addToWorkout(e)}><span>{e.name} <span className="text-xs text-[var(--sortd-text-muted)]">· {e.category}</span></span><Plus size={17}/></button>)}{!pickerExercises.length && <p className="p-3 text-sm text-[var(--sortd-text-muted)]">{exercises.length ? "No exercises match your filters." : "Create your first reusable exercise in Exercises."}</p>}</div></div>}<div className="flex flex-wrap justify-between gap-2 border-t border-[var(--sortd-border)] pt-4"><button className={secondary} onClick={() => setEditing(null)}>Done editing</button><button className={primary} disabled={!current.exercises.length} onClick={() => startWorkout(current)}>Start workout</button></div></div></section> : <>
      <section><div className="mb-3 flex flex-wrap items-end justify-between gap-2"><div><h2 className="text-lg font-semibold">Your workouts</h2><p className="text-sm text-[var(--sortd-text-muted)]">Pick a card to build or edit your training session.</p></div><span className="text-sm text-[var(--sortd-text-muted)]">{regimes.length} workouts</span></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{regimes.map(r => <article key={r.id} className={`${card} overflow-hidden`}><button className="w-full text-left" onClick={() => setEditing(r.id)}><div className={`relative flex h-36 items-end overflow-hidden bg-gradient-to-br from-[#1f0825] via-[#477b73] to-[#cdbfd1] p-4 text-white`}><WorkoutCover cover={covers[r.id]}/>{!covers[r.id] && <div className="absolute inset-0 flex items-center justify-center text-white/65"><CategoryIcon category={r.category ?? "Strength"} size={48}/></div>}{covers[r.id] && <div className="absolute inset-0 bg-black/35"/>}<div className="absolute right-4 top-4 rounded-xl bg-white/20 p-2"><CategoryIcon category={r.category ?? "Strength"} size={24}/></div><span className="rounded-full bg-black/20 px-2.5 py-1 text-xs font-medium">{r.category ?? "Strength"}</span></div><div className="p-4"><h3 className="text-base font-semibold">{r.name}</h3><p className="mt-1 text-xs text-[var(--sortd-text-muted)]">{r.exercises.length} exercises · {r.description || "Your training session"}</p><div className="mt-3 space-y-1">{r.exercises.slice(0,3).map(entry => <p key={entry.id} className="truncate text-xs text-[var(--sortd-text-muted)]">• {lookup(entry.exerciseId)?.name ?? "Exercise"}</p>)}{r.exercises.length>3 && <p className="text-xs text-[var(--sortd-text-muted)]">+ {r.exercises.length-3} more</p>}</div></div></button><div className="flex gap-2 border-t border-[var(--sortd-border)] px-4 py-3"><button className={`${secondary} flex-1`} onClick={() => setEditing(r.id)}>Edit</button><button className={`${primary} flex-1`} disabled={!r.exercises.length} onClick={() => startWorkout(r)}>Start</button><button className={secondary} aria-label={`Delete ${r.name}`} onClick={() => { if (window.confirm(`Delete ${r.name}? Completed history will remain.`)) update({ regimes: regimes.filter(x=>x.id!==r.id), weeklyPlan: weeklyPlan.filter(x=>x.regimeId!==r.id) }); }}><Trash2 size={15}/></button></div></article>)}<button onClick={() => setCreatingWorkout(true)} className="flex min-h-60 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--sortd-border)] text-[var(--sortd-text-muted)] hover:bg-white"><Plus size={27}/><span className="text-sm font-semibold">Create workout</span></button></div></section>
      <section className={`${card} p-4 sm:p-5`}><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-lg font-semibold">Your training week</h2><p className="text-sm text-[var(--sortd-text-muted)]">A repeating weekly plan, with room to be flexible.</p></div><span className="rounded-full bg-[var(--sortd-muted)] px-3 py-1 text-xs">{weeklyPlan.length} planned days</span></div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-7">{DAYS.map((day,i) => { const planned = weeklyPlan.find(x => x.day===i); const workout = regimes.find(r=>r.id===planned?.regimeId); return <div key={day} className="min-w-0 rounded-xl bg-[var(--sortd-muted)] p-3"><p className="mb-2 text-xs font-semibold">{day.slice(0,3)}</p><select aria-label={`Workout for ${day}`} className={`${input} !px-2 !py-2`} value={planned?.regimeId ?? ""} onChange={e => update({ weeklyPlan: [...weeklyPlan.filter(x=>x.day!==i), ...(e.target.value ? [{day:i,regimeId:e.target.value}] : [])] })}><option value="">Rest / flexible</option>{regimes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select>{workout && <button className="mt-2 text-left text-xs font-medium text-[var(--sortd-teal-dark)]" onClick={() => setEditing(workout.id)}>View workout</button>}</div>; })}</div></section>
      </>}
    </div>}
    {tab === "exercises" && <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-lg font-semibold">Exercise library</h2><p className="text-sm text-[var(--sortd-text-muted)]">Create once, reuse in any workout. Edit directly in the table.</p></div><button className={primary} onClick={() => beginExerciseEdit()}><Plus size={16}/> Add exercise</button></div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center"><div className="relative w-full min-w-0 sm:max-w-sm"><Search size={17} className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-[var(--sortd-text-muted)]"/><input aria-label="Search exercises" className={input} style={{ paddingLeft: "3rem" }} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search exercises or categories"/></div><select aria-label="Filter exercise library by category" className={`${input} sm:!w-56`} value={libraryCategoryFilter} onChange={e=>setLibraryCategoryFilter(e.target.value)}><option value="all">All categories</option>{CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</select>{(search || libraryCategoryFilter !== "all") && <button className={secondary} onClick={()=>{setSearch("");setLibraryCategoryFilter("all");}}>Clear filters</button>}<span className="text-xs text-[var(--sortd-text-muted)] sm:ml-auto">{visibleExercises.length} of {exercises.length} exercises</span></div>
      {selectedExercises.length > 0 && <div className="flex flex-wrap items-center gap-2 rounded-xl bg-[var(--sortd-muted)] p-3 text-sm"><strong>{selectedExercises.length} selected</strong><select aria-label="Bulk change category" className={`${input} !w-auto`} value={bulkCategory} onChange={e=>setBulkCategory(e.target.value)}><option value="">Choose category…</option>{CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</select><button className={secondary} disabled={!bulkCategory} onClick={()=>{update({exercises:exercises.map(e=>selectedExercises.includes(e.id)?{...e,category:bulkCategory}:e)});setSelectedExercises([]);setBulkCategory("");}}>Apply category</button><button className={secondary} onClick={()=>{if(!window.confirm(`Delete ${selectedExercises.length} selected exercises? They will also be removed from workouts.`))return;const ids=new Set(selectedExercises);update({exercises:exercises.filter(e=>!ids.has(e.id)),regimes:regimes.map(r=>({...r,exercises:r.exercises.filter(x=>!ids.has(x.exerciseId))}))});setSelectedExercises([]);}}>Delete selected</button><button className={secondary} onClick={()=>setSelectedExercises([])}>Clear</button></div>}
      <div className={`${card} overflow-hidden`}><div className="w-full overflow-x-auto"><table className="w-full min-w-[800px] border-collapse text-left text-sm"><thead className="bg-[var(--sortd-muted)] text-xs font-semibold uppercase tracking-wide text-[var(--sortd-text-muted)]"><tr><th className="w-12 px-4 py-3"><input aria-label="Select all visible exercises" type="checkbox" checked={visibleExercises.length>0 && visibleExercises.every(e=>selectedExercises.includes(e.id))} onChange={ev=>setSelectedExercises(prev=>ev.target.checked?Array.from(new Set([...prev,...visibleExercises.map(e=>e.id)])):prev.filter(id=>!visibleExercises.some(e=>e.id===id)))}/></th><th className="min-w-[200px] px-3 py-3">Exercise</th><th className="min-w-[180px] px-3 py-3">Category</th><th className="min-w-[220px] px-3 py-3">Tracking</th><th className="px-4 py-3 text-right">Actions</th></tr></thead><tbody>
      {exerciseForm && !editingExercise && <tr className="border-t border-[var(--sortd-border)] bg-[#e6f3ef]/60"><td className="px-4 py-3"><Plus size={16}/></td><td className="px-3 py-3"><input autoFocus aria-label="New exercise name" className={input} value={exerciseName} placeholder="Exercise name" onChange={e=>setExerciseName(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();saveExercise();}}}/></td><td className="px-3 py-3"><select aria-label="New exercise category" className={input} value={exerciseCategory} onChange={e=>setExerciseCategory(e.target.value)}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></td><td className="px-3 py-3"><div className="flex flex-wrap gap-x-3 gap-y-2">{MEASURES.map(m=><label key={m.id} className="flex items-center gap-1.5 text-xs"><input type="checkbox" checked={measures.includes(m.id)} onChange={e=>setMeasures(prev=>e.target.checked?[...prev,m.id]:prev.filter(x=>x!==m.id))}/>{m.label}</label>)}{measures.includes("distance")&&<select aria-label="Distance unit" className="rounded border border-[var(--sortd-border)] bg-white px-2 py-1 text-xs" value={distanceUnit} onChange={e=>setDistanceUnit(e.target.value as "km"|"m")}><option value="km">km</option><option value="m">m</option></select>}</div></td><td className="px-4 py-3"><div className="flex justify-end gap-2"><button className={primary} disabled={!exerciseName.trim()||!measures.length} onClick={saveExercise}><Check size={15}/> Save</button><button className={secondary} onClick={()=>setExerciseForm(false)}>Cancel</button></div></td></tr>}
      {visibleExercises.map(e=> editingExercise===e.id && exerciseForm ? <tr key={e.id} className="border-t border-[var(--sortd-border)] bg-[#e6f3ef]/60"><td className="px-4 py-3"/><td className="px-3 py-3"><input autoFocus aria-label={`Edit ${e.name} name`} className={input} value={exerciseName} onChange={ev=>setExerciseName(ev.target.value)} onKeyDown={ev=>{if(ev.key==="Enter"){ev.preventDefault();saveExercise();}}}/></td><td className="px-3 py-3"><select aria-label={`Edit ${e.name} category`} className={input} value={exerciseCategory} onChange={ev=>setExerciseCategory(ev.target.value)}>{!CATEGORIES.includes(exerciseCategory)&&<option>{exerciseCategory}</option>}{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></td><td className="px-3 py-3"><div className="flex flex-wrap gap-x-3 gap-y-2">{MEASURES.map(m=><label key={m.id} className="flex items-center gap-1.5 text-xs"><input type="checkbox" checked={measures.includes(m.id)} onChange={ev=>setMeasures(prev=>ev.target.checked?[...prev,m.id]:prev.filter(x=>x!==m.id))}/>{m.label}</label>)}{measures.includes("distance")&&<select aria-label="Distance unit" className="rounded border border-[var(--sortd-border)] bg-white px-2 py-1 text-xs" value={distanceUnit} onChange={ev=>setDistanceUnit(ev.target.value as "km"|"m")}><option value="km">km</option><option value="m">m</option></select>}</div></td><td className="px-4 py-3"><div className="flex justify-end gap-2"><button className={primary} disabled={!exerciseName.trim()||!measures.length} onClick={saveExercise}><Check size={15}/> Save</button><button className={secondary} onClick={()=>{setExerciseForm(false);setEditingExercise(null);}}>Cancel</button></div></td></tr> : <tr key={e.id} className="border-t border-[var(--sortd-border)] hover:bg-[var(--sortd-muted)]/40"><td className="px-4 py-3"><input aria-label={`Select ${e.name}`} type="checkbox" checked={selectedExercises.includes(e.id)} onChange={ev=>setSelectedExercises(prev=>ev.target.checked?[...prev,e.id]:prev.filter(id=>id!==e.id))}/></td><td className="px-3 py-3 font-medium">{e.name}</td><td className="px-3 py-3"><select aria-label={`Category for ${e.name}`} className={`${input} !py-1.5`} value={e.category} onChange={ev=>update({exercises:exercises.map(x=>x.id===e.id?{...x,category:ev.target.value}:x)})}>{!CATEGORIES.includes(e.category)&&<option value={e.category}>{e.category}</option>}{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></td><td className="px-3 py-3 text-[var(--sortd-text-muted)]">{e.measures.map(m=>m==="distance"?`distance (${e.distanceUnit??"km"})`:m).join(" · ")}</td><td className="px-4 py-3"><div className="flex justify-end gap-2"><button className={secondary} onClick={()=>beginExerciseEdit(e)}>Edit</button><button className={secondary} onClick={()=>{if(window.confirm(`Delete ${e.name}? This removes it from all workouts.`))update({exercises:exercises.filter(x=>x.id!==e.id),regimes:regimes.map(r=>({...r,exercises:r.exercises.filter(x=>x.exerciseId!==e.id)}))});}}>Delete</button></div></td></tr>)}
      {!visibleExercises.length&&!exerciseForm&&<tr><td colSpan={5} className="px-4 py-8 text-center text-[var(--sortd-text-muted)]">No exercises found. Add one to get started.</td></tr>}</tbody></table></div></div></section>}
    {tab === "history" && <section className="space-y-3"><div><h2 className="text-lg font-semibold">History & progress</h2><p className="text-sm text-[var(--sortd-text-muted)]">Your saved workout sessions are kept even when you edit a workout.</p></div>{active && <div className={`${card} flex flex-col gap-3 border-[var(--sortd-teal-dark)] bg-[#e6f3ef] p-4 sm:flex-row sm:items-center sm:justify-between`}><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-[var(--sortd-teal-dark)]">In progress · Saved</p><h3 className="mt-1 font-semibold">{active.workoutName}</h3><p className="text-xs text-[var(--sortd-text-muted)]">{active.exercises.filter(e => e.sets.every(set => set.completed)).length} of {active.exercises.length} exercises completed</p></div><button className={primary} onClick={() => setTab("overview")}>Resume workout</button></div>}{!completed.length&&<div className={`${card} p-5 text-sm text-[var(--sortd-text-muted)]`}>Completed workouts will appear here.</div>}{completed.slice(0,showAllHistory?undefined:15).map(s=><details key={s.id} className={`${card} p-4`}><summary className="cursor-pointer font-semibold">{s.workoutName} <span className="text-xs font-normal text-[var(--sortd-text-muted)]">· {new Date(s.completedAt!).toLocaleDateString("en-GB")} · {s.exercises.reduce((n,e)=>n+e.sets.filter(x=>x.completed).length,0)} completed</span></summary><div className="mt-3 space-y-2">{s.exercises.map(e=><div key={e.id} className="rounded-xl bg-[var(--sortd-muted)] p-3 text-sm"><strong>{e.name}</strong><p className="mt-1 text-xs text-[var(--sortd-text-muted)]">{e.sets.filter(x=>x.completed).map(x=>x.reps||x.weightKg?`${x.weightKg} kg × ${x.reps} reps`:"Completed").join(" · ")||"No sets marked complete"}</p></div>)}</div></details>)}{completed.length>15&&<button className={secondary} onClick={()=>setShowAllHistory(v=>!v)}>{showAllHistory?"Show fewer":"Show all sessions"}</button>}</section>}
    </>}
    {coverFor && <CoverPicker itemId={coverFor} itemType="workout" current={covers[coverFor]} onSelect={cover => setCover(coverFor, cover)} onClose={() => setCoverFor(null)} />}
  </main>;
}

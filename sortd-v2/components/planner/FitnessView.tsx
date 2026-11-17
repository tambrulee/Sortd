"use client";

import { useEffect, useMemo, useState } from "react";
import CoverPicker from "@/components/covers/CoverPicker";
import { supabase } from "@/lib/supabase";
import type { ProjectCover } from "@/lib/types";
import { Activity, ArrowDown, ArrowUp, Bike, Check, ChevronLeft, Dumbbell, Footprints, HeartPulse, Plus, Search, Trash2, Waves, X } from "lucide-react";
import type { FitnessData, FitnessLibraryExercise, FitnessMeasure, FitnessRegime, FitnessRegimeExercise, FitnessSession } from "@/lib/types";

type Props = { data: FitnessData; onChange: (data: FitnessData) => void };
type Tab = "overview" | "exercises" | "history";
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const CATEGORIES = ["Strength", "Yoga", "Calisthenics", "Running", "Swimming", "Cycling", "Core", "Mobility", "Cardio", "Other"];
const MEASURES: { id: FitnessMeasure; label: string }[] = [{ id: "weight", label: "Weight (kg)" }, { id: "reps", label: "Reps" }, { id: "distance", label: "Distance" }, { id: "duration", label: "Duration (min)" }];
const uid = () => crypto.randomUUID();
const card = "rounded-2xl border border-[var(--sortd-border)] bg-[var(--sortd-card)] shadow-sm";
const input = "w-full min-w-0 rounded-xl border border-[var(--sortd-border)] bg-white px-3 py-2.5 text-sm text-[var(--sortd-text)] outline-none focus:border-[var(--sortd-teal-dark)]";
const primary = "inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--sortd-navy)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40";
const secondary = "inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--sortd-border)] bg-white px-3 py-2 text-sm hover:bg-[var(--sortd-muted)] disabled:opacity-40";
const theme: Record<string, string> = { Strength: "from-slate-700 to-slate-900", Yoga: "from-rose-300 to-stone-500", Calisthenics: "from-indigo-400 to-slate-700", Running: "from-orange-300 to-rose-500", Swimming: "from-cyan-400 to-blue-700", Cycling: "from-emerald-400 to-teal-800", Core: "from-amber-300 to-orange-700", Mobility: "from-violet-300 to-indigo-600", Cardio: "from-pink-400 to-rose-700", Other: "from-slate-400 to-slate-700" };
function CategoryIcon({ category, size = 21 }: { category: string; size?: number }) {
  const Icon = category === "Swimming" ? Waves : category === "Running" ? Footprints : category === "Cycling" ? Bike : category === "Strength" ? Dumbbell : category === "Cardio" ? HeartPulse : Activity;
  return <Icon size={size} strokeWidth={1.7} />;
}

function WorkoutCover({ cover, className = "" }: { cover?: ProjectCover; className?: string }) {
  const [url, setUrl] = useState<string | null>(cover?.source === "unsplash" ? cover.url : null);
  
  useEffect(() => {
    if (!cover || cover.source !== "upload") return;

    let cancelled = false;

    supabase.storage
      .from("project-covers")
      .createSignedUrl(cover.path, 3600)
      .then(({ data }) => {
        if (!cancelled) {
          setUrl(data?.signedUrl ?? null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [cover]);

  return url ? <img src={url} alt="" className={`absolute inset-0 h-full w-full object-cover ${className}`} /> : null;
}
export default function FitnessView({ data, onChange }: Props) {
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
  const [pickerSearch, setPickerSearch] = useState("");
  const [exerciseForm, setExerciseForm] = useState(false);
  const [editingExercise, setEditingExercise] = useState<string | null>(null);
  const [exerciseName, setExerciseName] = useState("");
  const [exerciseCategory, setExerciseCategory] = useState("Strength");
  const [measures, setMeasures] = useState<FitnessMeasure[]>(["weight", "reps"]);
  const [distanceUnit, setDistanceUnit] = useState<"km" | "m">("km");
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [active, setActive] = useState<FitnessSession | null>(null);
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
  const completed = [...sessions].filter(s => s.completedAt).sort((a,b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""));
  const current = regimes.find(r => r.id === editing);
  const lookup = (exerciseId: string) => exercises.find(e => e.id === exerciseId);
  function update(patch: Partial<FitnessData>) { onChange({ ...data, exercises, regimes, weeklyPlan, ...patch }); }
  function saveWorkout(workout: FitnessRegime) { update({ regimes: regimes.map(r => r.id === workout.id ? workout : r) }); }
  function newWorkout() {
    if (!workoutName.trim()) return;
    const workout: FitnessRegime = { id: uid(), name: workoutName.trim(), category: workoutCategory, exercises: [], createdAt: new Date().toISOString() };
    update({ regimes: [...regimes, workout] }); setCreatingWorkout(false); setWorkoutName(""); setEditing(workout.id); setTab("overview");
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
    if (active && !window.confirm("Discard the current workout?")) return;
    setActive({ id: uid(), workoutId: workout.id, workoutName: workout.name, startedAt: new Date().toISOString(), exercises: workout.exercises.map(entry => ({ id: uid(), exerciseId: entry.exerciseId, name: lookup(entry.exerciseId)?.name ?? "Exercise", sets: Array.from({ length: Math.max(1, entry.sets ?? 1) }, () => ({ id: uid(), reps: entry.reps ?? 0, weightKg: entry.weightKg ?? 0, completed: false })) })) });
  }
  function finishWorkout() {
    if (!active) return;
    update({ sessions: [...sessions, { ...active, completedAt: new Date().toISOString() }] }); setActive(null); setEditing(null); setTab("history");
  }
  const visibleExercises = exercises.filter(e => `${e.name} ${e.category}`.toLowerCase().includes(search.toLowerCase()));
  return <main className="min-w-0 space-y-5 rounded-2xl border border-[var(--sortd-border)] bg-[var(--sortd-surface)] p-4 text-[var(--sortd-text)] shadow-sm sm:p-5">
    <header className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-semibold">Fitness</h1><p className="mt-1 text-sm text-[var(--sortd-text-muted)]">Build your workouts. Train your way.</p></div><button className={primary} onClick={() => { setTab("overview"); setEditing(null); setCreatingWorkout(true); }}><Plus size={17}/> New workout</button></header>
    {active ? <section className={`${card} space-y-4 p-4 sm:p-6`}><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-[var(--sortd-teal-dark)]">In progress</p><h2 className="mt-1 text-xl font-semibold">{active.workoutName}</h2></div><button className={secondary} onClick={() => { if (window.confirm("Discard this session?")) setActive(null); }}>Discard</button></div><p className="text-sm text-[var(--sortd-text-muted)]">Tick the sets you complete. For distance or time-based exercises, you can mark the activity as done.</p>{active.exercises.map(e => <div key={e.id} className="rounded-xl bg-[var(--sortd-muted)] p-3"><h3 className="mb-2 font-semibold">{e.name}</h3><div className="space-y-2">{e.sets.map((s,i) => <label key={s.id} className="flex items-center gap-3 text-sm"><input type="checkbox" className="h-5 w-5 accent-[var(--sortd-teal-dark)]" checked={s.completed} onChange={ev => setActive(prev => prev ? { ...prev, exercises: prev.exercises.map(x => x.id === e.id ? { ...x, sets: x.sets.map(y => y.id === s.id ? { ...y, completed: ev.target.checked } : y) } : x) } : prev)}/><span>{e.sets.length > 1 ? `Set ${i+1}` : "Completed"}</span><span className="text-[var(--sortd-text-muted)]">{s.reps ? `${s.reps} reps` : ""} {s.weightKg ? `· ${s.weightKg} kg` : ""}</span></label>)}</div></div>)}<button className={primary} onClick={finishWorkout}><Check size={17}/> Finish workout</button></section> : <>
    <nav aria-label="Fitness sections" className="flex flex-wrap gap-2">{([["overview","Overview"],["exercises","Exercises"],["history","History & progress"]] as const).map(([key,label]) => <button key={key} className={tab === key ? primary : secondary} onClick={() => { setTab(key); setEditing(null); }}>{label}</button>)}</nav>
    {tab === "overview" && <div className="space-y-6">
      {creatingWorkout && <form onSubmit={e => { e.preventDefault(); newWorkout(); }} className={`${card} space-y-3 p-4`}><div className="flex items-center justify-between"><h2 className="font-semibold">New workout</h2><button type="button" aria-label="Close" onClick={() => setCreatingWorkout(false)}><X size={18}/></button></div><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">Workout name<input autoFocus className={`${input} mt-1`} value={workoutName} placeholder="e.g. Leg Day" onChange={e => setWorkoutName(e.target.value)}/></label><label className="text-sm">Workout type<select className={`${input} mt-1`} value={workoutCategory} onChange={e => setWorkoutCategory(e.target.value)}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></label></div><button type="submit" disabled={!workoutName.trim()} className={primary}>Create workout</button></form>}
      {current ? <section className={`${card} space-y-5 p-4 sm:p-6`}><button className="inline-flex items-center gap-1 text-sm text-[var(--sortd-text-muted)] hover:text-[var(--sortd-text)]" onClick={() => setEditing(null)}><ChevronLeft size={16}/> All workouts</button><div className="grid gap-3 sm:grid-cols-[1fr_180px]"><label className="text-sm">Workout name<input className={`${input} mt-1`} value={current.name} onChange={e => saveWorkout({ ...current, name: e.target.value })}/></label><label className="text-sm">Type<select className={`${input} mt-1`} value={current.category ?? "Strength"} onChange={e => saveWorkout({ ...current, category: e.target.value })}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></label></div><div className="flex flex-wrap items-center gap-3"><button className={secondary} onClick={() => setCoverFor(current.id)}>{covers[current.id] ? "Change cover" : "Add cover"}</button>{covers[current.id] && <button className="text-sm text-[var(--sortd-text-muted)] underline" onClick={() => setCover(current.id, undefined)}>Remove cover</button>}</div><label className="block text-sm">Description (optional)<input className={`${input} mt-1`} value={current.description ?? ""} onChange={e => saveWorkout({ ...current, description: e.target.value })} placeholder="What are you focusing on?"/></label><div className="flex items-center justify-between"><div><h3 className="font-semibold">Exercises</h3><p className="text-xs text-[var(--sortd-text-muted)]">Reorder them to suit your session.</p></div><span className="text-sm text-[var(--sortd-text-muted)]">{current.exercises.length} added</span></div>
        <div className="space-y-3">{current.exercises.map((entry,i) => { const exercise = lookup(entry.exerciseId); if (!exercise) return null; const fields: { key: keyof FitnessRegimeExercise; label: string; step: string }[] = [...(exercise.measures.some(m => m === "weight" || m === "reps") ? [{ key: "sets" as const, label: "Sets", step: "1" }] : []), ...(exercise.measures.includes("reps") ? [{ key: "reps" as const, label: "Reps", step: "1" }] : []), ...(exercise.measures.includes("weight") ? [{ key: "weightKg" as const, label: "kg", step: "0.5" }] : []), ...(exercise.measures.includes("distance") ? [{ key: "distance" as const, label: exercise.distanceUnit ?? "km", step: "0.1" }] : []), ...(exercise.measures.includes("duration") ? [{ key: "durationMinutes" as const, label: "Minutes", step: "1" }] : [])]; return <div key={entry.id} className="rounded-xl border border-[var(--sortd-border)] bg-[var(--sortd-muted)] p-3"><div className="flex items-center gap-2"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[var(--sortd-teal-dark)]"><CategoryIcon category={exercise.category} size={18}/></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{exercise.name}</p><p className="text-xs text-[var(--sortd-text-muted)]">{exercise.category}</p></div><button aria-label={`Move ${exercise.name} up`} title="Move up" className={secondary} disabled={i===0} onClick={() => moveEntry(i,-1)}><ArrowUp size={15}/></button><button aria-label={`Move ${exercise.name} down`} title="Move down" className={secondary} disabled={i===current.exercises.length-1} onClick={() => moveEntry(i,1)}><ArrowDown size={15}/></button><button aria-label={`Remove ${exercise.name}`} className={secondary} onClick={() => saveWorkout({ ...current, exercises: current.exercises.filter(x => x.id !== entry.id) })}><X size={15}/></button></div><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">{fields.map(f => <label key={f.key} className="text-xs text-[var(--sortd-text-muted)]">{f.label}<input type="number" min="0" step={f.step} className={`${input} mt-1`} value={entry[f.key] ?? 0} onChange={ev => saveWorkout({ ...current, exercises: current.exercises.map(x => x.id === entry.id ? { ...x, [f.key]: Math.max(0, Number(ev.target.value)||0) } : x) })}/></label>)}</div></div>; })}{!current.exercises.length && <p className="rounded-xl border border-dashed border-[var(--sortd-border)] p-5 text-center text-sm text-[var(--sortd-text-muted)]">No exercises yet. Choose from your library below.</p>}</div>
        <div className="rounded-xl border border-[var(--sortd-border)] p-3"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h4 className="text-sm font-semibold">Add from exercise library</h4><button className="text-xs font-medium text-[var(--sortd-teal-dark)]" onClick={() => beginExerciseEdit()}>+ Create exercise</button></div><div className="relative mb-3"><Search size={16} className="absolute left-3 top-3 text-[var(--sortd-text-muted)]"/><input className={`${input} pl-9`} placeholder="Search exercises..." value={pickerSearch} onChange={e => setPickerSearch(e.target.value)}/></div><div className="max-h-56 space-y-1 overflow-y-auto">{exercises.filter(e => `${e.name} ${e.category}`.toLowerCase().includes(pickerSearch.toLowerCase())).map(e => <button key={e.id} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-[var(--sortd-muted)]" onClick={() => addToWorkout(e)}><span>{e.name} <span className="text-xs text-[var(--sortd-text-muted)]">· {e.category}</span></span><Plus size={17}/></button>)}{!exercises.length && <p className="p-3 text-sm text-[var(--sortd-text-muted)]">Create your first reusable exercise in Exercises.</p>}</div></div><div className="flex flex-wrap justify-between gap-2"><button className={secondary} onClick={() => setEditing(null)}>Done editing</button><button className={primary} disabled={!current.exercises.length} onClick={() => startWorkout(current)}>Start workout</button></div></section> : <>
      <section><div className="mb-3 flex flex-wrap items-end justify-between gap-2"><div><h2 className="text-lg font-semibold">Your workouts</h2><p className="text-sm text-[var(--sortd-text-muted)]">Pick a card to build or edit your training session.</p></div><span className="text-sm text-[var(--sortd-text-muted)]">{regimes.length} workouts</span></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{regimes.map(r => <article key={r.id} className={`${card} overflow-hidden`}><button className="w-full text-left" onClick={() => setEditing(r.id)}><div className={`relative flex h-28 items-end overflow-hidden bg-gradient-to-br ${theme[r.category ?? "Strength"] ?? theme.Other} p-4 text-white`}><WorkoutCover cover={covers[r.id]}/>{covers[r.id] && <div className="absolute inset-0 bg-black/35"/>}<div className="absolute right-4 top-4 rounded-xl bg-white/20 p-2"><CategoryIcon category={r.category ?? "Strength"} size={24}/></div><span className="rounded-full bg-black/20 px-2.5 py-1 text-xs font-medium">{r.category ?? "Strength"}</span></div><div className="p-4"><h3 className="text-base font-semibold">{r.name}</h3><p className="mt-1 text-xs text-[var(--sortd-text-muted)]">{r.exercises.length} exercises · {r.description || "Your training session"}</p><div className="mt-3 space-y-1">{r.exercises.slice(0,3).map(entry => <p key={entry.id} className="truncate text-xs text-[var(--sortd-text-muted)]">• {lookup(entry.exerciseId)?.name ?? "Exercise"}</p>)}{r.exercises.length>3 && <p className="text-xs text-[var(--sortd-text-muted)]">+ {r.exercises.length-3} more</p>}</div></div></button><div className="flex gap-2 border-t border-[var(--sortd-border)] px-4 py-3"><button className={`${secondary} flex-1`} onClick={() => setEditing(r.id)}>Edit</button><button className={`${primary} flex-1`} disabled={!r.exercises.length} onClick={() => startWorkout(r)}>Start</button><button className={secondary} aria-label={`Delete ${r.name}`} onClick={() => { if (window.confirm(`Delete ${r.name}? Completed history will remain.`)) update({ regimes: regimes.filter(x=>x.id!==r.id), weeklyPlan: weeklyPlan.filter(x=>x.regimeId!==r.id) }); }}><Trash2 size={15}/></button></div></article>)}<button onClick={() => setCreatingWorkout(true)} className="flex min-h-60 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--sortd-border)] text-[var(--sortd-text-muted)] hover:bg-white"><Plus size={27}/><span className="text-sm font-semibold">Create workout</span></button></div></section>
      <section className={`${card} p-4 sm:p-5`}><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-lg font-semibold">Your training week</h2><p className="text-sm text-[var(--sortd-text-muted)]">A repeating weekly plan, with room to be flexible.</p></div><span className="rounded-full bg-[var(--sortd-muted)] px-3 py-1 text-xs">{weeklyPlan.length} planned days</span></div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-7">{DAYS.map((day,i) => { const planned = weeklyPlan.find(x => x.day===i); const workout = regimes.find(r=>r.id===planned?.regimeId); return <div key={day} className="min-w-0 rounded-xl bg-[var(--sortd-muted)] p-3"><p className="mb-2 text-xs font-semibold">{day.slice(0,3)}</p><select aria-label={`Workout for ${day}`} className={`${input} !px-2 !py-2`} value={planned?.regimeId ?? ""} onChange={e => update({ weeklyPlan: [...weeklyPlan.filter(x=>x.day!==i), ...(e.target.value ? [{day:i,regimeId:e.target.value}] : [])] })}><option value="">Rest / flexible</option>{regimes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select>{workout && <button className="mt-2 text-left text-xs font-medium text-[var(--sortd-teal-dark)]" onClick={() => setEditing(workout.id)}>View workout</button>}</div>; })}</div></section>
      </>}
    </div>}
    {tab === "exercises" && <section className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-lg font-semibold">Exercise library</h2><p className="text-sm text-[var(--sortd-text-muted)]">Create once, reuse in any workout.</p></div><button className={primary} onClick={() => beginExerciseEdit()}><Plus size={16}/> Add exercise</button></div>{exerciseForm && <form className={`${card} space-y-3 p-4`} onSubmit={e => {e.preventDefault();saveExercise();}}><div className="flex items-center justify-between"><h3 className="font-semibold">{editingExercise ? "Edit exercise" : "New exercise"}</h3><button type="button" onClick={() => setExerciseForm(false)} aria-label="Close"><X size={18}/></button></div><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">Exercise name<input autoFocus className={`${input} mt-1`} value={exerciseName} placeholder="e.g. Romanian deadlift" onChange={e => setExerciseName(e.target.value)}/></label><label className="text-sm">Category<select className={`${input} mt-1`} value={exerciseCategory} onChange={e => {const next=e.target.value;setExerciseCategory(next);setMeasures(["Running","Swimming","Cycling","Cardio"].includes(next)?["distance","duration"]:["weight","reps"]);}}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></label></div><fieldset><legend className="mb-2 text-sm font-medium">Track by</legend><div className="flex flex-wrap gap-3">{MEASURES.map(m=><label key={m.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={measures.includes(m.id)} onChange={e=>setMeasures(prev=>e.target.checked?[...prev,m.id]:prev.filter(x=>x!==m.id))}/>{m.label}</label>)}</div></fieldset>{measures.includes("distance")&&<label className="block max-w-44 text-sm">Distance unit<select className={`${input} mt-1`} value={distanceUnit} onChange={e=>setDistanceUnit(e.target.value as "km"|"m")}><option value="km">Kilometres</option><option value="m">Metres</option></select></label>}<button type="submit" className={primary} disabled={!exerciseName.trim()||!measures.length}>Save exercise</button></form>}
      <div className="relative max-w-sm"><Search size={16} className="absolute left-3 top-3 text-[var(--sortd-text-muted)]"/><input aria-label="Search exercises" className={`${input} pl-9`} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search exercises or categories"/></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{visibleExercises.map(e=><div key={e.id} className={`${card} flex items-start gap-3 p-4`}><div className="rounded-xl bg-[var(--sortd-muted)] p-3 text-[var(--sortd-teal-dark)]"><CategoryIcon category={e.category}/></div><div className="min-w-0 flex-1"><h3 className="font-semibold">{e.name}</h3><p className="mt-1 text-xs text-[var(--sortd-text-muted)]">{e.category} · {e.measures.map(m=>m==="distance"?`distance (${e.distanceUnit??"km"})`:m).join(" · ")}</p><div className="mt-3 flex gap-2"><button className={secondary} onClick={()=>beginExerciseEdit(e)}>Edit</button><button className={secondary} onClick={()=>{if(window.confirm(`Delete ${e.name}? This removes it from all workouts.`))update({exercises:exercises.filter(x=>x.id!==e.id),regimes:regimes.map(r=>({...r,exercises:r.exercises.filter(x=>x.exerciseId!==e.id)}))});}}>Delete</button></div></div></div>)}{!visibleExercises.length&&<p className="text-sm text-[var(--sortd-text-muted)]">No exercises found. Add one to get started.</p>}</div></section>}
    {tab === "history" && <section className="space-y-3"><div><h2 className="text-lg font-semibold">History & progress</h2><p className="text-sm text-[var(--sortd-text-muted)]">Your saved workout sessions are kept even when you edit a workout.</p></div>{!completed.length&&<div className={`${card} p-5 text-sm text-[var(--sortd-text-muted)]`}>Completed workouts will appear here.</div>}{completed.slice(0,showAllHistory?undefined:15).map(s=><details key={s.id} className={`${card} p-4`}><summary className="cursor-pointer font-semibold">{s.workoutName} <span className="text-xs font-normal text-[var(--sortd-text-muted)]">· {new Date(s.completedAt!).toLocaleDateString("en-GB")} · {s.exercises.reduce((n,e)=>n+e.sets.filter(x=>x.completed).length,0)} completed</span></summary><div className="mt-3 space-y-2">{s.exercises.map(e=><div key={e.id} className="rounded-xl bg-[var(--sortd-muted)] p-3 text-sm"><strong>{e.name}</strong><p className="mt-1 text-xs text-[var(--sortd-text-muted)]">{e.sets.filter(x=>x.completed).map(x=>x.reps||x.weightKg?`${x.weightKg} kg × ${x.reps} reps`:"Completed").join(" · ")||"No sets marked complete"}</p></div>)}</div></details>)}{completed.length>15&&<button className={secondary} onClick={()=>setShowAllHistory(v=>!v)}>{showAllHistory?"Show fewer":"Show all sessions"}</button>}</section>}
    </>}
    {coverFor && <CoverPicker itemId={coverFor} itemType="workout" current={covers[coverFor]} onSelect={cover => setCover(coverFor, cover)} onClose={() => setCoverFor(null)} />}
  </main>;
}

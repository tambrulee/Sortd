"use client";

import { useMemo, useState } from "react";

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

export default function DreamsView({
  dreams,
  goals,
  projects,
  onChangeDreams,
  onChangeGoals,
  onOpenGoal,
}: DreamsViewProps) {
  const [newDreamTitle, setNewDreamTitle] = useState("");

  const [expandedDreamId, setExpandedDreamId] = useState<string | null>(null);

  const [dreamToDeleteId, setDreamToDeleteId] =
    useState<string | null>(null);

  const dreamProgress = useMemo(
    () =>
      new Map(
        dreams.map((dream) => {
          const linkedGoals = goals.filter((goal) => goal.dreamId === dream.id);

          const linkedGoalIds = new Set(linkedGoals.map((goal) => goal.id));

          const linkedProjects = projects.filter(
            (project) => project.goalId && linkedGoalIds.has(project.goalId),
          );

          const totalTasks = linkedProjects.reduce(
            (total, project) => total + project.tasks.length,
            0,
          );

          const completedTasks = linkedProjects.reduce(
            (total, project) =>
              total + project.tasks.filter((task) => task.completed).length,
            0,
          );

          const progress =
            totalTasks > 0
              ? Math.round((completedTasks / totalTasks) * 100)
              : 0;

          return [dream.id, progress] as const;
        }),
      ),
    [dreams, goals, projects],
  );

  function addDream() {
    const title = newDreamTitle.trim();

    if (!title) {
      return;
    }

    const newDream: Dream = {
      id: crypto.randomUUID(),
      title,
      description: "",
      category: "",
      createdAt: new Date().toISOString(),
    };

    onChangeDreams([...dreams, newDream]);

    setNewDreamTitle("");
  }

  function addGoalToDream(dreamId: string) {
    const newGoal: Goal = {
      id: crypto.randomUUID(),
      title: "New goal",
      description: "",
      status: "active",
      createdAt: new Date().toISOString(),
      dreamId,
    };

    onChangeGoals([...goals, newGoal]);

    setExpandedDreamId(dreamId);

    onOpenGoal?.(newGoal.id);
  }

  function updateDream(id: string, updates: Partial<Dream>) {
    onChangeDreams(
      dreams.map((dream) =>
        dream.id === id
          ? {
              ...dream,
              ...updates,
            }
          : dream,
      ),
    );
  }

  function deleteDream(id: string) {
    onChangeDreams(
      dreams.filter(
        (dream) => dream.id !== id,
      ),
    );
  }

  return (
    <section className="rounded-3xl bg-white/85 p-5 shadow-xl backdrop-blur-md md:p-8">
      <div className="space-y-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-fuchsia-700">
              Bigger picture
            </p>

            <h1 className="mt-1 text-3xl font-bold text-slate-950">Dreams</h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Capture where you want your life to move. Goals turn the bigger
              picture into something you can act on.
            </p>
          </div>

          <div className="text-sm text-slate-500">
            <span className="font-semibold text-slate-900">
              {dreams.length}
            </span>{" "}
            {dreams.length === 1 ? "dream" : "dreams"}
          </div>
        </header>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={newDreamTitle}
            onChange={(event) => setNewDreamTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                addDream();
              }
            }}
            placeholder="What would you love to make happen?"
            className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-100"
          />

          <button
            type="button"
            onClick={addDream}
            className="rounded-2xl bg-[#1f0825] px-5 py-3 font-medium text-white transition hover:bg-[#3b0842]"
          >
            Add dream
          </button>
        </div>

        {dreams.length === 0 ? (
          <div className="rounded-3xl bg-[#f3eeee] px-8 py-16 text-center">
            <div className="text-3xl">✦</div>

            <p className="mt-4 font-semibold text-slate-700">
              Your bigger picture starts here.
            </p>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              A dream does not need a deadline or a perfect plan. Add something
              you would genuinely like your life to move towards.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-2">
            {dreams.map((dream) => {
              const linkedGoals = goals.filter(
                (goal) => goal.dreamId === dream.id,
              );

              const activeGoals = linkedGoals.filter(
                (goal) => goal.status === "active",
              );

              const completedGoals = linkedGoals.filter(
                (goal) => goal.status === "completed",
              );

              const progress = dreamProgress.get(dream.id) ?? 0;

              const isExpanded = expandedDreamId === dream.id;

              return (
                <article
                  key={dream.id}
                  className="flex min-h-[280px] flex-col rounded-3xl border border-slate-200 bg-white p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-xl text-fuchsia-700">✦</span>

                    <button
                      type="button"
                      onClick={() =>
                        setDreamToDeleteId(dream.id)
                      }
                      className="text-sm text-slate-400 transition hover:text-red-600"
                    >
                      Delete
                    </button>
                  </div>

                  <input
                    value={dream.title}
                    onChange={(event) =>
                      updateDream(dream.id, {
                        title: event.target.value,
                      })
                    }
                    className="mt-4 w-full bg-transparent text-xl font-semibold text-slate-950 outline-none"
                  />

                  <textarea
                    value={dream.description}
                    onChange={(event) =>
                      updateDream(dream.id, {
                        description: event.target.value,
                      })
                    }
                    placeholder="What does this look or feel like?"
                    rows={3}
                    className="mt-3 w-full resize-none bg-transparent text-sm leading-6 text-slate-500 outline-none"
                  />

                  <div className="mt-auto pt-6">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                          Goals
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {activeGoals.length} active · {completedGoals.length}{" "}
                          complete
                        </p>
                      </div>

                      <span className="text-sm font-semibold text-slate-700">
                        {progress}%
                      </span>
                    </div>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-[#1f0825] transition-all"
                        style={{
                          width: `${progress}%`,
                        }}
                      />
                    </div>

                    {linkedGoals.length === 0 ? (
                      <p className="mt-4 text-sm text-slate-400">
                        No goals linked yet.
                      </p>
                    ) : (
                      <div className="mt-4 space-y-2">
                        {(isExpanded
                          ? linkedGoals
                          : linkedGoals.slice(0, 3)
                        ).map((goal) => {
                          const goalProjects = projects.filter(
                            (project) => project.goalId === goal.id,
                          );

                          const totalTasks = goalProjects.reduce(
                            (total, project) => total + project.tasks.length,
                            0,
                          );

                          const completedTasks = goalProjects.reduce(
                            (total, project) =>
                              total +
                              project.tasks.filter((task) => task.completed)
                                .length,
                            0,
                          );

                          const goalProgress =
                            totalTasks > 0
                              ? Math.round((completedTasks / totalTasks) * 100)
                              : 0;

                          return (
                            <button
                              key={goal.id}
                              type="button"
                              onClick={() => onOpenGoal?.(goal.id)}
                              className="flex w-full items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-3 text-left transition hover:bg-slate-100"
                            >
                              <span className="min-w-0">
                                <span
                                  className={`block truncate text-sm font-medium ${
                                    goal.status === "completed"
                                      ? "text-slate-400 line-through"
                                      : "text-slate-700"
                                  }`}
                                >
                                  {goal.title}
                                </span>

                                <span className="mt-1 block text-xs text-slate-400">
                                  {goalProjects.length}{" "}
                                  {goalProjects.length === 1
                                    ? "project"
                                    : "projects"}{" "}
                                  · {goalProgress}%
                                </span>
                              </span>

                              <span className="shrink-0 text-sm text-slate-300">
                                →
                              </span>
                            </button>
                          );
                        })}

                        {linkedGoals.length > 3 && (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedDreamId(isExpanded ? null : dream.id)
                            }
                            className="text-xs font-medium text-fuchsia-700"
                          >
                            {isExpanded
                              ? "Show less"
                              : `Show ${linkedGoals.length - 3} more`}
                          </button>
                        )}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => addGoalToDream(dream.id)}
                      className="mt-4 text-sm font-medium text-fuchsia-700 transition hover:text-fuchsia-900"
                    >
                      + Add goal
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
      <ConfirmDialog
        open={Boolean(dreamToDeleteId)}
        title="Delete dream?"
        description={(() => {
          const dream = dreams.find(
            (item) =>
              item.id === dreamToDeleteId,
          );

          if (!dream) {
            return "Delete this dream? This can't be undone.";
          }

          const linkedGoals = goals.filter(
            (goal) =>
              goal.dreamId === dream.id,
          );

          if (linkedGoals.length > 0) {
            return `Delete “${dream.title}”? It has ${linkedGoals.length} linked ${
              linkedGoals.length === 1
                ? "goal"
                : "goals"
            }. This can't be undone.`;
          }

          return `Delete “${dream.title}”? This can't be undone.`;
        })()}
        confirmLabel="Delete dream"
        onCancel={() =>
          setDreamToDeleteId(null)
        }
        onConfirm={() => {
          if (!dreamToDeleteId) return;

          deleteDream(dreamToDeleteId);
          setDreamToDeleteId(null);
        }}
      />
    </section>
  );
}

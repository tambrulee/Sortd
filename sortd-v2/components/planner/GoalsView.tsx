"use client";

import { useMemo, useState } from "react";

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

function getGoalProgress(goalId: string, projects: SortdList[]) {
  const linkedProjects = projects.filter(
    (project) => project.goalId === goalId,
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

  return {
    linkedProjects,
    totalTasks,
    completedTasks,
    progress:
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
  };
}

export default function GoalsView({
  goals,
  dreams,
  projects,
  onChangeGoals,
  onCreateProjectForGoal,
  onOpenDream,
  onOpenProject,
}: GoalsViewProps) {
  const [newGoalTitle, setNewGoalTitle] = useState("");

  const [filter, setFilter] = useState<
    "active" | "paused" | "completed" | "all"
  >("active");

  const [goalToDeleteId, setGoalToDeleteId] =
    useState<string | null>(null);

  const visibleGoals = useMemo(
    () => goals.filter((goal) => filter === "all" || goal.status === filter),
    [goals, filter],
  );

  function addGoal() {
    const title = newGoalTitle.trim();

    if (!title) {
      return;
    }

    const newGoal: Goal = {
      id: crypto.randomUUID(),
      title,
      description: "",
      status: "active",
      createdAt: new Date().toISOString(),
    };

    onChangeGoals([...goals, newGoal]);

    setNewGoalTitle("");
  }

  function updateGoal(id: string, updates: Partial<Goal>) {
    onChangeGoals(
      goals.map((goal) =>
        goal.id === id
          ? {
              ...goal,
              ...updates,
            }
          : goal,
      ),
    );
  }

  function deleteGoal(id: string) {
    onChangeGoals(
      goals.filter((goal) => goal.id !== id),
    );
  }

  return (
    <section className="rounded-3xl bg-white/85 p-5 shadow-xl backdrop-blur-md md:p-8">
      <div className="flex flex-col gap-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-fuchsia-700">Direction</p>

            <h1 className="mt-1 text-3xl font-bold text-slate-950">Goals</h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Turn the things you want into outcomes you can actively work
              towards.
            </p>
          </div>

          <div className="text-sm text-slate-500">
            <span className="font-semibold text-slate-900">
              {goals.filter((goal) => goal.status === "active").length}
            </span>{" "}
            active
          </div>
        </header>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={newGoalTitle}
            onChange={(event) => setNewGoalTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                addGoal();
              }
            }}
            placeholder="Add a goal..."
            className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-100"
          />

          <button
            type="button"
            onClick={addGoal}
            className="rounded-2xl bg-[#1f0825] px-5 py-3 font-medium text-white transition hover:bg-[#3b0842]"
          >
            Add goal
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {(
            [
              ["active", "Active"],
              ["paused", "Paused"],
              ["completed", "Completed"],
              ["all", "All"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-xl px-3 py-2 text-sm transition ${
                filter === value
                  ? "bg-[#f3e8f5] font-medium text-[#7c2d92]"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {visibleGoals.length === 0 ? (
          <div className="rounded-2xl bg-[#f3eeee] px-6 py-12 text-center">
            <p className="font-medium text-slate-700">Nothing here yet.</p>

            <p className="mt-1 text-sm text-slate-500">
              Add something you want to make meaningful progress towards.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleGoals.map((goal) => {
              const linkedDream = dreams.find(
                (dream) => dream.id === goal.dreamId,
              );

              const { linkedProjects, totalTasks, completedTasks, progress } =
                getGoalProgress(goal.id, projects);

              return (
                <article
                  key={goal.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <input
                        value={goal.title}
                        onChange={(event) =>
                          updateGoal(goal.id, {
                            title: event.target.value,
                          })
                        }
                        className="w-full bg-transparent text-lg font-semibold text-slate-950 outline-none"
                      />

                      <textarea
                        value={goal.description ?? ""}
                        onChange={(event) =>
                          updateGoal(goal.id, {
                            description: event.target.value,
                          })
                        }
                        placeholder="What would achieving this change?"
                        rows={2}
                        className="mt-2 w-full resize-none bg-transparent text-sm text-slate-500 outline-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setGoalToDeleteId(goal.id)
                      }
                      className="text-sm text-slate-400 transition hover:text-red-600"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <select
                      value={goal.dreamId ?? ""}
                      onChange={(event) =>
                        updateGoal(goal.id, {
                          dreamId: event.target.value || undefined,
                        })
                      }
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                    >
                      <option value="">No linked dream</option>

                      {dreams.map((dream) => (
                        <option key={dream.id} value={dream.id}>
                          {dream.title}
                        </option>
                      ))}
                    </select>

                    <select
                      value={goal.status}
                      onChange={(event) =>
                        updateGoal(goal.id, {
                          status: event.target.value as Goal["status"],
                        })
                      }
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                    >
                      <option value="active">Active</option>

                      <option value="paused">Paused</option>

                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  {linkedDream && (
                    <button
                      type="button"
                      onClick={() => onOpenDream?.(linkedDream.id)}
                      className="mt-4 text-sm font-medium text-fuchsia-700 transition hover:text-fuchsia-900"
                    >
                      ✦ {linkedDream.title} →
                    </button>
                  )}

                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">
                          Projects
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                          {completedTasks}/{totalTasks} tasks complete
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => onCreateProjectForGoal?.(goal.id)}
                        className="text-sm font-medium text-fuchsia-700 transition hover:text-fuchsia-900"
                      >
                        + Create project
                      </button>
                    </div>

                    {linkedProjects.length === 0 ? (
                      <p className="mt-3 text-sm text-slate-400">
                        No projects linked yet.
                      </p>
                    ) : (
                      <div className="mt-3 space-y-2">
                        {linkedProjects.map((project) => {
                          const completed = project.tasks.filter(
                            (task) => task.completed,
                          ).length;

                          return (
                            <button
                              key={project.id}
                              type="button"
                              onClick={() => onOpenProject?.(project.id)}
                              className="flex w-full items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-3 text-left transition hover:bg-slate-100"
                            >
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-medium text-slate-700">
                                  {project.name}
                                </span>

                                <span className="mt-1 block text-xs text-slate-400">
                                  {completed}/{project.tasks.length} tasks ·{" "}
                                  {project.status ?? "active"}
                                </span>
                              </span>

                              <span className="shrink-0 text-slate-300">→</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="text-slate-500">Overall progress</span>

                      <span className="font-medium text-slate-900">
                        {progress}%
                      </span>
                    </div>

                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-[#1f0825] transition-all"
                        style={{
                          width: `${progress}%`,
                        }}
                      />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
      <ConfirmDialog
        open={Boolean(goalToDeleteId)}
        title="Delete goal?"
        description={
          goalToDeleteId
            ? `Delete “${
                goals.find(
                  (goal) =>
                    goal.id === goalToDeleteId,
                )?.title ?? "this goal"
              }”? This can't be undone.`
            : undefined
        }
        confirmLabel="Delete goal"
        onCancel={() =>
          setGoalToDeleteId(null)
        }
        onConfirm={() => {
          if (!goalToDeleteId) return;

          deleteGoal(goalToDeleteId);
          setGoalToDeleteId(null);
        }}
      />
    </section>
  );
}

"use client";

import { useMemo, useState } from "react";
import {
  Dream,
  Goal,
  SortdList,
} from "@/lib/types";

type GoalsViewProps = {
  goals: Goal[];
  dreams: Dream[];
  projects: SortdList[];
  onChangeGoals: (goals: Goal[]) => void;
};

export default function GoalsView({
  goals,
  dreams,
  projects,
  onChangeGoals,
}: GoalsViewProps) {
  const [newGoalTitle, setNewGoalTitle] =
    useState("");

  const activeGoals = useMemo(
    () =>
      goals.filter(
        (goal) => goal.status !== "completed"
      ),
    [goals]
  );

  function addGoal() {
    const title = newGoalTitle.trim();

    if (!title) return;

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

  function updateGoal(
    id: string,
    updates: Partial<Goal>
  ) {
    onChangeGoals(
      goals.map((goal) =>
        goal.id === id
          ? {
              ...goal,
              ...updates,
            }
          : goal
      )
    );
  }

  function deleteGoal(id: string) {
    const goal = goals.find(
      (item) => item.id === id
    );

    if (!goal) return;

    const confirmed = window.confirm(
      `Delete "${goal.title}"?`
    );

    if (!confirmed) return;

    onChangeGoals(
      goals.filter((goal) => goal.id !== id)
    );
  }

  return (
    <section className="rounded-3xl bg-white/85 p-8 shadow-xl backdrop-blur-md">
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-sm font-medium text-fuchsia-700">
            Direction
          </p>

          <h1 className="mt-1 text-3xl font-bold">
            Goals
          </h1>

          <p className="mt-2 text-slate-500">
            Turn the things you want into things
            you can actively work towards.
          </p>
        </div>

        <div className="flex gap-3">
          <input
            value={newGoalTitle}
            onChange={(event) =>
              setNewGoalTitle(
                event.target.value
              )
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                addGoal();
              }
            }}
            placeholder="Add a goal..."
            className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-fuchsia-400"
          />

          <button
            type="button"
            onClick={addGoal}
            className="rounded-2xl bg-[#1f0825] px-5 py-3 font-medium text-white"
          >
            Add goal
          </button>
        </div>

        {activeGoals.length === 0 ? (
          <div className="rounded-2xl bg-[#f3eeee] px-6 py-12 text-center">
            <p className="font-medium text-slate-700">
              No goals yet.
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Add something you want to make
              meaningful progress towards.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeGoals.map((goal) => {
              const linkedDream =
                dreams.find(
                  (dream) =>
                    dream.id === goal.dreamId
                );

              const linkedProjects =
                projects.filter(
                  (project) =>
                    project.goalId === goal.id
                );

              const completedProjects =
                linkedProjects.filter(
                  (project) =>
                    project.status ===
                    "completed"
                );

              const progress =
                linkedProjects.length > 0
                  ? Math.round(
                      (completedProjects.length /
                        linkedProjects.length) *
                        100
                    )
                  : 0;

              return (
                <article
                  key={goal.id}
                  className="rounded-2xl border border-slate-200 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <input
                        value={goal.title}
                        onChange={(event) =>
                          updateGoal(goal.id, {
                            title:
                              event.target.value,
                          })
                        }
                        className="w-full bg-transparent text-lg font-semibold outline-none"
                      />

                      <textarea
                        value={
                          goal.description ?? ""
                        }
                        onChange={(event) =>
                          updateGoal(goal.id, {
                            description:
                              event.target.value,
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
                        deleteGoal(goal.id)
                      }
                      className="text-sm text-slate-400 hover:text-red-600"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <select
                      value={
                        goal.dreamId ?? ""
                      }
                      onChange={(event) =>
                        updateGoal(goal.id, {
                          dreamId:
                            event.target
                              .value ||
                            undefined,
                        })
                      }
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                    >
                      <option value="">
                        No linked dream
                      </option>

                      {dreams.map((dream) => (
                        <option
                          key={dream.id}
                          value={dream.id}
                        >
                          {dream.title}
                        </option>
                      ))}
                    </select>

                    <select
                      value={goal.status}
                      onChange={(event) =>
                        updateGoal(goal.id, {
                          status:
                            event.target
                              .value as Goal["status"],
                        })
                      }
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                    >
                      <option value="active">
                        Active
                      </option>
                      <option value="paused">
                        Paused
                      </option>
                      <option value="completed">
                        Completed
                      </option>
                    </select>
                  </div>

                  {linkedDream && (
                    <p className="mt-4 text-sm text-fuchsia-700">
                      ✦ {linkedDream.title}
                    </p>
                  )}

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">
                        {
                          linkedProjects.length
                        }{" "}
                        linked project
                        {linkedProjects.length ===
                        1
                          ? ""
                          : "s"}
                      </span>

                      <span className="font-medium">
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
    </section>
  );
}
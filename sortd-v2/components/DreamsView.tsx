"use client";

import { useState } from "react";
import {
  Dream,
  Goal,
} from "@/lib/types";

type DreamsViewProps = {
  dreams: Dream[];
  goals: Goal[];
  onChangeDreams: (dreams: Dream[]) => void;
};

export default function DreamsView({
  dreams,
  goals,
  onChangeDreams,
}: DreamsViewProps) {
  const [newDreamTitle, setNewDreamTitle] =
    useState("");

  function addDream() {
    const title = newDreamTitle.trim();

    if (!title) return;

    const newDream: Dream = {
      id: crypto.randomUUID(),
      title,
      description: "",
      category: "",
      createdAt: new Date().toISOString(),
    };

    onChangeDreams([
      ...dreams,
      newDream,
    ]);

    setNewDreamTitle("");
  }

  function updateDream(
    id: string,
    updates: Partial<Dream>
  ) {
    onChangeDreams(
      dreams.map((dream) =>
        dream.id === id
          ? {
              ...dream,
              ...updates,
            }
          : dream
      )
    );
  }

  function deleteDream(id: string) {
    const dream = dreams.find(
      (item) => item.id === id
    );

    if (!dream) return;

    const linkedGoals =
      goals.filter(
        (goal) =>
          goal.dreamId === id
      );

    const message =
      linkedGoals.length > 0
        ? `"${dream.title}" has ${linkedGoals.length} linked goal${
            linkedGoals.length === 1 ? "" : "s"
          }. Delete the dream anyway?`
        : `Delete "${dream.title}"?`;

    const confirmed =
      window.confirm(message);

    if (!confirmed) return;

    onChangeDreams(
      dreams.filter(
        (dream) =>
          dream.id !== id
      )
    );
  }

  return (
    <section className="rounded-3xl bg-white/85 p-8 shadow-xl backdrop-blur-md">
      <div className="space-y-8">
        <div>
          <p className="text-sm font-medium text-fuchsia-700">
            Bigger picture
          </p>

          <h1 className="mt-1 text-3xl font-bold">
            Dreams
          </h1>

          <p className="mt-2 max-w-2xl text-slate-500">
            Capture the things you want your life
            to move towards. Goals can turn them
            into something concrete.
          </p>
        </div>

        <div className="flex gap-3">
          <input
            value={newDreamTitle}
            onChange={(event) =>
              setNewDreamTitle(
                event.target.value
              )
            }
            onKeyDown={(event) => {
              if (
                event.key === "Enter"
              ) {
                addDream();
              }
            }}
            placeholder="What would you love to make happen?"
            className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-fuchsia-400"
          />

          <button
            type="button"
            onClick={addDream}
            className="rounded-2xl bg-[#1f0825] px-5 py-3 font-medium text-white"
          >
            Add dream
          </button>
        </div>

        {dreams.length === 0 ? (
          <div className="rounded-3xl bg-[#f3eeee] px-8 py-16 text-center">
            <div className="text-3xl">
              ✦
            </div>

            <p className="mt-4 font-semibold text-slate-700">
              Your bigger picture starts here.
            </p>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              A dream does not need a deadline
              or a perfect plan. Add something
              you would genuinely like your life
              to move towards.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-2">
            {dreams.map(
              (dream) => {
                const linkedGoals =
                  goals.filter(
                    (goal) =>
                      goal.dreamId ===
                      dream.id
                  );

                const activeGoals =
                  linkedGoals.filter(
                    (goal) =>
                      goal.status ===
                      "active"
                  );

                const completedGoals =
                  linkedGoals.filter(
                    (goal) =>
                      goal.status ===
                      "completed"
                  );

                return (
                  <article
                    key={dream.id}
                    className="flex min-h-[260px] flex-col rounded-3xl border border-slate-200 bg-white p-6"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-xl text-fuchsia-700">
                        ✦
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          deleteDream(
                            dream.id
                          )
                        }
                        className="text-sm text-slate-400 transition hover:text-red-600"
                      >
                        Delete
                      </button>
                    </div>

                    <input
                      value={
                        dream.title
                      }
                      onChange={(
                        event
                      ) =>
                        updateDream(
                          dream.id,
                          {
                            title:
                              event
                                .target
                                .value,
                          }
                        )
                      }
                      className="mt-4 w-full bg-transparent text-xl font-semibold outline-none"
                    />

                    <textarea
                      value={
                        dream.description
                      }
                      onChange={(
                        event
                      ) =>
                        updateDream(
                          dream.id,
                          {
                            description:
                              event
                                .target
                                .value,
                          }
                        )
                      }
                      placeholder="What does this look or feel like?"
                      rows={3}
                      className="mt-3 w-full resize-none bg-transparent text-sm leading-6 text-slate-500 outline-none"
                    />

                    <div className="mt-auto pt-6">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                          Goals
                        </p>

                        <span className="text-xs text-slate-400">
                          {
                            completedGoals.length
                          }{" "}
                          complete
                        </span>
                      </div>

                      {linkedGoals.length ===
                      0 ? (
                        <p className="mt-3 text-sm text-slate-400">
                          No goals linked yet.
                        </p>
                      ) : (
                        <div className="mt-3 space-y-2">
                          {linkedGoals.map(
                            (goal) => (
                              <div
                                key={
                                  goal.id
                                }
                                className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2"
                              >
                                <span
                                  className={`min-w-0 truncate text-sm ${
                                    goal.status ===
                                    "completed"
                                      ? "text-slate-400 line-through"
                                      : "text-slate-700"
                                  }`}
                                >
                                  {
                                    goal.title
                                  }
                                </span>

                                <span className="shrink-0 text-xs capitalize text-slate-400">
                                  {
                                    goal.status
                                  }
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      )}

                      {activeGoals.length >
                        0 && (
                        <p className="mt-3 text-xs text-fuchsia-700">
                          {
                            activeGoals.length
                          }{" "}
                          active goal
                          {activeGoals.length ===
                          1
                            ? ""
                            : "s"}{" "}
                          moving this
                          forward
                        </p>
                      )}
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}
      </div>
    </section>
  );
}
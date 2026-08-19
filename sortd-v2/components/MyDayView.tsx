"use client";

import { useState } from "react";
import { Energy, Task } from "@/lib/types";

type TaskWithProject = Task & {
  projectId: string;
  projectName: string;
};

type MyDayViewProps = {
  tasks: TaskWithProject[];
  onOpenProject: (projectId: string) => void;
};

function getLocalDateKey() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function scoreTask(
  task: TaskWithProject,
  today: string,
  availableMinutes: number,
  currentEnergy: Energy
) {
  let score = 0;

  if (task.dueDate && task.dueDate < today) score += 100;
  if (task.dueDate === today) score += 75;

  if (task.priority === "high") score += 30;
  if (task.priority === "medium") score += 15;

  if (task.energy === currentEnergy) {
    score += 25;
  } else if (task.energy) {
    score -= 10;
  }

  if (
    task.durationMinutes &&
    task.durationMinutes <= availableMinutes
  ) {
    score += 20;
  }

  return score;
}

function getRecommendationReasons(
  task: TaskWithProject,
  today: string,
  availableMinutes: number,
  currentEnergy: Energy
) {
  const reasons: string[] = [];

  if (task.dueDate && task.dueDate < today) {
    reasons.push("overdue");
  } else if (task.dueDate === today) {
    reasons.push("due today");
  }

  if (task.priority === "high") {
    reasons.push("high priority");
  }

  if (task.energy === currentEnergy) {
    reasons.push(`matches ${currentEnergy} energy`);
  }

  if (
    task.durationMinutes &&
    task.durationMinutes <= availableMinutes
  ) {
    reasons.push("fits your available time");
  }

  return reasons;
}

function formatDuration(minutes?: number) {
  if (!minutes) return "No estimate";
  if (minutes < 60) return `${minutes} min`;

  const hours = minutes / 60;
  return Number.isInteger(hours)
    ? `${hours} hr`
    : `${hours.toFixed(1)} hrs`;
}

export default function MyDayView({
  tasks,
  onOpenProject,
}: MyDayViewProps) {
  const today = getLocalDateKey();

  const [availableMinutes, setAvailableMinutes] =
  useState(60);

  const [currentEnergy, setCurrentEnergy] =
  useState<Energy>("medium");

  const openTasks = tasks.filter((task) => !task.completed);

  const dueToday = openTasks.filter(
    (task) => task.dueDate === today
  );

  const overdue = openTasks.filter(
    (task) => task.dueDate && task.dueDate < today
  );

  const workloadMinutes = dueToday.reduce(
    (total, task) => total + (task.durationMinutes ?? 0),
    0
  );

const tasksThatFit = openTasks.filter(
  (task) =>
    !task.durationMinutes ||
    task.durationMinutes <= availableMinutes
);

const recommendedTask = [...tasksThatFit].sort(
  (firstTask, secondTask) =>
    scoreTask(
      secondTask,
      today,
      availableMinutes,
      currentEnergy
    ) -
    scoreTask(
      firstTask,
      today,
      availableMinutes,
      currentEnergy
    )
)[0];

const recommendationReasons = recommendedTask
  ? getRecommendationReasons(
      recommendedTask,
      today,
      availableMinutes,
      currentEnergy
    )
  : [];

  const formattedDate = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  function renderTask(task: TaskWithProject) {
    return (
      <button
        key={`${task.projectId}-${task.id}`}
        type="button"
        onClick={() => onOpenProject(task.projectId)}
        className="flex w-full items-center justify-between gap-4 rounded-xl bg-[#eeeaea] px-4 py-3 text-left transition hover:bg-[#cdbfd1]"
      >
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-900">
            {task.title || "Untitled task"}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {task.projectName}
          </p>
        </div>

        <div className="shrink-0 text-right text-xs text-slate-500">
          <p>{formatDuration(task.durationMinutes)}</p>

          {task.priority && (
            <p className="mt-1 capitalize">
              {task.priority} priority
            </p>
          )}
        </div>
      </button>
    );
  }

  return (
    <div className="rounded-3xl bg-white/85 p-5 shadow-xl backdrop-blur-md md:p-8">
      <div className="mb-8">
        <p className="text-sm font-medium text-[#9d3db7]">
          {formattedDate}
        </p>

        <h1 className="mt-1 text-3xl font-bold text-slate-950">
          My Day
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Here’s what deserves your attention today.
        </p>
      </div>

      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-[#f3eeee] p-4">
          <p className="text-2xl font-bold">{dueToday.length}</p>
          <p className="text-sm text-slate-500">Due today</p>
        </div>

        <div className="rounded-2xl bg-[#f3eeee] p-4">
          <p className="text-2xl font-bold text-red-600">
            {overdue.length}
          </p>
          <p className="text-sm text-slate-500">Overdue</p>
        </div>

        <div className="rounded-2xl bg-[#f3eeee] p-4">
          <p className="text-2xl font-bold">
            {formatDuration(workloadMinutes)}
          </p>
          <p className="text-sm text-slate-500">
            Estimated workload
          </p>
        </div>
      </div>

      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-end gap-4">
            <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-slate-600">
            How much time do you have?

            <select
                value={availableMinutes}
                onChange={(event) =>
                setAvailableMinutes(Number(event.target.value))
                }
                className="rounded-xl border border-slate-200 bg-[#f8f5f5] px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#cd6ce7]"
            >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">1 hour</option>
                <option value="90">1½ hours</option>
                <option value="120">2 hours</option>
                <option value="240">Half a day</option>
            </select>
            </label>

            <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-slate-600">
            What’s your energy like?

            <select
                value={currentEnergy}
                onChange={(event) =>
                setCurrentEnergy(event.target.value as Energy)
                }
                className="rounded-xl border border-slate-200 bg-[#f8f5f5] px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#cd6ce7]"
            >
                <option value="low">Low energy</option>
                <option value="medium">Medium energy</option>
                <option value="high">High energy</option>
            </select>
            </label>
        </div>
        </section>

      {recommendedTask && (
        <section className="mb-8 rounded-2xl bg-[#1f0825] p-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#e3a6f3]">
            Best next move
          </p>

          <h2 className="mt-2 text-xl font-semibold">
            {recommendedTask.title || "Untitled task"}
          </h2>

          <p className="mt-1 text-sm text-white/65">
            {recommendedTask.projectName} ·{" "}
            {formatDuration(recommendedTask.durationMinutes)}
          </p>

            {recommendationReasons.length > 0 && (
          <p className="mt-3 text-sm text-[#e3a6f3]">
                Suggested because it’s{" "}
                {recommendationReasons.join(", ")}.
          </p>
            )}

        {!recommendedTask && (
        <section className="mb-8 rounded-2xl bg-[#f3eeee] p-5 text-center">
            <p className="font-medium">
            Nothing fits that window.
            </p>

            <p className="mt-1 text-sm text-slate-500">
            Try allowing more time or add estimates to your tasks.
            </p>
        </section>
        )}

          <button
            type="button"
            onClick={() =>
              onOpenProject(recommendedTask.projectId)
            }
            className="mt-4 rounded-xl bg-white px-4 py-2 text-sm font-medium text-[#1f0825]"
          >
            Open task
          </button>
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-lg font-semibold">
            Due today
          </h2>

          <div className="space-y-2">
            {dueToday.length > 0 ? (
              dueToday.map(renderTask)
            ) : (
              <p className="rounded-xl bg-[#f3eeee] px-4 py-6 text-center text-sm text-slate-500">
                Nothing due today.
              </p>
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">
            Overdue
          </h2>

          <div className="space-y-2">
            {overdue.length > 0 ? (
              overdue.map(renderTask)
            ) : (
              <p className="rounded-xl bg-[#f3eeee] px-4 py-6 text-center text-sm text-slate-500">
                Nothing overdue. Lovely.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
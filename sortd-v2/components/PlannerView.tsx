"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Routine,
  RoutineTask,
  ScheduledBlock,
  ScheduleSettings,
  Task,
} from "@/lib/types";

import {
  buildRollingSchedule,
  getScheduleDateKeys,
  SchedulableProjectTask,
} from "@/lib/scheduler";

import ScheduleSettingsView from "@/components/ScheduleSettingsView";
import ItemDetailsModal from "@/components/ItemDetailsModal";

type PlannerViewProps = {
  tasks: SchedulableProjectTask[];

  routines: Routine[];

  settings: ScheduleSettings;

  onChangeSettings: (
    settings: ScheduleSettings
  ) => void;

  onCompleteProjectTask: (
    projectId: string,
    taskId: string
  ) => void;

  onCompleteRoutineTask: (
    routineId: string,
    taskId: string
  ) => void;

  onUpdateProjectTask: (
    projectId: string,
    taskId: string,
    updates: Partial<Task>
  ) => void;

  onUpdateRoutineTask: (
    routineId: string,
    taskId: string,
    updates: Partial<RoutineTask>
  ) => void;

  onDeleteProjectTask: (
    projectId: string,
    taskId: string
  ) => void;

  onDeleteRoutineTask: (
    routineId: string,
    taskId: string
  ) => void;
};

function getDateKeyInTimeZone(
  date: Date,
  timeZone: string
) {
  const parts = new Intl.DateTimeFormat(
    "en-GB",
    {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).formatToParts(date);

  const year = parts.find(
    (part) => part.type === "year"
  )?.value;

  const month = parts.find(
    (part) => part.type === "month"
  )?.value;

  const day = parts.find(
    (part) => part.type === "day"
  )?.value;

  return `${year}-${month}-${day}`;
}

function getTimeInTimeZone(
  date: Date,
  timeZone: string
) {
  const parts = new Intl.DateTimeFormat(
    "en-GB",
    {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }
  ).formatToParts(date);

  const hour =
    parts.find(
      (part) => part.type === "hour"
    )?.value ?? "00";

  const minute =
    parts.find(
      (part) => part.type === "minute"
    )?.value ?? "00";

  return `${hour}:${minute}`;
}

function formatDate(
  dateKey: string,
  timeZone: string
) {
  const [year, month, day] = dateKey
    .split("-")
    .map(Number);

  const safeDate = new Date(
    Date.UTC(year, month - 1, day, 12)
  );

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      timeZone,
      weekday: "long",
      day: "numeric",
      month: "long",
    }
  ).format(safeDate);
}

function formatMinutes(minutes: number) {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = minutes / 60;

  return Number.isInteger(hours)
    ? `${hours} hr`
    : `${hours.toFixed(1)} hrs`;
}

export default function PlannerView({
  tasks,

  routines,

  settings,

  onChangeSettings,

  onCompleteProjectTask,
  onCompleteRoutineTask,

  onUpdateProjectTask,
  onUpdateRoutineTask,

  onDeleteProjectTask,
  onDeleteRoutineTask,
}: PlannerViewProps) {
  const [clock, setClock] = useState(
    () => new Date()
  );

  const [
    selectedBlock,
    setSelectedBlock,
  ] = useState<ScheduledBlock | null>(
    null
  );

  useEffect(() => {
    const timer = window.setInterval(
      () => {
        setClock(new Date());
      },
      60_000
    );

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const today = getDateKeyInTimeZone(
    clock,
    settings.timeZone
  );

  const currentTime = getTimeInTimeZone(
  clock,
  settings.timeZone
);

  const schedule = useMemo(
    () =>
      buildRollingSchedule({
        tasks,
        routines,
        settings,
        today,
        currentTime,
      }),
    [
    tasks,
    routines,
    settings,
    today,
    currentTime,
    ]
  );

  const dateKeys = useMemo(
    () =>
      getScheduleDateKeys(
        today,
        settings.planningHorizonDays
      ),
    [
      today,
      settings.planningHorizonDays,
    ]
  );

  const plannedMinutes =
    schedule.blocks.reduce(
      (total, block) =>
        total + block.durationMinutes,
      0
    );

    const selectedProjectTask =
  selectedBlock?.sourceType === "task"
    ? tasks.find(
        (task) =>
          task.id ===
            selectedBlock.sourceId &&
          task.projectId ===
            selectedBlock.parentId
      )
    : undefined;

const selectedRoutineTask =
  selectedBlock?.sourceType ===
  "routine"
    ? routines
        .find(
          (routine) =>
            routine.id ===
            selectedBlock.parentId
        )
        ?.tasks.find(
          (task) =>
            task.id ===
            selectedBlock.sourceId
        )
    : undefined;

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-white/85 p-5 shadow-xl backdrop-blur-md md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#9d3db7]">
              Planner
            </p>

            <h1 className="mt-1 text-3xl font-bold text-slate-950">
              Your rolling schedule
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Automatically planned in{" "}
              {settings.timeZone}.
            </p>
          </div>

          <div className="flex gap-3">
            <div className="rounded-xl bg-[#f3eeee] px-4 py-3 text-center">
              <p className="text-xl font-bold">
                {schedule.blocks.length}
              </p>
              <p className="text-xs text-slate-500">
                Planned
              </p>
            </div>

            <div className="rounded-xl bg-[#f3eeee] px-4 py-3 text-center">
              <p className="text-xl font-bold">
                {formatMinutes(
                  plannedMinutes
                )}
              </p>
              <p className="text-xs text-slate-500">
                Scheduled
              </p>
            </div>
          </div>
        </div>

        <details className="mt-6 rounded-2xl border border-slate-200 bg-slate-50">
          <summary className="cursor-pointer px-4 py-3 font-medium text-slate-700">
            Edit availability and working
            hours
          </summary>

          <div className="border-t border-slate-200 p-3">
            <ScheduleSettingsView
              settings={settings}
              onChangeSettings={
                onChangeSettings
              }
            />
          </div>
        </details>
      </div>

      <div className="space-y-4">
        {dateKeys.map((dateKey) => {
          const blocks =
            schedule.blocks.filter(
              (block) =>
                block.date === dateKey
            );

          return (
            <section
              key={dateKey}
              className="rounded-3xl bg-white/85 p-5 shadow-lg backdrop-blur-md"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">
                    {formatDate(
                      dateKey,
                      settings.timeZone
                    )}
                  </h2>

                  {dateKey === today && (
                    <p className="text-xs font-medium text-[#9d3db7]">
                      Today
                    </p>
                  )}
                </div>

                <span className="text-sm text-slate-400">
                  {blocks.length}{" "}
                  {blocks.length === 1
                    ? "item"
                    : "items"}
                </span>
              </div>

              {blocks.length > 0 ? (
                <div className="space-y-2">
                  {blocks.map((block) => (
                  <div
                    key={block.id}
                    className="grid gap-3 rounded-2xl bg-[#f3eeee] px-4 py-3 sm:grid-cols-[44px_130px_1fr_auto] sm:items-center"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          block.sourceType ===
                          "routine"
                        ) {
                          onCompleteRoutineTask(
                            block.parentId,
                            block.sourceId
                          );

                          return;
                        }

                        onCompleteProjectTask(
                          block.parentId,
                          block.sourceId
                        );
                      }}
                      aria-label={`Complete ${block.title}`}
                      title={
                        block.sourceType ===
                        "routine"
                          ? "Complete routine task"
                          : "Mark whole task complete"
                      }
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-[#cd6ce7] font-bold text-[#9d3db7] transition hover:bg-[#cd6ce7] hover:text-white"
                    >
                      ✓
                    </button>

                    <p className="font-semibold text-[#1f0825]">
                      {block.startTime}–
                      {block.endTime}
                    </p>

                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">
                        {block.title}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {block.parentName} ·{" "}
                        {block.sourceType ===
                        "routine"
                          ? "Routine"
                          : "Project task"}

                        {block.sessionIndex &&
                          block.totalDurationMinutes &&
                          block.totalDurationMinutes >
                            block.durationMinutes && (
                            <>
                              {" "}
                              · Session{" "}
                              {block.sessionIndex}
                            </>
                          )}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className={`rounded-full px-2.5 py-1 ${
                          block.context === "work"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-purple-100 text-purple-700"
                        }`}
                      >
                        {block.context}
                      </span>

                      {block.usedDefaultDuration && (
                        
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-800">
                          30 min assumed
                        </span>
                        
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedBlock(block)
                        }
                        aria-label={`Edit ${block.title}`}
                        title="Edit task details"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm text-slate-500 transition hover:bg-white hover:text-slate-900"
                      >
                        •••
                      </button>
                    </div>
                  </div>
                ))}
                </div>
              ) : (
                <p className="rounded-2xl bg-[#f3eeee] px-4 py-7 text-center text-sm text-slate-500">
                  Nothing scheduled.
                </p>
              )}
            </section>
          );
        })}
      </div>

      {schedule.unscheduled.length > 0 && (
        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="font-semibold text-amber-950">
            Couldn&apos;t fit everything
          </h2>

          <p className="mt-1 text-sm text-amber-800">
            Try extending your planning
            horizon, adding availability or
            shortening task estimates.
          </p>

          <div className="mt-4 space-y-2">
            {schedule.unscheduled.map(
              (item) => (
                <div
                  key={item.id}
                  className="rounded-xl bg-white/70 px-4 py-3"
                >
                  <p className="font-medium text-slate-900">
                    {item.title}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {item.reason}
                  </p>
                </div>
              )
            )}
          </div>
        </section>
      )}

      {selectedBlock &&
  selectedProjectTask && (
    <ItemDetailsModal
      kind="task"
      item={
        selectedProjectTask
      }
      onChange={(updates) =>
        onUpdateProjectTask(
          selectedBlock.parentId,
          selectedProjectTask.id,
          updates
        )
      }
      onDelete={() =>
        onDeleteProjectTask(
          selectedBlock.parentId,
          selectedProjectTask.id
        )
      }
      onClose={() =>
        setSelectedBlock(null)
      }
    />
  )}

{selectedBlock &&
  selectedRoutineTask && (
    <ItemDetailsModal
      kind="routine"
      item={
        selectedRoutineTask
      }
      onChange={(updates) =>
        onUpdateRoutineTask(
          selectedBlock.parentId,
          selectedRoutineTask.id,
          updates
        )
      }
      onDelete={() =>
        onDeleteRoutineTask(
          selectedBlock.parentId,
          selectedRoutineTask.id
        )
      }
      onClose={() =>
        setSelectedBlock(null)
      }
    />
  )}
    </div>
  );
}
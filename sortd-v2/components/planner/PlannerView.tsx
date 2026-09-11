"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import {
  AdhocTask,
  PlannerOverride,
  PlannerPeriod,
  Routine,
  RoutineTask,
  ScheduleSettings,
  ScheduledBlock,
  Task,
} from "@/lib/types";

import {
  buildRollingSchedule,
  getScheduleDateKeys,
  SchedulableProjectTask,
} from "@/lib/scheduler";

import ItemDetailsModal from "@/components/task_management/ItemDetailsModal";

type PlannerViewProps = {
  tasks: SchedulableProjectTask[];
  routines: Routine[];
  adhocTasks: AdhocTask[];
  settings: ScheduleSettings;
  plannerOverrides: PlannerOverride[];

  onChangeSettings: (settings: ScheduleSettings) => void;
  onChangePlannerOverrides: (overrides: PlannerOverride[]) => void;

  onCompleteProjectTask: (projectId: string, taskId: string) => void;
  onCompleteRoutineTask: (routineId: string, taskId: string) => void;

  onUpdateProjectTask: (
    projectId: string,
    taskId: string,
    updates: Partial<Task>,
  ) => void;

  onUpdateRoutineTask: (
    routineId: string,
    taskId: string,
    updates: Partial<RoutineTask>,
  ) => void;

  onDeleteProjectTask: (projectId: string, taskId: string) => void;
  onDeleteRoutineTask: (routineId: string, taskId: string) => void;

  onAddAdhocTask: (task: AdhocTask) => void;
  onCompleteAdhocTask: (taskId: string) => void;
  onUpdateAdhocTask: (taskId: string, updates: Partial<AdhocTask>) => void;
  onDeleteAdhocTask: (taskId: string) => void;
};

const DAY_START_HOUR = 6;
const DAY_END_HOUR = 23;
const SLOT_MINUTES = 30;
const SLOT_HEIGHT = 42;
const TIME_COLUMN_WIDTH = 64;
const DAY_COLUMN_WIDTH = 154;

const TOTAL_MINUTES = (DAY_END_HOUR - DAY_START_HOUR) * 60;
const TOTAL_SLOTS = TOTAL_MINUTES / SLOT_MINUTES;
const GRID_HEIGHT = TOTAL_SLOTS * SLOT_HEIGHT;

function getDateKeyInTimeZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function getTimeInTimeZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const hour = parts.find((part) => part.type === "hour")?.value ?? "00";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";

  return `${hour}:${minute}`;
}

function formatDayHeader(dateKey: string, timeZone: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const safeDate = new Date(Date.UTC(year, month - 1, day, 12));

  const weekday = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    weekday: "short",
  }).format(safeDate);

  const date = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    day: "numeric",
    month: "short",
  }).format(safeDate);

  return { weekday, date };
}

function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes} min`;

  const hours = minutes / 60;
  return Number.isInteger(hours) ? `${hours} hr` : `${hours.toFixed(1)} hrs`;
}

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(totalMinutes: number) {
  const safeMinutes = Math.max(0, Math.min(totalMinutes, 24 * 60));
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function getPlannerPeriod(time: string): PlannerPeriod {
  const minutes = timeToMinutes(time);

  if (minutes < 12 * 60) return "morning";
  if (minutes < 17 * 60) return "afternoon";
  return "evening";
}

function getBlockTop(startTime: string) {
  const start = Math.max(
    DAY_START_HOUR * 60,
    Math.min(timeToMinutes(startTime), DAY_END_HOUR * 60),
  );

  return ((start - DAY_START_HOUR * 60) / SLOT_MINUTES) * SLOT_HEIGHT;
}

function getBlockHeight(
  startTime: string,
  endTime: string,
  nextStartTime?: string,
) {
  const start = Math.max(
    DAY_START_HOUR * 60,
    timeToMinutes(startTime),
  );

  const end = Math.min(
    DAY_END_HOUR * 60,
    timeToMinutes(endTime),
  );

  const durationMinutes = Math.max(1, end - start);

  const realHeight =
    (durationMinutes / SLOT_MINUTES) * SLOT_HEIGHT;

  const desiredHeight = Math.max(
    24,
    realHeight - 2,
  );

  if (!nextStartTime) {
    return desiredHeight;
  }

  const nextStart = timeToMinutes(nextStartTime);
  const gapMinutes = nextStart - start;

  const availableHeight =
    (gapMinutes / SLOT_MINUTES) * SLOT_HEIGHT - 4;

  return Math.max(
    12,
    Math.min(desiredHeight, availableHeight),
  );
}

function matchesOverride(block: ScheduledBlock, override: PlannerOverride) {
  if (
    block.sourceType !== override.sourceType ||
    block.sourceId !== override.sourceId ||
    block.parentId !== override.parentId
  ) {
    return false;
  }

  if (block.sourceType === "routine") {
    return block.occurrenceDate === override.occurrenceDate;
  }

  return true;
}

function getRoutineTaskForBlock(routines: Routine[], block: ScheduledBlock) {
  if (block.sourceType !== "routine") return undefined;

  return routines
    .find((routine) => routine.id === block.parentId)
    ?.tasks.find((task) => task.id === block.sourceId);
}

function CalendarSlot({
  date,
  startTime,
}: {
  date: string;
  startTime: string;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `${date}::${startTime}`,
    data: {
      date,
      slotStartTime: startTime,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`absolute left-0 right-0 border-t transition ${
        isOver
          ? "z-20 border-[#b53fd0] bg-purple-100/70"
          : startTime.endsWith(":00")
            ? "border-slate-200"
            : "border-slate-100"
      }`}
      style={{
        top:
          ((timeToMinutes(startTime) - DAY_START_HOUR * 60) / SLOT_MINUTES) *
          SLOT_HEIGHT,
        height: SLOT_HEIGHT,
      }}
    >
      {isOver && (
        <div className="pointer-events-none absolute left-1 right-1 top-0 h-0.5 bg-[#b53fd0]" />
      )}
    </div>
  );
}

function CalendarTaskBlock({
  block,
  nextStartTime,
  anchored,
  manuallyPlaced,
  onComplete,
  onEdit,
  onResetToAuto,
}: {
  block: ScheduledBlock;
  nextStartTime?: string;
  anchored: boolean;
  manuallyPlaced: boolean;
  onComplete: () => void;
  onEdit: () => void;
  onResetToAuto: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: block.id,
      disabled: anchored,
      data: { block },
    });

  const height = getBlockHeight(
    block.startTime,
    block.endTime,
    nextStartTime,
  );

  const isShortBlock =
    block.durationMinutes < 20;

  const style = {
    top: `${getBlockTop(block.startTime) + 2}px`,
    height: `${height}px`,
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`absolute left-1 right-1 z-10 overflow-hidden rounded-lg border shadow-sm transition ${
        isShortBlock ? "px-1.5 py-0" : "px-2 py-1.5"
      } ${
        isDragging
          ? "z-50 border-[#b53fd0] bg-white opacity-90 shadow-xl"
          : anchored
            ? "border-slate-200 bg-slate-100"
            : manuallyPlaced
              ? "border-[#d9a7e7] bg-purple-50"
              : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex h-full min-w-0 items-start gap-1.5">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onComplete();
          }}
          aria-label={`Complete ${block.title}`}
          className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-[var(--sortd-teal-dark)] text-[9px] font-bold text-[var(--sortd-teal-dark)] transition hover:bg-[var(--sortd-teal-dark)] hover:text-white"
        >
          ✓
        </button>

        <button
          type="button"
          onClick={onEdit}
          className="min-w-0 flex-1 text-left"
          title={block.title}
        >
          <p className="truncate text-[12px] font-semibold leading-tight text-slate-900">
            {block.title}
          </p>

          {manuallyPlaced && !anchored && height >= 48 && (
            <span
              role="button"
              tabIndex={0}
              onClick={(event) => {
                event.stopPropagation();
                onResetToAuto();
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  event.stopPropagation();
                  onResetToAuto();
                }
              }}
              className="mt-1 inline-block text-[9px] font-medium text-purple-600 hover:text-purple-800"
              title="Let Sort'd choose again"
            >
              ↺ auto
            </span>
          )}
        </button>

        <button
          type="button"
          {...(!anchored ? attributes : {})}
          {...(!anchored ? listeners : {})}
          aria-label={
            anchored ? `${block.title} is anchored` : `Move ${block.title}`
          }
          title={anchored ? "Anchored routine" : "Drag to reschedule"}
          className={`shrink-0 rounded px-0.5 text-[10px] leading-none ${
            anchored
              ? "cursor-default text-slate-300"
              : "cursor-grab text-slate-400 hover:text-slate-700 active:cursor-grabbing"
          }`}
        >
          {anchored ? "🔒" : "⋮⋮"}
        </button>
      </div>
    </article>
  );
}

export default function PlannerView({
  tasks,
  routines,
  adhocTasks,
  settings,
  plannerOverrides,

  onCompleteProjectTask,
  onCompleteRoutineTask,
  onCompleteAdhocTask,

  onUpdateProjectTask,
  onUpdateRoutineTask,
  onUpdateAdhocTask,

  onDeleteProjectTask,
  onDeleteRoutineTask,
  onDeleteAdhocTask,

  onAddAdhocTask,
  onChangePlannerOverrides,
}: PlannerViewProps) {
  const [clock, setClock] = useState(() => new Date());

  const [selectedItem, setSelectedItem] = useState<{
    sourceType: "task" | "routine" | "adhoc";
    sourceId: string;
    parentId: string;
  } | null>(null);

  const [newAdhocDate, setNewAdhocDate] = useState<string | null>(null);
  const [newAdhocTitle, setNewAdhocTitle] = useState("");

  const [replanVersion, setReplanVersion] = useState(0);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor),
  );

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const today = getDateKeyInTimeZone(clock, settings.timeZone);
  const currentTime = getTimeInTimeZone(clock, settings.timeZone);

  const schedule = useMemo(
    () =>
      buildRollingSchedule({
        tasks,
        routines,
        adhocTasks,
        settings,
        today,
        currentTime,
        plannerOverrides,
      }),
    [
      tasks,
      routines,
      adhocTasks,
      settings,
      today,
      currentTime,
      plannerOverrides,
      replanVersion,
    ],
  );

  const dateKeys = useMemo(() => getScheduleDateKeys(today, 7), [today]);

  const plannedMinutes = schedule.blocks.reduce(
    (total, block) => total + block.durationMinutes,
    0,
  );

  const selectedProjectTask =
    selectedItem?.sourceType === "task"
      ? tasks.find(
          (task) =>
            task.id === selectedItem.sourceId &&
            task.projectId === selectedItem.parentId,
        )
      : undefined;

  const selectedRoutineTask =
    selectedItem?.sourceType === "routine"
      ? routines
          .find((routine) => routine.id === selectedItem.parentId)
          ?.tasks.find((task) => task.id === selectedItem.sourceId)
      : undefined;

  const selectedAdhocTask =
    selectedItem?.sourceType === "adhoc"
      ? adhocTasks.find((task) => task.id === selectedItem.sourceId)
      : undefined;

  function replan() {
    setReplanVersion((version) => version + 1);
  }

  function completeBlock(block: ScheduledBlock) {
    if (block.sourceType === "routine") {
      onCompleteRoutineTask(block.parentId, block.sourceId);
      replan();
      return;
    }

    if (block.sourceType === "adhoc") {
      onCompleteAdhocTask(block.sourceId);
      replan();
      return;
    }

    onCompleteProjectTask(block.parentId, block.sourceId);
    replan();
  }

  function openBlock(block: ScheduledBlock) {
    setSelectedItem({
      sourceType: block.sourceType,
      sourceId: block.sourceId,
      parentId: block.parentId,
    });
  }

  function removeOverride(block: ScheduledBlock) {
    onChangePlannerOverrides(
      plannerOverrides.filter((override) => !matchesOverride(block, override)),
    );

    replan();
  }

  function handleDragEnd(event: DragEndEvent) {
    const block = event.active.data.current?.block as ScheduledBlock | undefined;
    const date = event.over?.data.current?.date as string | undefined;
    const slotStartTime = event.over?.data.current?.slotStartTime as
      | string
      | undefined;

    if (!block || !date || !slotStartTime) return;

    const routineTask = getRoutineTaskForBlock(routines, block);

    const anchored =
      Boolean(block.anchored) ||
      (routineTask?.scheduleMode === "anchored" &&
        Boolean(routineTask.fixedStartTime));

    if (anchored) return;

    const nextOverride: PlannerOverride = {
      sourceType: block.sourceType,
      sourceId: block.sourceId,
      parentId: block.parentId,
      occurrenceDate:
        block.sourceType === "routine" ? block.occurrenceDate : undefined,
      date,
      period: getPlannerPeriod(slotStartTime),
      preferredStartTime: slotStartTime,
      manuallyPlaced: true,
    };

    const withoutPrevious = plannerOverrides.filter(
      (override) => !matchesOverride(block, override),
    );

    onChangePlannerOverrides([...withoutPrevious, nextOverride]);
    replan();
  }

  function addAdhocForDate(dateKey: string) {
    const title = newAdhocTitle.trim();
    if (!title) return;

    onAddAdhocTask({
      id: crypto.randomUUID(),
      title,
      plannedDate: dateKey,
      estimatedMinutes: 30,
      context: "personal",
      completed: false,
      createdAt: new Date().toISOString(),
      order: adhocTasks.length + 1,
    });

    setNewAdhocTitle("");
    setNewAdhocDate(null);
    replan();
  }

  const currentMinutes = timeToMinutes(currentTime);
  const currentTimeTop =
    currentMinutes >= DAY_START_HOUR * 60 &&
    currentMinutes <= DAY_END_HOUR * 60
      ? ((currentMinutes - DAY_START_HOUR * 60) / SLOT_MINUTES) * SLOT_HEIGHT
      : undefined;

  return (
    <div className="w-full min-w-0 max-w-full space-y-5 overflow-hidden">
      <div className="rounded-3xl bg-white/85 p-5 shadow-xl backdrop-blur-md md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--sortd-teal-dark)]">
              Planner
            </p>

            <h1 className="mt-1 text-3xl font-bold text-slate-950">Your week</h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Drag flexible work onto a time slot. Sort&apos;d replans everything
              else around that decision.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={replan}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[var(--sortd-teal-dark)] transition hover:bg-purple-50"
              title="Rebuild the schedule now"
            >
              ↻ Replan
            </button>

            <div className="rounded-xl bg-[#f3eeee] px-4 py-3 text-center">
              <p className="text-xl font-bold">{schedule.blocks.length}</p>
              <p className="text-xs text-slate-500">Planned</p>
            </div>

            <div className="rounded-xl bg-[#f3eeee] px-4 py-3 text-center">
              <p className="text-xl font-bold">{formatMinutes(plannedMinutes)}</p>
              <p className="text-xs text-slate-500">Scheduled</p>
            </div>
          </div>
        </div>
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain pb-2">
          <div
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            style={{
              width: TIME_COLUMN_WIDTH + DAY_COLUMN_WIDTH * dateKeys.length,
              minWidth: TIME_COLUMN_WIDTH + DAY_COLUMN_WIDTH * dateKeys.length,
            }}
          >
            <div
              className="grid border-b border-slate-200 bg-white"
              style={{
                gridTemplateColumns: `${TIME_COLUMN_WIDTH}px repeat(${dateKeys.length}, ${DAY_COLUMN_WIDTH}px)`,
              }}
            >
              <div className="border-r border-slate-200 bg-white" />

              {dateKeys.map((dateKey) => {
                const { weekday, date } = formatDayHeader(
                  dateKey,
                  settings.timeZone,
                );

                return (
                  <div
                    key={dateKey}
                    className={`relative border-r border-slate-200 px-2 py-3 last:border-r-0 ${
                      dateKey === today ? "bg-purple-50/70" : "bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p
                          className={`text-sm font-bold ${
                            dateKey === today
                              ? "text-[var(--sortd-teal-dark)]"
                              : "text-slate-900"
                          }`}
                        >
                          {weekday}
                        </p>

                        <p className="text-[11px] text-slate-500">{date}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setNewAdhocDate(dateKey);
                          setNewAdhocTitle("");
                        }}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#f3eeee] text-xs font-semibold text-[var(--sortd-teal-dark)] transition hover:bg-[#eaddea]"
                        title="Add an ad hoc task"
                      >
                        +
                      </button>
                    </div>

                    {newAdhocDate === dateKey && (
                      <div className="absolute left-1 right-1 top-full z-40 mt-1 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                        <input
                          value={newAdhocTitle}
                          onChange={(event) =>
                            setNewAdhocTitle(event.target.value)
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              addAdhocForDate(dateKey);
                            }

                            if (event.key === "Escape") {
                              setNewAdhocDate(null);
                              setNewAdhocTitle("");
                            }
                          }}
                          placeholder="Add task…"
                          autoFocus
                          className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-[var(--sortd-teal-dark)]"
                        />

                        <div className="mt-2 flex gap-1">
                          <button
                            type="button"
                            disabled={!newAdhocTitle.trim()}
                            onClick={() => addAdhocForDate(dateKey)}
                            className="rounded-md bg-[var(--sortd-teal-dark)] px-2 py-1 text-[10px] font-semibold text-white disabled:opacity-40"
                          >
                            Add
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setNewAdhocDate(null);
                              setNewAdhocTitle("");
                            }}
                            className="px-2 py-1 text-[10px] text-slate-500"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div
              className="grid"
              style={{
                gridTemplateColumns: `${TIME_COLUMN_WIDTH}px repeat(${dateKeys.length}, ${DAY_COLUMN_WIDTH}px)`,
              }}
            >
              <div
                className="relative border-r border-slate-200 bg-white"
                style={{ height: GRID_HEIGHT }}
              >
                {Array.from({
                  length: DAY_END_HOUR - DAY_START_HOUR + 1,
                }).map((_, index) => {
                  const hour = DAY_START_HOUR + index;
                  const top = index * SLOT_HEIGHT * 2;

                  return (
                    <div
                      key={hour}
                      className="absolute left-0 right-0 border-t border-slate-200"
                      style={{ top }}
                    >
                      <span className="absolute right-2 -translate-y-1/2 bg-white px-1 text-[10px] text-slate-400">
                        {minutesToTime(hour * 60)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {dateKeys.map((dateKey) => {
                const dayBlocks = schedule.blocks.filter(
                  (block) => block.date === dateKey,
                );

                return (
                  <div
                    key={dateKey}
                    className={`relative border-r border-slate-200 last:border-r-0 ${
                      dateKey === today ? "bg-purple-50/20" : "bg-white"
                    }`}
                    style={{ height: GRID_HEIGHT }}
                  >
                    {Array.from({ length: TOTAL_SLOTS }).map((_, slotIndex) => {
                      const minutes =
                        DAY_START_HOUR * 60 + slotIndex * SLOT_MINUTES;

                      return (
                        <CalendarSlot
                          key={`${dateKey}-${slotIndex}`}
                          date={dateKey}
                          startTime={minutesToTime(minutes)}
                        />
                      );
                    })}

                    {dateKey === today && currentTimeTop !== undefined && (
                      <div
                        className="pointer-events-none absolute left-0 right-0 z-30 flex items-center"
                        style={{ top: currentTimeTop }}
                      >
                        <span className="h-2 w-2 -translate-x-1/2 rounded-full bg-[#b53fd0]" />
                        <span className="h-0.5 flex-1 bg-[#b53fd0]" />
                      </div>
                    )}

                    {dayBlocks.map((block, index) => {
                      const nextStartTime =
                        dayBlocks[index + 1]?.startTime;
                      const routineTask = getRoutineTaskForBlock(
                        routines,
                        block,
                      );

                      const anchored =
                        Boolean(block.anchored) ||
                        (routineTask?.scheduleMode === "anchored" &&
                          Boolean(routineTask.fixedStartTime));

                      const manuallyPlaced =
                        Boolean(block.manuallyPlaced) ||
                        plannerOverrides.some((override) =>
                          matchesOverride(block, override),
                        );

                      return (
                        <CalendarTaskBlock
                          key={block.id}
                          block={block}
                          nextStartTime={nextStartTime}
                          anchored={anchored}
                          manuallyPlaced={manuallyPlaced}
                          onComplete={() => completeBlock(block)}
                          onEdit={() => openBlock(block)}
                          onResetToAuto={() => removeOverride(block)}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DndContext>

      {schedule.unscheduled.length > 0 && (
        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="font-semibold text-amber-950">
            Couldn&apos;t fit everything
          </h2>

          <p className="mt-1 text-sm text-amber-800">
            These still need space. You can edit their duration or constraints,
            or move other flexible work out of the way.
          </p>

          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {schedule.unscheduled.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-4 rounded-xl bg-white/70 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-slate-900">{item.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.reason}</p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedItem({
                      sourceType: item.sourceType,
                      sourceId: item.sourceId,
                      parentId: item.parentId,
                    })
                  }
                  className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-amber-900 transition hover:bg-amber-100"
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {selectedItem && selectedRoutineTask && (
        <ItemDetailsModal
          kind="routine"
          item={selectedRoutineTask}
          onChange={(updates) =>
            onUpdateRoutineTask(
              selectedItem.parentId,
              selectedRoutineTask.id,
              updates,
            )
          }
          onDelete={() =>
            onDeleteRoutineTask(selectedItem.parentId, selectedRoutineTask.id)
          }
          onClose={() => setSelectedItem(null)}
        />
      )}

      {selectedItem && selectedProjectTask && (
        <ItemDetailsModal
          kind="task"
          item={selectedProjectTask}
          onChange={(updates) =>
            onUpdateProjectTask(
              selectedItem.parentId,
              selectedProjectTask.id,
              updates,
            )
          }
          onDelete={() =>
            onDeleteProjectTask(selectedItem.parentId, selectedProjectTask.id)
          }
          onClose={() => setSelectedItem(null)}
        />
      )}

      {selectedItem && selectedAdhocTask && (
        <ItemDetailsModal
          kind="task"
          item={selectedAdhocTask}
          onChange={(updates) =>
            onUpdateAdhocTask(selectedAdhocTask.id, updates)
          }
          onDelete={() => onDeleteAdhocTask(selectedAdhocTask.id)}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}

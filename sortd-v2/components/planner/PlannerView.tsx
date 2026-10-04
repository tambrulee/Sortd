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
const DAY_END_HOUR = 24;
const SLOT_MINUTES = 30;
const SLOT_HEIGHT = 120;
const TIME_COLUMN_WIDTH = 64;
const DAY_COLUMN_WIDTH = 154;

const TOTAL_MINUTES = (DAY_END_HOUR - DAY_START_HOUR) * 60;
const TOTAL_SLOTS = TOTAL_MINUTES / SLOT_MINUTES;
const GRID_HEIGHT = TOTAL_SLOTS * SLOT_HEIGHT;
const MIN_BLOCK_HEIGHT = 18;
const GRID_BOTTOM_PADDING = MIN_BLOCK_HEIGHT + 12;

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

function getBlockHeight(startTime: string, endTime: string) {
  const start = Math.max(DAY_START_HOUR * 60, timeToMinutes(startTime));
  const end = Math.min(DAY_END_HOUR * 60, timeToMinutes(endTime));
  return Math.max(MIN_BLOCK_HEIGHT, ((Math.max(1, end - start)) / SLOT_MINUTES) * SLOT_HEIGHT - 3);
}

// Share horizontal space when events overlap, including the minimum visual height.
// Keep their true start times on the calendar rather than pushing later events down.
function layoutDayBlocks(blocks: ScheduledBlock[]) {
  const sorted = [...blocks].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  const groups: { block: ScheduledBlock; lane: number }[][] = [];
  let group: { block: ScheduledBlock; lane: number }[] = [];
  let laneEnds: number[] = [];
  let groupEnd = -Infinity;
  for (const block of sorted) {
    const top = getBlockTop(block.startTime);
    if (top >= groupEnd) {
      if (group.length) groups.push(group);
      group = [];
      laneEnds = [];
    }
    let lane = laneEnds.findIndex((end) => end <= top);
    if (lane === -1) lane = laneEnds.length;
    const end = top + getBlockHeight(block.startTime, block.endTime);
    laneEnds[lane] = end;
    groupEnd = Math.max(...laneEnds);
    group.push({ block, lane });
  }
  if (group.length) groups.push(group);
  return groups.flatMap((items) => {
    const lanes = Math.max(...items.map((item) => item.lane)) + 1;
    return items.map((item) => ({ ...item, lanes }));
  });
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
          ? "z-20 border-[var(--sortd-teal-dark)] bg-[var(--sortd-teal)]/15"
          : startTime.endsWith(":00")
            ? "border-[var(--sortd-border)]"
            : "border-[var(--sortd-border)]/40"
      }`}
      style={{
        top:
          ((timeToMinutes(startTime) - DAY_START_HOUR * 60) / SLOT_MINUTES) *
          SLOT_HEIGHT,
        height: SLOT_HEIGHT,
      }}
    >
      {isOver && (
        <div className="pointer-events-none absolute left-1 right-1 top-0 h-0.5 bg-[var(--sortd-teal-dark)]" />
      )}
    </div>
  );
}

function CalendarTaskBlock({
  block,
  lane,
  lanes,
  anchored,
  manuallyPlaced,
  onComplete,
  onEdit,
  onResetToAuto,
}: {
  block: ScheduledBlock;
  lane: number;
  lanes: number;
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

  const height = getBlockHeight(block.startTime, block.endTime);
  const compact = height < 52;

  const style = {
    top: `${getBlockTop(block.startTime) + 2}px`,
    height: `${height}px`,
    left: `calc(${(lane / lanes) * 100}% + 4px)`,
    width: `calc(${100 / lanes}% - 8px)`,
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`absolute z-10 overflow-hidden rounded-md border border-l-[3px] transition ${compact ? "px-1 py-0" : "px-1.5 py-1"} ${
        isDragging
          ? "z-50 border-[var(--sortd-teal-dark)] bg-[var(--sortd-card)] opacity-90 shadow-xl"
          : anchored
            ? "border-[var(--sortd-border)] bg-[var(--sortd-muted)]"
            : manuallyPlaced
              ? "border-[var(--sortd-teal)] bg-[var(--sortd-muted)]"
              : "border-[var(--sortd-border)] border-l-[var(--sortd-teal-dark)] bg-[var(--sortd-surface)]"
      }`}
    >
      {compact ? (
        <div className="flex h-full min-w-0 items-center gap-1">
          <button
            type="button"
            onClick={onEdit}
            title={`${block.title} · ${block.startTime}–${block.endTime}`}
            aria-label={`${block.title}, ${block.startTime} to ${block.endTime}. Edit task.`}
            className="flex h-full min-w-0 flex-1 items-center gap-1 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sortd-teal-dark)]"
          >
            <span className="min-w-0 flex-1 truncate text-[11px] font-medium leading-4 text-[var(--sortd-text)]">{block.title}</span>
            <span className="shrink-0 text-[9px] leading-4 tabular-nums text-[var(--sortd-text-muted)]">{block.startTime}–{block.endTime}</span>
          </button>
          {!anchored && (
            <button type="button" {...attributes} {...listeners} aria-label={`Move ${block.title}`} title="Drag to reschedule" className="flex h-full w-3 shrink-0 touch-none cursor-grab items-center justify-center text-[10px] text-[var(--sortd-text-muted)]">⋮</button>
          )}
        </div>
      ) : (
      <div className="flex h-full min-w-0 items-start gap-1">
        <button type="button" onClick={(event) => { event.stopPropagation(); onComplete(); }} aria-label={`Complete ${block.title}`} title={`Complete ${block.title}`} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md hover:bg-[var(--sortd-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sortd-teal-dark)]">
          <span aria-hidden="true" className="h-3.5 w-3.5 rounded border border-[var(--sortd-teal-dark)]" />
        </button>
        <button type="button" onClick={onEdit} className="min-w-0 flex-1 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sortd-teal-dark)]" title={`${block.title} · ${block.startTime}–${block.endTime}`}>
          <p className="truncate text-xs font-medium leading-5 text-[var(--sortd-text)]">{block.title}</p>
          <p className="whitespace-nowrap text-[11px] leading-4 tabular-nums text-[var(--sortd-text-muted)]">{block.startTime}–{block.endTime}</p>
        </button>
        {manuallyPlaced && !anchored && <button type="button" onClick={onResetToAuto} aria-label={`Return ${block.title} to automatic scheduling`} title="Let Sort’d choose again" className="flex h-6 w-5 shrink-0 items-center justify-center rounded text-xs text-[var(--sortd-teal-dark)] hover:bg-[var(--sortd-muted)]">↺</button>}
        {!anchored ? (
          <button type="button" {...attributes} {...listeners} aria-label={`Move ${block.title}`} title="Drag to reschedule" className="flex h-6 w-5 shrink-0 touch-none cursor-grab items-center justify-center rounded text-xs text-[var(--sortd-text-muted)] active:cursor-grabbing">⋮⋮</button>
        ) : <span title="Anchored routine" aria-label="Anchored routine" className="shrink-0 text-[10px] text-[var(--sortd-text-muted)]">🔒</span>}
      </div>
      )}

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

  const weekBlocks = schedule.blocks.filter((block) => dateKeys.includes(block.date));
  const plannedMinutes = weekBlocks.reduce(
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

  const calendarDayWidths = dateKeys.map(() => DAY_COLUMN_WIDTH);
  const calendarWidth = TIME_COLUMN_WIDTH + calendarDayWidths.reduce(
    (total, width) => total + width, 0,
  );
  const calendarColumns = [
    `${TIME_COLUMN_WIDTH}px`,
    ...calendarDayWidths.map((width) => `${width}px`),
  ].join(" ");

  return (
    <div className="w-full min-w-0 max-w-full space-y-3">
      <header className="rounded-2xl border border-[var(--sortd-border)] bg-[var(--sortd-surface)] px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-[var(--sortd-text)]">Your week</h1>
            <p className="mt-1 text-xs text-[var(--sortd-text-muted)]">{formatDayHeader(dateKeys[0], settings.timeZone).date} – {formatDayHeader(dateKeys[dateKeys.length - 1], settings.timeZone).date} · Drag flexible tasks to reschedule.</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--sortd-text-muted)]">
            <span><strong className="text-[var(--sortd-text)]">{weekBlocks.length}</strong> planned</span>
            <span><strong className="text-[var(--sortd-text)]">{formatMinutes(plannedMinutes)}</strong> scheduled</span>
            <button type="button" onClick={replan} className="min-h-11 rounded-lg bg-[var(--sortd-navy)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--sortd-navy-dark)]">↻ Replan</button>
          </div>
        </div>
      </header>

      <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0">
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div
          className="w-full min-w-0 max-w-full overflow-auto overscroll-contain rounded-2xl border border-[var(--sortd-border)] bg-[var(--sortd-card)] shadow-sm"
          style={{ height: "min(680px, 70dvh)" }}
          tabIndex={0}
          role="region"
          aria-label="Schedule. Scroll horizontally for more days and vertically for more times."
        >
          <div
            className="bg-[var(--sortd-card)]"
            style={{
              width: calendarWidth,
              minWidth: calendarWidth,
            }}
          >
            <div
              className="sticky top-0 z-40 grid border-b border-[var(--sortd-border)] bg-[var(--sortd-card)]"
              style={{
                gridTemplateColumns: calendarColumns,
              }}
            >
              <div className="sticky left-0 z-50 border-r border-[var(--sortd-border)] bg-[var(--sortd-card)]" />

              {dateKeys.map((dateKey) => {
                const { weekday, date } = formatDayHeader(
                  dateKey,
                  settings.timeZone,
                );

                return (
                  <div
                    key={dateKey}
                    className={`relative border-r border-[var(--sortd-border)] px-2 py-3 last:border-r-0 ${
                      dateKey === today ? "bg-[var(--sortd-teal)]/10" : "bg-[var(--sortd-card)]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p
                          className={`text-sm font-bold ${
                            dateKey === today
                              ? "text-[var(--sortd-teal-dark)]"
                              : "text-[var(--sortd-text)]"
                          }`}
                        >
                          {weekday}
                        </p>

                        <p className="text-[11px] text-[var(--sortd-text-muted)]">{date}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setNewAdhocDate(dateKey);
                          setNewAdhocTitle("");
                        }}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--sortd-muted)] text-xs font-semibold text-[var(--sortd-teal-dark)] transition hover:bg-[var(--sortd-border)]"
                        aria-label={`Add task for ${date}`}
                        title="Add an ad hoc task"
                      >
                        +
                      </button>
                    </div>

                    {newAdhocDate === dateKey && (
                      <div className="absolute left-1 right-1 top-full z-40 mt-1 rounded-xl border border-[var(--sortd-border)] bg-[var(--sortd-card)] p-2 shadow-xl">
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
                          className="w-full rounded-lg border border-[var(--sortd-border)] px-2 py-1.5 text-xs outline-none focus:border-[var(--sortd-teal-dark)]"
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
                            className="px-2 py-1 text-[10px] text-[var(--sortd-text-muted)]"
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
                gridTemplateColumns: calendarColumns,
              }}
            >
              <div
                className="sticky left-0 z-30 border-r border-[var(--sortd-border)] bg-[var(--sortd-card)]"
                style={{ height: GRID_HEIGHT + GRID_BOTTOM_PADDING }}
              >
                {Array.from({
                  length: DAY_END_HOUR - DAY_START_HOUR + 1,
                }).map((_, index) => {
                  const hour = DAY_START_HOUR + index;
                  const top = index * SLOT_HEIGHT * 2;

                  return (
                    <div
                      key={hour}
                      className="absolute left-0 right-0 border-t border-[var(--sortd-border)]"
                      style={{ top }}
                    >
                      <span className="absolute right-2 -translate-y-1/2 bg-[var(--sortd-card)] px-1 text-xs tabular-nums text-[var(--sortd-text-muted)]">
                        {minutesToTime(hour * 60)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {dateKeys.map((dateKey) => {
                const dayBlocks = layoutDayBlocks(weekBlocks.filter((block) => block.date === dateKey));

                return (
                  <div
                    key={dateKey}
                    className={`relative border-r border-[var(--sortd-border)] last:border-r-0 ${
                      dateKey === today ? "bg-[var(--sortd-teal)]/5" : "bg-[var(--sortd-card)]"
                    }`}
                    style={{ height: GRID_HEIGHT + GRID_BOTTOM_PADDING }}
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
                        <span className="h-2 w-2 -translate-x-1/2 rounded-full bg-[var(--sortd-teal-dark)]" />
                        <span className="h-0.5 flex-1 bg-[var(--sortd-teal-dark)]" />
                      </div>
                    )}

                    {dayBlocks.map(({ block, lane, lanes }) => {
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
                          lane={lane}
                          lanes={lanes}
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
      </div>
      <aside
        className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[var(--sortd-border)] bg-[var(--sortd-card)]"
        style={{ height: "min(680px, 70dvh)" }}
        aria-label="Scheduled task agenda"
      >
        <div className="border-b border-[var(--sortd-border)] px-4 py-3">
          <h2 className="text-sm font-semibold text-[var(--sortd-text)]">Your agenda</h2>
          <p className="mt-1 text-xs text-[var(--sortd-text-muted)]">Full task details, in time order.</p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      {schedule.unscheduled.length > 0 && (
        <details className="group rounded-xl border border-[var(--sortd-border)] bg-[var(--sortd-surface)]">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm [&::-webkit-details-marker]:hidden">
            <span className="font-medium text-[var(--sortd-text)]">Needs space <span className="ml-2 rounded-full bg-[var(--sortd-muted)] px-2 py-0.5 text-xs">{schedule.unscheduled.length}</span></span>
            <span className="text-[var(--sortd-text-muted)] transition group-open:rotate-180" aria-hidden="true">⌄</span>
          </summary>
          <p className="px-4 text-xs text-[var(--sortd-text-muted)]">These items couldn’t be scheduled. Edit their timing or free up space, then replan.</p>
          <div className="mt-3 grid max-h-64 gap-2 overflow-y-auto overscroll-contain px-4 pb-4">
            {schedule.unscheduled.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-4 min-w-0 rounded-lg border border-[var(--sortd-border)] bg-[var(--sortd-card)] px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="break-words text-sm font-medium text-[var(--sortd-text)]">{item.title}</p>
                  <p className="mt-1 text-xs text-[var(--sortd-text-muted)]">{item.reason}</p>
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
                  className="min-h-11 shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-[var(--sortd-teal-dark)] transition hover:bg-[var(--sortd-muted)]"
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
        </details>
      )}


          {dateKeys.map((dateKey) => {
            const blocks = weekBlocks
              .filter((block) => block.date === dateKey)
              .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
            const { weekday, date } = formatDayHeader(dateKey, settings.timeZone);
            return (
              <section key={dateKey} aria-label={`${weekday} ${date}`}>
                <h3 className="sticky top-0 z-10 flex items-center justify-between bg-[var(--sortd-muted)] px-4 py-2 text-xs font-semibold text-[var(--sortd-text)]">
                  <span>{date}</span><span>{weekday}</span>
                </h3>
                {blocks.length === 0 ? (
                  <p className="px-4 py-3 text-xs text-[var(--sortd-text-muted)]">No tasks scheduled.</p>
                ) : blocks.map((block) => (
                  <div key={block.id} className="flex items-start gap-2 border-b border-[var(--sortd-border)] px-3 py-2.5 last:border-b-0">
                    <button
                      type="button"
                      onClick={() => completeBlock(block)}
                      aria-label={`Complete ${block.title}`}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg hover:bg-[var(--sortd-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sortd-teal-dark)]"
                    >
                      <span aria-hidden="true" className="h-4 w-4 rounded-full border border-[var(--sortd-teal-dark)]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openBlock(block)}
                      className="min-h-11 min-w-0 flex-1 rounded py-1 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sortd-teal-dark)]"
                    >
                      <p className="break-words text-sm font-medium text-[var(--sortd-text)]">{block.title}</p>
                      <p className="mt-1 text-xs tabular-nums text-[var(--sortd-text-muted)]">{block.startTime}–{block.endTime}</p>
                    </button>
                  </div>
                ))}
              </section>
            );
          })}
        </div>
        <div className="border-t border-[var(--sortd-border)] p-2">
          <button type="button" onClick={replan} className="min-h-11 w-full rounded-lg bg-[var(--sortd-muted)] text-sm font-medium text-[var(--sortd-text)] hover:bg-[var(--sortd-surface)]">↻ Refresh schedule</button>
        </div>
      </aside>
      </div>

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

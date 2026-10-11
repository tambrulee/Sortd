"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  DailyPlanEntry,
  PlannerOverride,
  Routine,
  RoutineTask,
  ScheduleSettings,
  ScheduledBlock,
  Task,
} from "@/lib/types";

import {
  buildManualSchedule,
  getPlannerChoices,
  suggestDailyPlanTimes,
  PlannerChoice,
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
  dailyPlanEntries: DailyPlanEntry[];
  onChangeDailyPlanEntries: (entries: DailyPlanEntry[]) => void;

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

const DAY_START_HOUR = 0;
const DAY_END_HOUR = 24;
const SLOT_MINUTES = 30;
const SLOT_HEIGHT = 96;
const TIME_COLUMN_WIDTH = 64;
const DAY_COLUMN_WIDTH = 154;

const TOTAL_MINUTES = (DAY_END_HOUR - DAY_START_HOUR) * 60;
const TOTAL_SLOTS = TOTAL_MINUTES / SLOT_MINUTES;
const GRID_HEIGHT = TOTAL_SLOTS * SLOT_HEIGHT;
const MIN_BLOCK_HEIGHT = 14;
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
            <span className="min-w-0 flex-1 truncate text-[10px] font-medium leading-3 text-[var(--sortd-text)]">{block.title}</span>
            <span className="shrink-0 text-[9px] leading-3 tabular-nums text-[var(--sortd-text-muted)]">{block.startTime}–{block.endTime}</span>
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
        {manuallyPlaced && !anchored && <button type="button" onClick={onResetToAuto} aria-label={`Clear time for ${block.title}`} title="Keep in daily plan without a time" className="flex h-6 w-5 shrink-0 items-center justify-center rounded text-xs text-[var(--sortd-teal-dark)] hover:bg-[var(--sortd-muted)]">↺</button>}
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
  dailyPlanEntries,
  onChangeDailyPlanEntries,

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
}: PlannerViewProps) {
  const calendarScrollRef = useRef<HTMLDivElement>(null);
  const [clock, setClock] = useState(() => new Date());

  const [selectedItem, setSelectedItem] = useState<{
    sourceType: "task" | "routine" | "adhoc";
    sourceId: string;
    parentId: string;
  } | null>(null);

  const [newAdhocDate, setNewAdhocDate] = useState<string | null>(null);
  const [newAdhocTitle, setNewAdhocTitle] = useState("");

  const [planningDate, setPlanningDate] = useState("");
  const [search, setSearch] = useState("");
  const [choiceFilter, setChoiceFilter] = useState<"all" | "task" | "routine" | "adhoc">("all");
  const [pickerOpen, setPickerOpen] = useState(true);
  const [dueFilter, setDueFilter] = useState<"due" | "all">("due");
  const [suggestionPreview, setSuggestionPreview] = useState<{ entries: DailyPlanEntry[]; key: string } | null>(null);
  const [planError, setPlanError] = useState("");

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

  const selectedDate = planningDate || today;
  const previewKey = JSON.stringify([dailyPlanEntries, selectedDate, settings]);
  const suggestions = suggestionPreview?.key === previewKey ? suggestionPreview.entries : null;
  useEffect(() => {
    // Open at morning; subsequent task edits never change the scroll position.
    if (calendarScrollRef.current) calendarScrollRef.current.scrollTop = getBlockTop("06:00");
  }, [selectedDate]);
  const choices = useMemo(() => getPlannerChoices(tasks, routines, adhocTasks), [tasks, routines, adhocTasks]);
  const resolvedEntries = dailyPlanEntries.map((entry) => {
    const choice = choices.find((choice) => choice.sourceType === entry.sourceType && choice.sourceId === entry.sourceId && choice.parentId === entry.parentId);
    const nextDueDate = routines.find((routine) => routine.id === entry.parentId)?.tasks.find((task) => task.id === entry.sourceId)?.nextDueDate;
    const routineFinished = entry.sourceType === "routine" && Boolean(entry.occurrenceDate && nextDueDate && nextDueDate > entry.occurrenceDate);
    return { ...entry, title: choice?.title ?? entry.title, completed: Boolean(entry.completed || choice?.completed || routineFinished) };
  });
  const schedule = buildManualSchedule(resolvedEntries, settings.timeZone);
  const dayEntries = resolvedEntries.filter((entry) => entry.date === selectedDate).sort((a, b) => a.order - b.order);
  const agendaGroups = [
    { title: "Not timed yet", description: "Chosen for this day, ready when you are.", entries: dayEntries.filter((entry) => !entry.startTime) },
    { title: "Scheduled", description: "Tasks and routines in time order.", entries: dayEntries.filter((entry) => entry.startTime).sort((a, b) => a.startTime!.localeCompare(b.startTime!) || a.order - b.order) },
  ];
  const isChosen = (choice: PlannerChoice) => resolvedEntries.some((entry) => !entry.completed && entry.sourceType === choice.sourceType && entry.sourceId === choice.sourceId && entry.parentId === choice.parentId && (choice.sourceType !== "routine" || entry.occurrenceDate === choice.occurrenceDate));
  const availableChoices = choices
    .filter((choice) => !choice.completed && !isChosen(choice) && (choiceFilter === "all" || choice.sourceType === choiceFilter) && `${choice.title} ${choice.parentName}`.toLowerCase().includes(search.toLowerCase()) && (dueFilter === "all" || Boolean(choice.dueDate && choice.dueDate <= selectedDate)))
    .sort((a, b) => (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999") || a.title.localeCompare(b.title));
  const choiceGroups = [
    { title: selectedDate === today ? "Overdue" : "Due before this day", items: availableChoices.filter((choice) => choice.dueDate && choice.dueDate < selectedDate) },
    { title: selectedDate === today ? "Due today" : `Due ${formatDayHeader(selectedDate, settings.timeZone).date}`, items: availableChoices.filter((choice) => choice.dueDate === selectedDate) },
    { title: "Due later", items: availableChoices.filter((choice) => choice.dueDate && choice.dueDate > selectedDate) },
    { title: "No deadline", items: availableChoices.filter((choice) => !choice.dueDate) },
  ];
  const previewChanges = suggestions?.filter((entry) => entry.startTime && !dailyPlanEntries.find((current) => current.id === entry.id)?.startTime) ?? [];
  const overlaps = schedule.blocks.filter((block) => block.date === selectedDate).some((block, index, blocks) => blocks.some((other, otherIndex) => otherIndex > index && block.startTime < other.endTime && other.startTime < block.endTime));

  const dateKeys = useMemo(() => getScheduleDateKeys(selectedDate, 7), [selectedDate]);

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

  function updatePlan(id: string, updates: Partial<DailyPlanEntry>) {
    setPlanError("");
    const entry = dailyPlanEntries.find((entry) => entry.id === id);
    if (!entry) return;
    const next = { ...entry, ...updates };
    if (next.startTime && timeToMinutes(next.startTime) + next.durationMinutes > 1440) {
      setPlanError("This task would finish after midnight. Choose an earlier time or shorter duration."); return;
    }
    onChangeDailyPlanEntries(dailyPlanEntries.map((entry) => entry.id === id ? next : entry));
  }
  function addChoice(choice: PlannerChoice) {
    if (isChosen(choice)) return;
    onChangeDailyPlanEntries([...dailyPlanEntries, { id: crypto.randomUUID(), sourceType: choice.sourceType, sourceId: choice.sourceId, parentId: choice.parentId, title: choice.title, parentName: choice.parentName, occurrenceDate: choice.occurrenceDate, context: choice.context, date: selectedDate, order: Math.max(-1, ...dayEntries.map((entry) => entry.order)) + 1, durationMinutes: Math.max(1, choice.durationMinutes) }]);
  }
  function moveInList(entry: DailyPlanEntry, direction: number) {
    const other = dayEntries[dayEntries.findIndex((current) => current.id === entry.id) + direction];
    if (!other) return;
    onChangeDailyPlanEntries(dailyPlanEntries.map((current) => current.id === entry.id ? { ...current, order: other.order } : current.id === other.id ? { ...current, order: entry.order } : current));
  }
  function completeEntry(entry: DailyPlanEntry) {
    if (entry.completed) return;
    // Persist completion for this occurrence before advancing a recurring task.
    onChangeDailyPlanEntries(dailyPlanEntries.map((current) => current.id === entry.id ? { ...current, completed: true } : current));
    if (entry.sourceType === "routine") onCompleteRoutineTask(entry.parentId, entry.sourceId);
    else if (entry.sourceType === "adhoc") onCompleteAdhocTask(entry.sourceId);
    else onCompleteProjectTask(entry.parentId, entry.sourceId);
  }
  function completeBlock(block: ScheduledBlock) {
    const entry = resolvedEntries.find((entry) => entry.id === block.id);
    if (entry) completeEntry(entry);
  }

  function openBlock(block: ScheduledBlock) {
    setSelectedItem({
      sourceType: block.sourceType,
      sourceId: block.sourceId,
      parentId: block.parentId,
    });
  }

  function removeOverride(block: ScheduledBlock) { updatePlan(block.id, { startTime: undefined }); }
  function handleDragEnd(event: DragEndEvent) {
    const block = event.active.data.current?.block as ScheduledBlock | undefined;
    const date = event.over?.data.current?.date as string | undefined;
    const startTime = event.over?.data.current?.slotStartTime as string | undefined;
    if (block && date && startTime) updatePlan(block.id, { date, startTime });
  }

  function addAdhocForDate(dateKey: string) {
    const title = newAdhocTitle.trim();
    if (!title) return;

    const taskId = crypto.randomUUID();
    onAddAdhocTask({
      id: taskId,
      title,
      plannedDate: dateKey,
      estimatedMinutes: 30,
      context: "personal",
      completed: false,
      createdAt: new Date().toISOString(),
      order: adhocTasks.length + 1,
    });

    onChangeDailyPlanEntries([...dailyPlanEntries, { id: crypto.randomUUID(), sourceType: "adhoc", sourceId: taskId, parentId: "adhoc", title, parentName: "Quick tasks", date: dateKey, order: Math.max(-1, ...dailyPlanEntries.filter((entry) => entry.date === dateKey).map((entry) => entry.order)) + 1, durationMinutes: 30, context: "personal" }]);
    setNewAdhocTitle("");
    setNewAdhocDate(null);
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
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Your week</h1>
            <p className="mt-1 text-xs text-[var(--sortd-text-muted)]">{formatDayHeader(dateKeys[0], settings.timeZone).date} – {formatDayHeader(dateKeys[dateKeys.length - 1], settings.timeZone).date} · Choose your tasks. Add times when useful.</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--sortd-text-muted)]">
            <span><strong className="text-[var(--sortd-text)]">{weekBlocks.length}</strong> planned</span>
            <span><strong className="text-[var(--sortd-text)]">{formatMinutes(plannedMinutes)}</strong> scheduled</span>
            <button type="button" onClick={() => setPickerOpen((open) => !open)} aria-expanded={pickerOpen} className="min-h-11 rounded-lg bg-[var(--sortd-navy)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--sortd-navy-dark)]">Choose tasks</button>
          </div>
        </div>
      </header>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-[var(--sortd-border)] bg-[var(--sortd-card)] p-3">
        <label className="text-sm text-[var(--sortd-text)]">Plan a day<input type="date" value={selectedDate} onChange={(event) => { if (event.target.value) setPlanningDate(event.target.value); }} className="ml-2 min-h-11 rounded-lg border border-[var(--sortd-border)] bg-[var(--sortd-card)] px-2 text-base" /></label>
        <button type="button" onClick={() => setPlanningDate(today)} className="min-h-11 rounded-lg bg-[var(--sortd-muted)] px-3 text-sm">Today</button>
        <span className="text-sm text-[var(--sortd-text-muted)]">{dayEntries.length} chosen · {dayEntries.filter((entry) => !entry.completed && !entry.startTime).length} not timed yet</span>
      </div>
      {pickerOpen && <section aria-label="Choose tasks for your day" className="rounded-xl border border-[var(--sortd-border)] bg-[var(--sortd-card)] p-4">
        <div className="flex flex-wrap gap-2">
          <input aria-label="Search tasks and projects" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks, projects or routines" className="min-h-11 min-w-0 flex-1 rounded-lg border border-[var(--sortd-border)] bg-[var(--sortd-card)] px-3 text-base" />
          <select aria-label="Task source" value={choiceFilter} onChange={(event) => setChoiceFilter(event.target.value as typeof choiceFilter)} className="min-h-11 rounded-lg border border-[var(--sortd-border)] bg-[var(--sortd-card)] px-3 text-base"><option value="all">All tasks</option><option value="task">Project tasks</option><option value="routine">Routines</option><option value="adhoc">Quick tasks</option></select>
        </div>
        <div className="mt-3 flex flex-wrap gap-2" aria-label="Deadline filter">
          <button type="button" aria-pressed={dueFilter === "due"} onClick={() => setDueFilter("due")} className={`min-h-11 rounded-lg px-3 text-sm ${dueFilter === "due" ? "bg-[var(--sortd-navy)] text-white" : "bg-[var(--sortd-muted)]"}`}>Due by this day</button>
          <button type="button" aria-pressed={dueFilter === "all"} onClick={() => setDueFilter("all")} className={`min-h-11 rounded-lg px-3 text-sm ${dueFilter === "all" ? "bg-[var(--sortd-navy)] text-white" : "bg-[var(--sortd-muted)]"}`}>Browse all</button>
        </div>
        <p className="mt-2 text-xs text-[var(--sortd-text-muted)]">Deadlines help you choose; adding a task to your plan does not change its due date.</p>
        <div className="mt-3 max-h-96 space-y-4 overflow-auto">
          {choiceGroups.filter((group) => group.items.length > 0).map((group) => <section key={group.title} aria-label={group.title}>
            <h3 className="sticky top-0 z-10 flex items-center gap-2 bg-[var(--sortd-card)] py-2 text-sm font-semibold">{group.title}<span className="rounded-full bg-[var(--sortd-muted)] px-2 py-0.5 text-xs">{group.items.length}</span></h3>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((choice) => {
                const planned = resolvedEntries.find((entry) => !entry.completed && entry.sourceType === choice.sourceType && entry.sourceId === choice.sourceId && entry.parentId === choice.parentId && (choice.sourceType !== "routine" || entry.occurrenceDate === choice.occurrenceDate));
                return <button key={`${choice.sourceType}-${choice.parentId}-${choice.sourceId}`} type="button" disabled={Boolean(planned)} onClick={() => addChoice(choice)} className="min-h-11 rounded-lg border border-[var(--sortd-border)] p-3 text-left hover:bg-[var(--sortd-muted)] disabled:opacity-60">
                  <span className="block break-words text-sm font-medium">{planned ? "✓" : "+"} {choice.title}</span>
                  <span className="mt-1 block text-xs text-[var(--sortd-text-muted)]">{choice.parentName} · {choice.durationMinutes} min</span>
                  <span className="mt-2 block text-xs font-semibold text-[var(--sortd-teal-dark)]">{planned ? `Planned ${formatDayHeader(planned.date, settings.timeZone).date}` : choice.dueDate ? `Due ${formatDayHeader(choice.dueDate, settings.timeZone).date}` : "No deadline"}</span>
                </button>;
              })}
            </div>
          </section>)}
          {availableChoices.length === 0 && <p className="p-3 text-sm text-[var(--sortd-text-muted)]">{dueFilter === "due" ? "No matching tasks due by this day. Browse all to choose something else." : "No matching tasks."}</p>}
        </div>
      </section>}
      {planError && <p role="alert" className="rounded-lg bg-[var(--sortd-muted)] p-3 text-sm">{planError}</p>}
      {overlaps && <p role="status" className="rounded-lg bg-[var(--sortd-muted)] p-3 text-sm">Some chosen times overlap. Your choices are kept; adjust them when you’re ready.</p>}
      <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0">
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div
          ref={calendarScrollRef}
          className="w-full min-w-0 max-w-full overflow-auto overscroll-contain rounded-2xl border border-[var(--sortd-border)] bg-[var(--sortd-card)] shadow-sm"
          style={{ height: "min(860px, 82dvh)" }}
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
                      const anchored = false;

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
        style={{ height: "min(860px, 82dvh)" }}
        aria-label="Scheduled task agenda"
      >
        <div className="border-b border-[var(--sortd-border)] px-4 py-3">
          <h2 className="text-sm font-semibold text-[var(--sortd-text)]">Your day</h2>
          <p className="mt-1 text-xs text-[var(--sortd-text-muted)]">Your choices for the selected day.</p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="space-y-4 bg-[var(--sortd-surface)] p-3">
            {dayEntries.length === 0 && <p className="py-4 text-sm text-[var(--sortd-text-muted)]">Your day is open. Choose tasks to build your plan.</p>}
            {agendaGroups.map((group) => <section key={group.title} aria-label={group.title} className="space-y-2">
              <div className="px-1 py-2">
                <h3 className="flex items-center justify-between text-sm font-semibold text-[var(--sortd-text)]">{group.title}<span className="rounded-full bg-[var(--sortd-muted)] px-2 py-0.5 text-xs tabular-nums">{group.entries.length}</span></h3>
                <p className="mt-1 text-xs text-[var(--sortd-text-muted)]">{group.description}</p>
              </div>
              {group.entries.length === 0 && <p className="rounded-lg border border-dashed border-[var(--sortd-border)] p-3 text-xs text-[var(--sortd-text-muted)]">{group.title === "Scheduled" ? "Add a time to place a task on the calendar." : "All selected tasks have a time."}</p>}
              {group.entries.map((entry) => <article key={entry.id} className={`rounded-xl border border-[var(--sortd-border)] bg-[var(--sortd-card)] p-3 shadow-sm ${entry.startTime ? "border-l-[3px] border-l-[var(--sortd-teal-dark)]" : ""}`}>

              <div className="flex items-start gap-2">
                <button type="button" disabled={entry.completed} onClick={() => completeEntry(entry)} aria-label={`Complete ${entry.title}`} className="flex h-11 w-8 shrink-0 items-center justify-center text-[var(--sortd-teal-dark)]">{entry.completed ? "✓" : "○"}</button>
                <button type="button" onClick={() => setSelectedItem({ sourceType: entry.sourceType, sourceId: entry.sourceId, parentId: entry.parentId })} className="min-h-11 min-w-0 flex-1 text-left"><span className={`block break-words text-sm font-medium ${entry.completed ? "line-through opacity-60" : ""}`}>{entry.title}</span><span className="block text-xs text-[var(--sortd-text-muted)]">{entry.completed ? "Completed" : entry.startTime ? `${entry.startTime}–${minutesToTime(timeToMinutes(entry.startTime) + entry.durationMinutes)} · ${entry.durationMinutes} min` : `Not timed yet · ${entry.durationMinutes} min`}</span></button>
              </div>
              {!entry.completed && <details className="mt-2 border-t border-[var(--sortd-border)] pt-1">
                <summary className="flex min-h-11 cursor-pointer list-none items-center rounded-lg px-2 text-xs font-medium text-[var(--sortd-teal-dark)] hover:bg-[var(--sortd-muted)] [&::-webkit-details-marker]:hidden">Adjust plan</summary>
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs">Start time<input type="time" step="60" value={entry.startTime ?? ""} onChange={(event) => updatePlan(entry.id, { startTime: event.target.value || undefined })} className="mt-1 min-h-11 w-full min-w-0 rounded border border-[var(--sortd-border)] bg-[var(--sortd-card)] px-1 text-base" /></label>
                  <label className="text-xs">Minutes<input key={`${entry.id}-${entry.durationMinutes}`} type="number" min="1" max="1080" defaultValue={entry.durationMinutes} onBlur={(event) => { const value = Number(event.target.value); if (Number.isInteger(value) && value > 0 && value <= 1080) updatePlan(entry.id, { durationMinutes: value }); else event.target.value = String(entry.durationMinutes); }} className="mt-1 min-h-11 w-full rounded border border-[var(--sortd-border)] bg-[var(--sortd-card)] px-2 text-base" /></label>
                </div>
                <label className="mt-2 block text-xs">Move to day<input type="date" value={entry.date} onChange={(event) => { if (event.target.value) updatePlan(entry.id, { date: event.target.value, order: Math.max(-1, ...dailyPlanEntries.filter((current) => current.date === event.target.value).map((current) => current.order)) + 1 }); }} className="mt-1 min-h-11 w-full rounded border border-[var(--sortd-border)] bg-[var(--sortd-card)] px-2 text-base" /></label>
                <div className="mt-2 flex flex-wrap gap-1">
                  <button type="button" disabled={dayEntries.findIndex((current) => current.id === entry.id) === 0} onClick={() => moveInList(entry, -1)} aria-label={`Move ${entry.title} earlier in the list`} className="min-h-11 rounded px-2 text-xs disabled:opacity-30">Up</button>
                  <button type="button" disabled={dayEntries.findIndex((current) => current.id === entry.id) === dayEntries.length - 1} onClick={() => moveInList(entry, 1)} aria-label={`Move ${entry.title} later in the list`} className="min-h-11 rounded px-2 text-xs disabled:opacity-30">Down</button>
                  {entry.startTime && <button type="button" onClick={() => updatePlan(entry.id, { startTime: undefined })} className="min-h-11 rounded px-2 text-xs">Clear time</button>}
                  <button type="button" onClick={() => onChangeDailyPlanEntries(dailyPlanEntries.filter((current) => current.id !== entry.id))} className="min-h-11 rounded px-2 text-xs">Remove from day</button>
                </div>
              </details>}
            </article>)}
            </section>)}
          </div>
        </div>
        <div className="border-t border-[var(--sortd-border)] p-2">
          <button type="button" disabled={!dayEntries.some((entry) => !entry.completed && !entry.startTime)} onClick={() => setSuggestionPreview({ entries: suggestDailyPlanTimes(resolvedEntries, selectedDate, settings, selectedDate === today ? currentTime : undefined), key: previewKey })} className="min-h-11 w-full rounded-lg bg-[var(--sortd-muted)] text-sm font-medium text-[var(--sortd-text)] disabled:opacity-40">Suggest times for this day</button>
          {suggestions && <div className="mt-2 space-y-2 text-sm">
            <p>{previewChanges.length} time suggestions. Existing times stay fixed. Suggestions use availability and buffers; review any task-specific constraints.</p>
            {previewChanges.map((entry) => <p key={entry.id}>{entry.startTime} · {entry.title}</p>)}
            <button type="button" disabled={!previewChanges.length} onClick={() => { const times = new Map(previewChanges.map((entry) => [entry.id, entry.startTime])); onChangeDailyPlanEntries(dailyPlanEntries.map((entry) => times.has(entry.id) ? { ...entry, startTime: times.get(entry.id) } : entry)); setSuggestionPreview(null); }} className="min-h-11 rounded bg-[var(--sortd-navy)] px-3 text-white disabled:opacity-40">Apply suggestions</button>
            <button type="button" onClick={() => setSuggestionPreview(null)} className="min-h-11 px-3">Cancel</button>
          </div>}
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

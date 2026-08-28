import {
  Energy,
  ProjectStatus,
  RecurrenceUnit,
  Routine,
  ScheduleContext,
  ScheduledBlock,
  ScheduleSettings,
  Task,
  Weekday,
  AdhocTask
} from "@/lib/types";

export type SchedulableProjectTask =
  Task & {
    projectId: string;
    projectName: string;

    projectStatus?: ProjectStatus;
    projectStartDate?: string;
    projectTargetDate?: string;

    projectScheduleContext?: ScheduleContext;
    projectEarliestStartTime?: string;
    projectLatestEndTime?: string;
  };

export type UnscheduledItem = {
  id: string;
  title: string;
  sourceType: "task" | "routine" | "adhoc";

  sourceId: string;
  parentId: string;

  reason: string;
};

export type ScheduleResult = {
  blocks: ScheduledBlock[];
  unscheduled: UnscheduledItem[];
};

type EnergyPattern = "morning" | "balanced" | "evening";

type SchedulerSettings = ScheduleSettings & {
  energyPattern?: EnergyPattern;
};

type ScheduleCandidate = {
  id: string;
  sourceType: "task" | "routine" | "adhoc";
  sourceId: string;
  parentId: string;
  parentName: string;
  title: string;
  durationMinutes: number;
  maxSessionMinutes: number;
  usedDefaultDuration: boolean;
  context: ScheduleContext;
  earliestStartTime?: string;
  latestEndTime?: string;
  priority?: "low" | "medium" | "high";
  energy?: Energy;
  dueDate?: string;
  occurrenceDate?: string;
  earliestDate: string;
  latestDate: string;
};

type TimeWindow = {
  start: number;
  end: number;
};

type SessionOption = {
  startMinutes: number;
  durationMinutes: number;
  score: number;
};

const DEFAULT_TASK_MINUTES = 30;
const DEFAULT_MAX_SESSION_MINUTES = 120;
const MINIMUM_SESSION_MINUTES = 30;
const SLOT_STEP_MINUTES = 30;

const DAY_BY_NUMBER: Record<number, Weekday> = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
};

const ENERGY_VALUE: Record<Energy, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function toDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function addDaysToDateKey(dateKey: string, days: number) {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() + days);

  return toDateKey(date);
}

export function getScheduleDateKeys(today: string, numberOfDays: number) {
  return Array.from({ length: numberOfDays }, (_, index) =>
    addDaysToDateKey(today, index),
  );
}

function getWeekday(dateKey: string): Weekday {
  return DAY_BY_NUMBER[parseDateKey(dateKey).getDay()];
}

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
}

function minutesToTime(minutes: number) {
  const safeMinutes = Math.max(0, Math.min(minutes, 24 * 60));

  const hours = Math.floor(safeMinutes / 60);

  const remainingMinutes = safeMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(remainingMinutes).padStart(
    2,
    "0",
  )}`;
}

function addRecurrence(
  dateKey: string,
  interval: number,
  unit: RecurrenceUnit,
) {
  const date = parseDateKey(dateKey);
  const safeInterval = Math.max(1, interval);

  if (unit === "day") {
    date.setDate(date.getDate() + safeInterval);
  }

  if (unit === "week") {
    date.setDate(date.getDate() + safeInterval * 7);
  }

  if (unit === "month") {
    const originalDay = date.getDate();

    date.setDate(1);
    date.setMonth(date.getMonth() + safeInterval);

    const finalDayOfMonth = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0,
    ).getDate();

    date.setDate(Math.min(originalDay, finalDayOfMonth));
  }

  return toDateKey(date);
}

function getAvailableWindows(
  dateKey: string,
  context: ScheduleContext,
  settings: SchedulerSettings,
): TimeWindow[] {
  const weekday = getWeekday(dateKey);
  const day = settings.days[weekday];

  if (!day.enabled) return [];

  const wakeTime = timeToMinutes(day.wakeTime);

  const bedTime = timeToMinutes(day.bedTime);

  if (bedTime <= wakeTime) {
    return [];
  }

  const hasWorkBlock = Boolean(day.workStart) && Boolean(day.workEnd);

  if (!hasWorkBlock) {
    if (context === "work") return [];

    return [
      {
        start: wakeTime,
        end: bedTime,
      },
    ];
  }

  const workStart = timeToMinutes(day.workStart!);

  const workEnd = timeToMinutes(day.workEnd!);

  if (workEnd <= workStart || workStart < wakeTime || workEnd > bedTime) {
    if (context === "work") return [];

    return [
      {
        start: wakeTime,
        end: bedTime,
      },
    ];
  }

  if (context === "work") {
    return [
      {
        start: workStart,
        end: workEnd,
      },
    ];
  }

  if (context === "any") {
    return [
      {
        start: wakeTime,
        end: bedTime,
      },
    ];
  }

  const personalWindows: TimeWindow[] = [];

  if (wakeTime < workStart) {
    personalWindows.push({
      start: wakeTime,
      end: workStart,
    });
  }

  if (workEnd < bedTime) {
    personalWindows.push({
      start: workEnd,
      end: bedTime,
    });
  }

  return personalWindows;
}

function applyTimeWindow(
  windows: TimeWindow[],
  earliestStartTime?: string,
  latestEndTime?: string,
): TimeWindow[] {
  const earliestStart = earliestStartTime
    ? timeToMinutes(earliestStartTime)
    : undefined;

  const latestEnd = latestEndTime ? timeToMinutes(latestEndTime) : undefined;

  return windows
    .map((window) => ({
      start:
        earliestStart !== undefined
          ? Math.max(window.start, earliestStart)
          : window.start,

      end:
        latestEnd !== undefined ? Math.min(window.end, latestEnd) : window.end,
    }))
    .filter((window) => window.start < window.end);
}

function getPriorityValue(priority?: "low" | "medium" | "high") {
  if (priority === "high") return 3;
  if (priority === "medium") return 2;
  if (priority === "low") return 1;

  return 0;
}

function getItemEnergy(item: unknown): Energy | undefined {
  if (!item || typeof item !== "object") {
    return undefined;
  }

  const value = (
    item as {
      energy?: unknown;
    }
  ).energy;

  if (value === "low" || value === "medium" || value === "high") {
    return value;
  }

  return undefined;
}

/**
 * Returns the user's expected energy at a point in the day.
 *
 * This is deliberately a preference curve rather than a hard rule.
 * Availability, working hours and explicit task windows are applied first.
 */
function getExpectedEnergy(minute: number, pattern: EnergyPattern): Energy {
  const hour = minute / 60;

  if (pattern === "morning") {
    if (hour < 11) return "high";
    if (hour < 17) return "medium";
    return "low";
  }

  if (pattern === "evening") {
    if (hour < 11) return "low";
    if (hour < 17) return "medium";
    return "high";
  }

  // Balanced users peak through the main daytime period,
  // with gentler energy either side.
  if (hour < 9) return "medium";
  if (hour < 17) return "high";
  if (hour < 21) return "medium";

  return "low";
}

function getEnergyMatchScore(
  taskEnergy: Energy | undefined,
  startMinutes: number,
  durationMinutes: number,
  pattern: EnergyPattern,
) {
  if (!taskEnergy) {
    return 0;
  }

  const midpoint = startMinutes + durationMinutes / 2;

  const expectedEnergy = getExpectedEnergy(midpoint, pattern);

  const difference = Math.abs(
    ENERGY_VALUE[taskEnergy] - ENERGY_VALUE[expectedEnergy],
  );

  if (difference === 0) {
    return 30;
  }

  if (difference === 1) {
    return 10;
  }

  return -20;
}

function getUrgencyScore(
  candidate: ScheduleCandidate,
  dateKey: string,
  startMinutes: number,
  earliestPossibleMinute: number,
) {
  if (!candidate.dueDate || candidate.dueDate > dateKey) {
    return 0;
  }

  // When something is already due, earlier still matters.
  // This prevents energy preference from endlessly pushing urgent work later.
  const delayMinutes = Math.max(0, startMinutes - earliestPossibleMinute);

  return Math.max(0, 24 - Math.floor(delayMinutes / 60) * 4);
}

function getCandidateGaps(
  windows: TimeWindow[],
  blocksForDay: ScheduledBlock[],
  settings: SchedulerSettings,
  dateKey: string,
  today: string,
  currentTime: string,
): TimeWindow[] {
  const gaps: TimeWindow[] = [];

  const roundedCurrentMinute = Math.ceil(timeToMinutes(currentTime) / 5) * 5;

  for (const window of windows) {
    let cursor =
      dateKey === today
        ? Math.max(window.start, roundedCurrentMinute)
        : window.start;

    if (cursor >= window.end) {
      continue;
    }

    for (const block of blocksForDay) {
      const blockStart = timeToMinutes(block.startTime);

      const blockEnd = timeToMinutes(block.endTime);

      if (blockEnd + settings.bufferMinutes <= cursor) {
        continue;
      }

      if (blockStart >= window.end) {
        break;
      }

      const gapEnd = Math.min(window.end, blockStart - settings.bufferMinutes);

      if (cursor < gapEnd) {
        gaps.push({
          start: cursor,
          end: gapEnd,
        });
      }

      cursor = Math.max(cursor, blockEnd + settings.bufferMinutes);

      if (cursor >= window.end) {
        break;
      }
    }

    if (cursor < window.end) {
      gaps.push({
        start: cursor,
        end: window.end,
      });
    }
  }

  return gaps;
}

function getPossibleStarts(gap: TimeWindow) {
  const starts = new Set<number>();

  starts.add(gap.start);

  const firstRoundedStart =
    Math.ceil(gap.start / SLOT_STEP_MINUTES) * SLOT_STEP_MINUTES;

  for (
    let minute = firstRoundedStart;
    minute < gap.end;
    minute += SLOT_STEP_MINUTES
  ) {
    starts.add(minute);
  }

  return [...starts].sort((first, second) => first - second);
}

function findAvailableSession(
  dateKey: string,
  candidate: ScheduleCandidate,
  remainingMinutes: number,
  settings: SchedulerSettings,
  scheduledBlocks: ScheduledBlock[],
  today: string,
  currentTime: string,
) {
  const availableWindows = getAvailableWindows(
    dateKey,
    candidate.context,
    settings,
  );

  const windows = applyTimeWindow(
    availableWindows,
    candidate.earliestStartTime,
    candidate.latestEndTime,
  );

  const blocksForDay = scheduledBlocks
    .filter((block) => block.date === dateKey)
    .sort((firstBlock, secondBlock) =>
      firstBlock.startTime.localeCompare(secondBlock.startTime),
    );

  const gaps = getCandidateGaps(
    windows,
    blocksForDay,
    settings,
    dateKey,
    today,
    currentTime,
  );

  const taskIsSplittable =
    candidate.durationMinutes > candidate.maxSessionMinutes;

  const targetSessionMinutes = taskIsSplittable
    ? Math.min(remainingMinutes, candidate.maxSessionMinutes)
    : remainingMinutes;

  const minimumSessionMinutes = taskIsSplittable
    ? Math.min(MINIMUM_SESSION_MINUTES, targetSessionMinutes)
    : targetSessionMinutes;

  const earliestPossibleMinute =
    gaps.length > 0 ? Math.min(...gaps.map((gap) => gap.start)) : 0;

  const pattern = settings.energyPattern ?? "balanced";

  const options: SessionOption[] = [];

  for (const gap of gaps) {
    for (const startMinutes of getPossibleStarts(gap)) {
      const availableMinutes = gap.end - startMinutes;

      if (availableMinutes < minimumSessionMinutes) {
        continue;
      }

      const durationMinutes = taskIsSplittable
        ? Math.min(targetSessionMinutes, availableMinutes)
        : targetSessionMinutes;

      if (durationMinutes > availableMinutes) {
        continue;
      }

      const energyScore = getEnergyMatchScore(
        candidate.energy,
        startMinutes,
        durationMinutes,
        pattern,
      );

      const urgencyScore = getUrgencyScore(
        candidate,
        dateKey,
        startMinutes,
        earliestPossibleMinute,
      );

      options.push({
        startMinutes,
        durationMinutes,
        score: energyScore + urgencyScore,
      });
    }
  }

  if (options.length === 0) {
    return undefined;
  }

  return options.sort((first, second) => {
    if (second.score !== first.score) {
      return second.score - first.score;
    }

    // For equally good slots, keep the schedule as early
    // and compact as possible.
    return first.startMinutes - second.startMinutes;
  })[0];
}

function getLatestDate(
  dates: Array<string | undefined>,
) {
  const validDates = dates.filter(
    (date): date is string => Boolean(date),
  );

  if (validDates.length === 0) {
    return undefined;
  }

  return validDates.reduce((latest, date) =>
    date > latest ? date : latest,
  );
}

function getEarliestDate(
  dates: Array<string | undefined>,
) {
  const validDates = dates.filter(
    (date): date is string => Boolean(date),
  );

  if (validDates.length === 0) {
    return undefined;
  }

  return validDates.reduce((earliest, date) =>
    date < earliest ? date : earliest,
  );
}

function buildProjectCandidates(
  tasks: SchedulableProjectTask[],
  today: string,
  horizonEnd: string,
): ScheduleCandidate[] {
  return tasks
    .filter((task) => {
      if (task.completed) {
        return false;
      }

      const status =
        task.projectStatus ?? "active";

      return (
        status === "active" ||
        status === "planned"
      );
    })
    .map((task) => {
      const usedDefaultDuration =
        !task.durationMinutes;

      const earliestDate =
        getLatestDate([
          today,
          task.projectStartDate,
          task.availableFrom,
        ]) ?? today;

      const requestedLatestDate =
        getEarliestDate([
          horizonEnd,
          task.projectTargetDate,
          task.dueDate,
        ]) ?? horizonEnd;

      /*
       * If a deadline is already in the past, we don't
       * throw the task away. It becomes "do it ASAP",
       * so today is the last available scheduling day.
       */
      const latestDate =
        requestedLatestDate < today
          ? today
          : requestedLatestDate;

      return {
        id: `task-${task.id}`,
        sourceType: "task" as const,
        sourceId: task.id,
        parentId: task.projectId,
        parentName: task.projectName,

        title:
          task.title ||
          "Untitled task",

        durationMinutes:
          task.durationMinutes ??
          DEFAULT_TASK_MINUTES,

        maxSessionMinutes: Math.max(
          1,
          task.maxSessionMinutes ??
            DEFAULT_MAX_SESSION_MINUTES,
        ),

        usedDefaultDuration,

        context:
          task.scheduleContext ??
          task.projectScheduleContext ??
          "personal",

        earliestStartTime:
          task.earliestStartTime ??
          task.projectEarliestStartTime,

        latestEndTime:
          task.latestEndTime ??
          task.projectLatestEndTime,

        priority: task.priority,
        energy: getItemEnergy(task),

        dueDate:
          task.dueDate ??
          task.projectTargetDate,

        earliestDate,
        latestDate,
      };
    });
}

function buildRoutineCandidates(
  routines: Routine[],
  today: string,
  horizonEnd: string,
): ScheduleCandidate[] {
  const candidates: ScheduleCandidate[] = [];

  routines
    .filter((routine) => !routine.archived)
    .forEach((routine) => {
      routine.tasks
        .filter((task) => task.active)
        .forEach((task) => {
          const usedDefaultDuration = !task.durationMinutes;

          let occurrenceDate =
            task.nextDueDate < today ? today : task.nextDueDate;

          while (occurrenceDate <= horizonEnd) {
            const nextOccurrenceDate = addRecurrence(
              occurrenceDate,
              task.interval,
              task.recurrenceUnit,
            );

            const dayBeforeNextOccurrence = addDaysToDateKey(
              nextOccurrenceDate,
              -1,
            );

            const latestDate =
              dayBeforeNextOccurrence < horizonEnd
                ? dayBeforeNextOccurrence
                : horizonEnd;

            candidates.push({
              id: `routine-${task.id}-${occurrenceDate}`,
              sourceType: "routine",
              sourceId: task.id,
              parentId: routine.id,
              parentName: routine.name,
              title: task.title || "Untitled routine",

              durationMinutes: task.durationMinutes ?? DEFAULT_TASK_MINUTES,

              maxSessionMinutes: Math.max(
                1,
                task.maxSessionMinutes ?? DEFAULT_MAX_SESSION_MINUTES,
              ),

              usedDefaultDuration,

              context: task.scheduleContext ?? "personal",

              earliestStartTime: task.earliestStartTime,

              latestEndTime: task.latestEndTime,

              priority: task.priority,
              energy: getItemEnergy(task),

              dueDate: occurrenceDate,

              occurrenceDate,

              earliestDate: occurrenceDate,

              latestDate,
            });

            occurrenceDate = nextOccurrenceDate;
          }
        });
    });

  return candidates;
}

function buildAdhocCandidates(
  adhocTasks: AdhocTask[],
  today: string,
  horizonEnd: string,
): ScheduleCandidate[] {
  return adhocTasks
    .filter((task) => !task.completed)
    .map((task) => {
      const usedDefaultDuration = !task.estimatedMinutes;

      const plannedDate =
        task.plannedDate && task.plannedDate >= today
          ? task.plannedDate
          : today;

      return {
        id: `adhoc-${task.id}`,

        sourceType: "adhoc" as const,

        sourceId: task.id,

        parentId: "adhoc",

        parentName: "Ad hoc",

        title: task.title || "Untitled task",

        durationMinutes: task.estimatedMinutes ?? DEFAULT_TASK_MINUTES,

        maxSessionMinutes: DEFAULT_MAX_SESSION_MINUTES,

        usedDefaultDuration,

        context: task.context ?? "personal",

        earliestStartTime: task.earliestStart,

        latestEndTime: task.latestEnd,

        priority: task.priority,

        energy: getItemEnergy(task),

        earliestDate: plannedDate,

        latestDate: plannedDate <= horizonEnd ? plannedDate : horizonEnd,
      };
    })
    .filter((candidate) => candidate.earliestDate <= candidate.latestDate);
}

export function buildRollingSchedule({
  tasks,
  routines,
  adhocTasks,
  settings,
  today,
  currentTime,
}: {
  tasks: SchedulableProjectTask[];
  routines: Routine[];
  adhocTasks: AdhocTask[];
  settings: SchedulerSettings;
  today: string;
  currentTime: string;
}): ScheduleResult {
  const horizonEnd = addDaysToDateKey(
    today,
    Math.max(1, settings.planningHorizonDays) - 1,
  );

  const projectCandidates = buildProjectCandidates(tasks, today, horizonEnd);

  const routineCandidates = buildRoutineCandidates(routines, today, horizonEnd);

  const adhocCandidates = buildAdhocCandidates(adhocTasks, today, horizonEnd);
  /**
   * Candidate order still handles "what deserves space first":
   * due date first, then explicit priority.
   *
   * Energy is intentionally NOT used here.
   * Energy decides WHEN an item should happen after its hard
   * scheduling constraints have already been respected.
   */
  const candidates = [
    ...projectCandidates,
    ...routineCandidates,
    ...adhocCandidates,
  ].sort((first, second) => {
    const firstDue = first.dueDate ?? horizonEnd;

    const secondDue = second.dueDate ?? horizonEnd;

    const dueComparison = firstDue.localeCompare(secondDue);

    if (dueComparison !== 0) {
      return dueComparison;
    }

    return getPriorityValue(second.priority) - getPriorityValue(first.priority);
  });

  const blocks: ScheduledBlock[] = [];

  const unscheduled: UnscheduledItem[] = [];

  for (const candidate of candidates) {
    let remainingMinutes = candidate.durationMinutes;

    let sessionIndex = 0;

    for (
      let dateKey = candidate.earliestDate;
      dateKey <= candidate.latestDate && remainingMinutes > 0;
      dateKey = addDaysToDateKey(dateKey, 1)
    ) {
      while (remainingMinutes > 0) {
        const session = findAvailableSession(
          dateKey,
          candidate,
          remainingMinutes,
          settings,
          blocks,
          today,
          currentTime,
        );

        if (!session) {
          break;
        }

        sessionIndex += 1;

        const endMinutes = session.startMinutes + session.durationMinutes;

        blocks.push({
          id: `${candidate.id}-session-${sessionIndex}`,

          sourceType: candidate.sourceType,

          sourceId: candidate.sourceId,

          parentId: candidate.parentId,

          parentName: candidate.parentName,

          title: candidate.title,

          date: dateKey,

          startTime: minutesToTime(session.startMinutes),

          endTime: minutesToTime(endMinutes),

          timeZone: settings.timeZone,

          durationMinutes: session.durationMinutes,

          usedDefaultDuration: candidate.usedDefaultDuration,

          context: candidate.context,

          dueDate: candidate.dueDate,

          occurrenceDate: candidate.occurrenceDate,

          sessionIndex,

          totalDurationMinutes: candidate.durationMinutes,
        });

        remainingMinutes -= session.durationMinutes;
      }
    }

    if (remainingMinutes > 0) {
      const remainingHours = remainingMinutes / 60;

      const remainingLabel =
        remainingMinutes < 60
          ? `${remainingMinutes} minutes`
          : `${Number(remainingHours.toFixed(1))} hours`;

      unscheduled.push({
        id: candidate.id,

        title: candidate.title,

        sourceType: candidate.sourceType,

        sourceId: candidate.sourceId,

        parentId: candidate.parentId,

        reason:
          sessionIndex > 0
            ? `${remainingLabel} still need scheduling.`
            : candidate.context === "work"
              ? "No suitable space in your work hours or time window."
              : "No suitable space in your available hours or time window.",
      });
    }
  }

  return {
    blocks: blocks.sort((first, second) =>
      `${first.date}-${first.startTime}`.localeCompare(
        `${second.date}-${second.startTime}`,
      ),
    ),

    unscheduled,
  };
}

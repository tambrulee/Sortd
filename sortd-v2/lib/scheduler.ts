import {
  RecurrenceUnit,
  Routine,
  ScheduleContext,
  ScheduledBlock,
  ScheduleSettings,
  Task,
  Weekday,
} from "@/lib/types";

export type SchedulableProjectTask =
  Task & {
    projectId: string;
    projectName: string;
  };

export type UnscheduledItem = {
  id: string;
  title: string;
  sourceType: "task" | "routine";
  reason: string;
};

export type ScheduleResult = {
  blocks: ScheduledBlock[];
  unscheduled: UnscheduledItem[];
};

type ScheduleCandidate = {
  id: string;
  sourceType: "task" | "routine";
  sourceId: string;
  parentId: string;
  parentName: string;
  title: string;
  durationMinutes: number;
  usedDefaultDuration: boolean;
  context: ScheduleContext;
  priority?: "low" | "medium" | "high";
  dueDate?: string;
  occurrenceDate?: string;
  earliestDate: string;
  latestDate: string;
};

type TimeWindow = {
  start: number;
  end: number;
};

const DEFAULT_TASK_MINUTES = 30;

const DAY_BY_NUMBER: Record<
  number,
  Weekday
> = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
};

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey
    .split("-")
    .map(Number);

  return new Date(year, month - 1, day);
}

function toDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(
      2,
      "0"
    ),
    String(date.getDate()).padStart(
      2,
      "0"
    ),
  ].join("-");
}

export function addDaysToDateKey(
  dateKey: string,
  days: number
) {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() + days);

  return toDateKey(date);
}

export function getScheduleDateKeys(
  today: string,
  numberOfDays: number
) {
  return Array.from(
    { length: numberOfDays },
    (_, index) =>
      addDaysToDateKey(today, index)
  );
}

function getWeekday(
  dateKey: string
): Weekday {
  return DAY_BY_NUMBER[
    parseDateKey(dateKey).getDay()
  ];
}

function timeToMinutes(time: string) {
  const [hours, minutes] = time
    .split(":")
    .map(Number);

  return hours * 60 + minutes;
}

function minutesToTime(minutes: number) {
  const safeMinutes = Math.max(
    0,
    Math.min(minutes, 24 * 60)
  );

  const hours = Math.floor(
    safeMinutes / 60
  );

  const remainingMinutes =
    safeMinutes % 60;

  return `${String(hours).padStart(
    2,
    "0"
  )}:${String(remainingMinutes).padStart(
    2,
    "0"
  )}`;
}

function addRecurrence(
  dateKey: string,
  interval: number,
  unit: RecurrenceUnit
) {
  const date = parseDateKey(dateKey);
  const safeInterval = Math.max(
    1,
    interval
  );

  if (unit === "day") {
    date.setDate(
      date.getDate() + safeInterval
    );
  }

  if (unit === "week") {
    date.setDate(
      date.getDate() +
        safeInterval * 7
    );
  }

  if (unit === "month") {
    const originalDay = date.getDate();

    date.setDate(1);
    date.setMonth(
      date.getMonth() + safeInterval
    );

    const finalDayOfMonth = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0
    ).getDate();

    date.setDate(
      Math.min(
        originalDay,
        finalDayOfMonth
      )
    );
  }

  return toDateKey(date);
}

function getAvailableWindows(
  dateKey: string,
  context: ScheduleContext,
  settings: ScheduleSettings
): TimeWindow[] {
  const weekday = getWeekday(dateKey);
  const day = settings.days[weekday];

  if (!day.enabled) return [];

  const wakeTime = timeToMinutes(
    day.wakeTime
  );

  const bedTime = timeToMinutes(
    day.bedTime
  );

  if (bedTime <= wakeTime) {
    return [];
  }

  const hasWorkBlock =
    Boolean(day.workStart) &&
    Boolean(day.workEnd);

  if (!hasWorkBlock) {
    if (context === "work") return [];

    return [
      {
        start: wakeTime,
        end: bedTime,
      },
    ];
  }

  const workStart = timeToMinutes(
    day.workStart!
  );

  const workEnd = timeToMinutes(
    day.workEnd!
  );

  if (
    workEnd <= workStart ||
    workStart < wakeTime ||
    workEnd > bedTime
  ) {
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

  const personalWindows: TimeWindow[] =
    [];

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

function getPriorityValue(
  priority?: "low" | "medium" | "high"
) {
  if (priority === "high") return 3;
  if (priority === "medium") return 2;
  if (priority === "low") return 1;

  return 0;
}

function findAvailableStart(
  dateKey: string,
  candidate: ScheduleCandidate,
  settings: ScheduleSettings,
  scheduledBlocks: ScheduledBlock[],
  today: string,
  currentTime: string
) {
  const windows = getAvailableWindows(
    dateKey,
    candidate.context,
    settings
  );

  const blocksForDay = scheduledBlocks
    .filter(
      (block) => block.date === dateKey
    )
    .sort(
      (firstBlock, secondBlock) =>
        firstBlock.startTime.localeCompare(
          secondBlock.startTime
        )
    );

const currentMinute =
  timeToMinutes(currentTime);

const roundedCurrentMinute =
  Math.ceil(currentMinute / 5) * 5;

for (const window of windows) {
  let cursor =
    dateKey === today
      ? Math.max(
          window.start,
          roundedCurrentMinute
        )
      : window.start;

  if (cursor >= window.end) {
    continue;
  }

    for (const block of blocksForDay) {
      const blockStart = timeToMinutes(
        block.startTime
      );

      const blockEnd = timeToMinutes(
        block.endTime
      );

      if (blockEnd <= cursor) {
        continue;
      }

      if (blockStart >= window.end) {
        break;
      }

      const candidateEnd =
        cursor +
        candidate.durationMinutes;

      if (
        candidateEnd +
          settings.bufferMinutes <=
        blockStart
      ) {
        return cursor;
      }

      cursor = Math.max(
        cursor,
        blockEnd +
          settings.bufferMinutes
      );
    }

    if (
      cursor +
        candidate.durationMinutes <=
      window.end
    ) {
      return cursor;
    }
  }

  return undefined;
}

function buildProjectCandidates(
  tasks: SchedulableProjectTask[],
  today: string,
  horizonEnd: string
): ScheduleCandidate[] {
  return tasks
    .filter((task) => !task.completed)
    .map((task) => {
      const usedDefaultDuration =
        !task.durationMinutes;

      return {
        id: `task-${task.id}`,
        sourceType: "task" as const,
        sourceId: task.id,
        parentId: task.projectId,
        parentName: task.projectName,
        title:
          task.title || "Untitled task",
        durationMinutes:
          task.durationMinutes ??
          DEFAULT_TASK_MINUTES,
        usedDefaultDuration,
        context:
          task.scheduleContext ??
          "personal",
        priority: task.priority,
        dueDate: task.dueDate,
        earliestDate: today,
        latestDate: horizonEnd,
      };
    });
}

function buildRoutineCandidates(
  routines: Routine[],
  today: string,
  horizonEnd: string
): ScheduleCandidate[] {
  const candidates:
    ScheduleCandidate[] = [];

  routines
    .filter(
      (routine) => !routine.archived
    )
    .forEach((routine) => {
      routine.tasks
        .filter((task) => task.active)
        .forEach((task) => {
          const usedDefaultDuration =
            !task.durationMinutes;

          let occurrenceDate =
            task.nextDueDate < today
              ? today
              : task.nextDueDate;

          while (
            occurrenceDate <= horizonEnd
          ) {
            const nextOccurrenceDate =
              addRecurrence(
                occurrenceDate,
                task.interval,
                task.recurrenceUnit
              );

            const dayBeforeNextOccurrence =
              addDaysToDateKey(
                nextOccurrenceDate,
                -1
              );

            const latestDate =
              dayBeforeNextOccurrence <
              horizonEnd
                ? dayBeforeNextOccurrence
                : horizonEnd;

            candidates.push({
              id: `routine-${task.id}-${occurrenceDate}`,
              sourceType: "routine",
              sourceId: task.id,
              parentId: routine.id,
              parentName: routine.name,
              title:
                task.title ||
                "Untitled routine",
              durationMinutes:
                task.durationMinutes ??
                DEFAULT_TASK_MINUTES,
              usedDefaultDuration,
              context:
                task.scheduleContext ??
                "personal",
              priority: task.priority,
              dueDate: occurrenceDate,
              occurrenceDate,
              earliestDate:
                occurrenceDate,
              latestDate,
            });

            occurrenceDate =
              nextOccurrenceDate;
          }
        });
    });

  return candidates;
}

export function buildRollingSchedule({
  tasks,
  routines,
  settings,
  today,
  currentTime,
}: {
  tasks: SchedulableProjectTask[];
  routines: Routine[];
  settings: ScheduleSettings;
  today: string;
  currentTime: string;
}): ScheduleResult {
  const horizonEnd = addDaysToDateKey(
    today,
    Math.max(
      1,
      settings.planningHorizonDays
    ) - 1
  );

  const projectCandidates =
    buildProjectCandidates(
      tasks,
      today,
      horizonEnd
    );

  const routineCandidates =
    buildRoutineCandidates(
      routines,
      today,
      horizonEnd
    );

  const candidates = [
    ...projectCandidates,
    ...routineCandidates,
  ].sort((first, second) => {
    const firstDue =
      first.dueDate ?? horizonEnd;

    const secondDue =
      second.dueDate ?? horizonEnd;

    const dueComparison =
      firstDue.localeCompare(secondDue);

    if (dueComparison !== 0) {
      return dueComparison;
    }

    return (
      getPriorityValue(
        second.priority
      ) -
      getPriorityValue(
        first.priority
      )
    );
  });

  const blocks: ScheduledBlock[] = [];
  const unscheduled: UnscheduledItem[] =
    [];

  for (const candidate of candidates) {
    let scheduled = false;

    for (
      let dateKey =
        candidate.earliestDate;
      dateKey <= candidate.latestDate;
      dateKey = addDaysToDateKey(
        dateKey,
        1
      )
    ) {
      const startMinutes =
        findAvailableStart(
          dateKey,
          candidate,
          settings,
          blocks,
          today,
          currentTime
        );

      if (
        startMinutes === undefined
      ) {
        continue;
      }

      const endMinutes =
        startMinutes +
        candidate.durationMinutes;

      blocks.push({
        id: candidate.id,
        sourceType:
          candidate.sourceType,
        sourceId: candidate.sourceId,
        parentId: candidate.parentId,
        parentName:
          candidate.parentName,
        title: candidate.title,
        date: dateKey,
        startTime:
          minutesToTime(startMinutes),
        endTime:
          minutesToTime(endMinutes),
        timeZone: settings.timeZone,
        durationMinutes:
          candidate.durationMinutes,
        usedDefaultDuration:
          candidate.usedDefaultDuration,
        context: candidate.context,
        dueDate: candidate.dueDate,
        occurrenceDate:
          candidate.occurrenceDate,
      });

      scheduled = true;
      break;
    }

    if (!scheduled) {
      unscheduled.push({
        id: candidate.id,
        title: candidate.title,
        sourceType:
          candidate.sourceType,
        reason:
          candidate.context === "work"
            ? "No suitable space in your work hours."
            : "No suitable space before its due date.",
      });
    }
  }

  return {
    blocks: blocks.sort(
      (first, second) =>
        `${first.date}-${first.startTime}`.localeCompare(
          `${second.date}-${second.startTime}`
        )
    ),
    unscheduled,
  };
}
export type Priority = "low" | "medium" | "high";
export type Energy = "low" | "medium" | "high";

export type Aspiration = {
  id: string;
  title: string;
  description: string;
  category: string;
  createdAt: string;
};

export type Task = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  order: number;

  goalId?: string;
  projectId?: string;

  priority?: Priority;
  energy?: Energy;

  dueDate?: string;

  durationMinutes?: number;
  maxSessionMinutes?: number;

  archivedAt?: string;

  scheduleContext?: ScheduleContext;
  preferredPeriod?: SchedulePeriod;
};

export type ProjectStatus = "active" | "paused" | "completed";

export type SortdList = {
  id: string;
  name: string;
  description?: string;
  status?: ProjectStatus;
  goalId?: string;

  tasks: Task[];
  archivedTasks: Task[];
  createdAt: string;

  scheduleContext?: ScheduleContext;
  preferredPeriod?: SchedulePeriod;
};

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: "active" | "paused" | "completed";
  goalId?: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  aspirationId?: string;
  createdAt: string;
}

// Workspace structure for the Sortd app
export interface SortdWorkspace {
  version: 1;
  projects: Project[];
  tasks: Task[];
  goals: Goal[];
  aspirations: Aspiration[];
  activeProjectId?: string;
}

export type AppView =
  | "my-day"
  | "planner"
  | "upcoming"
  | "projects"
  | "routines"
  | "shopping"
  | "goals"
  | "dreams";

  // Routine and RoutineTask types for recurring tasks
  export type RecurrenceUnit =
  | "day"
  | "week"
  | "month";

export type RoutineTask = {
  id: string;
  title: string;
  order: number;

  interval: number;
  recurrenceUnit: RecurrenceUnit;
  nextDueDate: string;

  priority?: Priority;
  energy?: Energy;

  durationMinutes?: number;
  maxSessionMinutes?: number;

  lastCompletedAt?: string;
  completionHistory: string[];

  active: boolean;
  createdAt: string;

  scheduleContext?: ScheduleContext;
  preferredPeriod?: SchedulePeriod;
};

export type Routine = {
  id: string;
  name: string;
  description?: string;
  tasks: RoutineTask[];
  createdAt: string;
  archived: boolean;
};

//  ScheduledBlock type for representing scheduled tasks and routines in the calendar view

export type ScheduleContext =
  | "work"
  | "personal"
  | "any";

export type Weekday =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type DayAvailability = {
  enabled: boolean;
  wakeTime: string;
  bedTime: string;
  workStart?: string;
  workEnd?: string;
};

export type ScheduleSettings = {
  timeZone: string;
  planningHorizonDays: number;
  bufferMinutes: number;
  days: Record<
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday",
    DayAvailability
  >;
};

export type ScheduledBlock = {
  id: string;
  sourceType: "task" | "routine";
  sourceId: string;
  parentId: string;
  parentName: string;
  title: string;

  date: string;
  startTime: string;
  endTime: string;
  timeZone: string;

  durationMinutes: number;
  usedDefaultDuration: boolean;
  context: ScheduleContext;

  dueDate?: string;
  occurrenceDate?: string;

  sessionIndex?: number;
  totalDurationMinutes?: number;
};

export type SchedulePeriod =
  | "any"
  | "morning"
  | "afternoon"
  | "evening";

// Shopping list types for managing shopping items and categories

export type ShoppingCategory =
  | "food"
  | "household"
  | "health"
  | "beauty"
  | "clothing"
  | "garden"
  | "gifts"
  | "other";

export type ShoppingItem = {
  id: string;
  title: string;
  quantity?: string;
  shop?: string;
  category: ShoppingCategory;
  estimatedCost?: number;
  purchased: boolean;
  order: number;
  createdAt: string;
};

export type ShoppingList = {
  id: string;
  name: string;
  items: ShoppingItem[];
  createdAt: string;
  archived: boolean;
};
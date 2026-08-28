export type Priority = "low" | "medium" | "high";
export type Energy = "low" | "medium" | "high";

export type Dream = {
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

  availableFrom?: string;
  dueDate?: string;

  durationMinutes?: number;
  maxSessionMinutes?: number;

  earliestStartTime?: string;
  latestEndTime?: string;

  archivedAt?: string;

  scheduleContext?: ScheduleContext;
};

export type AdhocTask = {
  id: string;
  title: string;

  completed: boolean;

  estimatedMinutes?: number;

  priority?: "low" | "medium" | "high";
  energy?: "low" | "medium" | "high";

  context?: "personal" | "work";

  earliestStart?: string;
  latestEnd?: string;

  plannedDate?: string;
  blockUntil?: string;

  notes?: string;

  createdAt: string;
  order: number;
};

export type ProjectStatus =
  | "backlog"
  | "planned"
  | "active"
  | "paused"
  | "completed";

export type SortdList = {
  id: string;
  name: string;
  description?: string;

  status?: ProjectStatus;

  startDate?: string;
  targetDate?: string;

  goalId?: string;

  tasks: Task[];
  archivedTasks: Task[];
  createdAt: string;

  scheduleContext?: ScheduleContext;
  preferredPeriod?: SchedulePeriod;

  earliestStartTime?: string;
  latestEndTime?: string;
};

export interface Project {
  id: string;
  name: string;
  description?: string;

  status: ProjectStatus;

  startDate?: string;
  targetDate?: string;

  goalId?: string;
  createdAt: string;
}

export type GoalStatus = "active" | "paused" | "completed";

export interface Goal {
  id: string;
  title: string;
  description?: string;
  dreamId?: string;
  status: GoalStatus;
  createdAt: string;
}

// Workspace structure for the Sortd app
export interface SortdWorkspace {
  version: 1;
  projects: Project[];
  tasks: Task[];
  goals: Goal[];
  dreams: Dream[];
  activeProjectId?: string;
}

export type AppView =
  | "my-day"
  | "planner"
  | "upcoming"
  | "projects"
  | "routines"
  | "shopping"
  | "food"
  | "goals"
  | "dreams"
  | "settings";

// Routine and RoutineTask types for recurring tasks
export type RecurrenceUnit = "day" | "week" | "month";

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

  earliestStartTime?: string;
  latestEndTime?: string;

  lastCompletedAt?: string;
  completionHistory: string[];

  active: boolean;
  createdAt: string;

  scheduleContext?: ScheduleContext;
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

export type ScheduleContext = "work" | "personal" | "any";

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

export type EnergyPattern = "morning" | "balanced" | "evening";

export type ScheduleSettings = {
  timeZone: string;
  planningHorizonDays: number;
  bufferMinutes: number;
  energyPattern?: EnergyPattern;
  days: Record<Weekday, DayAvailability>;
};

export type ScheduledBlock = {
  id: string;
  sourceType: "task" | "routine" | "adhoc";
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

export type SchedulePeriod = "any" | "morning" | "afternoon" | "evening";

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
  intent?: ShoppingIntent;
};

export type ShoppingList = {
  id: string;
  name: string;
  items: ShoppingItem[];
  createdAt: string;
  archived: boolean;
};

export type ShoppingIntent = "need" | "want";

// Food and meal planning types for managing meals, ingredients, and meal plans

export type MealIngredient = {
  id: string;
  name: string;
  quantity?: string;
};

export type MealType = "breakfast" | "lunch" | "dinner";

export type Meal = {
  id: string;
  name: string;

  mealType: MealType;

  defaultPortions: number;
  portionsAvailable: number;

  ingredients: MealIngredient[];

  prepMinutes?: number;
  cookMinutes?: number;

  notes?: string;
  createdAt: string;
};

export type MealPlanEntry = {
  id: string;
  date: string;
  mealId: string;

  mealType: MealType;

  portions: number;
};

export type FoodShoppingItem = {
  id: string;
  title: string;
  quantity?: string;
  purchased: boolean;
  createdAt: string;
};

export type FoodData = {
  meals: Meal[];
  mealPlan: MealPlanEntry[];
  shoppingList: FoodShoppingItem[];
};

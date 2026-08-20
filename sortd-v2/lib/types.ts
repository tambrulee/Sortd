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

  archivedAt?: string;
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
  | "upcoming"
  | "projects"
  | "routines"
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

  lastCompletedAt?: string;
  completionHistory: string[];

  active: boolean;
  createdAt: string;
};

export type Routine = {
  id: string;
  name: string;
  description?: string;
  tasks: RoutineTask[];
  createdAt: string;
  archived: boolean;
};

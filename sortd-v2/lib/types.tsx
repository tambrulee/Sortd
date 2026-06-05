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
  priority?: "low" | "medium" | "high";
  energy?: "low" | "medium" | "high";

  archivedAt?: string;
};

export type SortdList = {
  id: string;
  name: string;
  tasks: Task[];
  archivedTasks: Task[];
  createdAt: string;
};
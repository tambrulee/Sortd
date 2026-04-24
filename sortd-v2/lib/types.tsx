export type Task = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  order: number;
  archivedAt?: string;
};

export type SortdList = {
  id: string;
  name: string;
  tasks: Task[];
  archivedTasks: Task[];
  createdAt: string;
};
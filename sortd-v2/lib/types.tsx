export type Task = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  order: number;
};

export type SortdList = {
  id: string;
  name: string;
  tasks: Task[];
  createdAt: string;
};
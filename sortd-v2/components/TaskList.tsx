import { Task } from "@/lib/types";
import TaskItem from "./TaskItem";

type TaskListProps = {
  tasks: Task[];
  onUpdateTask: (id: string, title: string) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
};

export default function TaskList({
  tasks,
  onUpdateTask,
  onToggleTask,
  onDeleteTask,
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <p className="rounded-2xl bg-[#eeeaea] p-4 text-center text-sm text-slate-600">
        No tasks yet. Add one to get started.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onUpdateTask={onUpdateTask}
          onToggleTask={onToggleTask}
          onDeleteTask={onDeleteTask}
        />
      ))}
    </div>
  );
}
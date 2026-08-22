"use client";

import {
  DndContext,
  closestCenter,
  DragEndEvent,
} from "@dnd-kit/core";

import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

import {
  ScheduleContext,
  SchedulePeriod,
  Task,
} from "@/lib/types";
import TaskItem from "./TaskItem";

type TaskListProps = {
  tasks: Task[];
  onUpdateTask: (id: string, title: string) => void;
  onUpdateTaskPriority: (
    id: string,
    priority: "low" | "medium" | "high"
  ) => void;
  onUpdateTaskEnergy: (
    id: string,
    energy: "low" | "medium" | "high"
  ) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onReorderTasks: (tasks: Task[]) => void;
  onUpdateTaskDueDate: (id: string, dueDate: string) => void;
  onUpdateTaskDuration: (
    id: string,
    durationMinutes?: number
  ) => void;
  onUpdateTaskMaxSession: (
  id: string,
  maxSessionMinutes?: number
) => void;
  onAddTask: () => void;
  onUpdateTaskScheduleContext: (
    id: string,
    context?: ScheduleContext
  ) => void;
};

export default function TaskList({
  tasks,
  onAddTask,
  onUpdateTask,
  onUpdateTaskPriority,
  onUpdateTaskEnergy,
  onUpdateTaskDueDate,
  onUpdateTaskDuration,
  onUpdateTaskScheduleContext,
  onUpdateTaskMaxSession,
  onToggleTask,
  onDeleteTask,
  onReorderTasks,
}: TaskListProps) {
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = tasks.findIndex((task) => task.id === active.id);
    const newIndex = tasks.findIndex((task) => task.id === over.id);

    const reorderedTasks = arrayMove(tasks, oldIndex, newIndex).map(
      (task, index) => ({
        ...task,
        order: index + 1,
      })
    );

    onReorderTasks(reorderedTasks);
  }

  if (tasks.length === 0) {
    return (
      <p className="rounded-2xl bg-[#eeeaea] p-4 text-center text-sm text-slate-600">
        No tasks yet. Add one to get started.
      </p>
    );
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={tasks.map((task) => task.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskItem
            key={task.id}
            task={task}
            onAddTask={onAddTask}
            onUpdateTask={onUpdateTask}
            onUpdateTaskPriority={onUpdateTaskPriority}
            onUpdateTaskEnergy={onUpdateTaskEnergy}
            onUpdateTaskDueDate={onUpdateTaskDueDate}
            onUpdateTaskDuration={onUpdateTaskDuration}
            onUpdateTaskMaxSession={onUpdateTaskMaxSession}
            onUpdateTaskScheduleContext={onUpdateTaskScheduleContext}
            onToggleTask={onToggleTask}
            onDeleteTask={onDeleteTask}
          />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
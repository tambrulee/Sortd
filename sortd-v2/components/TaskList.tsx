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

import { Task } from "@/lib/types";
import TaskItem from "./TaskItem";

type TaskListProps = {
  tasks: Task[];
  onUpdateTask: (id: string, title: string) => void;
  onUpdateTaskPriority: (
    id: string,
    priority: "low" | "medium" | "high"
  ) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onReorderTasks: (tasks: Task[]) => void;
};

export default function TaskList({
  tasks,
  onUpdateTask,
  onUpdateTaskPriority,
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
              onUpdateTask={onUpdateTask}
              onUpdateTaskPriority={onUpdateTaskPriority}
              onToggleTask={onToggleTask}
              onDeleteTask={onDeleteTask}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
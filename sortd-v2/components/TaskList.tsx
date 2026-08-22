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
  Task,
} from "@/lib/types";

import TaskItem from "@/components/TaskItem";

type ProjectOption = {
  id: string;
  name: string;
};

type TaskListProps = {
  tasks: Task[];

  currentProjectId: string;

  projectOptions: ProjectOption[];

  onAddTask: () => void;

  onChangeTask: (
    id: string,
    updates: Partial<Task>
  ) => void;

  onToggleTask: (
    id: string
  ) => void;

  onDeleteTask: (
    id: string
  ) => void;

  onReorderTasks: (
    tasks: Task[]
  ) => void;

  onMoveTask: (
    taskId: string,
    destinationProjectId: string
  ) => void;
};

export default function TaskList({
  tasks,
  currentProjectId,
  projectOptions,
  onAddTask,
  onChangeTask,
  onToggleTask,
  onDeleteTask,
  onReorderTasks,
  onMoveTask,
}: TaskListProps) {
  function handleDragEnd(
    event: DragEndEvent
  ) {
    const {
      active,
      over,
    } = event;

    if (
      !over ||
      active.id === over.id
    ) {
      return;
    }

    const oldIndex =
      tasks.findIndex(
        (task) =>
          task.id ===
          active.id
      );

    const newIndex =
      tasks.findIndex(
        (task) =>
          task.id ===
          over.id
      );

    if (
      oldIndex < 0 ||
      newIndex < 0
    ) {
      return;
    }

    const reorderedTasks =
      arrayMove(
        tasks,
        oldIndex,
        newIndex
      ).map(
        (task, index) => ({
          ...task,
          order: index + 1,
        })
      );

    onReorderTasks(
      reorderedTasks
    );
  }

  if (
    tasks.length === 0
  ) {
    return (
      <p className="rounded-2xl bg-[#eeeaea] p-4 text-center text-sm text-slate-600">
        No tasks yet. Add one to get started.
      </p>
    );
  }

  return (
    <DndContext
      collisionDetection={
        closestCenter
      }
      onDragEnd={
        handleDragEnd
      }
    >
      <SortableContext
        items={tasks.map(
          (task) =>
            task.id
        )}
        strategy={
          verticalListSortingStrategy
        }
      >
        <div className="space-y-3">
          {tasks.map(
            (task) => (
              <TaskItem
                key={task.id}
                task={task}
                currentProjectId={
                  currentProjectId
                }
                projectOptions={
                  projectOptions
                }
                onAddTask={
                  onAddTask
                }
                onChangeTask={
                  onChangeTask
                }
                onToggleTask={
                  onToggleTask
                }
                onDeleteTask={
                  onDeleteTask
                }
                onMoveTask={
                  onMoveTask
                }
              />
            )
          )}
        </div>
      </SortableContext>
    </DndContext>
  );
}

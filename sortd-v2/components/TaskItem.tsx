"use client";

import { useEffect, useRef, useState } from "react";
import { Task } from "@/lib/types";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type TaskItemProps = {
  task: Task;
  onUpdateTask: (id: string, title: string) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onUpdateTaskPriority: (
    id: string,
    priority: "low" | "medium" | "high"
  ) => void;
  onUpdateTaskEnergy: (
    id: string,
    energy: "low" | "medium" | "high"
  ) => void;
};

export default function TaskItem({
  task,
  onUpdateTask,
  onUpdateTaskPriority,
  onUpdateTaskEnergy,
  onToggleTask,
  onDeleteTask,
}: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(task.title === "");
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
    }
  }, [isEditing]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-2xl bg-[#eeeaea] p-3 shadow-sm ${
        isDragging ? "z-50 opacity-60" : ""
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab rounded-lg px-2 py-1 text-slate-500 active:cursor-grabbing"
        aria-label="Drag task"
      >
        ⋮⋮
      </button>

      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggleTask(task.id)}
        className="h-5 w-5 accent-[#cd6ce7]"
      />

      <input
        ref={inputRef}
        value={task.title}
        onChange={(event) =>
          onUpdateTask(task.id, event.target.value)
        }
        placeholder="Enter task..."
        className="min-w-0 flex-1 rounded-lg bg-transparent px-2 py-1 text-sm font-medium text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-[#cd6ce7]"
      />

      <select
        value={task.priority ?? "medium"}
        onChange={(e) =>
          onUpdateTaskPriority(
            task.id,
            e.target.value as "low" | "medium" | "high"
          )
        }
        className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm"
      >
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>


      <button
        type="button"
        onClick={() => onDeleteTask(task.id)}
        aria-label="Delete task"
        title="Delete task"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg text-slate-400 transition hover:bg-red-100 hover:text-red-600"
      >
        ×
      </button>
    </div>
  );
}
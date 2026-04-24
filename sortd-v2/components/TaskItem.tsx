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
};

export default function TaskItem({
  task,
  onUpdateTask,
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
        readOnly={!isEditing}
        onChange={(e) => onUpdateTask(task.id, e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") setIsEditing(false);
        }}
        placeholder="Enter task..."
        className={`flex-1 rounded-lg px-2 py-1 text-sm font-medium outline-none ${
          isEditing
            ? "bg-white ring-2 ring-[#cd6ce7]"
            : "bg-transparent text-slate-900"
        }`}
      />

      <button
        type="button"
        onClick={() => setIsEditing((current) => !current)}
        className="rounded-lg px-2 py-1 text-sm text-[#1f0825] transition hover:bg-[#cdbfd1]"
      >
        {isEditing ? "Save" : "Edit"}
      </button>

      <button
        type="button"
        onClick={() => onDeleteTask(task.id)}
        className="rounded-lg px-2 py-1 text-sm text-[#1f0825] transition hover:bg-[#cdbfd1]"
      >
        Delete
      </button>
    </div>
  );
}
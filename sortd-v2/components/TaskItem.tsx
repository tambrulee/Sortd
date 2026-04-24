"use client";

import { useState } from "react";
import { Task } from "@/lib/types";

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

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[#eeeaea] p-3 shadow-sm">
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggleTask(task.id)}
        className="h-5 w-5 accent-[#cd6ce7]"
      />

      <input
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
        onClick={() => setIsEditing((current) => !current)}
        className="rounded-lg px-2 py-1 text-sm text-[#1f0825] transition hover:bg-[#cdbfd1]"
      >
        {isEditing ? "Save" : "Edit"}
      </button>

      <button
        onClick={() => onDeleteTask(task.id)}
        className="rounded-lg px-2 py-1 text-sm text-[#1f0825] transition hover:bg-[#cdbfd1]"
      >
        Delete
      </button>
    </div>
  );
}
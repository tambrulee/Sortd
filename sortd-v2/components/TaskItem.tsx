"use client";

import { useEffect, useRef, useState } from "react";
import { Task } from "@/lib/types";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type TaskItemProps = {
  task: Task;
  onAddTask: () => void;
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

  onUpdateTaskDueDate: (
    id: string,
    dueDate: string
  ) => void;

  onUpdateTaskDuration: (
    id: string,
    durationMinutes?: number
  ) => void;


};

export default function TaskItem({
  task,
  onUpdateTask,
  onUpdateTaskPriority,
  onUpdateTaskEnergy,
  onUpdateTaskDueDate,
  onUpdateTaskDuration,
  onToggleTask,
  onDeleteTask,
  onAddTask,
}: TaskItemProps) {
  const [showDetails, setShowDetails] = useState(false);
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
    if (task.title === "") {
      inputRef.current?.focus();
    }
  }, [task.id, task.title]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-2xl bg-[#eeeaea] p-3 shadow-sm ${
        isDragging ? "z-50 opacity-60" : ""
      }`}
    >
      <div className="flex flex-wrap items-center gap-3">
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
          className="h-5 w-5 shrink-0 accent-[#cd6ce7]"
        />

        <input
          ref={inputRef}
          value={task.title}
          onChange={(event) =>
            onUpdateTask(task.id, event.target.value)
          }
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;

            event.preventDefault();
            event.stopPropagation();
            onAddTask();
          }}
          placeholder="Enter task..."
          className={`min-w-[180px] flex-1 rounded-lg bg-transparent px-2 py-1 text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-[#cd6ce7] ${
            task.completed
              ? "text-slate-400 line-through"
              : "text-slate-900"
          }`}
        />

        <select
          value={task.priority ?? "medium"}
          onChange={(event) =>
            onUpdateTaskPriority(
              task.id,
              event.target.value as "low" | "medium" | "high"
            )
          }
          aria-label="Task priority"
          className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm"
        >
          <option value="low">Low priority</option>
          <option value="medium">Medium priority</option>
          <option value="high">High priority</option>
        </select>

        <select
          value={task.energy ?? "medium"}
          onChange={(event) =>
            onUpdateTaskEnergy(
              task.id,
              event.target.value as "low" | "medium" | "high"
            )
          }
          aria-label="Task energy"
          className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm"
        >
          <option value="low">Low energy</option>
          <option value="medium">Medium energy</option>
          <option value="high">High energy</option>
        </select>

        <button
          type="button"
          onClick={() => setShowDetails((current) => !current)}
          aria-expanded={showDetails}
          aria-label="Toggle task details"
          title="Task details"
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm transition ${
            showDetails
              ? "bg-[#1f0825] text-white"
              : "text-slate-500 hover:bg-white"
          }`}
        >
          •••
        </button>

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

      {showDetails && (
        <div className="mt-3 grid gap-3 border-t border-slate-300 pt-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Due date

            <input
              type="date"
              value={task.dueDate ?? ""}
              onChange={(event) =>
                onUpdateTaskDueDate(task.id, event.target.value)
              }
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#cd6ce7]"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Estimated time

            <select
              value={task.durationMinutes ?? ""}
              onChange={(event) =>
                onUpdateTaskDuration(
                  task.id,
                  event.target.value
                    ? Number(event.target.value)
                    : undefined
                )
              }
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#cd6ce7]"
            >
              <option value="">Not estimated</option>
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">1 hour</option>
              <option value="90">1½ hours</option>
              <option value="120">2 hours</option>
              <option value="180">3 hours</option>
              <option value="240">4 hours</option>
            </select>
          </label>
        </div>
      )}
    </div>
  );
}
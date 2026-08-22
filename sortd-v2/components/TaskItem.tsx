"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ScheduleContext,
  SchedulePeriod,
  Task,
} from "@/lib/types";

import {
  useSortable,
} from "@dnd-kit/sortable";

import {
  CSS,
} from "@dnd-kit/utilities";

import ItemDetailsModal from "@/components/ItemDetailsModal";

type TaskItemProps = {
  task: Task;

  onAddTask: () => void;

  onUpdateTask: (
    id: string,
    title: string
  ) => void;

  onToggleTask: (
    id: string
  ) => void;

  onDeleteTask: (
    id: string
  ) => void;

  onUpdateTaskPriority: (
    id: string,
    priority:
      | "low"
      | "medium"
      | "high"
  ) => void;

  onUpdateTaskEnergy: (
    id: string,
    energy:
      | "low"
      | "medium"
      | "high"
  ) => void;

  onUpdateTaskDueDate: (
    id: string,
    dueDate: string
  ) => void;

  onUpdateTaskDuration: (
    id: string,
    durationMinutes?: number
  ) => void;

  onUpdateTaskMaxSession: (
    id: string,
    maxSessionMinutes?: number
  ) => void;

  onUpdateTaskScheduleContext: (
    id: string,
    context?: ScheduleContext
  ) => void;

};

function formatDuration(
  minutes?: number
) {
  if (!minutes) return "";

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = minutes / 60;

  return Number.isInteger(hours)
    ? `${hours} hr`
    : `${hours.toFixed(1)} hrs`;
}

export default function TaskItem({
  task,

  onAddTask,

  onUpdateTask,
  onUpdateTaskPriority,
  onUpdateTaskEnergy,

  onUpdateTaskDueDate,
  onUpdateTaskDuration,
  onUpdateTaskMaxSession,

  onUpdateTaskScheduleContext,

  onToggleTask,
  onDeleteTask,
}: TaskItemProps) {
  const [
    showDetails,
    setShowDetails,
  ] = useState(false);

  const inputRef =
    useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
  });

  const style = {
    transform:
      CSS.Transform.toString(
        transform
      ),

    transition,
  };

  useEffect(() => {
    if (task.title === "") {
      inputRef.current?.focus();
    }
  }, [task.id, task.title]);

  function handleUpdateTask(
    updates: Partial<Task>
  ) {
    if (
      typeof updates.title ===
      "string"
    ) {
      onUpdateTask(
        task.id,
        updates.title
      );
    }

    if (updates.priority) {
      onUpdateTaskPriority(
        task.id,
        updates.priority
      );
    }

    if (updates.energy) {
      onUpdateTaskEnergy(
        task.id,
        updates.energy
      );
    }

    if ("dueDate" in updates) {
      onUpdateTaskDueDate(
        task.id,
        updates.dueDate ?? ""
      );
    }

    if (
      "durationMinutes" in updates
    ) {
      onUpdateTaskDuration(
        task.id,
        updates.durationMinutes
      );
    }

    if (
      "maxSessionMinutes" in updates
    ) {
      onUpdateTaskMaxSession(
        task.id,
        updates.maxSessionMinutes
      );
    }

    if (
      "scheduleContext" in updates
    ) {
      onUpdateTaskScheduleContext(
        task.id,
        updates.scheduleContext
      );
    }
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`rounded-2xl bg-[#eeeaea] p-3 shadow-sm ${
          isDragging
            ? "z-50 opacity-60"
            : ""
        }`}
      >
        <div className="flex items-center gap-3">
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
            onChange={() =>
              onToggleTask(task.id)
            }
            className="h-5 w-5 shrink-0 accent-[#cd6ce7]"
          />

          <div className="min-w-0 flex-1">
            <input
              ref={inputRef}
              value={task.title}
              onChange={(event) =>
                onUpdateTask(
                  task.id,
                  event.target.value
                )
              }
              onKeyDown={(event) => {
                if (
                  event.key !== "Enter"
                ) {
                  return;
                }

                event.preventDefault();
                event.stopPropagation();

                onAddTask();
              }}
              placeholder="Enter task..."
              className={`w-full rounded-lg bg-transparent px-2 py-1 text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-[#cd6ce7] ${
                task.completed
                  ? "text-slate-400 line-through"
                  : "text-slate-900"
              }`}
            />

            <div className="mt-1 flex flex-wrap gap-2 px-2">
              {task.priority ===
                "high" && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                  High priority
                </span>
              )}

              {task.energy ===
                "low" && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  Low energy
                </span>
              )}

              {task.durationMinutes && (
                <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs text-slate-600">
                  {formatDuration(
                    task.durationMinutes
                  )}
                </span>
              )}

              {task.dueDate && (
                <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
                  Due {task.dueDate}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              setShowDetails(true)
            }
            aria-label="Open task details"
            title="Task details"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm text-slate-500 transition hover:bg-white hover:text-slate-900"
          >
            •••
          </button>
        </div>
      </div>

      {showDetails && (
        <ItemDetailsModal
          kind="task"
          item={task}
          onChange={handleUpdateTask}
          onDelete={() =>
            onDeleteTask(task.id)
          }
          onClose={() =>
            setShowDetails(false)
          }
        />
      )}
    </>
  );
}
"use client";

import { useEffect, useRef, useState } from "react";

import { Task } from "@/lib/types";

import { useSortable } from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

import ItemDetailsModal from "@/components/ItemDetailsModal";

type ProjectOption = {
  id: string;
  name: string;
};

type TaskItemProps = {
  task: Task;

  currentProjectId: string;

  projectOptions: ProjectOption[];

  onAddTask: () => void;

  onChangeTask: (id: string, updates: Partial<Task>) => void;

  onToggleTask: (id: string) => void;

  onDeleteTask: (id: string) => void;

  onMoveTask: (taskId: string, destinationProjectId: string) => void;
};

function formatDuration(minutes?: number) {
  if (!minutes) {
    return null;
  }

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = minutes / 60;

  return Number.isInteger(hours) ? `${hours} hr` : `${hours.toFixed(1)} hrs`;
}

function getPriorityLabel(priority?: Task["priority"]) {
  if (priority === "high") {
    return "High priority";
  }

  if (priority === "low") {
    return "Low priority";
  }

  return "Medium priority";
}

function getEnergyLabel(energy?: Task["energy"]) {
  if (energy === "high") {
    return "High energy";
  }

  if (energy === "low") {
    return "Low energy";
  }

  return "Medium energy";
}

export default function TaskItem({
  task,
  currentProjectId,
  projectOptions,
  onAddTask,
  onChangeTask,
  onToggleTask,
  onDeleteTask,
  onMoveTask,
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
  } = useSortable({
    id: task.id,
  });

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
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`rounded-2xl border border-slate-200 bg-white p-3 transition ${
          isDragging ? "z-50 opacity-60 shadow-lg" : ""
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab rounded-lg px-1.5 py-1 text-slate-400 active:cursor-grabbing"
            aria-label={`Reorder ${task.title}`}
            title="Drag to reorder"
          >
            ⋮⋮
          </button>

          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => onToggleTask(task.id)}
            className="h-5 w-5 shrink-0 accent-[#cd6ce7]"
          />

          <div className="min-w-0 flex-1">
            <input
              ref={inputRef}
              value={task.title}
              onChange={(event) =>
                onChangeTask(task.id, {
                  title: event.target.value,
                })
              }
              onKeyDown={(event) => {
                if (event.key !== "Enter") {
                  return;
                }

                event.preventDefault();
                event.stopPropagation();
                onAddTask();
              }}
              placeholder="Enter task..."
              className={`w-full rounded-lg bg-transparent px-1 py-1 text-sm font-medium outline-none transition focus:bg-slate-50 focus:ring-2 focus:ring-[#cd6ce7]/20 ${
                task.completed
                  ? "text-slate-400 line-through"
                  : "text-slate-900"
              }`}
            />

            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 px-1 text-xs text-slate-500">
              <span>{getPriorityLabel(task.priority)}</span>

              <span aria-hidden="true" className="text-slate-300">
                ·
              </span>

              <span>{getEnergyLabel(task.energy)}</span>

              {formatDuration(task.durationMinutes) && (
                <>
                  <span aria-hidden="true" className="text-slate-300">
                    ·
                  </span>

                  <span>{formatDuration(task.durationMinutes)}</span>
                </>
              )}

              {task.dueDate && (
                <>
                  <span aria-hidden="true" className="text-slate-300">
                    ·
                  </span>

                  <span>
                    Due{" "}
                    {new Intl.DateTimeFormat("en-GB", {
                      day: "numeric",
                      month: "short",
                    }).format(new Date(`${task.dueDate}T12:00:00`))}
                  </span>
                </>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowDetails(true)}
            aria-label={`Edit ${task.title}`}
            title="Task details"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            •••
          </button>
        </div>
      </div>

      {showDetails && (
        <ItemDetailsModal
          kind="task"
          item={task}
          containerLabel="Project"
          currentContainerId={currentProjectId}
          containerOptions={projectOptions}
          onMove={(destinationProjectId) => {
            onMoveTask(task.id, destinationProjectId);

            setShowDetails(false);
          }}
          onChange={(updates) => onChangeTask(task.id, updates)}
          onDelete={() => {
            onDeleteTask(task.id);

            setShowDetails(false);
          }}
          onClose={() => setShowDetails(false)}
        />
      )}
    </>
  );
}

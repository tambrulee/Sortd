"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

import {
  Energy,
  Priority,
  RecurrenceUnit,
  RoutineTask,
  ScheduleContext,
  Task,
} from "@/lib/types";

import { DURATION_OPTIONS } from "@/lib/durations";

import TimeWindowInput from "@/components/TimeWindowInput";

export type ItemContainerOption = {
  id: string;
  name: string;
};

type SharedItemUpdates = Partial<
  Pick<
    Task,
    | "title"
    | "priority"
    | "energy"
    | "durationMinutes"
    | "maxSessionMinutes"
    | "scheduleContext"
    | "earliestStartTime"
    | "latestEndTime"
  >
>;

type ProjectTaskModalProps = {
  kind: "task";
  item: Task;
  onChange: (updates: Partial<Task>) => void;
  onDelete: () => void;
  onClose: () => void;

  containerLabel?: string;
  currentContainerId?: string;
  containerOptions?: ItemContainerOption[];
  onMove?: (containerId: string) => void;
};

type RoutineTaskModalProps = {
  kind: "routine";
  item: RoutineTask;
  onChange: (updates: Partial<RoutineTask>) => void;
  onDelete: () => void;
  onClose: () => void;

  containerLabel?: string;
  currentContainerId?: string;
  containerOptions?: ItemContainerOption[];
  onMove?: (containerId: string) => void;
};

type ItemDetailsModalProps = ProjectTaskModalProps | RoutineTaskModalProps;

const SESSION_OPTIONS = [
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 45, label: "45 minutes" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1½ hours" },
  { value: 120, label: "2 hours" },
  { value: 180, label: "3 hours" },
  { value: 240, label: "4 hours" },
  { value: 360, label: "6 hours" },
  { value: 480, label: "8 hours" },
];

export default function ItemDetailsModal(props: ItemDetailsModalProps) {
  const { item, onClose, onDelete } = props;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;

      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  function updateSharedItem(updates: SharedItemUpdates) {
    if (props.kind === "task") {
      props.onChange(updates);
      return;
    }

    props.onChange(updates);
  }

  const fieldClassName =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#cd6ce7] focus:ring-2 focus:ring-[#cd6ce7]/20";

  const labelClassName =
    "flex flex-col gap-1.5 text-xs font-medium text-slate-600";

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="item-details-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl md:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9d3db7]">
              {props.kind === "routine" ? "Routine task" : "Project task"}
            </p>

            <h2
              id="item-details-title"
              className="mt-1 text-2xl font-semibold text-slate-950"
            >
              Task details
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Adjust how this item appears and gets scheduled.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close task details"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
          >
            ×
          </button>
        </div>

        <div className="mt-6 space-y-5">
          <label className={labelClassName}>
            Task title
            <input
              value={item.title}
              onChange={(event) =>
                updateSharedItem({
                  title: event.target.value,
                })
              }
              placeholder="Enter task title..."
              className={fieldClassName}
            />
          </label>

          {props.containerOptions &&
            props.currentContainerId &&
            props.onMove && (
              <label className={labelClassName}>
                {props.containerLabel ??
                  (props.kind === "routine" ? "Routine" : "Project")}

                <select
                  value={props.currentContainerId}
                  onChange={(event) => {
                    const nextContainerId = event.target.value;

                    if (nextContainerId !== props.currentContainerId) {
                      props.onMove?.(nextContainerId);
                    }
                  }}
                  className={fieldClassName}
                >
                  {props.containerOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>

                <span className="text-[11px] font-normal text-slate-400">
                  Moving this task keeps its details and scheduling settings.
                </span>
              </label>
            )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClassName}>
              Priority
              <select
                value={item.priority ?? "medium"}
                onChange={(event) =>
                  updateSharedItem({
                    priority: event.target.value as Priority,
                  })
                }
                className={fieldClassName}
              >
                <option value="low">Low priority</option>

                <option value="medium">Medium priority</option>

                <option value="high">High priority</option>
              </select>
            </label>

            <label className={labelClassName}>
              Energy needed
              <select
                value={item.energy ?? "medium"}
                onChange={(event) =>
                  updateSharedItem({
                    energy: event.target.value as Energy,
                  })
                }
                className={fieldClassName}
              >
                <option value="low">Low energy</option>

                <option value="medium">Medium energy</option>

                <option value="high">High energy</option>
              </select>
            </label>

            <label className={labelClassName}>
              Estimated total time
              <select
                value={item.durationMinutes ?? ""}
                onChange={(event) =>
                  updateSharedItem({
                    durationMinutes: event.target.value
                      ? Number(event.target.value)
                      : undefined,
                  })
                }
                className={fieldClassName}
              >
                <option value="">Not estimated</option>

                {DURATION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className={labelClassName}>
              Maximum session length
              <select
                value={item.maxSessionMinutes ?? 120}
                onChange={(event) =>
                  updateSharedItem({
                    maxSessionMinutes: Number(event.target.value),
                  })
                }
                className={fieldClassName}
              >
                {SESSION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className={labelClassName}>
              Schedule during
              <select
                value={
                  item.scheduleContext ??
                  (props.kind === "routine" ? "personal" : "")
                }
                onChange={(event) =>
                  updateSharedItem({
                    scheduleContext: event.target.value
                      ? (event.target.value as ScheduleContext)
                      : undefined,
                  })
                }
                className={fieldClassName}
              >
                {props.kind === "task" && (
                  <option value="">Use project default</option>
                )}

                <option value="personal">Personal hours</option>

                <option value="work">Working hours</option>

                <option value="any">Either</option>
              </select>
            </label>

            {/* Time Restrictions */}
            <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
              <label className={labelClassName}>
                Earliest start
                <TimeWindowInput
                  value={item.earliestStartTime}
                  onChange={(value) =>
                    updateSharedItem({
                      earliestStartTime: value,
                    })
                  }
                />
              </label>

              <label className={labelClassName}>
                Must finish by
                <TimeWindowInput
                  value={item.latestEndTime}
                  onChange={(value) =>
                    updateSharedItem({
                      latestEndTime: value,
                    })
                  }
                />
              </label>
            </div>

            {props.kind === "task" && (
              <>
                <label className={labelClassName}>
                  Available from
                  <input
                    type="date"
                    value={props.item.availableFrom ?? ""}
                    onChange={(event) =>
                      props.onChange({
                        availableFrom: event.target.value || undefined,
                      })
                    }
                    className={fieldClassName}
                  />
                  <span className="text-[11px] font-normal text-slate-400">
                    Don&apos;t schedule this task before this date.
                  </span>
                </label>

                <label className={labelClassName}>
                  Due date
                  <input
                    type="date"
                    value={props.item.dueDate ?? ""}
                    onChange={(event) =>
                      props.onChange({
                        dueDate: event.target.value || undefined,
                      })
                    }
                    className={fieldClassName}
                  />
                </label>
              </>
            )}

            {props.kind === "routine" && (
              <>
                <label className={labelClassName}>
                  Next due date
                  <input
                    type="date"
                    value={props.item.nextDueDate}
                    onChange={(event) =>
                      props.onChange({
                        nextDueDate: event.target.value,
                      })
                    }
                    className={fieldClassName}
                  />
                </label>

                <label className={labelClassName}>
                  Repeat every
                  <input
                    type="number"
                    min="1"
                    value={props.item.interval}
                    onChange={(event) =>
                      props.onChange({
                        interval: Math.max(1, Number(event.target.value)),
                      })
                    }
                    className={fieldClassName}
                  />
                </label>

                <label className={labelClassName}>
                  Repeat period
                  <select
                    value={props.item.recurrenceUnit}
                    onChange={(event) =>
                      props.onChange({
                        recurrenceUnit: event.target.value as RecurrenceUnit,
                      })
                    }
                    className={fieldClassName}
                  >
                    <option value="day">Days</option>

                    <option value="week">Weeks</option>

                    <option value="month">Months</option>
                  </select>
                </label>
              </>
            )}
          </div>

          {props.kind === "routine" && (
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Routine status
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {props.item.active
                      ? "This task is included in your schedule."
                      : "This task is paused."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    props.onChange({
                      active: !props.item.active,
                    })
                  }
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  {props.item.active ? "Pause" : "Resume"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
          <button
            type="button"
            onClick={onDelete}
            className="rounded-xl px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            Delete task
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#1f0825] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#3b0842]"
          >
            Done
          </button>
        </div>
      </section>
    </div>,

    document.body,
  );
}

"use client";

import { useEffect, useId, useRef, useState } from "react";
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

  const [intervalDraft, setIntervalDraft] = useState(() => props.kind === "routine" ? String(props.item.interval) : "");
  const routineInterval = props.kind === "routine" ? props.item.interval : undefined;
  useEffect(() => {
    setIntervalDraft(routineInterval === undefined ? "" : String(routineInterval));
  }, [item.id, routineInterval]);

  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef(onClose);
  const titleId = useId();
  closeRef.current = onClose;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const dialog = dialogRef.current;
    const overlay = dialog?.parentElement;
    const background = Array.from(document.body.children)
      .filter((element): element is HTMLElement => element instanceof HTMLElement && element !== overlay && !["SCRIPT", "STYLE"].includes(element.tagName))
      .map((element) => ({ element, wasInert: element.inert }));
    background.forEach(({ element }) => { element.inert = true; });
    // Focus the close button without opening the mobile keyboard immediately.
    dialog?.querySelector<HTMLButtonElement>("button")?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      const dialogs = Array.from(document.querySelectorAll('[role="dialog"], [role="alertdialog"]')).filter((element) => element.getClientRects().length > 0);
      if (dialogs[dialogs.length - 1] !== dialog) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        closeRef.current();
      }
      if (event.key !== "Tab" || !dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>('button, input, select, textarea, summary, a[href], [tabindex]:not([tabindex="-1"])'))
        .filter((element) => !element.hasAttribute("disabled") && element.getClientRects().length > 0);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) { event.preventDefault(); dialog.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        event.preventDefault(); first.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      background.forEach(({ element, wasInert }) => { element.inert = wasInert; });
      document.removeEventListener("keydown", handleKeyDown);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [mounted]);

  function updateSharedItem(updates: SharedItemUpdates) {
    if (props.kind === "task") {
      props.onChange(updates);
      return;
    }

    props.onChange(updates);
  }

  const fieldClassName =
    "min-h-11 min-w-0 w-full rounded-lg border border-[var(--sortd-border)] bg-[var(--sortd-card)] px-3 py-2 text-base text-[var(--sortd-text)] outline-none transition focus:border-[var(--sortd-teal-dark)] focus:ring-2 focus:ring-[var(--sortd-teal-dark)]/20 sm:text-sm";

  const selectClassName = `${fieldClassName} appearance-none pr-10`;
  const selectStyle = {
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
    backgroundSize: "16px 16px",
  };

  const labelClassName =
    "flex min-w-0 flex-col gap-1.5 text-sm font-medium text-[var(--sortd-text-muted)]";

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-[var(--sortd-navy-dark)]/50 sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[95dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl border border-[var(--sortd-border)] bg-[var(--sortd-surface)] text-[var(--sortd-text)] shadow-2xl outline-none sm:max-h-[90dvh] sm:rounded-2xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--sortd-border)] px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sortd-teal-dark)]">
              {props.kind === "routine" ? "Routine task" : "Project task"}
            </p>

            <h2
              id={titleId}
              className="mt-1 text-lg font-semibold"
            >
              Task details
            </h2>

            <p className="mt-1 text-sm text-[var(--sortd-text-muted)]">
              Changes save as you edit.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close task details"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-2xl text-[var(--sortd-text-muted)] transition hover:bg-[var(--sortd-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sortd-teal-dark)]"
          >
            ×
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">
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
                  className={selectClassName}
                style={selectStyle}
                >
                  {props.containerOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>

                <span className="text-[11px] font-normal text-[var(--sortd-text-muted)]">
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
                className={selectClassName}
                style={selectStyle}
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
                className={selectClassName}
                style={selectStyle}
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
                className={selectClassName}
                style={selectStyle}
              >
                <option value="">Not estimated</option>

                {DURATION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

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
                  <span className="text-[11px] font-normal text-[var(--sortd-text-muted)]">
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
                    onChange={(event) => {
                      if (event.target.value) props.onChange({ nextDueDate: event.target.value });
                    }}
                    className={fieldClassName}
                  />
                </label>

                <label className={labelClassName}>
                  Repeat every
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={intervalDraft}
                    onChange={(event) => {
                      if (/^\d*$/.test(event.target.value)) setIntervalDraft(event.target.value);
                    }}
                    onBlur={() => {
                      const interval = Number(intervalDraft);
                      if (Number.isSafeInteger(interval) && interval >= 1) {
                        props.onChange({ interval });
                        setIntervalDraft(String(interval));
                      } else {
                        setIntervalDraft(String(props.item.interval));
                      }
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") event.currentTarget.blur();
                    }}
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
                    className={selectClassName}
                style={selectStyle}
                  >
                    <option value="day">Days</option>

                    <option value="week">Weeks</option>

                    <option value="month">Months</option>
                  </select>
                </label>
              </>
            )}
          </div>

          <details className="rounded-xl border border-[var(--sortd-border)] bg-[var(--sortd-muted)]">
            <summary className="min-h-11 cursor-pointer px-4 py-3 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sortd-teal-dark)]">Scheduling options</summary>
            <div className="grid gap-4 px-4 pb-4 sm:grid-cols-2">
            <label className={labelClassName}>
              Maximum session length
              <select
                value={item.maxSessionMinutes ?? 120}
                onChange={(event) =>
                  updateSharedItem({
                    maxSessionMinutes: Number(event.target.value),
                  })
                }
                className={selectClassName}
                style={selectStyle}
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
                className={selectClassName}
                style={selectStyle}
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
                <input
                  type="time"
                  step="60"
                  value={item.earliestStartTime ?? ""}
                  onChange={(event) => updateSharedItem({ earliestStartTime: event.target.value || undefined })}
                  className={fieldClassName}
                />
              </label>

              <label className={labelClassName}>
                Must finish by
                <input
                  type="time"
                  step="60"
                  value={item.latestEndTime ?? ""}
                  onChange={(event) => updateSharedItem({ latestEndTime: event.target.value || undefined })}
                  className={fieldClassName}
                />
              </label>
            </div>

            </div>
          </details>

          {props.kind === "routine" && (
            <div className="rounded-xl bg-[var(--sortd-muted)] p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[var(--sortd-text)]">
                    Routine status
                  </p>

                  <p className="mt-1 text-xs text-[var(--sortd-text-muted)]">
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
                  className="min-h-11 shrink-0 rounded-lg border border-[var(--sortd-border)] bg-[var(--sortd-card)] px-3 py-2 text-sm font-medium transition hover:bg-[var(--sortd-muted)]"
                >
                  {props.item.active ? "Pause" : "Resume"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[var(--sortd-border)] bg-[var(--sortd-surface)] px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
          <button
            type="button"
            onClick={onDelete}
            className="min-h-11 rounded-lg px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-700"
          >
            Delete task
          </button>

          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-lg bg-[var(--sortd-navy)] px-5 py-2 text-sm font-medium text-white transition hover:bg-[var(--sortd-navy-dark)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sortd-teal-dark)]"
          >
            Done
          </button>
        </div>
      </section>
    </div>,

    document.body,
  );
}

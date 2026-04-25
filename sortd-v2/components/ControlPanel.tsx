"use client";

type ControlPanelProps = {
  onAddTask: () => void;
  hideCompleted: boolean;
  onToggleHideCompleted: () => void;
  onArchiveCompleted: () => void;
  hasCompleted: boolean; // 👈 ADD THIS
};

export default function ControlPanel({
  onAddTask,
  hideCompleted,
  onToggleHideCompleted,
  onArchiveCompleted,
  hasCompleted,
}: ControlPanelProps) {
  return (
    <div className="mb-6 flex flex-wrap justify-center gap-2">
      <button
        type="button"
        onClick={onAddTask}
        className="rounded-xl bg-[#1f0825] px-4 py-2 text-sm font-medium text-white"
      >
        Add task
      </button>

      <button
        type="button"
        onClick={onToggleHideCompleted}
        className="rounded-xl bg-[#1f0825] px-4 py-2 text-sm font-medium text-white"
      >
        {hideCompleted ? "Show completed" : "Hide completed"}
      </button>

      <button
        type="button"
        onClick={onArchiveCompleted}
        disabled={!hasCompleted}
        className="rounded-xl border border-[#1f0825]/20 bg-white/70 px-4 py-2 text-sm font-medium text-[#1f0825] transition hover:bg-[#cdbfd1] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Archive completed
      </button>
    </div>
  );
}
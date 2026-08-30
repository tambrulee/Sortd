"use client";

type TaskFilter = "all" | "high" | "low-energy";

type ControlPanelProps = {
  onAddTask: () => void;
  hideCompleted: boolean;
  onToggleHideCompleted: () => void;
  onArchiveCompleted: () => void;
  hasCompleted: boolean;
  taskFilter: TaskFilter;
  onChangeTaskFilter: (filter: TaskFilter) => void;
};

export default function ControlPanel({
  onAddTask,
  hideCompleted,
  onToggleHideCompleted,
  onArchiveCompleted,
  hasCompleted,
  taskFilter,
  onChangeTaskFilter,
}: ControlPanelProps) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <button
        type="button"
        onClick={onAddTask}
        className="rounded-xl bg-[#1f0825] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#cd6ce7]"
      >
        + Add task
      </button>

      <div className="flex flex-wrap items-center gap-4">
        <select
          value={taskFilter}
          onChange={(event) =>
            onChangeTaskFilter(event.target.value as TaskFilter)
          }
          aria-label="Filter tasks"
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#cd6ce7]"
        >
          <option value="all">All tasks</option>
          <option value="high">High priority</option>
          <option value="low-energy">Low energy</option>
        </select>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={hideCompleted}
            onChange={onToggleHideCompleted}
            className="h-4 w-4 accent-[#1f0825]"
          />
          Hide completed
        </label>

        {hasCompleted && (
          <button
            type="button"
            onClick={onArchiveCompleted}
            className="text-sm text-slate-500 underline-offset-4 transition hover:text-[#1f0825] hover:underline"
          >
            Archive completed
          </button>
        )}
      </div>
    </div>
  );
}

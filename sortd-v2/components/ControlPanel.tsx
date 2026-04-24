"use client";

type ControlPanelProps = {
  onAddTask: () => void;
  hideCompleted: boolean;
  onToggleHideCompleted: () => void;
};

export default function ControlPanel({
  onAddTask,
  hideCompleted,
  onToggleHideCompleted,
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
    </div>
  );
}
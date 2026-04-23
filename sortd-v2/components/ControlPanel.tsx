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
        onClick={onAddTask}
        className="rounded-xl bg-[#1f0825] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#cd6ce7]"
      >
        Add task
      </button>

      <button
        onClick={onToggleHideCompleted}
        className="rounded-xl bg-[#1f0825] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#cd6ce7]"
      >
        {hideCompleted ? "Show completed" : "Hide completed"}
      </button>
    </div>
  );
}
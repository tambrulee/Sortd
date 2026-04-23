import TaskItem from "./TaskItem";

export default function TaskList() {
  return (
    <div className="space-y-3">
      <TaskItem title="Plan Sort’d v2" />
      <TaskItem title="Build task components" />
      <TaskItem title="Add localStorage" />
    </div>
  );
}
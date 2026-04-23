type TaskItemProps = {
  title: string;
};

export default function TaskItem({ title }: TaskItemProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[#eeeaea] p-3 shadow-sm">
      <input type="checkbox" className="h-5 w-5 accent-[#cd6ce7]" />

      <p className="flex-1 text-sm font-medium text-slate-900">{title}</p>

      <button className="rounded-lg px-2 py-1 text-sm text-[#1f0825] transition hover:bg-[#cdbfd1]">
        Edit
      </button>

      <button className="rounded-lg px-2 py-1 text-sm text-[#1f0825] transition hover:bg-[#cdbfd1]">
        Delete
      </button>
    </div>
  );
}
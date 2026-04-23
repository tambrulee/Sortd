export default function ControlPanel() {
  return (
    <div className="mb-6 flex flex-wrap justify-center gap-2">
      <button className="rounded-xl bg-[#1f0825] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#cd6ce7]">
        Add task
      </button>

      <button className="rounded-xl bg-[#1f0825] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#cd6ce7]">
        Hide completed
      </button>

      <button className="rounded-xl bg-[#1f0825] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#cd6ce7]">
        Theme
      </button>

      <button className="rounded-xl bg-[#1f0825] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#cd6ce7]">
        Learn more
      </button>
    </div>
  );
}
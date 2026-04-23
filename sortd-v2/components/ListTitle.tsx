export default function ListTitle() {
  return (
    <div className="mb-6 flex gap-2">
      <input
        className="w-full rounded-2xl bg-[#eeeaea] px-4 py-3 text-lg font-semibold outline-none focus:ring-2 focus:ring-[#cd6ce7]"
        placeholder="Name your list..."
      />

      <button className="rounded-2xl bg-[#eeeaea] px-4 text-[#1f0825] transition hover:bg-[#cdbfd1]">
        Edit
      </button>
    </div>
  );
}
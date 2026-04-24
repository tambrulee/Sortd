import { SortdList } from "@/lib/types";

type ListSwitcherProps = {
  lists: SortdList[];
  activeListId: string;
  onChangeList: (id: string) => void;
  onCreateList: () => void;
  onDeleteList: () => void;
};

export default function ListSwitcher({
  lists,
  activeListId,
  onChangeList,
  onCreateList,
  onDeleteList,
}: ListSwitcherProps) {
  return (
    <aside className="rounded-3xl bg-white/85 p-4 shadow-xl backdrop-blur-md">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
          Lists
        </h2>

        <button
          type="button"
          onClick={onCreateList}
          className="rounded-full bg-[#1f0825] px-3 py-1 text-sm text-white transition hover:bg-[#cd6ce7]"
        >
          +
        </button>
      </div>

      <div className="space-y-2">
        {lists.map((list) => (
          <button
            key={list.id}
            type="button"
            onClick={() => onChangeList(list.id)}
            className={`w-full rounded-2xl px-4 py-3 text-left text-sm transition ${
              list.id === activeListId
                ? "bg-[#1f0825] text-white"
                : "bg-[#eeeaea] text-slate-900 hover:bg-[#cdbfd1]"
            }`}
          >
            {list.name || "Untitled list"}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onDeleteList}
        disabled={lists.length === 1}
        className="mt-4 w-full rounded-2xl bg-red-600 px-4 py-2 text-sm text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Delete current list
      </button>
    </aside>
  );
}
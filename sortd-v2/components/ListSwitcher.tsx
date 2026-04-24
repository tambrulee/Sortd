import { SortdList } from "@/lib/types";

type ListSwitcherProps = {
  lists: SortdList[];
  activeListId: string;
  onChangeList: (id: string) => void;
  onCreateList: () => void;
  onDeleteList: () => void;
  onRenameList: (id: string, name: string) => void;
};

export default function ListSwitcher({
  lists,
  activeListId,
  onChangeList,
  onCreateList,
  onDeleteList,
  onRenameList,
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
        {lists.map((list) => {
          const isActive = list.id === activeListId;

          return (
            <input
              key={list.id}
              value={list.name}
              onClick={() => onChangeList(list.id)}
              onChange={(e) => onRenameList(list.id, e.target.value)}
              placeholder="Untitled list"
              className={`w-full rounded-2xl px-4 py-3 text-left text-sm outline-none transition ${
                isActive
                  ? "bg-[#1f0825] text-white placeholder:text-white/60"
                  : "bg-[#eeeaea] text-slate-900 hover:bg-[#cdbfd1]"
              }`}
            />
          );
        })}
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
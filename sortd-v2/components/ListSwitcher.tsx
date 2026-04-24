import { SortdList } from "@/lib/types";

type ListSwitcherProps = {
  lists: SortdList[];
  activeListId: string;
  onChangeList: (id: string) => void;
  onCreateList: () => void;
};

export default function ListSwitcher({
  lists,
  activeListId,
  onChangeList,
  onCreateList,
}: ListSwitcherProps) {
  return (
    <div className="mb-4 flex gap-2">
      <select
        value={activeListId}
        onChange={(e) => onChangeList(e.target.value)}
        className="flex-1 rounded-2xl bg-[#eeeaea] px-4 py-3 text-sm outline-none"
      >
        {lists.map((list) => (
          <option key={list.id} value={list.id}>
            {list.name || "Untitled list"}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={onCreateList}
        className="rounded-2xl bg-[#1f0825] px-4 py-2 text-sm text-white"
      >
        New list
      </button>
    </div>
  );
}
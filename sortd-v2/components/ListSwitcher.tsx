"use client";

import { SortdList } from "@/lib/types";
import {
  DndContext,
  closestCenter,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type ListSwitcherProps = {
  lists: SortdList[];
  activeListId: string;
  onChangeList: (id: string) => void;
  onCreateList: () => void;
  onDeleteList: () => void;
  onRenameList: (id: string, name: string) => void;
  onReorderLists: (lists: SortdList[]) => void;
};

type SortableListItemProps = {
  list: SortdList;
  isActive: boolean;
  onChangeList: (id: string) => void;
  onRenameList: (id: string, name: string) => void;
};

function SortableListItem({
  list,
  isActive,
  onChangeList,
  onRenameList,
}: SortableListItemProps) {
  const completedCount = list.tasks.filter((task) => task.completed).length;
  const totalCount = list.tasks.length;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: list.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  function getStatusColour(status: SortdList["status"]) {
    switch (status) {
      case "paused":
        return "bg-amber-400";
      case "completed":
        return "bg-slate-400";
      default:
        return "bg-emerald-400";
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded-2xl px-3 py-2 transition ${
        isActive
          ? "bg-[#1f0825] text-white"
          : "bg-[#eeeaea] text-slate-900 hover:bg-[#cdbfd1]"
      } ${isDragging ? "z-50 opacity-60" : ""}`}
    >

      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab text-sm opacity-70 active:cursor-grabbing"
        aria-label="Drag list"
      >
        ⋮⋮
      </button>

      <span
        title={list.status ?? "active"}
        className={`h-2.5 w-2.5 shrink-0 rounded-full ${getStatusColour(
          list.status
        )}`}
      />
      
      <input
        value={list.name}
        onClick={() => onChangeList(list.id)}
        onChange={(e) => onRenameList(list.id, e.target.value)}
        // placeholder="Untitled list"
        className={`min-w-0 flex-1 bg-transparent text-sm outline-none ${
          isActive ? "placeholder:text-white/60" : ""
        }`}
      />

      <span
        className={`shrink-0 rounded-full px-2 py-1 text-xs ${
          isActive
            ? "bg-white/15 text-white"
            : "bg-white/70 text-slate-600"
        }`}
      >
        {completedCount}/{totalCount}
      </span>
    </div>
  );
}

export default function ListSwitcher({
  lists,
  activeListId,
  onChangeList,
  onCreateList,
  onDeleteList,
  onRenameList,
  onReorderLists,
}: ListSwitcherProps) {
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = lists.findIndex((list) => list.id === active.id);
    const newIndex = lists.findIndex((list) => list.id === over.id);

    onReorderLists(arrayMove(lists, oldIndex, newIndex));
  }

  return (
    <aside className="rounded-3xl bg-white/85 p-4 shadow-xl backdrop-blur-md">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
          Projects
        </h2>

        <button
          type="button"
          onClick={onCreateList}
          className="rounded-full bg-[#1f0825] px-3 py-1 text-sm text-white transition hover:bg-[#cd6ce7]"
        >
          +
        </button>
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={lists.map((list) => list.id)}
          strategy={verticalListSortingStrategy}
        >
          
          <div className="space-y-2">
            {lists.map((list) => (
              <SortableListItem
                key={list.id}
                list={list}
                isActive={list.id === activeListId}
                onChangeList={onChangeList}
                onRenameList={onRenameList}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

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
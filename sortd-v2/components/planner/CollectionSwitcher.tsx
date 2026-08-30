"use client";

import { useEffect, useRef, useState } from "react";

import { closestCenter, DndContext, DragEndEvent } from "@dnd-kit/core";

import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

export type CollectionSwitcherItem = {
  id: string;
  name: string;
};

type CollectionSwitcherProps<T extends CollectionSwitcherItem> = {
  items: T[];

  activeItemId: string;

  label: string;
  placeholder: string;
  itemPluralLabel: string;

  createLabel?: string;
  deleteLabel?: string;

  onChangeItem: (id: string) => void;

  onCreateItem: () => void;

  onDeleteItem: () => void;

  onRenameItem: (id: string, name: string) => void;

  onReorderItems: (items: T[]) => void;

  getCount?: (item: T) => number;

  getStatusColour?: (item: T) => string;

  getStatusLabel?: (item: T) => string;

  canDelete?: boolean;
};

type SortableOptionProps<T extends CollectionSwitcherItem> = {
  item: T;

  isActive: boolean;

  onSelect: (id: string) => void;

  onRenameItem: (id: string, name: string) => void;

  getCount?: (item: T) => number;

  getStatusColour?: (item: T) => string;

  getStatusLabel?: (item: T) => string;
};

function SortableOption<T extends CollectionSwitcherItem>({
  item,
  isActive,
  onSelect,
  onRenameItem,
  getCount,
  getStatusColour,
  getStatusLabel,
}: SortableOptionProps<T>) {
  const [isRenaming, setIsRenaming] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
  });

  useEffect(() => {
    if (isRenaming) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isRenaming]);

  const style = {
    transform: CSS.Transform.toString(transform),

    transition,
  };

  const count = getCount?.(item);

  const statusColour = getStatusColour?.(item);

  const statusLabel = getStatusLabel?.(item);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded-xl px-2 py-2 transition ${
        isActive ? "bg-[#f3e8f5]" : "hover:bg-slate-50"
      } ${isDragging ? "z-50 opacity-60" : ""}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${item.name}`}
        className="cursor-grab rounded-md px-1 py-1 text-sm text-slate-400 active:cursor-grabbing"
      >
        ⋮⋮
      </button>

      {statusColour && (
        <span
          title={statusLabel}
          className={`h-2.5 w-2.5 shrink-0 rounded-full ${statusColour}`}
        />
      )}

      {isRenaming ? (
        <input
          ref={inputRef}
          value={item.name}
          onChange={(event) => onRenameItem(item.id, event.target.value)}
          onBlur={() => setIsRenaming(false)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === "Escape") {
              event.preventDefault();
              setIsRenaming(false);
            }
          }}
          placeholder="Untitled"
          className="min-w-0 flex-1 rounded-lg border border-[#cd6ce7] bg-white px-2 py-1 text-sm text-slate-900 outline-none"
        />
      ) : (
        <button
          type="button"
          onClick={() => onSelect(item.id)}
          className="min-w-0 flex-1 truncate text-left text-sm font-medium text-slate-800"
        >
          {item.name || "Untitled"}
        </button>
      )}

      {count !== undefined && (
        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
          {count}
        </span>
      )}

      <button
        type="button"
        onClick={() => setIsRenaming(true)}
        aria-label={`Rename ${item.name}`}
        title="Rename"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white hover:text-slate-700"
      >
        ✎
      </button>
    </div>
  );
}

export default function CollectionSwitcher<T extends CollectionSwitcherItem>({
  items,
  activeItemId,
  label,
  placeholder,
  itemPluralLabel,
  createLabel = "+ New",
  deleteLabel = "Delete",
  onChangeItem,
  onCreateItem,
  onDeleteItem,
  onRenameItem,
  onReorderItems,
  getCount,
  getStatusColour,
  getStatusLabel,
  canDelete = items.length > 1,
}: CollectionSwitcherProps<T>) {
  const [isOpen, setIsOpen] = useState(false);

  const [isActionsOpen, setIsActionsOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const activeItem = items.find((item) => item.id === activeItemId) ?? items[0];

  useEffect(() => {
    if (!isOpen && !isActionsOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setIsActionsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        setIsActionsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);

      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isActionsOpen]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = items.findIndex((item) => item.id === active.id);

    const newIndex = items.findIndex((item) => item.id === over.id);

    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    onReorderItems(arrayMove(items, oldIndex, newIndex));
  }

  function selectItem(itemId: string) {
    onChangeItem(itemId);
    setIsOpen(false);
  }

  function createItem() {
    onCreateItem();
    setIsOpen(false);
  }

  const activeCount = activeItem && getCount ? getCount(activeItem) : undefined;

  const activeStatusColour =
    activeItem && getStatusColour ? getStatusColour(activeItem) : undefined;

  const activeStatusLabel =
    activeItem && getStatusLabel ? getStatusLabel(activeItem) : undefined;

  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <div
        ref={containerRef}
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        <div className="relative min-w-0 flex-1">
          <label className="mb-1.5 block text-xs font-medium text-slate-600">
            {label}
          </label>

          <button
            type="button"
            onClick={() => {
              setIsOpen((current) => !current);

              setIsActionsOpen(false);
            }}
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            className="flex w-full min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left transition hover:border-[#cd6ce7] focus:outline-none focus:ring-2 focus:ring-[#cd6ce7]/25"
          >
            {activeStatusColour && (
              <span
                title={activeStatusLabel}
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${activeStatusColour}`}
              />
            )}

            <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900">
              {activeItem?.name || placeholder}
            </span>

            {activeCount !== undefined && (
              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                {activeCount}
              </span>
            )}

            <span
              aria-hidden="true"
              className={`shrink-0 text-sm text-slate-400 transition ${
                isOpen ? "rotate-180" : ""
              }`}
            >
              ▾
            </span>
          </button>

          {isOpen && (
            <div className="absolute left-0 right-0 z-40 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
              <p className="px-2 py-2 text-xs font-medium text-slate-500">
                Select or drag to reorder.
              </p>

              <DndContext
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={items.map((item) => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div
                    role="listbox"
                    aria-label={itemPluralLabel}
                    className="max-h-72 space-y-1 overflow-y-auto"
                  >
                    {items.map((item) => (
                      <SortableOption
                        key={item.id}
                        item={item}
                        isActive={item.id === activeItemId}
                        onSelect={selectItem}
                        onRenameItem={onRenameItem}
                        getCount={getCount}
                        getStatusColour={getStatusColour}
                        getStatusLabel={getStatusLabel}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}
        </div>

        <div className="relative flex shrink-0 gap-2">
          <button
            type="button"
            onClick={createItem}
            className="rounded-xl bg-[#1f0825] px-3 py-2.5 text-sm font-medium text-white transition hover:bg-[#3b0842]"
          >
            {createLabel}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsActionsOpen((current) => !current);

              setIsOpen(false);
            }}
            aria-label="More actions"
            title="More actions"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
          >
            •••
          </button>

          {isActionsOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
              <button
                type="button"
                onClick={() => {
                  if (!canDelete) {
                    return;
                  }

                  setIsActionsOpen(false);
                  onDeleteItem();
                }}
                disabled={!canDelete}
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {deleteLabel}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

import { SortdList } from "@/lib/types";

import { closestCenter, DndContext, DragEndEvent } from "@dnd-kit/core";

import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
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

type SortableProjectOptionProps = {
  project: SortdList;

  isActive: boolean;

  onSelect: (id: string) => void;

  onRenameList: (id: string, name: string) => void;
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

function getOpenTaskCount(project: SortdList) {
  return project.tasks.filter((task) => !task.completed).length;
}

function SortableProjectOption({
  project,
  isActive,
  onSelect,
  onRenameList,
}: SortableProjectOptionProps) {
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
    id: project.id,
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
        aria-label={`Reorder ${project.name}`}
        className="cursor-grab rounded-md px-1 py-1 text-sm text-slate-400 active:cursor-grabbing"
      >
        ⋮⋮
      </button>

      <span
        title={project.status ?? "active"}
        className={`h-2.5 w-2.5 shrink-0 rounded-full ${getStatusColour(
          project.status,
        )}`}
      />

      {isRenaming ? (
        <input
          ref={inputRef}
          value={project.name}
          onChange={(event) => onRenameList(project.id, event.target.value)}
          onBlur={() => setIsRenaming(false)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === "Escape") {
              event.preventDefault();

              setIsRenaming(false);
            }
          }}
          placeholder="Untitled project"
          className="min-w-0 flex-1 rounded-lg border border-[#cd6ce7] bg-white px-2 py-1 text-sm text-slate-900 outline-none"
        />
      ) : (
        <button
          type="button"
          onClick={() => onSelect(project.id)}
          className="min-w-0 flex-1 truncate text-left text-sm font-medium text-slate-800"
        >
          {project.name || "Untitled project"}
        </button>
      )}

      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
        {getOpenTaskCount(project)}
      </span>

      <button
        type="button"
        onClick={() => setIsRenaming(true)}
        aria-label={`Rename ${project.name}`}
        title="Rename project"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white hover:text-slate-700"
      >
        ✎
      </button>
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
  const [isOpen, setIsOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const activeProject =
    lists.find((project) => project.id === activeListId) ?? lists[0];

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);

      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = lists.findIndex((project) => project.id === active.id);

    const newIndex = lists.findIndex((project) => project.id === over.id);

    onReorderLists(arrayMove(lists, oldIndex, newIndex));
  }

  function selectProject(projectId: string) {
    onChangeList(projectId);

    setIsOpen(false);
  }

  function createProject() {
    onCreateList();

    setIsOpen(false);
  }

  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div ref={containerRef} className="relative min-w-0 flex-1">
          <label
            id="project-switcher-label"
            className="mb-1.5 block text-xs font-medium text-slate-600"
          >
            Current project
          </label>

          <button
            type="button"
            onClick={() => setIsOpen((current) => !current)}
            aria-labelledby="project-switcher-label"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            className="flex w-full min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left transition hover:border-[#cd6ce7] focus:outline-none focus:ring-2 focus:ring-[#cd6ce7]/25"
          >
            {activeProject && (
              <span
                title={activeProject.status ?? "active"}
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${getStatusColour(
                  activeProject.status,
                )}`}
              />
            )}

            <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900">
              {activeProject?.name || "Select a project"}
            </span>

            {activeProject && (
              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                {getOpenTaskCount(activeProject)}
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
                Select a project or drag to reorder.
              </p>

              <DndContext
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={lists.map((project) => project.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div
                    role="listbox"
                    aria-label="Projects"
                    className="max-h-72 space-y-1 overflow-y-auto"
                  >
                    {lists.map((project) => (
                      <SortableProjectOption
                        key={project.id}
                        project={project}
                        isActive={project.id === activeListId}
                        onSelect={selectProject}
                        onRenameList={onRenameList}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={createProject}
            className="rounded-xl bg-[#1f0825] px-3 py-2.5 text-sm font-medium text-white transition hover:bg-[#3b0842]"
          >
            + New
          </button>

          <button
            type="button"
            onClick={onDeleteList}
            disabled={lists.length === 1}
            aria-label="Delete current project"
            title="Delete current project"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Delete
          </button>
        </div>
      </div>
    </section>
  );
}

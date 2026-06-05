"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import ControlPanel from "@/components/ControlPanel";
import ListTitle from "@/components/ListTitle";
import ListSwitcher from "@/components/ListSwitcher";
import TaskList from "@/components/TaskList";
import Footer from "@/components/Footer";
import { SortdList, Task } from "@/lib/types";
import {
  getStoredActiveListId,
  getStoredHideCompleted,
  getStoredLists,
  saveActiveListId,
  saveHideCompleted,
  saveLists,
} from "@/lib/storage";
import ArchivedTasks from "@/components/ArchivedTasks";

function createDefaultList(): SortdList {
  return {
    id: crypto.randomUUID(),
    name: "My first list",
    tasks: [],
    archivedTasks: [],
    createdAt: new Date().toISOString(),
  };
}

export default function Home() {
  const [lists, setLists] = useState<SortdList[]>(() => {
    const storedLists = getStoredLists();
    return storedLists.length > 0 ? storedLists : [createDefaultList()];
  });

const [activeListId, setActiveListId] = useState(() => {
  const stored = getStoredActiveListId();
  if (stored) return stored;

  const lists = getStoredLists();
  return lists[0]?.id || "";
});

  const [hideCompleted, setHideCompleted] = useState(() =>
    getStoredHideCompleted()
  );

  const activeList = useMemo(() => {
    const foundList = lists.find((list) => list.id === activeListId) || lists[0];

    if (!foundList) return undefined;

    return {
      ...foundList,
      archivedTasks: foundList.archivedTasks ?? [],
    };
  }, [lists, activeListId]);

  const tasks = useMemo(() => {
    return activeList?.tasks ?? [];
    }, [activeList]);

const visibleTasks = useMemo(() => {
    const filteredTasks = hideCompleted
      ? tasks.filter((task) => !task.completed)
      : tasks;

    const priorityOrder = {
      high: 1,
      medium: 2,
      low: 3,
    };

    return [...filteredTasks].sort((a, b) => {
      return (
        priorityOrder[a.priority ?? "medium"] -
        priorityOrder[b.priority ?? "medium"]
      );
    });
  }, [tasks, hideCompleted]);

  useEffect(() => {
    saveLists(lists);
  }, [lists]);

  useEffect(() => {
    if (activeListId) {
      saveActiveListId(activeListId);
    }
  }, [activeListId]);

  useEffect(() => {
    saveHideCompleted(hideCompleted);
  }, [hideCompleted]);

  useEffect(() => {
    document.title = activeList?.name || "Sort'd";
  }, [activeList?.name]);

  function updateActiveList(updatedList: SortdList) {
    setLists((currentLists) =>
      currentLists.map((list) =>
        list.id === updatedList.id ? updatedList : list
      )
    );
  }

  function addTask() {
    if (!activeList) return;

    const newTask: Task = {
      id: crypto.randomUUID(),
      title: "",
      completed: false,
      createdAt: new Date().toISOString(),
      order: tasks.length + 1,
    };

    updateActiveList({
      ...activeList,
      tasks: [...tasks, newTask],
    });
  }

  function updateTask(id: string, title: string) {
    if (!activeList) return;

    updateActiveList({
      ...activeList,
      tasks: tasks.map((task) =>
        task.id === id ? { ...task, title } : task
      ),
    });
  }

  function updateTaskPriority(
    id: string,
    priority: "low" | "medium" | "high"
  ) {
    if (!activeList) return;

    updateActiveList({
      ...activeList,
      tasks: tasks.map((task) =>
        task.id === id ? { ...task, priority } : task
      ),
    });
  }

  function updateTaskEnergy(
    id: string,
    energy: "low" | "medium" | "high"
  ) {
    if (!activeList) return;

    updateActiveList({
      ...activeList,
      tasks: tasks.map((task) =>
        task.id === id ? { ...task, energy } : task
      ),
    });
  }

  function toggleTask(id: string) {
    if (!activeList) return;

    updateActiveList({
      ...activeList,
      tasks: tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      ),
    });
  }

  function deleteTask(id: string) {
    if (!activeList) return;

    updateActiveList({
      ...activeList,
      tasks: tasks.filter((task) => task.id !== id),
    });
  }

  function reorderTasks(reorderedTasks: Task[]) {
    if (!activeList) return;

    updateActiveList({
      ...activeList,
      tasks: reorderedTasks,
    });
  }

  function updateListName(name: string) {
    if (!activeList) return;

    updateActiveList({
      ...activeList,
      name,
    });
  }

  function createList() {
    const newList: SortdList = {
      id: crypto.randomUUID(),
      name: "Untitled list",
      tasks: [],
      archivedTasks: [],
      createdAt: new Date().toISOString(),
    };

    setLists((currentLists) => [...currentLists, newList]);
    setActiveListId(newList.id);
  }

  function deleteActiveList() {
    if (lists.length === 1) return;

    const remainingLists = lists.filter((list) => list.id !== activeList?.id);
    setLists(remainingLists);
    setActiveListId(remainingLists[0].id);
  }

  function renameList(id: string, name: string) {
    setLists((currentLists) =>
      currentLists.map((list) =>
        list.id === id ? { ...list, name } : list
      )
    );
  }

  function reorderLists(reorderedLists: SortdList[]) {
    setLists(reorderedLists);
  }

  function archiveCompletedTasks() {
    if (!activeList) return;

    const completedTasks = tasks
      .filter((task) => task.completed)
      .map((task) => ({
        ...task,
        archivedAt: new Date().toISOString(),
      }));

    const activeTasks = tasks.filter((task) => !task.completed);

    updateActiveList({
      ...activeList,
      tasks: activeTasks,
      archivedTasks: [...(activeList.archivedTasks ?? []), ...completedTasks],
    });
  }

  function restoreArchivedTask(taskId: string) {
  if (!activeList) return;

  const taskToRestore = activeList.archivedTasks.find(
    (task) => task.id === taskId
  );

  if (!taskToRestore) return;

  const restoredTask: Task = {
    ...taskToRestore,
    completed: false,
    archivedAt: undefined,
    order: tasks.length + 1,
  };

  updateActiveList({
    ...activeList,
    tasks: [...tasks, restoredTask],
    archivedTasks: activeList.archivedTasks.filter(
      (task) => task.id !== taskId
    ),
  });
}

  return (
    <main className="flex min-h-screen flex-col bg-[url('/default-img.jpg')] bg-cover bg-center text-slate-950">
      <Header />

      <section className="flex flex-1 justify-center px-4 py-8">
        <div className="grid w-full max-w-6xl gap-4 md:grid-cols-[260px_1fr]">
          <ListSwitcher
            lists={lists}
            activeListId={activeList?.id ?? ""}
            onChangeList={setActiveListId}
            onCreateList={createList}
            onDeleteList={deleteActiveList}
            onRenameList={renameList}
            onReorderLists={reorderLists}
          />

          <div className="rounded-3xl bg-white/85 p-5 shadow-xl backdrop-blur-md md:p-8">
            <ListTitle
              listName={activeList?.name ?? ""}
              onChangeListName={updateListName}
            />

            <ControlPanel
              onAddTask={addTask}
              hideCompleted={hideCompleted}
              onToggleHideCompleted={() => setHideCompleted((current) => !current)}
              onArchiveCompleted={archiveCompletedTasks} // 👈 add this
              hasCompleted={tasks.some(task => task.completed)}
            />

            <TaskList
              tasks={visibleTasks}
              onUpdateTask={updateTask}
              onUpdateTaskPriority={updateTaskPriority}
              onUpdateTaskEnergy={updateTaskEnergy}
              onToggleTask={toggleTask}
              onDeleteTask={deleteTask}
              onReorderTasks={reorderTasks}
            />
            <ArchivedTasks
              tasks={activeList?.archivedTasks ?? []}
              onRestoreTask={restoreArchivedTask}
            />
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
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

function createDefaultList(): SortdList {
  return {
    id: crypto.randomUUID(),
    name: "My first list",
    tasks: [],
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
    return lists.find((list) => list.id === activeListId) || lists[0];
  }, [lists, activeListId]);

  const tasks = useMemo(() => {
  return activeList?.tasks ?? [];
}, [activeList]);

  const visibleTasks = useMemo(() => {
    if (!hideCompleted) return tasks;
    return tasks.filter((task) => !task.completed);
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
            />

            <TaskList
              tasks={visibleTasks}
              onUpdateTask={updateTask}
              onToggleTask={toggleTask}
              onDeleteTask={deleteTask}
              onReorderTasks={reorderTasks}
            />
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import ControlPanel from "@/components/ControlPanel";
import ListTitle from "@/components/ListTitle";
import TaskList from "@/components/TaskList";
import Footer from "@/components/Footer";
import { Task } from "@/lib/types";
import {
  getStoredHideCompleted,
  getStoredListName,
  getStoredTasks,
  saveHideCompleted,
  saveListName,
  saveTasks,
} from "@/lib/storage";

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>(() => getStoredTasks());
  const [listName, setListName] = useState(() => getStoredListName());
  const [hideCompleted, setHideCompleted] = useState(() =>
    getStoredHideCompleted()
  );


  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    saveListName(listName);
    document.title = listName || "Sort'd";
  }, [listName]);

  useEffect(() => {
    saveHideCompleted(hideCompleted);
  }, [hideCompleted]);

  const visibleTasks = useMemo(() => {
    if (!hideCompleted) return tasks;
    return tasks.filter((task) => !task.completed);
  }, [tasks, hideCompleted]);

  function addTask() {
  console.log("Add task clicked");

  const newTask: Task = {
    id: crypto.randomUUID(),
    title: "",
    completed: false,
    createdAt: new Date().toISOString(),
    order: tasks.length + 1,
  };

  setTasks((currentTasks) => {
    console.log("Current tasks:", currentTasks);
    return [...currentTasks, newTask];
  });
}

  function updateTask(id: string, title: string) {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === id ? { ...task, title } : task
      )
    );
  }

  function toggleTask(id: string) {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  }

  function deleteTask(id: string) {
    setTasks((currentTasks) =>
      currentTasks.filter((task) => task.id !== id)
    );
  }

  function reorderTasks(reorderedTasks: Task[]) {
    setTasks(reorderedTasks);
  }

  return (
    <main className="flex min-h-screen flex-col bg-[url('/default-img.jpg')] bg-cover bg-center text-slate-950">
      <Header />

      <section className="flex flex-1 items-start justify-center px-4 py-8">
        <div className="w-full max-w-3xl rounded-3xl bg-white/85 p-5 shadow-xl backdrop-blur-md md:p-8">
          <ListTitle listName={listName} onChangeListName={setListName} />

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
      </section>

      <Footer />
    </main>
  );
}
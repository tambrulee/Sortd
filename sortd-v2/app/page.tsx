"use client";

import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import Header from "@/components/Header";
import ControlPanel from "@/components/ControlPanel";
import ListTitle from "@/components/ListTitle";
import ListSwitcher from "@/components/ListSwitcher";
import TaskList from "@/components/TaskList";
import Footer from "@/components/Footer";
import ProjectDetails from "@/components/ProjectDetails";
import {
  AppView,
  ProjectStatus,
  SortdList,
  Task,
} from "@/lib/types";
import {
  getStoredActiveListId,
  getStoredHideCompleted,
  getStoredLists,
  saveActiveListId,
  saveHideCompleted,
  saveLists,
} from "@/lib/storage";
import ArchivedTasks from "@/components/ArchivedTasks";
import WorkspaceNav from "@/components/WorkspaceNav";
import MyDayView from "@/components/MyDayView";
import AuthPanel from "@/components/AuthPanel";

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

function createDefaultList(): SortdList {
  return {
    id: crypto.randomUUID(),
    name: "My first project",
    description: "",
    status: "active",
    tasks: [],
    archivedTasks: [],
    createdAt: new Date().toISOString(),
  };
}

type TaskWithProject = Task & {
  projectId: string;
  projectName: string;
};

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

  const allTasks = useMemo<TaskWithProject[]>(() => {
    return lists.flatMap((project) =>
      project.tasks.map((task) => ({
        ...task,
        projectId: project.id,
        projectName: project.name,
      }))
    );
  }, [lists]);

const [taskFilter, setTaskFilter] = useState<"all" | "high" | "low-energy">(
    "all"
  );

const isHydrated = useSyncExternalStore(
  subscribe,
  getClientSnapshot,
  getServerSnapshot
);

const [activeView, setActiveView] =
  useState<AppView>("projects");

const visibleTasks = useMemo(() => {
  let filteredTasks = hideCompleted
    ? tasks.filter((task) => !task.completed)
    : tasks;

  if (taskFilter === "high") {
    filteredTasks = filteredTasks.filter((task) => task.priority === "high");
  }

  if (taskFilter === "low-energy") {
    filteredTasks = filteredTasks.filter((task) => task.energy === "low");
  }

  return filteredTasks;
}, [tasks, hideCompleted, taskFilter]);


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
      priority: "medium",
      energy: "medium",
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

  function updateTaskDueDate(id: string, dueDate: string) {
    if (!activeList) return;

    updateActiveList({
      ...activeList,
      tasks: tasks.map((task) =>
        task.id === id
          ? { ...task, dueDate: dueDate || undefined }
          : task
      ),
    });
  }

  function updateTaskDuration(id: string, durationMinutes?: number) {
      if (!activeList) return;

      updateActiveList({
        ...activeList,
        tasks: tasks.map((task) =>
          task.id === id
            ? { ...task, durationMinutes }
            : task
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

  const taskToDelete = tasks.find(
    (task) => task.id === id
  );

  if (!taskToDelete) return;

  const confirmed = window.confirm(
    `Delete "${taskToDelete.title || "this task"}"?`
  );

  if (!confirmed) return;

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

  function updateProjectDescription(description: string) {
  if (!activeList) return;

  updateActiveList({
    ...activeList,
    description,
  });
}

function updateProjectStatus(status: ProjectStatus) {
  if (!activeList) return;

  updateActiveList({
    ...activeList,
    status,
  });
}

  function createList() {
    const newList: SortdList = {
      id: crypto.randomUUID(),
      name: "Untitled project",
      description: "",
      status: "active",
      tasks: [],
      archivedTasks: [],
      createdAt: new Date().toISOString(),
    };

    setLists((currentLists) => [...currentLists, newList]);
    setActiveListId(newList.id);
  }

  function deleteActiveList() {
  if (!activeList || lists.length === 1) return;

  const confirmed = window.confirm(
    `Delete the project "${activeList.name}" and all of its tasks? This cannot be undone.`
  );

  if (!confirmed) return;

  const remainingLists = lists.filter(
    (list) => list.id !== activeList.id
  );

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

  if (!isHydrated) {
    return (
      <main className="min-h-screen bg-slate-50">
        <Header />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-slate-50 text-slate-950">
      <Header />

      <section className="flex flex-1 justify-center px-4 py-8">
        <div className="grid w-full max-w-6xl gap-4 md:grid-cols-[260px_1fr]">
          <div className="space-y-4">
            <AuthPanel />
            <WorkspaceNav
              activeView={activeView}
              onChangeView={setActiveView}
            />

            <ListSwitcher
              lists={lists}
              activeListId={activeList?.id ?? ""}
              onChangeList={(id) => {
                setActiveListId(id);
                setActiveView("projects");
              }}
              onCreateList={createList}
              onDeleteList={deleteActiveList}
              onRenameList={renameList}
              onReorderLists={reorderLists}
            />
          </div>

          {activeView === "my-day" ? (
            <MyDayView
              tasks={allTasks}
              onOpenProject={(projectId) => {
                setActiveListId(projectId);
                setActiveView("projects");
              }}
            />
          ) : activeView === "projects" ? (
            <div className="rounded-3xl bg-white/85 p-5 shadow-xl backdrop-blur-md md:p-8">
              <ListTitle
                listName={activeList?.name ?? ""}
                onChangeListName={updateListName}
              />

              <ProjectDetails
                description={activeList?.description ?? ""}
                status={activeList?.status ?? "active"}
                onChangeDescription={updateProjectDescription}
                onChangeStatus={updateProjectStatus}
              />

              <ControlPanel
                onAddTask={addTask}
                hideCompleted={hideCompleted}
                onToggleHideCompleted={() =>
                  setHideCompleted((current) => !current)
                }
                onArchiveCompleted={archiveCompletedTasks}
                hasCompleted={tasks.some((task) => task.completed)}
                taskFilter={taskFilter}
                onChangeTaskFilter={setTaskFilter}
              />

              <TaskList
                tasks={visibleTasks}
                onUpdateTask={updateTask}
                onUpdateTaskPriority={updateTaskPriority}
                onUpdateTaskEnergy={updateTaskEnergy}
                onUpdateTaskDueDate={updateTaskDueDate}
                onUpdateTaskDuration={updateTaskDuration}
                onToggleTask={toggleTask}
                onDeleteTask={deleteTask}
                onReorderTasks={reorderTasks}
              />

              <ArchivedTasks
                tasks={activeList?.archivedTasks ?? []}
                onRestoreTask={restoreArchivedTask}
              />
            </div>
          ) : (
            <div className="rounded-3xl bg-white/85 p-8 shadow-xl backdrop-blur-md">
              <h1 className="text-2xl font-bold capitalize">
                {activeView.replace("-", " ")}
              </h1>

              <p className="mt-2 text-slate-500">
                This workspace is coming next.
              </p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
  }
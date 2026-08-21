"use client";

// React imports
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

// Components
import Header from "@/components/Header";
import ControlPanel from "@/components/ControlPanel";
import ListTitle from "@/components/ListTitle";
import ListSwitcher from "@/components/ListSwitcher";
import TaskList from "@/components/TaskList";
import Footer from "@/components/Footer";
import ProjectDetails from "@/components/ProjectDetails";
import ArchivedTasks from "@/components/ArchivedTasks";
import WorkspaceNav from "@/components/WorkspaceNav";
import MyDayView from "@/components/MyDayView";
import AuthPanel from "@/components/AuthPanel";
import RoutinesView from "@/components/RoutinesView";
import { createDefaultScheduleSettings } from "@/lib/schedule";
import PlannerView from "@/components/PlannerView";
import ShoppingView from "@/components/ShoppingView";

// Types and storage utilities
import {
  AppView,
  ProjectStatus,
  RecurrenceUnit,
  Routine,
  ScheduleSettings,
  ShoppingList,
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


// Supabase client for cloud workspace storage
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

function getLocalDateKey() {
  const date = new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function parseLocalDateKey(dateKey: string) {
  const [year, month, day] = dateKey
    .split("-")
    .map(Number);

  return new Date(year, month - 1, day);
}

function toLocalDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function getNextRoutineDate(
  dateKey: string,
  interval: number,
  unit: RecurrenceUnit
) {
  const date = parseLocalDateKey(dateKey);
  const safeInterval = Math.max(1, interval);

  if (unit === "day") {
    date.setDate(date.getDate() + safeInterval);
  }

  if (unit === "week") {
    date.setDate(
      date.getDate() + safeInterval * 7
    );
  }

  if (unit === "month") {
    const originalDay = date.getDate();

    date.setDate(1);
    date.setMonth(
      date.getMonth() + safeInterval
    );

    const finalDayOfMonth = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0
    ).getDate();

    date.setDate(
      Math.min(originalDay, finalDayOfMonth)
    );
  }

  return toLocalDateKey(date);
}

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

type CloudWorkspaceData = {
  version: 1;
  lists: SortdList[];
  routines: Routine[];
  shoppingLists?: ShoppingList[];
  scheduleSettings?: ScheduleSettings;
  activeListId: string;
  hideCompleted: boolean;
};

export default function Home() {
  const [routines, setRoutines] =
  useState<Routine[]>([]);

  const [
    scheduleSettings,
    setScheduleSettings,
  ] = useState<ScheduleSettings>(() =>
    createDefaultScheduleSettings()
  );

  const [
  shoppingLists,
  setShoppingLists,
] = useState<ShoppingList[]>([]);

  const [user, setUser] =
    useState<User | null>(null);

  const cloudReadyForUserRef =
  useRef<string | null>(null);

  const [lists, setLists] =
    useState<SortdList[]>(() => {
      const storedLists = getStoredLists();

      return storedLists.length > 0
        ? storedLists
        : [createDefaultList()];
    });

  const [activeListId, setActiveListId] =
    useState(() => {
      const stored = getStoredActiveListId();

      if (stored) return stored;

      const storedLists = getStoredLists();
      return storedLists[0]?.id || "";
    });

  const [hideCompleted, setHideCompleted] =
    useState(() => getStoredHideCompleted());

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
  if (!user) return;

    saveLists(lists);
  }, [lists, user]);

  useEffect(() => {
    if (!user || !activeListId) return;

    saveActiveListId(activeListId);
  }, [activeListId, user]);

  useEffect(() => {
    if (!user) return;

    saveHideCompleted(hideCompleted);
  }, [hideCompleted, user]);

  useEffect(() => {
    document.title = activeList?.name || "Sort'd";
  }, [activeList?.name]);

  // Load cloud workspace for the user when they log in
  useEffect(() => {
  if (!user) {
    cloudReadyForUserRef.current = null;
    return;
  }

  const userId = user.id;
  let cancelled = false;

  async function loadCloudWorkspace() {
    const localWorkspace: CloudWorkspaceData = {
      version: 1,
      lists: getStoredLists(),
      activeListId:
        getStoredActiveListId() ?? "",
      hideCompleted: getStoredHideCompleted(),
      routines: [],
      scheduleSettings:
        createDefaultScheduleSettings(
          Intl.DateTimeFormat()
            .resolvedOptions()
            .timeZone || "Europe/London"
        ),
      shoppingLists: [],
    };

    if (
      !localStorage.getItem(
        "sortd-pre-cloud-backup"
      )
    ) {
      localStorage.setItem(
        "sortd-pre-cloud-backup",
        JSON.stringify(localWorkspace)
      );
    }

    const { data: workspaceRow, error } =
      await supabase
        .from("workspaces")
        .select("data")
        .eq("user_id", userId)
        .maybeSingle();

    if (cancelled) return;

    if (error) {
      console.error(
        "Unable to load cloud workspace:",
        error
      );
      return;
    }

    const cloudWorkspace =
      workspaceRow?.data as
        | CloudWorkspaceData
        | undefined;

    if (
      cloudWorkspace &&
      Array.isArray(cloudWorkspace.lists) &&
      cloudWorkspace.lists.length > 0
    ) {
      cloudReadyForUserRef.current = userId;

      setLists(cloudWorkspace.lists);

      setActiveListId(
        cloudWorkspace.activeListId ||
          cloudWorkspace.lists[0].id
      );

      setHideCompleted(
        cloudWorkspace.hideCompleted ?? false
      );

      setRoutines(
        cloudWorkspace.routines ?? []
      );

      setShoppingLists(
        cloudWorkspace.shoppingLists ?? []
      );

      setScheduleSettings(
        cloudWorkspace.scheduleSettings ??
          createDefaultScheduleSettings(
            Intl.DateTimeFormat()
              .resolvedOptions()
              .timeZone || "Europe/London"
          )
      );

      return;
    }

    const listsToUpload =
      localWorkspace.lists.length > 0
        ? localWorkspace.lists
        : [createDefaultList()];

    const firstWorkspace: CloudWorkspaceData = {
      version: 1,
      lists: listsToUpload,
      activeListId:
        localWorkspace.activeListId ||
        listsToUpload[0].id,
      hideCompleted:
        localWorkspace.hideCompleted,
      routines: [],
      scheduleSettings:
        localWorkspace.scheduleSettings,
      shoppingLists: [],
    };

    const { error: uploadError } =
      await supabase
        .from("workspaces")
        .upsert(
          {
            user_id: userId,
            data: firstWorkspace,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id",
          }
        );

    if (cancelled) return;

    if (uploadError) {
      console.error(
        "Unable to create cloud workspace:",
        uploadError
      );
      return;
    }

    cloudReadyForUserRef.current = userId;
  }

  loadCloudWorkspace();

  return () => {
    cancelled = true;
  };
}, [user]);

// Save cloud workspace when lists, activeListId, or hideCompleted changes
useEffect(() => {
  if (
    !user ||
    cloudReadyForUserRef.current !== user.id
  ) {
    return;
  }

  const saveTimer = window.setTimeout(
    async () => {
      const workspace: CloudWorkspaceData = {
        version: 1,
        lists,
        routines,
        shoppingLists,
        scheduleSettings,
        activeListId,
        hideCompleted,
      };

      const { error } = await supabase
        .from("workspaces")
        .upsert(
          {
            user_id: user.id,
            data: workspace,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id",
          }
        );

      if (error) {
        console.error(
          "Unable to save cloud workspace:",
          error
        );
      }
    },
    800
  );

  return () => {
    window.clearTimeout(saveTimer);
  };
}, [
  lists,
  activeListId,
  hideCompleted,
  routines,
  shoppingLists,
  scheduleSettings,
  user,
]);

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

    setTaskFilter("all");
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

  function completeRoutineTask(
  routineId: string,
  taskId: string
) {
  const completedAt = new Date().toISOString();
  const today = getLocalDateKey();

  setRoutines((currentRoutines) =>
    currentRoutines.map((routine) => {
      if (routine.id !== routineId) {
        return routine;
      }

      return {
        ...routine,
        tasks: routine.tasks.map((task) => {
          if (task.id !== taskId) {
            return task;
          }

          return {
            ...task,
            lastCompletedAt: completedAt,
            completionHistory: [
              ...(task.completionHistory ?? []),
              completedAt,
            ],
            nextDueDate: getNextRoutineDate(
              today,
              task.interval,
              task.recurrenceUnit
            ),
          };
        }),
      };
    })
  );
}


  if (!isHydrated) {
    return (
      <main className="min-h-screen bg-slate-50">
        <Header />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen flex-col bg-slate-50 text-slate-950">
        <Header />

        <section className="flex flex-1 items-center justify-center px-4 py-12">
          <div className="w-full max-w-sm">
            <AuthPanel onUserChange={setUser} />
          </div>
        </section>

        <Footer />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-slate-50 text-slate-950">
      <Header />

      <section className="flex flex-1 justify-center px-4 py-8">
        <div className="grid w-full max-w-6xl gap-4 md:grid-cols-[260px_1fr]">
          <div className="space-y-4">
            <AuthPanel onUserChange={setUser} />
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
              routines={routines}
              onCompleteRoutineTask={completeRoutineTask}
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
                onAddTask={addTask}
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

          ) : activeView === "shopping" ? (
          <ShoppingView
            shoppingLists={shoppingLists}
            onChangeShoppingLists={
              setShoppingLists
            }
          />

          ) : activeView === "planner" ? (
          <PlannerView
            tasks={allTasks}
            routines={routines}
            settings={scheduleSettings}
            onChangeSettings={
              setScheduleSettings
            }
          />
          ) : 
           activeView === "routines" ? (
              <RoutinesView
                routines={routines}
                onChangeRoutines={setRoutines}
              />
            ) : 
            (
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
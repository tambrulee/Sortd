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
import ProjectsView from "@/components/ProjectsView";
import Footer from "@/components/Footer";
import WorkspaceNav from "@/components/WorkspaceNav";
import MyDayView from "@/components/MyDayView";
import AuthPanel from "@/components/AuthPanel";
import RoutinesView from "@/components/RoutinesView";
import { createDefaultScheduleSettings } from "@/lib/schedule";
import PlannerView from "@/components/PlannerView";
import ShoppingView from "@/components/ShoppingView";
import GoalsView from "@/components/GoalsView";
import DreamsView from "@/components/DreamsView";
import SettingsControlPanel from "@/components/SettingsControlPanel";
import FoodView from "@/components/FoodView";

// AskSortd
import AskSortd from "@/components/AskSortd";

// Types and storage utilities
import {
  AppView,
  Dream,
  Goal,
  ProjectStatus,
  RecurrenceUnit,
  Routine,
  RoutineTask,
  ScheduleContext,
  ScheduleSettings,
  ShoppingList,
  SortdList,
  Task,
  FoodData,
  AdhocTask,
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
  const [year, month, day] = dateKey.split("-").map(Number);

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
  unit: RecurrenceUnit,
) {
  const date = parseLocalDateKey(dateKey);
  const safeInterval = Math.max(1, interval);

  if (unit === "day") {
    date.setDate(date.getDate() + safeInterval);
  }

  if (unit === "week") {
    date.setDate(date.getDate() + safeInterval * 7);
  }

  if (unit === "month") {
    const originalDay = date.getDate();

    date.setDate(1);
    date.setMonth(date.getMonth() + safeInterval);

    const finalDayOfMonth = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0,
    ).getDate();

    date.setDate(Math.min(originalDay, finalDayOfMonth));
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

  projectStatus?: ProjectStatus;
  projectStartDate?: string;
  projectTargetDate?: string;

  projectScheduleContext?: ScheduleContext;
  projectEarliestStartTime?: string;
  projectLatestEndTime?: string;
};

type CloudWorkspaceData = {
  version: 1;
  lists: SortdList[];
  routines: Routine[];
  goals?: Goal[];
  dreams?: Dream[];

  shoppingLists?: ShoppingList[];

  foodData?: FoodData;

  scheduleSettings?: ScheduleSettings;

  activeListId: string;
  hideCompleted: boolean;
};

export default function Home() {
  const [routines, setRoutines] = useState<Routine[]>([]);

  const [scheduleSettings, setScheduleSettings] = useState<ScheduleSettings>(
    () => createDefaultScheduleSettings(),
  );

  const [adhocTasks, setAdhocTasks] = useState<AdhocTask[]>([]);

  function addAdhocTask(task: AdhocTask) {
    setAdhocTasks((current) => [...current, task]);
  }

  function completeAdhocTask(taskId: string) {
    setAdhocTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              completed: true,
            }
          : task,
      ),
    );
  }

  function updateAdhocTask(taskId: string, updates: Partial<AdhocTask>) {
    setAdhocTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              ...updates,
            }
          : task,
      ),
    );
  }

  function deleteAdhocTask(taskId: string) {
    setAdhocTasks((current) => current.filter((task) => task.id !== taskId));
  }

  const [goals, setGoals] = useState<Goal[]>([]);
  const [dreams, setDreams] = useState<Dream[]>([]);

  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);

  const [foodData, setFoodData] = useState<FoodData>({
    meals: [],
    mealPlan: [],
    shoppingList: [],
  });

  const [user, setUser] = useState<User | null>(null);

  const cloudReadyForUserRef = useRef<string | null>(null);

  const [lists, setLists] = useState<SortdList[]>(() => {
    const storedLists = getStoredLists();

    return storedLists.length > 0 ? storedLists : [createDefaultList()];
  });

  const [activeListId, setActiveListId] = useState(() => {
    const stored = getStoredActiveListId();

    if (stored) return stored;

    const storedLists = getStoredLists();
    return storedLists[0]?.id || "";
  });

  const [hideCompleted, setHideCompleted] = useState(() =>
    getStoredHideCompleted(),
  );

  const [, setActiveGoalId] = useState<string | null>(null);

  const [, setActiveDreamId] = useState<string | null>(null);

  const activeList = useMemo(() => {
    const foundList =
      lists.find((list) => list.id === activeListId) || lists[0];

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

        projectStatus: project.status,
        projectStartDate: project.startDate,
        projectTargetDate: project.targetDate,

        projectScheduleContext: project.scheduleContext,

        projectEarliestStartTime: project.earliestStartTime,

        projectLatestEndTime: project.latestEndTime,
      })),
    );
  }, [lists]);

  // AI Brain
  const aiContext = useMemo(() => {
    return {
      now: new Date().toISOString(),

      timeZone:
        Intl.DateTimeFormat().resolvedOptions().timeZone,

      localTime: new Intl.DateTimeFormat(
        "en-GB",
        {
          dateStyle: "full",
          timeStyle: "short",
        },
      ).format(new Date()),

      projects: lists.map((project) => ({
        id: project.id,
        name: project.name,
        description: project.description,
       status: project.status,
       startDate: project.startDate,
       targetDate: project.targetDate,
       goalId: project.goalId,
       scheduleContext:
        project.scheduleContext,
        earliestStartTime:
          project.earliestStartTime,
        latestEndTime:
          project.latestEndTime,

        tasks: project.tasks
          .filter(
            (task) =>
              !task.completed &&
              task.title.trim().length > 0,
          )
          .map((task) => ({
            id: task.id,
            title: task.title,
            completed: task.completed,
            priority: task.priority,
            energy: task.energy,
            dueDate: task.dueDate,
            durationMinutes:
              task.durationMinutes,
            maxSessionMinutes:
              task.maxSessionMinutes,
            scheduleContext:
              task.scheduleContext,
            earliestStartTime:
              task.earliestStartTime,
            latestEndTime:
              task.latestEndTime,
          }),
        ),
      })),

      routines,

      goals,

      dreams,

      adhocTasks,

      scheduleSettings,
    };
  }, [
    lists,
    routines,
    goals,
    dreams,
    adhocTasks,
    scheduleSettings,
  ]);

  const [taskFilter, setTaskFilter] = useState<"all" | "high" | "low-energy">(
    "all",
  );

  const isHydrated = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );

  const [activeView, setActiveView] = useState<AppView>("projects");

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
        activeListId: getStoredActiveListId() ?? "",
        hideCompleted: getStoredHideCompleted(),
        routines: [],
        goals: [],
        dreams: [],
        shoppingLists: [],
        foodData: {
          meals: [],
          mealPlan: [],
          shoppingList: [],
        },

        scheduleSettings: createDefaultScheduleSettings(
          Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/London",
        ),
      };

      if (!localStorage.getItem("sortd-pre-cloud-backup")) {
        localStorage.setItem(
          "sortd-pre-cloud-backup",
          JSON.stringify(localWorkspace),
        );
      }

      const { data: workspaceRow, error } = await supabase
        .from("workspaces")
        .select("data")
        .eq("user_id", userId)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error("Unable to load cloud workspace:", error);
        return;
      }

      const cloudWorkspace = workspaceRow?.data as
        CloudWorkspaceData | undefined;

      if (
        cloudWorkspace &&
        Array.isArray(cloudWorkspace.lists) &&
        cloudWorkspace.lists.length > 0
      ) {
        cloudReadyForUserRef.current = userId;

        setLists(cloudWorkspace.lists);

        setActiveListId(
          cloudWorkspace.activeListId || cloudWorkspace.lists[0].id,
        );

        setHideCompleted(cloudWorkspace.hideCompleted ?? false);

        setRoutines(cloudWorkspace.routines ?? []);

        setShoppingLists(cloudWorkspace.shoppingLists ?? []);

        setFoodData(
          cloudWorkspace.foodData ?? {
            meals: [],
            mealPlan: [],
            shoppingList: [],
          },
        );

        setGoals(cloudWorkspace.goals ?? []);

        setDreams(cloudWorkspace.dreams ?? []);

        setScheduleSettings(
          cloudWorkspace.scheduleSettings ??
            createDefaultScheduleSettings(
              Intl.DateTimeFormat().resolvedOptions().timeZone ||
                "Europe/London",
            ),
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
        activeListId: localWorkspace.activeListId || listsToUpload[0].id,
        hideCompleted: localWorkspace.hideCompleted,
        routines: [],
        goals: [],
        dreams: [],
        shoppingLists: [],
        foodData: {
          meals: [],
          mealPlan: [],
          shoppingList: [],
        },
        scheduleSettings: localWorkspace.scheduleSettings,
      };

      const { error: uploadError } = await supabase.from("workspaces").upsert(
        {
          user_id: userId,
          data: firstWorkspace,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        },
      );

      if (cancelled) return;

      if (uploadError) {
        console.error("Unable to create cloud workspace:", uploadError);
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
    if (!user || cloudReadyForUserRef.current !== user.id) {
      return;
    }

    const saveTimer = window.setTimeout(async () => {
      const workspace: CloudWorkspaceData = {
        version: 1,
        lists,
        routines,
        goals,
        dreams,
        shoppingLists,
        foodData,
        scheduleSettings,
        activeListId,
        hideCompleted,
      };

      try {
        console.log(
          "Saving time windows:",
          lists.map((project) => ({
            project: project.name,
            earliestStartTime: project.earliestStartTime,
            latestEndTime: project.latestEndTime,
            tasks: project.tasks.map((task) => ({
              title: task.title,
              earliestStartTime: task.earliestStartTime,
              latestEndTime: task.latestEndTime,
            })),
          })),
        );

        const { data, error } = await supabase
          .from("workspaces")
          .upsert(
            {
              user_id: user.id,
              data: workspace,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: "user_id",
            },
          )
          .select();

        if (error) {
          console.error("Unable to save cloud workspace:", error);

          return;
        }

        console.log("Cloud workspace saved:", data);
      } catch (error) {
        console.error("Cloud workspace save request failed:", error);
      }
    }, 800);

    return () => {
      window.clearTimeout(saveTimer);
    };
  }, [
    lists,
    activeListId,
    hideCompleted,
    routines,
    goals,
    dreams,
    shoppingLists,
    foodData,
    scheduleSettings,
    user,
  ]);

  function updateActiveList(updatedList: SortdList) {
    setLists((currentLists) =>
      currentLists.map((list) =>
        list.id === updatedList.id ? updatedList : list,
      ),
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
      tasks: tasks.map((task) => (task.id === id ? { ...task, title } : task)),
    });
  }

  function updateTaskPriority(id: string, priority: "low" | "medium" | "high") {
    if (!activeList) return;

    updateActiveList({
      ...activeList,
      tasks: tasks.map((task) =>
        task.id === id ? { ...task, priority } : task,
      ),
    });
  }

  function updateTaskEnergy(id: string, energy: "low" | "medium" | "high") {
    if (!activeList) return;

    updateActiveList({
      ...activeList,
      tasks: tasks.map((task) => (task.id === id ? { ...task, energy } : task)),
    });
  }

  function updateTaskDueDate(id: string, dueDate: string) {
    if (!activeList) return;

    updateActiveList({
      ...activeList,
      tasks: tasks.map((task) =>
        task.id === id ? { ...task, dueDate: dueDate || undefined } : task,
      ),
    });
  }

  function updateTaskDuration(id: string, durationMinutes?: number) {
    if (!activeList) return;

    updateActiveList({
      ...activeList,
      tasks: tasks.map((task) =>
        task.id === id ? { ...task, durationMinutes } : task,
      ),
    });
  }

  function updateTaskMaxSession(id: string, maxSessionMinutes?: number) {
    if (!activeList) return;

    updateActiveList({
      ...activeList,
      tasks: tasks.map((task) =>
        task.id === id
          ? {
              ...task,
              maxSessionMinutes,
            }
          : task,
      ),
    });
  }

  function updateTaskScheduleContext(
    id: string,
    scheduleContext?: ScheduleContext,
  ) {
    if (!activeList) return;

    updateActiveList({
      ...activeList,

      tasks: tasks.map((task) =>
        task.id === id
          ? {
              ...task,
              scheduleContext,
            }
          : task,
      ),
    });
  }

  function toggleTask(id: string) {
    if (!activeList) return;

    updateActiveList({
      ...activeList,
      tasks: tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task,
      ),
    });
  }

  function completeProjectTask(projectId: string, taskId: string) {
    setLists((currentLists) =>
      currentLists.map((project) => {
        if (project.id !== projectId) {
          return project;
        }

        return {
          ...project,

          tasks: project.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  completed: true,
                }
              : task,
          ),
        };
      }),
    );
  }

  function updateProjectTaskById(
    projectId: string,
    taskId: string,
    updates: Partial<Task>,
  ) {
    setLists((currentLists) =>
      currentLists.map((project) => {
        if (project.id !== projectId) {
          return project;
        }

        return {
          ...project,

          tasks: project.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  ...updates,
                }
              : task,
          ),
        };
      }),
    );
  }

  function deleteProjectTaskById(
    projectId: string,
    taskId: string,
  ) {
    setLists((currentLists) =>
      currentLists.map((item) => {
        if (item.id !== projectId) {
          return item;
        }

        return {
          ...item,
          tasks: item.tasks.filter(
            (projectTask) =>
              projectTask.id !== taskId,
          ),
        };
      }),
    );
  }

  function updateRoutineTaskById(
    routineId: string,
    taskId: string,
    updates: Partial<RoutineTask>,
  ) {
    setRoutines((currentRoutines) =>
      currentRoutines.map((routine) => {
        if (routine.id !== routineId) {
          return routine;
        }

        return {
          ...routine,

          tasks: routine.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  ...updates,
                }
              : task,
          ),
        };
      }),
    );
  }

  function deleteRoutineTaskById(
    routineId: string,
    taskId: string,
  ) {
    setRoutines((currentRoutines) =>
      currentRoutines.map((item) => {
        if (item.id !== routineId) {
          return item;
        }

        return {
          ...item,

          tasks: item.tasks.filter(
            (routineTask) =>
              routineTask.id !== taskId,
          ),
        };
      }),
    );
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

  function updateProjectStartDate(startDate?: string) {
    if (!activeList) return;

    updateActiveList({
      ...activeList,
      startDate,
    });
  }

  function updateProjectTargetDate(targetDate?: string) {
    if (!activeList) return;

    updateActiveList({
      ...activeList,
      targetDate,
    });
  }

  function updateProjectGoal(goalId?: string) {
    if (!activeList) return;

    updateActiveList({
      ...activeList,
      goalId,
    });
  }

  function updateProjectScheduleContext(scheduleContext: ScheduleContext) {
    if (!activeList) return;

    updateActiveList({
      ...activeList,
      scheduleContext,
    });
  }

  function updateProjectEarliestStartTime(earliestStartTime?: string) {
    if (!activeList) return;

    updateActiveList({
      ...activeList,
      earliestStartTime,
    });
  }

  function updateProjectLatestEndTime(latestEndTime?: string) {
    if (!activeList) return;

    updateActiveList({
      ...activeList,
      latestEndTime,
    });
  }

  function createList() {
    const newList: SortdList = {
      id: crypto.randomUUID(),
      name: "Untitled project",
      description: "",
      status: "backlog",
      tasks: [],
      archivedTasks: [],
      createdAt: new Date().toISOString(),
    };

    setLists((currentLists) => [...currentLists, newList]);
    setActiveListId(newList.id);
  }

  function deleteActiveList() {
    if (!activeList || lists.length === 1) return;

    const remainingLists = lists.filter(
      (list) => list.id !== activeList.id,
    );

    setLists(remainingLists);
    setActiveListId(remainingLists[0].id);
  }

  function renameList(id: string, name: string) {
    setLists((currentLists) =>
      currentLists.map((list) => (list.id === id ? { ...list, name } : list)),
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
      (task) => task.id === taskId,
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
        (task) => task.id !== taskId,
      ),
    });
  }

  function completeRoutineTask(routineId: string, taskId: string) {
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
                task.recurrenceUnit,
              ),
            };
          }),
        };
      }),
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

            <AskSortd context={aiContext} />
          </div>

          {activeView === "my-day" ? (
            <MyDayView
              tasks={allTasks}
              routines={routines}
              onCompleteProjectTask={completeProjectTask}
              onCompleteRoutineTask={completeRoutineTask}
              onOpenProject={(projectId) => {
                setActiveListId(projectId);
                setActiveView("projects");
              }}
            />
          ) : activeView === "projects" ? (
            <ProjectsView
              goals={goals}
              dreams={dreams}

              projects={lists}

              onOpenGoal={(goalId) => {
                setActiveGoalId(goalId);
                setActiveView("goals");
              }}

              onOpenDream={(dreamId) => {
                setActiveDreamId(dreamId);
                setActiveView("dreams");
              }}

              activeProject={activeList}

              activeProjectId={activeList?.id ?? ""}

              visibleTasks={visibleTasks}
              hideCompleted={hideCompleted}
              taskFilter={taskFilter}

              onChangeProject={setActiveListId}

              onCreateProject={createList}

              onDeleteProject={deleteActiveList}

              onRenameProject={renameList}

              onReorderProjects={reorderLists}

              onChangeProjectGoal={updateProjectGoal}

              onChangeProjectName={updateListName}

              onChangeProjectDescription={updateProjectDescription}

              onChangeProjectStatus={updateProjectStatus}

              onChangeProjectStartDate={updateProjectStartDate}

              onChangeProjectTargetDate={updateProjectTargetDate}

              onChangeProjectScheduleContext={updateProjectScheduleContext}

              onChangeProjectEarliestStartTime={updateProjectEarliestStartTime}

              onChangeProjectLatestEndTime={updateProjectLatestEndTime}

              onAddTask={addTask}

              onToggleHideCompleted={() =>
                setHideCompleted((current) => !current)
              }

              onArchiveCompleted={archiveCompletedTasks}

              onChangeTaskFilter={setTaskFilter}

              onUpdateTask={updateTask}

              onUpdateTaskPriority={updateTaskPriority}

              onUpdateTaskEnergy={updateTaskEnergy}

              onUpdateTaskDueDate={updateTaskDueDate}

              onUpdateTaskDuration={updateTaskDuration}

              onUpdateTaskMaxSession={updateTaskMaxSession}

              onUpdateTaskScheduleContext={updateTaskScheduleContext}

              onToggleTask={toggleTask}

              onDeleteTask={deleteTask}

              onReorderTasks={reorderTasks}

              onRestoreTask={restoreArchivedTask}
            />
          ) : activeView === "goals" ? (
            <GoalsView
              goals={goals}
              dreams={dreams}
              projects={lists}
              onChangeGoals={setGoals}

              onOpenDream={(dreamId) => {
                setActiveDreamId(dreamId);
                setActiveView("dreams");
              }}

              onOpenProject={(projectId) => {
                setActiveListId(projectId);
                setActiveView("projects");
              }}

              onCreateProjectForGoal={(goalId) => {
                const newProject = {
                  id: crypto.randomUUID(),
                  name: "New project",
                  description: "",
                  tasks: [],
                  archivedTasks: [],
                  status: "backlog" as const,
                  goalId,
                  scheduleContext: "personal" as const,
                  createdAt: new Date().toISOString(),
                };

                reorderLists([...lists, newProject]);

                setActiveListId(newProject.id);

                setActiveView("projects");
              }}
            />
          ) : activeView === "shopping" ? (
            <ShoppingView
              shoppingLists={shoppingLists}
              onChangeShoppingLists={setShoppingLists}
            />
          ) : activeView === "food" ? (
            <FoodView foodData={foodData} onChangeFoodData={setFoodData} />
          ) : activeView === "dreams" ? (
            <DreamsView
              dreams={dreams}
              goals={goals}
              projects={lists}
              onChangeDreams={setDreams}
              onChangeGoals={setGoals}
              onOpenGoal={(goalId) => {
                setActiveGoalId(goalId);
                setActiveView("goals");
              }}
            />
          ) : activeView === "settings" ? (
            <SettingsControlPanel
              settings={scheduleSettings}
              onChangeSettings={setScheduleSettings}
            />
          ) : activeView === "planner" ? (
            <PlannerView
              tasks={allTasks}
              routines={routines}
              adhocTasks={adhocTasks}
              settings={scheduleSettings}
              onChangeSettings={setScheduleSettings}
              onCompleteProjectTask={completeProjectTask}
              onCompleteRoutineTask={completeRoutineTask}
              onUpdateProjectTask={updateProjectTaskById}
              onUpdateRoutineTask={updateRoutineTaskById}
              onDeleteProjectTask={deleteProjectTaskById}
              onDeleteRoutineTask={deleteRoutineTaskById}
              onAddAdhocTask={addAdhocTask}
              onCompleteAdhocTask={completeAdhocTask}
              onUpdateAdhocTask={updateAdhocTask}
              onDeleteAdhocTask={deleteAdhocTask}
            />
          ) : (
            <RoutinesView routines={routines} onChangeRoutines={setRoutines} />
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}

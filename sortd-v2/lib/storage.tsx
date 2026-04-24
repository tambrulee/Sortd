import { Task } from "./types";

const TASKS_KEY = "sortd-tasks";
const LIST_NAME_KEY = "sortd-list-name";
const HIDE_COMPLETED_KEY = "sortd-hide-completed";

export function getStoredTasks(): Task[] {
  if (typeof window === "undefined") return [];

  const stored = localStorage.getItem(TASKS_KEY);

  if (!stored) return [];

  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveTasks(tasks: Task[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

export function getStoredListName() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(LIST_NAME_KEY) || "";
}

export function saveListName(name: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LIST_NAME_KEY, name);
}

export function getStoredHideCompleted() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(HIDE_COMPLETED_KEY) === "true";
}

export function saveHideCompleted(value: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(HIDE_COMPLETED_KEY, String(value));
}
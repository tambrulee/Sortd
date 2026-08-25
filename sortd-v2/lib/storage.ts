import { SortdList } from "./types";

const LISTS_KEY = "sortd-lists";
const ACTIVE_LIST_KEY = "sortd-active-list-id";
const HIDE_COMPLETED_KEY = "sortd-hide-completed";

export function getStoredLists(): SortdList[] {
  if (typeof window === "undefined") return [];

  const stored = localStorage.getItem(LISTS_KEY);
  if (!stored) return [];

  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveLists(lists: SortdList[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LISTS_KEY, JSON.stringify(lists));
}

export function getStoredActiveListId() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(ACTIVE_LIST_KEY) || "";
}

export function saveActiveListId(id: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACTIVE_LIST_KEY, id);
}

export function getStoredHideCompleted() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(HIDE_COMPLETED_KEY) === "true";
}

export function saveHideCompleted(value: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(HIDE_COMPLETED_KEY, String(value));
}

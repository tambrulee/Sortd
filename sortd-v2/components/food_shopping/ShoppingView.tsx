"use client";

import { useState } from "react";

import CollectionSwitcher from "@/components/planner/CollectionSwitcher";
import ShoppingItemModal from "@/components/food_shopping/ShoppingItemModal";
import ConfirmDialog from "@/components/prompts/ConfirmDialog";

import {
  ShoppingCategory,
  ShoppingIntent,
  ShoppingItem,
  ShoppingList,
} from "@/lib/types";

type ShoppingViewProps = {
  shoppingLists: ShoppingList[];
  onChangeShoppingLists: (shoppingLists: ShoppingList[]) => void;
};

type ShoppingItemWithList = ShoppingItem & {
  listId: string;
  listName: string;
};

type SortOption = "name" | "shop" | "category" | "cost-high" | "cost-low";

type StatusFilter = "remaining" | "bought" | "all";

type IntentFilter = "all" | "need" | "want";

const categories: Array<{
  value: ShoppingCategory;
  label: string;
}> = [
  { value: "food", label: "Food" },
  {
    value: "household",
    label: "Household",
  },
  {
    value: "health",
    label: "Health",
  },
  {
    value: "beauty",
    label: "Beauty",
  },
  {
    value: "clothing",
    label: "Clothing",
  },
  {
    value: "garden",
    label: "Garden",
  },
  {
    value: "gifts",
    label: "Gifts",
  },
  {
    value: "other",
    label: "Other",
  },
];

const currencyFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

export default function ShoppingView({
  shoppingLists,
  onChangeShoppingLists,
}: ShoppingViewProps) {
  const [shoppingView, setShoppingView] = useState<"overview" | "items" | "planner" | "archive">("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionItemRef, setActionItemRef] = useState<{listId: string; itemId: string} | null>(null);
  const [actionDate, setActionDate] = useState("");
  const [activeShoppingListId, setActiveShoppingListId] =
    useState<string>("all");

  const [shopFilter, setShopFilter] = useState("all");

  const [categoryFilter, setCategoryFilter] = useState<
    ShoppingCategory | "all"
  >("all");

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("remaining");

  const [intentFilter, setIntentFilter] = useState<IntentFilter>("all");

  const [sortBy, setSortBy] = useState<SortOption>("name");

  const [showAllShops, setShowAllShops] = useState(false);

  const [selectedItemRef, setSelectedItemRef] = useState<{
    listId: string;
    itemId: string;
  } | null>(null);

  const [selectingShopping, setSelectingShopping] = useState(false);
  const [selectedShoppingKeys, setSelectedShoppingKeys] = useState<string[]>([]);
  const [bulkPurchaseDate, setBulkPurchaseDate] = useState("");
  const [newItemPlannedDate, setNewItemPlannedDate] = useState("");
  const shoppingKey = (listId: string, itemId: string) => `${listId}:${itemId}`;
  const localDate = (offset = 0) => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };

  const [newItemTitle, setNewItemTitle] = useState("");

  const [newItemQuantity, setNewItemQuantity] = useState("");

  const [newItemShop, setNewItemShop] = useState("");

  const [newItemCategory, setNewItemCategory] =
    useState<ShoppingCategory>("food");

  const [newItemIntent, setNewItemIntent] = useState<ShoppingIntent>("need");

  const [newItemEstimatedCost, setNewItemEstimatedCost] = useState("");

  const [
    shoppingListToDeleteId,
    setShoppingListToDeleteId,
  ] = useState<string | null>(null);

  const [
    shoppingItemToDelete,
    setShoppingItemToDelete,
  ] = useState<{
    listId: string;
    itemId: string;
  } | null>(null);

  const isAllView = activeShoppingListId === "all";

  const activeList = isAllView
    ? undefined
    : shoppingLists.find((list) => list.id === activeShoppingListId);

  const knownShops = Array.from(
    new Set(
      shoppingLists.flatMap((list) =>
        list.items
          .map((item) => item.shop?.trim())
          .filter((shop): shop is string => Boolean(shop)),
      ),
    ),
  ).sort();

  const allShoppingItems: ShoppingItemWithList[] = shoppingLists.flatMap(
    (list) =>
      list.items.map((item) => ({
        ...item,
        listId: list.id,
        listName: list.name,
      })),
  );

  const selectedItem = selectedItemRef
    ? allShoppingItems.find(
        (item) =>
          item.listId === selectedItemRef.listId &&
          item.id === selectedItemRef.itemId,
      )
    : undefined;

  const sourceItems = isAllView
    ? allShoppingItems
    : allShoppingItems.filter((item) => item.listId === activeShoppingListId);

  const dashboardItems = sourceItems.filter((item) => {
    if (statusFilter === "remaining" && item.purchased) {
      return false;
    }

    if (statusFilter === "bought" && !item.purchased) {
      return false;
    }

    if (shopFilter !== "all" && item.shop !== shopFilter) {
      return false;
    }

    if (categoryFilter !== "all" && item.category !== categoryFilter) {
      return false;
    }

    return true;
  });

  const filteredItems = dashboardItems
    .filter((item) => {
      if (searchQuery.trim() && ![item.title, item.shop ?? "", item.listName].some((value) => value.toLowerCase().includes(searchQuery.toLowerCase().trim()))) return false;
      if (intentFilter !== "all" && (item.intent ?? "need") !== intentFilter) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "shop":
          return (a.shop ?? "").localeCompare(b.shop ?? "");

        case "category":
          return a.category.localeCompare(b.category);

        case "cost-high":
          return (b.estimatedCost ?? 0) - (a.estimatedCost ?? 0);

        case "cost-low":
          return (a.estimatedCost ?? 0) - (b.estimatedCost ?? 0);

        case "name":
        default:
          return a.title.localeCompare(b.title);
      }
    });

  const needItems = dashboardItems.filter(
    (item) => (item.intent ?? "need") === "need",
  );

  const wantItems = dashboardItems.filter((item) => item.intent === "want");

  const needTotal = needItems.reduce(
    (total, item) => total + (item.estimatedCost ?? 0),
    0,
  );

  const wantTotal = wantItems.reduce(
    (total, item) => total + (item.estimatedCost ?? 0),
    0,
  );

  const grandTotal = dashboardItems.reduce(
    (total, item) => total + (item.estimatedCost ?? 0),
    0,
  );

  const shopSummary = Object.entries(
    dashboardItems.reduce<
      Record<
        string,
        {
          count: number;
          total: number;
        }
      >
    >((summary, item) => {
      const shop = item.shop?.trim() || "No shop";

      if (!summary[shop]) {
        summary[shop] = {
          count: 0,
          total: 0,
        };
      }

      summary[shop].count += 1;

      summary[shop].total += item.estimatedCost ?? 0;

      return summary;
    }, {}),
  ).sort(([, first], [, second]) => second.total - first.total);

  const visibleShopSummary = showAllShops
    ? shopSummary
    : shopSummary.slice(0, 5);

  function updateList(updatedList: ShoppingList) {
    onChangeShoppingLists(
      shoppingLists.map((list) =>
        list.id === updatedList.id ? updatedList : list,
      ),
    );
  }

  function createShoppingList(name: string) {
    const trimmedName = name.trim();

    if (!trimmedName) return;

    const newList: ShoppingList = {
      id: crypto.randomUUID(),
      name: trimmedName,
      items: [],
      createdAt: new Date().toISOString(),
      archived: false,
    };

    onChangeShoppingLists([...shoppingLists, newList]);

    setActiveShoppingListId(newList.id);

    resetFilters();
  }

  function renameShoppingList(id: string, name: string) {
    onChangeShoppingLists(
      shoppingLists.map((list) =>
        list.id === id
          ? {
              ...list,
              name,
            }
          : list,
      ),
    );
  }

  function reorderShoppingLists(reorderedLists: ShoppingList[]) {
    onChangeShoppingLists(reorderedLists);
  }

  function renameActiveList(name: string) {
    if (!activeList) return;

    updateList({
      ...activeList,
      name,
    });
  }

  function deleteShoppingList(id: string) {
    const list = shoppingLists.find(
      (currentList) => currentList.id === id,
    );

    if (!list) return;

    onChangeShoppingLists(
      shoppingLists.filter(
        (currentList) => currentList.id !== id,
      ),
    );

    if (activeShoppingListId === id) {
      setActiveShoppingListId("all");
    }
  }

  function addItem() {
    if (!activeList) return;

    const title = newItemTitle.trim();

    if (!title) return;

    const parsedCost = Number(newItemEstimatedCost);

    const newItem: ShoppingItem = {
      id: crypto.randomUUID(),
      title,

      quantity: newItemQuantity.trim() || undefined,

      shop: newItemShop.trim() || undefined,

      category: newItemCategory,

      intent: newItemIntent,

      estimatedCost:
        newItemEstimatedCost && Number.isFinite(parsedCost)
          ? Math.max(0, parsedCost)
          : undefined,

      plannedPurchaseDate: newItemPlannedDate || null,
      purchased: false,

      order: activeList.items.length + 1,

      createdAt: new Date().toISOString(),
    };

    updateList({
      ...activeList,
      items: [...activeList.items, newItem],
    });

    setNewItemTitle("");
    setNewItemQuantity("");
    setNewItemEstimatedCost("");
    setNewItemPlannedDate("");
  }

  function updateItem(
    listId: string,
    itemId: string,
    updates: Partial<ShoppingItem>,
  ) {
    const list = shoppingLists.find((currentList) => currentList.id === listId);

    if (!list) return;

    updateList({
      ...list,

      items: list.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              ...updates,
            }
          : item,
      ),
    });
  }

  function moveItem(
    sourceListId: string,
    itemId: string,
    destinationListId: string,
  ) {
    if (sourceListId === destinationListId) {
      return;
    }

    const sourceList = shoppingLists.find((list) => list.id === sourceListId);

    const destinationList = shoppingLists.find(
      (list) => list.id === destinationListId,
    );

    const item = sourceList?.items.find(
      (currentItem) => currentItem.id === itemId,
    );

    if (!sourceList || !destinationList || !item) {
      return;
    }

    const movedItem: ShoppingItem = {
      ...item,
      order: destinationList.items.length + 1,
    };

    onChangeShoppingLists(
      shoppingLists.map((list) => {
        if (list.id === sourceListId) {
          return {
            ...list,
            items: list.items.filter(
              (currentItem) => currentItem.id !== itemId,
            ),
          };
        }

        if (list.id === destinationListId) {
          return {
            ...list,
            items: [...list.items, movedItem],
          };
        }

        return list;
      }),
    );

    setSelectedItemRef(null);
  }

  function toggleItem(listId: string, itemId: string) {
    const list = shoppingLists.find((currentList) => currentList.id === listId);

    const item = list?.items.find((currentItem) => currentItem.id === itemId);

    if (!item) return;

    updateItem(listId, itemId, {
      purchased: !item.purchased,
    });
  }

  function deleteItem(
    listId: string,
    itemId: string,
  ) {
    const list = shoppingLists.find(
      (currentList) =>
        currentList.id === listId,
    );

    if (!list) {
      return;
    }

    updateList({
      ...list,

      items: list.items.filter(
        (currentItem) =>
          currentItem.id !== itemId,
      ),
    });
  }

  function resetFilters() {
    setShopFilter("all");
    setCategoryFilter("all");
    setStatusFilter("remaining");
    setIntentFilter("all");
  }

  function applyBulkPurchaseDate(date: string | null) {
    const chosen = new Set(selectedShoppingKeys);
    onChangeShoppingLists(shoppingLists.map((list) => ({
      ...list,
      items: list.items.map((item) => chosen.has(shoppingKey(list.id, item.id))
        ? { ...item, plannedPurchaseDate: date } : item),
    })));
    setSelectedShoppingKeys([]);
    setSelectingShopping(false);
    setBulkPurchaseDate("");
  }

  function renderItem(item: ShoppingItemWithList) {
    const itemIntent = item.intent ?? "need";

    const categoryLabel = categories.find(
      (category) => category.value === item.category,
    )?.label;

    return (
      <article
        key={`${item.listId}-${item.id}`}
        className={`rounded-2xl border px-4 py-3 transition ${
          item.purchased
            ? "border-emerald-100 bg-emerald-50/40"
            : "border-slate-200 bg-[var(--sortd-card)] hover:border-slate-300"
        }`}
      >
        <div className="flex items-center gap-3">
          {selectingShopping && <input type="checkbox"
            checked={selectedShoppingKeys.includes(shoppingKey(item.listId, item.id))}
            onChange={() => {
              const key = shoppingKey(item.listId, item.id);
              setSelectedShoppingKeys((current) => current.includes(key)
                ? current.filter((value) => value !== key) : [...current, key]);
            }}
            aria-label={`Select ${item.title}`} className="h-5 w-5 shrink-0" />}
          <input
            type="checkbox"
            disabled={selectingShopping}
            checked={item.purchased}
            onChange={() => { setActionItemRef({listId: item.listId, itemId: item.id}); setActionDate(item.plannedPurchaseDate ?? ""); }}
            aria-label={`Actions for ${item.title}`}
            className="h-5 w-5 shrink-0 accent-[var(--sortd-teal-dark)]"
          />

          <div className="min-w-0 flex-1">
            <p
              className={`truncate text-sm font-semibold ${
                item.purchased
                  ? "text-slate-400 line-through"
                  : "text-slate-900"
              }`}
            >
              {item.title || "Untitled item"}
            </p>

            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
              <span
                className={
                  itemIntent === "need" ? "text-emerald-700" : "text-purple-700"
                }
              >
                {itemIntent === "need" ? "Need" : "Want"}
              </span>

              {item.quantity && (
                <>
                  <span className="text-slate-300">·</span>
                  <span>{item.quantity}</span>
                </>
              )}

              {item.shop && (
                <>
                  <span className="text-slate-300">·</span>
                  <span>{item.shop}</span>
                </>
              )}

              {categoryLabel && (
                <>
                  <span className="text-slate-300">·</span>
                  <span>{categoryLabel}</span>
                </>
              )}

              {item.plannedPurchaseDate && <><span className="text-slate-300">·</span><span>Planned {item.plannedPurchaseDate}</span></>}
              {item.estimatedCost !== undefined && (
                <>
                  <span className="text-slate-300">·</span>
                  <span>{currencyFormatter.format(item.estimatedCost)}</span>
                </>
              )}

              {isAllView && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="text-slate-400">{item.listName}</span>
                </>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              setSelectedItemRef({
                listId: item.listId,
                itemId: item.id,
              })
            }
            aria-label={`Edit ${item.title}`}
            title="Item details"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            •••
          </button>
        </div>
      </article>
    );
  }

  return (
    <div className="w-full max-w-5xl min-w-0 rounded-3xl bg-[var(--sortd-surface)] p-4 shadow-sm sm:p-6 md:p-8">
      <datalist id="known-shopping-shops">
        {knownShops.map((shop) => (
          <option key={shop} value={shop} />
        ))}
      </datalist>

      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--sortd-text)]">Shopping</h1>
          <p className="mt-1 text-sm text-[var(--sortd-text-muted)]">Your purchases, priorities and plans.</p>
        </div>
        <button type="button" disabled={!shoppingLists.length} onClick={() => {
          if (isAllView) setActiveShoppingListId(shoppingLists[0]?.id ?? "all");
          setShoppingView("items");
        }} className="rounded-xl bg-[var(--sortd-navy)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40">+ Add item</button>
      </header>
      <nav aria-label="Shopping views" className="mt-6 flex w-full gap-1 overflow-x-auto rounded-xl bg-[var(--sortd-muted)] p-1 sm:w-fit">
        {([ ["overview", "Overview"], ["items", "All items"], ["planner", "Planner"], ["archive", "Bought items"] ] as const).map(([id, label]) => (
          <button key={id} type="button" onClick={() => { setShoppingView(id); setSelectingShopping(false); setSelectedShoppingKeys([]); }}
            aria-current={shoppingView === id ? "page" : undefined}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition ${shoppingView === id ? "bg-[var(--sortd-card)] text-[var(--sortd-navy)] shadow-sm" : "text-[var(--sortd-text-muted)] hover:text-[var(--sortd-text)]"}`}>
            {label}
          </button>
        ))}
      </nav>
      {shoppingView === "overview" && (
        <div className="mt-6 space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { label: "To buy", count: allShoppingItems.filter(i => !i.purchased && (i.intent ?? "need") === "need").length, action: "items" as const },
              { label: "Planned", count: allShoppingItems.filter(i => !i.purchased && Boolean(i.plannedPurchaseDate)).length, action: "planner" as const },
              { label: "Wishlist", count: allShoppingItems.filter(i => !i.purchased && i.intent === "want").length, action: "items" as const },
            ].map((stat) => <button key={stat.label} type="button" onClick={() => { setActiveShoppingListId("all"); resetFilters(); setIntentFilter(stat.label === "Wishlist" ? "want" : stat.label === "To buy" ? "need" : "all"); setShoppingView(stat.action); }} className="rounded-2xl border border-[var(--sortd-border)] bg-[var(--sortd-card)] p-4 text-left transition hover:border-[var(--sortd-teal-dark)]">
              <p className="text-xs text-[var(--sortd-text-muted)]">{stat.label}</p><p className="mt-2 text-2xl font-bold text-[var(--sortd-text)]">{stat.count}</p><p className="mt-1 text-xs text-[var(--sortd-teal-dark)]">View items →</p>
            </button>)}
          </div>
          <section className="rounded-2xl border border-[var(--sortd-border)] bg-[var(--sortd-card)] p-4 sm:p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-semibold">Your lists</h2>
              <button type="button" onClick={() => { setActiveShoppingListId("all"); setShoppingView("items"); }} className="text-sm font-medium text-[var(--sortd-teal-dark)]">Manage lists →</button>
            </div>
            {shoppingLists.length ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <select aria-label="Choose shopping list" value={activeShoppingListId} onChange={(event) => setActiveShoppingListId(event.target.value)} className="min-h-11 min-w-0 flex-1 rounded-xl border border-[var(--sortd-border)] bg-[var(--sortd-surface)] px-3 text-sm text-[var(--sortd-text)] outline-none focus:border-[var(--sortd-teal-dark)]">
                  <option value="all">All shopping lists ({shoppingLists.reduce((count, list) => count + list.items.filter(item => !item.purchased).length, 0)} items)</option>
                  {shoppingLists.map(list => <option key={list.id} value={list.id}>{list.name} ({list.items.filter(item => !item.purchased).length} items)</option>)}
                </select>
                <button type="button" onClick={() => { resetFilters(); setShoppingView("items"); }} className="min-h-11 rounded-xl bg-[var(--sortd-navy)] px-4 py-2 text-sm font-medium text-white">Open list →</button>
              </div>
            ) : <p className="text-sm text-[var(--sortd-text-muted)]">No lists yet. Open All items to create one.</p>}
          </section>
          <section className="rounded-2xl bg-[var(--sortd-surface)] p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Purchase overview</h2><span className="text-xs text-[var(--sortd-text-muted)]">Unpurchased items</span></div>
            <div className="grid gap-3 sm:grid-cols-2">{(["need", "want"] as const).map(intent => { const items = allShoppingItems.filter(i => !i.purchased && (i.intent ?? "need") === intent); return <button key={intent} type="button" onClick={() => { setActiveShoppingListId("all"); resetFilters(); setIntentFilter(intent); setShoppingView("items"); }} className="rounded-xl border border-[var(--sortd-border)] bg-[var(--sortd-card)] p-4 text-left"><p className="text-sm text-[var(--sortd-text-muted)]">{intent === "need" ? "Things I need" : "Wishlist"}</p><p className="mt-2 text-2xl font-bold">{currencyFormatter.format(items.reduce((sum,i) => sum + (i.estimatedCost ?? 0),0))}</p><p className="mt-1 text-xs text-[var(--sortd-teal-dark)]">{items.length} items →</p></button>; })}</div>
          </section>
          <section className="rounded-2xl border border-[var(--sortd-border)] bg-[var(--sortd-card)] p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3"><div><h2 className="font-semibold">Upcoming purchases</h2><p className="mt-1 text-xs text-[var(--sortd-text-muted)]">What you&apos;ve scheduled to buy</p></div><button type="button" onClick={() => setShoppingView("planner")} className="text-sm text-[var(--sortd-teal-dark)]">Open planner →</button></div>
            <div className="mt-3 space-y-2">{allShoppingItems.filter(i => !i.purchased && i.plannedPurchaseDate).sort((a,b) => (a.plannedPurchaseDate ?? "").localeCompare(b.plannedPurchaseDate ?? "")).slice(0,4).map(item => <button key={`${item.listId}:${item.id}`} type="button" onClick={() => setSelectedItemRef({listId:item.listId,itemId:item.id})} className="flex w-full items-center justify-between gap-3 rounded-lg bg-[var(--sortd-muted)] px-3 py-2 text-left text-sm"><span className="truncate">{item.title}</span><span className="shrink-0 text-xs text-[var(--sortd-text-muted)]">{item.plannedPurchaseDate}</span></button>)}{!allShoppingItems.some(i => !i.purchased && i.plannedPurchaseDate) && <p className="text-sm text-[var(--sortd-text-muted)]">No purchases scheduled yet.</p>}</div>
          </section>
        </div>
      )}
      {shoppingView === "items" && (
      <div className="mt-6">
        <CollectionSwitcher
          items={shoppingLists}
          activeItemId={
            isAllView ? (shoppingLists[0]?.id ?? "") : activeShoppingListId
          }
          label="Current shopping list"
          placeholder="Select a shopping list"
          itemPluralLabel="Shopping lists"
          createLabel="+ New"
          deleteLabel="Delete list"
          onChangeItem={(id) => {
            setActiveShoppingListId(id);
            resetFilters();
          }}
          onCreateItem={() => {
            const name = window.prompt("Name this shopping list");

            if (name) {
              createShoppingList(name);
            }
          }}
          onDeleteItem={() => {
            if (!activeList) return;

            setShoppingListToDeleteId(
              activeList.id,
            );
          }}
          onRenameItem={renameShoppingList}
          onReorderItems={reorderShoppingLists}
          getCount={(list) =>
            list.items.filter((item) => !item.purchased).length
          }
          getStatusColour={(list) =>
            list.archived ? "bg-slate-400" : "bg-emerald-400"
          }
          getStatusLabel={(list) => (list.archived ? "archived" : "active")}
          canDelete={shoppingLists.length > 0 && !isAllView}
        />

        <button
          type="button"
          onClick={() => {
            setActiveShoppingListId("all");
            resetFilters();
          }}
          className={`mt-2 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
            isAllView
              ? "bg-[var(--sortd-muted)] text-[var(--sortd-teal-dark)]"
              : "text-slate-500 hover:bg-[var(--sortd-muted)] hover:text-slate-800"
          }`}
        >
          View all lists
        </button>

      {shoppingLists.length === 0 ? (
        <div className="mt-8 rounded-2xl bg-[var(--sortd-muted)] px-6 py-12 text-center">
          <p className="font-medium text-slate-700">No shopping lists yet</p>

          <p className="mt-1 text-sm text-slate-500">
            Create one for groceries, household items or anything else you need.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <input aria-label="Search shopping items" value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder="Search items..." className="min-h-10 min-w-0 flex-1 rounded-xl border border-[var(--sortd-border)] bg-[var(--sortd-card)] px-3 text-sm outline-none focus:border-[var(--sortd-teal-dark)]" />
          </div>
          <div className="mt-3 grid gap-2 grid-cols-2 lg:grid-cols-4">
            <select
              value={shopFilter}
              onChange={(event) => setShopFilter(event.target.value)}
              className="min-w-0 rounded-xl border border-slate-200 bg-[var(--sortd-card)] px-3 py-2.5 text-sm"
            >
              <option value="all">All shops</option>

              {knownShops.map((shop) => (
                <option key={shop} value={shop}>
                  {shop}
                </option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(
                  event.target.value as ShoppingCategory | "all",
                )
              }
              className="min-w-0 rounded-xl border border-slate-200 bg-[var(--sortd-card)] px-3 py-2.5 text-sm"
            >
              <option value="all">All categories</option>

              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
              className="min-w-0 rounded-xl border border-slate-200 bg-[var(--sortd-card)] px-3 py-2.5 text-sm"
            >
              <option value="remaining">Remaining</option>

              <option value="bought">Bought</option>

              <option value="all">All items</option>
            </select>

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortOption)}
              className="min-w-0 rounded-xl border border-slate-200 bg-[var(--sortd-card)] px-3 py-2.5 text-sm"
            >
              <option value="name">Sort: Name</option>

              <option value="shop">Sort: Shop</option>

              <option value="category">Sort: Category</option>

              <option value="cost-high">Cost: High to low</option>

              <option value="cost-low">Cost: Low to high</option>
            </select>
          </div>

          {activeList && (
            <>
              <div className="mt-7">
                <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  List name
                </label>

                <input
                  value={activeList.name}
                  onChange={(event) => renameActiveList(event.target.value)}
                  className="mt-1 block w-full bg-transparent text-2xl font-bold text-slate-950 outline-none"
                />
              </div>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  addItem();
                }}
                className="mt-5 rounded-2xl border border-slate-200 bg-[var(--sortd-muted)] p-4"
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-700">
                    Add an item
                  </p>

                  <div className="flex rounded-lg bg-slate-200/60 p-1">
                    <button
                      type="button"
                      onClick={() => setNewItemIntent("need")}
                      className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                        newItemIntent === "need"
                          ? "bg-[var(--sortd-card)] text-emerald-700 shadow-sm"
                          : "text-slate-500"
                      }`}
                    >
                      Need
                    </button>

                    <button
                      type="button"
                      onClick={() => setNewItemIntent("want")}
                      className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                        newItemIntent === "want"
                          ? "bg-[var(--sortd-card)] text-purple-700 shadow-sm"
                          : "text-slate-500"
                      }`}
                    >
                      Want
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    value={newItemTitle}
                    onChange={(event) => setNewItemTitle(event.target.value)}
                    placeholder={
                      newItemIntent === "need"
                        ? "What do you need?"
                        : "What do you want?"
                    }
                    className="min-w-0 rounded-xl border border-slate-200 bg-[var(--sortd-card)] px-3 py-2.5 sm:col-span-2"
                  />

                  <input
                    value={newItemQuantity}
                    onChange={(event) => setNewItemQuantity(event.target.value)}
                    placeholder="Quantity"
                    className="min-w-0 rounded-xl border border-slate-200 bg-[var(--sortd-card)] px-3 py-2.5"
                  />

                  <input
                    value={newItemShop}
                    onChange={(event) => setNewItemShop(event.target.value)}
                    list="known-shopping-shops"
                    placeholder="Shop"
                    className="min-w-0 rounded-xl border border-slate-200 bg-[var(--sortd-card)] px-3 py-2.5"
                  />

                  <select
                    value={newItemCategory}
                    onChange={(event) =>
                      setNewItemCategory(event.target.value as ShoppingCategory)
                    }
                    className="min-w-0 rounded-xl border border-slate-200 bg-[var(--sortd-card)] px-3 py-2.5"
                  >
                    {categories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>

                  <label className="flex min-w-0 flex-col gap-1 text-xs text-slate-600 sm:col-span-2">
                    Planned purchase date (optional)
                    <input type="date" value={newItemPlannedDate}
                      onChange={(event) => setNewItemPlannedDate(event.target.value)}
                      className="min-h-11 rounded-xl border border-slate-200 bg-[var(--sortd-card)] px-3 text-sm" />
                  </label>
                  <div className="flex min-w-0">
                    <div className="flex min-w-0 flex-1 items-center rounded-l-xl border border-r-0 border-slate-200 bg-[var(--sortd-card)] px-3">
                      <span className="text-slate-400">£</span>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={newItemEstimatedCost}
                        onChange={(event) =>
                          setNewItemEstimatedCost(event.target.value)
                        }
                        placeholder="0.00"
                        className="min-w-0 w-full bg-transparent px-1 py-2.5 outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="shrink-0 rounded-r-xl bg-[var(--sortd-navy)] px-5 font-medium text-white"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </form>
            </>
          )}

          <section className="mt-7">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  {intentFilter === "need"
                    ? "Things I need"
                    : intentFilter === "want"
                      ? "Wishlist"
                      : isAllView
                        ? "All shopping"
                        : activeList?.name}
                </h2>

                {intentFilter !== "all" && (
                  <button
                    type="button"
                    onClick={() => setIntentFilter("all")}
                    className="mt-1 text-xs text-[var(--sortd-teal-dark)]"
                  >
                    Show all items
                  </button>
                )}
              </div>

              <span className="text-sm text-slate-400">
                {filteredItems.length} shown
              </span>
            </div>

            <div className="space-y-3">
              {filteredItems.length > 0 ? (
                filteredItems.map(renderItem)
              ) : (
                <p className="rounded-2xl bg-[var(--sortd-muted)] px-4 py-8 text-center text-sm text-slate-500">
                  No items match these filters.
                </p>
              )}
            </div>
          </section>
        </>
      )}
      </div>
      )}
      {shoppingView === "planner" && (
        <div className="mt-6 space-y-4">
          <div><h2 className="text-lg font-semibold">Purchase planner</h2><p className="text-sm text-[var(--sortd-text-muted)]">Schedule purchases together or review what&apos;s coming up.</p></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {([ ["Overdue", (i: ShoppingItemWithList) => Boolean(i.plannedPurchaseDate && i.plannedPurchaseDate < localDate())], ["This week", (i: ShoppingItemWithList) => Boolean(i.plannedPurchaseDate && i.plannedPurchaseDate >= localDate() && i.plannedPurchaseDate <= localDate(7))], ["Later", (i: ShoppingItemWithList) => Boolean(i.plannedPurchaseDate && i.plannedPurchaseDate > localDate(7))], ["Unscheduled", (i: ShoppingItemWithList) => !i.plannedPurchaseDate] ] as const).map(([label, test]) => <div key={label} className="rounded-xl border border-[var(--sortd-border)] bg-[var(--sortd-card)] p-4"><p className="text-sm text-[var(--sortd-text-muted)]">{label}</p><p className="mt-2 text-2xl font-bold">{allShoppingItems.filter(i => !i.purchased && test(i)).length}</p></div>)}
          </div>
          <section className="mt-6 rounded-2xl border border-[var(--sortd-border)] bg-[var(--sortd-card)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><h2 className="text-sm font-semibold text-slate-900">Plan purchases</h2>
                <p className="text-xs text-slate-500">Select multiple items to schedule them together.</p></div>
              <button type="button" onClick={() => { setSelectingShopping((value) => !value); setSelectedShoppingKeys([]); }}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                {selectingShopping ? "Cancel selection" : "Select items"}
              </button>
            </div>
            {selectingShopping && <div className="mt-4 space-y-3">
              <p className="text-sm">{selectedShoppingKeys.length} selected</p>
              <div className="flex flex-wrap gap-3 text-sm">
                <button type="button" onClick={() => setSelectedShoppingKeys((shoppingView === "planner" ? allShoppingItems.filter(i => !i.purchased) : filteredItems).map((item) => shoppingKey(item.listId, item.id)))} className="text-[var(--sortd-teal-dark)]">Select all shown</button>
                <button type="button" onClick={() => setSelectedShoppingKeys([])}>Clear selection</button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input type="date" value={bulkPurchaseDate} onChange={(event) => setBulkPurchaseDate(event.target.value)}
                  className="min-h-11 min-w-0 rounded-lg border border-slate-200 px-3 text-sm" />
                <button type="button" onClick={() => setBulkPurchaseDate(localDate())} className="rounded-lg border px-3 py-2 text-sm">Today</button>
                <button type="button" onClick={() => setBulkPurchaseDate(localDate(1))} className="rounded-lg border px-3 py-2 text-sm">Tomorrow</button>
                <button type="button" onClick={() => setBulkPurchaseDate(localDate(7))} className="rounded-lg border px-3 py-2 text-sm">In 7 days</button>
                <button type="button" disabled={!bulkPurchaseDate || !selectedShoppingKeys.length}
                  onClick={() => applyBulkPurchaseDate(bulkPurchaseDate)} className="rounded-lg bg-[var(--sortd-teal-dark)] px-4 py-2 text-sm text-white disabled:opacity-40">Apply date</button>
                <button type="button" disabled={!selectedShoppingKeys.length} onClick={() => applyBulkPurchaseDate(null)}
                  className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40">Remove dates</button>
              </div>
            </div>}
          </section>


          <div className="space-y-5">
            {Object.entries(
              allShoppingItems
                .filter((item) => !item.purchased)
                .reduce<Record<string, ShoppingItemWithList[]>>((groups, item) => {
                  const date = item.plannedPurchaseDate || "unscheduled";
                  (groups[date] ??= []).push(item);
                  return groups;
                }, {}),
            )
              .sort(([a], [b]) =>
                a === "unscheduled" ? 1 : b === "unscheduled" ? -1 : a.localeCompare(b),
              )
              .map(([date, items]) => {
                const total = items.reduce((sum, item) => sum + (item.estimatedCost ?? 0), 0);
                const heading = date === "unscheduled"
                  ? "Unscheduled"
                  : new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", {
                      weekday: "long", day: "numeric", month: "long", year: "numeric",
                    });
                return (
                  <section key={date} className="rounded-2xl border border-[var(--sortd-border)] bg-[var(--sortd-surface)] p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-semibold text-[var(--sortd-text)]">{heading}</h3>
                      <span className="text-xs text-[var(--sortd-text-muted)]">
                        {items.length} {items.length === 1 ? "item" : "items"} · {currencyFormatter.format(total)}
                      </span>
                    </div>
                    <div className="space-y-2">{items.map(renderItem)}</div>
                  </section>
                );
              })}
            {!allShoppingItems.some((item) => !item.purchased) && (
              <p className="rounded-xl bg-[var(--sortd-muted)] p-5 text-sm text-[var(--sortd-text-muted)]">
                No outstanding purchases.
              </p>
            )}
          </div>
        </div>
      )}

      {shoppingView === "archive" && (
        <section className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="text-lg font-semibold">Bought items</h2><p className="text-sm text-[var(--sortd-text-muted)]">Previously purchased items, kept for reference. Restore or delete them whenever you like.</p></div>
            <span className="rounded-full bg-[var(--sortd-muted)] px-3 py-1 text-xs">{allShoppingItems.filter(item => item.purchased).length} archived</span>
          </div>
          {allShoppingItems.filter(item => item.purchased).length ? (
            <div className="space-y-2">{allShoppingItems.filter(item => item.purchased).map(renderItem)}</div>
          ) : <p className="rounded-xl bg-[var(--sortd-muted)] p-5 text-sm text-[var(--sortd-text-muted)]">No bought items yet. Items marked as bought will appear here.</p>}
        </section>
      )}

      {actionItemRef && (() => {
        const actionItem = allShoppingItems.find(item => item.listId === actionItemRef.listId && item.id === actionItemRef.itemId);
        if (!actionItem) return null;
        const closeActions = () => setActionItemRef(null);
        return (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/40 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) closeActions(); }}>
            <section role="dialog" aria-modal="true" aria-label={`Actions for ${actionItem.title}`} className="w-full max-w-md space-y-4 rounded-2xl border border-[var(--sortd-border)] bg-[var(--sortd-card)] p-5 shadow-xl">
              <div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-semibold">{actionItem.title}</h2><p className="text-sm text-[var(--sortd-text-muted)]">{actionItem.purchased ? "This item is in your bought archive." : "What would you like to do with this item?"}</p></div><button type="button" onClick={closeActions} aria-label="Close actions" className="rounded-lg px-2 py-1 text-lg">×</button></div>
              <button type="button" onClick={() => { toggleItem(actionItem.listId, actionItem.id); closeActions(); }} className="w-full rounded-xl bg-[var(--sortd-navy)] px-4 py-3 text-left text-sm font-medium text-white">{actionItem.purchased ? "Restore to shopping" : "Mark as bought (archive)"}</button>
              <div className="space-y-2"><label htmlFor="action-purchase-date" className="block text-sm font-medium">{actionItem.purchased ? "Schedule again" : "Schedule purchase"}</label><div className="flex flex-wrap gap-2"><input id="action-purchase-date" type="date" value={actionDate} onChange={event => setActionDate(event.target.value)} className="min-h-11 min-w-0 flex-1 rounded-xl border border-[var(--sortd-border)] bg-[var(--sortd-surface)] px-3 text-sm"/><button type="button" disabled={!actionDate} onClick={() => { updateItem(actionItem.listId, actionItem.id, {plannedPurchaseDate: actionDate, purchased: false}); closeActions(); }} className="rounded-xl bg-[var(--sortd-teal-dark)] px-4 py-2 text-sm font-medium text-white disabled:opacity-40">Schedule</button></div></div>
              <button type="button" onClick={() => { setShoppingItemToDelete({listId: actionItem.listId, itemId: actionItem.id}); closeActions(); }} className="w-full rounded-xl border border-red-200 px-4 py-2.5 text-left text-sm font-medium text-red-700">Delete item…</button>
            </section>
          </div>
        );
      })()}

      {selectedItem && (
        <ShoppingItemModal
          item={selectedItem}
          shoppingLists={shoppingLists}
          categories={categories}
          onChange={(updates) =>
            updateItem(selectedItem.listId, selectedItem.id, updates)
          }
          onMove={(destinationListId) =>
            moveItem(selectedItem.listId, selectedItem.id, destinationListId)
          }
          onClose={() => {
            setSelectedItemRef(null);
          }}
          onDelete={() => {
            setShoppingItemToDelete({
              listId: selectedItem.listId,
              itemId: selectedItem.id,
            });
          }}
        />
      )}
      <ConfirmDialog
  open={Boolean(
    shoppingListToDeleteId,
  )}
  title="Delete shopping list?"
  description={(() => {
    const list = shoppingLists.find(
      (item) =>
        item.id ===
        shoppingListToDeleteId,
    );

    if (!list) {
      return "Delete this shopping list? This can't be undone.";
    }

    return `Delete “${list.name}” and all of its items? This can't be undone.`;
  })()}
  confirmLabel="Delete list"
  onCancel={() => {
    setShoppingListToDeleteId(
      null,
    );
  }}
  onConfirm={() => {
    if (!shoppingListToDeleteId) {
      return;
    }

    deleteShoppingList(
      shoppingListToDeleteId,
    );

    setShoppingListToDeleteId(
      null,
    );
  }}
/>

<ConfirmDialog
    open={Boolean(
      shoppingItemToDelete,
    )}
    title="Remove shopping item?"
    description={(() => {
      if (!shoppingItemToDelete) {
        return undefined;
      }

      const list =
        shoppingLists.find(
          (item) =>
            item.id ===
            shoppingItemToDelete.listId,
        );

      const item =
        list?.items.find(
          (item) =>
            item.id ===
            shoppingItemToDelete.itemId,
        );

      return item
        ? `Remove “${item.title}” from this shopping list?`
        : "Remove this shopping item?";
    })()}
    confirmLabel="Remove item"
    onCancel={() => {
      setShoppingItemToDelete(null);
    }}
    onConfirm={() => {
      if (!shoppingItemToDelete) {
        return;
      }

      deleteItem(
        shoppingItemToDelete.listId,
        shoppingItemToDelete.itemId,
      );

      setShoppingItemToDelete(null);
      setSelectedItemRef(null);
    }}
  />
    </div>
  );
}

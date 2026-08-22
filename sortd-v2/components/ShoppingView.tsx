"use client";

import { useState } from "react";

import {
  ShoppingCategory,
  ShoppingIntent,
  ShoppingItem,
  ShoppingList,
} from "@/lib/types";

type ShoppingViewProps = {
  shoppingLists: ShoppingList[];
  onChangeShoppingLists: (
    shoppingLists: ShoppingList[]
  ) => void;
};

type ShoppingItemWithList = ShoppingItem & {
  listId: string;
  listName: string;
};

type SortOption =
  | "name"
  | "shop"
  | "category"
  | "cost-high"
  | "cost-low";

type StatusFilter =
  | "remaining"
  | "bought"
  | "all";

type IntentFilter =
  | "all"
  | "need"
  | "want";

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

const currencyFormatter =
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  });

export default function ShoppingView({
  shoppingLists,
  onChangeShoppingLists,
}: ShoppingViewProps) {
  const [
    activeShoppingListId,
    setActiveShoppingListId,
  ] = useState<string>("all");

  const [shopFilter, setShopFilter] =
    useState("all");

  const [
    categoryFilter,
    setCategoryFilter,
  ] = useState<
    ShoppingCategory | "all"
  >("all");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<StatusFilter>("remaining");

  const [
    intentFilter,
    setIntentFilter,
  ] =
    useState<IntentFilter>("all");

  const [sortBy, setSortBy] =
    useState<SortOption>("name");

  const [
    newListName,
    setNewListName,
  ] = useState("");

  const [
    newItemTitle,
    setNewItemTitle,
  ] = useState("");

  const [
    newItemQuantity,
    setNewItemQuantity,
  ] = useState("");

  const [
    newItemShop,
    setNewItemShop,
  ] = useState("");

  const [
    newItemCategory,
    setNewItemCategory,
  ] =
    useState<ShoppingCategory>("food");

  const [
    newItemIntent,
    setNewItemIntent,
  ] =
    useState<ShoppingIntent>("need");

  const [
    newItemEstimatedCost,
    setNewItemEstimatedCost,
  ] = useState("");

  const isAllView =
    activeShoppingListId === "all";

  const activeList = isAllView
    ? undefined
    : shoppingLists.find(
        (list) =>
          list.id ===
          activeShoppingListId
      );

  const knownShops = Array.from(
    new Set(
      shoppingLists.flatMap((list) =>
        list.items
          .map((item) =>
            item.shop?.trim()
          )
          .filter(
            (
              shop
            ): shop is string =>
              Boolean(shop)
          )
      )
    )
  ).sort();

  const allShoppingItems:
    ShoppingItemWithList[] =
    shoppingLists.flatMap((list) =>
      list.items.map((item) => ({
        ...item,
        listId: list.id,
        listName: list.name,
      }))
    );

  const sourceItems = isAllView
    ? allShoppingItems
    : allShoppingItems.filter(
        (item) =>
          item.listId ===
          activeShoppingListId
      );

  const dashboardItems =
    sourceItems.filter((item) => {
      if (
        statusFilter ===
          "remaining" &&
        item.purchased
      ) {
        return false;
      }

      if (
        statusFilter === "bought" &&
        !item.purchased
      ) {
        return false;
      }

      if (
        shopFilter !== "all" &&
        item.shop !== shopFilter
      ) {
        return false;
      }

      if (
        categoryFilter !==
          "all" &&
        item.category !==
          categoryFilter
      ) {
        return false;
      }

      return true;
    });

  const filteredItems =
    dashboardItems
      .filter((item) => {
        if (
          intentFilter !== "all" &&
          (item.intent ??
            "need") !==
            intentFilter
        ) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "shop":
            return (
              a.shop ?? ""
            ).localeCompare(
              b.shop ?? ""
            );

          case "category":
            return a.category.localeCompare(
              b.category
            );

          case "cost-high":
            return (
              (b.estimatedCost ??
                0) -
              (a.estimatedCost ??
                0)
            );

          case "cost-low":
            return (
              (a.estimatedCost ??
                0) -
              (b.estimatedCost ??
                0)
            );

          case "name":
          default:
            return a.title.localeCompare(
              b.title
            );
        }
      });

  const needItems =
    dashboardItems.filter(
      (item) =>
        (item.intent ??
          "need") === "need"
    );

  const wantItems =
    dashboardItems.filter(
      (item) =>
        item.intent === "want"
    );

  const needTotal =
    needItems.reduce(
      (total, item) =>
        total +
        (item.estimatedCost ??
          0),
      0
    );

  const wantTotal =
    wantItems.reduce(
      (total, item) =>
        total +
        (item.estimatedCost ??
          0),
      0
    );

  const grandTotal =
    dashboardItems.reduce(
      (total, item) =>
        total +
        (item.estimatedCost ??
          0),
      0
    );

  const shopSummary =
    Object.entries(
      dashboardItems.reduce<
        Record<
          string,
          {
            count: number;
            total: number;
          }
        >
      >((summary, item) => {
        const shop =
          item.shop?.trim() ||
          "No shop";

        if (!summary[shop]) {
          summary[shop] = {
            count: 0,
            total: 0,
          };
        }

        summary[shop].count +=
          1;

        summary[shop].total +=
          item.estimatedCost ??
          0;

        return summary;
      }, {})
    ).sort(
      ([, first], [, second]) =>
        second.total -
        first.total
    );

  function updateList(
    updatedList: ShoppingList
  ) {
    onChangeShoppingLists(
      shoppingLists.map((list) =>
        list.id ===
        updatedList.id
          ? updatedList
          : list
      )
    );
  }

  function createShoppingList() {
    const name =
      newListName.trim();

    if (!name) return;

    const newList: ShoppingList =
      {
        id: crypto.randomUUID(),
        name,
        items: [],
        createdAt:
          new Date().toISOString(),
        archived: false,
      };

    onChangeShoppingLists([
      ...shoppingLists,
      newList,
    ]);

    setActiveShoppingListId(
      newList.id
    );

    setNewListName("");
  }

  function renameActiveList(
    name: string
  ) {
    if (!activeList) return;

    updateList({
      ...activeList,
      name,
    });
  }

  function deleteActiveList() {
    if (!activeList) return;

    const confirmed =
      window.confirm(
        `Delete the shopping list "${activeList.name}" and all of its items?`
      );

    if (!confirmed) return;

    onChangeShoppingLists(
      shoppingLists.filter(
        (list) =>
          list.id !==
          activeList.id
      )
    );

    setActiveShoppingListId(
      "all"
    );
  }

  function addItem() {
    if (!activeList) return;

    const title =
      newItemTitle.trim();

    if (!title) return;

    const parsedCost =
      Number(
        newItemEstimatedCost
      );

    const newItem: ShoppingItem =
      {
        id: crypto.randomUUID(),
        title,

        quantity:
          newItemQuantity.trim() ||
          undefined,

        shop:
          newItemShop.trim() ||
          undefined,

        category:
          newItemCategory,

        intent:
          newItemIntent,

        estimatedCost:
          newItemEstimatedCost &&
          Number.isFinite(
            parsedCost
          )
            ? Math.max(
                0,
                parsedCost
              )
            : undefined,

        purchased: false,

        order:
          activeList.items
            .length + 1,

        createdAt:
          new Date().toISOString(),
      };

    updateList({
      ...activeList,
      items: [
        ...activeList.items,
        newItem,
      ],
    });

    setNewItemTitle("");
    setNewItemQuantity("");
    setNewItemEstimatedCost("");
  }

  function updateItem(
    listId: string,
    itemId: string,
    updates: Partial<ShoppingItem>
  ) {
    const list =
      shoppingLists.find(
        (currentList) =>
          currentList.id ===
          listId
      );

    if (!list) return;

    updateList({
      ...list,

      items: list.items.map(
        (item) =>
          item.id === itemId
            ? {
                ...item,
                ...updates,
              }
            : item
      ),
    });
  }

  function toggleItem(
    listId: string,
    itemId: string
  ) {
    const list =
      shoppingLists.find(
        (currentList) =>
          currentList.id ===
          listId
      );

    const item =
      list?.items.find(
        (currentItem) =>
          currentItem.id ===
          itemId
      );

    if (!item) return;

    updateItem(
      listId,
      itemId,
      {
        purchased:
          !item.purchased,
      }
    );
  }

  function deleteItem(
    listId: string,
    itemId: string
  ) {
    const list =
      shoppingLists.find(
        (currentList) =>
          currentList.id ===
          listId
      );

    const item =
      list?.items.find(
        (currentItem) =>
          currentItem.id ===
          itemId
      );

    if (!list || !item) {
      return;
    }

    const confirmed =
      window.confirm(
        `Remove "${item.title}" from this shopping list?`
      );

    if (!confirmed) return;

    updateList({
      ...list,

      items:
        list.items.filter(
          (currentItem) =>
            currentItem.id !==
            itemId
        ),
    });
  }

  function resetFilters() {
    setShopFilter("all");
    setCategoryFilter("all");
    setStatusFilter(
      "remaining"
    );
    setIntentFilter("all");
  }

  function renderItem(
    item: ShoppingItemWithList
  ) {
    const itemIntent =
      item.intent ?? "need";

    return (
      <article
        key={`${item.listId}-${item.id}`}
        className={`rounded-2xl border px-4 py-4 transition ${
          item.purchased
            ? "border-emerald-100 bg-emerald-50/40"
            : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
        }`}
      >
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={
              item.purchased
            }
            onChange={() =>
              toggleItem(
                item.listId,
                item.id
              )
            }
            aria-label={`Mark ${item.title} as bought`}
            className="mt-1 h-5 w-5 shrink-0 accent-[#cd6ce7]"
          />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start gap-3">
              <div className="min-w-[180px] flex-1">
                <input
                  value={
                    item.title
                  }
                  onChange={(
                    event
                  ) =>
                    updateItem(
                      item.listId,
                      item.id,
                      {
                        title:
                          event
                            .target
                            .value,
                      }
                    )
                  }
                  className={`w-full bg-transparent text-base font-semibold outline-none ${
                    item.purchased
                      ? "text-slate-400 line-through"
                      : "text-slate-900"
                  }`}
                />

                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {isAllView && (
                    <span className="text-xs text-slate-400">
                      {
                        item.listName
                      }
                    </span>
                  )}

                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                    {
                      categories.find(
                        (
                          category
                        ) =>
                          category.value ===
                          item.category
                      )?.label
                    }
                  </span>
                </div>
              </div>

              <div className="flex rounded-lg bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() =>
                    updateItem(
                      item.listId,
                      item.id,
                      {
                        intent:
                          "need",
                      }
                    )
                  }
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                    itemIntent ===
                    "need"
                      ? "bg-white text-emerald-700 shadow-sm"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Need
                </button>

                <button
                  type="button"
                  onClick={() =>
                    updateItem(
                      item.listId,
                      item.id,
                      {
                        intent:
                          "want",
                      }
                    )
                  }
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                    itemIntent ===
                    "want"
                      ? "bg-white text-purple-700 shadow-sm"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Want
                </button>
              </div>

              <button
                type="button"
                onClick={() =>
                  deleteItem(
                    item.listId,
                    item.id
                  )
                }
                aria-label={`Delete ${item.title}`}
                title="Delete item"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
              >
                ×
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-[110px_minmax(160px,1fr)_150px_140px]">
              <label className="flex flex-col gap-1 text-xs text-slate-400">
                Quantity

                <input
                  value={
                    item.quantity ??
                    ""
                  }
                  onChange={(
                    event
                  ) =>
                    updateItem(
                      item.listId,
                      item.id,
                      {
                        quantity:
                          event
                            .target
                            .value ||
                          undefined,
                      }
                    )
                  }
                  placeholder="—"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 outline-none focus:bg-white"
                />
              </label>

              <label className="flex flex-col gap-1 text-xs text-slate-400">
                Shop

                <input
                  value={
                    item.shop ?? ""
                  }
                  onChange={(
                    event
                  ) =>
                    updateItem(
                      item.listId,
                      item.id,
                      {
                        shop:
                          event
                            .target
                            .value ||
                          undefined,
                      }
                    )
                  }
                  list="known-shopping-shops"
                  placeholder="No shop"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 outline-none focus:bg-white"
                />
              </label>

              <label className="flex flex-col gap-1 text-xs text-slate-400">
                Category

                <select
                  value={
                    item.category
                  }
                  onChange={(
                    event
                  ) =>
                    updateItem(
                      item.listId,
                      item.id,
                      {
                        category:
                          event
                            .target
                            .value as ShoppingCategory,
                      }
                    )
                  }
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 outline-none focus:bg-white"
                >
                  {categories.map(
                    (
                      category
                    ) => (
                      <option
                        key={
                          category.value
                        }
                        value={
                          category.value
                        }
                      >
                        {
                          category.label
                        }
                      </option>
                    )
                  )}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-xs text-slate-400">
                Estimated cost

                <div className="flex min-w-0 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 focus-within:bg-white">
                  <span>
                    £
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      item.estimatedCost ??
                      ""
                    }
                    onChange={(
                      event
                    ) => {
                      const value =
                        event
                          .target
                          .value;

                      updateItem(
                        item.listId,
                        item.id,
                        {
                          estimatedCost:
                            value
                              ? Math.max(
                                  0,
                                  Number(
                                    value
                                  )
                                )
                              : undefined,
                        }
                      );
                    }}
                    placeholder="0.00"
                    className="w-full bg-transparent px-1 py-1.5 text-sm text-slate-700 outline-none"
                  />
                </div>
              </label>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <div className="w-full max-w-5xl rounded-3xl bg-white/85 p-5 shadow-xl backdrop-blur-md md:p-8">
      <datalist id="known-shopping-shops">
        {knownShops.map(
          (shop) => (
            <option
              key={shop}
              value={shop}
            />
          )
        )}
      </datalist>

      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#9d3db7]">
          Shopping
        </p>

        <h1 className="mt-1 text-3xl font-bold text-slate-950">
          Shopping lists
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Keep track of what you
          need now and what can wait
          on the wishlist.
        </p>
      </header>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          createShoppingList();
        }}
        className="mt-6 flex flex-col gap-2 sm:flex-row"
      >
        <input
          value={newListName}
          onChange={(event) =>
            setNewListName(
              event.target.value
            )
          }
          placeholder="New list, e.g. Weekly food shop"
          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 outline-none focus:border-[#cd6ce7]"
        />

        <button
          type="submit"
          className="rounded-xl bg-[#230028] px-5 py-2.5 font-medium text-white"
        >
          Add list
        </button>
      </form>

      {shoppingLists.length >
        0 && (
        <div className="mt-5 flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Shopping list
            </label>

            <select
              value={
                activeShoppingListId
              }
              onChange={(
                event
              ) => {
                setActiveShoppingListId(
                  event.target
                    .value
                );

                resetFilters();
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#cd6ce7]"
            >
              <option value="all">
                All lists
              </option>

              {shoppingLists.map(
                (list) => {
                  const remaining =
                    list.items.filter(
                      (
                        item
                      ) =>
                        !item.purchased
                    ).length;

                  return (
                    <option
                      key={
                        list.id
                      }
                      value={
                        list.id
                      }
                    >
                      {
                        list.name
                      }{" "}
                      ·{" "}
                      {
                        remaining
                      }{" "}
                      remaining
                    </option>
                  );
                }
              )}
            </select>
          </div>

          {activeList && (
            <button
              type="button"
              onClick={
                deleteActiveList
              }
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              Delete list
            </button>
          )}
        </div>
      )}

      {shoppingLists.length ===
      0 ? (
        <div className="mt-8 rounded-2xl bg-slate-50 px-6 py-12 text-center">
          <p className="font-medium text-slate-700">
            No shopping lists
            yet
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Create one for
            groceries, household
            items or anything else
            you need.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <select
              value={
                shopFilter
              }
              onChange={(
                event
              ) =>
                setShopFilter(
                  event.target
                    .value
                )
              }
              className="min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
            >
              <option value="all">
                All shops
              </option>

              {knownShops.map(
                (shop) => (
                  <option
                    key={
                      shop
                    }
                    value={
                      shop
                    }
                  >
                    {
                      shop
                    }
                  </option>
                )
              )}
            </select>

            <select
              value={
                categoryFilter
              }
              onChange={(
                event
              ) =>
                setCategoryFilter(
                  event
                    .target
                    .value as
                    | ShoppingCategory
                    | "all"
                )
              }
              className="min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
            >
              <option value="all">
                All categories
              </option>

              {categories.map(
                (
                  category
                ) => (
                  <option
                    key={
                      category.value
                    }
                    value={
                      category.value
                    }
                  >
                    {
                      category.label
                    }
                  </option>
                )
              )}
            </select>

            <select
              value={
                statusFilter
              }
              onChange={(
                event
              ) =>
                setStatusFilter(
                  event
                    .target
                    .value as StatusFilter
                )
              }
              className="min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
            >
              <option value="remaining">
                Remaining
              </option>

              <option value="bought">
                Bought
              </option>

              <option value="all">
                All items
              </option>
            </select>

            <select
              value={sortBy}
              onChange={(
                event
              ) =>
                setSortBy(
                  event
                    .target
                    .value as SortOption
                )
              }
              className="min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
            >
              <option value="name">
                Sort: Name
              </option>

              <option value="shop">
                Sort: Shop
              </option>

              <option value="category">
                Sort: Category
              </option>

              <option value="cost-high">
                Cost: High to low
              </option>

              <option value="cost-low">
                Cost: Low to high
              </option>
            </select>
          </div>

          <section className="mt-5 rounded-3xl bg-[#f7f3f7] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9d3db7]">
                  Overview
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {
                    dashboardItems.length
                  }{" "}
                  items
                  {isAllView
                    ? ` across ${shoppingLists.length} lists`
                    : ""}
                </p>
              </div>

              {(shopFilter !==
                "all" ||
                categoryFilter !==
                  "all" ||
                intentFilter !==
                  "all") && (
                <button
                  type="button"
                  onClick={
                    resetFilters
                  }
                  className="text-sm text-[#9d3db7] hover:text-[#74258a]"
                >
                  Clear filters
                </button>
              )}
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <button
                type="button"
                onClick={() =>
                  setIntentFilter(
                    "need"
                  )
                }
                className={`rounded-2xl border p-5 text-left transition ${
                  intentFilter ===
                  "need"
                    ? "border-emerald-300 bg-emerald-50"
                    : "border-transparent bg-white hover:border-emerald-200"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-700">
                    Things I need
                  </p>

                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                    {
                      needItems.length
                    }{" "}
                    items
                  </span>
                </div>

                <p className="mt-4 text-2xl font-bold text-slate-950">
                  {currencyFormatter.format(
                    needTotal
                  )}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Click to view
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  setIntentFilter(
                    "want"
                  )
                }
                className={`rounded-2xl border p-5 text-left transition ${
                  intentFilter ===
                  "want"
                    ? "border-purple-300 bg-purple-50"
                    : "border-transparent bg-white hover:border-purple-200"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-700">
                    Wishlist
                  </p>

                  <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700">
                    {
                      wantItems.length
                    }{" "}
                    items
                  </span>
                </div>

                <p className="mt-4 text-2xl font-bold text-slate-950">
                  {currencyFormatter.format(
                    wantTotal
                  )}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Click to view
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  setIntentFilter(
                    "all"
                  )
                }
                className={`rounded-2xl border p-5 text-left transition ${
                  intentFilter ===
                  "all"
                    ? "border-[#cd6ce7] bg-white"
                    : "border-transparent bg-white hover:border-[#e4b8ee]"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-700">
                    Everything
                  </p>

                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                    {
                      dashboardItems.length
                    }{" "}
                    items
                  </span>
                </div>

                <p className="mt-4 text-2xl font-bold text-slate-950">
                  {currencyFormatter.format(
                    grandTotal
                  )}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Click to show all
                </p>
              </button>
            </div>

            {shopSummary.length >
              0 && (
              <div className="mt-6">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  By shop
                </p>

                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {shopSummary.map(
                    ([
                      shop,
                      summary,
                    ]) => (
                      <button
                        key={
                          shop
                        }
                        type="button"
                        onClick={() =>
                          setShopFilter(
                            shop
                          )
                        }
                        className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-3 text-left transition ${
                          shopFilter ===
                          shop
                            ? "border-[#cd6ce7] bg-purple-50"
                            : "border-transparent bg-white hover:border-slate-200"
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-700">
                            {
                              shop
                            }
                          </p>

                          <p className="text-xs text-slate-400">
                            {
                              summary.count
                            }{" "}
                            {summary.count ===
                            1
                              ? "item"
                              : "items"}
                          </p>
                        </div>

                        <span className="shrink-0 text-sm font-semibold text-slate-900">
                          {currencyFormatter.format(
                            summary.total
                          )}
                        </span>
                      </button>
                    )
                  )}
                </div>
              </div>
            )}
          </section>

          {activeList && (
            <>
              <div className="mt-7">
                <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  List name
                </label>

                <input
                  value={
                    activeList.name
                  }
                  onChange={(
                    event
                  ) =>
                    renameActiveList(
                      event
                        .target
                        .value
                    )
                  }
                  className="mt-1 block w-full bg-transparent text-2xl font-bold text-slate-950 outline-none"
                />
              </div>

              <form
                onSubmit={(
                  event
                ) => {
                  event.preventDefault();
                  addItem();
                }}
                className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-700">
                    Add an item
                  </p>

                  <div className="flex rounded-lg bg-slate-200/60 p-1">
                    <button
                      type="button"
                      onClick={() =>
                        setNewItemIntent(
                          "need"
                        )
                      }
                      className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                        newItemIntent ===
                        "need"
                          ? "bg-white text-emerald-700 shadow-sm"
                          : "text-slate-500"
                      }`}
                    >
                      Need
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setNewItemIntent(
                          "want"
                        )
                      }
                      className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                        newItemIntent ===
                        "want"
                          ? "bg-white text-purple-700 shadow-sm"
                          : "text-slate-500"
                      }`}
                    >
                      Want
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    value={
                      newItemTitle
                    }
                    onChange={(
                      event
                    ) =>
                      setNewItemTitle(
                        event
                          .target
                          .value
                      )
                    }
                    placeholder={
                      newItemIntent ===
                      "need"
                        ? "What do you need?"
                        : "What do you want?"
                    }
                    className="min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 sm:col-span-2"
                  />

                  <input
                    value={
                      newItemQuantity
                    }
                    onChange={(
                      event
                    ) =>
                      setNewItemQuantity(
                        event
                          .target
                          .value
                      )
                    }
                    placeholder="Quantity"
                    className="min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5"
                  />

                  <input
                    value={
                      newItemShop
                    }
                    onChange={(
                      event
                    ) =>
                      setNewItemShop(
                        event
                          .target
                          .value
                      )
                    }
                    list="known-shopping-shops"
                    placeholder="Shop"
                    className="min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5"
                  />

                  <select
                    value={
                      newItemCategory
                    }
                    onChange={(
                      event
                    ) =>
                      setNewItemCategory(
                        event
                          .target
                          .value as ShoppingCategory
                      )
                    }
                    className="min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5"
                  >
                    {categories.map(
                      (
                        category
                      ) => (
                        <option
                          key={
                            category.value
                          }
                          value={
                            category.value
                          }
                        >
                          {
                            category.label
                          }
                        </option>
                      )
                    )}
                  </select>

                  <div className="flex min-w-0">
                    <div className="flex min-w-0 flex-1 items-center rounded-l-xl border border-r-0 border-slate-200 bg-white px-3">
                      <span className="text-slate-400">
                        £
                      </span>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          newItemEstimatedCost
                        }
                        onChange={(
                          event
                        ) =>
                          setNewItemEstimatedCost(
                            event
                              .target
                              .value
                          )
                        }
                        placeholder="0.00"
                        className="min-w-0 w-full bg-transparent px-1 py-2.5 outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="shrink-0 rounded-r-xl bg-[#230028] px-5 font-medium text-white"
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
                  {intentFilter ===
                  "need"
                    ? "Things I need"
                    : intentFilter ===
                        "want"
                      ? "Wishlist"
                      : isAllView
                        ? "All shopping"
                        : activeList
                            ?.name}
                </h2>

                {intentFilter !==
                  "all" && (
                  <button
                    type="button"
                    onClick={() =>
                      setIntentFilter(
                        "all"
                      )
                    }
                    className="mt-1 text-xs text-[#9d3db7]"
                  >
                    Show all items
                  </button>
                )}
              </div>

              <span className="text-sm text-slate-400">
                {
                  filteredItems.length
                }{" "}
                shown
              </span>
            </div>

            <div className="space-y-3">
              {filteredItems.length >
              0 ? (
                filteredItems.map(
                  renderItem
                )
              ) : (
                <p className="rounded-2xl bg-[#f3eeee] px-4 py-8 text-center text-sm text-slate-500">
                  No items match
                  these filters.
                </p>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
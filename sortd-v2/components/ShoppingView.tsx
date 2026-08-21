"use client";

import { useState } from "react";
import {
  ShoppingCategory,
  ShoppingItem,
  ShoppingList,
} from "@/lib/types";

type ShoppingViewProps = {
  shoppingLists: ShoppingList[];
  onChangeShoppingLists: (
    shoppingLists: ShoppingList[]
  ) => void;
};

const categories: Array<{
  value: ShoppingCategory;
  label: string;
}> = [
  { value: "food", label: "Food" },
  {
    value: "household",
    label: "Household",
  },
  { value: "health", label: "Health" },
  { value: "beauty", label: "Beauty" },
  {
    value: "clothing",
    label: "Clothing",
  },
  { value: "garden", label: "Garden" },
  { value: "gifts", label: "Gifts" },
  { value: "other", label: "Other" },
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
  ] = useState(
    shoppingLists[0]?.id ?? ""
  );

  const [newListName, setNewListName] =
    useState("");

  const [newItemTitle, setNewItemTitle] =
    useState("");

  const [newItemQuantity, setNewItemQuantity] =
    useState("");

  const [newItemShop, setNewItemShop] =
    useState("");

  const [
    newItemCategory,
    setNewItemCategory,
  ] = useState<ShoppingCategory>("food");

  const [
    newItemEstimatedCost,
    setNewItemEstimatedCost,
  ] = useState("");

  const activeList =
    shoppingLists.find(
      (list) =>
        list.id === activeShoppingListId
    ) ?? shoppingLists[0];

  const knownShops = Array.from(
    new Set(
      shoppingLists.flatMap((list) =>
        list.items
          .map((item) => item.shop?.trim())
          .filter(
            (shop): shop is string =>
              Boolean(shop)
          )
      )
    )
  ).sort();

  const remainingItems =
    activeList?.items.filter(
      (item) => !item.purchased
    ) ?? [];

  const purchasedItems =
    activeList?.items.filter(
      (item) => item.purchased
    ) ?? [];

  const remainingEstimate =
    remainingItems.reduce(
      (total, item) =>
        total +
        (item.estimatedCost ?? 0),
      0
    );

  const totalEstimate =
    activeList?.items.reduce(
      (total, item) =>
        total +
        (item.estimatedCost ?? 0),
      0
    ) ?? 0;

  function updateList(
    updatedList: ShoppingList
  ) {
    onChangeShoppingLists(
      shoppingLists.map((list) =>
        list.id === updatedList.id
          ? updatedList
          : list
      )
    );
  }

  function createShoppingList() {
    const name = newListName.trim();

    if (!name) return;

    const newList: ShoppingList = {
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

    setActiveShoppingListId(newList.id);
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

    const confirmed = window.confirm(
      `Delete the shopping list "${activeList.name}" and all of its items?`
    );

    if (!confirmed) return;

    const remainingLists =
      shoppingLists.filter(
        (list) =>
          list.id !== activeList.id
      );

    onChangeShoppingLists(
      remainingLists
    );

    setActiveShoppingListId(
      remainingLists[0]?.id ?? ""
    );
  }

  function addItem() {
    if (!activeList) return;

    const title =
      newItemTitle.trim();

    if (!title) return;

    const parsedCost =
      Number(newItemEstimatedCost);

    const newItem: ShoppingItem = {
      id: crypto.randomUUID(),
      title,
      quantity:
        newItemQuantity.trim() ||
        undefined,
      shop:
        newItemShop.trim() ||
        undefined,
      category: newItemCategory,
      estimatedCost:
        newItemEstimatedCost &&
        Number.isFinite(parsedCost)
          ? Math.max(0, parsedCost)
          : undefined,
      purchased: false,
      order:
        activeList.items.length + 1,
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
    itemId: string,
    updates: Partial<ShoppingItem>
  ) {
    if (!activeList) return;

    updateList({
      ...activeList,
      items: activeList.items.map(
        (item) =>
          item.id === itemId
            ? { ...item, ...updates }
            : item
      ),
    });
  }

  function toggleItem(itemId: string) {
    if (!activeList) return;

    const item =
      activeList.items.find(
        (currentItem) =>
          currentItem.id === itemId
      );

    if (!item) return;

    updateItem(itemId, {
      purchased: !item.purchased,
    });
  }

  function deleteItem(itemId: string) {
    if (!activeList) return;

    const item =
      activeList.items.find(
        (currentItem) =>
          currentItem.id === itemId
      );

    if (!item) return;

    const confirmed = window.confirm(
      `Remove "${item.title}" from this shopping list?`
    );

    if (!confirmed) return;

    updateList({
      ...activeList,
      items: activeList.items.filter(
        (currentItem) =>
          currentItem.id !== itemId
      ),
    });
  }

  function clearPurchased() {
    if (!activeList) return;

    const confirmed = window.confirm(
      `Remove ${purchasedItems.length} bought ${
        purchasedItems.length === 1
          ? "item"
          : "items"
      } from this list?`
    );

    if (!confirmed) return;

    updateList({
      ...activeList,
      items: activeList.items.filter(
        (item) => !item.purchased
      ),
    });
  }

  function renderItem(
    item: ShoppingItem
  ) {
    return (
      <div
        key={item.id}
        className={`grid gap-3 rounded-2xl border p-4 lg:grid-cols-[auto_1fr_110px_150px_135px_110px_auto] lg:items-center ${
          item.purchased
            ? "border-emerald-100 bg-emerald-50/60"
            : "border-slate-200 bg-white"
        }`}
      >
        <input
          type="checkbox"
          checked={item.purchased}
          onChange={() =>
            toggleItem(item.id)
          }
          aria-label={`Mark ${item.title} as bought`}
          className="h-5 w-5 accent-[#cd6ce7]"
        />

        <input
          value={item.title}
          onChange={(event) =>
            updateItem(item.id, {
              title: event.target.value,
            })
          }
          className={`min-w-0 bg-transparent font-medium text-slate-900 outline-none ${
            item.purchased
              ? "text-slate-400 line-through"
              : ""
          }`}
        />

        <input
          value={item.quantity ?? ""}
          onChange={(event) =>
            updateItem(item.id, {
              quantity:
                event.target.value ||
                undefined,
            })
          }
          placeholder="Quantity"
          className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm"
        />

        <input
          value={item.shop ?? ""}
          onChange={(event) =>
            updateItem(item.id, {
              shop:
                event.target.value ||
                undefined,
            })
          }
          list="known-shopping-shops"
          placeholder="Shop"
          className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm"
        />

        <select
          value={item.category}
          onChange={(event) =>
            updateItem(item.id, {
              category:
                event.target
                  .value as ShoppingCategory,
            })
          }
          className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm"
        >
          {categories.map(
            (category) => (
              <option
                key={category.value}
                value={category.value}
              >
                {category.label}
              </option>
            )
          )}
        </select>

        <div className="flex items-center rounded-lg border border-slate-200 bg-white px-2">
          <span className="text-sm text-slate-400">
            £
          </span>

          <input
            type="number"
            min="0"
            step="0.01"
            value={
              item.estimatedCost ?? ""
            }
            onChange={(event) => {
              const value =
                event.target.value;

              updateItem(item.id, {
                estimatedCost: value
                  ? Math.max(
                      0,
                      Number(value)
                    )
                  : undefined,
              });
            }}
            placeholder="0.00"
            className="min-w-0 w-full bg-transparent px-1 py-1.5 text-sm outline-none"
          />
        </div>

        <button
          type="button"
          onClick={() =>
            deleteItem(item.id)
          }
          aria-label={`Delete ${item.title}`}
          title="Delete item"
          className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-slate-400 transition hover:bg-red-100 hover:text-red-600"
        >
          ×
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white/85 p-5 shadow-xl backdrop-blur-md md:p-8">
      <datalist id="known-shopping-shops">
        {knownShops.map((shop) => (
          <option key={shop} value={shop} />
        ))}
      </datalist>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#9d3db7]">
            Shopping
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-950">
            Shopping lists
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Organise purchases by shop,
            category and estimated cost.
          </p>
        </div>

        {activeList && (
          <button
            type="button"
            onClick={deleteActiveList}
            className="rounded-xl px-3 py-2 text-sm text-slate-400 transition hover:bg-red-50 hover:text-red-600"
          >
            Delete list
          </button>
        )}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          createShoppingList();
        }}
        className="mt-6 flex gap-2"
      >
        <input
          value={newListName}
          onChange={(event) =>
            setNewListName(
              event.target.value
            )
          }
          placeholder="New list, e.g. Weekly food shop"
          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2 outline-none focus:border-[#cd6ce7]"
        />

        <button
          type="submit"
          className="rounded-xl bg-[#230028] px-4 py-2 font-medium text-white"
        >
          Add list
        </button>
      </form>

      {shoppingLists.length > 0 && (
        <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
          {shoppingLists.map((list) => {
            const isActive =
              list.id === activeList?.id;

            const remaining =
              list.items.filter(
                (item) =>
                  !item.purchased
              ).length;

            return (
              <button
                key={list.id}
                type="button"
                onClick={() =>
                  setActiveShoppingListId(
                    list.id
                  )
                }
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${
                  isActive
                    ? "bg-[#230028] text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {list.name}
                <span className="ml-2 opacity-60">
                  {remaining}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {!activeList ? (
        <div className="mt-8 rounded-2xl bg-slate-50 px-6 py-12 text-center">
          <p className="font-medium text-slate-700">
            No shopping lists yet
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Create one for groceries,
            household items or anything else
            you need.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <input
              value={activeList.name}
              onChange={(event) =>
                renameActiveList(
                  event.target.value
                )
              }
              className="min-w-0 flex-1 bg-transparent text-2xl font-bold text-slate-950 outline-none"
            />

            <div className="flex gap-3 text-sm">
              <div className="rounded-xl bg-slate-100 px-3 py-2">
                <span className="font-semibold">
                  {remainingItems.length}
                </span>{" "}
                remaining
              </div>

              <div className="rounded-xl bg-purple-100 px-3 py-2 text-purple-800">
                {currencyFormatter.format(
                  remainingEstimate
                )}{" "}
                estimated
              </div>
            </div>
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              addItem();
            }}
            className="mt-5 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:grid-cols-[1fr_110px_150px_135px_110px]"
          >
            <input
              value={newItemTitle}
              onChange={(event) =>
                setNewItemTitle(
                  event.target.value
                )
              }
              placeholder="What do you need?"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2"
            />

            <input
              value={newItemQuantity}
              onChange={(event) =>
                setNewItemQuantity(
                  event.target.value
                )
              }
              placeholder="Quantity"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2"
            />

            <input
              value={newItemShop}
              onChange={(event) =>
                setNewItemShop(
                  event.target.value
                )
              }
              list="known-shopping-shops"
              placeholder="Shop"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2"
            />

            <select
              value={newItemCategory}
              onChange={(event) =>
                setNewItemCategory(
                  event.target
                    .value as ShoppingCategory
                )
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-2"
            >
              {categories.map(
                (category) => (
                  <option
                    key={category.value}
                    value={category.value}
                  >
                    {category.label}
                  </option>
                )
              )}
            </select>

            <div className="flex">
              <div className="flex min-w-0 flex-1 items-center rounded-l-xl border border-r-0 border-slate-200 bg-white px-2">
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
                  onChange={(event) =>
                    setNewItemEstimatedCost(
                      event.target.value
                    )
                  }
                  placeholder="0.00"
                  className="min-w-0 w-full bg-transparent px-1 py-2 outline-none"
                />
              </div>

              <button
                type="submit"
                className="rounded-r-xl bg-[#230028] px-3 text-white"
              >
                Add
              </button>
            </div>
          </form>

          <div className="mt-5 space-y-3">
            {remainingItems.length > 0 ? (
              remainingItems.map(renderItem)
            ) : (
              <p className="rounded-2xl bg-[#f3eeee] px-4 py-8 text-center text-sm text-slate-500">
                Nothing left to buy.
              </p>
            )}
          </div>

          {purchasedItems.length > 0 && (
            <details className="mt-6 rounded-2xl border border-slate-200">
              <summary className="cursor-pointer px-4 py-3 font-medium text-slate-600">
                Bought items (
                {purchasedItems.length})
              </summary>

              <div className="space-y-3 border-t border-slate-200 p-4">
                {purchasedItems.map(
                  renderItem
                )}

                <div className="flex justify-between gap-3">
                  <p className="text-sm text-slate-500">
                    Complete list estimate:{" "}
                    {currencyFormatter.format(
                      totalEstimate
                    )}
                  </p>

                  <button
                    type="button"
                    onClick={clearPurchased}
                    className="text-sm text-red-500 hover:text-red-700"
                  >
                    Clear bought items
                  </button>
                </div>
              </div>
            </details>
          )}
        </>
      )}
    </div>
  );
}
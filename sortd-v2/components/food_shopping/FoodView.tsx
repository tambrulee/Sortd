"use client";

import { useMemo, useState } from "react";

import { FoodData, Meal, MealPlanEntry, MealType } from "@/lib/types";

import MealDetailsModal from "@/components/food_shopping/MealDetailsModal";
import ConfirmDialog from "@/components/prompts/ConfirmDialog";

type FoodViewProps = {
  foodData: FoodData;

  onChangeFoodData: (foodData: FoodData) => void;
};

function getDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function startOfWeek(date: Date) {
  const copy = new Date(date);

  const day = copy.getDay();

  const difference = day === 0 ? -6 : 1 - day;

  copy.setDate(copy.getDate() + difference);

  copy.setHours(0, 0, 0, 0);

  return copy;
}

function getWeekDates(anchorDate: Date) {
  const monday = startOfWeek(anchorDate);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);

    date.setDate(monday.getDate() + index);

    return date;
  });
}

const formatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

const mealTypes: Array<{
  value: MealType;
  label: string;
}> = [
  {
    value: "breakfast",
    label: "Breakfast",
  },
  {
    value: "lunch",
    label: "Lunch",
  },
  {
    value: "dinner",
    label: "Dinner",
  },
];

export default function FoodView({
  foodData,
  onChangeFoodData,
}: FoodViewProps) {
  const [activeTab, setActiveTab] = useState<"week" | "meals" | "shopping">(
    "week",
  );

  const [weekAnchor, setWeekAnchor] = useState(new Date());

  const [newMealName, setNewMealName] = useState("");

  const [newMealType, setNewMealType] = useState<MealType>("dinner");

  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);

  const [
    mealToDeleteId,
    setMealToDeleteId,
  ] = useState<string | null>(null);

 const [shoppingSort, setShoppingSort] = useState<
    "manual" | "unpurchased" | "az" | "recent" | "purchased"
  >("manual");

  const [draggedShoppingItemId, setDraggedShoppingItemId] =
    useState<string | null>(null);

  const weekDates = useMemo(() => getWeekDates(weekAnchor), [weekAnchor]);

  function addMeal() {
    const name = newMealName.trim();

    if (!name) return;

    const meal: Meal = {
      id: crypto.randomUUID(),
      name,
      mealType: newMealType,
      defaultPortions: 2,
      portionsAvailable: 0,
      ingredients: [],
      createdAt: new Date().toISOString(),
    };

    onChangeFoodData({
      ...foodData,

      meals: [...foodData.meals, meal],
    });

    setNewMealName("");
  }

  function updateMeal(mealId: string, updates: Partial<Meal>) {
    onChangeFoodData({
      ...foodData,

      meals: foodData.meals.map((meal) =>
        meal.id === mealId
          ? {
              ...meal,
              ...updates,
            }
          : meal,
      ),
    });
  }

  function deleteMeal(
    mealId: string,
  ) {
    onChangeFoodData({
      ...foodData,

      meals:
        foodData.meals.filter(
          (item) =>
            item.id !== mealId,
        ),

      mealPlan:
        foodData.mealPlan.filter(
          (entry) =>
            entry.mealId !== mealId,
        ),
    });

    if (
      selectedMeal?.id ===
      mealId
    ) {
      setSelectedMeal(null);
    }
  }

  function planMeal(date: string, mealId: string) {
    if (!mealId) return;

    const meal = foodData.meals.find((item) => item.id === mealId);

    if (!meal) return;

    const mealType = meal.mealType ?? "dinner";

    const existingEntry = foodData.mealPlan.find(
      (entry) =>
        entry.date === date && (entry.mealType ?? "dinner") === mealType,
    );

    if (existingEntry) {
      onChangeFoodData({
        ...foodData,

        mealPlan: foodData.mealPlan.map((entry) =>
          entry.id === existingEntry.id
            ? {
                ...entry,
                mealId,
                mealType,
              }
            : entry,
        ),
      });

      return;
    }

    const entry: MealPlanEntry = {
      id: crypto.randomUUID(),
      date,
      mealId,
      mealType,
      portions: 1,
    };

    onChangeFoodData({
      ...foodData,

      mealPlan: [...foodData.mealPlan, entry],
    });
  }

  function buyIngredients(meal: Meal) {
    if (meal.ingredients.length === 0) {
      return;
    }

    const shoppingList = foodData.shoppingList ?? [];

    const existingTitles = new Set(
      shoppingList.map((item) => item.title.trim().toLowerCase()),
    );

    const newItems = meal.ingredients
      .filter(
        (ingredient) =>
          !existingTitles.has(ingredient.name.trim().toLowerCase()),
      )
      .map((ingredient) => ({
        id: crypto.randomUUID(),
        title: ingredient.name,
        quantity: ingredient.quantity,
        purchased: false,
        createdAt: new Date().toISOString(),
      }));

    if (newItems.length === 0) {
      return;
    }

    onChangeFoodData({
      ...foodData,

      shoppingList: [...shoppingList, ...newItems],
    });
  }

  function removePlanEntry(entryId: string) {
    onChangeFoodData({
      ...foodData,

      mealPlan: foodData.mealPlan.filter((entry) => entry.id !== entryId),
    });
  }

  function moveWeek(amount: number) {
    const next = new Date(weekAnchor);

    next.setDate(next.getDate() + amount * 7);

    setWeekAnchor(next);
  }

const shoppingList = foodData.shoppingList ?? [];

const sortedShoppingList = [...shoppingList].sort((a, b) => {
  switch (shoppingSort) {
    case "manual":
      return 0;

    case "az":
      return a.title.localeCompare(b.title);

    case "recent":
      return (
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
      );

    case "purchased":
      return Number(b.purchased) - Number(a.purchased);

    case "unpurchased":
    default:
      return Number(a.purchased) - Number(b.purchased);
  }
});

function moveShoppingItem(draggedId: string, targetId: string) {
  if (draggedId === targetId) return;

  const currentList = [...shoppingList];

  const draggedIndex = currentList.findIndex(
    (item) => item.id === draggedId,
  );

  const targetIndex = currentList.findIndex(
    (item) => item.id === targetId,
  );

  if (draggedIndex === -1 || targetIndex === -1) return;

  const [draggedItem] = currentList.splice(draggedIndex, 1);

  currentList.splice(targetIndex, 0, draggedItem);

  onChangeFoodData({
    ...foodData,
    shoppingList: currentList,
  });
}

  return (
    <div className="space-y-6 rounded-3xl border border-[var(--sortd-border)] bg-[var(--sortd-surface)] p-4 sm:p-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[var(--sortd-teal-dark)]">Food</p>

          <h1 className="mt-1 text-2xl font-bold text-[var(--sortd-text)]">
            Food & meals
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-[var(--sortd-text-muted)]">
            Plan the week, keep meals you like, and turn ingredients into a
            shopping list when you actually need them.
          </p>
        </div>

        <div role="group" aria-label="Food views" className="flex max-w-full flex-wrap rounded-xl bg-[var(--sortd-muted)] p-1">
          <button
            type="button"
            aria-pressed={activeTab === "week"}
            onClick={() => setActiveTab("week")}
            className={`min-h-11 rounded-lg px-4 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sortd-teal-dark)] ${
              activeTab === "week"
                ? "bg-[var(--sortd-card)] text-[var(--sortd-text)] shadow-sm"
                : "text-[var(--sortd-text-muted)]"
            }`}
          >
            This week
          </button>

          <button
            type="button"
            aria-pressed={activeTab === "meals"}
            onClick={() => setActiveTab("meals")}
            className={`min-h-11 rounded-lg px-4 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sortd-teal-dark)] ${
              activeTab === "meals"
                ? "bg-[var(--sortd-card)] text-[var(--sortd-text)] shadow-sm"
                : "text-[var(--sortd-text-muted)]"
            }`}
          >
            Meals
          </button>

          <button
            type="button"
            aria-pressed={activeTab === "shopping"}
            onClick={() => setActiveTab("shopping")}
            className={`min-h-11 rounded-lg px-4 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sortd-teal-dark)] ${
              activeTab === "shopping"
                ? "bg-[var(--sortd-card)] text-[var(--sortd-text)] shadow-sm"
                : "text-[var(--sortd-text-muted)]"
            }`}
          >
            Food shop
          </button>
        </div>
      </header>

      {activeTab === "week" ? (
        <section className="space-y-4 min-h-11 min-w-11 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sortd-teal-dark)]">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => moveWeek(-1)}
              className="rounded-xl border border-[var(--sortd-border)] bg-[var(--sortd-card)] px-3 py-2 text-sm text-[var(--sortd-text-muted)] min-h-11 min-w-11 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sortd-teal-dark)]"
            >
              ← Previous
            </button>

            <button
              type="button"
              onClick={() => setWeekAnchor(new Date())}
              className="text-sm font-medium text-[var(--sortd-teal-dark)] min-h-11 min-w-11 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sortd-teal-dark)]"
            >
              This week
            </button>

            <button
              type="button"
              onClick={() => moveWeek(1)}
              className="rounded-xl border border-[var(--sortd-border)] bg-[var(--sortd-card)] px-3 py-2 text-sm text-[var(--sortd-text-muted)] min-h-11 min-w-11 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sortd-teal-dark)]"
            >
              Next →
            </button>
          </div>

          <div className="space-y-4">
            {weekDates.map((date) => {
              const dateKey = getDateKey(date);

              const entries = foodData.mealPlan.filter(
                (entry) => entry.date === dateKey,
              );

              return (
                <article
                  key={dateKey}
                  className="rounded-2xl border border-[var(--sortd-border)] bg-[var(--sortd-card)] p-5"
                >
                  <h2 className="text-lg font-semibold text-[var(--sortd-text)]">
                    {formatter.format(date)}
                  </h2>

                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    {mealTypes.map(({ value, label }) => {
                      const sectionEntry = entries.find(
                        (entry) => (entry.mealType ?? "dinner") === value,
                      );

                      const availableMeals = foodData.meals.filter(
                        (meal) => (meal.mealType ?? "dinner") === value,
                      );

                      const plannedMeal = sectionEntry
                        ? foodData.meals.find(
                            (meal) => meal.id === sectionEntry.mealId,
                          )
                        : undefined;

                      return (
                        <section
                          key={value}
                          className="min-w-0 rounded-xl bg-[var(--sortd-muted)] p-3"
                        >
                          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--sortd-text-muted)]">
                            {label}
                          </p>

                          {sectionEntry && plannedMeal ? (
                            <div className="rounded-xl bg-[var(--sortd-card)] p-3">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-[var(--sortd-text)]">
                                  {plannedMeal.name}
                                </p>

                                <button
                                  type="button"
                                  onClick={() =>
                                    removePlanEntry(sectionEntry.id)
                                  }
                                  className="text-[var(--sortd-text-muted)] hover:text-red-500 min-h-11 min-w-11 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sortd-teal-dark)]"
                                  aria-label={`Remove ${plannedMeal.name}`}
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          ) : (
                            <select
                              aria-label={`Plan ${label.toLowerCase()} for ${formatter.format(date)}`}
                              disabled={availableMeals.length === 0}
                              defaultValue=""
                              onChange={(event) => {
                                planMeal(dateKey, event.target.value);

                                event.target.value = "";
                              }}
                              className="w-full rounded-xl border border-dashed border-[var(--sortd-border)] bg-[var(--sortd-card)] px-3 py-2 text-base sm:text-sm text-[var(--sortd-text-muted)] min-h-11 bg-[var(--sortd-card)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sortd-teal-dark)]"
                            >
                              <option value="">
                                {availableMeals.length ? `+ Add ${label.toLowerCase()}` : `Save a ${label.toLowerCase()} meal first`}
                              </option>

                              {availableMeals.map((meal) => (
                                <option key={meal.id} value={meal.id}>
                                  {meal.name}
                                </option>
                              ))}
                            </select>
                          )}
                        </section>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : activeTab === "meals" ? (
        <section className="space-y-6">
          <div className="flex flex-wrap gap-2 rounded-2xl border border-[var(--sortd-border)] bg-[var(--sortd-card)] p-3">
            <input
              value={newMealName}
              onChange={(event) => setNewMealName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.nativeEvent.isComposing) {
                  addMeal();
                }
              }}
              aria-label="New meal name"
              placeholder="Add a meal..."
              className="text-base sm:text-sm min-w-0 flex-1 bg-transparent px-2 py-1 outline-none min-h-11 bg-[var(--sortd-card)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sortd-teal-dark)]"
            />

            <select
              aria-label="New meal type"
              value={newMealType}
              onChange={(event) =>
                setNewMealType(event.target.value as MealType)
              }
              className="rounded-xl border border-[var(--sortd-border)] bg-[var(--sortd-card)] px-3 py-2 text-base sm:text-sm min-h-11 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sortd-teal-dark)]"
            >
              <option value="breakfast">Breakfast</option>

              <option value="lunch">Lunch</option>

              <option value="dinner">Dinner</option>
            </select>

            <button
              type="button"
              onClick={addMeal}
              className="rounded-xl bg-[var(--sortd-teal-dark)] px-4 py-2 text-sm font-semibold text-white min-h-11 min-w-11 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sortd-teal-dark)]"
            >
              Add meal
            </button>
          </div>

          {foodData.meals.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[var(--sortd-border)] bg-[var(--sortd-card)] p-10 text-center">
              <p className="font-semibold text-[var(--sortd-text)]">
                No meals saved yet.
              </p>

              <p className="mt-1 text-sm text-[var(--sortd-text-muted)]">
                Add things you genuinely cook, not an aspirational recipe
                catalogue.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {mealTypes.map(({ value, label }) => {
                const meals = foodData.meals.filter(
                  (meal) => (meal.mealType ?? "dinner") === value,
                );

                return (
                  <section key={value}>
                    <div className="mb-3 flex items-center gap-3">
                      <h2 className="text-lg font-semibold text-[var(--sortd-text)]">
                        {label}
                      </h2>

                      <span className="text-sm text-[var(--sortd-text-muted)]">
                        {meals.length}
                      </span>
                    </div>

                    {meals.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-[var(--sortd-border)] bg-[var(--sortd-card)] p-5 text-sm text-[var(--sortd-text-muted)]">
                        No {label.toLowerCase()} meals saved yet.
                      </div>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {meals.map((meal) => (
                          <article
                            key={meal.id}
                            className="rounded-2xl border border-[var(--sortd-border)] bg-[var(--sortd-card)] p-5 transition hover:border-[var(--sortd-border)]"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <button type="button" onClick={() => setSelectedMeal(meal)} className="min-h-11 min-w-11 min-w-0 flex-1 text-left text-lg font-semibold text-[var(--sortd-text)] hover:text-[var(--sortd-teal-dark)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sortd-teal-dark)]">
                                {meal.name || "Untitled meal"}
                              </button>

                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();

                                  setMealToDeleteId(meal.id);
                                }}
                                className="text-[var(--sortd-text-muted)] hover:text-red-500 min-h-11 min-w-11 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sortd-teal-dark)]"
                                aria-label={`Delete ${meal.name}`}
                              >
                                ×
                              </button>
                            </div>

                            <div className="mt-5 grid grid-cols-2 gap-3">
                              <label className="text-xs text-[var(--sortd-text-muted)]">
                                Makes
                                <input
                                  type="number"
                                  min="1"
                                  value={meal.defaultPortions}
                                  onClick={(event) => event.stopPropagation()}
                                  onChange={(event) =>
                                    updateMeal(meal.id, {
                                      defaultPortions: Math.max(
                                        1,
                                        Number(event.target.value),
                                      ),
                                    })
                                  }
                                  className="mt-1 w-full rounded-xl border border-[var(--sortd-border)] px-3 py-2 text-base sm:text-sm text-[var(--sortd-text)] min-h-11 bg-[var(--sortd-card)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sortd-teal-dark)]"
                                />
                              </label>

                              <label className="text-xs text-[var(--sortd-text-muted)]">
                                Portions ready
                                <input
                                  type="number"
                                  min="0"
                                  value={meal.portionsAvailable}
                                  onClick={(event) => event.stopPropagation()}
                                  onChange={(event) =>
                                    updateMeal(meal.id, {
                                      portionsAvailable: Math.max(
                                        0,
                                        Number(event.target.value),
                                      ),
                                    })
                                  }
                                  className="mt-1 w-full rounded-xl border border-[var(--sortd-border)] px-3 py-2 text-base sm:text-sm text-[var(--sortd-text)] min-h-11 bg-[var(--sortd-card)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sortd-teal-dark)]"
                                />
                              </label>
                            </div>

                            <div className="mt-4 flex items-center justify-between border-t border-[var(--sortd-border)] pt-4 text-sm">
                              <span className="text-[var(--sortd-text-muted)]">
                                {meal.ingredients.length} ingredients
                              </span>

                              <button
                                type="button"
                                disabled={meal.ingredients.length === 0}
                                onClick={(event) => {
                                  event.stopPropagation();

                                  buyIngredients(meal);
                                }}
                                className={`font-medium ${
                                  meal.ingredients.length > 0
                                    ? "text-[var(--sortd-teal-dark)] hover:text-[var(--sortd-navy)]"
                                    : "cursor-not-allowed text-[var(--sortd-text-muted)]"
                                }`}
                              >
                                Buy ingredients
                              </button>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </section>
      ) : (
        <section className="space-y-4 min-h-11 min-w-11 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sortd-teal-dark)]">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-[var(--sortd-text)]">
                Food shop
              </h2>

              <p className="mt-1 text-sm text-[var(--sortd-text-muted)]">
                Ingredients you&apos;ve chosen to buy.
              </p>
            </div>

            {shoppingList.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-[var(--sortd-text-muted)]">
                  {shoppingList.filter((item) => !item.purchased).length} left
                </span>

                <select
                  aria-label="Shopping list order"
                  value={shoppingSort}
                  onChange={(event) =>
                    setShoppingSort(
                      event.target.value as
                        | "manual"
                        | "unpurchased"
                        | "az"
                        | "recent"
                        | "purchased",
                    )
                  }
                  className="rounded-xl border border-[var(--sortd-border)] bg-[var(--sortd-card)] px-3 py-2 text-base sm:text-sm text-[var(--sortd-text)] min-h-11 bg-[var(--sortd-card)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sortd-teal-dark)]"
                >
                  <option value="manual">Manual order</option>
                  <option value="unpurchased">Unbought first</option>
                  <option value="az">A–Z</option>
                  <option value="recent">Recently added</option>
                  <option value="purchased">Purchased first</option>
                </select>
              </div>
            )}
          </div>

          {shoppingList.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--sortd-border)] bg-[var(--sortd-card)] p-8 text-center text-sm text-[var(--sortd-text-muted)]">
              Nothing to buy yet.
            </div>
          ) : (
            <div className="space-y-2">
              {sortedShoppingList.map((item) => (
                <div
                  key={item.id}
                  draggable={shoppingSort === "manual"}
                  onDragStart={() => {
                    if (shoppingSort !== "manual") return;

                    setDraggedShoppingItemId(item.id);
                  }}
                  onDragOver={(event) => {
                    if (shoppingSort !== "manual") return;

                    event.preventDefault();
                  }}
                  onDrop={(event) => {
                    event.preventDefault();

                    if (
                      shoppingSort !== "manual" ||
                      !draggedShoppingItemId
                    ) {
                      return;
                    }

                    moveShoppingItem(
                      draggedShoppingItemId,
                      item.id,
                    );

                    setDraggedShoppingItemId(null);
                  }}
                  onDragEnd={() => {
                    setDraggedShoppingItemId(null);
                  }}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition ${
                    shoppingSort === "manual"
                      ? "cursor-grab active:cursor-grabbing"
                      : ""
                  } ${
                    draggedShoppingItemId === item.id
                      ? "opacity-50"
                      : ""
                  } ${
                    item.purchased
                      ? "border-[var(--sortd-border)] bg-[var(--sortd-muted)]"
                      : "border-[var(--sortd-border)] bg-[var(--sortd-card)]"
                  }`}
                >
                  {shoppingSort === "manual" && (
                    <span
                      className="select-none text-lg text-[var(--sortd-text-muted)]"
                      aria-hidden="true"
                    >
                      ⋮⋮
                    </span>
                  )}
                  <input
                    type="checkbox"
                    aria-label={`Mark ${item.title} as ${item.purchased ? "unbought" : "purchased"}`}
                    className="text-base sm:text-sm h-6 w-6 shrink-0 accent-[var(--sortd-teal-dark)]"
                    checked={item.purchased}
                    onChange={() => {
                      onChangeFoodData({
                        ...foodData,

                        shoppingList: shoppingList.map((shoppingItem) =>
                          shoppingItem.id === item.id
                            ? {
                                ...shoppingItem,
                                purchased: !shoppingItem.purchased,
                              }
                            : shoppingItem,
                        ),
                      });
                    }}
                  />

                  <div className="min-w-0 flex-1">
                    <p
                      className={`font-medium ${
                        item.purchased
                          ? "text-[var(--sortd-text-muted)] line-through"
                          : "text-[var(--sortd-text)]"
                      }`}
                    >
                      {item.title}
                    </p>

                    {item.quantity && (
                      <p className="text-sm text-[var(--sortd-text-muted)]">{item.quantity}</p>
                    )}
                  </div>

                  {shoppingSort === "manual" && <div className="flex shrink-0">
                    <button type="button" aria-label={`Move ${item.title} earlier`} disabled={shoppingList[0]?.id === item.id} onClick={() => moveShoppingItem(item.id, shoppingList[shoppingList.findIndex((entry) => entry.id === item.id) - 1].id)} className="min-h-11 min-w-11 min-w-11 text-[var(--sortd-text-muted)] disabled:opacity-30">↑</button>
                    <button type="button" aria-label={`Move ${item.title} later`} disabled={shoppingList[shoppingList.length - 1]?.id === item.id} onClick={() => moveShoppingItem(item.id, shoppingList[shoppingList.findIndex((entry) => entry.id === item.id) + 1].id)} className="min-h-11 min-w-11 min-w-11 text-[var(--sortd-text-muted)] disabled:opacity-30">↓</button>
                  </div>}
                  <button
                    type="button"
                    onClick={() => {
                      onChangeFoodData({
                        ...foodData,

                        shoppingList: shoppingList.filter(
                          (shoppingItem) => shoppingItem.id !== item.id,
                        ),
                      });
                    }}
                    className="text-[var(--sortd-text-muted)] hover:text-red-500 min-h-11 min-w-11 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sortd-teal-dark)]"
                    aria-label={`Remove ${item.title}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {selectedMeal && (
        <MealDetailsModal
          key={selectedMeal.id}
          meal={selectedMeal}
          onClose={() => setSelectedMeal(null)}
          onSave={(updatedMeal) => {
            updateMeal(updatedMeal.id, updatedMeal);
          }}
        />
      )}
      <ConfirmDialog
        open={Boolean(mealToDeleteId)}
        title="Delete meal?"
        description={
          mealToDeleteId
            ? `Delete “${
                foodData.meals.find(
                  (meal) =>
                    meal.id === mealToDeleteId,
                )?.name ?? "this meal"
              }”? It will also be removed from your meal plan. This can't be undone.`
            : undefined
        }
        confirmLabel="Delete meal"
        onCancel={() => {
          setMealToDeleteId(null);
        }}
        onConfirm={() => {
          if (!mealToDeleteId) return;

          deleteMeal(mealToDeleteId);
          setMealToDeleteId(null);
        }}
      />
    </div>
  );
}

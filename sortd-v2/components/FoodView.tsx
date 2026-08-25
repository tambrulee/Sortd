"use client";

import { useMemo, useState } from "react";

import { FoodData, Meal, MealPlanEntry, MealType } from "@/lib/types";

import MealDetailsModal from "@/components/MealDetailsModal";

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

  function deleteMeal(mealId: string) {
    const meal = foodData.meals.find((item) => item.id === mealId);

    if (!meal) return;

    const confirmed = window.confirm(`Delete "${meal.name}"?`);

    if (!confirmed) {
      return;
    }

    onChangeFoodData({
      ...foodData,

      meals: foodData.meals.filter((item) => item.id !== mealId),

      mealPlan: foodData.mealPlan.filter((entry) => entry.mealId !== mealId),
    });

    if (selectedMeal?.id === mealId) {
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

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[#a93ac5]">Food</p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Plan food without overthinking it.
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Plan the week, keep meals you like, and turn ingredients into a
            shopping list when you actually need them.
          </p>
        </div>

        <div className="flex rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("week")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === "week"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500"
            }`}
          >
            This week
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("meals")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === "meals"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500"
            }`}
          >
            Meals
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("shopping")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === "shopping"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500"
            }`}
          >
            Food shop
          </button>
        </div>
      </header>

      {activeTab === "week" ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => moveWeek(-1)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
            >
              ← Previous
            </button>

            <button
              type="button"
              onClick={() => setWeekAnchor(new Date())}
              className="text-sm font-medium text-[#a93ac5]"
            >
              This week
            </button>

            <button
              type="button"
              onClick={() => moveWeek(1)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
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
                  className="rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <h2 className="text-lg font-semibold text-slate-900">
                    {formatter.format(date)}
                  </h2>

                  <div className="mt-4 space-y-3">
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
                          className="rounded-xl bg-slate-50 p-4"
                        >
                          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                            {label}
                          </p>

                          {sectionEntry && plannedMeal ? (
                            <div className="rounded-xl bg-[#f8f1fa] p-3">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-slate-800">
                                  {plannedMeal.name}
                                </p>

                                <button
                                  type="button"
                                  onClick={() =>
                                    removePlanEntry(sectionEntry.id)
                                  }
                                  className="text-slate-400 hover:text-red-500"
                                  aria-label={`Remove ${plannedMeal.name}`}
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          ) : (
                            <select
                              defaultValue=""
                              onChange={(event) => {
                                planMeal(dateKey, event.target.value);

                                event.target.value = "";
                              }}
                              className="w-full rounded-xl border border-dashed border-slate-300 bg-white px-3 py-2 text-sm text-slate-500"
                            >
                              <option value="">
                                + Add {label.toLowerCase()}
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
          <div className="flex gap-2 rounded-2xl border border-slate-200 bg-white p-3">
            <input
              value={newMealName}
              onChange={(event) => setNewMealName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  addMeal();
                }
              }}
              placeholder="Add a meal..."
              className="min-w-0 flex-1 bg-transparent px-2 py-1 outline-none"
            />

            <select
              value={newMealType}
              onChange={(event) =>
                setNewMealType(event.target.value as MealType)
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="breakfast">Breakfast</option>

              <option value="lunch">Lunch</option>

              <option value="dinner">Dinner</option>
            </select>

            <button
              type="button"
              onClick={addMeal}
              className="rounded-xl bg-[#cd6ce7] px-4 py-2 text-sm font-semibold text-white"
            >
              Add meal
            </button>
          </div>

          {foodData.meals.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <p className="font-semibold text-slate-700">
                No meals saved yet.
              </p>

              <p className="mt-1 text-sm text-slate-500">
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
                      <h2 className="text-lg font-semibold text-slate-900">
                        {label}
                      </h2>

                      <span className="text-sm text-slate-400">
                        {meals.length}
                      </span>
                    </div>

                    {meals.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-5 text-sm text-slate-400">
                        No {label.toLowerCase()} meals saved yet.
                      </div>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {meals.map((meal) => (
                          <article
                            key={meal.id}
                            onClick={() => setSelectedMeal(meal)}
                            className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-300"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <input
                                value={meal.name}
                                onClick={(event) => event.stopPropagation()}
                                onChange={(event) =>
                                  updateMeal(meal.id, {
                                    name: event.target.value,
                                  })
                                }
                                className="min-w-0 flex-1 bg-transparent text-lg font-semibold text-slate-900 outline-none"
                              />

                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();

                                  deleteMeal(meal.id);
                                }}
                                className="text-slate-400 hover:text-red-500"
                                aria-label={`Delete ${meal.name}`}
                              >
                                ×
                              </button>
                            </div>

                            <div className="mt-5 grid grid-cols-2 gap-3">
                              <label className="text-xs text-slate-500">
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
                                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                                />
                              </label>

                              <label className="text-xs text-slate-500">
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
                                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                                />
                              </label>
                            </div>

                            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
                              <span className="text-slate-500">
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
                                    ? "text-[#a93ac5] hover:text-[#8d2fa8]"
                                    : "cursor-not-allowed text-slate-300"
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
        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Food shop
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Ingredients you&apos;ve chosen to buy.
              </p>
            </div>

            {shoppingList.length > 0 && (
              <span className="text-sm text-slate-400">
                {shoppingList.filter((item) => !item.purchased).length} left
              </span>
            )}
          </div>

          {shoppingList.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">
              Nothing to buy yet.
            </div>
          ) : (
            <div className="space-y-2">
              {shoppingList.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                    item.purchased
                      ? "border-emerald-100 bg-emerald-50/40"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <input
                    type="checkbox"
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
                          ? "text-slate-400 line-through"
                          : "text-slate-800"
                      }`}
                    >
                      {item.title}
                    </p>

                    {item.quantity && (
                      <p className="text-sm text-slate-400">{item.quantity}</p>
                    )}
                  </div>

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
                    className="text-slate-400 hover:text-red-500"
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
    </div>
  );
}

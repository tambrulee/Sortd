"use client";

import { useState } from "react";

import { Meal, MealIngredient, MealType } from "@/lib/types";

type MealDetailsModalProps = {
  meal: Meal;
  onClose: () => void;

  onSave: (meal: Meal) => void;
};

export default function MealDetailsModal({
  meal,
  onClose,
  onSave,
}: MealDetailsModalProps) {
  const [draft, setDraft] = useState<Meal>(meal);

  const [ingredientName, setIngredientName] = useState("");

  const [ingredientQuantity, setIngredientQuantity] = useState("");

  function updateDraft(updates: Partial<Meal>) {
    setDraft((current) => ({
      ...current,
      ...updates,
    }));
  }

  function addIngredient() {
    const name = ingredientName.trim();

    if (!name) return;

    const ingredient: MealIngredient = {
      id: crypto.randomUUID(),

      name,

      quantity: ingredientQuantity.trim() || undefined,
    };

    updateDraft({
      ingredients: [...draft.ingredients, ingredient],
    });

    setIngredientName("");
    setIngredientQuantity("");
  }

  function removeIngredient(ingredientId: string) {
    updateDraft({
      ingredients: draft.ingredients.filter(
        (ingredient) => ingredient.id !== ingredientId,
      ),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[#a93ac5]">Meal</p>

            <h2 className="mt-1 text-2xl font-bold text-slate-900">
              Edit meal
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-2xl text-slate-400 hover:text-slate-700"
          >
            ×
          </button>
        </div>

        <div className="mt-6 space-y-5">
          <label className="block text-sm text-slate-600">
            Meal name
            <input
              value={draft.name}
              onChange={(event) =>
                updateDraft({
                  name: event.target.value,
                })
              }
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900"
            />
          </label>

          <label className="block text-sm text-slate-600">
            Meal type
            <select
              value={draft.mealType ?? "dinner"}
              onChange={(event) =>
                updateDraft({
                  mealType: event.target.value as MealType,
                })
              }
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900"
            >
              <option value="breakfast">Breakfast</option>

              <option value="lunch">Lunch</option>

              <option value="dinner">Dinner</option>
            </select>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm text-slate-600">
              Makes
              <input
                type="number"
                min="1"
                value={draft.defaultPortions}
                onChange={(event) =>
                  updateDraft({
                    defaultPortions: Math.max(1, Number(event.target.value)),
                  })
                }
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              />
            </label>

            <label className="text-sm text-slate-600">
              Portions ready
              <input
                type="number"
                min="0"
                value={draft.portionsAvailable}
                onChange={(event) =>
                  updateDraft({
                    portionsAvailable: Math.max(0, Number(event.target.value)),
                  })
                }
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm text-slate-600">
              Prep time
              <input
                type="number"
                min="0"
                value={draft.prepMinutes ?? ""}
                onChange={(event) =>
                  updateDraft({
                    prepMinutes:
                      event.target.value === ""
                        ? undefined
                        : Number(event.target.value),
                  })
                }
                placeholder="Minutes"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              />
            </label>

            <label className="text-sm text-slate-600">
              Cook time
              <input
                type="number"
                min="0"
                value={draft.cookMinutes ?? ""}
                onChange={(event) =>
                  updateDraft({
                    cookMinutes:
                      event.target.value === ""
                        ? undefined
                        : Number(event.target.value),
                  })
                }
                placeholder="Minutes"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              />
            </label>
          </div>

          <section>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Ingredients</h3>

              <span className="text-sm text-slate-400">
                {draft.ingredients.length} added
              </span>
            </div>

            <div className="mt-3 flex gap-2">
              <input
                value={ingredientName}
                onChange={(event) => setIngredientName(event.target.value)}
                placeholder="Ingredient"
                className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2"
              />

              <input
                value={ingredientQuantity}
                onChange={(event) => setIngredientQuantity(event.target.value)}
                placeholder="e.g. 400g"
                className="w-32 rounded-xl border border-slate-200 px-3 py-2"
              />

              <button
                type="button"
                onClick={addIngredient}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                Add
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {draft.ingredients.map((ingredient) => (
                <div
                  key={ingredient.id}
                  className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"
                >
                  <div>
                    <span className="font-medium text-slate-800">
                      {ingredient.name}
                    </span>

                    {ingredient.quantity && (
                      <span className="ml-2 text-sm text-slate-400">
                        {ingredient.quantity}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeIngredient(ingredient.id)}
                    className="text-slate-400 hover:text-red-500"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </section>

          <label className="block text-sm text-slate-600">
            Notes
            <textarea
              value={draft.notes ?? ""}
              onChange={(event) =>
                updateDraft({
                  notes: event.target.value,
                })
              }
              rows={4}
              placeholder="Recipe notes, cooking instructions, substitutions..."
              className="mt-1 w-full resize-none rounded-xl border border-slate-200 px-3 py-2"
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => {
              onSave(draft);
              onClose();
            }}
            className="rounded-xl bg-[#cd6ce7] px-5 py-2 text-sm font-semibold text-white"
          >
            Save meal
          </button>
        </div>
      </div>
    </div>
  );
}

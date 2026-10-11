"use client";

import { useEffect, useId, useRef, useState } from "react";

import { createPortal } from "react-dom";

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
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const closeCallback = useRef(onClose);
  useEffect(() => { closeCallback.current = onClose; }, [onClose]);
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") { event.preventDefault(); closeCallback.current(); }
      if (event.key !== "Tab") return;
      const elements = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]') ?? []);
      const first = elements[0]; const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    document.addEventListener("keydown", handleKey);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", handleKey); previousFocus?.focus(); };
  }, []);

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

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} className="flex max-h-[95dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-[var(--sortd-surface)] shadow-xl sm:max-h-[90dvh] sm:rounded-3xl">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--sortd-border)] p-4 sm:px-6">
          <div>
            <p className="text-sm font-medium text-[var(--sortd-teal-dark)]">Meal</p>

            <h2 id={titleId} className="mt-1 text-2xl font-bold text-[var(--sortd-text)]">
              Edit meal
            </h2>
          </div>

          <button
            type="button"
            ref={closeRef}
            aria-label="Close meal details"
            onClick={onClose}
            className="text-2xl text-[var(--sortd-text-muted)] hover:text-[var(--sortd-text)] min-h-11 min-w-11 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sortd-teal-dark)]"
          >
            ×
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
          <label className="block text-sm text-[var(--sortd-text-muted)]">
            Meal name
            <input
              value={draft.name}
              onChange={(event) =>
                updateDraft({
                  name: event.target.value,
                })
              }
              className="text-base sm:text-sm mt-1 w-full rounded-xl border border-[var(--sortd-border)] px-3 py-2 text-[var(--sortd-text)] min-h-11 bg-[var(--sortd-card)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sortd-teal-dark)]"
            />
          </label>

          <label className="block text-sm text-[var(--sortd-text-muted)]">
            Meal type
            <select
              value={draft.mealType ?? "dinner"}
              onChange={(event) =>
                updateDraft({
                  mealType: event.target.value as MealType,
                })
              }
              className="text-base sm:text-sm mt-1 w-full rounded-xl border border-[var(--sortd-border)] bg-[var(--sortd-card)] px-3 py-2 text-[var(--sortd-text)] min-h-11 bg-[var(--sortd-card)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sortd-teal-dark)]"
            >
              <option value="breakfast">Breakfast</option>

              <option value="lunch">Lunch</option>

              <option value="dinner">Dinner</option>
            </select>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm text-[var(--sortd-text-muted)]">
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
                className="text-base sm:text-sm mt-1 w-full rounded-xl border border-[var(--sortd-border)] px-3 py-2 min-h-11 bg-[var(--sortd-card)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sortd-teal-dark)]"
              />
            </label>

            <label className="text-sm text-[var(--sortd-text-muted)]">
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
                className="text-base sm:text-sm mt-1 w-full rounded-xl border border-[var(--sortd-border)] px-3 py-2 min-h-11 bg-[var(--sortd-card)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sortd-teal-dark)]"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm text-[var(--sortd-text-muted)]">
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
                className="text-base sm:text-sm mt-1 w-full rounded-xl border border-[var(--sortd-border)] px-3 py-2 min-h-11 bg-[var(--sortd-card)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sortd-teal-dark)]"
              />
            </label>

            <label className="text-sm text-[var(--sortd-text-muted)]">
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
                className="text-base sm:text-sm mt-1 w-full rounded-xl border border-[var(--sortd-border)] px-3 py-2 min-h-11 bg-[var(--sortd-card)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sortd-teal-dark)]"
              />
            </label>
          </div>

          <section>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[var(--sortd-text)]">Ingredients</h3>

              <span className="text-sm text-[var(--sortd-text-muted)]">
                {draft.ingredients.length} added
              </span>
            </div>

            <div className="mt-3 grid grid-cols-[minmax(0,1fr)_minmax(0,0.6fr)] gap-2 sm:flex">
              <input
                value={ingredientName}
                onChange={(event) => setIngredientName(event.target.value)}
                aria-label="Ingredient name"
                placeholder="Ingredient"
                className="text-base sm:text-sm min-w-0 flex-1 rounded-xl border border-[var(--sortd-border)] px-3 py-2 min-h-11 bg-[var(--sortd-card)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sortd-teal-dark)]"
              />

              <input
                value={ingredientQuantity}
                onChange={(event) => setIngredientQuantity(event.target.value)}
                aria-label="Ingredient quantity"
                placeholder="e.g. 400g"
                className="text-base sm:text-sm min-w-0 w-full sm:w-32 rounded-xl border border-[var(--sortd-border)] px-3 py-2 min-h-11 bg-[var(--sortd-card)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sortd-teal-dark)]"
              />

              <button
                type="button"
                onClick={addIngredient}
                className="col-span-2 rounded-xl bg-[var(--sortd-navy)] px-4 py-2 text-sm font-semibold text-white min-h-11 min-w-11 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sortd-teal-dark)]"
              >
                Add
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {draft.ingredients.map((ingredient) => (
                <div
                  key={ingredient.id}
                  className="flex items-center justify-between rounded-xl bg-[var(--sortd-muted)] px-3 py-2"
                >
                  <div>
                    <span className="font-medium text-[var(--sortd-text)]">
                      {ingredient.name}
                    </span>

                    {ingredient.quantity && (
                      <span className="ml-2 text-sm text-[var(--sortd-text-muted)]">
                        {ingredient.quantity}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    aria-label={`Remove ${ingredient.name}`}
                    onClick={() => removeIngredient(ingredient.id)}
                    className="text-[var(--sortd-text-muted)] hover:text-red-500 min-h-11 min-w-11 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sortd-teal-dark)]"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </section>

          <label className="block text-sm text-[var(--sortd-text-muted)]">
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
              className="text-base sm:text-sm mt-1 w-full resize-none rounded-xl border border-[var(--sortd-border)] px-3 py-2 min-h-11 bg-[var(--sortd-card)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sortd-teal-dark)]"
            />
          </label>
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-[var(--sortd-border)] p-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-medium text-[var(--sortd-text-muted)] min-h-11 min-w-11 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sortd-teal-dark)]"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!draft.name.trim()}
            onClick={() => {
              if (!draft.name.trim()) return;
              onSave({ ...draft, name: draft.name.trim() });
              onClose();
            }}
            className="rounded-xl bg-[var(--sortd-teal-dark)] px-5 py-2 text-sm font-semibold text-white min-h-11 min-w-11 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sortd-teal-dark)]"
          >
            Save meal
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

"use client";

import {
  useEffect,
} from "react";

import {
  ShoppingCategory,
  ShoppingIntent,
  ShoppingItem,
  ShoppingList,
} from "@/lib/types";

import {
  createPortal,
} from "react-dom";

type CategoryOption = {
  value: ShoppingCategory;
  label: string;
};

type ShoppingItemWithList =
  ShoppingItem & {
    listId: string;
    listName: string;
  };

type ShoppingItemModalProps = {
  item: ShoppingItemWithList;

  shoppingLists: ShoppingList[];

  categories: CategoryOption[];

  onChange: (
    updates:
      Partial<ShoppingItem>
  ) => void;

  onMove: (
    destinationListId: string
  ) => void;

  onDelete: () => void;

  onClose: () => void;
};

export default function ShoppingItemModal({
  item,
  shoppingLists,
  categories,
  onChange,
  onMove,
  onDelete,
  onClose,
}: ShoppingItemModalProps) {
  useEffect(() => {
    function handleKeyDown(
      event: KeyboardEvent
    ) {
      if (
        event.key === "Escape"
      ) {
        onClose();
      }
    }

    const previousOverflow =
      document.body.style
        .overflow;

    document.body.style.overflow =
      "hidden";

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    onClose,
  ]);

  const fieldClassName =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#cd6ce7] focus:ring-2 focus:ring-[#cd6ce7]/20";

  const labelClassName =
    "flex flex-col gap-1.5 text-xs font-medium text-slate-600";

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
      onMouseDown={(
        event
      ) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="shopping-item-title"
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl md:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9d3db7]">
              Shopping item
            </p>

            <h2
              id="shopping-item-title"
              className="mt-1 text-2xl font-semibold text-slate-950"
            >
              Item details
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Keep the list quick; edit the detail here.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close item details"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
          >
            ×
          </button>
        </div>

        <div className="mt-6 space-y-5">
          <label
            className={
              labelClassName
            }
          >
            Item

            <input
              value={
                item.title
              }
              onChange={(
                event
              ) =>
                onChange({
                  title:
                    event.target
                      .value,
                })
              }
              className={
                fieldClassName
              }
            />
          </label>

          <label
            className={
              labelClassName
            }
          >
            Shopping list

            <select
              value={
                item.listId
              }
              onChange={(
                event
              ) => {
                if (
                  event.target
                    .value !==
                  item.listId
                ) {
                  onMove(
                    event.target
                      .value
                  );
                }
              }}
              className={
                fieldClassName
              }
            >
              {shoppingLists.map(
                (list) => (
                  <option
                    key={
                      list.id
                    }
                    value={
                      list.id
                    }
                  >
                    {list.name}
                  </option>
                )
              )}
            </select>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label
              className={
                labelClassName
              }
            >
              Need or want?

              <select
                value={
                  item.intent ??
                  "need"
                }
                onChange={(
                  event
                ) =>
                  onChange({
                    intent:
                      event.target
                        .value as ShoppingIntent,
                  })
                }
                className={
                  fieldClassName
                }
              >
                <option value="need">
                  Need
                </option>

                <option value="want">
                  Want
                </option>
              </select>
            </label>

            <label
              className={
                labelClassName
              }
            >
              Quantity

              <input
                value={
                  item.quantity ??
                  ""
                }
                onChange={(
                  event
                ) =>
                  onChange({
                    quantity:
                      event.target
                        .value ||
                      undefined,
                  })
                }
                placeholder="e.g. 2"
                className={
                  fieldClassName
                }
              />
            </label>

            <label
              className={
                labelClassName
              }
            >
              Shop

              <input
                value={
                  item.shop ??
                  ""
                }
                onChange={(
                  event
                ) =>
                  onChange({
                    shop:
                      event.target
                        .value ||
                      undefined,
                  })
                }
                placeholder="e.g. Aldi"
                className={
                  fieldClassName
                }
              />
            </label>

            <label
              className={
                labelClassName
              }
            >
              Category

              <select
                value={
                  item.category
                }
                onChange={(
                  event
                ) =>
                  onChange({
                    category:
                      event.target
                        .value as ShoppingCategory,
                  })
                }
                className={
                  fieldClassName
                }
              >
                {categories.map(
                  (category) => (
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

            <label
              className={
                labelClassName
              }
            >
              Estimated cost

              <div className="flex items-center rounded-xl border border-slate-200 bg-white px-3 focus-within:border-[#cd6ce7] focus-within:ring-2 focus-within:ring-[#cd6ce7]/20">
                <span className="text-sm text-slate-400">
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
                      event.target
                        .value;

                    onChange({
                      estimatedCost:
                        value
                          ? Math.max(
                              0,
                              Number(
                                value
                              )
                            )
                          : undefined,
                    });
                  }}
                  placeholder="0.00"
                  className="min-w-0 flex-1 bg-transparent px-1 py-2.5 text-sm outline-none"
                />
              </div>
            </label>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Purchase status
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {item.purchased
                    ? "This item is marked as bought."
                    : "This item is still on your shopping list."}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  onChange({
                    purchased:
                      !item.purchased,
                  })
                }
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                {item.purchased
                  ? "Mark remaining"
                  : "Mark bought"}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
          <button
            type="button"
            onClick={
              onDelete
            }
            className="rounded-xl px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            Delete item
          </button>

          <button
            type="button"
            onClick={
              onClose
            }
            className="rounded-xl bg-[#1f0825] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#3b0842]"
          >
            Done
          </button>
        </div>
      </section>
    </div>,
    document.body
  );
}

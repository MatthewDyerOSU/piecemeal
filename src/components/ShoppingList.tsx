"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { ShoppingListItem } from "@/types/shopping";
import {
  addShoppingItem,
  clearCheckedShoppingItems,
  deleteShoppingItem,
  setShoppingItemChecked,
  updateShoppingItem,
} from "@/app/shopping-list/actions";

export default function ShoppingList({
  initialItems,
}: {
  initialItems: ShoppingListItem[];
}) {
  const [items, setItems] = useState(initialItems);
  const [draft, setDraft] = useState("");
  // View mode is a clean checklist for the store; edit mode reveals the
  // per-item Edit/Remove controls.
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [, startTransition] = useTransition();

  const addInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (editingId) {
      editInputRef.current?.focus();
    }
  }, [editingId]);

  function addItem() {
    const text = draft.trim();
    if (!text) {
      return;
    }
    // Optimistic temp row; server revalidation reconciles the real id.
    const temp: ShoppingListItem = {
      id: `temp-${Date.now()}`,
      user_id: "",
      text,
      checked: false,
      created_at: new Date().toISOString(),
    };
    setItems((previous) => [...previous, temp]);
    setDraft("");
    setAnnouncement(`Added ${text}.`);
    addInputRef.current?.focus();
    startTransition(() => addShoppingItem(text));
  }

  function toggle(item: ShoppingListItem) {
    const checked = !item.checked;
    setItems((previous) =>
      previous.map((i) => (i.id === item.id ? { ...i, checked } : i))
    );
    startTransition(() => setShoppingItemChecked(item.id, checked));
  }

  function remove(item: ShoppingListItem) {
    setItems((previous) => previous.filter((i) => i.id !== item.id));
    setAnnouncement(`Removed ${item.text}.`);
    startTransition(() => deleteShoppingItem(item.id));
  }

  function saveEdit(item: ShoppingListItem) {
    const text = editDraft.trim();
    if (!text) {
      return;
    }
    setItems((previous) =>
      previous.map((i) => (i.id === item.id ? { ...i, text } : i))
    );
    setEditingId(null);
    setAnnouncement(`Updated to ${text}.`);
    startTransition(() => updateShoppingItem(item.id, text));
  }

  function clearChecked() {
    setItems((previous) => previous.filter((i) => !i.checked));
    setAnnouncement("Cleared checked items.");
    startTransition(() => clearCheckedShoppingItems());
  }

  const checkedCount = items.filter((i) => i.checked).length;

  return (
    <>
      <div className="field">
        <label htmlFor="shopping-add">Add an item</label>
        <div className="item-entry">
          <input
            ref={addInputRef}
            type="text"
            id="shopping-add"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addItem();
              }
            }}
            autoComplete="off"
          />
          <button
            type="button"
            className="button button-secondary"
            onClick={addItem}
          >
            Add item
          </button>
        </div>
      </div>

      <p aria-live="polite" className="visually-hidden">
        {announcement}
      </p>

      {items.length === 0 ? (
        <p>
          Your shopping list is empty. Add an item above, or open a recipe
          and choose “Add to shopping list”.
        </p>
      ) : (
        <>
          <div className="shopping-toolbar">
            <p className="muted shopping-count">
              {checkedCount} of {items.length} checked
            </p>
            <button
              type="button"
              className="button button-secondary button-compact"
              aria-pressed={editMode}
              onClick={() => {
                const next = !editMode;
                setEditMode(next);
                setEditingId(null);
                setAnnouncement(
                  next
                    ? "Editing the list. Each item now has edit and remove buttons."
                    : "Finished editing the list."
                );
              }}
            >
              {editMode ? "Done editing" : "Edit list"}
            </button>
          </div>
          <ul className={editMode ? "shopping-list is-editing" : "shopping-list"}>
            {items.map((item) => (
              <li key={item.id}>
                {editingId === item.id ? (
                  <span className="item-row item-row-editing">
                    <input
                      ref={editInputRef}
                      type="text"
                      value={editDraft}
                      onChange={(event) => setEditDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          saveEdit(item);
                        } else if (event.key === "Escape") {
                          event.preventDefault();
                          setEditingId(null);
                        }
                      }}
                      aria-label={`Edit ${item.text}`}
                      autoComplete="off"
                    />
                    <span className="item-actions">
                      <button
                        type="button"
                        className="button button-secondary button-compact"
                        onClick={() => saveEdit(item)}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className="button button-secondary button-compact"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                    </span>
                  </span>
                ) : editMode ? (
                  <span className="item-row shopping-edit-row">
                    <span
                      className={
                        item.checked ? "shopping-text is-checked" : "shopping-text"
                      }
                    >
                      {item.text}
                    </span>
                    <span className="item-actions">
                      <button
                        type="button"
                        className="button button-secondary button-compact"
                        onClick={() => {
                          setEditingId(item.id);
                          setEditDraft(item.text);
                        }}
                      >
                        Edit<span className="visually-hidden"> {item.text}</span>
                      </button>
                      <button
                        type="button"
                        className="button button-danger button-compact"
                        onClick={() => remove(item)}
                      >
                        Remove<span className="visually-hidden"> {item.text}</span>
                      </button>
                    </span>
                  </span>
                ) : (
                  <label className="shopping-check">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => toggle(item)}
                    />
                    <span
                      className={
                        item.checked ? "shopping-text is-checked" : "shopping-text"
                      }
                    >
                      {item.text}
                    </span>
                  </label>
                )}
              </li>
            ))}
          </ul>

          <div className="shopping-actions">
            {checkedCount > 0 ? (
              <button
                type="button"
                className="button button-secondary"
                onClick={clearChecked}
              >
                Clear {checkedCount} checked
              </button>
            ) : null}
          </div>
        </>
      )}
    </>
  );
}

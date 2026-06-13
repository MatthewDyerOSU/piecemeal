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
import { buildChecklistText, buildRemindersIcs } from "@/lib/shoppingExport";

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function ShoppingList({
  initialItems,
}: {
  initialItems: ShoppingListItem[];
}) {
  const [items, setItems] = useState(initialItems);
  const [draft, setDraft] = useState("");
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
          <ul className="shopping-list">
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
                ) : (
                  <span className="item-row">
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

          <section aria-labelledby="export-heading" className="export-section">
            <h2 className="eyebrow" id="export-heading">
              Export
            </h2>
            <p className="field-help">
              Take the list to the store. Check items off in the browser
              above, or use your phone&apos;s own app:
            </p>
            <div className="shopping-actions">
              <button
                type="button"
                className="button button-secondary"
                onClick={() =>
                  download(
                    "shopping-list.ics",
                    buildRemindersIcs(items),
                    "text/calendar"
                  )
                }
              >
                Apple Reminders (.ics)
              </button>
              <button
                type="button"
                className="button button-secondary"
                onClick={() =>
                  download(
                    "shopping-list.txt",
                    buildChecklistText(items),
                    "text/plain"
                  )
                }
              >
                Checklist text (.txt)
              </button>
            </div>
            <p className="field-help">
              The .ics opens in Reminders on iPhone as tappable checkboxes.
              The .txt opens in Apple Notes or Samsung Notes; both can turn
              it into a checklist.
            </p>
          </section>
        </>
      )}
    </>
  );
}

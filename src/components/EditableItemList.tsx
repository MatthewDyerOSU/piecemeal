"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  items: string[];
  /** Render as a numbered list (steps) instead of bullets. */
  ordered?: boolean;
  /** Optional form field name; when set, items submit as hidden inputs. */
  name?: string;
  /** Receives the updated list plus a screen-reader announcement for the
      parent's live region. */
  onChange: (next: string[], announcement: string) => void;
  /** Called after the last item is removed, so the parent can move focus
      back to its entry field. */
  onEmpty?: () => void;
};

/**
 * The committed-items list shared by the ingredient and step editors:
 * each row shows its text with Edit and Remove buttons; Edit swaps the
 * row for an inline input with Save/Cancel (Enter saves, Escape cancels).
 * Focus returns to the row's Edit button after saving or cancelling.
 */
export default function EditableItemList({
  items,
  ordered = false,
  name,
  onChange,
  onEmpty,
}: Props) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [editError, setEditError] = useState(false);
  const editInputRef = useRef<HTMLInputElement | null>(null);
  const editButtons = useRef(new Map<number, HTMLButtonElement>());
  const pendingButtonFocus = useRef<number | null>(null);

  useEffect(() => {
    if (editingIndex !== null) {
      editInputRef.current?.focus();
    }
  }, [editingIndex]);

  useEffect(() => {
    if (pendingButtonFocus.current !== null) {
      editButtons.current.get(pendingButtonFocus.current)?.focus();
      pendingButtonFocus.current = null;
    }
  });

  if (items.length === 0) {
    return null;
  }

  function startEdit(index: number) {
    setEditingIndex(index);
    setDraft(items[index]);
    setEditError(false);
  }

  function cancelEdit() {
    pendingButtonFocus.current = editingIndex;
    setEditingIndex(null);
    setEditError(false);
  }

  function saveEdit() {
    if (editingIndex === null) {
      return;
    }
    const value = draft.trim();
    if (!value) {
      setEditError(true);
      editInputRef.current?.focus();
      return;
    }
    onChange(
      items.map((item, i) => (i === editingIndex ? value : item)),
      `Updated to ${value}.`
    );
    pendingButtonFocus.current = editingIndex;
    setEditingIndex(null);
    setEditError(false);
  }

  function remove(index: number) {
    const next = items.filter((_, i) => i !== index);
    onChange(next, `Removed ${items[index]}.`);
    if (editingIndex === index) {
      setEditingIndex(null);
    }
    if (next.length === 0) {
      onEmpty?.();
    } else {
      pendingButtonFocus.current = Math.min(index, next.length - 1);
    }
  }

  const ListTag = ordered ? "ol" : "ul";

  return (
    <ListTag className="item-list">
      {items.map((item, index) => (
        <li key={`${index}-${item}`}>
          {editingIndex === index ? (
            <>
              <span className="item-row item-row-editing">
                <input
                  ref={editInputRef}
                  type="text"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      saveEdit();
                    } else if (event.key === "Escape") {
                      event.preventDefault();
                      cancelEdit();
                    }
                  }}
                  aria-label={`Edit ${item}`}
                  aria-invalid={editError ? true : undefined}
                  autoComplete="off"
                />
                <span className="item-actions">
                  <button
                    type="button"
                    className="button button-secondary button-compact"
                    onClick={saveEdit}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="button button-secondary button-compact"
                    onClick={cancelEdit}
                  >
                    Cancel
                  </button>
                </span>
              </span>
              {editError ? (
                <p role="alert" className="field-error">
                  Enter a value, or cancel the edit.
                </p>
              ) : null}
            </>
          ) : (
            <span className="item-row">
              <span className="item-text">{item}</span>
              <span className="item-actions">
                <button
                  ref={(element) => {
                    if (element) {
                      editButtons.current.set(index, element);
                    } else {
                      editButtons.current.delete(index);
                    }
                  }}
                  type="button"
                  className="button button-secondary button-compact"
                  onClick={() => startEdit(index)}
                >
                  Edit<span className="visually-hidden"> {item}</span>
                </button>
                <button
                  type="button"
                  className="button button-danger button-compact"
                  onClick={() => remove(index)}
                >
                  Remove<span className="visually-hidden"> {item}</span>
                </button>
              </span>
            </span>
          )}
          {name ? <input type="hidden" name={name} value={item} /> : null}
        </li>
      ))}
    </ListTag>
  );
}

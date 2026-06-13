"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { HoneyDo } from "@/types/honeyDo";
import {
  addHoneyDo,
  clearCheckedHoneyDos,
  deleteHoneyDo,
  setHoneyDoChecked,
  updateHoneyDo,
} from "@/app/honey-dos/actions";

export default function HoneyDos({
  householdId,
  initialItems,
}: {
  householdId: string;
  initialItems: HoneyDo[];
}) {
  const [items, setItems] = useState(initialItems);
  const [draft, setDraft] = useState("");
  const [draftGroup, setDraftGroup] = useState("");
  // View mode is a clean checklist; edit mode reveals per-item controls
  // and hides the checkboxes.
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editGroup, setEditGroup] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [, startTransition] = useTransition();

  const addInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (editingId) {
      editInputRef.current?.focus();
    }
  }, [editingId]);

  // Group the items: named groups alphabetically, then any ungrouped
  // items under "Other". Headings only appear once at least one group is
  // named, so a plain list (no groups) stays flat.
  const { groups, showHeadings, groupNames } = useMemo(() => {
    const map = new Map<string, HoneyDo[]>();
    for (const item of items) {
      const key = item.group_name ?? "";
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(item);
    }
    const named = [...map.keys()]
      .filter((key) => key !== "")
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
    const ordered = named.map((key) => ({
      key,
      label: key,
      items: map.get(key)!,
    }));
    if (map.has("")) {
      ordered.push({ key: "", label: "Other", items: map.get("")! });
    }
    return {
      groups: ordered,
      showHeadings: named.length > 0,
      groupNames: named,
    };
  }, [items]);

  function addItem() {
    const text = draft.trim();
    if (!text) {
      return;
    }
    const group = draftGroup.trim();
    const temp: HoneyDo = {
      id: `temp-${Date.now()}`,
      household_id: householdId,
      group_name: group,
      text,
      checked: false,
      created_at: new Date().toISOString(),
    };
    setItems((previous) => [...previous, temp]);
    setDraft("");
    setAnnouncement(`Added ${text}${group ? ` to ${group}` : ""}.`);
    addInputRef.current?.focus();
    startTransition(() => addHoneyDo(householdId, text, group));
  }

  function toggle(item: HoneyDo) {
    const checked = !item.checked;
    setItems((previous) =>
      previous.map((i) => (i.id === item.id ? { ...i, checked } : i))
    );
    startTransition(() => setHoneyDoChecked(item.id, checked));
  }

  function remove(item: HoneyDo) {
    setItems((previous) => previous.filter((i) => i.id !== item.id));
    setAnnouncement(`Removed ${item.text}.`);
    startTransition(() => deleteHoneyDo(item.id));
  }

  function startEdit(item: HoneyDo) {
    setEditingId(item.id);
    setEditText(item.text);
    setEditGroup(item.group_name);
  }

  function saveEdit(item: HoneyDo) {
    const text = editText.trim();
    if (!text) {
      return;
    }
    const group = editGroup.trim();
    setItems((previous) =>
      previous.map((i) =>
        i.id === item.id ? { ...i, text, group_name: group } : i
      )
    );
    setEditingId(null);
    setAnnouncement(`Updated ${text}.`);
    startTransition(() => updateHoneyDo(item.id, text, group));
  }

  function clearChecked() {
    setItems((previous) => previous.filter((i) => !i.checked));
    setAnnouncement("Cleared checked items.");
    startTransition(() => clearCheckedHoneyDos(householdId));
  }

  const checkedCount = items.filter((i) => i.checked).length;

  function renderItem(item: HoneyDo) {
    if (editingId === item.id) {
      return (
        <div className="item-row item-row-editing honeydo-edit-fields">
          <input
            ref={editInputRef}
            type="text"
            value={editText}
            onChange={(event) => setEditText(event.target.value)}
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
          <input
            type="text"
            value={editGroup}
            onChange={(event) => setEditGroup(event.target.value)}
            list="honeydo-groups"
            aria-label={`Group for ${item.text}`}
            placeholder="Group (optional)"
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
        </div>
      );
    }

    if (editMode) {
      return (
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
              onClick={() => startEdit(item)}
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
      );
    }

    return (
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
    );
  }

  return (
    <>
      <div className="field honeydo-add">
        <div className="honeydo-add-fields">
          <div className="honeydo-add-text">
            <label htmlFor="honeydo-add-input">Add an item</label>
            <input
              ref={addInputRef}
              type="text"
              id="honeydo-add-input"
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
          </div>
          <div className="honeydo-add-group">
            <label htmlFor="honeydo-add-group-input">Group (optional)</label>
            <input
              type="text"
              id="honeydo-add-group-input"
              value={draftGroup}
              onChange={(event) => setDraftGroup(event.target.value)}
              list="honeydo-groups"
              placeholder="e.g. a name or project"
              autoComplete="off"
            />
          </div>
        </div>
        <button
          type="button"
          className="button button-secondary"
          onClick={addItem}
        >
          Add item
        </button>
      </div>

      <datalist id="honeydo-groups">
        {groupNames.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>

      <p aria-live="polite" className="visually-hidden">
        {announcement}
      </p>

      {items.length === 0 ? (
        <p>This list is empty. Add an item above to get started.</p>
      ) : (
        <>
          <div className="shopping-toolbar">
            <p className="muted shopping-count">
              {checkedCount} of {items.length} done
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
              {editMode ? "Done editing" : "Edit honey-dos"}
            </button>
          </div>

          {groups.map((group) => (
            <section
              key={group.key || "ungrouped"}
              aria-label={showHeadings ? group.label : undefined}
            >
              {showHeadings ? (
                <h2 className="eyebrow honeydo-group-heading">
                  {group.label}
                </h2>
              ) : null}
              <ul
                className={editMode ? "shopping-list is-editing" : "shopping-list"}
              >
                {group.items.map((item) => (
                  <li key={item.id}>{renderItem(item)}</li>
                ))}
              </ul>
            </section>
          ))}

          {checkedCount > 0 ? (
            <div className="shopping-actions">
              <button
                type="button"
                className="button button-secondary"
                onClick={clearChecked}
              >
                Clear {checkedCount} done
              </button>
            </div>
          ) : null}
        </>
      )}
    </>
  );
}

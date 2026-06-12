"use client";

import { useId, useRef, useState } from "react";
import type { IngredientGroup } from "@/types/recipe";

type GroupState = {
  key: number;
  name: string;
  items: string[];
  draft: string;
};

/**
 * Ingredient entry with optional named groups (e.g. "Salmon" / "Avocado
 * salsa"). Starts as a single unnamed group, which renders and saves as a
 * plain ingredient list; "Add ingredient group" introduces named sections.
 *
 * The full structure is submitted as JSON in a hidden `ingredients-json`
 * field (including any typed-but-not-added drafts, so nothing is lost on
 * save). Without JavaScript the first group's text box still submits as
 * `ingredients-draft`, which the server comma-splits into a single group.
 */
export default function IngredientGroupsEditor({ error }: { error?: string }) {
  const id = useId();
  const nextKey = useRef(1);
  const [groups, setGroups] = useState<GroupState[]>([
    { key: 0, name: "", items: [], draft: "" },
  ]);
  const [lastAddedGroup, setLastAddedGroup] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const itemInputRefs = useRef(new Map<number, HTMLInputElement>());

  const serialized: IngredientGroup[] = groups
    .map((group) => ({
      name: group.name.trim(),
      items: [
        ...group.items,
        ...(group.draft.trim() ? [group.draft.trim()] : []),
      ],
    }))
    .filter((group) => group.items.length > 0);

  function update(key: number, patch: Partial<GroupState>) {
    setGroups((previous) =>
      previous.map((group) =>
        group.key === key ? { ...group, ...patch } : group
      )
    );
  }

  function groupLabel(group: GroupState, index: number): string {
    return group.name.trim() || `group ${index + 1}`;
  }

  function addItem(key: number) {
    const group = groups.find((g) => g.key === key);
    if (!group) {
      return;
    }
    const value = group.draft.trim();
    if (!value) {
      return;
    }
    update(key, { items: [...group.items, value], draft: "" });
    setAnnouncement(`Added ${value}.`);
    itemInputRefs.current.get(key)?.focus();
  }

  function removeItem(key: number, index: number) {
    const group = groups.find((g) => g.key === key);
    if (!group) {
      return;
    }
    setAnnouncement(`Removed ${group.items[index]}.`);
    update(key, { items: group.items.filter((_, i) => i !== index) });
    itemInputRefs.current.get(key)?.focus();
  }

  function addGroup() {
    const key = nextKey.current++;
    setGroups((previous) => [
      ...previous,
      { key, name: "", items: [], draft: "" },
    ]);
    setLastAddedGroup(key);
    setAnnouncement("Added ingredient group.");
  }

  function removeGroup(key: number, index: number) {
    const group = groups.find((g) => g.key === key);
    if (!group) {
      return;
    }
    setAnnouncement(`Removed ${groupLabel(group, index)}.`);
    setGroups((previous) => previous.filter((g) => g.key !== key));
  }

  const grouped = groups.length > 1;

  return (
    <fieldset className="field">
      <legend>Ingredients</legend>
      <p className="field-help" id={`${id}-help`}>
        Add ingredients one at a time. For example: 2 cups flour. Use
        ingredient groups when parts of the recipe have their own
        ingredients, like a sauce or a salsa.
      </p>
      {error ? (
        <p id={`${id}-error`} role="alert" className="field-error">
          {error}
        </p>
      ) : null}
      <p aria-live="polite" className="visually-hidden">
        {announcement}
      </p>

      <input
        type="hidden"
        name="ingredients-json"
        value={JSON.stringify(serialized)}
      />

      {groups.map((group, index) => {
        // Keep the name field visible for a lone group that already has a
        // name (e.g. after deleting the other groups) so the name is never
        // invisible state.
        const showHeader = grouped || group.name.trim() !== "";
        return (
        <fieldset
          key={group.key}
          className={showHeader ? "ingredient-group" : "ingredient-group-plain"}
        >
          <legend className="visually-hidden">
            Ingredient {groupLabel(group, index)}
          </legend>

          {showHeader ? (
            <div className="group-header">
              <div className="group-name">
                <label htmlFor={`${id}-g${group.key}-name`}>
                  Group name (optional)
                </label>
                <input
                  type="text"
                  id={`${id}-g${group.key}-name`}
                  value={group.name}
                  onChange={(event) =>
                    update(group.key, { name: event.target.value })
                  }
                  autoComplete="off"
                  autoFocus={group.key === lastAddedGroup}
                  placeholder=""
                />
              </div>
              <button
                type="button"
                className="button button-danger button-compact"
                onClick={() => removeGroup(group.key, index)}
              >
                Remove group
                <span className="visually-hidden">
                  {" "}
                  {groupLabel(group, index)}
                </span>
              </button>
            </div>
          ) : null}

          <label htmlFor={`${id}-g${group.key}-item`}>
            {showHeader ? "Ingredient" : "Add an ingredient"}
          </label>
          <div className="item-entry">
            <input
              ref={(element) => {
                if (element) {
                  itemInputRefs.current.set(group.key, element);
                } else {
                  itemInputRefs.current.delete(group.key);
                }
              }}
              type="text"
              id={`${id}-g${group.key}-item`}
              name={index === 0 ? "ingredients-draft" : undefined}
              value={group.draft}
              onChange={(event) =>
                update(group.key, { draft: event.target.value })
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addItem(group.key);
                }
              }}
              aria-describedby={
                error ? `${id}-help ${id}-error` : `${id}-help`
              }
              aria-invalid={error ? true : undefined}
              autoComplete="off"
            />
            <button
              type="button"
              className="button button-secondary"
              onClick={() => addItem(group.key)}
            >
              Add ingredient
              {grouped ? (
                <span className="visually-hidden">
                  {" "}
                  to {groupLabel(group, index)}
                </span>
              ) : null}
            </button>
          </div>

          {group.items.length > 0 ? (
            <ul className="item-list">
              {group.items.map((item, itemIndex) => (
                <li key={`${itemIndex}-${item}`}>
                  <span className="item-row">
                    <span className="item-text">{item}</span>
                    <button
                      type="button"
                      className="button button-danger button-compact"
                      onClick={() => removeItem(group.key, itemIndex)}
                    >
                      Remove<span className="visually-hidden"> {item}</span>
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </fieldset>
        );
      })}

      <button
        type="button"
        className="button button-secondary"
        onClick={addGroup}
      >
        Add ingredient group
      </button>
    </fieldset>
  );
}

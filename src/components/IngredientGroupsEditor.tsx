"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { IngredientGroup } from "@/types/recipe";
import PasteList, { PastePanel } from "./PasteList";
import EditableItemList from "./EditableItemList";

type GroupStatus =
  | "naming" // name not locked in yet; only the name field shows
  | "open" // name locked; adding ingredients
  | "done"; // collapsed summary with an Edit button

type GroupState = {
  key: number;
  name: string;
  nameDraft: string;
  renaming: boolean;
  nameError: string | null;
  items: string[];
  itemDraft: string;
  status: GroupStatus;
};

/**
 * Ingredient entry with optional named groups, one group at a time:
 * name the group and lock it in, add its ingredients, then mark the group
 * done — it collapses to a summary that can be reopened with Edit.
 * Ungrouped ingredients live in the always-visible base list on top.
 *
 * The full structure is submitted as JSON in a hidden `ingredients-json`
 * field (drafts included, so nothing typed is lost on save). Without
 * JavaScript the base text box still submits as `ingredients-draft`,
 * which the server comma-splits into a single unnamed group.
 */
export default function IngredientGroupsEditor({
  error,
  inputId,
  onHasIngredientsChange,
  initialGroups,
}: {
  error?: string;
  /** Stable id for the base ingredient input so the form's error summary
      can move focus to it. */
  inputId?: string;
  /** Reports whether the editor currently holds at least one ingredient
      (committed or drafted), so the form can clear the requirement error
      live once it is satisfied. */
  onHasIngredientsChange?: (hasIngredients: boolean) => void;
  /** Pre-fills the editor when editing an existing recipe: unnamed groups
      become the base list, named groups start in their collapsed "done"
      state. */
  initialGroups?: IngredientGroup[];
}) {
  const id = useId();
  const initialNamed = (initialGroups ?? []).filter((group) => group.name);
  const nextKey = useRef(initialNamed.length + 1);
  const [baseItems, setBaseItems] = useState<string[]>(() =>
    (initialGroups ?? [])
      .filter((group) => !group.name)
      .flatMap((group) => group.items)
  );
  const [baseDraft, setBaseDraft] = useState("");
  const [basePasteOpen, setBasePasteOpen] = useState(false);
  const [groups, setGroups] = useState<GroupState[]>(() =>
    initialNamed.map((group, index) => ({
      key: index + 1,
      name: group.name,
      nameDraft: group.name,
      renaming: false,
      nameError: null,
      items: [...group.items],
      itemDraft: "",
      status: "done",
    }))
  );
  const [announcement, setAnnouncement] = useState("");
  const baseInputId = inputId ?? `${id}-base-item`;

  // After-render focus management: actions register a target element key
  // here, and the effect below focuses it once it exists.
  const focusTarget = useRef<string | null>(null);
  const focusables = useRef(new Map<string, HTMLElement>());
  useEffect(() => {
    if (focusTarget.current) {
      focusables.current.get(focusTarget.current)?.focus();
      focusTarget.current = null;
    }
  });

  function register(key: string) {
    return (element: HTMLElement | null) => {
      if (element) {
        focusables.current.set(key, element);
      } else {
        focusables.current.delete(key);
      }
    };
  }

  function requestFocus(key: string) {
    focusTarget.current = key;
  }

  const serialized: IngredientGroup[] = [
    {
      name: "",
      items: [
        ...baseItems,
        ...(baseDraft.trim() ? [baseDraft.trim()] : []),
      ],
    },
    ...groups.map((group) => ({
      name: group.name.trim(),
      items: [
        ...group.items,
        ...(group.itemDraft.trim() ? [group.itemDraft.trim()] : []),
      ],
    })),
  ].filter((group) => group.items.length > 0);

  const hasIngredients = serialized.length > 0;
  useEffect(() => {
    onHasIngredientsChange?.(hasIngredients);
    // The callback is a state setter with stable identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasIngredients]);

  function update(key: number, patch: Partial<GroupState>) {
    setGroups((previous) =>
      previous.map((group) =>
        group.key === key ? { ...group, ...patch } : group
      )
    );
  }

  function addBaseItem() {
    const value = baseDraft.trim();
    if (!value) {
      return;
    }
    setBaseItems((previous) => [...previous, value]);
    setBaseDraft("");
    setAnnouncement(`Added ${value}.`);
    requestFocus("base-item");
  }

  function addGroup() {
    const key = nextKey.current++;
    setGroups((previous) => [
      ...previous,
      {
        key,
        name: "",
        nameDraft: "",
        renaming: false,
        nameError: null,
        items: [],
        itemDraft: "",
        status: "naming",
      },
    ]);
    setAnnouncement("New ingredient group. Enter its name.");
    requestFocus(`name-${key}`);
  }

  function lockName(group: GroupState) {
    const name = group.nameDraft.trim();
    if (!name) {
      update(group.key, { nameError: "Enter a group name." });
      requestFocus(`name-${group.key}`);
      return;
    }
    update(group.key, {
      name,
      nameDraft: name,
      nameError: null,
      renaming: false,
      status: group.status === "naming" ? "open" : group.status,
    });
    setAnnouncement(`Group ${name} set. Add its ingredients.`);
    requestFocus(`item-${group.key}`);
  }

  function startRename(group: GroupState) {
    update(group.key, { renaming: true, nameDraft: group.name });
    requestFocus(`name-${group.key}`);
  }

  function addItem(group: GroupState) {
    const value = group.itemDraft.trim();
    if (!value) {
      return;
    }
    update(group.key, { items: [...group.items, value], itemDraft: "" });
    setAnnouncement(`Added ${value} to ${group.name}.`);
    requestFocus(`item-${group.key}`);
  }

  function finishGroup(group: GroupState) {
    const items = [
      ...group.items,
      ...(group.itemDraft.trim() ? [group.itemDraft.trim()] : []),
    ];
    if (items.length === 0) {
      setAnnouncement(`Group ${group.name} was empty and was removed.`);
      setGroups((previous) => previous.filter((g) => g.key !== group.key));
    } else {
      update(group.key, { items, itemDraft: "", status: "done" });
      setAnnouncement(`Group ${group.name} saved.`);
    }
    requestFocus("add-group");
  }

  function reopenGroup(group: GroupState) {
    update(group.key, { status: "open" });
    setAnnouncement(`Editing group ${group.name}.`);
    requestFocus(`item-${group.key}`);
  }

  function removeGroup(group: GroupState) {
    setAnnouncement(`Removed group ${group.name || "without a name"}.`);
    setGroups((previous) => previous.filter((g) => g.key !== group.key));
    requestFocus("add-group");
  }

  return (
    <fieldset className="field">
      <legend>
        Ingredients <span aria-hidden="true">*</span>
      </legend>
      <p className="field-help" id={`${id}-help`}>
        Add ingredients one at a time. For example: 2 cups flour. If parts
        of the recipe have their own ingredients, like a sauce or a salsa,
        add an ingredient group for each part.
      </p>
      <p aria-live="polite" className="visually-hidden">
        {announcement}
      </p>

      <input
        type="hidden"
        name="ingredients-json"
        value={JSON.stringify(serialized)}
      />

      <div className="ingredient-group-plain">
        <label htmlFor={baseInputId}>
          {groups.length > 0 ? "Ungrouped ingredients" : "Add an ingredient"}
        </label>
        {error ? (
          <p id={`${baseInputId}-error`} className="field-error">
            {error}
          </p>
        ) : null}
        <div className="item-entry">
          <input
            ref={register("base-item")}
            type="text"
            id={baseInputId}
            name="ingredients-draft"
            aria-required="true"
            value={baseDraft}
            onChange={(event) => setBaseDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addBaseItem();
              }
            }}
            aria-describedby={
              error ? `${id}-help ${baseInputId}-error` : `${id}-help`
            }
            aria-invalid={error ? true : undefined}
            autoComplete="off"
          />
          <button
            type="button"
            className="button button-secondary"
            onClick={addBaseItem}
          >
            Add ingredient
          </button>
        </div>
        <EditableItemList
          items={baseItems}
          onChange={(next, message) => {
            setBaseItems(next);
            setAnnouncement(message);
          }}
          onEmpty={() => requestFocus("base-item")}
        />
        <div className="editor-actions">
          <button
            ref={register("base-paste-toggle")}
            type="button"
            className="button button-secondary button-compact"
            aria-expanded={basePasteOpen}
            aria-controls={`${id}-base-paste`}
            onClick={() => setBasePasteOpen((previous) => !previous)}
          >
            {basePasteOpen
              ? "Hide pasted ingredients"
              : "Paste a list of ingredients"}
          </button>
          <button
            ref={register("add-group")}
            type="button"
            className="button button-secondary button-compact"
            onClick={addGroup}
          >
            Add ingredient group
          </button>
        </div>
        {basePasteOpen ? (
          <div id={`${id}-base-paste`}>
            <PastePanel
              noun="ingredients"
              onAdd={(pasted) => {
                setBaseItems((previous) => [...previous, ...pasted]);
                setAnnouncement(
                  `Added ${pasted.length} ingredient${pasted.length === 1 ? "" : "s"} from pasted text.`
                );
                setBasePasteOpen(false);
                requestFocus("base-paste-toggle");
              }}
            />
          </div>
        ) : null}
      </div>

      {groups.map((group) => (
        <fieldset key={group.key} className="ingredient-group">
          <legend className="visually-hidden">
            Ingredient group{group.name ? `: ${group.name}` : ""}
          </legend>

          {group.status === "naming" || group.renaming ? (
            <div className="group-name">
              <label htmlFor={`${id}-g${group.key}-name`}>Group name</label>
              <div className="item-entry">
                <input
                  ref={register(`name-${group.key}`)}
                  type="text"
                  id={`${id}-g${group.key}-name`}
                  value={group.nameDraft}
                  onChange={(event) =>
                    update(group.key, { nameDraft: event.target.value })
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      lockName(group);
                    }
                  }}
                  aria-invalid={group.nameError ? true : undefined}
                  aria-describedby={
                    group.nameError ? `${id}-g${group.key}-name-error` : undefined
                  }
                  autoComplete="off"
                />
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => lockName(group)}
                >
                  {group.renaming ? "Save name" : "Set group name"}
                </button>
              </div>
              {group.nameError ? (
                <p
                  id={`${id}-g${group.key}-name-error`}
                  role="alert"
                  className="field-error"
                >
                  {group.nameError}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="group-name-display">
              <strong>{group.name}</strong>
              {group.status === "open" ? (
                <button
                  type="button"
                  className="button button-secondary button-compact"
                  onClick={() => startRename(group)}
                >
                  Edit name
                  <span className="visually-hidden"> of {group.name}</span>
                </button>
              ) : null}
            </p>
          )}

          {group.status === "open" ? (
            <>
              <label htmlFor={`${id}-g${group.key}-item`}>Ingredient</label>
              <div className="item-entry">
                <input
                  ref={register(`item-${group.key}`)}
                  type="text"
                  id={`${id}-g${group.key}-item`}
                  value={group.itemDraft}
                  onChange={(event) =>
                    update(group.key, { itemDraft: event.target.value })
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addItem(group);
                    }
                  }}
                  autoComplete="off"
                />
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => addItem(group)}
                >
                  Add ingredient
                  <span className="visually-hidden"> to {group.name}</span>
                </button>
              </div>
              <PasteList
                noun="ingredients"
                onAdd={(pasted) => {
                  update(group.key, { items: [...group.items, ...pasted] });
                  setAnnouncement(
                    `Added ${pasted.length} ingredient${pasted.length === 1 ? "" : "s"} from pasted text to ${group.name}.`
                  );
                }}
              />
            </>
          ) : null}

          {group.status === "open" ? (
            <EditableItemList
              items={group.items}
              onChange={(next, message) => {
                update(group.key, { items: next });
                setAnnouncement(message);
              }}
              onEmpty={() => requestFocus(`item-${group.key}`)}
            />
          ) : group.items.length > 0 ? (
            <ul className="item-list">
              {group.items.map((item, index) => (
                <li key={`${index}-${item}`}>{item}</li>
              ))}
            </ul>
          ) : null}

          <div className="group-actions">
            {group.status === "open" ? (
              <button
                type="button"
                className="button button-secondary"
                onClick={() => finishGroup(group)}
              >
                Done with group
                <span className="visually-hidden"> {group.name}</span>
              </button>
            ) : null}
            {group.status === "done" ? (
              <button
                type="button"
                className="button button-secondary"
                onClick={() => reopenGroup(group)}
              >
                Edit group<span className="visually-hidden"> {group.name}</span>
              </button>
            ) : null}
            <button
              type="button"
              className="button button-danger button-compact"
              onClick={() => removeGroup(group)}
            >
              Remove group
              <span className="visually-hidden">
                {" "}
                {group.name || "without a name"}
              </span>
            </button>
          </div>
        </fieldset>
      ))}

    </fieldset>
  );
}

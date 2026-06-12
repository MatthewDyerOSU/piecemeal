"use client";

import { useId, useRef, useState } from "react";
import PasteList from "./PasteList";

type Props = {
  label: string;
  /** Singular noun for the add button and announcements, e.g. "ingredient". */
  noun: string;
  /** Form field name for the committed items (hidden inputs). The text box
      itself submits as `${name}-draft` so a typed-but-not-added entry is
      never lost and list order is preserved. */
  name: string;
  help: string;
  /** Render the committed items as a numbered list (steps) instead of bullets. */
  ordered?: boolean;
  /** Offer a paste-a-list disclosure for adding many items at once. */
  allowPaste?: boolean;
  error?: string;
  initialItems?: string[];
};

/**
 * One-at-a-time list entry: type an item, press Enter or the add button,
 * and it joins a visible, removable list. Additions and removals are
 * announced to screen readers via a polite live region, and focus returns
 * to the text box after each action.
 */
export default function ItemListEditor({
  label,
  noun,
  name,
  help,
  ordered = false,
  allowPaste = false,
  error,
  initialItems = [],
}: Props) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<string[]>(initialItems);
  const [draft, setDraft] = useState("");
  const [announcement, setAnnouncement] = useState("");

  function addDraft() {
    const value = draft.trim();
    if (!value) {
      return;
    }
    setItems((previous) => [...previous, value]);
    setDraft("");
    setAnnouncement(`Added ${value}.`);
    inputRef.current?.focus();
  }

  function removeAt(index: number) {
    const removed = items[index];
    setItems((previous) => previous.filter((_, i) => i !== index));
    setAnnouncement(`Removed ${removed}.`);
    inputRef.current?.focus();
  }

  const ListTag = ordered ? "ol" : "ul";
  const describedBy = error ? `${id}-help ${id}-error` : `${id}-help`;

  return (
    <div className="field">
      <label htmlFor={`${id}-input`}>{label}</label>
      <p className="field-help" id={`${id}-help`}>
        {help}
      </p>
      <div className="item-entry">
        <input
          ref={inputRef}
          type="text"
          id={`${id}-input`}
          name={`${name}-draft`}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addDraft();
            }
          }}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          autoComplete="off"
        />
        <button
          type="button"
          className="button button-secondary"
          onClick={addDraft}
        >
          Add {noun}
        </button>
      </div>
      {allowPaste ? (
        <PasteList
          noun={`${noun}s`}
          onAdd={(pasted) => {
            setItems((previous) => [...previous, ...pasted]);
            setAnnouncement(
              `Added ${pasted.length} ${pasted.length === 1 ? noun : `${noun}s`} from pasted text.`
            );
          }}
        />
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="field-error">
          {error}
        </p>
      ) : null}
      <p aria-live="polite" className="visually-hidden">
        {announcement}
      </p>
      {items.length > 0 ? (
        <ListTag className="item-list">
          {items.map((item, index) => (
            <li key={`${index}-${item}`}>
              <input type="hidden" name={name} value={item} />
              <span className="item-row">
                <span className="item-text">{item}</span>
                <button
                  type="button"
                  className="button button-danger button-compact"
                  onClick={() => removeAt(index)}
                >
                  Remove<span className="visually-hidden"> {item}</span>
                </button>
              </span>
            </li>
          ))}
        </ListTag>
      ) : null}
    </div>
  );
}

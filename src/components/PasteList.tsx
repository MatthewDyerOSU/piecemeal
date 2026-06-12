"use client";

import { useId, useRef, useState } from "react";
import { parseListLines } from "@/lib/recipes";

/**
 * The expanded paste area: a textarea for a list copied from a document
 * (one item per line; bullets and numbering are stripped) plus an add
 * button. The parent owns the disclosure state and receives the parsed
 * items.
 */
export function PastePanel({
  noun, // plural, e.g. "ingredients" or "steps"
  onAdd,
}: {
  noun: string;
  onAdd: (items: string[]) => void;
}) {
  const id = useId();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function add() {
    const items = parseListLines(text);
    if (items.length === 0) {
      setError(`Paste ${noun}, one per line, then add them.`);
      textareaRef.current?.focus();
      return;
    }
    setError(null);
    setText("");
    onAdd(items);
  }

  return (
    <div className="paste-panel">
      <label htmlFor={`${id}-text`}>Pasted {noun}</label>
      <p className="field-help" id={`${id}-text-help`}>
        One per line. Bullets and numbering are removed automatically.
      </p>
      <textarea
        ref={textareaRef}
        id={`${id}-text`}
        rows={6}
        value={text}
        onChange={(event) => setText(event.target.value)}
        aria-describedby={
          error ? `${id}-text-help ${id}-text-error` : `${id}-text-help`
        }
        aria-invalid={error ? true : undefined}
        autoFocus
      />
      {error ? (
        <p id={`${id}-text-error`} role="alert" className="field-error">
          {error}
        </p>
      ) : null}
      <p>
        <button type="button" className="button button-secondary" onClick={add}>
          Add pasted {noun}
        </button>
      </p>
    </div>
  );
}

/**
 * Self-contained disclosure around PastePanel: a toggle button that
 * reveals the paste area and returns focus to itself after items are
 * added.
 */
export default function PasteList({
  noun,
  onAdd,
}: {
  noun: string;
  onAdd: (items: string[]) => void;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="paste-list">
      <button
        ref={toggleRef}
        type="button"
        className="button button-secondary button-compact"
        aria-expanded={open}
        aria-controls={`${id}-region`}
        onClick={() => setOpen((previous) => !previous)}
      >
        {open ? `Hide pasted ${noun}` : `Paste a list of ${noun}`}
      </button>
      {open ? (
        <div id={`${id}-region`}>
          <PastePanel
            noun={noun}
            onAdd={(items) => {
              onAdd(items);
              setOpen(false);
              toggleRef.current?.focus();
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useId, useRef, useState } from "react";
import { parseListLines } from "@/lib/recipes";

/**
 * Disclosure for adding many items at once: paste a list copied from a
 * document (one item per line; bullets and numbering are stripped) and
 * add every line in one click. The parsed items are handed to the parent,
 * which owns the list state and the announcement.
 */
export default function PasteList({
  noun, // plural, e.g. "ingredients" or "steps"
  onAdd,
}: {
  noun: string;
  onAdd: (items: string[]) => void;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  function add() {
    const items = parseListLines(text);
    if (items.length === 0) {
      setError(`Paste ${noun}, one per line, then add them.`);
      textareaRef.current?.focus();
      return;
    }
    setError(null);
    setText("");
    setOpen(false);
    onAdd(items);
    toggleRef.current?.focus();
  }

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
            <button
              type="button"
              className="button button-secondary"
              onClick={add}
            >
              Add pasted {noun}
            </button>
          </p>
        </div>
      ) : null}
    </div>
  );
}

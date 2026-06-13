"use client";

import { useEffect, useId, useRef, useState } from "react";

export type ShareHousehold = { id: string; name: string };

/**
 * Dropdown of checkboxes for choosing which of the current user's
 * households a recipe is shared with. The visible checkboxes drive React
 * state; the selection is submitted via hidden inputs (name="households")
 * so it survives the form reset React performs after a server action.
 * The panel is a disclosure (aria-expanded) that closes on Escape or an
 * outside click.
 */
export default function HouseholdShareSelect({
  households,
  initialSelected,
}: {
  households: ShareHousehold[];
  initialSelected: string[];
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(
    initialSelected.filter((hid) => households.some((h) => h.id === hid))
  );
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onDown(event: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (households.length === 0) {
    return (
      <div className="field">
        <p className="field-label-like">Shared with households</p>
        <p className="field-help">
          You aren&apos;t in any households yet, so this recipe is private to
          you. Join a household to share it.
        </p>
      </div>
    );
  }

  const selectedNames = households
    .filter((h) => selected.includes(h.id))
    .map((h) => h.name);
  const summary =
    selectedNames.length === 0
      ? "Private (just you)"
      : selectedNames.length <= 2
        ? selectedNames.join(", ")
        : `${selectedNames.slice(0, 2).join(", ")} +${selectedNames.length - 2}`;

  function toggle(hid: string) {
    setSelected((previous) =>
      previous.includes(hid)
        ? previous.filter((x) => x !== hid)
        : [...previous, hid]
    );
  }

  return (
    <div className="field" ref={wrapRef}>
      <p className="field-label-like" id={`${id}-label`}>
        Shared with households
      </p>
      <p className="field-help" id={`${id}-help`}>
        Choose which of your households can see and edit this recipe. You
        always keep access.
      </p>

      {selected.map((hid) => (
        <input key={hid} type="hidden" name="households" value={hid} />
      ))}

      <div className="share-select">
        <button
          type="button"
          className="button button-secondary share-select-toggle"
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          aria-describedby={`${id}-label`}
          onClick={() => setOpen((o) => !o)}
        >
          {summary}
          <span aria-hidden="true" className="share-select-caret">
            ▾
          </span>
        </button>

        {open ? (
          <div id={`${id}-panel`} className="share-select-panel">
            <fieldset>
              <legend className="visually-hidden">
                Households to share with
              </legend>
              <ul className="share-option-list">
                {households.map((h) => (
                  <li key={h.id}>
                    <label className="checkbox-option">
                      <input
                        type="checkbox"
                        checked={selected.includes(h.id)}
                        onChange={() => toggle(h.id)}
                      />
                      {h.name}
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>
          </div>
        ) : null}
      </div>
    </div>
  );
}

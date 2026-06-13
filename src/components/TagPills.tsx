import { RECIPE_TAGS } from "@/lib/recipes";

const TAG_LABELS: Record<string, string> = {
  healthy: "Healthy",
  quick: "Quick",
  easy: "Easy",
};

/**
 * The three tags as colored pills. Two modes:
 *
 * - Uncontrolled (default): real checkboxes inside the labels, visual via
 *   :has(input:checked). Used by the GET filter form, where state lives in
 *   the URL and the form works without JavaScript.
 *
 * - Controlled (pass `selected` + `onToggle`): toggle buttons whose state
 *   is React-driven, with the selection submitted via hidden inputs. Used
 *   in forms driven by server actions, which reset the DOM after each
 *   submission — a reset would desync checkbox-based pills (visual and
 *   announced state), so those forms must use this mode.
 *
 * Either way, a checked pill fills with the tag color and gains a check
 * mark, so state is never conveyed by color alone.
 */
export default function TagPills({
  name,
  legend,
  describedBy,
  defaultSelected = [],
  selected,
  onToggle,
}: {
  /** Form field name, e.g. "tags" or "filter". */
  name: string;
  /** Visually hidden group label. */
  legend: string;
  describedBy?: string;
  /** Uncontrolled initial state. */
  defaultSelected?: string[];
  /** Controlled state (pass with onToggle). */
  selected?: string[];
  onToggle?: (tag: string) => void;
}) {
  const controlled = selected !== undefined && onToggle !== undefined;

  if (controlled) {
    return (
      <fieldset className="pill-fieldset">
        <legend className="visually-hidden">{legend}</legend>
        <div className="pill-list" aria-describedby={describedBy}>
          {RECIPE_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              role="switch"
              aria-checked={selected.includes(tag)}
              className={`pill-checkbox pill-${tag}`}
              onClick={() => onToggle(tag)}
            >
              <span className="pill-label">{TAG_LABELS[tag]}</span>
            </button>
          ))}
        </div>
        {selected.map((tag) => (
          <input key={tag} type="hidden" name={name} value={tag} />
        ))}
      </fieldset>
    );
  }

  return (
    <fieldset className="pill-fieldset">
      <legend className="visually-hidden">{legend}</legend>
      <div className="pill-list" aria-describedby={describedBy}>
        {RECIPE_TAGS.map((tag) => (
          <label key={tag} className={`pill-checkbox pill-${tag}`}>
            <input
              type="checkbox"
              className="visually-hidden"
              name={name}
              value={tag}
              defaultChecked={defaultSelected.includes(tag)}
            />
            <span className="pill-label">{TAG_LABELS[tag]}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

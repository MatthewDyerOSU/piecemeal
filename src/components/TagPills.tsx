import { RECIPE_TAGS } from "@/lib/recipes";

const TAG_LABELS: Record<string, string> = {
  healthy: "Healthy",
  quick: "Quick",
  easy: "Easy",
};

/**
 * The three tag checkboxes styled as colored pills (matching the static
 * tag pills on recipe cards). Checked pills fill with the tag color and
 * gain a check mark, so state is never conveyed by color alone; the real
 * checkbox stays in the DOM for assistive tech and no-JS submission.
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
  /** Uncontrolled initial state (GET filter forms). */
  defaultSelected?: string[];
  /** Controlled state: required in forms driven by server actions, which
      React resets after each submission. Pass both selected and onToggle. */
  selected?: string[];
  onToggle?: (tag: string) => void;
}) {
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
              checked={selected ? selected.includes(tag) : undefined}
              onChange={
                selected && onToggle ? () => onToggle(tag) : undefined
              }
              defaultChecked={
                selected ? undefined : defaultSelected.includes(tag)
              }
            />
            <span className="pill-label">{TAG_LABELS[tag]}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

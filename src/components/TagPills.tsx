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
}: {
  /** Form field name, e.g. "tags" or "filter". */
  name: string;
  /** Visually hidden group label. */
  legend: string;
  describedBy?: string;
  defaultSelected?: string[];
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
              defaultChecked={defaultSelected.includes(tag)}
            />
            <span className="pill-label">{TAG_LABELS[tag]}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

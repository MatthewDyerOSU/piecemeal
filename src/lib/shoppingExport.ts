import type { ShoppingListItem } from "@/types/shopping";

/**
 * Plain-text checklist: opens cleanly as a text note in any notes app
 * (Samsung Notes, Apple Notes, etc.). Uses ASCII "[ ]" / "[x]" markers
 * rather than the ☑/☐ Unicode box glyphs, which render as empty boxes in
 * some Android/Samsung system fonts.
 */
export function buildChecklistText(items: ShoppingListItem[]): string {
  const lines = ["Shopping list", ""];
  for (const item of items) {
    lines.push(`${item.checked ? "[x]" : "[ ]"} ${item.text}`);
  }
  return lines.join("\n") + "\n";
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * A clean, printable HTML page for the shopping list. Opened in a new
 * window and printed; the browser's "Save as PDF" produces a PDF that
 * Samsung Notes (and any PDF app) can import. The inline onload print keeps
 * it reliable across desktop and mobile browsers.
 */
export function buildChecklistHtml(items: ShoppingListItem[]): string {
  const rows = items
    .map((item) => {
      const box = item.checked ? "[x]" : "[ ]";
      const cls = item.checked ? ' class="done"' : "";
      return `      <li${cls}><span class="box">${box}</span> ${escapeHtml(
        item.text
      )}</li>`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Shopping list</title>
  <style>
    body { font: 16px/1.6 -apple-system, Roboto, "Segoe UI", system-ui, sans-serif; color: #111; margin: 2rem; }
    h1 { font-size: 1.5rem; margin: 0 0 1rem; }
    ul { list-style: none; padding: 0; margin: 0; }
    li { font-size: 1.15rem; padding: 0.25rem 0; border-bottom: 1px solid #ddd; }
    .box { font-family: ui-monospace, "Courier New", monospace; margin-right: 0.5rem; }
    .done { color: #777; text-decoration: line-through; }
    @media print { body { margin: 1rem; } li { border-bottom: 1px solid #ccc; } }
  </style>
</head>
<body onload="window.print()">
  <h1>Shopping list</h1>
  <ul>
${rows}
  </ul>
</body>
</html>
`;
}

function escapeIcs(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/**
 * VTODO calendar: on iOS, opening this offers to add the items to
 * Reminders as individually checkable tasks.
 */
export function buildRemindersIcs(items: ShoppingListItem[]): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Piece-Meal//Shopping List//EN",
    "CALSCALE:GREGORIAN",
  ];
  for (const item of items) {
    lines.push(
      "BEGIN:VTODO",
      `UID:${item.id}@piece-meal.com`,
      `SUMMARY:${escapeIcs(item.text)}`,
      `STATUS:${item.checked ? "COMPLETED" : "NEEDS-ACTION"}`,
      "END:VTODO"
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

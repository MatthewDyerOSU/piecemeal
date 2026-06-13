import type { ShoppingListItem } from "@/types/shopping";

/** Plain-text checklist: opens in any notes app; boxes are characters. */
export function buildChecklistText(items: ShoppingListItem[]): string {
  const lines = ["Shopping list", ""];
  for (const item of items) {
    lines.push(`${item.checked ? "☑" : "☐"} ${item.text}`);
  }
  return lines.join("\n") + "\n";
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

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accessibility statement",
};

export default function AccessibilityPage() {
  return (
    <section className="page-narrow">
      <h1>Accessibility statement</h1>
      <p>
        PieceMeal is designed to conform to the Web Content Accessibility
        Guidelines (WCAG) 2.2 at Level AAA.
      </p>

      <h2>What this means</h2>
      <ul>
        <li>Text has a contrast ratio of at least 7:1 in both light and dark themes.</li>
        <li>Every interactive control is at least 44 by 44 pixels and fully keyboard operable, with a clearly visible focus indicator.</li>
        <li>Pages use consistent navigation, descriptive headings, and a skip link to the main content.</li>
        <li>Forms include written help, and errors are described in text with suggestions for fixing them.</li>
        <li>Deleting a recipe asks for confirmation first.</li>
        <li>The site respects your system&apos;s preferences for color scheme and reduced motion, and there is no time limit on anything you do.</li>
      </ul>

      <h2>Feedback</h2>
      <p>
        If you find any part of this site difficult to use, please email{" "}
        <a href="mailto:Matt.Dyer@accessabilityofficer.com">
          Matt.Dyer@accessabilityofficer.com
        </a>
        .
      </p>
    </section>
  );
}

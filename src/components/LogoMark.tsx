/**
 * The Piece-Meal mark: a steaming flat-bottomed bowl with a puzzle-piece
 * hole. The hole is real transparency (evenodd subpath), so the header
 * background shows through it. Colors come from the theme via CSS
 * (.logo-mark in globals.css). Decorative: hidden from assistive tech,
 * the adjacent wordmark text carries the name.
 */
export default function LogoMark() {
  return (
    <svg
      className="logo-mark"
      viewBox="0 0 100 100"
      width="30"
      height="30"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fillRule="evenodd"
        d="M10 40a40 40 0 0 0 20.6 35h38.8A40 40 0 0 0 90 40Z
           M40 49h7c-4-8 10-8 6 0h7v7c8-4 8 10 0 6v7H40Z"
      />
      <path className="logo-steam" d="M40 31c3-4-3-7 0-12" />
      <path className="logo-steam" d="M57 31c3-4-3-7 0-12" />
    </svg>
  );
}

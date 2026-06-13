"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import NavLinks from "./NavLinks";

/**
 * Primary navigation. At wide widths the links sit inline. Below the
 * compact breakpoint (CSS-driven) the inline list is hidden and a "Menu"
 * toggle opens a modal dialog containing the same links:
 * - aria-expanded on the toggle reports open/closed to screen readers.
 * - The open dialog is role="dialog" aria-modal and traps Tab focus.
 * - Escape, the close button, choosing a link, or the backdrop all close
 *   it, and focus returns to the toggle.
 * The inline list and the toggle are shown/hidden purely with CSS, so the
 * correct one renders on first paint; the dialog only mounts when opened.
 */
export default function SiteNav() {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    toggleRef.current?.focus();
  }, []);

  // While open: lock body scroll, focus the dialog's first control, trap
  // Tab within it, and close on Escape.
  useEffect(() => {
    if (!open) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const dialog = dialogRef.current;
    const focusables = () =>
      Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled])'
        ) ?? []
      );
    focusables()[0]?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab") {
        return;
      }
      const items = focusables();
      if (items.length === 0) {
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, close]);

  // If the viewport grows past the compact breakpoint while the menu is
  // open, the inline nav takes over — drop the dialog so it can't linger.
  useEffect(() => {
    const wide = window.matchMedia("(min-width: 48rem)");
    const onChange = () => {
      if (wide.matches) {
        setOpen(false);
      }
    };
    wide.addEventListener("change", onChange);
    return () => wide.removeEventListener("change", onChange);
  }, []);

  return (
    <>
      <nav className="nav-inline" aria-label="Main">
        <NavLinks />
      </nav>

      <button
        ref={toggleRef}
        type="button"
        className="button button-secondary nav-toggle"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <span className="nav-toggle-icon" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        Menu
      </button>

      {open ? (
        <div className="nav-overlay">
          <div
            className="nav-backdrop"
            onClick={close}
            aria-hidden="true"
          />
          <div
            ref={dialogRef}
            className="nav-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
          >
            <div className="nav-dialog-head">
              <span className="nav-dialog-title">Menu</span>
              <button
                type="button"
                className="button button-secondary"
                onClick={close}
              >
                Close
              </button>
            </div>
            <nav aria-label="Main">
              <NavLinks onNavigate={close} />
            </nav>
          </div>
        </div>
      ) : null}
    </>
  );
}

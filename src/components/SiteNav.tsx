"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import NavLinks from "./NavLinks";

/**
 * Primary navigation. At wide widths the links sit inline. Below the
 * compact breakpoint (CSS-driven) the inline list is hidden and a "Menu"
 * toggle opens a modal dialog containing the same links:
 * - aria-expanded on the toggle reports open/closed to screen readers.
 * - The dialog is portaled to <body>; while open, every other top-level
 *   element is marked `inert`, so nothing behind it is focusable or
 *   reachable by a screen reader's virtual cursor.
 * - role="dialog" aria-modal, Tab is trapped within it, and Escape, the
 *   Close button, the backdrop, or choosing a link all dismiss it and
 *   return focus to the toggle.
 * The inline list and the toggle are shown/hidden purely with CSS, so the
 * correct one renders on first paint; the dialog only mounts when opened.
 */
export default function SiteNav({ account }: { account: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const close = useCallback(() => setOpen(false), []);

  // While open: mark the rest of the page inert, lock body scroll, focus
  // the dialog's first control, trap Tab, and close on Escape. On
  // teardown, undo all of that and return focus to the toggle.
  useEffect(() => {
    if (!open) {
      return;
    }

    const overlay = overlayRef.current;
    const backgrounds = Array.from(document.body.children).filter(
      (el) => el !== overlay
    );
    backgrounds.forEach((el) => el.setAttribute("inert", ""));

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusables = () =>
      Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled])'
        ) ?? []
      );
    focusables()[0]?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
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
      backgrounds.forEach((el) => el.removeAttribute("inert"));
      // Restore focus to the toggle (only when it is actually visible —
      // e.g. not when the menu closed because the viewport went wide).
      if (toggleRef.current && toggleRef.current.offsetParent !== null) {
        toggleRef.current.focus();
      }
    };
  }, [open]);

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

      {mounted && open
        ? createPortal(
            <div className="nav-overlay" ref={overlayRef}>
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
                <div className="nav-dialog-account">{account}</div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}

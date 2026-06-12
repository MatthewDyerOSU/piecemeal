"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

/**
 * Compact cooking-mode switch: keeps the screen awake while cooking via
 * the Screen Wake Lock API. The control is a labeled role="switch"
 * button (state announced as on/off automatically), with what it does
 * explained to screen readers via aria-describedby. The lock is released
 * by the browser when the tab is hidden, so it is re-acquired on
 * visibilitychange while the switch is on. Requires a secure context;
 * unsupported browsers get a short note instead of a broken control.
 */
export default function CookingMode() {
  const id = useId();
  const [active, setActive] = useState(false);
  const [failed, setFailed] = useState(false);
  const [supported, setSupported] = useState<boolean | null>(null);
  const lockRef = useRef<WakeLockSentinel | null>(null);
  // Tracks whether the user wants cooking mode on, independent of whether
  // the browser has temporarily released the lock (e.g. tab hidden).
  const wantedRef = useRef(false);

  const acquire = useCallback(async () => {
    try {
      const lock = await navigator.wakeLock.request("screen");
      lockRef.current = lock;
      lock.addEventListener("release", () => {
        lockRef.current = null;
        if (!wantedRef.current) {
          setActive(false);
        }
      });
      setActive(true);
      setFailed(false);
    } catch {
      wantedRef.current = false;
      setActive(false);
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    setSupported("wakeLock" in navigator);

    const onVisibilityChange = () => {
      if (
        wantedRef.current &&
        document.visibilityState === "visible" &&
        lockRef.current === null
      ) {
        acquire();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      wantedRef.current = false;
      lockRef.current?.release().catch(() => {});
    };
  }, [acquire]);

  async function toggle() {
    if (active) {
      wantedRef.current = false;
      await lockRef.current?.release().catch(() => {});
      lockRef.current = null;
      setActive(false);
    } else {
      wantedRef.current = true;
      await acquire();
    }
  }

  if (supported === null) {
    return null;
  }

  if (!supported) {
    return (
      <p className="field-help cooking-unsupported">
        Cooking mode (keeping the screen awake) is not supported by this
        browser.
      </p>
    );
  }

  return (
    <div className="cooking-toggle-wrap">
      <button
        type="button"
        role="switch"
        aria-checked={active}
        aria-describedby={`${id}-desc`}
        className="cooking-toggle"
        onClick={toggle}
      >
        <span>Cooking mode</span>
        <span className="switch-track" aria-hidden="true">
          <span className="switch-thumb" />
        </span>
      </button>
      <span id={`${id}-desc`} className="visually-hidden">
        When on, keeps your screen awake while you cook.
      </span>
      <p aria-live="polite" className={failed ? "field-error" : "visually-hidden"}>
        {failed
          ? "Could not keep the screen awake. Check that battery saver is off and try again."
          : ""}
      </p>
    </div>
  );
}

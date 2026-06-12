"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Status = "idle" | "active" | "error";

/**
 * Keeps the screen awake while cooking, using the Screen Wake Lock API.
 * The lock is released automatically by the browser when the tab is hidden,
 * so it is re-acquired on visibilitychange while cooking mode is on.
 * Requires a secure context (HTTPS); unsupported browsers get an
 * explanation instead of a broken button.
 */
export default function CookingMode() {
  const [status, setStatus] = useState<Status>("idle");
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
          setStatus("idle");
        }
      });
      setStatus("active");
    } catch {
      wantedRef.current = false;
      setStatus("error");
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
    if (status === "active") {
      wantedRef.current = false;
      await lockRef.current?.release().catch(() => {});
      lockRef.current = null;
      setStatus("idle");
    } else {
      wantedRef.current = true;
      await acquire();
    }
  }

  if (supported === null) {
    // Not yet known (first render / no JavaScript); render nothing rather
    // than a control that cannot work.
    return null;
  }

  return (
    <section className="card cooking-mode" aria-labelledby="cooking-mode-heading">
      <h2 className="eyebrow" id="cooking-mode-heading">
        Cooking mode
      </h2>

      {supported ? (
        <>
          <p>
            Keeps your screen awake while you cook, so the display does not
            turn off while your hands are busy.
          </p>
          <p>
            <button type="button" className="button" onClick={toggle}>
              {status === "active"
                ? "Turn off cooking mode"
                : "Turn on cooking mode"}
            </button>
          </p>
          <p className="cooking-mode-status" aria-live="polite">
            {status === "active"
              ? "Cooking mode is on. Your screen will stay awake."
              : status === "error"
              ? "Cooking mode could not be turned on. Check that your battery saver is off and try again."
              : "Cooking mode is off."}
          </p>
        </>
      ) : (
        <p>
          Your browser does not support keeping the screen awake, so cooking
          mode is unavailable. You can change your device&apos;s screen
          timeout in its display settings instead.
        </p>
      )}
    </section>
  );
}

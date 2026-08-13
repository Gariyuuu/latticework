"use client";

import * as React from "react";

const SIZE = 176;
const RADIUS = SIZE / 2;
const KNOB_RADIUS = RADIUS - 14;

interface ThemeWheelProps {
  hue: number;
  onChange: (hue: number) => void;
}

/** A hue wheel: drag/click anywhere on the ring (or its knob) to pick an
 * accent hue (0-360). The ring itself is a standard HSL rainbow — the most
 * legible convention for "this is a hue picker" — while the center swatch
 * and the rest of the app render the SAME hue in real OKLCH via
 * --accent-hue, so what you pick is what you actually get, just not
 * pixel-identical to the ring's own reference colors (HSL and OKLCH
 * disagree slightly on where e.g. "pure cyan" falls). */
export function ThemeWheel({ hue, onChange }: ThemeWheelProps) {
  const wheelRef = React.useRef<HTMLDivElement>(null);
  const draggingRef = React.useRef(false);

  const angleToHue = React.useCallback((clientX: number, clientY: number) => {
    const el = wheelRef.current;
    if (!el) return hue;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    // atan2 measures from the +x axis counter-clockwise; rotate so 0deg is
    // "up" (matches the conic-gradient's `from 0deg` starting at 12 o'clock).
    let deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    if (deg < 0) deg += 360;
    return Math.round(deg);
  }, [hue]);

  // Cleanup ref rather than referencing the move/up handlers by name from
  // within themselves — avoids a stale-closure self-reference across
  // renders, still safely detaches on unmount mid-drag.
  const cleanupRef = React.useRef<(() => void) | null>(null);

  const startDragging = (e: React.PointerEvent) => {
    draggingRef.current = true;
    onChange(angleToHue(e.clientX, e.clientY));

    function onMove(ev: PointerEvent) {
      onChange(angleToHue(ev.clientX, ev.clientY));
    }
    function onUp() {
      draggingRef.current = false;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      cleanupRef.current = null;
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    cleanupRef.current = onUp;
  };

  React.useEffect(() => {
    return () => cleanupRef.current?.();
  }, []);

  const angleRad = ((hue - 90) * Math.PI) / 180;
  const knobX = RADIUS + Math.cos(angleRad) * KNOB_RADIUS;
  const knobY = RADIUS + Math.sin(angleRad) * KNOB_RADIUS;

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        ref={wheelRef}
        role="slider"
        aria-label="Accent color hue"
        aria-valuemin={0}
        aria-valuemax={360}
        aria-valuenow={hue}
        tabIndex={0}
        onPointerDown={startDragging}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowUp") onChange((hue + 1) % 360);
          if (e.key === "ArrowLeft" || e.key === "ArrowDown") onChange((hue + 359) % 360);
        }}
        className="relative shrink-0 cursor-pointer touch-none rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        style={{
          width: SIZE,
          height: SIZE,
          background:
            "conic-gradient(from 0deg, #ff0000, #ffae00, #e9ff00, #4bff00, #00ffae, #00c8ff, #0044ff, #8800ff, #ff00c8, #ff0000)",
        }}
      >
        <div
          className="absolute rounded-full bg-background"
          style={{ inset: 16 }}
        />
        <div
          className="absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background shadow-md"
          style={{ left: knobX, top: knobY, background: `oklch(0.66 0.19 ${hue})` }}
        />
        <div
          className="absolute inset-0 flex items-center justify-center"
          aria-hidden
        >
          <div
            className="size-10 rounded-full border border-border/50 shadow-inner"
            style={{ background: `oklch(0.6 0.2 ${hue})` }}
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Hue {hue}°</p>
    </div>
  );
}

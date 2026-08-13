"use client";

import * as React from "react";

const HUE_KEY = "lattice-accent-hue";
const BG_KEY = "lattice-app-bg";
export const DEFAULT_HUE = 264;

interface AppearanceContextValue {
  hue: number;
  setHue: (hue: number) => void;
  background: string | null;
  setBackground: (bg: string | null) => void;
}

const AppearanceContext = React.createContext<AppearanceContextValue | null>(null);

export function useAppearance() {
  const ctx = React.useContext(AppearanceContext);
  if (!ctx) throw new Error("useAppearance must be used within AppearanceProvider");
  return ctx;
}

function applyHue(hue: number) {
  document.documentElement.style.setProperty("--accent-hue", String(hue));
}

function applyBackground(bg: string | null) {
  if (bg) {
    document.documentElement.style.setProperty("--app-bg-image", `url(${JSON.stringify(bg)})`);
    document.documentElement.style.setProperty("--app-bg-scrim", "oklch(0.12 0.015 var(--accent-hue) / 55%)");
  } else {
    document.documentElement.style.removeProperty("--app-bg-image");
    document.documentElement.style.removeProperty("--app-bg-scrim");
  }
}

/** Blocking inline script — must render as the very first child of <body>,
 * before ClerkProvider/children, so hue + background apply before first
 * paint (same "avoid a flash of default theme" reasoning as next-themes'
 * own injected script for dark/light mode). */
export function AppearanceScript() {
  const js = `(function(){try{
    var h=localStorage.getItem(${JSON.stringify(HUE_KEY)});
    if(h)document.documentElement.style.setProperty("--accent-hue",h);
    var bg=localStorage.getItem(${JSON.stringify(BG_KEY)});
    if(bg){
      document.documentElement.style.setProperty("--app-bg-image","url("+JSON.stringify(bg)+")");
      document.documentElement.style.setProperty("--app-bg-scrim","oklch(0.12 0.015 "+(h||${DEFAULT_HUE})+" / 55%)");
    }
  }catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const [hue, setHueState] = React.useState(DEFAULT_HUE);
  const [background, setBackgroundState] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Syncing React state from localStorage (an external, non-reactive
    // source) on mount — the one legitimate case for setState-in-effect the
    // lint rule can't distinguish from derivable state. Matches
    // ThemeToggle's own mount-then-swap pattern: the blocking
    // AppearanceScript already applied these values to the DOM before
    // paint, so this is just catching up React's own state, not causing a
    // visible flash.
    const storedHue = localStorage.getItem(HUE_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (storedHue) setHueState(Number(storedHue));
    const storedBg = localStorage.getItem(BG_KEY);
    if (storedBg) setBackgroundState(storedBg);
  }, []);

  const setHue = React.useCallback((next: number) => {
    setHueState(next);
    applyHue(next);
    localStorage.setItem(HUE_KEY, String(next));
  }, []);

  const setBackground = React.useCallback((next: string | null) => {
    setBackgroundState(next);
    applyBackground(next);
    if (next) localStorage.setItem(BG_KEY, next);
    else localStorage.removeItem(BG_KEY);
  }, []);

  const value = React.useMemo(
    () => ({ hue, setHue, background, setBackground }),
    [hue, setHue, background, setBackground]
  );

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

"use client";

import { useAppearance } from "@/components/shell/appearance-provider";
import { ThemeWheel } from "@/components/settings/theme-wheel";
import { BackgroundPicker } from "@/components/settings/background-picker";

export function AppearanceSettings() {
  const { hue, setHue, background, setBackground } = useAppearance();

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium">Accent color</p>
          <p className="text-sm text-muted-foreground">
            Drag the wheel to re-tint buttons, links, and highlights across the app.
          </p>
        </div>
        <ThemeWheel hue={hue} onChange={setHue} />
      </div>

      <div>
        <p className="text-sm font-medium">Background</p>
        <p className="mb-3 text-sm text-muted-foreground">
          Pick an ambient background, upload your own, or turn it off.
        </p>
        <BackgroundPicker background={background} onChange={setBackground} />
      </div>
    </div>
  );
}

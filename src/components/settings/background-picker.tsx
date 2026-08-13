"use client";

import * as React from "react";
import Image from "next/image";
import { Check, Upload, Ban, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const PRESETS = [
  { id: "forge-glow", label: "Forge Glow", path: "/backgrounds/forge-glow.png" },
  { id: "aurora-mesh", label: "Aurora Mesh", path: "/backgrounds/aurora-mesh.png" },
  { id: "circuit-grid", label: "Circuit Grid", path: "/backgrounds/circuit-grid.png" },
  { id: "nebula-dust", label: "Nebula Dust", path: "/backgrounds/nebula-dust.png" },
  { id: "terminal-waves", label: "Terminal Waves", path: "/backgrounds/terminal-waves.png" },
  { id: "minimal-gradient", label: "Minimal Gradient", path: "/backgrounds/minimal-gradient.png" },
] as const;

const MAX_DIMENSION = 1920;
/** Custom uploads persist in localStorage as a data URL (no object storage
 * wired up for this feature) — downscale + re-encode as JPEG so a phone
 * photo doesn't blow past localStorage's per-origin quota (~5-10MB). */
async function downscaleToDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(bitmap, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

interface BackgroundPickerProps {
  background: string | null;
  onChange: (bg: string | null) => void;
}

export function BackgroundPicker({ background, onChange }: BackgroundPickerProps) {
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const isCustom = background !== null && !PRESETS.some((p) => p.path === background);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const dataUrl = await downscaleToDataUrl(file);
      onChange(dataUrl);
    } catch {
      setError("Couldn't read that image — try a different file.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-4">
        <button
          type="button"
          onClick={() => onChange(null)}
          className={cn(
            "relative flex aspect-video items-center justify-center rounded-lg border-2 bg-muted transition-colors",
            background === null ? "border-primary" : "border-transparent hover:border-border"
          )}
          aria-label="No background"
        >
          <Ban className="size-4 text-muted-foreground" />
          {background === null && (
            <Check className="absolute right-1 top-1 size-3.5 rounded-full bg-primary p-0.5 text-primary-foreground" />
          )}
        </button>

        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onChange(p.path)}
            className={cn(
              "relative aspect-video overflow-hidden rounded-lg border-2 transition-colors",
              background === p.path ? "border-primary" : "border-transparent hover:border-border"
            )}
            aria-label={p.label}
            title={p.label}
          >
            <Image src={p.path} alt={p.label} fill sizes="120px" className="object-cover" />
            {background === p.path && (
              <Check className="absolute right-1 top-1 size-3.5 rounded-full bg-primary p-0.5 text-primary-foreground" />
            )}
          </button>
        ))}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className={cn(
            "relative flex aspect-video flex-col items-center justify-center gap-1 overflow-hidden rounded-lg border-2 bg-muted text-muted-foreground transition-colors",
            isCustom ? "border-primary" : "border-transparent hover:border-border"
          )}
          aria-label="Upload custom background"
        >
          {isCustom && background && (
            <Image
              src={background}
              alt="Custom background"
              fill
              sizes="120px"
              unoptimized
              className="object-cover"
            />
          )}
          {!isCustom &&
            (uploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                <Upload className="size-4" />
                <span className="text-[10px]">Custom</span>
              </>
            ))}
          {isCustom && (
            <Check className="absolute right-1 top-1 size-3.5 rounded-full bg-primary p-0.5 text-primary-foreground" />
          )}
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

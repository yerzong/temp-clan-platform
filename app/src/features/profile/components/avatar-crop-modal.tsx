"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Cropper, { type Area } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { Wand2, Check, X, ZoomIn, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useMountedTransition } from "@/lib/use-mounted-transition";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Render the cropped square area to a PNG blob, capped at 512px. */
async function cropToBlob(src: string, area: Area): Promise<Blob> {
  const image = await loadImage(src);
  const size = Math.min(Math.round(area.width), 512);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no 2d context");
  ctx.drawImage(
    image,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    size,
    size
  );
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      "image/png"
    )
  );
}

/**
 * Full-screen modal to frame a profile photo: drag to position, slider to zoom,
 * round crop preview, and an in-browser "remove background" step. Returns the
 * final square PNG blob via onConfirm.
 */
export function AvatarCropModal({
  open,
  file,
  onClose,
  onConfirm,
}: {
  open: boolean;
  file: Blob | null;
  onClose: () => void;
  onConfirm: (blob: Blob) => void;
}) {
  const { mounted, closing } = useMountedTransition(open, 220);

  const [blob, setBlob] = useState<Blob | null>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);

  // (Re)initialize when a new file opens the modal.
  useEffect(() => {
    if (!open || !file) return;
    const url = URL.createObjectURL(file);
    setBlob(file);
    setSrc(url);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setArea(null);
    return () => URL.revokeObjectURL(url);
  }, [open, file]);

  // Lock body scroll while open.
  useEffect(() => {
    if (!mounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mounted]);

  async function removeBg() {
    if (!blob || processing) return;
    setProcessing(true);
    try {
      const { removeBackground } = await import("@imgly/background-removal");
      const out = await removeBackground(blob);
      if (src) URL.revokeObjectURL(src);
      setBlob(out);
      setSrc(URL.createObjectURL(out));
      toast.success("Fondo eliminado");
    } catch {
      toast.error("No se pudo quitar el fondo. Intenta con otra imagen.");
    } finally {
      setProcessing(false);
    }
  }

  async function confirm() {
    if (!src || !area || saving) return;
    setSaving(true);
    try {
      const cropped = await cropToBlob(src, area);
      onConfirm(cropped);
    } catch {
      toast.error("No se pudo recortar la imagen.");
    } finally {
      setSaving(false);
    }
  }

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-black/70 backdrop-blur-[1px]",
          closing ? "tc-overlay-out" : "tc-overlay-in"
        )}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Ajustar foto de perfil"
        className={cn(
          "relative z-10 flex w-full max-w-lg flex-col overflow-hidden rounded-xl border border-tc-border-strong bg-tc-surface-1 shadow-2xl",
          closing ? "tc-dialog-out" : "tc-dialog-in"
        )}
      >
        <div className="flex items-center justify-between border-b border-tc-border px-5 py-3.5">
          <div>
            <h2 className="text-sm font-semibold text-tc-fg">
              Ajusta tu foto
            </h2>
            <p className="text-[11px] text-tc-fg-tertiary">
              Arrastra para mover y usa el deslizador para acercar.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-md p-1.5 text-tc-fg-muted transition-colors hover:bg-tc-surface-2 hover:text-tc-fg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Crop stage */}
        <div className="relative h-80 w-full bg-black">
          {src && (
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              restrictPosition
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, px) => setArea(px)}
            />
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-3 px-5 py-4">
          <div className="flex items-center gap-3">
            <ZoomIn className="h-4 w-4 shrink-0 text-tc-fg-muted" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="h-1 w-full cursor-pointer appearance-none rounded-full bg-tc-surface-2 accent-[hsl(var(--tc-accent))]"
              aria-label="Zoom"
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={removeBg}
              disabled={processing || saving}
              className="inline-flex items-center gap-1.5 rounded-md border border-tc-border px-3 py-1.5 text-xs font-medium text-tc-fg-secondary transition-colors hover:border-tc-accent hover:text-tc-fg disabled:opacity-50"
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              {processing ? "Quitando fondo…" : "Quitar fondo"}
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={saving || processing}
                className="rounded-md px-3 py-1.5 text-xs font-medium text-tc-fg-tertiary transition-colors hover:text-tc-fg disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirm}
                disabled={saving || processing || !area}
                className="inline-flex items-center gap-1.5 rounded-md bg-[hsl(var(--tc-accent))] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[hsl(var(--tc-accent-hover))] disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Usar esta foto
              </button>
            </div>
          </div>
          <p className="text-[11px] text-tc-fg-muted">
            El fondo se quita aquí mismo, sin enviar tu foto a ningún servidor.
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}

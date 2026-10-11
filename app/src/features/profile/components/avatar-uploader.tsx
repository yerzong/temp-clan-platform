"use client";

import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { AvatarCropModal } from "./avatar-crop-modal";

function initials(name: string): string {
  const cleaned = name.replace(/^[.@]+/, "");
  const parts = cleaned.split(/[\s_-]+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * Avatar picker. Choosing a file opens a crop modal (drag to frame, zoom, and an
 * optional in-browser "remove background" step). The framed square PNG is only
 * uploaded to Supabase Storage on confirm, then the public URL is reported via
 * onUploaded and/or a hidden input the parent form submits.
 */
export function AvatarUploader({
  initialUrl,
  displayName,
  onUploaded,
  noHiddenInput = false,
}: {
  initialUrl: string | null;
  displayName: string;
  onUploaded?: (url: string) => void;
  /** When the parent owns the avatarUrl hidden input, skip rendering ours. */
  noHiddenInput?: boolean;
}) {
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [picked, setPicked] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      toast.error("Usa una imagen PNG, JPEG o WEBP.");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      toast.error("La imagen no debe superar 12 MB.");
      return;
    }
    setPicked(file);
  }

  async function handleConfirm(blob: Blob) {
    setUploading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Debes iniciar sesión.");
        return;
      }
      const path = `${user.id}/avatar-${Date.now()}.png`;
      const { error } = await supabase.storage
        .from("avatars")
        .upload(path, blob, { upsert: true, contentType: "image/png" });
      if (error) {
        toast.error(error.message);
        return;
      }
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setUrl(data.publicUrl);
      onUploaded?.(data.publicUrl);
      setPicked(null);
      toast.success("Foto lista. Guarda el perfil para confirmar.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      {!noHiddenInput && <input type="hidden" name="avatarUrl" value={url ?? ""} />}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-tc-border bg-tc-surface-2"
        aria-label="Cambiar foto"
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center font-mono text-xl font-bold text-tc-fg-tertiary">
            {initials(displayName)}
          </span>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          ) : (
            <Camera className="h-5 w-5 text-white" />
          )}
        </span>
      </button>

      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-fit rounded-md border border-tc-border px-3 py-1.5 text-xs font-medium text-tc-fg-secondary transition-colors hover:border-tc-accent hover:text-tc-fg disabled:opacity-50"
        >
          {uploading ? "Subiendo…" : url ? "Cambiar foto" : "Subir foto"}
        </button>
        <span className="text-[11px] text-tc-fg-muted">
          PNG, JPEG o WEBP · máx 12 MB · encuadra y quita el fondo
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={onPick}
        className="hidden"
      />

      <AvatarCropModal
        open={picked !== null}
        file={picked}
        onClose={() => setPicked(null)}
        onConfirm={handleConfirm}
      />
    </div>
  );
}

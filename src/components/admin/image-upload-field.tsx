"use client";

import { useId, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { Field, Input, Label } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

export function ImageUploadField({
  defaultValue,
  defaultCaption,
}: {
  defaultValue?: string | null;
  defaultCaption?: string | null;
}) {
  const id = useId();
  const [url, setUrl] = useState(defaultValue ?? "");
  const [caption, setCaption] = useState(defaultCaption ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.set("file", file);
      const response = await fetch("/api/admin/upload", { method: "POST", body });
      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) {
        setError(payload.error ?? "Upload failed.");
        return;
      }
      setUrl(payload.url);
    } catch {
      setError("Upload failed. Check your connection and try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <Field>
        <Label htmlFor={`${id}-url`}>Featured image URL</Label>
        <Input
          id={`${id}-url`}
          name="featuredImage"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          maxLength={2000}
          placeholder="https://… or /images/…"
        />
      </Field>
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-2 text-xs font-semibold hover:border-primary/40">
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />}
          {uploading ? "Uploading…" : "Upload image"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="sr-only"
            disabled={uploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
              event.target.value = "";
            }}
          />
        </label>
        <span className="text-[11px] text-muted-foreground">JPEG, PNG, WebP or AVIF · max 5 MB</span>
      </div>
      {error ? <p className="text-[11px] font-semibold text-live">{error}</p> : null}
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="Featured image preview" className="max-h-40 w-full rounded-md border border-border object-cover" />
      ) : null}
      <Field>
        <Label htmlFor={`${id}-caption`}>Image caption</Label>
        <Input
          id={`${id}-caption`}
          name="imageCaption"
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
          maxLength={240}
          placeholder="Optional credit or caption"
        />
      </Field>
      <Button type="button" variant="ghost" size="sm" onClick={() => setUrl("")} disabled={!url || uploading}>
        Remove image
      </Button>
    </div>
  );
}

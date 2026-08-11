import { useEffect, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getProofUrl } from "@/lib/earn.functions";

export const MAX_SCREENSHOTS = 3;

export const splitPaths = (value: string | null | undefined) =>
  (value ?? "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

/** Compulsory sample photos picker (max 3) used on both user and admin add-task forms. */
export function SamplePhotoInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (paths: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const paths = splitPaths(value);

  async function pick(files: FileList | null) {
    if (!files || !files.length) return;
    const room = MAX_SCREENSHOTS - paths.length;
    if (room <= 0) {
      toast.error(`You can upload maximum ${MAX_SCREENSHOTS} screenshots`);
      return;
    }
    setBusy(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new Error("Not signed in");
      const added: string[] = [];
      for (const file of Array.from(files).slice(0, room)) {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${uid}/samples/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error } = await supabase.storage.from("proofs").upload(path, file);
        if (error) throw error;
        added.push(path);
      }
      onChange([...paths, ...added].join(","));
      toast.success(`${added.length} sample photo${added.length > 1 ? "s" : ""} uploaded`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="block text-xs font-semibold text-muted-foreground">
      Sample photos (required • max {MAX_SCREENSHOTS})
      <label className="mt-1 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-input bg-background px-3 py-3">
        {busy ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        ) : (
          <ImagePlus className="h-5 w-5 text-primary" />
        )}
        <span className="text-sm font-semibold text-foreground">
          {paths.length
            ? `${paths.length}/${MAX_SCREENSHOTS} uploaded • tap to add more`
            : "Upload sample screenshots"}
        </span>
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          disabled={paths.length >= MAX_SCREENSHOTS}
          onChange={(e) => pick(e.target.files)}
        />
      </label>
      {paths.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {paths.map((p, i) => (
            <button
              key={p}
              type="button"
              onClick={() => onChange(paths.filter((x) => x !== p).join(","))}
              className="flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1.5 text-xs font-bold text-foreground"
            >
              Sample {i + 1}
              <X className="h-3.5 w-3.5 text-destructive" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Shows stored sample photos via short-lived signed URLs. */
export function SamplePhoto({ path }: { path: string | null }) {
  const fn = useServerFn(getProofUrl);
  const [urls, setUrls] = useState<string[]>([]);
  const paths = splitPaths(path);
  const key = paths.join(",");

  useEffect(() => {
    let alive = true;
    if (!key) return;
    Promise.all(
      key
        .split(",")
        .map((p) =>
          fn({ data: { path: p } })
            .then((r) => r?.url ?? null)
            .catch(() => null),
        ),
    ).then((res) => {
      if (alive) setUrls(res.filter((u): u is string => !!u));
    });
    return () => {
      alive = false;
    };
  }, [key, fn]);

  if (!urls.length) return null;
  return (
    <div className="mt-3">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
        Sample proof
      </p>
      <div className="mt-1 space-y-2">
        {urls.map((u, i) => (
          <img
            key={u}
            src={u}
            alt={`Sample proof screenshot ${i + 1} for this task`}
            loading="lazy"
            className="max-h-64 w-full rounded-xl object-contain"
          />
        ))}
      </div>
    </div>
  );
}

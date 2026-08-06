import { useEffect, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getProofUrl } from "@/lib/earn.functions";

/** Compulsory sample photo picker used on both user and admin add-task forms. */
export function SamplePhotoInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (path: string) => void;
}) {
  const [busy, setBusy] = useState(false);

  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new Error("Not signed in");
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${uid}/samples/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("proofs").upload(path, file);
      if (error) throw error;
      onChange(path);
      toast.success("Sample photo uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <label className="block text-xs font-semibold text-muted-foreground">
      Sample photo (required)
      <div className="mt-1 flex items-center gap-3 rounded-xl border border-dashed border-input bg-background px-3 py-3">
        {busy ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        ) : (
          <ImagePlus className="h-5 w-5 text-primary" />
        )}
        <span className="text-sm font-semibold text-foreground">
          {value ? "Sample uploaded ✓ tap to replace" : "Upload sample screenshot"}
        </span>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => pick(e.target.files?.[0])}
        />
      </div>
    </label>
  );
}

/** Shows a stored sample photo via a short-lived signed URL. */
export function SamplePhoto({ path }: { path: string | null }) {
  const fn = useServerFn(getProofUrl);
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    if (!path) return;
    fn({ data: { path } })
      .then((r) => {
        if (alive) setUrl(r?.url ?? null);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [path, fn]);

  if (!path || !url) return null;
  return (
    <div className="mt-3">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
        Sample proof
      </p>
      <img
        src={url}
        alt="Sample proof screenshot for this task"
        loading="lazy"
        className="mt-1 max-h-64 w-full rounded-xl object-contain"
      />
    </div>
  );
}

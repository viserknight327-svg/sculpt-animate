import { supabase } from "@/integrations/supabase/client";

export type SceneRow = {
  id: string;
  name: string;
  thumbnail: string | null;
  data: Record<string, unknown>;
  updated_at: string;
};

export async function listScenes(): Promise<SceneRow[]> {
  const { data, error } = await supabase
    .from("studio_scenes")
    .select("id,name,thumbnail,data,updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as SceneRow[];
}

export async function saveScene(input: {
  id?: string | null;
  name: string;
  data: Record<string, unknown>;
  thumbnail: string | null;
}) {
  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes.user?.id;
  if (!userId) throw new Error("Sign in to save scenes");

  if (input.id) {
    const { data, error } = await supabase
      .from("studio_scenes")
      .update({ name: input.name, data: input.data as never, thumbnail: input.thumbnail })
      .eq("id", input.id)
      .select("id,name,thumbnail,data,updated_at")
      .single();
    if (error) throw error;
    return data as SceneRow;
  }

  const { data, error } = await supabase
    .from("studio_scenes")
    .insert({ user_id: userId, name: input.name, data: input.data as never, thumbnail: input.thumbnail })
    .select("id,name,thumbnail,data,updated_at")
    .single();
  if (error) throw error;
  return data as SceneRow;
}

export async function deleteScene(id: string) {
  const { error } = await supabase.from("studio_scenes").delete().eq("id", id);
  if (error) throw error;
}

/** Downscaled JPEG of the live viewport, used as the scene thumbnail. */
export function captureViewport(): string | null {
  if (typeof document === "undefined") return null;
  const source = document.querySelector("canvas");
  if (!source) return null;
  const out = document.createElement("canvas");
  const w = 320;
  out.width = w;
  out.height = Math.round((source.height / source.width) * w) || 180;
  const ctx = out.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0, out.width, out.height);
  try {
    return out.toDataURL("image/jpeg", 0.6);
  } catch {
    return null;
  }
}

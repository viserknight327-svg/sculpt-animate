import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { captureViewport, deleteScene, listScenes, saveScene, type SceneRow } from "@/lib/studio/scenes";
import { useStudio } from "@/lib/studio/store";

export default function TopBar() {
  const { user, loading, signOut } = useAuth();
  const snapshot = useStudio((s) => s.snapshot);
  const restore = useStudio((s) => s.restore);
  const [name, setName] = useState("Untitled scene");
  const [sceneId, setSceneId] = useState<string | null>(null);
  const [scenes, setScenes] = useState<SceneRow[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = () => {
    if (!user) return;
    listScenes()
      .then(setScenes)
      .catch((e) => toast.error(e.message));
  };

  useEffect(() => {
    if (user) refresh();
    else setScenes([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const onSave = async () => {
    if (!user) {
      toast.error("Sign in to save this scene to your library");
      return;
    }
    setBusy(true);
    try {
      const row = await saveScene({
        id: sceneId,
        name,
        data: snapshot(),
        thumbnail: captureViewport(),
      });
      setSceneId(row.id);
      toast.success(`Saved “${row.name}”`);
      refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <header className="hairline-b flex h-12 shrink-0 items-center gap-3 bg-[var(--header)] px-3">
      <div className="flex items-center gap-2">
        <span className="signal-fill grid h-6 w-6 place-items-center rounded text-[11px] font-black">K</span>
        <span className="text-sm font-semibold tracking-tight">KINETIQ</span>
        <span className="label-xs hidden sm:inline">motion studio</span>
      </div>

      <div className="hairline-l mx-1 h-6" />

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-52 rounded-md border border-border bg-[var(--panel)] px-2 py-1 text-xs focus:border-primary/60 focus:outline-none"
      />

      <button
        onClick={onSave}
        disabled={busy}
        className="rounded-md border border-primary/50 bg-primary/15 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/25 disabled:opacity-50"
      >
        {busy ? "Saving…" : sceneId ? "Save" : "Save to cloud"}
      </button>

      <div className="relative">
        <button
          onClick={() => {
            setOpen((v) => !v);
            refresh();
          }}
          className="rounded-md border border-border bg-secondary px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Scenes ({scenes.length})
        </button>
        {open && (
          <div className="absolute left-0 top-9 z-40 max-h-[60vh] w-72 overflow-y-auto rounded-md border border-border bg-[var(--panel)] p-1.5 shadow-[var(--shadow-float)]">
            {!user && <p className="p-2 text-xs text-muted-foreground">Sign in to keep a scene library.</p>}
            {user && scenes.length === 0 && (
              <p className="p-2 text-xs text-muted-foreground">No saved scenes yet.</p>
            )}
            {scenes.map((s) => (
              <div key={s.id} className="group flex items-center gap-2 rounded p-1 hover:bg-accent">
                <button
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  onClick={() => {
                    restore(s.data);
                    setName(s.name);
                    setSceneId(s.id);
                    setOpen(false);
                    toast.success(`Loaded “${s.name}”`);
                  }}
                >
                  {s.thumbnail ? (
                    <img src={s.thumbnail} alt="" className="h-8 w-12 rounded object-cover" />
                  ) : (
                    <span className="h-8 w-12 rounded bg-[var(--panel-raised)]" />
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-xs">{s.name}</span>
                    <span className="num block text-[10px] text-muted-foreground">
                      {new Date(s.updated_at).toLocaleString()}
                    </span>
                  </span>
                </button>
                <button
                  onClick={async () => {
                    await deleteScene(s.id);
                    if (sceneId === s.id) setSceneId(null);
                    refresh();
                  }}
                  className="opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                  title="Delete"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={() => {
            const url = captureViewport();
            if (!url) return toast.error("Viewport not ready");
            const a = document.createElement("a");
            a.href = url;
            a.download = `${name.replace(/\s+/g, "-").toLowerCase()}.jpg`;
            a.click();
          }}
          className="rounded-md border border-border bg-secondary px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Render still
        </button>
        {loading ? null : user ? (
          <>
            <span className="hidden max-w-[160px] truncate text-xs text-muted-foreground md:inline">
              {user.email}
            </span>
            <button
              onClick={() => signOut()}
              className="rounded-md border border-border bg-secondary px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              Sign out
            </button>
          </>
        ) : (
          <Link
            to="/auth"
            className="signal-fill rounded-md px-3 py-1.5 text-xs font-medium"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}

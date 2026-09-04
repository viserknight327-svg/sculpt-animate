import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  captureViewport,
  deleteScene,
  listScenes,
  saveScene,
  type SceneRow,
} from "@/lib/studio/scenes";
import { downloadStill, exportRigGlb } from "@/lib/studio/exporters";
import { runBipedPipeline } from "@/lib/studio/pipeline";
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
  const [pipelineBusy, setPipelineBusy] = useState(false);
  const importInput = useRef<HTMLInputElement>(null);

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

  const exportProject = () => {
    const blob = new Blob([JSON.stringify({ name, ...snapshot() }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name.replace(/\s+/g, "-").toLowerCase() || "kinetiq-project"}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Project settings exported");
  };

  const runPipeline = async () => {
    setPipelineBusy(true);
    const id = toast.loading("Starting pipeline…");
    try {
      const result = await runBipedPipeline({
        onStep: (_step, label) => toast.loading(`${label}…`, { id }),
      });
      downloadStill(result.rigName);
      toast.success(
        `${result.rigName}: ${result.bones} bones skinned with ${result.skin}, ${result.capture} retargeted onto ${result.mappedJoints} joints — still rendered`,
        { id },
      );
    } catch (error) {
      toast.error((error as Error).message, { id });
    } finally {
      setPipelineBusy(false);
    }
  };

  const onExportGlb = async () => {
    try {
      await exportRigGlb(useStudio.getState().assetName || name);
      toast.success("Rig exported as GLB");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const onRenderStill = () => {
    try {
      downloadStill(name);
      toast.success("Still rendered");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <header className="hairline-b flex h-12 shrink-0 items-center gap-3 bg-[var(--header)] px-3">
      <div className="flex items-center gap-2">
        <span className="signal-fill grid h-6 w-6 place-items-center rounded text-[11px] font-black">
          K
        </span>
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

      <button
        onClick={runPipeline}
        disabled={pipelineBusy}
        title="Build a biped rig, skin it, retarget a BVH capture and render"
        className="rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
      >
        {pipelineBusy ? "Running…" : "Auto pipeline"}
      </button>

      <div className="hidden items-center overflow-hidden rounded-md border border-border bg-secondary/60 lg:flex">
        <button
          onClick={onExportGlb}
          title="Export the live rig and its clips as binary glTF"
          className="px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          GLB
        </button>
        <span className="hairline-l h-4" />
        <button
          onClick={onRenderStill}
          title="Download a full-resolution PNG of the viewport"
          className="px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          Still
        </button>
        <span className="hairline-l h-4" />
        <button
          onClick={exportProject}
          title="Export scene settings as JSON"
          className="px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          Export
        </button>
        <span className="hairline-l h-4" />
        <input
          ref={importInput}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            try {
              const data = JSON.parse(await file.text()) as Record<string, unknown>;
              restore(data);
              if (typeof data['name'] === "string") setName(data['name'] as string);
              setSceneId(null);
              toast.success(`Imported ${file.name}`);
            } catch {
              toast.error("Could not read that project file");
            } finally {
              event.target.value = "";
            }
          }}
        />
        <button
          onClick={() => importInput.current?.click()}
          title="Import a previously exported project JSON"
          className="px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          Import
        </button>
      </div>


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
            {!user && (
              <p className="p-2 text-xs text-muted-foreground">Sign in to keep a scene library.</p>
            )}
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
                    try {
                      await deleteScene(s.id);
                      if (sceneId === s.id) setSceneId(null);
                      toast.success(`Deleted “${s.name}”`);
                      refresh();
                    } catch (error) {
                      toast.error(
                        error instanceof Error ? error.message : "Could not delete scene",
                      );
                    }
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

        {loading ? null : user ? (
          <>
            <span className="hidden max-w-[160px] truncate text-xs text-muted-foreground md:inline">
              {user.email}
            </span>
            <button
              onClick={async () => {
                try {
                  await signOut();
                  toast.success("Signed out");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Could not sign out");
                }
              }}
              className="rounded-md border border-border bg-secondary px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              Sign out
            </button>
          </>
        ) : (
          <Link to="/auth" className="signal-fill rounded-md px-3 py-1.5 text-xs font-medium">
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}

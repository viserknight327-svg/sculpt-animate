import { useRef } from "react";
import { toast } from "sonner";
import { DEFAULT_RIG_SPEC, type RigSpec } from "@/lib/studio/rigbuilder";
import { SAMPLE_ASSETS, SAMPLE_MOCAP } from "@/lib/studio/samples";
import { useStudio } from "@/lib/studio/store";

export default function AssetsPanel() {
  const { assetUrl, assetKind, loadAsset, loadMocap, mocapName, clipNames, activeClip, setActiveClip, materialNames, selectMaterial, setTab, selectedMaterial, rigSpec, buildCustomRig, updateRigSpec } =
    useStudio();
  const modelInput = useRef<HTMLInputElement>(null);
  const mocapInput = useRef<HTMLInputElement>(null);
  const custom = assetKind === "custom";

  const apply = (patch: Partial<RigSpec>) => {
    updateRigSpec(patch);
    if (custom) buildCustomRig(patch);
  };


  return (
    <aside className="panel-surface hairline-r flex w-[268px] shrink-0 flex-col overflow-y-auto">
      <Section title="Asset library">
        <div className="space-y-1">
          {SAMPLE_ASSETS.map((a) => (
            <button
              key={a.id}
              onClick={() => loadAsset(a.url, a.name, "sample")}
              className={`flex w-full flex-col rounded-md border px-2.5 py-2 text-left transition-colors ${
                assetUrl === a.url && !custom
                  ? "border-primary/60 bg-primary/10"
                  : "border-border bg-[var(--panel-raised)] hover:border-primary/40"
              }`}
            >
              <span className="text-[13px] font-medium">{a.name}</span>
              <span className="num text-[10px] text-muted-foreground">{a.note}</span>
            </button>
          ))}
        </div>
        <input
          ref={modelInput}
          type="file"
          accept=".glb,.gltf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            loadAsset(URL.createObjectURL(f), f.name, "upload");
            toast.success(`Loaded ${f.name}`);
          }}
        />
        <button
          onClick={() => modelInput.current?.click()}
          className="mt-2 w-full rounded-md border border-dashed border-border py-2 text-xs text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
        >
          + Import rig (.glb / .gltf)
        </button>
      </Section>

      <Section title="Mocap library">
        <div className="space-y-1">
          {SAMPLE_MOCAP.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                loadMocap(m.url, m.name);
                setTab("mocap");
              }}
              className={`flex w-full flex-col rounded-md border px-2.5 py-2 text-left transition-colors ${
                mocapName === m.name
                  ? "border-[var(--data)]/60 bg-[var(--data)]/10"
                  : "border-border bg-[var(--panel-raised)] hover:border-[var(--data)]/40"
              }`}
            >
              <span className="text-[13px] font-medium">{m.name}</span>
              <span className="num text-[10px] text-muted-foreground">{m.note}</span>
            </button>
          ))}
        </div>
        <input
          ref={mocapInput}
          type="file"
          accept=".bvh"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            loadMocap(URL.createObjectURL(f), f.name);
            setTab("mocap");
            toast.success(`Capture loaded: ${f.name}`);
          }}
        />
        <button
          onClick={() => mocapInput.current?.click()}
          className="mt-2 w-full rounded-md border border-dashed border-border py-2 text-xs text-muted-foreground transition-colors hover:border-[var(--data)]/60 hover:text-foreground"
        >
          + Import capture (.bvh)
        </button>
      </Section>

      <Section title={`Clips (${clipNames.length})`}>
        <div className="max-h-56 space-y-0.5 overflow-y-auto">
          {clipNames.length === 0 && <Empty>No clips on this rig</Empty>}
          {clipNames.map((c) => (
            <button
              key={c}
              onClick={() => setActiveClip(c)}
              className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs transition-colors ${
                activeClip === c ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
              <span className="truncate">{c.split("|").pop()}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title={`Materials (${materialNames.length})`}>
        <div className="space-y-0.5">
          {materialNames.length === 0 && <Empty>No materials</Empty>}
          {materialNames.map((m) => (
            <button
              key={m}
              onClick={() => {
                selectMaterial(m);
                setTab("skin");
              }}
              className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs transition-colors ${
                selectedMaterial === m ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <span className="truncate">{m}</span>
            </button>
          ))}
        </div>
      </Section>
    </aside>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="hairline-b p-3">
      <h2 className="label-xs mb-2">{title}</h2>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-2 py-1 text-xs text-muted-foreground/70">{children}</p>;
}

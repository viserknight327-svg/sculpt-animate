import { useRef } from "react";
import { toast } from "sonner";
import { CANONICAL_JOINTS } from "@/lib/studio/retarget";
import { DEFAULT_MATERIAL, useStudio } from "@/lib/studio/store";
import { Panel, Row, Slider, Swatch, Toggle } from "./controls";

const TABS = [
  { id: "animate", label: "Animate" },
  { id: "skin", label: "Skin" },
  { id: "mocap", label: "Mocap" },
] as const;

export default function Inspector() {
  const tab = useStudio((s) => s.tab);
  const setTab = useStudio((s) => s.setTab);

  return (
    <aside className="panel-surface hairline-l flex w-[320px] shrink-0 flex-col">
      <div className="hairline-b grid grid-cols-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`py-2.5 text-xs font-medium tracking-wide transition-colors ${
              tab === t.id
                ? "border-b-2 border-primary bg-primary/8 text-foreground"
                : "border-b-2 border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto">
        {tab === "animate" && <AnimateTab />}
        {tab === "skin" && <SkinTab />}
        {tab === "mocap" && <MocapTab />}
      </div>
    </aside>
  );
}

function AnimateTab() {
  const s = useStudio();
  return (
    <>
      <Panel title="Clip">
        <select
          value={s.activeClip ?? ""}
          onChange={(e) => s.setActiveClip(e.target.value || null)}
          className="w-full rounded-md border border-border bg-[var(--panel-raised)] px-2 py-1.5 text-xs"
        >
          {s.clipNames.length === 0 && <option value="">— none —</option>}
          {s.clipNames.map((c) => (
            <option key={c} value={c}>
              {c.split("|").pop()}
            </option>
          ))}
        </select>
        <Row label="Playback">
          <Slider
            value={s.speed}
            onChange={s.setSpeed}
            min={0.05}
            max={2.5}
            step={0.05}
            suffix="×"
          />
        </Row>
        <Row label="Frame rate">
          <select
            value={s.fps}
            onChange={(e) => s.setFps(Number(e.target.value))}
            className="rounded-md border border-border bg-[var(--panel-raised)] px-2 py-1 text-xs"
          >
            {[12, 24, 25, 30, 48, 60].map((f) => (
              <option key={f} value={f}>
                {f} fps
              </option>
            ))}
          </select>
        </Row>
        <Row label="Options">
          <Toggle label="loop" value={s.loop} onChange={s.setLoop} />
          <Toggle label="root motion" value={s.rootMotion} onChange={s.setRootMotion} />
        </Row>
      </Panel>

      <Panel title="Rig">
        <Row label="Overlays">
          <Toggle
            label="skeleton"
            value={s.viewport.skeleton}
            onChange={(v) => s.setViewport({ skeleton: v })}
          />
          <Toggle
            label="source bones"
            value={s.viewport.bones}
            onChange={(v) => s.setViewport({ bones: v })}
          />
        </Row>
        <Row label="Bones">
          <span className="num text-xs">{s.targetBones.length}</span>
        </Row>
        <Row label="Keys on clip">
          <span className="num text-xs">{s.keyframeTimes.length}</span>
        </Row>
      </Panel>

      <Panel title="Stage">
        <Row label="Key light">
          <Slider
            value={s.viewport.keyLight}
            onChange={(v) => s.setViewport({ keyLight: v })}
            max={6}
          />
        </Row>
        <Row label="Fill">
          <Slider
            value={s.viewport.fillLight}
            onChange={(v) => s.setViewport({ fillLight: v })}
            max={3}
          />
        </Row>
        <Row label="Rim">
          <Slider
            value={s.viewport.rimLight}
            onChange={(v) => s.setViewport({ rimLight: v })}
            max={5}
          />
        </Row>
        <Row label="Exposure">
          <Slider
            value={s.viewport.exposure}
            onChange={(v) => s.setViewport({ exposure: v })}
            min={0.2}
            max={2.5}
          />
        </Row>
        <Row label="Lens">
          <Slider
            value={s.viewport.fov}
            onChange={(v) => s.setViewport({ fov: v })}
            min={18}
            max={80}
            step={1}
            suffix="°"
          />
        </Row>
        <Row label="Ground">
          <Toggle
            label="grid"
            value={s.viewport.grid}
            onChange={(v) => s.setViewport({ grid: v })}
          />
          <Toggle
            label="floor"
            value={s.viewport.floor}
            onChange={(v) => s.setViewport({ floor: v })}
          />
        </Row>
      </Panel>
    </>
  );
}

function SkinTab() {
  const {
    materialNames,
    selectedMaterial,
    selectMaterial,
    materials,
    updateMaterial,
    resetMaterial,
  } = useStudio();
  const texInput = useRef<HTMLInputElement>(null);
  const name = selectedMaterial;
  const mat = name ? (materials[name] ?? DEFAULT_MATERIAL) : null;

  if (!name || !mat) {
    return <p className="p-4 text-xs text-muted-foreground">Load a rig to edit its materials.</p>;
  }

  return (
    <>
      <Panel title="Material slot">
        <select
          value={name}
          onChange={(e) => selectMaterial(e.target.value)}
          className="w-full rounded-md border border-border bg-[var(--panel-raised)] px-2 py-1.5 text-xs"
        >
          {materialNames.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </Panel>

      <Panel title="Surface">
        <Row label="Base color">
          <Swatch value={mat.color} onChange={(v) => updateMaterial(name, { color: v })} />
        </Row>
        <Row label="Metalness">
          <Slider value={mat.metalness} onChange={(v) => updateMaterial(name, { metalness: v })} />
        </Row>
        <Row label="Roughness">
          <Slider value={mat.roughness} onChange={(v) => updateMaterial(name, { roughness: v })} />
        </Row>
        <Row label="Opacity">
          <Slider value={mat.opacity} onChange={(v) => updateMaterial(name, { opacity: v })} />
        </Row>
      </Panel>

      <Panel title="Emission">
        <Row label="Color">
          <Swatch value={mat.emissive} onChange={(v) => updateMaterial(name, { emissive: v })} />
        </Row>
        <Row label="Intensity">
          <Slider
            value={mat.emissiveIntensity}
            onChange={(v) => updateMaterial(name, { emissiveIntensity: v })}
            max={6}
          />
        </Row>
      </Panel>

      <Panel title="Texture map">
        <input
          ref={texInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            updateMaterial(name, { mapUrl: URL.createObjectURL(f), mapName: f.name });
            toast.success(`Mapped ${f.name} to ${name}`);
          }}
        />
        <button
          onClick={() => texInput.current?.click()}
          className="w-full rounded-md border border-dashed border-border py-2 text-xs text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
        >
          {mat.mapName ? `↻ ${mat.mapName}` : "+ Assign image map"}
        </button>
        {mat.mapUrl && (
          <>
            <Row label="Tiling">
              <Slider
                value={mat.repeat}
                onChange={(v) => updateMaterial(name, { repeat: v })}
                min={0.25}
                max={8}
                step={0.25}
              />
            </Row>
            <button
              onClick={() => updateMaterial(name, { mapUrl: null, mapName: null })}
              className="w-full rounded-md border border-border bg-secondary py-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear map
            </button>
          </>
        )}
      </Panel>

      <Panel title="Display">
        <Row label="Modes">
          <Toggle
            label="wireframe"
            value={mat.wireframe}
            onChange={(v) => updateMaterial(name, { wireframe: v })}
          />
          <Toggle
            label="flat"
            value={mat.flatShading}
            onChange={(v) => updateMaterial(name, { flatShading: v })}
          />
        </Row>
        <button
          onClick={() => resetMaterial(name)}
          className="mt-1 w-full rounded-md border border-border bg-secondary py-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          Reset slot
        </button>
      </Panel>
    </>
  );
}

function MocapTab() {
  const s = useStudio();

  if (!s.mocapUrl) {
    return (
      <p className="p-4 text-xs text-muted-foreground">
        Load a capture from the mocap library, or import a <span className="num">.bvh</span> file to
        drive this rig.
      </p>
    );
  }

  return (
    <>
      <Panel title="Capture">
        <Row label="Source">
          <span className="truncate text-xs">{s.mocapName}</span>
        </Row>
        <Row label="Joints">
          <span className="num text-xs">{s.sourceBones.length}</span>
        </Row>
        <Row label="Length">
          <span className="num text-xs">{s.mocapDuration.toFixed(2)}s</span>
        </Row>
        <Row label="Drive rig">
          <Toggle
            label={s.mocapEnabled ? "on" : "off"}
            value={s.mocapEnabled}
            onChange={s.setMocapEnabled}
          />
        </Row>
        <Row label="Influence">
          <Slider value={s.mocapInfluence} onChange={s.setMocapInfluence} />
        </Row>
        <Row label="Time offset">
          <Slider
            value={s.mocapOffset}
            onChange={s.setMocapOffset}
            min={-1}
            max={1}
            step={0.01}
            suffix="s"
          />
        </Row>
        <Row label="Smoothing">
          <Slider
            value={s.mocapSmoothing}
            onChange={s.setMocapSmoothing}
            min={0}
            max={0.9}
            step={0.05}
          />
        </Row>
        <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground/70">
          Offset aligns a capture to the timeline. Smoothing reduces jitter while preserving the
          retargeted pose.
        </p>
        <button
          onClick={s.clearMocap}
          className="mt-1 w-full rounded-md border border-border bg-secondary py-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          Unload capture
        </button>
      </Panel>

      <Panel title="Retarget map">
        <button
          onClick={s.autoMapBones}
          className="mb-2 w-full rounded-md border border-[var(--data)]/50 bg-[var(--data)]/10 py-1.5 text-xs text-[var(--data)]"
        >
          Auto-map joints
        </button>
        <div className="space-y-1.5">
          {CANONICAL_JOINTS.map((j) => {
            const m = s.mapping[j.key] ?? { source: null, target: null };
            const complete = m.source && m.target;
            return (
              <div
                key={j.key}
                className="rounded-md border border-border bg-[var(--panel-raised)] p-1.5"
              >
                <div className="mb-1 flex items-center gap-2">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${complete ? "bg-[var(--data)]" : "bg-muted-foreground/40"}`}
                  />
                  <span className="label-xs">{j.label}</span>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <select
                    value={m.source ?? ""}
                    onChange={(e) => s.setMapping(j.key, "source", e.target.value || null)}
                    className="min-w-0 rounded border border-border bg-[var(--panel)] px-1 py-1 text-[11px]"
                  >
                    <option value="">source —</option>
                    {s.sourceBones.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                  <select
                    value={m.target ?? ""}
                    onChange={(e) => s.setMapping(j.key, "target", e.target.value || null)}
                    className="min-w-0 rounded border border-border bg-[var(--panel)] px-1 py-1 text-[11px]"
                  >
                    <option value="">target —</option>
                    {s.targetBones.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>
    </>
  );
}

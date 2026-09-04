import { useRef, useState } from "react";
import { toast } from "sonner";
import { CANONICAL_JOINTS } from "@/lib/studio/retarget";
import { listRigBones } from "@/lib/studio/rigbuilder";
import {
  createSkinDesign,
  DEFAULT_SKIN_PROMPT,
  previewPalette,
  SKIN_DESIGN_PRESETS,
} from "@/lib/studio/skinDesigner";
import { designMangaCharacter, MANGA_STYLES, type MangaStyle } from "@/lib/studio/mangaDesigner";
import { DEFAULT_MATERIAL, useStudio } from "@/lib/studio/store";
import { Panel, Row, Slider, Swatch, Toggle } from "./controls";

const TABS = [
  { id: "animate", label: "Animate" },
  { id: "skin", label: "Skin" },
  { id: "mocap", label: "Mocap" },
  { id: "manga", label: "Manga" },
  { id: "rig", label: "Rig" },
] as const;

export default function Inspector() {
  const tab = useStudio((s) => s.tab);
  const setTab = useStudio((s) => s.setTab);

  return (
    <aside className="panel-surface hairline-l flex w-[320px] shrink-0 flex-col">
      <div className="hairline-b grid grid-cols-5">
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
        {tab === "manga" && <MangaTab />}
        {tab === "rig" && <RigTab />}
      </div>
    </aside>
  );
}

function RigTab() {
  const s = useStudio();
  const selectedBone = s.weightBone ?? s.targetBones[0] ?? null;
  const setMode = (mode: "object" | "edit" | "weight") => {
    s.setRigEditMode(mode);
    s.setViewport({ skeleton: mode !== "object", bones: mode !== "object" });
  };

  return (
    <>
      <Panel title="Character rigging">
        <button
          onClick={() => {
            s.buildCustomRig(s.rigSpec);
            toast.success("Automatic rig generated from the current character profile");
          }}
          className="signal-fill w-full rounded-md py-1.5 text-xs font-semibold"
        >
          Auto-rig current character
        </button>
        <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground/70">
          Generates a named, retarget-ready skeleton from the current character proportions.
          Imported meshes remain available for manual setup.
        </p>
        <Row label="Edit mode">
          <div className="flex gap-1">
            {(["object", "edit", "weight"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setMode(mode)}
                className={`rounded border px-1.5 py-1 text-[10px] ${s.rigEditMode === mode ? "border-primary/60 bg-primary/15 text-primary" : "border-border text-muted-foreground"}`}
              >
                {mode}
              </button>
            ))}
          </div>
        </Row>
      </Panel>

      <Panel title="Bone editor">
        {s.assetKind !== "custom" ? (
          <p className="text-[10px] leading-relaxed text-muted-foreground/70">
            Build or auto-rig a procedural skeleton to edit bone lengths and joint names.
          </p>
        ) : (
          <>
            <div className="max-h-[280px] space-y-2 overflow-y-auto pr-1">
              {listRigBones(s.rigSpec, s.boneEdits).map((bone) => {
                const edit = s.boneEdits[bone.key];
                return (
                  <div
                    key={bone.key}
                    className="rounded-md border border-border bg-[var(--panel-raised)] p-2"
                    style={{ marginLeft: bone.depth * 6 }}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        value={edit?.name ?? bone.key}
                        onChange={(event) => s.renameBone(bone.key, event.target.value)}
                        className="min-w-0 flex-1 rounded border border-border bg-transparent px-1.5 py-1 text-[10px] focus:border-primary/60 focus:outline-none"
                      />
                      <span className="num shrink-0 text-[10px] text-muted-foreground">
                        {bone.length.toFixed(2)}m
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="range"
                        className="studio-slider flex-1"
                        min={0.2}
                        max={2.5}
                        step={0.01}
                        value={edit?.scale ?? 1}
                        onChange={(event) => s.setBoneScale(bone.key, Number(event.target.value))}
                      />
                      <span className="num w-10 shrink-0 text-right text-[10px]">
                        {(edit?.scale ?? 1).toFixed(2)}x
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => {
                s.resetBoneEdits();
                toast.success("Bone lengths and names reset to the generated rig");
              }}
              className="mt-2 w-full rounded-md border border-border bg-secondary py-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              Reset bone edits
            </button>
          </>
        )}
      </Panel>

      <Panel title="Retarget mapping">
        <div className="mb-2 flex gap-1">
          <button
            onClick={() => {
              s.autoMapBones();
              toast.success("Joints auto-mapped from the capture skeleton");
            }}
            className="flex-1 rounded-md border border-border bg-secondary py-1.5 text-[10px] text-muted-foreground hover:text-foreground"
          >
            Auto-map
          </button>
          <button
            onClick={() => {
              CANONICAL_JOINTS.forEach((joint) => {
                s.setMapping(joint.key, "source", null);
                s.setMapping(joint.key, "target", null);
              });
              toast.success("Mapping cleared");
            }}
            className="flex-1 rounded-md border border-border bg-secondary py-1.5 text-[10px] text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
        </div>
        {CANONICAL_JOINTS.map((joint) => {
          const entry = s.mapping[joint.key];
          return (
            <div key={joint.key} className="py-1">
              <div className="mb-1 flex items-center justify-between">
                <span className="label-xs">{joint.label}</span>
                <span
                  className={`text-[9px] ${entry?.source && entry?.target ? "text-primary" : "text-muted-foreground/60"}`}
                >
                  {entry?.source && entry?.target ? "linked" : "unmapped"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <select
                  value={entry?.source ?? ""}
                  onChange={(event) =>
                    s.setMapping(joint.key, "source", event.target.value || null)
                  }
                  className="min-w-0 truncate rounded border border-border bg-[var(--panel-raised)] px-1.5 py-1 text-[10px]"
                >
                  <option value="">source —</option>
                  {s.sourceBones.map((bone, bi) => (
                    <option key={`${joint.key}-s-${bone}-${bi}`} value={bone}>
                      {bone}
                    </option>
                  ))}
                </select>
                <select
                  value={entry?.target ?? ""}
                  onChange={(event) =>
                    s.setMapping(joint.key, "target", event.target.value || null)
                  }
                  className="min-w-0 truncate rounded border border-border bg-[var(--panel-raised)] px-1.5 py-1 text-[10px]"
                >
                  <option value="">target —</option>
                  {s.targetBones.map((bone, bi) => (
                    <option key={`${joint.key}-t-${bone}-${bi}`} value={bone}>
                      {bone}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );
        })}
      </Panel>

      <Panel title="Bone controls">
        <Row label="Active bone">
          <select
            value={selectedBone ?? ""}
            onChange={(event) => s.setWeightBone(event.target.value || null)}
            className="max-w-[175px] truncate rounded-md border border-border bg-[var(--panel-raised)] px-2 py-1 text-[10px]"
          >
            {s.targetBones.length === 0 && <option value="">No rig loaded</option>}
            {s.targetBones.map((bone, bi) => (
              <option key={`${bone}-${bi}`} value={bone}>
                {bone}
              </option>
            ))}
          </select>
        </Row>
        <Row label="IK / FK">
          <div className="flex gap-1">
            {(["ik", "fk"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => s.setAnimationMode(mode)}
                className={`rounded border px-2 py-1 text-[10px] uppercase ${s.animationMode === mode ? "border-primary/60 bg-primary/15 text-primary" : "border-border text-muted-foreground"}`}
              >
                {mode}
              </button>
            ))}
          </div>
        </Row>
        <Row label="IK enabled">
          <Toggle
            label={s.ikEnabled ? "on" : "off"}
            value={s.ikEnabled}
            onChange={s.setIkEnabled}
          />
        </Row>
        <Row label="IK blend">
          <Slider value={s.ikBlend} onChange={s.setIkBlend} />
        </Row>
      </Panel>

      <Panel title="Weight painting">
        <Row label="Brush mode">
          <div className="flex gap-1">
            {(["paint", "erase", "smooth"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => s.setWeightPaintMode(mode)}
                className={`rounded border px-1.5 py-1 text-[10px] ${s.weightPaintMode === mode ? "border-primary/60 bg-primary/15 text-primary" : "border-border text-muted-foreground"}`}
              >
                {mode}
              </button>
            ))}
          </div>
        </Row>
        <Row label="Radius">
          <Slider
            value={s.weightBrushSize}
            onChange={s.setWeightBrushSize}
            min={0.02}
            max={0.6}
            step={0.01}
          />
        </Row>
        <Row label="Strength">
          <Slider
            value={s.weightBrushStrength}
            onChange={s.setWeightBrushStrength}
            min={0.05}
            max={1}
            step={0.05}
          />
        </Row>
        <button
          onClick={() => {
            s.setViewport({ skeleton: true, bones: true });
            toast.success(
              selectedBone
                ? `Painting influence for ${selectedBone}`
                : "Select a bone to paint influence",
            );
          }}
          className="w-full rounded-md border border-border bg-secondary py-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          Show affected vertices
        </button>
      </Panel>
    </>
  );
}

function MangaTab() {
  const s = useStudio();
  const [generating, setGenerating] = useState(false);
  const design = designMangaCharacter(s.mangaPrompt, (s.mangaStyle as MangaStyle) || "shonen hero");

  return (
    <>
      <Panel title="Manga character generator">
        <textarea
          value={s.mangaPrompt}
          onChange={(event) => s.setMangaPrompt(event.target.value)}
          rows={4}
          placeholder="Describe a character, creature, costume, or manga protagonist…"
          className="w-full resize-none rounded-md border border-border bg-[var(--panel-raised)] px-2 py-1.5 text-xs leading-relaxed focus:border-primary/60 focus:outline-none"
        />
        <Row label="Style">
          <select
            value={s.mangaStyle}
            onChange={(event) => s.setMangaStyle(event.target.value)}
            className="max-w-[170px] rounded-md border border-border bg-[var(--panel-raised)] px-2 py-1 text-xs"
          >
            {MANGA_STYLES.map((style) => (
              <option key={style} value={style}>
                {style}
              </option>
            ))}
          </select>
        </Row>
        <div className="mt-2 space-y-1 rounded-md border border-border bg-[var(--panel-raised)] p-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-foreground">{design.title}</span>
            <span className="num text-muted-foreground">{design.rigPatch.preset}</span>
          </div>
          {design.designNotes.map((note) => (
            <div key={note} className="text-[10px] text-muted-foreground">
              • {note}
            </div>
          ))}
        </div>
        <button
          onClick={() => {
            setGenerating(true);
            s.buildCustomRig(design.rigPatch);
            s.setSkinPrompt(design.skinPrompt);
            s.setTab("skin");
            toast.success(`${design.title} rig created — generate its manga skin next`);
            setGenerating(false);
          }}
          disabled={generating}
          className="signal-fill mt-2 w-full rounded-md py-1.5 text-xs font-semibold disabled:opacity-60"
        >
          {generating ? "Building character…" : "Generate + auto-rig character"}
        </button>
        <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground/70">
          One click creates proportions, named bones, retarget-ready rig data, and a matching skin
          prompt.
        </p>
      </Panel>

      <Panel title="One-click pipeline">
        <div className="grid grid-cols-2 gap-1 text-[10px]">
          {["Design", "Auto Rig", "Capture", "Retarget", "Preview", "Export"].map((step, index) => (
            <div
              key={step}
              className="rounded border border-border bg-[var(--panel-raised)] px-2 py-1.5"
            >
              <span className="num mr-1 text-primary">0{index + 1}</span>
              {step}
            </div>
          ))}
        </div>
        <button
          onClick={() => {
            const next = designMangaCharacter(
              `${s.mangaPrompt} animation-ready hero`,
              (s.mangaStyle as MangaStyle) || "shonen hero",
            );
            s.buildCustomRig(next.rigPatch);
            s.setSkinPrompt(next.skinPrompt);
            s.setTab("animate");
            toast.success("Character pipeline ready — choose a clip and press play");
          }}
          className="mt-2 w-full rounded-md border border-primary/40 bg-primary/10 py-1.5 text-xs text-primary hover:bg-primary/15"
        >
          Prepare animation pipeline
        </button>
      </Panel>
    </>
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
          {s.clipNames.map((c, ci) => (
            <option key={`${c}-${ci}`} value={c}>
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

      <Panel title="Animation tools">
        <Row label="Blend strength">
          <Slider value={s.blendStrength} onChange={s.setBlendStrength} />
        </Row>
        <Row label="Editor keys">
          <span className="num text-xs">{s.editorKeyframes.length}</span>
        </Row>
        <button
          onClick={() => {
            s.addEditorKeyframe("Rig");
            toast.success(`Keyframe added at ${s.time.toFixed(2)}s`);
          }}
          className="w-full rounded-md border border-primary/40 bg-primary/10 py-1.5 text-xs text-primary hover:bg-primary/15"
        >
          Insert pose keyframe
        </button>
        <div className="mt-2 grid grid-cols-2 gap-1">
          <button
            onClick={() => s.savePosePreset(`Pose ${s.posePresets.length + 1}`)}
            className="rounded border border-border bg-[var(--panel-raised)] py-1.5 text-[10px] text-muted-foreground hover:text-foreground"
          >
            Save pose
          </button>
          <button
            onClick={() => s.posePresets[0] && s.applyPosePreset(s.posePresets[0].id)}
            disabled={s.posePresets.length === 0}
            className="rounded border border-border bg-[var(--panel-raised)] py-1.5 text-[10px] text-muted-foreground hover:text-foreground disabled:opacity-40"
          >
            Apply first pose
          </button>
        </div>
        {s.posePresets.length > 0 && (
          <div className="mt-2 space-y-1">
            {s.posePresets.slice(-3).map((pose) => (
              <button
                key={pose.id}
                onClick={() => s.applyPosePreset(pose.id)}
                className="flex w-full items-center justify-between rounded border border-border bg-[var(--panel-raised)] px-2 py-1 text-left text-[10px] text-muted-foreground hover:text-foreground"
              >
                <span>{pose.name}</span>
                <span className="text-primary">apply</span>
              </button>
            ))}
          </div>
        )}
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
    skinPrompt,
    setSkinPrompt,
  } = useStudio();
  const texInput = useRef<HTMLInputElement>(null);
  const [generating, setGenerating] = useState(false);
  const name = selectedMaterial;
  const mat = name ? (materials[name] ?? DEFAULT_MATERIAL) : null;
  const palette = previewPalette(skinPrompt || DEFAULT_SKIN_PROMPT);

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

      <Panel title="AI skin designer">
        <textarea
          value={skinPrompt}
          onChange={(event) => setSkinPrompt(event.target.value)}
          placeholder="Describe the character skin…"
          rows={3}
          className="w-full resize-none rounded-md border border-border bg-[var(--panel-raised)] px-2 py-1.5 text-xs leading-relaxed focus:border-primary/60 focus:outline-none"
        />
        <div className="mt-2 flex items-center gap-1">
          {palette.colors.slice(0, 4).map((color, ci) => (
            <span
              key={`${color}-${ci}`}
              className="h-4 flex-1 rounded-sm border border-white/10"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <button
          onClick={() => {
            setGenerating(true);
            try {
              const design = createSkinDesign(skinPrompt);
              updateMaterial(name, design);
              toast.success(`Generated ${design.mapName}`);
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Could not generate skin map");
            } finally {
              setGenerating(false);
            }
          }}
          disabled={generating}
          className="signal-fill mt-2 w-full rounded-md py-1.5 text-xs font-semibold disabled:opacity-60"
        >
          {generating ? "Designing skin…" : "Generate AI skin map"}
        </button>
        <div className="mt-2 flex flex-wrap gap-1">
          {SKIN_DESIGN_PRESETS.map((preset) => (
            <button
              key={preset}
              onClick={() => setSkinPrompt(preset)}
              className="rounded border border-border bg-[var(--panel-raised)] px-1.5 py-1 text-[10px] text-muted-foreground hover:border-primary/50 hover:text-foreground"
            >
              {preset.split(" ").slice(0, 2).join(" ")}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground/70">
          Creates an editable procedural UV texture from your prompt, then applies it to the
          selected material slot.
        </p>
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
            {(
              [
                ["normalMapUrl", "Normal map"],
                ["roughnessMapUrl", "Roughness map"],
                ["metalnessMapUrl", "Metalness map"],
                ["aoMapUrl", "AO map"],
              ] as const
            ).map(([field, label]) => (
              <label
                key={field}
                className="mt-1 flex items-center justify-between gap-2 text-[10px] text-muted-foreground"
              >
                <span>{label}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="max-w-[150px] text-[9px]"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) updateMaterial(name, { [field]: URL.createObjectURL(file) });
                  }}
                />
              </label>
            ))}
            <Row label="Tiling">
              <Slider
                value={mat.repeat}
                onChange={(v) => updateMaterial(name, { repeat: v })}
                min={0.25}
                max={8}
                step={0.25}
              />
            </Row>
            <Row label="U offset">
              <Slider
                value={mat.offsetX}
                onChange={(v) => updateMaterial(name, { offsetX: v })}
                min={-1}
                max={1}
                step={0.01}
              />
            </Row>
            <Row label="V offset">
              <Slider
                value={mat.offsetY}
                onChange={(v) => updateMaterial(name, { offsetY: v })}
                min={-1}
                max={1}
                step={0.01}
              />
            </Row>
            <Row label="Rotation">
              <Slider
                value={mat.rotation}
                onChange={(v) => updateMaterial(name, { rotation: v })}
                min={-Math.PI}
                max={Math.PI}
                step={0.01}
                suffix="rad"
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
        <Row label="Mirror pose">
          <Toggle
            label={s.mocapMirror ? "on" : "off"}
            value={s.mocapMirror}
            onChange={s.setMocapMirror}
          />
        </Row>
        <div className="mt-2 grid grid-cols-2 gap-1">
          <button
            onClick={() => {
              s.setMocapSmoothing(0.35);
              s.setMocapOffset(0);
              toast.success("Jitter cleanup preset applied");
            }}
            className="rounded border border-border bg-[var(--panel-raised)] py-1.5 text-[10px] text-muted-foreground hover:text-foreground"
          >
            Remove jitter
          </button>
          <button
            onClick={() => {
              const unique = new Map(
                s.editorKeyframes.map((key) => [Math.round(key.time * 10), key]),
              );
              unique.forEach((key, bucket) => {
                s.moveEditorKeyframe(key.id, bucket / 10);
              });
              toast.success("Animation keys reduced to a 10-frame cleanup grid");
            }}
            className="rounded border border-border bg-[var(--panel-raised)] py-1.5 text-[10px] text-muted-foreground hover:text-foreground"
          >
            Reduce keys
          </button>
        </div>
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
                    {s.sourceBones.map((b, bi) => (
                      <option key={`${b}-${bi}`} value={b}>
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
                    {s.targetBones.map((b, bi) => (
                      <option key={`${b}-${bi}`} value={b}>
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

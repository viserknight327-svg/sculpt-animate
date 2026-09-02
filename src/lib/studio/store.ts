import { create } from "zustand";
import { autoMap, type JointMapping } from "./retarget";
import { DEFAULT_RIG_SPEC, type RigSpec } from "./rigbuilder";
import { SAMPLE_ASSETS } from "./samples";

export type MaterialOverride = {
  color: string;
  metalness: number;
  roughness: number;
  emissive: string;
  emissiveIntensity: number;
  opacity: number;
  wireframe: boolean;
  flatShading: boolean;
  mapUrl: string | null;
  mapName: string | null;
  normalMapUrl: string | null;
  roughnessMapUrl: string | null;
  metalnessMapUrl: string | null;
  aoMapUrl: string | null;
  repeat: number;
  offsetX: number;
  offsetY: number;
  rotation: number;
};

export const DEFAULT_MATERIAL: MaterialOverride = {
  color: "#b9b9c0",
  metalness: 0.15,
  roughness: 0.6,
  emissive: "#000000",
  emissiveIntensity: 0,
  opacity: 1,
  wireframe: false,
  flatShading: false,
  mapUrl: null,
  mapName: null,
  normalMapUrl: null,
  roughnessMapUrl: null,
  metalnessMapUrl: null,
  aoMapUrl: null,
  repeat: 1,
  offsetX: 0,
  offsetY: 0,
  rotation: 0,
};

export type ViewportSettings = {
  grid: boolean;
  floor: boolean;
  skeleton: boolean;
  bones: boolean;
  keyLight: number;
  fillLight: number;
  rimLight: number;
  exposure: number;
  fov: number;
};

export type StudioTab = "animate" | "skin" | "mocap" | "manga" | "rig";
export type ToolMode = "select" | "translate" | "rotate" | "scale";
export type RigEditMode = "object" | "edit" | "weight";
export type WeightPaintMode = "paint" | "erase" | "smooth";
export type AnimationMode = "ik" | "fk";
export type EditorKeyframe = { id: string; time: number; track: string; label: string };
export type PosePreset = { id: string; name: string; createdAt: number };

type StudioState = {
  // asset
  assetUrl: string;
  assetName: string;
  assetKind: "sample" | "upload" | "custom";
  loadAsset: (url: string, name: string, kind?: "sample" | "upload") => void;

  // procedural rig builder
  rigSpec: RigSpec;
  buildCustomRig: (spec?: Partial<RigSpec>) => void;
  updateRigSpec: (patch: Partial<RigSpec>) => void;

  // rig introspection (published by the viewport)
  clipNames: string[];
  keyframeTimes: number[];
  materialNames: string[];
  targetBones: string[];
  setRigInfo: (info: {
    clips: string[];
    materials: string[];
    bones: string[];
    defaults?: Record<string, Partial<MaterialOverride>>;
  }) => void;
  setKeyframeTimes: (t: number[]) => void;

  // playback
  activeClip: string | null;
  setActiveClip: (name: string | null) => void;
  playing: boolean;
  setPlaying: (v: boolean) => void;
  togglePlay: () => void;
  time: number;
  setTime: (t: number) => void;
  duration: number;
  setDuration: (d: number) => void;
  speed: number;
  setSpeed: (s: number) => void;
  loop: boolean;
  setLoop: (v: boolean) => void;
  rootMotion: boolean;
  setRootMotion: (v: boolean) => void;
  fps: number;
  setFps: (v: number) => void;

  // timeline editor
  editorKeyframes: EditorKeyframe[];
  addEditorKeyframe: (track?: string) => void;
  removeEditorKeyframe: (id: string) => void;
  moveEditorKeyframe: (id: string, time: number) => void;
  posePresets: PosePreset[];
  savePosePreset: (name: string) => void;
  applyPosePreset: (id: string) => void;
  blendStrength: number;
  setBlendStrength: (value: number) => void;

  // skin / materials
  materials: Record<string, MaterialOverride>;
  selectedMaterial: string | null;
  selectMaterial: (name: string | null) => void;
  updateMaterial: (name: string, patch: Partial<MaterialOverride>) => void;
  resetMaterial: (name: string) => void;

  // editor modes
  rigEditMode: RigEditMode;
  setRigEditMode: (mode: RigEditMode) => void;
  weightPaintMode: WeightPaintMode;
  setWeightPaintMode: (mode: WeightPaintMode) => void;
  weightBone: string | null;
  setWeightBone: (bone: string | null) => void;
  weightBrushSize: number;
  setWeightBrushSize: (size: number) => void;
  weightBrushStrength: number;
  setWeightBrushStrength: (strength: number) => void;
  animationMode: AnimationMode;
  setAnimationMode: (mode: AnimationMode) => void;
  ikEnabled: boolean;
  setIkEnabled: (enabled: boolean) => void;
  ikBlend: number;
  setIkBlend: (blend: number) => void;

  // viewport
  viewport: ViewportSettings;
  setViewport: (patch: Partial<ViewportSettings>) => void;

  // Blender-style viewport tools
  toolMode: ToolMode;
  setToolMode: (mode: ToolMode) => void;
  resetTransform: () => void;
  setObjectTransform: (patch: Partial<StudioState["objectTransform"]>) => void;
  objectTransform: {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
  };

  // mocap
  mocapUrl: string | null;
  mocapName: string | null;
  mocapEnabled: boolean;
  mocapDuration: number;
  sourceBones: string[];
  mapping: JointMapping;
  mocapInfluence: number;
  mocapSmoothing: number;
  setMocapSmoothing: (v: number) => void;
  mocapOffset: number;
  setMocapOffset: (v: number) => void;
  mocapMirror: boolean;
  setMocapMirror: (v: boolean) => void;
  loadMocap: (url: string, name: string) => void;
  clearMocap: () => void;
  setMocapEnabled: (v: boolean) => void;
  setMocapInfo: (info: { bones: string[]; duration: number }) => void;
  setMapping: (key: string, part: "source" | "target", bone: string | null) => void;
  autoMapBones: () => void;
  setMocapInfluence: (v: number) => void;

  // AI skin designer
  skinPrompt: string;
  setSkinPrompt: (prompt: string) => void;
  mangaPrompt: string;
  setMangaPrompt: (prompt: string) => void;
  mangaStyle: string;
  setMangaStyle: (style: string) => void;

  // ui
  tab: StudioTab;
  setTab: (t: StudioTab) => void;

  // project snapshot
  snapshot: () => Record<string, unknown>;
  restore: (data: Record<string, unknown>) => void;
};

const DEFAULT_VIEWPORT: ViewportSettings = {
  grid: true,
  floor: true,
  skeleton: false,
  bones: false,
  keyLight: 2.4,
  fillLight: 0.6,
  rimLight: 1.4,
  exposure: 1,
  fov: 38,
};

export const useStudio = create<StudioState>((set, get) => ({
  assetUrl: SAMPLE_ASSETS[0]!.url,
  assetName: SAMPLE_ASSETS[0]!.name,
  assetKind: "sample",
  loadAsset: (url, name, kind = "sample") =>
    set({
      assetUrl: url,
      assetName: name,
      assetKind: kind,
      clipNames: [],
      materialNames: [],
      materials: {},
      selectedMaterial: null,
      activeClip: null,
      time: 0,
      duration: 0,
      keyframeTimes: [],
    }),

  rigSpec: DEFAULT_RIG_SPEC,
  buildCustomRig: (patch) => {
    const spec = { ...get().rigSpec, ...(patch ?? {}) };
    set({
      rigSpec: spec,
      assetKind: "custom",
      assetName: spec.name,
      clipNames: [],
      materialNames: [],
      materials: {},
      selectedMaterial: null,
      activeClip: null,
      time: 0,
      duration: 0,
      keyframeTimes: [],
    });
  },
  updateRigSpec: (patch) =>
    set((s) => ({ rigSpec: { ...s.rigSpec, ...patch }, assetName: patch.name ?? s.assetName })),

  clipNames: [],
  keyframeTimes: [],
  materialNames: [],
  targetBones: [],
  setRigInfo: ({ clips, materials, bones, defaults }) => {
    const prev = get().materials;
    const next: Record<string, MaterialOverride> = {};
    for (const m of materials)
      next[m] = prev[m] ?? { ...DEFAULT_MATERIAL, ...(defaults?.[m] ?? {}) };
    set({
      clipNames: clips,
      materialNames: materials,
      targetBones: bones,
      materials: next,
      selectedMaterial:
        get().selectedMaterial && materials.includes(get().selectedMaterial!)
          ? get().selectedMaterial
          : (materials[0] ?? null),
      activeClip:
        get().activeClip && clips.includes(get().activeClip!)
          ? get().activeClip
          : (clips[0] ?? null),
    });
    const { sourceBones } = get();
    if (sourceBones.length) set({ mapping: autoMap(sourceBones, bones) });
  },
  setKeyframeTimes: (keyframeTimes) => set({ keyframeTimes }),

  activeClip: null,
  setActiveClip: (activeClip) => set({ activeClip, time: 0 }),
  playing: true,
  setPlaying: (playing) => set({ playing }),
  togglePlay: () => set({ playing: !get().playing }),
  time: 0,
  setTime: (time) => set({ time }),
  duration: 0,
  setDuration: (duration) => set({ duration }),
  speed: 1,
  setSpeed: (speed) => set({ speed }),
  loop: true,
  setLoop: (loop) => set({ loop }),
  rootMotion: false,
  setRootMotion: (rootMotion) => set({ rootMotion }),
  fps: 30,
  setFps: (fps) => set({ fps }),

  editorKeyframes: [],
  addEditorKeyframe: (track = "Rig") =>
    set((s) => ({
      editorKeyframes: [
        ...s.editorKeyframes,
        { id: `${track}-${s.time}-${Date.now()}`, time: s.time, track, label: `${track} key` },
      ].sort((a, b) => a.time - b.time),
    })),
  removeEditorKeyframe: (id) =>
    set((s) => ({ editorKeyframes: s.editorKeyframes.filter((key) => key.id !== id) })),
  moveEditorKeyframe: (id, time) =>
    set((s) => ({
      editorKeyframes: s.editorKeyframes
        .map((key) => (key.id === id ? { ...key, time } : key))
        .sort((a, b) => a.time - b.time),
    })),
  posePresets: [],
  savePosePreset: (name) =>
    set((s) => ({
      posePresets: [...s.posePresets, { id: `${name}-${Date.now()}`, name, createdAt: Date.now() }],
    })),
  applyPosePreset: () => set({ playing: false }),
  blendStrength: 0.5,
  setBlendStrength: (blendStrength) => set({ blendStrength }),

  materials: {},
  selectedMaterial: null,
  selectMaterial: (selectedMaterial) => set({ selectedMaterial }),
  updateMaterial: (name, patch) =>
    set((s) => ({
      materials: {
        ...s.materials,
        [name]: { ...(s.materials[name] ?? DEFAULT_MATERIAL), ...patch },
      },
    })),
  resetMaterial: (name) =>
    set((s) => ({ materials: { ...s.materials, [name]: { ...DEFAULT_MATERIAL } } })),

  rigEditMode: "object",
  setRigEditMode: (rigEditMode) => set({ rigEditMode }),
  weightPaintMode: "paint",
  setWeightPaintMode: (weightPaintMode) => set({ weightPaintMode }),
  weightBone: null,
  setWeightBone: (weightBone) => set({ weightBone }),
  weightBrushSize: 0.18,
  setWeightBrushSize: (weightBrushSize) => set({ weightBrushSize }),
  weightBrushStrength: 0.65,
  setWeightBrushStrength: (weightBrushStrength) => set({ weightBrushStrength }),
  animationMode: "ik",
  setAnimationMode: (animationMode) => set({ animationMode }),
  ikEnabled: true,
  setIkEnabled: (ikEnabled) => set({ ikEnabled }),
  ikBlend: 1,
  setIkBlend: (ikBlend) => set({ ikBlend }),

  viewport: DEFAULT_VIEWPORT,
  setViewport: (patch) => set((s) => ({ viewport: { ...s.viewport, ...patch } })),

  mocapUrl: null,
  mocapName: null,
  mocapEnabled: false,
  mocapDuration: 0,
  sourceBones: [],
  mapping: {},
  toolMode: "select",
  setToolMode: (toolMode) => set({ toolMode }),
  objectTransform: {
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
  },
  resetTransform: () =>
    set({ objectTransform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] } }),
  setObjectTransform: (patch) =>
    set((s) => ({ objectTransform: { ...s.objectTransform, ...patch } })),

  mocapInfluence: 1,
  mocapSmoothing: 0.15,
  setMocapSmoothing: (mocapSmoothing) => set({ mocapSmoothing }),
  mocapOffset: 0,
  setMocapOffset: (mocapOffset) => set({ mocapOffset }),
  mocapMirror: false,
  setMocapMirror: (mocapMirror) => set({ mocapMirror }),
  loadMocap: (url, name) => set({ mocapUrl: url, mocapName: name, mocapEnabled: true, time: 0 }),
  clearMocap: () =>
    set({
      mocapUrl: null,
      mocapName: null,
      mocapEnabled: false,
      sourceBones: [],
      mapping: {},
      mocapDuration: 0,
    }),
  setMocapEnabled: (mocapEnabled) => set({ mocapEnabled }),
  setMocapInfo: ({ bones, duration }) =>
    set({
      sourceBones: bones,
      mocapDuration: duration,
      mapping: autoMap(bones, get().targetBones),
    }),
  setMapping: (key, part, bone) =>
    set((s) => ({
      mapping: {
        ...s.mapping,
        [key]: { source: null, target: null, ...s.mapping[key], [part]: bone },
      },
    })),
  autoMapBones: () => set((s) => ({ mapping: autoMap(s.sourceBones, s.targetBones) })),
  setMocapInfluence: (mocapInfluence) => set({ mocapInfluence }),

  skinPrompt: "neon cyberpunk circuit armor",
  setSkinPrompt: (skinPrompt) => set({ skinPrompt }),
  mangaPrompt: "a cyber ninja hero with a long coat",
  setMangaPrompt: (mangaPrompt) => set({ mangaPrompt }),
  mangaStyle: "shonen hero",
  setMangaStyle: (mangaStyle) => set({ mangaStyle }),

  tab: "animate",
  setTab: (tab) => set({ tab }),

  snapshot: () => {
    const s = get();
    return {
      version: 1,
      assetUrl: s.assetKind === "sample" ? s.assetUrl : null,
      assetName: s.assetName,
      activeClip: s.activeClip,
      speed: s.speed,
      loop: s.loop,
      fps: s.fps,
      rootMotion: s.rootMotion,
      materials: s.materials,
      viewport: s.viewport,
      mapping: s.mapping,
      mocapInfluence: s.mocapInfluence,
      mocapSmoothing: s.mocapSmoothing,
      mocapOffset: s.mocapOffset,
      mocapMirror: s.mocapMirror,
      skinPrompt: s.skinPrompt,
      mangaPrompt: s.mangaPrompt,
      mangaStyle: s.mangaStyle,
      rigEditMode: s.rigEditMode,
      weightPaintMode: s.weightPaintMode,
      weightBone: s.weightBone,
      weightBrushSize: s.weightBrushSize,
      weightBrushStrength: s.weightBrushStrength,
      animationMode: s.animationMode,
      ikEnabled: s.ikEnabled,
      ikBlend: s.ikBlend,
      editorKeyframes: s.editorKeyframes,
      posePresets: s.posePresets,
      blendStrength: s.blendStrength,
      objectTransform: s.objectTransform,
    };
  },
  restore: (data) => {
    const d = data as Record<string, unknown>;
    set((s) => ({
      assetUrl: typeof d["assetUrl"] === "string" ? (d["assetUrl"] as string) : s.assetUrl,
      assetName: typeof d["assetName"] === "string" ? (d["assetName"] as string) : s.assetName,
      assetKind: typeof d["assetUrl"] === "string" ? ("sample" as const) : s.assetKind,
      activeClip: (d["activeClip"] as string) ?? s.activeClip,
      speed: (d["speed"] as number) ?? s.speed,
      loop: (d["loop"] as boolean) ?? s.loop,
      fps: (d["fps"] as number) ?? s.fps,
      rootMotion: (d["rootMotion"] as boolean) ?? s.rootMotion,
      materials: (d["materials"] as Record<string, MaterialOverride>) ?? s.materials,
      viewport: { ...s.viewport, ...(d["viewport"] as object) },
      mapping: (d["mapping"] as JointMapping) ?? s.mapping,
      mocapInfluence: (d["mocapInfluence"] as number) ?? s.mocapInfluence,
      mocapSmoothing: (d["mocapSmoothing"] as number) ?? s.mocapSmoothing,
      mocapOffset: (d["mocapOffset"] as number) ?? s.mocapOffset,
      mocapMirror: (d["mocapMirror"] as boolean) ?? s.mocapMirror,
      skinPrompt: (d["skinPrompt"] as string) ?? s.skinPrompt,
      mangaPrompt: (d["mangaPrompt"] as string) ?? s.mangaPrompt,
      mangaStyle: (d["mangaStyle"] as string) ?? s.mangaStyle,
      rigEditMode: (d["rigEditMode"] as RigEditMode) ?? s.rigEditMode,
      weightPaintMode: (d["weightPaintMode"] as WeightPaintMode) ?? s.weightPaintMode,
      weightBone: (d["weightBone"] as string | null) ?? s.weightBone,
      weightBrushSize: (d["weightBrushSize"] as number) ?? s.weightBrushSize,
      weightBrushStrength: (d["weightBrushStrength"] as number) ?? s.weightBrushStrength,
      animationMode: (d["animationMode"] as AnimationMode) ?? s.animationMode,
      ikEnabled: (d["ikEnabled"] as boolean) ?? s.ikEnabled,
      ikBlend: (d["ikBlend"] as number) ?? s.ikBlend,
      editorKeyframes: (d["editorKeyframes"] as EditorKeyframe[]) ?? s.editorKeyframes,
      posePresets: (d["posePresets"] as PosePreset[]) ?? s.posePresets,
      blendStrength: (d["blendStrength"] as number) ?? s.blendStrength,
      objectTransform:
        (d["objectTransform"] as StudioState["objectTransform"]) ?? s.objectTransform,
      time: 0,
    }));
  },
}));

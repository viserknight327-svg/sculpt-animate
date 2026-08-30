import { create } from "zustand";
import { autoMap, type JointMapping } from "./retarget";
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
  repeat: number;
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
  repeat: 1,
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

export type StudioTab = "animate" | "skin" | "mocap";

type StudioState = {
  // asset
  assetUrl: string;
  assetName: string;
  assetKind: "sample" | "upload";
  loadAsset: (url: string, name: string, kind?: "sample" | "upload") => void;

  // rig introspection (published by the viewport)
  clipNames: string[];
  keyframeTimes: number[];
  materialNames: string[];
  targetBones: string[];
  setRigInfo: (info: { clips: string[]; materials: string[]; bones: string[] }) => void;
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

  // skin / materials
  materials: Record<string, MaterialOverride>;
  selectedMaterial: string | null;
  selectMaterial: (name: string | null) => void;
  updateMaterial: (name: string, patch: Partial<MaterialOverride>) => void;
  resetMaterial: (name: string) => void;

  // viewport
  viewport: ViewportSettings;
  setViewport: (patch: Partial<ViewportSettings>) => void;

  // mocap
  mocapUrl: string | null;
  mocapName: string | null;
  mocapEnabled: boolean;
  mocapDuration: number;
  sourceBones: string[];
  mapping: JointMapping;
  mocapInfluence: number;
  loadMocap: (url: string, name: string) => void;
  clearMocap: () => void;
  setMocapEnabled: (v: boolean) => void;
  setMocapInfo: (info: { bones: string[]; duration: number }) => void;
  setMapping: (key: string, part: "source" | "target", bone: string | null) => void;
  autoMapBones: () => void;
  setMocapInfluence: (v: number) => void;

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
  assetUrl: SAMPLE_ASSETS[0].url,
  assetName: SAMPLE_ASSETS[0].name,
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

  clipNames: [],
  keyframeTimes: [],
  materialNames: [],
  targetBones: [],
  setRigInfo: ({ clips, materials, bones }) => {
    const prev = get().materials;
    const next: Record<string, MaterialOverride> = {};
    for (const m of materials) next[m] = prev[m] ?? { ...DEFAULT_MATERIAL };
    set({
      clipNames: clips,
      materialNames: materials,
      targetBones: bones,
      materials: next,
      selectedMaterial: get().selectedMaterial && materials.includes(get().selectedMaterial!) ? get().selectedMaterial : (materials[0] ?? null),
      activeClip: get().activeClip && clips.includes(get().activeClip!) ? get().activeClip : (clips[0] ?? null),
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

  viewport: DEFAULT_VIEWPORT,
  setViewport: (patch) => set((s) => ({ viewport: { ...s.viewport, ...patch } })),

  mocapUrl: null,
  mocapName: null,
  mocapEnabled: false,
  mocapDuration: 0,
  sourceBones: [],
  mapping: {},
  mocapInfluence: 1,
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
    set({ sourceBones: bones, mocapDuration: duration, mapping: autoMap(bones, get().targetBones) }),
  setMapping: (key, part, bone) =>
    set((s) => ({
      mapping: {
        ...s.mapping,
        [key]: { source: null, target: null, ...s.mapping[key], [part]: bone },
      },
    })),
  autoMapBones: () => set((s) => ({ mapping: autoMap(s.sourceBones, s.targetBones) })),
  setMocapInfluence: (mocapInfluence) => set({ mocapInfluence }),

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
    };
  },
  restore: (data) => {
    const d = data as Partial<ReturnType<StudioState["snapshot"]>> & Record<string, any>;
    set((s) => ({
      assetUrl: typeof d.assetUrl === "string" ? d.assetUrl : s.assetUrl,
      assetName: typeof d.assetName === "string" ? d.assetName : s.assetName,
      assetKind: typeof d.assetUrl === "string" ? "sample" : s.assetKind,
      activeClip: (d.activeClip as string) ?? s.activeClip,
      speed: (d.speed as number) ?? s.speed,
      loop: (d.loop as boolean) ?? s.loop,
      fps: (d.fps as number) ?? s.fps,
      rootMotion: (d.rootMotion as boolean) ?? s.rootMotion,
      materials: (d.materials as Record<string, MaterialOverride>) ?? s.materials,
      viewport: { ...s.viewport, ...(d.viewport as object) },
      mapping: (d.mapping as JointMapping) ?? s.mapping,
      mocapInfluence: (d.mocapInfluence as number) ?? s.mocapInfluence,
      time: 0,
    }));
  },
}));

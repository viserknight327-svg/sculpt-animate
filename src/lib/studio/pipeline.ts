import { SAMPLE_MOCAP } from "./samples";
import { createSkinDesign } from "./skinDesigner";
import { useStudio } from "./store";

/** Waits until a store selector becomes truthy (or times out). */
function waitFor<T>(
  select: (s: ReturnType<typeof useStudio.getState>) => T | null | undefined,
  ms = 6000,
) {
  return new Promise<T>((resolve, reject) => {
    const initial = select(useStudio.getState());
    if (initial) return resolve(initial as T);
    const timer = setTimeout(() => {
      unsub();
      reject(new Error("Timed out waiting for the viewport"));
    }, ms);
    const unsub = useStudio.subscribe((s) => {
      const value = select(s);
      if (!value) return;
      clearTimeout(timer);
      unsub();
      resolve(value as T);
    });
  });
}

const frame = () =>
  new Promise<void>((r) =>
    typeof requestAnimationFrame === "function"
      ? requestAnimationFrame(() => r())
      : setTimeout(r, 16),
  );

export type PipelineStep =
  | "rig"
  | "skin"
  | "mocap"
  | "retarget"
  | "render";

export type PipelineOptions = {
  prompt?: string;
  mocapId?: string;
  onStep?: (step: PipelineStep, label: string) => void;
};

/**
 * End-to-end authoring pass: build a biped skeleton, generate and apply a skin,
 * load a BVH capture, auto-retarget it onto the new rig and render a still.
 */
export async function runBipedPipeline(options: PipelineOptions = {}) {
  const { prompt = "neon cyberpunk circuit armor", mocapId = "walk", onStep } = options;
  const store = useStudio.getState();

  onStep?.("rig", "Building biped skeleton");
  store.buildCustomRig({
    preset: "biped",
    name: "Pipeline Biped",
    height: 1.78,
    spineSegments: 3,
    shoulderWidth: 0.42,
    armLength: 0.7,
    hipWidth: 0.27,
    legLength: 0.92,
    thickness: 0.09,
    tail: false,
  });
  const materials = await waitFor((s) => (s.materialNames.length ? s.materialNames : null));
  await waitFor((s) => (s.targetBones.length ? s.targetBones : null));

  onStep?.("skin", "Generating skin maps");
  const design = createSkinDesign(prompt);
  const update = useStudio.getState().updateMaterial;
  materials.forEach((name, index) =>
    update(name, {
      mapUrl: design.mapUrl,
      mapName: design.mapName,
      color: design.color,
      metalness: design.metalness,
      roughness: Math.min(1, design.roughness + index * 0.05),
      emissive: design.emissive,
      emissiveIntensity: design.emissiveIntensity,
      repeat: 1,
    }),
  );
  useStudio.getState().setSkinPrompt(prompt);

  onStep?.("mocap", "Loading motion capture");
  const capture = SAMPLE_MOCAP.find((m) => m.id === mocapId) ?? SAMPLE_MOCAP[0]!;
  useStudio.getState().loadMocap(capture.url, capture.name);
  await waitFor((s) => (s.sourceBones.length ? s.sourceBones : null), 12000);

  onStep?.("retarget", "Retargeting joints");
  useStudio.getState().autoMapBones();
  useStudio.getState().setMocapEnabled(true);
  useStudio.getState().setMocapInfluence(1);
  useStudio.getState().setPlaying(true);
  useStudio.getState().setTab("mocap");

  const mapped = Object.values(useStudio.getState().mapping).filter(
    (j) => j?.source && j?.target,
  ).length;

  onStep?.("render", "Rendering scene");
  for (let i = 0; i < 6; i += 1) await frame();

  return {
    rigName: "Pipeline Biped",
    skin: design.mapName,
    capture: capture.name,
    mappedJoints: mapped,
    bones: useStudio.getState().targetBones.length,
    duration: useStudio.getState().mocapDuration,
  };
}

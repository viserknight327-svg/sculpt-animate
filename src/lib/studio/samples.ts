export type SampleAsset = {
  id: string;
  name: string;
  url: string;
  kind: "character" | "creature";
  note: string;
};

/** CC0 assets (Quaternius, quaternius.com) shipped with the studio. */
export const SAMPLE_ASSETS: SampleAsset[] = [
  {
    id: "cyberpunk",
    name: "Cyber Operative",
    url: "/models/cyberpunk.glb",
    kind: "character",
    note: "22 clips · humanoid rig",
  },
  {
    id: "knight",
    name: "Knight",
    url: "/models/knight.glb",
    kind: "character",
    note: "12 clips · humanoid rig",
  },
  {
    id: "wolf",
    name: "Wolf",
    url: "/models/wolf.glb",
    kind: "creature",
    note: "12 clips · quadruped rig",
  },
];

export const SAMPLE_MOCAP = [
  {
    id: "pirouette",
    name: "Pirouette (BVH)",
    url: "/mocap/pirouette.bvh",
    note: "43 joints · optical capture",
  },
  {
    id: "walk",
    name: "Walk Cycle",
    url: "/mocap/walk-cycle.bvh",
    note: "19 joints · 40f loop · 30fps",
  },
  {
    id: "run",
    name: "Run Cycle",
    url: "/mocap/run-cycle.bvh",
    note: "19 joints · 26f loop · 30fps",
  },
  {
    id: "combat",
    name: "Combat Idle",
    url: "/mocap/combat-idle.bvh",
    note: "19 joints · 60f loop · 30fps",
  },
  {
    id: "jump",
    name: "Jump Arc",
    url: "/mocap/jump.bvh",
    note: "19 joints · 36f one-shot",
  },
];

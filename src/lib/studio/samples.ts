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
];

/**
 * Heuristic joint mapping between a mocap source skeleton (BVH) and a target
 * character rig. Produces a canonical-joint mapping the user can override.
 */

export type CanonicalJoint = {
  key: string;
  label: string;
  /** keyword sets, matched against a normalized bone name */
  match: string[][];
  side?: "L" | "R";
};

const L = "L" as const;
const R = "R" as const;

export const CANONICAL_JOINTS: CanonicalJoint[] = [
  { key: "hips", label: "Hips", match: [["hip"], ["pelvis"], ["root"]] },
  { key: "spine", label: "Spine", match: [["abdomen"], ["spine"], ["waist"]] },
  { key: "chest", label: "Chest", match: [["chest"], ["torso"], ["spine2"]] },
  { key: "neck", label: "Neck", match: [["neck"]] },
  { key: "head", label: "Head", match: [["head"]] },
  {
    key: "shoulderL",
    label: "Shoulder L",
    match: [["collar"], ["shoulder"], ["clavicle"]],
    side: L,
  },
  { key: "upperArmL", label: "Upper arm L", match: [["shldr"], ["upperarm"], ["arm"]], side: L },
  { key: "lowerArmL", label: "Forearm L", match: [["forearm"], ["lowerarm"], ["elbow"]], side: L },
  { key: "handL", label: "Hand L", match: [["hand"], ["palm"]], side: L },
  {
    key: "shoulderR",
    label: "Shoulder R",
    match: [["collar"], ["shoulder"], ["clavicle"]],
    side: R,
  },
  { key: "upperArmR", label: "Upper arm R", match: [["shldr"], ["upperarm"], ["arm"]], side: R },
  { key: "lowerArmR", label: "Forearm R", match: [["forearm"], ["lowerarm"], ["elbow"]], side: R },
  { key: "handR", label: "Hand R", match: [["hand"], ["palm"]], side: R },
  { key: "upperLegL", label: "Thigh L", match: [["thigh"], ["upperleg"], ["upleg"]], side: L },
  {
    key: "lowerLegL",
    label: "Shin L",
    match: [["shin"], ["lowerleg"], ["leg"], ["calf"]],
    side: L,
  },
  { key: "footL", label: "Foot L", match: [["foot"], ["ankle"]], side: L },
  { key: "upperLegR", label: "Thigh R", match: [["thigh"], ["upperleg"], ["upleg"]], side: R },
  {
    key: "lowerLegR",
    label: "Shin R",
    match: [["shin"], ["lowerleg"], ["leg"], ["calf"]],
    side: R,
  },
  { key: "footR", label: "Foot R", match: [["foot"], ["ankle"]], side: R },
];

function normalize(name: string) {
  return name.toLowerCase().replace(/[\s_.:-]/g, "");
}

function sideOf(name: string): "L" | "R" | null {
  const n = normalize(name);
  if (/(^l|left|_l$|\.l$)/.test(name.toLowerCase()) || /^l[a-z]/.test(n)) {
    if (/^left|^l[a-z]/.test(n) || /l$/.test(n)) {
      // fallthrough to explicit tests below
    }
  }
  const raw = name.toLowerCase();
  if (/(^|[^a-z])left([^a-z]|$)/.test(raw) || /[._-]l($|[._-])/.test(raw) || /^l[A-Z]/.test(name))
    return "L";
  if (/(^|[^a-z])right([^a-z]|$)/.test(raw) || /[._-]r($|[._-])/.test(raw) || /^r[A-Z]/.test(name))
    return "R";
  if (/^l[a-z]/.test(name) && /^[lr]/.test(name)) return name[0] === "l" ? "L" : "R";
  if (/^r[a-z]/.test(name)) return "R";
  return null;
}

function isEndBone(name: string) {
  return /(_end|end$|nub|pole|target|ik$)/i.test(name);
}

function scoreBone(joint: CanonicalJoint, bone: string): number {
  if (isEndBone(bone)) return -1;
  const n = normalize(bone);
  const s = sideOf(bone);
  if (joint.side && s !== joint.side) return -1;
  if (!joint.side && s) return -1;
  for (let tier = 0; tier < joint.match.length; tier++) {
    const keys = joint.match[tier] ?? [];
    if (keys.length && keys.every((k) => n.includes(k))) {
      // earlier tiers score higher; shorter names win ties
      return 100 - tier * 10 - Math.min(n.length, 30) * 0.1;
    }
  }
  return -1;
}

function bestBone(joint: CanonicalJoint, bones: string[], taken: Set<string>) {
  let best: { bone: string; score: number } | null = null;
  for (const bone of bones) {
    if (taken.has(bone)) continue;
    const score = scoreBone(joint, bone);
    if (score > 0 && (!best || score > best.score)) best = { bone, score };
  }
  return best?.bone ?? null;
}

export type JointMapping = Record<string, { source: string | null; target: string | null }>;

export function mirrorBoneName(name: string) {
  const swap = (left: string, right: string) => {
    if (name.includes(left)) return name.replace(left, right);
    if (name.includes(right)) return name.replace(right, left);
    return null;
  };
  return (
    swap(".L", ".R") ??
    swap("_L", "_R") ??
    swap("-L", "-R") ??
    swap("Left", "Right") ??
    swap("left", "right") ??
    swap("LEFT", "RIGHT") ??
    name
  );
}

export function autoMap(sourceBones: string[], targetBones: string[]): JointMapping {
  const mapping: JointMapping = {};
  const takenSource = new Set<string>();
  const takenTarget = new Set<string>();
  for (const joint of CANONICAL_JOINTS) {
    const source = bestBone(joint, sourceBones, takenSource);
    const target = bestBone(joint, targetBones, takenTarget);
    if (source) takenSource.add(source);
    if (target) takenTarget.add(target);
    mapping[joint.key] = { source, target };
  }
  return mapping;
}

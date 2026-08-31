import * as THREE from "three";

export type RigPreset = "biped" | "quadruped";

export type RigSpec = {
  preset: RigPreset;
  name: string;
  height: number; // overall body height in metres
  spineSegments: number; // 1 - 4
  neckLength: number;
  headSize: number;
  shoulderWidth: number;
  armLength: number;
  hipWidth: number;
  legLength: number;
  thickness: number;
  tail: boolean;
};

export const DEFAULT_RIG_SPEC: RigSpec = {
  preset: "biped",
  name: "Custom Rig",
  height: 1.75,
  spineSegments: 3,
  neckLength: 0.1,
  headSize: 0.22,
  shoulderWidth: 0.4,
  armLength: 0.68,
  hipWidth: 0.26,
  legLength: 0.9,
  thickness: 0.09,
  tail: false,
};

type BoneDef = {
  name: string;
  length: number;
  position: [number, number, number];
  rotation?: [number, number, number];
  radius: number;
  material: "Body" | "Limb" | "Head";
  children?: BoneDef[];
  shape?: "capsule" | "sphere" | "box";
};

function limb(
  name: string,
  length: number,
  radius: number,
  position: [number, number, number],
  rotation: [number, number, number],
  children?: BoneDef[],
): BoneDef {
  return {
    name,
    length,
    radius,
    position,
    rotation,
    material: "Limb",
    ...(children ? { children } : {}),
  };
}

function bipedTree(s: RigSpec): BoneDef {
  const seg = Math.max(1, Math.min(4, Math.round(s.spineSegments)));
  const torso = s.height - s.legLength - s.neckLength - s.headSize;
  const spineLen = Math.max(0.05, torso / seg);
  const upperArm = s.armLength * 0.5;
  const foreArm = s.armLength * 0.38;
  const hand = s.armLength * 0.12;
  const upperLeg = s.legLength * 0.5;
  const lowerLeg = s.legLength * 0.42;
  const foot = s.legLength * 0.18;
  const t = s.thickness;

  const arm = (side: "L" | "R"): BoneDef => {
    const dir = side === "L" ? 1 : -1;
    return {
      name: `Shoulder.${side}`,
      length: s.shoulderWidth / 2,
      radius: t * 0.9,
      position: [0, spineLen * 0.85, 0],
      rotation: [0, 0, (-Math.PI / 2) * dir],
      material: "Body",
      children: [
        limb(`UpperArm.${side}`, upperArm, t * 0.75, [0, s.shoulderWidth / 2, 0], [0, 0, -0.25], [
          limb(`LowerArm.${side}`, foreArm, t * 0.62, [0, upperArm, 0], [0, 0, -0.2], [
            {
              name: `Hand.${side}`,
              length: hand,
              radius: t * 0.6,
              position: [0, foreArm, 0],
              rotation: [0, 0, 0],
              material: "Limb",
              shape: "box",
            },
          ]),
        ]),
      ],
    };
  };

  const leg = (side: "L" | "R"): BoneDef => {
    const dir = side === "L" ? 1 : -1;
    return limb(
      `UpperLeg.${side}`,
      upperLeg,
      t * 0.85,
      [(s.hipWidth / 2) * dir, 0, 0],
      [0, 0, Math.PI],
      [
        limb(`LowerLeg.${side}`, lowerLeg, t * 0.7, [0, upperLeg, 0], [0, 0, 0], [
          {
            name: `Foot.${side}`,
            length: foot,
            radius: t * 0.65,
            position: [0, lowerLeg, 0],
            rotation: [Math.PI / 2, 0, 0],
            material: "Limb",
            shape: "box",
          },
        ]),
      ],
    );
  };

  // spine chain built from the top down so we can nest
  let node: BoneDef = {
    name: "Head",
    length: s.headSize,
    radius: s.headSize * 0.55,
    position: [0, s.neckLength, 0],
    material: "Head",
    shape: "sphere",
  };
  node = {
    name: "Neck",
    length: s.neckLength,
    radius: t * 0.6,
    position: [0, spineLen, 0],
    material: "Body",
    children: [node],
  };

  for (let i = seg - 1; i >= 0; i--) {
    const isChest = i === seg - 1;
    const name = seg === 1 ? "Spine" : i === 0 ? "Spine" : isChest ? "Chest" : `Spine${i + 1}`;
    const kids: BoneDef[] = [node];
    if (isChest) kids.push(arm("L"), arm("R"));
    node = {
      name,
      length: spineLen,
      radius: t * (isChest ? 1.5 : 1.25),
      position: [0, i === 0 ? 0 : spineLen, 0],
      material: "Body",
      children: kids,
    };
  }

  const hipsKids: BoneDef[] = [node, leg("L"), leg("R")];
  if (s.tail) {
    hipsKids.push(
      limb("Tail1", 0.22, t * 0.5, [0, 0, -t], [Math.PI / 2.3, 0, 0], [
        limb("Tail2", 0.2, t * 0.38, [0, 0.22, 0], [0.25, 0, 0]),
      ]),
    );
  }

  return {
    name: "Hips",
    length: 0.05,
    radius: t * 1.4,
    position: [0, s.legLength, 0],
    material: "Body",
    children: hipsKids,
  };
}

function quadrupedTree(s: RigSpec): BoneDef {
  const t = s.thickness;
  const bodyLen = s.height * 0.95;
  const legLen = s.legLength * 0.75;
  const upper = legLen * 0.5;
  const lower = legLen * 0.5;

  const leg = (name: string, x: number, z: number): BoneDef =>
    limb(name, upper, t * 0.7, [x, 0, z], [0, 0, Math.PI], [
      limb(`${name.replace("UpperLeg", "LowerLeg")}`, lower, t * 0.55, [0, upper, 0], [0, 0, 0], [
        {
          name: name.replace("UpperLeg", "Foot"),
          length: t * 1.6,
          radius: t * 0.5,
          position: [0, lower, 0],
          rotation: [Math.PI / 2, 0, 0],
          material: "Limb",
          shape: "box",
        },
      ]),
    ]);

  const head: BoneDef = {
    name: "Head",
    length: s.headSize,
    radius: s.headSize * 0.5,
    position: [0, s.neckLength, 0],
    material: "Head",
    shape: "sphere",
  };
  const neck: BoneDef = {
    name: "Neck",
    length: s.neckLength,
    radius: t * 0.7,
    position: [0, bodyLen, 0],
    rotation: [-0.5, 0, 0],
    material: "Body",
    children: [head],
  };
  const chest: BoneDef = {
    name: "Chest",
    length: bodyLen,
    radius: t * 1.5,
    position: [0, 0, 0],
    rotation: [-Math.PI / 2, 0, 0],
    material: "Body",
    children: [neck, leg("UpperLeg.FL", s.hipWidth / 2, 0), leg("UpperLeg.FR", -s.hipWidth / 2, 0)],
  };

  const kids: BoneDef[] = [chest, leg("UpperLeg.BL", s.hipWidth / 2, 0), leg("UpperLeg.BR", -s.hipWidth / 2, 0)];
  if (s.tail) {
    kids.push(
      limb("Tail1", 0.28, t * 0.45, [0, 0, -t], [Math.PI / 2.2, 0, 0], [
        limb("Tail2", 0.24, t * 0.32, [0, 0.28, 0], [0.3, 0, 0]),
      ]),
    );
  }

  return {
    name: "Hips",
    length: 0.06,
    radius: t * 1.3,
    position: [0, legLen, bodyLen / 2],
    material: "Body",
    children: kids,
  };
}

function makeMaterials() {
  return {
    Body: new THREE.MeshStandardMaterial({ name: "Body", color: "#b9b9c0", roughness: 0.55, metalness: 0.18 }),
    Limb: new THREE.MeshStandardMaterial({ name: "Limb", color: "#8f96a3", roughness: 0.5, metalness: 0.25 }),
    Head: new THREE.MeshStandardMaterial({ name: "Head", color: "#d3cbc0", roughness: 0.62, metalness: 0.08 }),
  } as const;
}

function buildBone(
  def: BoneDef,
  materials: ReturnType<typeof makeMaterials>,
  bones: THREE.Bone[],
): THREE.Bone {
  const bone = new THREE.Bone();
  bone.name = def.name;
  bone.position.set(...def.position);
  if (def.rotation) bone.rotation.set(...def.rotation);
  bones.push(bone);

  const r = Math.max(0.01, def.radius);
  const len = Math.max(0.02, def.length);
  let geo: THREE.BufferGeometry;
  if (def.shape === "sphere") geo = new THREE.SphereGeometry(r, 20, 16);
  else if (def.shape === "box") geo = new THREE.BoxGeometry(r * 1.6, r * 0.9, len);
  else geo = new THREE.CapsuleGeometry(r, Math.max(0.01, len - r * 2), 6, 14);

  const mesh = new THREE.Mesh(geo, materials[def.material]);
  mesh.name = `${def.name}_geo`;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  if (def.shape === "sphere") mesh.position.y = len * 0.5;
  else if (def.shape === "box") mesh.position.set(0, 0, len * 0.4);
  else mesh.position.y = len * 0.5;
  bone.add(mesh);

  def.children?.forEach((c) => bone.add(buildBone(c, materials, bones)));
  return bone;
}

function q(x: number, y: number, z: number) {
  return new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z));
}

function swingTrack(bone: string, base: THREE.Quaternion, amp: number, axis: "x" | "z", phase: number, duration: number) {
  const steps = 9;
  const times: number[] = [];
  const values: number[] = [];
  const tmp = new THREE.Quaternion();
  for (let i = 0; i < steps; i++) {
    const u = i / (steps - 1);
    times.push(u * duration);
    const a = Math.sin((u + phase) * Math.PI * 2) * amp;
    tmp.copy(base).multiply(axis === "x" ? q(a, 0, 0) : q(0, 0, a));
    values.push(tmp.x, tmp.y, tmp.z, tmp.w);
  }
  return new THREE.QuaternionKeyframeTrack(`${bone}.quaternion`, times, values);
}

function buildClips(root: THREE.Object3D, spec: RigSpec): THREE.AnimationClip[] {
  const base = new Map<string, THREE.Quaternion>();
  root.traverse((o) => {
    if ((o as THREE.Bone).isBone) base.set(o.name, o.quaternion.clone());
  });
  const b = (n: string) => base.get(n) ?? new THREE.Quaternion();
  const has = (n: string) => base.has(n);

  const clips: THREE.AnimationClip[] = [];

  // Idle — gentle breathing sway
  const idle: THREE.KeyframeTrack[] = [];
  if (has("Spine")) idle.push(swingTrack("Spine", b("Spine"), 0.035, "x", 0, 2.4));
  if (has("Chest")) idle.push(swingTrack("Chest", b("Chest"), 0.045, "x", 0.15, 2.4));
  if (has("Head")) idle.push(swingTrack("Head", b("Head"), 0.05, "x", 0.4, 2.4));
  if (has("UpperArm.L")) idle.push(swingTrack("UpperArm.L", b("UpperArm.L"), 0.06, "x", 0, 2.4));
  if (has("UpperArm.R")) idle.push(swingTrack("UpperArm.R", b("UpperArm.R"), 0.06, "x", 0.5, 2.4));
  if (idle.length) clips.push(new THREE.AnimationClip("Idle", 2.4, idle));

  // Walk — opposing limb swing
  const walk: THREE.KeyframeTrack[] = [];
  const dur = 1.1;
  const legs =
    spec.preset === "biped"
      ? ([
          ["UpperLeg.L", 0],
          ["UpperLeg.R", 0.5],
        ] as const)
      : ([
          ["UpperLeg.FL", 0],
          ["UpperLeg.FR", 0.5],
          ["UpperLeg.BL", 0.5],
          ["UpperLeg.BR", 0],
        ] as const);
  legs.forEach(([name, phase]) => {
    if (has(name)) walk.push(swingTrack(name, b(name), 0.55, "x", phase, dur));
    const lower = name.replace("UpperLeg", "LowerLeg");
    if (has(lower)) walk.push(swingTrack(lower, b(lower), 0.35, "x", phase + 0.25, dur));
  });
  if (has("UpperArm.L")) walk.push(swingTrack("UpperArm.L", b("UpperArm.L"), 0.5, "x", 0.5, dur));
  if (has("UpperArm.R")) walk.push(swingTrack("UpperArm.R", b("UpperArm.R"), 0.5, "x", 0, dur));
  if (has("Spine")) walk.push(swingTrack("Spine", b("Spine"), 0.06, "z", 0, dur));
  if (walk.length) clips.push(new THREE.AnimationClip("Walk", dur, walk));

  // Wave / alert pose loop (biped only)
  if (spec.preset === "biped" && has("LowerArm.R")) {
    const wave: THREE.KeyframeTrack[] = [
      swingTrack("UpperArm.R", b("UpperArm.R").clone().multiply(q(0, 0, 1.1)), 0.15, "x", 0, 1.6),
      swingTrack("LowerArm.R", b("LowerArm.R"), 0.5, "x", 0, 1.6),
    ];
    if (has("Head")) wave.push(swingTrack("Head", b("Head"), 0.08, "z", 0, 1.6));
    clips.push(new THREE.AnimationClip("Wave", 1.6, wave));
  }

  return clips;
}

/** Builds a procedural, fully-named skeleton plus generated animation clips. */
export function buildRig(spec: RigSpec): { root: THREE.Group; animations: THREE.AnimationClip[] } {
  const materials = makeMaterials();
  const bones: THREE.Bone[] = [];
  const tree = spec.preset === "biped" ? bipedTree(spec) : quadrupedTree(spec);
  const rootBone = buildBone(tree, materials, bones);

  const root = new THREE.Group();
  root.name = spec.name;
  root.add(rootBone);
  root.updateMatrixWorld(true);

  const animations = buildClips(root, spec);
  return { root, animations };
}

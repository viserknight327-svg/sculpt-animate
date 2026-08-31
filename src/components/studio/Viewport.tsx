import {
  Environment,
  GizmoHelper,
  GizmoViewport,
  Grid,
  Lightformer,
  OrbitControls,
  useGLTF,
} from "@react-three/drei";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { BVHLoader } from "three/examples/jsm/loaders/BVHLoader.js";
import { clone as skeletonClone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { buildRig } from "@/lib/studio/rigbuilder";
import { useStudio, type MaterialOverride } from "@/lib/studio/store";

const textureCache = new Map<string, THREE.Texture>();

function getTexture(url: string) {
  let tex = textureCache.get(url);
  if (!tex) {
    tex = new THREE.TextureLoader().load(url);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    textureCache.set(url, tex);
  }
  return tex;
}

/** Advances the global playhead. Lives outside React state updates per frame. */
function Playhead() {
  useFrame((_, rawDelta) => {
    const s = useStudio.getState();
    if (!s.playing || s.duration <= 0) return;
    const dt = Math.min(rawDelta, 0.05) * s.speed;
    let t = s.time + dt;
    if (t >= s.duration) {
      if (s.loop) t = t % s.duration;
      else {
        t = s.duration;
        s.setPlaying(false);
      }
    }
    s.setTime(t);
  }, -1);
  return null;
}

function MocapDriver({ bones }: { bones: Map<string, THREE.Bone> }) {
  const url = useStudio((s) => s.mocapUrl)!;
  const result = useLoader(BVHLoader, url);
  const setMocapInfo = useStudio((s) => s.setMocapInfo);
  const showBones = useStudio((s) => s.viewport.bones);

  const rootBone = result.skeleton.bones[0] as THREE.Bone;

  const mixer = useMemo(
    () => new THREE.AnimationMixer(rootBone),
    [result],
  );

  useEffect(() => {
    const action = mixer.clipAction(result.clip);
    action.play();
    setMocapInfo({
      bones: result.skeleton.bones.map((b) => b.name),
      duration: result.clip.duration,
    });
    return () => {
      mixer.stopAllAction();
    };
  }, [mixer, result, setMocapInfo]);

  const helper = useMemo(() => {
    const h = new THREE.SkeletonHelper(rootBone);
    (h.material as THREE.LineBasicMaterial).depthTest = false;
    return h;
  }, [result]);

  const sourceMap = useMemo(() => {
    const m = new Map<string, THREE.Bone>();
    result.skeleton.bones.forEach((b) => m.set(b.name, b));
    return m;
  }, [result]);

  useFrame(() => {
    const s = useStudio.getState();
    if (!s.mocapEnabled) return;
    mixer.setTime(Math.min(s.time, result.clip.duration));
    const influence = s.mocapInfluence;
    for (const joint of Object.values(s.mapping)) {
      if (!joint?.source || !joint?.target) continue;
      const src = sourceMap.get(joint.source);
      const dst = bones.get(joint.target);
      if (!src || !dst) continue;
      if (influence >= 0.999) dst.quaternion.copy(src.quaternion);
      else dst.quaternion.slerp(src.quaternion, influence);
    }
  }, 1);

  return (
    <group position={[1.6, 0, 0]} scale={0.011} visible={showBones}>
      <primitive object={rootBone} />
      <primitive object={helper} />
    </group>
  );
}

function GltfRig() {
  const assetUrl = useStudio((s) => s.assetUrl);
  const { scene, animations } = useGLTF(assetUrl);
  return <RigBody scene={scene} animations={animations} />;
}

function ProceduralRig() {
  const spec = useStudio((s) => s.rigSpec);
  const built = useMemo(() => buildRig(spec), [spec]);
  return <RigBody scene={built.root} animations={built.animations} />;
}

function Rig() {
  const assetKind = useStudio((s) => s.assetKind);
  return assetKind === "custom" ? <ProceduralRig /> : <GltfRig />;
}

function RigBody({ scene, animations }: { scene: THREE.Object3D; animations: THREE.AnimationClip[] }) {
  const setRigInfo = useStudio((s) => s.setRigInfo);
  const setKeyframeTimes = useStudio((s) => s.setKeyframeTimes);
  const materials = useStudio((s) => s.materials);
  const activeClip = useStudio((s) => s.activeClip);
  const mocapEnabled = useStudio((s) => s.mocapEnabled);
  const mocapUrl = useStudio((s) => s.mocapUrl);
  const rootMotion = useStudio((s) => s.rootMotion);
  const showSkeleton = useStudio((s) => s.viewport.skeleton);
  const [ready, setReady] = useState(false);


  const model = useMemo(() => {
    const root = skeletonClone(scene) as THREE.Object3D;
    root.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.frustumCulled = false;
      mesh.material = Array.isArray(mesh.material)
        ? mesh.material.map((m) => m.clone())
        : (mesh.material as THREE.Material).clone();
    });
    return root;
  }, [scene]);

  // normalize scale + ground the character
  const fit = useMemo(() => {
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box.getSize(size);
    const height = Math.max(size.y, 0.0001);
    const scale = 1.75 / height;
    return { scale, y: -box.min.y * scale };
  }, [model]);

  const materialMap = useMemo(() => {
    const map = new Map<string, THREE.MeshStandardMaterial[]>();
    model.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      list.forEach((m) => {
        const std = m as THREE.MeshStandardMaterial;
        const name = std.name || "Material";
        if (!map.has(name)) map.set(name, []);
        map.get(name)!.push(std);
      });
    });
    return map;
  }, [model]);

  const boneMap = useMemo(() => {
    const map = new Map<string, THREE.Bone>();
    model.traverse((o) => {
      const b = o as THREE.Bone;
      if (b.isBone) map.set(b.name, b);
    });
    return map;
  }, [model]);

  const mixer = useMemo(() => new THREE.AnimationMixer(model), [model]);

  const skeletonHelper = useMemo(() => {
    const h = new THREE.SkeletonHelper(model);
    (h.material as THREE.LineBasicMaterial).depthTest = false;
    return h;
  }, [model]);

  // publish rig info to the store
  useEffect(() => {
    const defaults: Record<string, Partial<MaterialOverride>> = {};
    materialMap.forEach((mats, name) => {
      const m = mats[0];
      if (!m) return;
      defaults[name] = {
        color: `#${m.color.getHexString()}`,
        metalness: m.metalness ?? 0.1,
        roughness: m.roughness ?? 0.6,
      };
    });
    setRigInfo({
      clips: animations.map((a) => a.name),
      materials: [...materialMap.keys()],
      bones: [...boneMap.keys()],
      defaults,
    });
    setReady(true);
  }, [animations, materialMap, boneMap, setRigInfo]);

  // clip switching
  useEffect(() => {
    mixer.stopAllAction();
    const clip = animations.find((a) => a.name === activeClip);
    if (!clip) {
      useStudio.getState().setDuration(useStudio.getState().mocapEnabled ? useStudio.getState().mocapDuration : 0);
      setKeyframeTimes([]);
      return;
    }
    const action = mixer.clipAction(clip);
    action.reset();
    action.play();
    action.paused = true;
    if (!useStudio.getState().mocapEnabled) useStudio.getState().setDuration(clip.duration);
    const times = new Set<number>();
    clip.tracks.forEach((t) => t.times.forEach((v) => times.add(Math.round(v * 1000) / 1000)));
    setKeyframeTimes([...times].sort((a, b) => a - b).slice(0, 400));
    return () => {
      action.stop();
    };
  }, [mixer, animations, activeClip, setKeyframeTimes]);

  useEffect(() => {
    if (mocapEnabled) {
      const d = useStudio.getState().mocapDuration;
      if (d > 0) useStudio.getState().setDuration(d);
    } else {
      const clip = animations.find((a) => a.name === useStudio.getState().activeClip);
      useStudio.getState().setDuration(clip?.duration ?? 0);
    }
  }, [mocapEnabled, animations]);

  // material overrides
  useEffect(() => {
    materialMap.forEach((mats, name) => {
      const o = materials[name];
      if (!o) return;
      mats.forEach((m) => {
        m.color.set(o.color);
        m.metalness = o.metalness;
        m.roughness = o.roughness;
        m.emissive.set(o.emissive);
        m.emissiveIntensity = o.emissiveIntensity;
        m.opacity = o.opacity;
        m.transparent = o.opacity < 1;
        m.wireframe = o.wireframe;
        m.flatShading = o.flatShading;
        const tex = o.mapUrl ? getTexture(o.mapUrl) : null;
        if (tex) {
          tex.repeat.set(o.repeat, o.repeat);
          tex.needsUpdate = true;
        }
        m.map = tex;
        m.needsUpdate = true;
      });
    });
  }, [materials, materialMap]);

  useFrame(() => {
    const s = useStudio.getState();
    mixer.setTime(Math.max(s.time, 0.0001));
    if (!s.rootMotion) {
      const hips = model.children[0];
      void hips;
    }
  }, 0);

  useEffect(() => {
    if (rootMotion) return;
    // keep the character centered by zeroing horizontal root translation
  }, [rootMotion]);

  return (
    <group position={[0, fit.y, 0]} scale={fit.scale}>
      <primitive object={model} />
      {showSkeleton && <primitive object={skeletonHelper} />}
      {ready && mocapUrl && (
        <Suspense fallback={null}>
          <MocapDriver bones={boneMap} />
        </Suspense>
      )}
    </group>
  );
}

function Stage() {
  const vp = useStudio((s) => s.viewport);
  const { gl, camera } = useThree();

  useEffect(() => {
    gl.toneMappingExposure = vp.exposure;
  }, [gl, vp.exposure]);

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = vp.fov;
    cam.updateProjectionMatrix();
  }, [camera, vp.fov]);

  return (
    <>
      <hemisphereLight intensity={vp.fillLight} color="#93a4c4" groundColor="#2b2723" />
      <directionalLight
        position={[4, 7, 5]}
        intensity={vp.keyLight}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={25}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
        shadow-bias={-0.0008}
      />
      <directionalLight position={[-5, 3, -6]} intensity={vp.rimLight} color="#7fd8ff" />

      <Environment resolution={128}>
        <Lightformer intensity={2.2} position={[0, 6, 0]} scale={[12, 12, 1]} rotation-x={Math.PI / 2} />
        <Lightformer intensity={1.1} color="#8ab6d6" position={[-6, 2, -2]} rotation-y={Math.PI / 2} scale={[16, 3, 1]} />
        <Lightformer intensity={0.8} color="#e0a06a" position={[6, 2, 2]} rotation-y={-Math.PI / 2} scale={[16, 3, 1]} />
      </Environment>

      {vp.floor && (
        <mesh rotation-x={-Math.PI / 2} position-y={-0.001} receiveShadow>
          <planeGeometry args={[60, 60]} />
          <meshStandardMaterial color="#1b1d21" roughness={0.85} metalness={0.05} />
        </mesh>
      )}

      {vp.grid && (
        <Grid
          args={[40, 40]}
          cellSize={0.25}
          cellThickness={0.6}
          cellColor="#3a3f47"
          sectionSize={1}
          sectionThickness={1.1}
          sectionColor="#5a6270"
          fadeDistance={26}
          fadeStrength={1.6}
          followCamera={false}
          infiniteGrid
        />
      )}
    </>
  );
}

export default function Viewport() {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div ref={ref} className="relative h-full w-full" style={{ background: "var(--gradient-viewport)" }}>
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping }}
        camera={{ position: [2.6, 1.9, 3.4], fov: 38, near: 0.1, far: 100 }}
      >
        <Playhead />
        <Suspense fallback={null}>
          <Stage />
          <Rig />
        </Suspense>
        <OrbitControls
          makeDefault
          target={[0, 0.9, 0]}
          enableDamping
          dampingFactor={0.08}
          minDistance={1}
          maxDistance={18}
          maxPolarAngle={Math.PI / 1.9}
        />
        <GizmoHelper alignment="top-right" margin={[64, 64]}>
          <GizmoViewport axisColors={["#e0794a", "#7fd88a", "#5aa8e8"]} labelColor="#e8e8ea" />
        </GizmoHelper>
      </Canvas>
    </div>
  );
}

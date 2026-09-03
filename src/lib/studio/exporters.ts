import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

let rigRoot: THREE.Object3D | null = null;

/** The viewport registers the live rig subtree here so exporters can reach it. */
export function registerRigRoot(root: THREE.Object3D | null) {
  rigRoot = root;
}

export function getRigRoot() {
  return rigRoot;
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function slug(name: string) {
  return name.trim().replace(/\s+/g, "-").toLowerCase() || "kinetiq-rig";
}

/** Exports the current rig (skeleton, meshes, materials) as a binary glTF file. */
export async function exportRigGlb(name: string, animations: THREE.AnimationClip[] = []) {
  const root = getRigRoot();
  if (!root) throw new Error("No rig is loaded in the viewport yet");
  const exporter = new GLTFExporter();
  const result = await exporter.parseAsync(root, {
    binary: true,
    animations,
    onlyVisible: false,
  });
  const blob =
    result instanceof ArrayBuffer
      ? new Blob([result], { type: "model/gltf-binary" })
      : new Blob([JSON.stringify(result)], { type: "model/gltf+json" });
  download(blob, `${slug(name)}.glb`);
}

/** Grabs the live WebGL canvas as a full-resolution PNG. */
export function captureStill(): string | null {
  if (typeof document === "undefined") return null;
  const canvas = document.querySelector("canvas");
  if (!canvas) return null;
  try {
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

export function downloadStill(name: string) {
  const data = captureStill();
  if (!data) throw new Error("The viewport could not be captured");
  const a = document.createElement("a");
  a.href = data;
  a.download = `${slug(name)}-render.png`;
  a.click();
  return data;
}

# Motion Forge Studio

Motion Forge Studio is a browser-based 3D character and animation workspace focused on manga character design, procedural rigging, material and UV authoring, motion-capture cleanup, and retarget-ready animation workflows.

**Live app:** [sculpt-animate.lovable.app](https://sculpt-animate.lovable.app)

## Current capabilities

| Workspace      | Available now                                                                                                                                                                                 |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Manga          | Prompt-driven manga character briefs, style presets, automatic proportion selection, named rig generation, and one-click handoff to skin design.                                              |
| Rig            | Biped, quadruped, avian, and hexapod rig presets; edit-mode switching; named-bone selection; IK/FK mode controls; IK blend; weight-paint brush, erase, smooth, radius, and strength settings. |
| Skin           | Prompt-driven AI-assisted procedural texture maps, PBR material controls, image map import, UV tiling, U/V offsets, texture rotation, emission, opacity, wireframe, and flat shading.         |
| Animate        | Clip playback, frame-rate selection, loop/root-motion controls, editable animation tracks, user keyframes, pose presets, and blend-strength control.                                          |
| Motion capture | BVH import and retargeting, automatic joint mapping, manual source/target overrides, influence, time offset, smoothing, mirrored pose correction, jitter-cleanup preset, and key reduction.   |
| Live capture   | Browser camera preview and WebM motion-reference recording for capture-session review.                                                                                                        |
| Viewport       | Three.js scene, transform gizmos, persistent transforms, grid/floor/stage controls, front/side/top framing shortcuts, and project JSON import/export.                                         |

## One-click character-to-animation workflow

1. Open the **Manga** tab and describe the character.
2. Choose a manga style and click **Generate + auto-rig character**.
3. Open **Skin** and generate an editable prompt-driven texture map.
4. Open **Mocap** and import a BVH capture or use the live camera panel as a motion reference.
5. Use smoothing, time offset, influence, mirroring, and manual mapping to clean and retarget the motion.
6. Use the timeline to scrub, add keyframes, save poses, and adjust blend strength.
7. Export the local project JSON or the generated motion-reference recording for the next production step.

## Development

Prefer working locally? You need Node.js and npm. Then run:

```sh
git clone https://github.com/viserknight327-svg/sculpt-animate.git
cd sculpt-animate
npm i
npm run dev
```

## Important implementation notes

The Manga and Skin workspaces are intentionally editable and deterministic in the browser: prompts select proportions, palettes, pattern families, and PBR values, while the generated texture map is produced on a canvas and immediately applied to the selected material. This makes the workflow usable without exposing an API key, while leaving a clean integration point for a hosted image-generation provider later.

The live camera panel currently records a motion-reference video. Production-grade webcam body tracking still requires a browser pose-estimation runtime and model asset; it should be added as a dedicated adapter so model loading, permissions, landmark confidence, calibration, and skeleton retargeting remain testable independently from the editor UI.

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/cd0a3c64-d184-4c17-9bd4-04d5fd4c9fc2). Changes pushed to `main` stay synchronized with the repository workflow.

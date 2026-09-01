# Motion Forge Studio — Final 3D Production Plan

## Product direction

Motion Forge Studio should become a focused browser-based alternative for manga characters, humanoid rigging, motion capture, look development, and animation review. The editor should always distinguish between **procedural sample rigs**, **imported rigged characters**, and **unrigged imported meshes** so each workflow exposes only tools that can operate reliably.

## Reliable humanoid rig tiers

| Tier                      | Input                                  | Behavior                                                                                                           | Required controls                                                                                 |
| ------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Sample humanoid           | Cyber Operative or Knight GLB          | Load embedded skeleton, clips, and materials; normalize scale; frame camera; expose maps and retargeting.          | Outliner, skeleton overlay, clip selector, material slots, map slots, BVH retargeting.            |
| Procedural humanoid       | Manga prompt or rig-builder parameters | Generate a named biped skeleton with Hips, Spine, Chest, Neck, Head, shoulders, arms, hands, legs, and feet.       | Proportion sliders, edit mode, bone selection, IK/FK mode, pose keyframes, export.                |
| Imported unrigged mesh    | GLB/GLTF mesh                          | Analyze bounds and landmarks, propose a humanoid skeleton, let the user confirm bone placement, then bind weights. | Detection preview, manual bone placement, bind, weight paint, validation report.                  |
| Imported rigged character | GLB/GLTF skeleton                      | Preserve the existing skeleton and map it into the canonical humanoid schema.                                      | Automatic naming map, manual source/target overrides, proportion compensation, animation preview. |

## Map and material roadmap

The material system should support both separate maps and packed texture conventions. Every map must have a preview, color-space rule, tiling, U/V offset, rotation, and clear/reset action.

| Map                   | Purpose                                                     | Planned controls                                                                           |
| --------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Base Color / Albedo   | Main surface color or manga cel-shade palette.              | Image import, AI-assisted generation, palette extraction, hue/saturation/value adjustment. |
| Normal                | Small surface detail without extra geometry.                | Strength, flip green channel, tangent-space preview.                                       |
| Roughness             | Surface gloss response.                                     | Invert, contrast, remap black/white, preview as grayscale.                                 |
| Metalness             | Metallic response.                                          | Scalar override, packed-channel selection, preview.                                        |
| Ambient Occlusion     | Crevice and contact darkening.                              | Strength, multiply mode, preview.                                                          |
| Height / Displacement | Silhouette or relief detail.                                | Scale, mid-level, optional tessellation mode.                                              |
| Emission              | Neon, magic, cyberpunk, and manga energy accents.           | Color, intensity, mask map, bloom preview.                                                 |
| Opacity / Cutout      | Hair cards, cloth cutouts, decals, and effects.             | Alpha mode, cutoff, dither toggle.                                                         |
| Toon ramp             | Manga shadow bands and graphic lighting.                    | Ramp stops, shadow threshold, outline color, outline width.                                |
| Matcap                | Fast sculpt and illustration preview.                       | Matcap library, rotation, strength, cavity amount.                                         |
| Packed ORM            | Efficient GLTF-style occlusion/roughness/metalness texture. | Channel assignment, unpacked previews, validation warnings.                                |

## Final workflow

The primary production path is **Design → Rig → Skin → Capture → Retarget → Clean → Animate → Preview → Export**. The editor should surface a progress checklist and a validation status for each stage. A character is considered ready only when it has a visible mesh, a valid skeleton, at least one material, at least one animation clip or pose, and a successful map/rig validation pass.

## Highest-priority engineering milestones

1. **Humanoid sample hardening.** Add explicit asset validation, skeleton detection, clip validation, material-slot validation, embedded-map preservation, and a clear error state when a GLB cannot load.
2. **Automatic rigging.** Add a landmark-detection adapter for unrigged meshes, generate a canonical humanoid skeleton, display a confirmation overlay, and support manual bone repositioning before binding.
3. **Weight painting.** Add a bind step, per-vertex influence storage, brush raycasting, paint/erase/smooth behavior, heat-map visualization, mirror painting, normalization, and undo/redo.
4. **Animation authoring.** Upgrade the timeline from markers to editable tracks with keyframe drag, delete, interpolation, copy/paste, pose-to-key, and track mute/solo.
5. **IK/FK.** Add pole targets for elbows and knees, hand/foot controllers, chain lengths, stretch limits, FK bake, IK bake, and blendable transitions.
6. **Motion capture.** Add a pose-estimation adapter for webcam landmarks, calibration, confidence thresholds, recording, cleanup, and BVH export. The current camera feature remains a motion-reference recorder until this adapter is implemented.
7. **Retargeting.** Add rest-pose calibration, scale compensation, twist distribution, root-motion options, mirrored retargeting, and a mapping confidence report.
8. **Manga generation.** Connect the current prompt-driven character planner and procedural skin-map generator to a hosted image model only through a server-side provider adapter, preserving editable maps and deterministic fallback presets.
9. **Export.** Complete GLB/GLTF export first, BVH export second, and FBX only through an explicit conversion service or native runtime capable of preserving skeletons, weights, animation tracks, and map references.

## Reliability gates

Every release should pass four gates: the sample humanoid loads with no console errors; the default material and every map slot can be edited without breaking the viewport; a Walk or Idle clip plays and scrubs correctly; and a BVH capture can be loaded, auto-mapped, manually corrected, smoothed, mirrored, and previewed on the humanoid rig.

The current implementation now provides the working foundation for these gates: sample GLB assets, procedural humanoid rigs, PBR map slots, Manga prompt-to-rig generation, timeline keyframes, pose/blend controls, BVH retargeting, cleanup controls, and camera motion-reference recording.

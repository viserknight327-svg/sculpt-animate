import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { DEFAULT_RIG_SPEC, type RigSpec } from "@/lib/studio/rigbuilder";
import { SAMPLE_ASSETS, SAMPLE_MOCAP } from "@/lib/studio/samples";
import { useStudio } from "@/lib/studio/store";

export default function AssetsPanel() {
  const {
    assetUrl,
    assetKind,
    loadAsset,
    loadMocap,
    mocapName,
    clipNames,
    activeClip,
    setActiveClip,
    materialNames,
    selectMaterial,
    setTab,
    selectedMaterial,
    rigSpec,
    buildCustomRig,
    updateRigSpec,
  } = useStudio();
  const modelInput = useRef<HTMLInputElement>(null);
  const mocapInput = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const custom = assetKind === "custom";

  useEffect(() => {
    if (videoRef.current && cameraStream) videoRef.current.srcObject = cameraStream;
    return () => {
      cameraStream?.getTracks().forEach((track) => track.stop());
    };
  }, [cameraStream]);

  const toggleCamera = async () => {
    if (cameraStream) {
      if (recording) recorderRef.current?.stop();
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
      setRecording(false);
      return;
    }
    if (
      typeof window === "undefined" ||
      !window.isSecureContext ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      toast.error("Camera capture requires HTTPS or localhost in a supported browser");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setCameraStream(stream);
    } catch (error) {
      const name = error instanceof DOMException ? error.name : "";
      toast.error(
        name === "NotAllowedError"
          ? "Camera permission was denied — allow camera access and try again"
          : name === "NotFoundError"
            ? "No camera was found on this device"
            : "Camera access could not be started",
      );
    }
  };

  const toggleRecording = () => {
    if (!cameraStream) return;
    if (recording) {
      recorderRef.current?.stop();
      setRecording(false);
      return;
    }
    if (typeof MediaRecorder === "undefined") {
      toast.error("This browser cannot record camera references");
      return;
    }
    chunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : "video/webm";
    const recorder = new MediaRecorder(cameraStream, { mimeType });
    recorder.ondataavailable = (event) => event.data.size && chunksRef.current.push(event.data);
    recorder.onstop = () => {
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
      setRecordedUrl(URL.createObjectURL(new Blob(chunksRef.current, { type: "video/webm" })));
      toast.success("Webcam take recorded — use it as a motion reference");
    };
    recorderRef.current = recorder;
    recorder.start();
    setRecording(true);
  };

  const apply = (patch: Partial<RigSpec>) => {
    updateRigSpec(patch);
    if (custom) buildCustomRig(patch);
  };

  return (
    <aside className="panel-surface hairline-r flex w-[268px] shrink-0 flex-col overflow-y-auto">
      <Section title="Live capture">
        <div className="overflow-hidden rounded-md border border-border bg-black">
          {cameraStream ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="aspect-video w-full object-cover"
            />
          ) : (
            <div className="grid aspect-video place-items-center px-4 text-center text-[10px] text-muted-foreground">
              Camera preview and capture source
            </div>
          )}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-1">
          <button
            onClick={toggleCamera}
            className="rounded-md border border-border bg-[var(--panel-raised)] py-1.5 text-[11px] text-muted-foreground hover:text-foreground"
          >
            {cameraStream ? "Stop camera" : "Start camera"}
          </button>
          <button
            onClick={toggleRecording}
            disabled={!cameraStream}
            className={`rounded-md border py-1.5 text-[11px] ${recording ? "border-red-400/60 bg-red-400/10 text-red-300" : "border-[var(--data)]/40 bg-[var(--data)]/10 text-[var(--data)]"} disabled:opacity-40`}
          >
            {recording ? "Stop take" : "Record take"}
          </button>
        </div>
        {recordedUrl && (
          <a
            href={recordedUrl}
            download="motion-reference.webm"
            className="mt-2 block text-center text-[10px] text-primary hover:underline"
          >
            Download motion reference
          </a>
        )}
        <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground/70">
          Capture a clean reference take here, then use BVH import or a pose-tracking adapter to
          drive the retargeting rig.
        </p>
      </Section>

      <Section title="Asset library">
        <div className="space-y-1">
          {SAMPLE_ASSETS.map((a) => (
            <button
              key={a.id}
              onClick={() => loadAsset(a.url, a.name, "sample")}
              className={`flex w-full flex-col rounded-md border px-2.5 py-2 text-left transition-colors ${
                assetUrl === a.url && !custom
                  ? "border-primary/60 bg-primary/10"
                  : "border-border bg-[var(--panel-raised)] hover:border-primary/40"
              }`}
            >
              <span className="text-[13px] font-medium">{a.name}</span>
              <span className="num text-[10px] text-muted-foreground">{a.note}</span>
            </button>
          ))}
        </div>
        <input
          ref={modelInput}
          type="file"
          accept=".glb,.gltf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            loadAsset(URL.createObjectURL(f), f.name, "upload");
            toast.success(`Loaded ${f.name}`);
          }}
        />
        <button
          onClick={() => modelInput.current?.click()}
          className="mt-2 w-full rounded-md border border-dashed border-border py-2 text-xs text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
        >
          + Import rig (.glb / .gltf)
        </button>
      </Section>

      <Section title="Rig builder">
        <div className="mb-2 grid grid-cols-2 gap-1">
          {(["biped", "quadruped", "avian", "hexapod"] as const).map((p) => (
            <button
              key={p}
              onClick={() => buildCustomRig({ preset: p })}
              className={`rounded-md border py-1.5 text-[11px] capitalize transition-colors ${
                custom && rigSpec.preset === p
                  ? "border-primary/60 bg-primary/10 text-foreground"
                  : "border-border bg-[var(--panel-raised)] text-muted-foreground hover:border-primary/40"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <label className="block">
          <span className="label-xs">Rig name</span>
          <input
            value={rigSpec.name}
            onChange={(e) => apply({ name: e.target.value })}
            className="mt-1 mb-2 w-full rounded-md border border-border bg-[var(--panel-raised)] px-2 py-1 text-xs focus:border-primary/60 focus:outline-none"
          />
        </label>

        <Num
          label="Height"
          value={rigSpec.height}
          min={0.6}
          max={3}
          step={0.05}
          unit="m"
          onChange={(v) => apply({ height: v })}
        />
        <Num
          label="Spine joints"
          value={rigSpec.spineSegments}
          min={1}
          max={4}
          step={1}
          onChange={(v) => apply({ spineSegments: v })}
        />
        <Num
          label="Neck"
          value={rigSpec.neckLength}
          min={0.02}
          max={0.5}
          step={0.01}
          unit="m"
          onChange={(v) => apply({ neckLength: v })}
        />
        <Num
          label="Head size"
          value={rigSpec.headSize}
          min={0.08}
          max={0.5}
          step={0.01}
          unit="m"
          onChange={(v) => apply({ headSize: v })}
        />
        <Num
          label="Shoulders"
          value={rigSpec.shoulderWidth}
          min={0.1}
          max={0.9}
          step={0.01}
          unit="m"
          onChange={(v) => apply({ shoulderWidth: v })}
        />
        <Num
          label="Arm length"
          value={rigSpec.armLength}
          min={0.2}
          max={1.2}
          step={0.01}
          unit="m"
          onChange={(v) => apply({ armLength: v })}
        />
        <Num
          label="Hip width"
          value={rigSpec.hipWidth}
          min={0.08}
          max={0.8}
          step={0.01}
          unit="m"
          onChange={(v) => apply({ hipWidth: v })}
        />
        <Num
          label="Leg length"
          value={rigSpec.legLength}
          min={0.2}
          max={1.4}
          step={0.01}
          unit="m"
          onChange={(v) => apply({ legLength: v })}
        />
        <Num
          label="Thickness"
          value={rigSpec.thickness}
          min={0.02}
          max={0.25}
          step={0.005}
          unit="m"
          onChange={(v) => apply({ thickness: v })}
        />

        <label className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>Tail chain</span>
          <input
            type="checkbox"
            checked={rigSpec.tail}
            onChange={(e) => apply({ tail: e.target.checked })}
            className="h-3.5 w-3.5 accent-[var(--primary)]"
          />
        </label>

        <div className="mt-3 grid grid-cols-2 gap-1">
          <button
            onClick={() => {
              buildCustomRig();
              toast.success(`${rigSpec.name} built — Idle / Walk clips generated`);
            }}
            className="signal-fill rounded-md py-1.5 text-[11px] font-semibold"
          >
            {custom ? "Rebuild rig" : "Build rig"}
          </button>
          <button
            onClick={() => buildCustomRig(DEFAULT_RIG_SPEC)}
            className="rounded-md border border-border bg-[var(--panel-raised)] py-1.5 text-[11px] text-muted-foreground hover:text-foreground"
          >
            Reset
          </button>
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground/70">
          Bones are named for retargeting (Hips, Spine, Chest, Neck, Head, UpperArm.L…), so BVH
          capture maps onto your custom skeleton automatically.
        </p>
      </Section>

      <Section title="Mocap library">
        <div className="space-y-1">
          {SAMPLE_MOCAP.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                loadMocap(m.url, m.name);
                setTab("mocap");
              }}
              className={`flex w-full flex-col rounded-md border px-2.5 py-2 text-left transition-colors ${
                mocapName === m.name
                  ? "border-[var(--data)]/60 bg-[var(--data)]/10"
                  : "border-border bg-[var(--panel-raised)] hover:border-[var(--data)]/40"
              }`}
            >
              <span className="text-[13px] font-medium">{m.name}</span>
              <span className="num text-[10px] text-muted-foreground">{m.note}</span>
            </button>
          ))}
        </div>
        <input
          ref={mocapInput}
          type="file"
          accept=".bvh"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            loadMocap(URL.createObjectURL(f), f.name);
            setTab("mocap");
            toast.success(`Capture loaded: ${f.name}`);
          }}
        />
        <button
          onClick={() => mocapInput.current?.click()}
          className="mt-2 w-full rounded-md border border-dashed border-border py-2 text-xs text-muted-foreground transition-colors hover:border-[var(--data)]/60 hover:text-foreground"
        >
          + Import capture (.bvh)
        </button>
      </Section>

      <Section title={`Clips (${clipNames.length})`}>
        <div className="max-h-56 space-y-0.5 overflow-y-auto">
          {clipNames.length === 0 && <Empty>No clips on this rig</Empty>}
          {clipNames.map((c) => (
            <button
              key={c}
              onClick={() => setActiveClip(c)}
              className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs transition-colors ${
                activeClip === c
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
              <span className="truncate">{c.split("|").pop()}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title={`Materials (${materialNames.length})`}>
        <div className="space-y-0.5">
          {materialNames.length === 0 && <Empty>No materials</Empty>}
          {materialNames.map((m) => (
            <button
              key={m}
              onClick={() => {
                selectMaterial(m);
                setTab("skin");
              }}
              className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs transition-colors ${
                selectedMaterial === m
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <span className="truncate">{m}</span>
            </button>
          ))}
        </div>
      </Section>
    </aside>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="hairline-b p-3">
      <h2 className="label-xs mb-2">{title}</h2>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-2 py-1 text-xs text-muted-foreground/70">{children}</p>;
}

function Num({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="mb-1.5 block">
      <span className="flex items-center justify-between text-[11px] text-muted-foreground">
        {label}
        <span className="num text-foreground">
          {step >= 1 ? value : value.toFixed(2)}
          {unit ?? ""}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="studio-slider mt-1 w-full"
      />
    </label>
  );
}

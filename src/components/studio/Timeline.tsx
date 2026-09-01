import { useState } from "react";
import { useStudio } from "@/lib/studio/store";

function fmt(t: number, fps: number) {
  const frame = Math.round(t * fps);
  const s = Math.floor(t);
  const ms = Math.floor((t - s) * 1000);
  return `${String(s).padStart(2, "0")}.${String(ms).padStart(3, "0")}s · f${frame}`;
}

export default function Timeline() {
  const {
    time,
    duration,
    playing,
    togglePlay,
    setTime,
    setPlaying,
    speed,
    setSpeed,
    loop,
    setLoop,
    fps,
    keyframeTimes,
    editorKeyframes,
    addEditorKeyframe,
    removeEditorKeyframe,
    activeClip,
    mocapEnabled,
    mocapName,
  } = useStudio();

  const [track, setTrack] = useState("Rig");
  const pct = duration > 0 ? (time / duration) * 100 : 0;
  const step = 1 / fps;

  return (
    <div className="panel-surface hairline-t flex h-[132px] shrink-0 flex-col">
      <div className="hairline-b flex items-center gap-3 px-3 py-2">
        <div className="flex items-center gap-1">
          <TButton onClick={() => setTime(0)} title="Jump to start">
            ⏮
          </TButton>
          <TButton onClick={() => setTime(Math.max(0, time - step))} title="Previous frame">
            ◀
          </TButton>
          <button
            onClick={togglePlay}
            className="signal-fill grid h-8 w-12 place-items-center rounded-md text-sm font-semibold transition-transform active:scale-95"
            title="Play / pause (Space)"
          >
            {playing ? "❚❚" : "▶"}
          </button>
          <TButton onClick={() => setTime(Math.min(duration, time + step))} title="Next frame">
            ▶
          </TButton>
          <TButton
            onClick={() => {
              setPlaying(false);
              setTime(duration);
            }}
            title="Jump to end"
          >
            ⏭
          </TButton>
        </div>

        <div className="num text-xs text-foreground/90">{fmt(time, fps)}</div>
        <div className="num text-xs text-muted-foreground">/ {duration.toFixed(3)}s</div>

        <div className="ml-auto flex items-center gap-3">
          <label className="label-xs flex items-center gap-2">
            speed
            <input
              type="range"
              className="studio-slider w-24"
              min={0.05}
              max={2.5}
              step={0.05}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
            />
            <span className="num text-xs text-foreground">{speed.toFixed(2)}×</span>
          </label>
          <button
            onClick={() => setLoop(!loop)}
            className={`rounded-md border px-2 py-1 text-xs transition-colors ${
              loop
                ? "border-primary/60 bg-primary/15 text-primary"
                : "border-border bg-secondary text-muted-foreground"
            }`}
          >
            loop
          </button>
          <div className="label-xs max-w-[220px] truncate">
            {mocapEnabled && mocapName ? `mocap · ${mocapName}` : (activeClip ?? "no clip")}
          </div>
          <select
            value={track}
            onChange={(event) => setTrack(event.target.value)}
            className="rounded border border-border bg-[var(--panel-raised)] px-1.5 py-1 text-[10px]"
            title="Active animation track"
          >
            {["Rig", "Left hand IK", "Right hand IK", "Face", "Mocap cleanup"].map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
          <button
            onClick={() => addEditorKeyframe(track)}
            className="rounded border border-primary/50 bg-primary/10 px-2 py-1 text-[10px] text-primary hover:bg-primary/20"
            title="Insert keyframe at current time"
          >
            + key
          </button>
        </div>
      </div>

      <div className="relative flex-1 px-3 py-3">
        <div className="relative h-full rounded-md border border-border bg-[var(--track)]">
          {/* keyframe ticks */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-5">
            {duration > 0 &&
              keyframeTimes.map((t, i) => (
                <span
                  key={`clip-${i}`}
                  className="absolute top-1.5 h-2 w-px bg-[var(--keyframe)] opacity-70"
                  style={{ left: `${(t / duration) * 100}%` }}
                />
              ))}
            {duration > 0 &&
              editorKeyframes.map((key) => (
                <button
                  key={key.id}
                  className="absolute top-1 h-3 w-3 -translate-x-1/2 rotate-45 rounded-[2px] bg-primary shadow-[0_0_0_2px_var(--track)]"
                  style={{ left: `${Math.max(0, Math.min(100, (key.time / duration) * 100))}%` }}
                  title={`${key.track} · ${fmt(key.time, fps)} — click to remove`}
                  onClick={() => removeEditorKeyframe(key.id)}
                />
              ))}
          </div>
          {/* second rulers */}
          <div className="pointer-events-none absolute inset-0">
            {duration > 0 &&
              Array.from({ length: Math.floor(duration) + 1 }).map((_, i) => (
                <span
                  key={i}
                  className="num absolute bottom-1 -translate-x-1/2 text-[10px] text-muted-foreground"
                  style={{ left: `${(i / duration) * 100}%` }}
                >
                  {i}s
                </span>
              ))}
          </div>
          {/* played region */}
          <div
            className="pointer-events-none absolute inset-y-0 left-0 rounded-l-md bg-primary/12"
            style={{ width: `${pct}%` }}
          />
          {/* playhead */}
          <div
            className="pointer-events-none absolute inset-y-0 w-px bg-primary"
            style={{ left: `${pct}%` }}
          >
            <span className="signal-fill num absolute -top-0.5 left-0 -translate-x-1/2 rounded-sm px-1 text-[10px]">
              {Math.round(time * fps)}
            </span>
          </div>
          <input
            type="range"
            className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
            min={0}
            max={Math.max(duration, 0.001)}
            step={0.001}
            value={time}
            onChange={(e) => {
              setPlaying(false);
              setTime(Number(e.target.value));
            }}
          />
        </div>
      </div>
    </div>
  );
}

function TButton({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="grid h-8 w-8 place-items-center rounded-md border border-border bg-secondary text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
    >
      {children}
    </button>
  );
}

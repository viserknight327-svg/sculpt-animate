export function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="label-xs shrink-0">{label}</span>
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2">{children}</div>
    </div>
  );
}

export function Slider({
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
  suffix = "",
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <>
      <input
        type="range"
        className="studio-slider max-w-[130px] flex-1"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="num w-12 shrink-0 text-right text-xs">
        {value.toFixed(2)}
        {suffix}
      </span>
    </>
  );
}

export function Toggle({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`rounded-md border px-2 py-1 text-xs transition-colors ${
        value
          ? "border-primary/60 bg-primary/15 text-primary"
          : "border-border bg-secondary text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

export function Swatch({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-6 w-9 cursor-pointer"
      />
      <span className="num w-16 text-right text-xs uppercase">{value}</span>
    </>
  );
}

export function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="hairline-b px-3 py-3">
      <h3 className="label-xs mb-2">{title}</h3>
      <div className="space-y-1">{children}</div>
    </section>
  );
}

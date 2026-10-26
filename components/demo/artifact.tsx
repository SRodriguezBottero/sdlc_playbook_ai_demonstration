import { cn } from "cn";

type ArtifactProps = {
  filename: string;
  body: string;
  stamp?: string;
  stampTone?: "pine" | "alert";
  className?: string;
};

export function Artifact({
  filename,
  body,
  stamp,
  stampTone = "pine",
  className,
}: ArtifactProps) {
  return (
    <article
      className={cn(
        "relative flex min-h-0 flex-col border border-line bg-card",
        className,
      )}
    >
      <header className="flex items-center justify-between gap-3 border-b border-line px-3 py-2">
        <h3 className="font-mono text-[11px] tracking-[0.14em] uppercase">
          {filename}
        </h3>
        {stamp ? (
          <span
            className={cn(
              "stamp",
              stampTone === "alert" ? "stamp-alert" : "stamp-pine",
            )}
          >
            {stamp}
          </span>
        ) : null}
      </header>
      <pre className="min-h-0 flex-1 overflow-auto px-3 py-3 font-mono text-[12px] leading-relaxed whitespace-pre-wrap text-ink/90">
        {body}
      </pre>
    </article>
  );
}

type EvidenceProps = {
  kicker: string;
  empty: string;
  lines: { label: string; value: string }[];
  tone?: "alert" | "pine" | "amber" | "ink";
  live?: boolean;
};

export function Evidence({
  kicker,
  empty,
  lines,
  tone = "ink",
  live = false,
}: EvidenceProps) {
  const ready = lines.length > 0;
  return (
    <div
      className={cn(
        "border bg-card",
        tone === "alert" && "border-alert",
        tone === "pine" && "border-pine",
        tone === "amber" && "border-amber",
        tone === "ink" && "border-line",
      )}
      aria-live={live ? "polite" : undefined}
    >
      <p className="border-b border-line px-3 py-2 font-mono text-[11px] tracking-[0.16em] uppercase">
        {kicker}
      </p>
      {ready ? (
        <dl className="grid gap-1.5 px-3 py-3 font-mono text-[13px] leading-snug">
          {lines.map((line) => (
            <div key={line.label} className="grid grid-cols-[6.5rem_1fr] gap-3">
              <dt className="text-muted-foreground">{line.label}</dt>
              <dd>{line.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="px-3 py-4 font-mono text-[13px] leading-relaxed text-muted-foreground">
          {empty}
        </p>
      )}
    </div>
  );
}

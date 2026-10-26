import { Artifact, Evidence } from "@/components/demo/artifact";
import { BandChart } from "@/components/demo/band-chart";
import { actionLabel, points, rate, tierLabel, toneFor } from "@/components/demo/format";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";
import {
  bandsYaml,
  evalJson,
  findings,
  hookSh,
  intentMd,
  reviewMd,
  specMd,
  stages,
} from "@/content/story";
import {
  BASELINE_COUNT,
  BREACH_5XX,
  RECOVERED_5XX,
  type BandAssessment,
} from "@/lib/bands";
import {
  ISOLATION_TEST_EXHIBIT,
  TEST_STAMP,
  type GuardResult,
  type IsolationRun,
} from "@/lib/checkout-cache";
import type { GateResult } from "@/lib/production-gate";
import { cn } from "cn";

export type SpecDecision = "pending" | "accepted" | "returned";
export type Triage = "now" | "later" | "dismiss";

export type DemoModel = {
  running: string | null;
  breach: BandAssessment | null;
  recovered: BandAssessment | null;
  spec: SpecDecision;
  inventoryClosed: boolean;
  proofRed: IsolationRun | null;
  proofBlock: GuardResult | null;
  proofFix: { guard: GuardResult; checkout: IsolationRun } | null;
  releaseSigned: boolean;
  gate: GateResult | null;
  gateStale: boolean;
  triage: Triage | null;
  runBreach: () => void;
  runRecovered: () => void;
  setSpec: (value: Exclude<SpecDecision, "pending">) => void;
  toggleInventory: () => void;
  runRed: () => void;
  runBlock: () => void;
  runFix: () => void;
  toggleRelease: () => void;
  runGate: () => void;
  setTriage: (value: Triage) => void;
};

function RunButton({
  children,
  onClick,
  busy,
  disabled,
  variant = "default",
}: {
  children: string;
  onClick: () => void;
  busy: boolean;
  disabled?: boolean;
  variant?: "default" | "outline" | "secondary" | "destructive";
}) {
  return (
    <Button
      type="button"
      variant={variant}
      className="h-10 rounded-sm px-3.5"
      onClick={onClick}
      disabled={disabled || busy}
    >
      {busy ? "Corriendo…" : children}
    </Button>
  );
}

function readingLines(reading: BandAssessment) {
  return [
    { label: "último", value: rate(reading.latest) },
    { label: "media", value: rate(reading.mean) },
    { label: "desvío", value: points(reading.stdev) },
    { label: "z", value: points(reading.z) },
    { label: "tier", value: tierLabel(reading.tier) },
    { label: "acción", value: actionLabel(reading.action) },
    { label: "regla", value: reading.rule },
  ];
}

export function BottleneckBeat() {
  return (
    <div className="grid gap-4">
      <div className="rise grid gap-2">
        <p className="font-mono text-[11px] tracking-[0.16em] uppercase text-muted-foreground">
          Antes · cada etapa a velocidad humana
        </p>
        <div className="flex h-14 gap-1">
          {stages.map((stage) => (
            <div
              key={stage}
              className="flex flex-1 items-center justify-center border border-line bg-card font-mono text-[11px] tracking-wide uppercase"
            >
              {stage}
            </div>
          ))}
        </div>
      </div>
      <div className="rise grid gap-2" style={{ animationDelay: "120ms" }}>
        <p className="font-mono text-[11px] tracking-[0.16em] uppercase text-muted-foreground">
          Con agentes · el build colapsa, el resto no
        </p>
        <div className="flex h-16 gap-1">
          <Cell className="flex-[1.05]">Plan</Cell>
          <Cell className="flex-[0.95]">Diseño</Cell>
          <Cell className="flex-[0.34] bg-ink text-paper">
            Build
            <span className="block text-[10px] tracking-normal normal-case opacity-70">
              horas
            </span>
          </Cell>
          <div className="flex flex-[0.85] items-center justify-center border border-dashed border-ink/35 bg-[repeating-linear-gradient(-45deg,transparent,transparent_5px,rgba(27,22,18,0.06)_5px,rgba(27,22,18,0.06)_6px)] px-2 text-center font-mono text-[10px] tracking-[0.14em] uppercase">
            tiempo que vuelve
          </div>
          <Cell className="flex-[1.15] border-alert bg-alert/10">
            Test
            <span className="block text-[10px] tracking-[0.14em] text-alert">
              QA
            </span>
          </Cell>
          <Cell className="flex-1">Deploy</Cell>
          <Cell className="flex-1">Maintain</Cell>
        </div>
      </div>
      <p className="rise max-w-2xl font-heading text-2xl leading-tight italic" style={{ animationDelay: "220ms" }}>
        El humano se queda arriba del loop. Instiga, dirige y gobierna.
      </p>
    </div>
  );
}

function Cell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center border border-line bg-card px-1 text-center font-mono text-[11px] tracking-wide uppercase",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function AlertBeat({ model }: { model: DemoModel }) {
  const tone = model.breach ? toneFor(model.breach) : "ink";
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] tracking-[0.16em] uppercase text-muted-foreground">
            post_deploy_5xx · checkout
          </p>
          <p className="font-heading text-4xl leading-none tracking-tight">
            {model.breach ? rate(model.breach.latest) : "—"}
          </p>
        </div>
        <RunButton onClick={model.runBreach} busy={model.running === "breach"}>
          {model.breach ? "Correr otra vez" : "Correr detector"}
        </RunButton>
      </div>
      <BandChart
        series={BREACH_5XX}
        baselineCount={BASELINE_COUNT}
        assessment={model.breach}
        label="Tasa de 5xx de checkout después del deploy"
      />
      <div className="grid gap-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Artifact filename="bands.yaml" body={bandsYaml} />
        <Evidence
          kicker="Salida del detector"
          empty="Todavía no hay evidencia. El tier sale de la serie cuando corrés el detector."
          lines={model.breach ? readingLines(model.breach) : []}
          tone={tone}
          live
        />
      </div>
    </div>
  );
}

export function PairBeat({ model }: { model: DemoModel }) {
  const stamp =
    model.spec === "accepted"
      ? model.inventoryClosed
        ? "Aceptado · inventario fuera"
        : "Aceptado · pregunta abierta"
      : model.spec === "returned"
        ? "Devuelto a diseño"
        : undefined;
  const tone = model.spec === "returned" ? "alert" : "pine";

  return (
    <div className="grid gap-3">
      <div className="grid gap-3 lg:grid-cols-2">
        <Artifact filename="intent.md" body={intentMd} className="max-h-60 overflow-hidden" />
        <Artifact
          filename="spec.md"
          body={specMd}
          stamp={stamp}
          stampTone={tone}
          className="max-h-60 overflow-hidden"
        />
      </div>
      <div className="flex flex-col gap-3 border border-line bg-card px-3 py-3 lg:flex-row lg:items-center lg:justify-between">
        <button
          type="button"
          aria-pressed={model.inventoryClosed}
          onClick={model.toggleInventory}
          className="flex items-start gap-3 text-left"
        >
          <span
            className={cn(
              "mt-0.5 grid size-4 shrink-0 place-items-center border",
              model.inventoryClosed
                ? "border-pine bg-pine text-paper"
                : "border-ink/40",
            )}
            aria-hidden
          >
            {model.inventoryClosed ? "✓" : ""}
          </span>
          <span>
            <span className="block text-sm font-medium">
              Inventario queda fuera de este cambio
            </span>
            <span className="block text-sm text-muted-foreground">
              La pregunta abierta de intent.md se responde o se devuelve.
            </span>
          </span>
        </button>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-sm"
            onClick={() => model.setSpec("returned")}
          >
            Devolver
          </Button>
          <Button
            type="button"
            className="h-10 rounded-sm"
            onClick={() => model.setSpec("accepted")}
          >
            Aceptar el par
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ProofBeat({ model }: { model: DemoModel }) {
  const lines = proofLines(model);
  const tone = model.proofBlock && !model.proofFix
    ? "alert"
    : model.proofFix
      ? "pine"
      : model.proofRed
        ? "alert"
        : "ink";

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <Artifact
        filename="lib/checkout-cache.test.ts"
        body={ISOLATION_TEST_EXHIBIT}
        stamp={model.proofRed ? `sello ${TEST_STAMP}` : undefined}
      />
      <div className="grid content-start gap-3">
        <div className="flex flex-wrap gap-2">
          <RunButton
            onClick={model.runRed}
            busy={model.running === "red"}
            variant="destructive"
          >
            Correr el test rojo
          </RunButton>
          <RunButton
            onClick={model.runBlock}
            busy={model.running === "block"}
            disabled={!model.proofRed}
            variant="outline"
          >
            Editar el test
          </RunButton>
          <RunButton
            onClick={model.runFix}
            busy={model.running === "fix"}
            disabled={!model.proofBlock}
          >
            Corregir la key
          </RunButton>
        </div>
        <Evidence
          kicker="Evidencia de la corrida"
          empty="El test todavía no corrió. Tiene que fallar: espera 200 y la key con tenant."
          lines={lines}
          tone={tone}
          live
        />
        {model.proofFix ? (
          <Artifact filename="evals/checkout-tenant-key.json" body={evalJson} stamp="permanente" />
        ) : null}
      </div>
    </div>
  );
}

function proofLines(model: DemoModel): { label: string; value: string }[] {
  if (model.proofFix) {
    return [
      {
        label: "hook",
        value: `exit ${model.proofFix.guard.exitCode} · ${model.proofFix.guard.message}`,
      },
      { label: "test", value: model.proofFix.checkout.pass ? "pasó" : "falló" },
      { label: "esperaba", value: model.proofFix.checkout.expected },
      { label: "obtuvo", value: model.proofFix.checkout.actual },
      { label: "motivo", value: model.proofFix.checkout.checkout.reason },
      { label: "sello", value: `${TEST_STAMP} · el test sigue igual` },
    ];
  }
  if (model.proofBlock) {
    return [
      { label: "hook", value: `exit ${model.proofBlock.exitCode}` },
      { label: "motivo", value: model.proofBlock.message },
      { label: "sello", value: `${TEST_STAMP} · el test sigue igual` },
    ];
  }
  if (model.proofRed) {
    return [
      { label: "test", value: model.proofRed.pass ? "pasó" : "falló" },
      { label: "esperaba", value: model.proofRed.expected },
      { label: "obtuvo", value: model.proofRed.actual },
      { label: "motivo", value: model.proofRed.checkout.reason },
      { label: "sello", value: TEST_STAMP },
    ];
  }
  return [];
}

export function GateBeat({ model }: { model: DemoModel }) {
  const lines: { label: string; value: string }[] = model.gate
    ? [
        { label: "comando", value: "deploy production" },
        {
          label: "env",
          value: model.releaseSigned ? "RELEASE_APPROVAL=RM-R-MEHTA" : "RELEASE_APPROVAL vacío",
        },
        { label: "exit", value: String(model.gate.exitCode) },
        { label: "hook", value: model.gate.message },
        ...(model.gateStale
          ? [{ label: "nota", value: "La firma cambió. Corré el hook otra vez." }]
          : []),
      ]
    : [];

  return (
    <div className="grid gap-3">
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {findings.map((finding) => (
          <article key={finding.pass} className="border border-line bg-card px-3 py-3">
            <p className="flex items-center justify-between gap-2 font-mono text-[11px] tracking-[0.14em] uppercase">
              <span>{finding.pass}</span>
              <Level level={finding.level} />
            </p>
            <p className="mt-2 text-sm leading-snug">{finding.text}</p>
          </article>
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="grid gap-3">
          <Artifact filename="REVIEW.md" body={reviewMd} className="max-h-36 overflow-hidden" />
          <Artifact
            filename=".claude/hooks/production-gate.sh"
            body={hookSh}
            className="max-h-28 overflow-hidden"
          />
        </div>
        <div className="grid content-start gap-3">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={model.releaseSigned ? "default" : "outline"}
              className="h-10 rounded-sm"
              aria-pressed={model.releaseSigned}
              onClick={model.toggleRelease}
            >
              {model.releaseSigned
                ? "Firmado · R. Mehta"
                : "Firmar como release manager"}
            </Button>
            <RunButton onClick={model.runGate} busy={model.running === "gate"}>
              Correr el hook
            </RunButton>
          </div>
          <Evidence
            kicker="Compuerta de producción"
            empty="El deploy a producción todavía no se intentó. Sin RELEASE_APPROVAL el hook sale con código 2."
            lines={lines}
            tone={
              !model.gate || model.gateStale
                ? "ink"
                : model.gate.exitCode === 2
                  ? "alert"
                  : "pine"
            }
            live
          />
          <p className="text-sm text-muted-foreground">
            QA lee los hallazgos. La firma de release es de otra persona. El agente que escribió el diff no tiene botón de approve.
          </p>
        </div>
      </div>
    </div>
  );
}

function Level({ level }: { level: "Limpio" | "Important" | "Nit" }) {
  return (
    <span
      className={cn(
        "tracking-[0.12em]",
        level === "Important" && "text-alert",
        level === "Limpio" && "text-pine",
        level === "Nit" && "text-amber",
      )}
    >
      {level}
    </span>
  );
}

const triageCopy: Record<Triage, string> = {
  now: "Entra a build con el eval ya encendido.",
  later: "Queda en la cola, con el sello de la banda.",
  dismiss: "Se descarta. El descarte ajusta la banda y baja el ruido.",
};

export function CloseBeat({ model }: { model: DemoModel }) {
  const tone = model.recovered ? toneFor(model.recovered) : "ink";
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] tracking-[0.16em] uppercase text-muted-foreground">
            después del rollback ensayado
          </p>
          <p className="font-heading text-4xl leading-none tracking-tight">
            {model.recovered ? rate(model.recovered.latest) : "—"}
          </p>
        </div>
        <RunButton
          onClick={model.runRecovered}
          busy={model.running === "recovered"}
        >
          {model.recovered ? "Correr otra vez" : "Correr detector"}
        </RunButton>
      </div>
      <BandChart
        series={RECOVERED_5XX}
        baselineCount={BASELINE_COUNT}
        assessment={model.recovered}
        label="Tasa de 5xx de checkout después del rollback"
      />
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Evidence
          kicker="Banda de cierre"
          empty="La serie de después del rollback espera al detector."
          lines={model.recovered ? readingLines(model.recovered) : []}
          tone={tone}
          live
        />
        <div className="grid content-start gap-3 border border-line bg-card px-3 py-3">
          <p className="font-mono text-[11px] tracking-[0.16em] uppercase text-muted-foreground">
            Cola · intent.md INC-CHECKOUT-2140
          </p>
          <p className="font-heading text-xl leading-tight">
            Aislar la cache key de precios por tenant.
          </p>
          <div className="flex flex-wrap gap-2">
            <TriageButton
              current={model.triage}
              value="now"
              onClick={model.setTriage}
              label="Arreglar ahora"
            />
            <TriageButton
              current={model.triage}
              value="later"
              onClick={model.setTriage}
              label="Programar"
            />
            <TriageButton
              current={model.triage}
              value="dismiss"
              onClick={model.setTriage}
              label="Descartar"
            />
          </div>
          <p className="text-sm" aria-live="polite">
            {model.triage
              ? triageCopy[model.triage]
              : "QA triagea. El loop ya arrancó solo."}
          </p>
          <p className="border-t border-line pt-3 font-mono text-[12px] leading-relaxed">
            {model.proofFix
              ? `Eval checkout-tenant-key encendido. Sello del test ${TEST_STAMP}.`
              : "El eval se enciende cuando el fix del beat 04 pasa y el sello del test queda quieto."}
          </p>
        </div>
      </div>
    </div>
  );
}

function TriageButton({
  current,
  value,
  label,
  onClick,
}: {
  current: Triage | null;
  value: Triage;
  label: string;
  onClick: (value: Triage) => void;
}) {
  const selected = current === value;
  return (
    <Button
      type="button"
      variant={selected ? "default" : "outline"}
      className="h-10 rounded-sm"
      aria-pressed={selected}
      onClick={() => onClick(value)}
    >
      {label}
    </Button>
  );
}

export function BeatStage({
  id,
  model,
}: {
  id: string;
  model: DemoModel;
}) {
  switch (id) {
    case "bottleneck":
      return <BottleneckBeat />;
    case "alert":
      return <AlertBeat model={model} />;
    case "pair":
      return <PairBeat model={model} />;
    case "proof":
      return <ProofBeat model={model} />;
    case "gate":
      return <GateBeat model={model} />;
    case "close":
      return <CloseBeat model={model} />;
    default:
      return null;
  }
}

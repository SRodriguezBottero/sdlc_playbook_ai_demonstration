"use client";

import { BeatStage, type DemoModel, type SpecDecision, type Triage } from "@/components/demo/stage";
import { Button } from "@/components/ui/button";
import { beats } from "@/content/story";
import {
  BREACH_5XX,
  RECOVERED_5XX,
  assessBands,
  type BandAssessment,
} from "@/lib/bands";
import {
  FIX_TEST_PATH,
  TEST_STAMP,
  guardFixEdit,
  runIsolationTest,
  type GuardResult,
  type IsolationRun,
} from "@/lib/checkout-cache";
import { productionGate, type GateResult } from "@/lib/production-gate";
import { cn } from "cn";
import { useCallback, useEffect, useRef, useState } from "react";

const RELEASE_ID = "RM-R-MEHTA";

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function LoopDemo() {
  const [index, setIndex] = useState(0);
  const [record, setRecord] = useState(false);
  const [running, setRunning] = useState<string | null>(null);
  const [breach, setBreach] = useState<BandAssessment | null>(null);
  const [recovered, setRecovered] = useState<BandAssessment | null>(null);
  const [spec, setSpec] = useState<SpecDecision>("pending");
  const [inventoryClosed, setInventoryClosed] = useState(false);
  const [proofRed, setProofRed] = useState<IsolationRun | null>(null);
  const [proofBlock, setProofBlock] = useState<GuardResult | null>(null);
  const [proofFix, setProofFix] = useState<DemoModel["proofFix"]>(null);
  const [releaseSigned, setReleaseSigned] = useState(false);
  const [gate, setGate] = useState<GateResult | null>(null);
  const [gateStale, setGateStale] = useState(false);
  const [triage, setTriage] = useState<Triage | null>(null);
  const [fault, setFault] = useState<string | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const skipFocus = useRef(true);

  const beat = beats[index] ?? beats[0];

  const run = useCallback(async (key: string, fn: () => void) => {
    setRunning(key);
    setFault(null);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduce) await wait(240);
    try {
      fn();
    } catch (error) {
      setFault(error instanceof Error ? error.message : "La corrida falló.");
    } finally {
      setRunning(null);
    }
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setIndex((current) => Math.min(beats.length - 1, current + 1));
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        setIndex((current) => Math.max(0, current - 1));
      } else if (event.key === "g" || event.key === "G") {
        setRecord((current) => !current);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (skipFocus.current) {
      skipFocus.current = false;
      return;
    }
    titleRef.current?.focus();
  }, [index]);

  const model: DemoModel = {
    running,
    breach,
    recovered,
    spec,
    inventoryClosed,
    proofRed,
    proofBlock,
    proofFix,
    releaseSigned,
    gate,
    gateStale,
    triage,
    runBreach: () => {
      void run("breach", () => setBreach(assessBands(BREACH_5XX)));
    },
    runRecovered: () => {
      void run("recovered", () => setRecovered(assessBands(RECOVERED_5XX)));
    },
    setSpec: (value) => setSpec(value),
    toggleInventory: () => setInventoryClosed((current) => !current),
    runRed: () => {
      void run("red", () => setProofRed(runIsolationTest(false)));
    },
    runBlock: () => {
      void run("block", () => setProofBlock(guardFixEdit(FIX_TEST_PATH, "fix")));
    },
    runFix: () => {
      void run("fix", () => {
        const guard = guardFixEdit("lib/checkout-cache.ts", "fix");
        setProofFix({ guard, checkout: runIsolationTest(true) });
      });
    },
    toggleRelease: () => {
      setReleaseSigned((current) => !current);
      setGateStale(true);
    },
    runGate: () => {
      void run("gate", () => {
        setGate(
          productionGate(
            "deploy production",
            releaseSigned ? RELEASE_ID : undefined,
          ),
        );
        setGateStale(false);
      });
    },
    setTriage: (value) => setTriage(value),
  };

  return (
    <div className="demo-root flex min-h-dvh flex-col lg:h-dvh lg:overflow-hidden" data-record={record ? "true" : undefined}>
      <header className="flex items-end justify-between gap-4 border-b border-line px-4 py-3 lg:px-6">
        <div>
          <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-alert">
            QA · encima del loop
          </p>
          <p className="font-heading text-2xl leading-none tracking-tight italic">
            Sobre el loop
          </p>
        </div>
        <p className="hidden font-mono text-[11px] tracking-[0.14em] uppercase text-muted-foreground sm:block">
          INC-CHECKOUT-2140
        </p>
        <p className="font-mono text-sm tabular-nums">
          {beat.numeral}
          <span className="text-muted-foreground"> / 06</span>
        </p>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <nav
          aria-label="Beats de la demo"
          className="flex gap-1 overflow-x-auto border-b border-line px-3 py-2 lg:w-44 lg:flex-col lg:overflow-visible lg:border-r lg:border-b-0 lg:px-0 lg:py-4"
        >
          {beats.map((item, itemIndex) => {
            const active = itemIndex === index;
            return (
              <button
                key={item.id}
                type="button"
                aria-current={active ? "step" : undefined}
                onClick={() => setIndex(itemIndex)}
                className={cn(
                  "flex shrink-0 items-baseline gap-2 border-l-2 px-3 py-2 text-left",
                  active
                    ? "border-alert text-ink"
                    : "border-transparent text-muted-foreground hover:text-ink",
                )}
              >
                <span className="font-mono text-[11px]">{item.numeral}</span>
                <span className="text-sm font-medium">{item.nav}</span>
              </button>
            );
          })}
        </nav>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col px-4 py-4 lg:px-6 lg:py-5">
          <p className="font-mono text-[11px] tracking-[0.16em] uppercase text-muted-foreground">
            {beat.kicker}
          </p>
          <h1
            ref={titleRef}
            tabIndex={-1}
            className="stage-title mt-1 max-w-4xl font-heading text-[2.4rem] leading-[0.95] tracking-tight outline-none lg:text-5xl"
          >
            {beat.title}
          </h1>
          <p className="lede mt-3 max-w-3xl text-lg leading-snug text-ink/80">
            {beat.caption}
          </p>
          <p className="aside-copy mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {beat.aside}
          </p>
          <div className="mt-4 min-h-0 flex-1 overflow-auto pb-2">
            <BeatStage id={beat.id} model={model} />
            {fault ? (
              <p className="mt-3 border border-alert bg-alert/10 px-3 py-2 font-mono text-sm text-alert" role="alert">
                {fault}
              </p>
            ) : null}
          </div>
        </main>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 lg:px-6">
        <p className="chrome-note font-mono text-[11px] tracking-wide text-muted-foreground">
          Sin modelo en vivo. ← → cambia de beat. G graba. Sello de test {TEST_STAMP}.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={record ? "default" : "outline"}
            className="h-10 rounded-sm"
            aria-pressed={record}
            onClick={() => setRecord((current) => !current)}
          >
            {record ? "Grabando" : "Grabar"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-sm"
            onClick={() => setIndex((current) => Math.max(0, current - 1))}
            disabled={index === 0}
          >
            Anterior
          </Button>
          <Button
            type="button"
            className="h-10 rounded-sm"
            onClick={() => setIndex((current) => Math.min(beats.length - 1, current + 1))}
            disabled={index === beats.length - 1}
          >
            Siguiente
          </Button>
        </div>
      </footer>
    </div>
  );
}

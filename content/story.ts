export type BeatId =
  | "bottleneck"
  | "alert"
  | "pair"
  | "proof"
  | "gate"
  | "close";

export type Beat = {
  id: BeatId;
  numeral: string;
  nav: string;
  kicker: string;
  title: string;
  caption: string;
  aside: string;
};

export const beats: Beat[] = [
  {
    id: "bottleneck",
    numeral: "01",
    nav: "Cuello",
    kicker: "El cuello de botella",
    title: "Escribir código ya no es lo lento",
    caption:
      "El build ya corre en horas. Plan, prueba y release siguen en tiempo humano.",
    aside:
      "Cuando el agente escribe el diff, la compuerta de QA al final del release no alcanza. Tu lugar queda arriba del loop: revisar artefactos, proteger los checks y dejar pasar solo lo que la evidencia sostiene.",
  },
  {
    id: "alert",
    numeral: "02",
    nav: "Alerta",
    kicker: "Mantener · la banda",
    title: "La banda se rompe sin un modelo",
    caption:
      "La detección no usa un modelo. Media, desvío y una regla. Recién ahí entra el agente.",
    aside:
      "Un punto suelto entre 1 y 2 sigma no llama a nadie. En racha, 1 sigma solo se anota. A 2 sigma hay diagnóstico de solo lectura. A 3 sigma se puede proponer un rollback o un pull request. Corré el detector: el número sale de la serie, no de un texto fijo.",
  },
  {
    id: "pair",
    numeral: "03",
    nav: "Expediente",
    kicker: "Plan y diseño",
    title: "Qué se pidió y qué se decidió",
    caption:
      "El par de archivos es el expediente: qué se pidió y qué se decidió.",
    aside:
      "intent.md entra desde la alerta, en los términos del incidente. spec.md aplica la policy de aislamiento mientras se escribe. Si la pregunta de inventario sigue abierta, devolvé el par. Si ya está contestada o explícitamente fuera, aceptalo.",
  },
  {
    id: "proof",
    numeral: "04",
    nav: "Prueba",
    kicker: "Probar · el loop de feedback",
    title: "El test nace rojo",
    caption:
      "El test nace rojo, antes del fix. Si el agente lo edita, el hook lo frena.",
    aside:
      "Acme carga el precio de cable-hdmi. Northwind pide el mismo sku. Con la key rota, los dos comparten entrada y checkout corta en 500. Ese test se commitea primero. El arreglo cambia la key. No el archivo del test.",
  },
  {
    id: "gate",
    numeral: "05",
    nav: "Compuerta",
    kicker: "Deploy · review y hook",
    title: "El agente no se aprueba solo",
    caption:
      "El agente revisa y no aprueba. Producción sigue del otro lado de una persona.",
    aside:
      "Tres pasadas: bugs, seguridad, cumplimiento contra spec.md y plan.md. Important es lo que rompe, filtra o incumple una policy. El estilo es un nit y hay tope. La firma de release no es tuya como QA: es del release manager, y el agente no la tiene.",
  },
  {
    id: "close",
    numeral: "06",
    nav: "Cierre",
    kicker: "El loop se cierra",
    title: "El incidente se queda",
    caption:
      "La métrica vuelve a banda y el incidente se queda como eval. QA solo triagea.",
    aside:
      "Con el rollback ensayado, la tasa vuelve al ruido de la base. El hallazgo no desaparece: entra a la cola como intent.md y el caso de la cache key queda en el suite. Arreglar ahora, programar o descartar. El descarte también sirve: afina la banda.",
  },
];

export const intentMd = `# Intent: checkout 5xx tras el deploy de las 21:40
Author: banda de control (post_deploy_5xx). Status: draft.

## Problem
Desde el deploy de las 21:40 la tasa de 5xx de checkout
salió de la banda. La cache key nueva arma el sku y omite
el tenantId.

## Proposed outcome
Checkout aísla el precio por tenant. La tasa vuelve
dentro de la banda de los 30 puntos previos.

## Affected users and systems
Checkout, cache de precios, tenants acme y northwind.

## Constraints
No se debilita el test que reprodujo el cruce.
El rollback ya está ensayado en staging.

## Open questions
¿El mismo patrón de key existe en el cache de inventario?
`;

export const specMd = `# Spec: aislar la cache key de precios

## Requirement
Toda lectura de precio incluye tenantId en la key.
Un hit de otro tenant responde 500 y no sirve ese precio.

## Design
cacheKey(tenant, sku) devuelve \`\${tenant}:\${sku}\`.
El test de cruce acme → northwind ya está en rojo
y no se edita durante el fix.

## Concerns
La policy de datos prohíbe que un tenant lea el precio
de otro. La key rota la contradice. Hay que cerrarlo
antes de que ingeniería lo vea como detalle.

## Out of scope
Inventario, impuestos y el rediseño del portal.
La pregunta de inventario sigue abierta a propósito.
`;

export const planMd = `# Plan: cache key de checkout
Desde intent.md del 2026-06-12.

## Files
lib/checkout-cache.ts
lib/checkout-cache.test.ts

## Order
1. Dejar el test rojo que reproduce el cruce.
2. Incluir tenantId en la key.
3. No tocar el test.

## Risks
Si el agente edita el test, la prueba deja de
demostrar que el bug se fue.

## Proof
northwind deja de recibir el precio de acme.
El sello del test original sigue igual.
`;

export const bandsYaml = `metric: post_deploy_5xx
baseline: rolling_30
rules: western_electric
tiers:
  1sigma: { action: log }
  2sigma: { action: diagnose, tools: "Read, Grep" }
  3sigma:
    action: propose
    routes: [pull_request, runbook:rollback-deploy]
`;

export const reviewMd = `# Review instructions

## Passes
- Bugs: lógica, bordes, regresiones
- Security: cruce de tenant, precios en logs
- Compliance: el diff coincide con spec.md y plan.md

## What Important means here
Important rompe comportamiento, filtra datos
o incumple una policy. El estilo es un nit.

## Cap the nits
Como máximo cinco nits. El resto, un conteo.
`;

export const hookSh = `#!/bin/bash
cmd=$(jq -r '.tool_input.command' < /dev/stdin)
if [[ "$cmd" == *"deploy"* && "$cmd" == *"production"* ]]; then
  if [ -z "$RELEASE_APPROVAL" ]; then
    echo "Production deploys need a release authorization." >&2
    exit 2
  fi
fi
exit 0
`;

export const evalJson = `{
  "id": "checkout-tenant-key",
  "from": "INC-CHECKOUT-2140",
  "prompt": "Un tenant no puede recibir el precio cacheado de otro.",
  "checks": [
    "northwind recibe 200 y su propia key",
    "la key rota sigue fallando ese assert",
    "el sello del test no cambia con el fix"
  ]
}
`;

export const findings = [
  {
    pass: "Bugs",
    level: "Limpio" as const,
    text: "El cruce acme → northwind responde 500. El mismo tenant sigue en 200.",
  },
  {
    pass: "Seguridad",
    level: "Important" as const,
    text: "En el 500 el log todavía imprime el precio del otro tenant. Eso es dato de un tenant en el rastro de otro.",
  },
  {
    pass: "Cumplimiento",
    level: "Limpio" as const,
    text: "La key coincide con spec.md y con el orden de plan.md. El archivo del test no entra en el diff.",
  },
  {
    pass: "Nit",
    level: "Nit" as const,
    text: "Un nit de nombre. El resto del estilo queda en el conteo, fuera del hilo.",
  },
];

export const stages = [
  "Plan",
  "Diseño",
  "Build",
  "Test",
  "Deploy",
  "Maintain",
] as const;

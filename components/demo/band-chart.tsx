import { rate } from "@/components/demo/format";
import type { BandAssessment } from "@/lib/bands";

type BandChartProps = {
  series: number[];
  baselineCount: number;
  assessment: BandAssessment | null;
  label: string;
};

export function BandChart({
  series,
  baselineCount,
  assessment,
  label,
}: BandChartProps) {
  const width = 640;
  const height = 188;
  const pad = { l: 40, r: 12, t: 14, b: 26 };
  const ceiling = Math.max(
    ...series,
    assessment?.upper.sigma3 ?? 0,
    1,
  );
  const max = ceiling * 1.18;
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const slot = innerW / series.length;
  const y = (value: number) => pad.t + innerH - (value / max) * innerH;
  const latest = series[series.length - 1] ?? 0;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`${label}. Último punto ${rate(latest)}.`} 
      className="h-40 w-full lg:h-44"
      preserveAspectRatio="xMidYMid meet"
    >
      <line
        x1={pad.l}
        x2={width - pad.r}
        y1={y(0)}
        y2={y(0)}
        stroke="var(--line)"
      />
      {assessment ? (
        <>
          <line
            x1={pad.l}
            x2={width - pad.r}
            y1={y(assessment.upper.sigma3)}
            y2={y(assessment.upper.sigma3)}
            stroke="var(--alert)"
            strokeDasharray="4 4"
          />
          <text
            x={width - pad.r}
            y={y(assessment.upper.sigma3) - 4}
            textAnchor="end"
            fill="var(--alert)"
            fontSize="11"
            fontFamily="var(--font-plex), monospace"
          >
            3σ {rate(assessment.upper.sigma3)}
          </text>
          <line
            x1={pad.l}
            x2={width - pad.r}
            y1={y(assessment.mean)}
            y2={y(assessment.mean)}
            stroke="var(--pine)"
          />
        </>
      ) : null}
      {series.map((value, index) => {
        const barHeight = Math.max(y(0) - y(value), 0);
        const after = index >= baselineCount;
        const afterFill =
          assessment?.tier === "in_band"
            ? "var(--pine)"
            : assessment?.tier === "sigma1" || assessment?.tier === "sigma2"
              ? "var(--amber)"
              : "var(--alert)";
        return (
          <rect
            key={`${index}-${value}`}
            x={pad.l + index * slot + 1.2}
            y={y(value)}
            width={Math.max(slot - 2.2, 1)}
            height={barHeight}
            fill={after ? afterFill : "var(--ink)"}
            opacity={after ? 0.92 : 0.28}
          />
        );
      })}
      <line
        x1={pad.l + baselineCount * slot}
        x2={pad.l + baselineCount * slot}
        y1={pad.t}
        y2={y(0)}
        stroke="var(--ink)"
        strokeOpacity="0.45"
      />
      <text
        x={pad.l + baselineCount * slot + 4}
        y={height - 8}
        fill="var(--ink)"
        fontSize="11"
        fontFamily="var(--font-plex), monospace"
      >
        deploy 21:40
      </text>
      <text
        x={4}
        y={y(0)}
        fill="var(--muted-foreground)"
        fontSize="11"
        fontFamily="var(--font-plex), monospace"
      >
        0
      </text>
    </svg>
  );
}

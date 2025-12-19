import { LOW_SCORE_THRESHOLD } from "@/lib/pgpt-insights/constants";

import { Badge } from "../Badge";

type StatusBadgeProps =
  | { type: "env"; value?: string | null }
  | { type: "endpoint"; value?: string | null }
  | { type: "guardrail"; status?: string | null; reason?: string | null }
  | { type: "low_confidence"; value?: boolean | null }
  | { type: "score"; value?: number | string | null };

function normalizeScore(value?: number | string | null): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(n) ? n : null;
}

export function StatusBadge(props: StatusBadgeProps) {
  if (props.type === "env") {
    if (!props.value) return null;
    const env = props.value;
    const lower = env.toLowerCase();
    const tone = lower.includes("prod") ? "red" : lower.includes("stage") || lower.includes("stg") ? "purple" : "blue";
    return <Badge tone={tone}>{env}</Badge>;
  }

  if (props.type === "endpoint") {
    if (!props.value) return null;
    const endpoint = props.value;
    const tone = endpoint === "assistant" ? "blue" : endpoint === "retrieval" ? "purple" : "default";
    return <Badge tone={tone}>{endpoint}</Badge>;
  }

  if (props.type === "guardrail") {
    if (props.status !== "blocked") return null;
    const label = props.reason ? `blocked: ${props.reason}` : "blocked";
    return <Badge tone="red" title={props.reason ?? undefined}>{label}</Badge>;
  }

  if (props.type === "low_confidence") {
    if (!props.value) return null;
    return <Badge tone="amber">low_confidence</Badge>;
  }

  const score = normalizeScore(props.value);
  const tone =
    score === null
      ? "default"
      : score < LOW_SCORE_THRESHOLD
        ? "red"
        : score < 0.5
          ? "amber"
          : score < 0.75
            ? "yellow"
            : "blue";

  const label = score === null ? "score —" : `score ${score.toFixed(3)}`;
  return <Badge tone={tone}>{label}</Badge>;
}

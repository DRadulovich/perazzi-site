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

type BadgeTone = "default" | "red" | "amber" | "yellow" | "blue" | "purple";

function envTone(env: string): BadgeTone {
  const lower = env.toLowerCase();
  if (lower.includes("prod")) return "red";
  if (lower.includes("stage") || lower.includes("stg")) return "purple";
  return "blue";
}

function endpointTone(endpoint: string): BadgeTone {
  if (endpoint === "assistant") return "blue";
  if (endpoint === "retrieval") return "purple";
  return "default";
}

function scoreTone(score: number | null): BadgeTone {
  if (score === null) return "default";
  if (score < LOW_SCORE_THRESHOLD) return "red";
  if (score < 0.5) return "amber";
  if (score < 0.75) return "yellow";
  return "blue";
}

function scoreLabel(score: number | null): string {
  if (score === null) return "score —";
  return `score ${score.toFixed(3)}`;
}

function guardrailLabel(reason?: string | null): string {
  if (reason) return `blocked: ${reason}`;
  return "blocked";
}

export function StatusBadge(props: StatusBadgeProps) {
  switch (props.type) {
    case "env": {
      if (!props.value) return null;
      const env = props.value;
      return <Badge tone={envTone(env)}>{env}</Badge>;
    }
    case "endpoint": {
      if (!props.value) return null;
      const endpoint = props.value;
      return <Badge tone={endpointTone(endpoint)}>{endpoint}</Badge>;
    }
    case "guardrail": {
      if (props.status !== "blocked") return null;
      const label = guardrailLabel(props.reason);
      return <Badge tone="red" title={props.reason ?? undefined}>{label}</Badge>;
    }
    case "low_confidence": {
      if (!props.value) return null;
      return <Badge tone="amber">low_confidence</Badge>;
    }
    case "score": {
      const score = normalizeScore(props.value);
      return <Badge tone={scoreTone(score)}>{scoreLabel(score)}</Badge>;
    }
    default:
      return null;
  }
}

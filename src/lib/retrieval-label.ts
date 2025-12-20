export function getRetrievalLabelFromScores(rawScores: Array<number | null | undefined>): string {
  const scores = (rawScores ?? [])
    .map((value) => (typeof value === "string" ? Number(value) : value))
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value))
    .map((value) => Math.max(0, Math.min(1, value)));

  if (!scores.length) return "Weak retrieval";

  const sorted = scores.slice().sort((a, b) => b - a);
  const top = sorted.slice(0, 3);
  const top1 = top[0] ?? 0;
  const top2 = top[1] ?? 0;
  const count = top.length;
  const gap = count >= 2 ? top1 - top2 : 0;
  const avgTop3 = top.reduce((sum, value) => sum + value, 0) / count;

  if (top1 > 0.7 && gap > 0.25) return "Direct Match";
  if (avgTop3 > 0.45 && gap < 0.1) return "Strong Synthesis";
  if (avgTop3 > 0.35) return "Moderate Synthesis";
  return "Weak Retrieval";
}

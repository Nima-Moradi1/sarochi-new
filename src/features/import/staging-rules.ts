export type StageDecision = "UNCHANGED" | "PENDING_REVIEW" | "CONFLICT";

export function stageDecision(input: {
  previousFingerprint?: string;
  previousReviewStatus?: string;
  currentFingerprint: string;
}): StageDecision {
  if (input.previousFingerprint === input.currentFingerprint) return "UNCHANGED";
  if (input.previousFingerprint && (input.previousReviewStatus === "APPROVED" || input.previousReviewStatus === "COMMITTED")) return "CONFLICT";
  return "PENDING_REVIEW";
}

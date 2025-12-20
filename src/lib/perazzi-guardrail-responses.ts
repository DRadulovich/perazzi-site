export const BLOCKED_RESPONSES = {
  pricing:
    "I’m not able to discuss pricing details. Please reach out to an authorized Perazzi dealer or the Perazzi team for official information.",
  gunsmithing:
    "Technical modifications and repairs must be handled by authorized Perazzi experts. Let me connect you with the right service channel.",
  legal:
    "Perazzi can’t provide legal guidance. Please consult local authorities or qualified professionals for this topic.",
  system_meta:
    "There is internal guidance and infrastructure behind how I work, but that’s not something I can open up or walk through in detail. My job is to reflect how Perazzi thinks about its guns and owners, not to expose internal systems. Let’s bring this back to your shooting, your gun, or the decisions you’re trying to make, and I’ll stay with you there.",
} as const;

export type BlockedResponseReason = keyof typeof BLOCKED_RESPONSES;


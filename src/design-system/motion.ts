export const atelierMotion = {
  trackSpring: { stiffness: 220, damping: 30 },
  garmentSpring: { type: "spring" as const, stiffness: 230, damping: 28 },
  fade: 0.25,
  isolate: 0.35,
  mirror: 0.52,
  flip: 0.55,
} as const;

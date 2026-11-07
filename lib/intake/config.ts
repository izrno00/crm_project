// Limits for the public intake API (Tech.md §7.3).
// The two submission limits can be overridden per environment, so development can use looser values.

const positiveInt = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const intakeConfig = {
  /** Largest accepted request body. */
  maxBodyBytes: 16 * 1024,
  /** Per connected website and visitor (hashed IP). */
  perVisitor: {
    max: positiveInt(process.env.INTAKE_LIMIT_PER_VISITOR, 5),
    windowSeconds: 10 * 60,
  },
  /** Per connected website, all visitors together. */
  perSite: {
    max: positiveInt(process.env.INTAKE_LIMIT_PER_SITE, 100),
    windowSeconds: 60 * 60,
  },
} as const;

import { z } from "zod";

const id = z.number().int().positive();
const association = {
  productId: id.nullable(),
  categoryId: id.nullable(),
  titleFa: z.string().trim().min(2).max(200),
  sourceUrl: z.string().trim().max(1024).url().refine((value) => new URL(value).protocol === "https:").nullable(),
};
const oneAssociation = (value: { productId: number | null; categoryId: number | null }) => (value.productId === null) !== (value.categoryId === null);
const decimal = z.number().positive().max(99999.9).refine((value) => Math.abs(value * 10 - Math.round(value * 10)) < 0.000001, "Use at most one decimal place");

export const guideWriteSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("care"), ...association, instructionsFa: z.string().trim().min(2).max(20000) }),
  z.object({ kind: z.literal("size"), ...association, toleranceCm: z.number().min(0).max(99.9).refine((value) => Math.abs(value * 10 - Math.round(value * 10)) < 0.000001).nullable(), measurements: z.array(z.object({ sizeId: id, metric: z.string().trim().min(2).max(80), valueCm: decimal })).min(1).max(100) }),
]).superRefine((value, context) => {
  if (!oneAssociation(value)) context.addIssue({ code: "custom", path: ["productId"], message: "Choose exactly one product or category" });
  if (value.kind === "size") {
    const keys = new Set<string>();
    for (const [index, measurement] of value.measurements.entries()) {
      const key = `${measurement.sizeId}:${measurement.metric}`;
      if (keys.has(key)) context.addIssue({ code: "custom", path: ["measurements", index, "metric"], message: "Duplicate size and metric" });
      keys.add(key);
    }
  }
});

export type GuideWrite = z.infer<typeof guideWriteSchema>;
export type GuideKind = GuideWrite["kind"];
export type GuideRecord = {
  id: number; kind: GuideKind; productId: number | null; categoryId: number | null;
  titleFa: string; sourceUrl: string | null; instructionsFa: string | null;
  toleranceCm: number | null; measurements: { sizeId: number; metric: string; valueCm: number }[];
};

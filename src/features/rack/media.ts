import type { RailItemDTO } from "@/features/catalog/types";

export function selectRackMedia(media: RailItemDTO["media"]) {
  const verifiedFront = media.find((entry) => entry.angle === "FRONT" && entry.confidence === "VERIFIED") ?? null;
  const verifiedBack = media.find((entry) => entry.angle === "BACK" && entry.confidence === "VERIFIED") ?? null;
  return {
    front: verifiedFront ?? media[0] ?? null,
    back: verifiedFront && verifiedBack ? verifiedBack : null,
    frontVerified: Boolean(verifiedFront),
  };
}

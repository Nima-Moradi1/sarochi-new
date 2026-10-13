import "server-only";
import { storeOwnerImage, MediaStorageError } from "@/features/admin/catalog/server/media-storage";
import { readBoundedBody } from "@/lib/security/request-body";
import { SourceHttpClient, isAllowedByRobots } from "../adapters/source-http";

const source = new SourceHttpClient();
let nextDownloadAt = 0;

function approvedImageUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.hostname !== "sarochi.ir" || url.port || url.username || url.password || !url.pathname.startsWith("/wp-content/uploads/")) {
    throw new MediaStorageError("UNAPPROVED_MEDIA_SOURCE", 400);
  }
  return url;
}

/** Download only approved original source images; retain originals privately. */
export async function persistSarochiImage(value: string) {
  let url = approvedImageUrl(value);
  const robots = await source.robots();
  for (let redirect = 0; redirect <= 3; redirect += 1) {
    if (!isAllowedByRobots(robots, url.href)) throw new MediaStorageError("SOURCE_MEDIA_DISALLOWED", 403);
    const delay = Math.max(0, nextDownloadAt - Date.now());
    nextDownloadAt = Math.max(Date.now(), nextDownloadAt) + 1100;
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    const response = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(15_000), headers: { "User-Agent": "SAROCHI-Atelier/0.1 (owner media import)", Accept: "image/jpeg,image/png,image/webp" } });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      await response.body?.cancel();
      if (!location || redirect === 3) throw new MediaStorageError("MEDIA_REDIRECT_LIMIT", 502);
      url = approvedImageUrl(new URL(location, url).href);
      continue;
    }
    if (!response.ok) { await response.body?.cancel(); throw new MediaStorageError("SOURCE_MEDIA_UNAVAILABLE", 502); }
    // The helper accepts a Request so it can be shared with bounded multipart reads.
    const bytes = await readBoundedBody(new Request("https://sarochi.ir", { method: "POST", headers: response.headers, body: response.body, duplex: "half" } as RequestInit), 5 * 1024 * 1024);
    const signature = Buffer.from(bytes.subarray(0, 12));
    const mime = signature[0] === 0xff && signature[1] === 0xd8 ? "image/jpeg" : signature.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ? "image/png" : signature.toString("ascii", 0, 4) === "RIFF" && signature.toString("ascii", 8, 12) === "WEBP" ? "image/webp" : "application/octet-stream";
    return storeOwnerImage(new File([new Uint8Array(bytes)], "source-image", { type: mime }));
  }
  throw new MediaStorageError("MEDIA_REDIRECT_LIMIT", 502);
}

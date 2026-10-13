import "server-only";
import { sameOrigin } from "../rules";

export function adminMutationOriginAllowed(request: Request) {
  const expected = process.env.APP_ORIGIN ?? (process.env.NODE_ENV === "production" ? "" : new URL(request.url).origin);
  return Boolean(expected) && sameOrigin(request.headers.get("origin"), expected);
}

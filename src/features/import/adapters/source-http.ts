const SOURCE_ORIGIN = "https://sarochi.ir";

export class SourceAccessError extends Error {}

function sourceUrl(input: string): URL {
  const url = new URL(input, SOURCE_ORIGIN);
  if (url.protocol !== "https:" || url.hostname !== "sarochi.ir" || url.username || url.password || url.hash) {
    throw new SourceAccessError("Source URL is outside the approved public host");
  }
  return url;
}

function robotsPattern(value: string): RegExp {
  const endAnchored = value.endsWith("$");
  const source = endAnchored ? value.slice(0, -1) : value;
  const escaped = source.split("*").map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(".*");
  return new RegExp(`^${escaped}${endAnchored ? "$" : ""}`);
}

export function isAllowedByRobots(robotsText: string, input: string): boolean {
  const url = sourceUrl(input);
  const path = `${url.pathname}${url.search}`;
  const lines = robotsText.split(/\r?\n/);
  let applies = false;
  let bestLength = -1;
  let allowed = true;
  for (const line of lines) {
    const clean = line.split("#", 1)[0].trim();
    const match = /^(user-agent|allow|disallow):\s*(.*)$/i.exec(clean);
    if (!match) continue;
    const [, field, value] = match;
    if (field.toLowerCase() === "user-agent") {
      applies = value === "*";
      continue;
    }
    if (!applies || value === "") continue;
    if (robotsPattern(value).test(path) && value.length >= bestLength) {
      bestLength = value.length;
      allowed = field.toLowerCase() === "allow";
    }
  }
  return allowed;
}

async function boundedText(response: Response, maxBytes: number): Promise<string> {
  if (Number(response.headers.get("content-length")) > maxBytes) throw new SourceAccessError("Source response exceeds byte limit");
  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) throw new SourceAccessError("Source response exceeds byte limit");
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return new TextDecoder("utf-8").decode(Buffer.concat(chunks));
}

export class SourceHttpClient {
  private robotsText: string | null = null;
  private nextAllowedAt = 0;
  private serial: Promise<void> = Promise.resolve();

  constructor(private readonly options: {
    fetchImpl?: typeof fetch;
    minIntervalMs?: number;
    maxBytes?: number;
    wait?: (ms: number) => Promise<void>;
    now?: () => number;
  } = {}) {}

  private async scheduled<T>(action: () => Promise<T>): Promise<T> {
    const previous = this.serial;
    let release: () => void = () => {};
    this.serial = new Promise<void>((resolve) => { release = resolve; });
    await previous;
    try {
      const now = this.options.now ?? Date.now;
      const wait = this.options.wait ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
      const delay = Math.max(0, this.nextAllowedAt - now());
      if (delay) await wait(delay);
      this.nextAllowedAt = now() + (this.options.minIntervalMs ?? 1100);
      return await action();
    } finally {
      release();
    }
  }

  private async fetchText(input: string, expectedType: "html" | "text", attempts = 0): Promise<string> {
    const url = sourceUrl(input);
    if (url.pathname !== "/robots.txt") {
      const robots = await this.robots();
      if (!isAllowedByRobots(robots, url.href)) throw new SourceAccessError("Source robots policy disallows this URL");
    }
    const fetchImpl = this.options.fetchImpl ?? fetch;
    const response = await this.scheduled(() => fetchImpl(url, {
      method: "GET",
      redirect: "manual",
      headers: { "User-Agent": "SAROCHI-Atelier/0.1 (owner catalog review)", Accept: expectedType === "html" ? "text/html" : "text/plain" },
      signal: AbortSignal.timeout(12_000),
    }));
    if (response.status === 429 || response.status === 503) {
      if (attempts >= 2) throw new SourceAccessError(`Source request repeatedly returned ${response.status}`);
      const retrySeconds = Number(response.headers.get("retry-after"));
      const backoff = Number.isFinite(retrySeconds) && retrySeconds > 0 ? Math.min(retrySeconds * 1000, 10_000) : 1000 * (attempts + 1);
      await (this.options.wait ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))))(backoff);
      return this.fetchText(url.href, expectedType, attempts + 1);
    }
    if (response.status >= 300 && response.status < 400) {
      if (attempts >= 3) throw new SourceAccessError("Source redirect limit exceeded");
      const location = response.headers.get("location");
      if (!location) throw new SourceAccessError("Source redirect lacks location");
      return this.fetchText(new URL(location, url).href, expectedType, attempts + 1);
    }
    if (!response.ok) throw new SourceAccessError(`Source returned HTTP ${response.status}`);
    const contentType = response.headers.get("content-type") ?? "";
    if (expectedType === "html" && !contentType.includes("text/html")) throw new SourceAccessError("Source did not return HTML");
    return boundedText(response, this.options.maxBytes ?? 2_000_000);
  }

  async robots(): Promise<string> {
    if (this.robotsText === null) this.robotsText = await this.fetchText("/robots.txt", "text");
    return this.robotsText;
  }

  async html(pathOrUrl: string): Promise<string> {
    return this.fetchText(pathOrUrl, "html");
  }
}

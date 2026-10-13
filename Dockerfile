FROM node:22-bookworm-slim AS dependencies
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM dependencies AS build
WORKDIR /app
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Build-time placeholder only. The runtime container must receive its own DATABASE_URL.
ENV DATABASE_URL=mysql://build:build@127.0.0.1:3306/build
RUN pnpm build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV MEDIA_STORAGE_DIR=/data/sarochi-media
RUN groupadd --system --gid 1001 nextjs && useradd --system --uid 1001 --gid nextjs nextjs
RUN mkdir -p /data/sarochi-media && chown nextjs:nextjs /data/sarochi-media
COPY --from=build --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nextjs /app/.next/static ./.next/static
USER nextjs
VOLUME ["/data/sarochi-media"]
EXPOSE 3000
CMD ["node", "server.js"]

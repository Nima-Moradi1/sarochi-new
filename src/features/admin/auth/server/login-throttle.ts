import "server-only";
import { eq, sql, lt } from "drizzle-orm";
import { db } from "@/db/client";
import { securityRateLimits } from "@/db/schema";

/** Atomic shared counters survive process restarts and concurrent login requests. */
export async function consumeLoginAttempt(keyHash: string, maximum = 5, windowSeconds = 900) {
  return db.transaction(async (transaction) => {
    await transaction.insert(securityRateLimits).values({ keyHash, attempts: 1, resetAt: sql`timestampadd(SECOND, ${windowSeconds}, CURRENT_TIMESTAMP)` })
      .onDuplicateKeyUpdate({ set: {
        attempts: sql`if(${securityRateLimits.resetAt} <= CURRENT_TIMESTAMP, 1, ${securityRateLimits.attempts} + 1)`,
        resetAt: sql`if(${securityRateLimits.resetAt} <= CURRENT_TIMESTAMP, timestampadd(SECOND, ${windowSeconds}, CURRENT_TIMESTAMP), ${securityRateLimits.resetAt})`,
      } });
    const [bucket] = await transaction.select({ attempts: securityRateLimits.attempts }).from(securityRateLimits).where(eq(securityRateLimits.keyHash, keyHash));
    return bucket.attempts <= maximum;
  });
}

export async function clearLoginAttempts(keyHash: string) {
  await db.delete(securityRateLimits).where(eq(securityRateLimits.keyHash, keyHash));
  await db.delete(securityRateLimits).where(lt(securityRateLimits.resetAt, sql`CURRENT_TIMESTAMP`));
}

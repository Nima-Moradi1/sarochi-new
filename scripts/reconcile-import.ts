import "dotenv/config";
import { pool } from "../src/db/client";
import { reconcileImportJob } from "../src/features/import/server/reconciliation";

async function main() {
  const id = Number(process.argv[2]);
  if (!Number.isSafeInteger(id) || id < 1) throw new Error("Usage: pnpm import:reconcile <job-id>");
  try { console.log(JSON.stringify(await reconcileImportJob(id), null, 2)); }
  finally { await pool.end(); }
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Reconciliation failed"); process.exitCode = 1; });

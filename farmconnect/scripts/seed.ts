/**
 * seed.ts — Database seed script.
 * Implemented in Phase 2 after Prisma schema is defined.
 *
 * Run: pnpm --filter @farmconnect/api db:seed
 */

async function main() {
  console.log('[seed] No seed data configured yet — implement in Phase 2');
  process.exit(0);
}

main().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});

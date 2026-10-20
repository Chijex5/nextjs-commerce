import net from "node:net";

/**
 * Node tries each address of a host (IPv6 and IPv4) for only 250 ms before
 * moving on. On slow links, Neon's working address can need longer than
 * that (seen ~300–450 ms over IPv6 from Lagos with IPv4 unreachable), so
 * Node abandons it and every attempt fails with ETIMEDOUT. Give each address
 * a fair chance; it costs nothing when the first one answers quickly.
 *
 * Import this before opening any Postgres connection.
 */
const attemptMs = Number(process.env.DB_CONNECT_ATTEMPT_TIMEOUT_MS ?? 2500);

try {
  if (
    Number.isFinite(attemptMs) &&
    attemptMs > net.getDefaultAutoSelectFamilyAttemptTimeout()
  ) {
    net.setDefaultAutoSelectFamilyAttemptTimeout(attemptMs);
  }
} catch {
  // Older Node without happy-eyeballs settings: nothing to tune.
}

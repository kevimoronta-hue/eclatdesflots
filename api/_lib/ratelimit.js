// api/_lib/ratelimit.js
// Per-IP fixed-window rate limiting, backed by the persistent store so it holds
// across serverless invocations and redeploys. Independent from the per-account
// 5-attempt lockout — this only throttles rapid-fire requests.

import { kvIncr } from './store.js';

// Returns { limited: boolean, count }.
export async function rateLimit(bucket, ip, { max = 10, windowSec = 300 } = {}) {
  const key = `rl:${bucket}:${ip}`;
  let count;
  try {
    count = await kvIncr(key, { ex: windowSec });
  } catch {
    // If the store is unreachable, fail open on throttling (the account lockout
    // and password hashing remain the primary defenses).
    return { limited: false, count: 0 };
  }
  return { limited: count > max, count };
}

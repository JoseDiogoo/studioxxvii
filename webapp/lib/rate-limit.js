const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const attemptsByKey = new Map();

function prune(now) {
  for (const [key, entry] of attemptsByKey) {
    if (now - entry.first > WINDOW_MS) attemptsByKey.delete(key);
  }
}

export function isLoginRateLimited(key) {
  const now = Date.now();
  prune(now);
  const entry = attemptsByKey.get(key);
  if (!entry) return false;
  if (now - entry.first > WINDOW_MS) return false;
  return entry.count >= MAX_ATTEMPTS;
}

export function registerFailedLogin(key) {
  const now = Date.now();
  const entry = attemptsByKey.get(key);
  if (!entry || now - entry.first > WINDOW_MS) {
    attemptsByKey.set(key, { first: now, count: 1 });
    return;
  }
  entry.count += 1;
}

export function clearLoginAttempts(key) {
  attemptsByKey.delete(key);
}

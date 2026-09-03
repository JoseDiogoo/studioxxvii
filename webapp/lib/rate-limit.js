const attemptsByNamespace = new Map();

function prune(entries, now, windowMs) {
  for (const [key, entry] of entries) {
    if (now - entry.first > windowMs) entries.delete(key);
  }
}

function getEntries(namespace) {
  if (!attemptsByNamespace.has(namespace)) attemptsByNamespace.set(namespace, new Map());
  return attemptsByNamespace.get(namespace);
}

export function isRateLimited(namespace, key, { windowMs, max }) {
  const entries = getEntries(namespace);
  const now = Date.now();
  prune(entries, now, windowMs);
  const entry = entries.get(key);
  if (!entry) return false;
  if (now - entry.first > windowMs) return false;
  return entry.count >= max;
}

export function registerAttempt(namespace, key, { windowMs }) {
  const entries = getEntries(namespace);
  const now = Date.now();
  const entry = entries.get(key);
  if (!entry || now - entry.first > windowMs) {
    entries.set(key, { first: now, count: 1 });
    return;
  }
  entry.count += 1;
}

export function clearAttempts(namespace, key) {
  getEntries(namespace).delete(key);
}

const LOGIN_LIMITE = { windowMs: 10 * 60 * 1000, max: 5 };

export function isLoginRateLimited(key) {
  return isRateLimited("login", key, LOGIN_LIMITE);
}

export function registerFailedLogin(key) {
  registerAttempt("login", key, LOGIN_LIMITE);
}

export function clearLoginAttempts(key) {
  clearAttempts("login", key);
}

// Contra spam/flood de marcações: no máximo 8 pedidos a criar marcação por IP,
// a cada 10 minutos — generoso para uma família a marcar vários serviços,
// suficiente para travar um bot a esgotar horários.
const BOOKING_LIMITE = { windowMs: 10 * 60 * 1000, max: 8 };

export function isBookingRateLimited(key) {
  return isRateLimited("booking", key, BOOKING_LIMITE);
}

export function registerBookingAttempt(key) {
  registerAttempt("booking", key, BOOKING_LIMITE);
}

// Rate Limiter em memória para proteção contra abuso e força bruta.

const loginAttempts = new Map();
const bookingAttempts = new Map();

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutos

const MAX_BOOKING_ATTEMPTS = 10;
const BOOKING_BLOCK_DURATION_MS = 10 * 60 * 1000; // 10 minutos

export class RateLimiter {
  static _cleanup(map) {
    const agora = Date.now();
    for (const [chave, dados] of map.entries()) {
      if (dados.bloqueadoAte && dados.bloqueadoAte < agora) {
        map.delete(chave);
      } else if (agora - dados.primeiraTentativa > 60 * 60 * 1000) {
        map.delete(chave);
      }
    }
  }

  static isLoginRateLimited(chave) {
    this._cleanup(loginAttempts);
    const dados = loginAttempts.get(chave);
    if (!dados) return false;
    if (dados.bloqueadoAte && dados.bloqueadoAte > Date.now()) return true;
    return false;
  }

  static registarTentativaLogin(chave, sucesso) {
    if (sucesso) {
      loginAttempts.delete(chave);
      return;
    }
    const agora = Date.now();
    const dados = loginAttempts.get(chave) || { contagem: 0, primeiraTentativa: agora };
    dados.contagem += 1;
    if (dados.contagem >= MAX_LOGIN_ATTEMPTS) {
      dados.bloqueadoAte = agora + LOGIN_BLOCK_DURATION_MS;
    }
    loginAttempts.set(chave, dados);
  }

  static isBookingRateLimited(ip) {
    this._cleanup(bookingAttempts);
    const dados = bookingAttempts.get(ip);
    if (!dados) return false;
    if (dados.bloqueadoAte && dados.bloqueadoAte > Date.now()) return true;
    return false;
  }

  static registarTentativaBooking(ip) {
    const agora = Date.now();
    const dados = bookingAttempts.get(ip) || { contagem: 0, primeiraTentativa: agora };
    dados.contagem += 1;
    if (dados.contagem >= MAX_BOOKING_ATTEMPTS) {
      dados.bloqueadoAte = agora + BOOKING_BLOCK_DURATION_MS;
    }
    bookingAttempts.set(ip, dados);
  }
}

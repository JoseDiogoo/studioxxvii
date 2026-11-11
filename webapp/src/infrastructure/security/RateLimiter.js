// Rate Limiter em memória para proteção contra abuso e força bruta.

const loginAttempts = new Map();
const bookingAttempts = new Map();

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutos

const MAX_BOOKING_ATTEMPTS = 10;
const BOOKING_BLOCK_DURATION_MS = 10 * 60 * 1000; // 10 minutos

const contadores = new Map();

export class RateLimiter {
  /**
   * IP real do pedido. O nginx define X-Real-IP com o IP da ligação (o cliente não o consegue falsificar);
   * X-Forwarded-For não serve: o nginx acrescenta ao que o cliente enviou, por isso o 1.º valor é falsificável.
   */
  static ipDoPedido(req) {
    const headers = req.headers;
    const get = (n) => (typeof headers.get === "function" ? headers.get(n) : headers[n]);
    const real = get("x-real-ip");
    // Sem X-Real-IP (desenvolvimento local) todos partilham o mesmo balde: nunca confiar em X-Forwarded-For.
    return real ? String(real).trim() : "desconhecido";
  }

  /** Limite genérico por chave numa janela de tempo. Devolve true se excedeu o máximo. */
  static excedeu(chave, max, janelaMs) {
    const agora = Date.now();
    if (contadores.size > 5000) {
      for (const [k, d] of contadores) if (agora - d.inicio > d.janelaMs) contadores.delete(k);
    }
    const d = contadores.get(chave);
    if (!d || agora - d.inicio > janelaMs) {
      contadores.set(chave, { inicio: agora, contagem: 1, janelaMs });
      return false;
    }
    d.contagem += 1;
    return d.contagem > max;
  }

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

import test from "node:test";
import assert from "node:assert/strict";
import { destinoSeguro } from "../app/equipa/login/destino.js";
import { RateLimiter } from "@/infrastructure/security/RateLimiter";

test("callbackUrl só aceita caminhos internos", () => {
  assert.equal(destinoSeguro("/equipa/historico?x=1"), "/equipa/historico?x=1");
  for (const mau of ["//evil.com", "https://evil.com", "/" + String.fromCharCode(92) + "evil.com", "/%2fevil.com", "/%5cevil", "/\tevil", "/\nevil", "javascript:alert(1)", "", null, undefined]) {
    assert.equal(destinoSeguro(mau), "/equipa", String(mau));
  }
});

test("TRUSTED_PROXY_HOPS lê o IP a contar do fim de X-Forwarded-For", () => {
  const req = (h) => ({ headers: new Headers(h) });
  const xff = { "x-forwarded-for": "9.9.9.9, 1.2.3.4" }; // 9.9.9.9 falsificado pelo cliente; 1.2.3.4 acrescentado pelo proxy
  delete process.env.TRUSTED_PROXY_HOPS;
  assert.equal(RateLimiter.ipDoPedido(req(xff)), "desconhecido");
  process.env.TRUSTED_PROXY_HOPS = "1";
  assert.equal(RateLimiter.ipDoPedido(req(xff)), "1.2.3.4");
  process.env.TRUSTED_PROXY_HOPS = "2";
  assert.equal(RateLimiter.ipDoPedido(req(xff)), "9.9.9.9");
  assert.equal(RateLimiter.ipDoPedido(req({ ...xff, "x-real-ip": "5.5.5.5" })), "5.5.5.5");
  delete process.env.TRUSTED_PROXY_HOPS;
});

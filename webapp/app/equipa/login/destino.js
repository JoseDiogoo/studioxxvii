// Só caminhos internos: "//site", "\site", "%2f", "%5c" e bytes de controlo seriam um redirecionamento para fora.
export function destinoSeguro(cb) {
  const interno = typeof cb === "string" && /^\/(?![/\\])[^\u0000-\u001F\u007F\\]*$/.test(cb) && !/%2f|%5c/i.test(cb);
  return interno ? cb : "/equipa";
}

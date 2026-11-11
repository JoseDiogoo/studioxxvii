/**
 * Logs de uma linha, fáceis de ler e de pesquisar no Render (Logs → Search).
 * Formato: [NÍVEL] [categoria] o que aconteceu {detalhes}
 * Categorias: arranque, marcacao, equipa, email, login, seguranca, erro.
 * Não registar nomes, telefones completos nem passwords.
 */
const NIVEIS = { info: "INFO ", aviso: "AVISO", erro: "ERRO " };

export function log(nivel, categoria, mensagem, dados) {
  const detalhes = dados && Object.keys(dados).length ? ` ${JSON.stringify(dados)}` : "";
  const linha = `[${NIVEIS[nivel] || nivel}] [${categoria}] ${mensagem}${detalhes}`;
  if (nivel === "erro") console.error(linha);
  else if (nivel === "aviso") console.warn(linha);
  else console.log(linha);
}

/** +351912345678 → +351*****678 */
export function mascararTelefone(tel) {
  const t = String(tel || "");
  return t.length > 6 ? `${t.slice(0, 4)}${"*".repeat(t.length - 7)}${t.slice(-3)}` : "***";
}

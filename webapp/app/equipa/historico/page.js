"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "../equipa.module.css";
import EquipaShell from "../EquipaShell";

const NOMES_METODO = {
  DINHEIRO: "Dinheiro",
  MULTIBANCO: "Multibanco",
  MBWAY: "MB Way",
  CARTAO: "Cartão",
  OUTRO: "Outro",
};

const NOMES_ESTADO = {
  CONFIRMADO: { label: "Confirmado", classe: "pillAmbar" },
  CONCLUIDO: { label: "Concluído", classe: "pillVerde" },
  CANCELADO: { label: "Cancelado", classe: "pillVermelho" },
};

function formatarEuros(valor) {
  return (valor || 0).toLocaleString("pt-PT", { style: "currency", currency: "EUR" });
}

async function fetchJSON(url) {
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Ocorreu um erro.");
  return data;
}

export default function HistoricoPage() {
  const { status } = useSession();
  const router = useRouter();

  const [colaboradores, setColaboradores] = useState([]);
  const [filtros, setFiltros] = useState({ de: "", ate: "", colaboradorId: "", pago: "", q: "" });
  const [qDigitado, setQDigitado] = useState("");
  const [pagina, setPagina] = useState(1);
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/equipa/login");
  }, [status, router]);

  useEffect(() => {
    fetchJSON("/api/colaboradores").then((d) => setColaboradores(d.colaboradores)).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setFiltros((f) => ({ ...f, q: qDigitado }));
      setPagina(1);
    }, 350);
    return () => clearTimeout(t);
  }, [qDigitado]);

  useEffect(() => {
    const params = new URLSearchParams({ page: String(pagina), pageSize: "20" });
    if (filtros.de) params.set("de", filtros.de);
    if (filtros.ate) params.set("ate", filtros.ate);
    if (filtros.colaboradorId) params.set("colaboradorId", filtros.colaboradorId);
    if (filtros.pago) params.set("pago", filtros.pago);
    if (filtros.q) params.set("q", filtros.q);
    setLoading(true);
    fetchJSON(`/api/equipa/historico?${params}`)
      .then(setDados)
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false));
  }, [filtros, pagina]);

  if (status === "loading" || status === "unauthenticated") return null;

  const totalPaginas = dados ? Math.max(1, Math.ceil(dados.total / dados.pageSize)) : 1;

  return (
    <EquipaShell largura="1200px">
      {erro && <div className={styles.erro}>{erro}</div>}

      <div className={styles.paginaCabecalho}>
        <div>
          <div className={styles.paginaTitulo}>Histórico</div>
          <div className={styles.paginaSub}>Todas as marcações — {dados ? dados.total : "…"} no total.</div>
        </div>
      </div>

      <div className={styles.filtros2}>
        <input
          type="text"
          aria-label="Pesquisar cliente"
          placeholder="Pesquisar cliente…"
          value={qDigitado}
          onChange={(e) => setQDigitado(e.target.value)}
        />
        <input
          type="date"
          aria-label="Data inicial"
          value={filtros.de}
          onChange={(e) => { setFiltros((f) => ({ ...f, de: e.target.value })); setPagina(1); }}
        />
        <input
          type="date"
          aria-label="Data final"
          value={filtros.ate}
          onChange={(e) => { setFiltros((f) => ({ ...f, ate: e.target.value })); setPagina(1); }}
        />
        <select
          aria-label="Filtrar por profissional"
          value={filtros.colaboradorId}
          onChange={(e) => { setFiltros((f) => ({ ...f, colaboradorId: e.target.value })); setPagina(1); }}
        >
          <option value="">Todos os profissionais</option>
          {colaboradores.map((c) => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>
        <select
          aria-label="Filtrar por estado de pagamento"
          value={filtros.pago}
          onChange={(e) => { setFiltros((f) => ({ ...f, pago: e.target.value })); setPagina(1); }}
        >
          <option value="">Pago ou não</option>
          <option value="true">Pago</option>
          <option value="false">Por pagar</option>
        </select>
      </div>

      <div className={styles.tabelaWrap}>
        <table className={styles.tabela}>
          <thead>
            <tr>
              <th>Data</th>
              <th>Cliente</th>
              <th>Serviço</th>
              <th>Profissional</th>
              <th>Valor</th>
              <th>Pagamento</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {dados?.agendamentos?.map((a) => {
              const estado = NOMES_ESTADO[a.status] || { label: a.status, classe: "pillNeutro" };
              return (
                <tr key={a.id}>
                  <td>{a.data.slice(0, 10)} · {a.horaInicio}</td>
                  <td>{a.cliente.nome}</td>
                  <td>{a.servico.titulo}</td>
                  <td>{a.colaborador.nome}</td>
                  <td>{formatarEuros(a.valor)}</td>
                  <td>
                    {a.pago ? (
                      <span className={`${styles.pill} ${styles.pillVerde}`}>
                        {a.metodoPagamento ? NOMES_METODO[a.metodoPagamento] || a.metodoPagamento : "Pago"}
                      </span>
                    ) : (
                      <span className={`${styles.pill} ${styles.pillAmbar}`}>Por pagar</span>
                    )}
                  </td>
                  <td><span className={`${styles.pill} ${styles[estado.classe]}`}>{estado.label}</span></td>
                </tr>
              );
            })}
            {!loading && dados?.agendamentos?.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "var(--texto-suave)" }}>
                  Sem marcações para os filtros escolhidos.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className={styles.paginacao}>
          <button type="button" disabled={pagina <= 1} onClick={() => setPagina((p) => p - 1)}>‹ Anterior</button>
          <span>Página {pagina} de {totalPaginas}</span>
          <button type="button" disabled={pagina >= totalPaginas} onClick={() => setPagina((p) => p + 1)}>Seguinte ›</button>
        </div>
      </div>
    </EquipaShell>
  );
}

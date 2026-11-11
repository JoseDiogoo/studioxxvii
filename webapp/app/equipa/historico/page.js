"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "../equipa.module.css";
import EquipaShell from "../EquipaShell";

const ESTADOS = {
  CONFIRMADO: { texto: "Confirmada", classe: "" },
  CONCLUIDO: { texto: "Concluída", classe: styles.verde },
  CANCELADO: { texto: "Cancelada", classe: styles.vermelho },
};

export default function HistoricoPage() {
  const { status } = useSession();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [qAtivo, setQAtivo] = useState("");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [pagina, setPagina] = useState(1);
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/equipa/login");
  }, [status, router]);

  // Pesquisa por nome só depois de parar de escrever.
  useEffect(() => {
    const t = setTimeout(() => {
      setQAtivo(q.trim());
      setPagina(1);
    }, 350);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const params = new URLSearchParams({ page: String(pagina), pageSize: "20" });
    if (qAtivo) params.set("q", qAtivo);
    if (de) params.set("de", de);
    if (ate) params.set("ate", ate);
    fetch(`/api/equipa/historico?${params}`)
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error || "Ocorreu um erro.");
        setDados(d);
        setErro("");
      })
      .catch((e) => setErro(e.message));
  }, [qAtivo, de, ate, pagina]);

  if (status === "loading" || status === "unauthenticated") return null;

  const totalPaginas = dados ? Math.max(1, Math.ceil(dados.total / dados.pageSize)) : 1;

  return (
    <EquipaShell>
      <h1 className={styles.titulo}>Histórico</h1>
      <p className={styles.sub}>{dados ? `${dados.total} marcações no total` : "A carregar…"}</p>

      <div className={styles.filtros}>
        <input type="search" placeholder="Procurar cliente…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Procurar cliente" />
        <input type="date" value={de} onChange={(e) => { setDe(e.target.value); setPagina(1); }} aria-label="De" />
        <input type="date" value={ate} onChange={(e) => { setAte(e.target.value); setPagina(1); }} aria-label="Até" />
      </div>

      {erro && <div className={styles.erro} role="alert">{erro}</div>}

      <div className={styles.lista}>
        {dados && dados.agendamentos.length === 0 && <div className={styles.vazio}>Nenhuma marcação encontrada.</div>}
        {dados?.agendamentos.map((m) => {
          const est = ESTADOS[m.status] || ESTADOS.CONFIRMADO;
          const data = new Date(m.data).toLocaleDateString("pt-PT", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
          return (
            <article key={m.id} className={`${styles.cartao} ${m.status === "CONCLUIDO" ? styles.cartaoConcluido : ""} ${m.status === "CANCELADO" ? styles.cartaoCancelado : ""}`}>
              <div className={styles.hora}>
                {m.horaInicio}
                <small>{data}</small>
              </div>
              <div>
                <div className={styles.cliente}>
                  {m.cliente?.nome}
                  <span className={`${styles.etiquetaEstado} ${est.classe}`}>{est.texto}</span>
                </div>
                <div className={styles.servicoNome}>{m.servico?.titulo}</div>
                {m.cliente?.telefone && (
                  <a className={styles.telefone} href={`tel:${m.cliente.telefone.replace(/\s/g, "")}`}>{m.cliente.telefone}</a>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <div className={styles.paginacao}>
        <button type="button" disabled={pagina <= 1} onClick={() => setPagina((p) => p - 1)}>‹ Anterior</button>
        <span>Página {pagina} de {totalPaginas}</span>
        <button type="button" disabled={pagina >= totalPaginas} onClick={() => setPagina((p) => p + 1)}>Seguinte ›</button>
      </div>
    </EquipaShell>
  );
}

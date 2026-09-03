"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "../equipa.module.css";
import EquipaShell from "../EquipaShell";

const PERIODOS = [
  { id: "mes", label: "Este mês" },
  { id: "mesPassado", label: "Mês passado" },
  { id: "30dias", label: "Últimos 30 dias" },
  { id: "ano", label: "Este ano" },
];

const NOMES_METODO = {
  DINHEIRO: "Dinheiro",
  MULTIBANCO: "Multibanco",
  MBWAY: "MB Way",
  CARTAO: "Cartão",
  OUTRO: "Outro",
};

function formatarEuros(valor) {
  return (valor || 0).toLocaleString("pt-PT", { style: "currency", currency: "EUR" });
}

function formatarDataOnly(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function intervaloPara(periodo) {
  const hoje = new Date();
  if (periodo === "mes") {
    return {
      de: formatarDataOnly(new Date(hoje.getFullYear(), hoje.getMonth(), 1)),
      ate: formatarDataOnly(new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)),
    };
  }
  if (periodo === "mesPassado") {
    return {
      de: formatarDataOnly(new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)),
      ate: formatarDataOnly(new Date(hoje.getFullYear(), hoje.getMonth(), 0)),
    };
  }
  if (periodo === "30dias") {
    const de = new Date(hoje);
    de.setDate(de.getDate() - 29);
    return { de: formatarDataOnly(de), ate: formatarDataOnly(hoje) };
  }
  return {
    de: formatarDataOnly(new Date(hoje.getFullYear(), 0, 1)),
    ate: formatarDataOnly(new Date(hoje.getFullYear(), 11, 31)),
  };
}

async function fetchJSON(url) {
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Ocorreu um erro.");
  return data;
}

export default function DashboardPage() {
  const { status } = useSession();
  const router = useRouter();

  const [periodo, setPeriodo] = useState("mes");
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/equipa/login");
  }, [status, router]);

  useEffect(() => {
    const { de, ate } = intervaloPara(periodo);
    setLoading(true);
    fetchJSON(`/api/equipa/estatisticas?de=${de}&ate=${ate}`)
      .then(setDados)
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false));
  }, [periodo]);

  const maiorDia = useMemo(() => {
    if (!dados?.receitaPorDia?.length) return 0;
    return Math.max(...dados.receitaPorDia.map((d) => d.total), 1);
  }, [dados]);

  const maiorServico = useMemo(() => {
    if (!dados?.porServico?.length) return 1;
    return Math.max(...dados.porServico.map((s) => s.quantidade), 1);
  }, [dados]);

  if (status === "loading" || status === "unauthenticated") return null;

  return (
    <EquipaShell largura="1200px">
      {erro && <div className={styles.erro}>{erro}</div>}

      <div className={styles.paginaCabecalho}>
        <div>
          <div className={styles.paginaTitulo}>Dashboard</div>
          <div className={styles.paginaSub}>Receitas, serviços mais vendidos e desempenho da equipa.</div>
        </div>
        <div className={styles.seletorPeriodo}>
          {PERIODOS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`${styles.seletorBotao} ${periodo === p.id ? styles.seletorBotaoAtivo : ""}`}
              onClick={() => setPeriodo(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading && !dados ? (
        <div className={styles.vazioDashboard}>A carregar…</div>
      ) : dados ? (
        <>
          <div className={styles.statGrid}>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Receita</div>
              <div className={`${styles.statValor} ${styles.statDourado}`}>{formatarEuros(dados.resumo.receitaTotal)}</div>
              <div className={styles.statSub}>no período selecionado</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Marcações</div>
              <div className={styles.statValor}>{dados.resumo.totalMarcacoes}</div>
              <div className={styles.statSub}>confirmadas ou concluídas</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Ticket médio</div>
              <div className={styles.statValor}>{formatarEuros(dados.resumo.ticketMedio)}</div>
              <div className={styles.statSub}>por marcação</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Por receber</div>
              <div className={styles.statValor}>{formatarEuros(dados.resumo.receitaPendente)}</div>
              <div className={styles.statSub}>{dados.resumo.marcacoesPendentes} marcação(ões) por pagar</div>
            </div>
          </div>

          <div className={styles.grelhaDashboard}>
            <div>
              <div className={styles.painel}>
                <div className={styles.painelTitulo}>Receita por dia</div>
                {dados.receitaPorDia.length === 0 ? (
                  <div className={styles.vazioDashboard}>Sem dados neste período.</div>
                ) : (
                  <div className={styles.graficoBarras}>
                    {dados.receitaPorDia.map((d) => (
                      <div key={d.data} className={styles.graficoColuna} title={`${d.data}: ${formatarEuros(d.total)}`}>
                        <div
                          className={styles.graficoBarra}
                          style={{ height: `${Math.max(4, (d.total / maiorDia) * 100)}%` }}
                        />
                        <span className={styles.graficoLabel}>
                          {new Date(`${d.data}T00:00:00`).getDate()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.painel}>
                <div className={styles.painelTitulo}>Por profissional</div>
                {dados.porColaborador.length === 0 ? (
                  <div className={styles.vazioDashboard}>Sem dados neste período.</div>
                ) : (
                  <div className={styles.listaTop}>
                    {dados.porColaborador.map((c) => (
                      <div key={c.colaboradorId} className={styles.topLinha}>
                        <div className={styles.topLinhaCabecalho}>
                          <span className={styles.topLinhaNome}>{c.nome}</span>
                          <span className={styles.topLinhaValor}>{formatarEuros(c.receita)} · {c.quantidade}x</span>
                        </div>
                        <div className={styles.topBarraTrack}>
                          <div
                            className={styles.topBarraFill}
                            style={{ width: `${(c.receita / (dados.resumo.receitaTotal || 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className={styles.painel}>
                <div className={styles.painelTitulo}>Serviços mais vendidos</div>
                {dados.porServico.length === 0 ? (
                  <div className={styles.vazioDashboard}>Sem dados neste período.</div>
                ) : (
                  <div className={styles.listaTop}>
                    {dados.porServico.map((s) => (
                      <div key={s.servicoId} className={styles.topLinha}>
                        <div className={styles.topLinhaCabecalho}>
                          <span className={styles.topLinhaNome}>{s.titulo}</span>
                          <span className={styles.topLinhaValor}>{s.quantidade}x</span>
                        </div>
                        <div className={styles.topBarraTrack}>
                          <div
                            className={styles.topBarraFill}
                            style={{ width: `${(s.quantidade / maiorServico) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.painel}>
                <div className={styles.painelTitulo}>Métodos de pagamento</div>
                {dados.porMetodo.length === 0 ? (
                  <div className={styles.vazioDashboard}>Sem pagamentos registados.</div>
                ) : (
                  <div className={styles.listaTop}>
                    {dados.porMetodo.map((m) => (
                      <div key={m.metodo} className={styles.topLinha}>
                        <div className={styles.topLinhaCabecalho}>
                          <span className={styles.topLinhaNome}>{NOMES_METODO[m.metodo] || m.metodo}</span>
                          <span className={styles.topLinhaValor}>{formatarEuros(m.receita)}</span>
                        </div>
                        <div className={styles.topBarraTrack}>
                          <div
                            className={styles.topBarraFill}
                            style={{ width: `${(m.receita / (dados.resumo.receitaTotal || 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </EquipaShell>
  );
}

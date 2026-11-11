"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "./marcar.module.css";
import { formatarDuracao } from "../duracao";

const NOMES_MES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const NOMES_DIA_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const TOTAL_PASSOS = 3;
const ETIQUETAS = ["Serviço", "Dia e hora", "Dados"];

function formatarEuros(valor) {
  return valor.toLocaleString("pt-PT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

function formatarDataOnly(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatarDiaLongo(chave) {
  if (!chave) return "";
  const [y, m, d] = chave.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" });
}

async function fetchJSON(url, options) {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || "Ocorreu um erro. Tenta novamente.");
    err.status = res.status;
    throw err;
  }
  return data;
}

// Este mês e o seguinte: chega para mostrar as próximas datas sem calendário.
async function buscarDias(servicos) {
  const hoje = new Date();
  const meses = [0, 1].map((i) => new Date(hoje.getFullYear(), hoje.getMonth() + i, 1));
  const rs = await Promise.all(
    meses.map((m) =>
      fetchJSON("/api/disponibilidade/dias", {
        method: "POST",
        body: JSON.stringify({
          servicos,
          de: formatarDataOnly(m),
          ate: formatarDataOnly(new Date(m.getFullYear(), m.getMonth() + 1, 0)),
        }),
      })
    )
  );
  return new Set(rs.flatMap((r) => r.diasDisponiveis));
}

async function buscarHoras(servicos, data) {
  const d = await fetchJSON("/api/disponibilidade/horas", {
    method: "POST",
    body: JSON.stringify({ servicos, data }),
  });
  return d.slots;
}

export default function MarcarPage() {
  const [passo, setPasso] = useState(1);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const [servicos, setServicos] = useState([]);
  const [servicoId, setServicoId] = useState(null);

  const [diasDisponiveis, setDiasDisponiveis] = useState(new Set());
  const [diaSelecionado, setDiaSelecionado] = useState(null);

  const [horasDisponiveis, setHorasDisponiveis] = useState([]);
  const [horaSelecionada, setHoraSelecionada] = useState(null);

  const [cliente, setCliente] = useState({ nome: "", telefone: "", email: "", observacoes: "" });
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [empresaSite, setEmpresaSite] = useState(""); // honeypot anti-spam — deve ficar sempre vazio

  useEffect(() => {
    fetchJSON("/api/servicos")
      .then((d) => setServicos(d?.servicos || (Array.isArray(d) ? d : [])))
      .catch((e) => setErro(e.message));
  }, []);

  const servicoEscolhido = useMemo(
    () => (Array.isArray(servicos) ? servicos.find((s) => s.id === servicoId) : null) || null,
    [servicos, servicoId]
  );

  // Só há um barbeiro: o servidor atribui o profissional livre automaticamente.
  const payloadServicos = useMemo(
    () => (servicoId ? [{ servicoId, colaboradorId: null }] : []),
    [servicoId]
  );

  function escolherServico(id) {
    setServicoId(id);
    setDiaSelecionado(null);
    setHoraSelecionada(null);
    setDiasDisponiveis(new Set());
    setHorasDisponiveis([]);
    setErro("");
    setPasso(2);
  }

  useEffect(() => {
    if (passo !== 2 || !servicoId) return;
    setLoading(true);
    setErro("");
    buscarDias(payloadServicos)
      .then(setDiasDisponiveis)
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false));
  }, [passo, payloadServicos, servicoId]);

  useEffect(() => {
    if (passo !== 2 || !diaSelecionado) return;
    setLoading(true);
    setErro("");
    buscarHoras(payloadServicos, diaSelecionado)
      .then(setHorasDisponiveis)
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false));
  }, [passo, diaSelecionado, payloadServicos]);

  // Enquanto o cliente está no passo das horas, volta a pedir a disponibilidade de 10 em 10 segundos
  // (e quando volta ao separador): uma hora que outra pessoa acabou de marcar desaparece sozinha.
  useEffect(() => {
    if (passo !== 2 || !servicoId) return;
    let ativo = true;
    async function atualizar() {
      if (document.hidden) return;
      try {
        const dias = await buscarDias(payloadServicos);
        if (!ativo) return;
        setDiasDisponiveis(dias);
        if (diaSelecionado && !dias.has(diaSelecionado)) {
          // O dia ficou cheio: passa para o primeiro dia livre.
          setDiaSelecionado(null);
          setHoraSelecionada(null);
          setHorasDisponiveis([]);
          return;
        }
        if (diaSelecionado) {
          const horas = await buscarHoras(payloadServicos, diaSelecionado);
          if (ativo) setHorasDisponiveis(horas);
        }
      } catch {
        // Falha pontual de rede: mantém o que já está no ecrã e tenta na próxima volta.
      }
    }
    const id = setInterval(atualizar, 10000);
    document.addEventListener("visibilitychange", atualizar);
    return () => {
      ativo = false;
      clearInterval(id);
      document.removeEventListener("visibilitychange", atualizar);
    };
  }, [passo, servicoId, diaSelecionado, payloadServicos]);

  async function confirmarMarcacao() {
    setErro("");
    const nome = cliente.nome.trim();
    const telefone = cliente.telefone.trim();
    const email = cliente.email.trim();
    if (!aceitouTermos) {
      setErro("Tens de aceitar os termos para continuar.");
      return;
    }
    if (nome.length < 2) {
      setErro("Indica o teu nome completo.");
      return;
    }
    if (telefone.replace(/\D/g, "").length < 9) {
      setErro("Indica um número de telefone válido.");
      return;
    }
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      setErro("Indica um email válido, ou deixa o campo em branco.");
      return;
    }
    setLoading(true);
    try {
      const data = await fetchJSON("/api/marcar", {
        method: "POST",
        body: JSON.stringify({
          cliente: { ...cliente, nome, telefone, email },
          servicos: payloadServicos,
          data: diaSelecionado,
          horaInicio: horaSelecionada,
          empresaSite,
        }),
      });
      setResultado(data);
      setPasso(4);
    } catch (e) {
      if (e.status === 409) {
        // Alguém marcou essa hora entretanto: volta às horas (já atualizadas) para escolher outra.
        setHoraSelecionada(null);
        setHorasDisponiveis([]);
        setPasso(2);
      }
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  }

  function irPara(novoPasso) {
    setErro("");
    setPasso(novoPasso);
  }

  return (
    <div className={styles.pagina}>
      <header className={styles.topo}>
        <Link href="/" className={styles.marca} aria-label="Voltar à página inicial">
          <span>STUDIO <em>XXVII</em></span>
        </Link>
        <span className={styles.topoInfo}>Jorge Fernandes · Alcobaça</span>
      </header>

      <main className={styles.conteudo}>
        {passo <= TOTAL_PASSOS && (
          <ol className={styles.passos} aria-label="Progresso">
            {ETIQUETAS.map((nome, i) => (
              <li
                key={nome}
                className={`${styles.passo} ${i + 1 <= passo ? styles.passoAtivo : ""}`}
                aria-current={i + 1 === passo ? "step" : undefined}
              >
                <span className={styles.passoBarra} />
                <span className={styles.passoNome}>{i + 1}. {nome}</span>
              </li>
            ))}
          </ol>
        )}

        {passo > 2 && passo <= TOTAL_PASSOS && (
          <button type="button" className={styles.voltar} onClick={() => irPara(passo - 1)}>
            ← Voltar
          </button>
        )}

        {erro && <div className={styles.erro} role="alert">{erro}</div>}

        {passo === 1 && (
          <PassoServicos servicos={servicos} servicoId={servicoId} escolherServico={escolherServico} />
        )}

        {passo === 2 && (
          <PassoDiaHora
            servico={servicoEscolhido}
            diasDisponiveis={diasDisponiveis}
            diaSelecionado={diaSelecionado}
            setDiaSelecionado={(d) => {
              setDiaSelecionado(d);
              setHoraSelecionada(null);
              setHorasDisponiveis([]);
            }}
            horasDisponiveis={horasDisponiveis}
            escolherHora={(h) => {
              setHoraSelecionada(h);
              irPara(3);
            }}
            loading={loading}
            voltar={() => irPara(1)}
          />
        )}

        {passo === 3 && (
          <PassoDados
            servico={servicoEscolhido}
            diaSelecionado={diaSelecionado}
            horaSelecionada={horaSelecionada}
            cliente={cliente}
            setCliente={setCliente}
            aceitouTermos={aceitouTermos}
            setAceitouTermos={setAceitouTermos}
            empresaSite={empresaSite}
            setEmpresaSite={setEmpresaSite}
          />
        )}

        {passo === 4 && resultado && <PassoSucesso resultado={resultado} servico={servicoEscolhido} />}
      </main>

      {passo === 3 && (
        <div className={styles.barraFixa}>
          <button type="button" className={styles.botao} disabled={loading} onClick={confirmarMarcacao}>
            {loading ? "A confirmar…" : "Confirmar marcação"}
          </button>
        </div>
      )}
    </div>
  );
}

function PassoServicos({ servicos, servicoId, escolherServico }) {
  return (
    <section>
      <h1 className={styles.tituloPasso}>Que corte queres?</h1>
      <div className={styles.lista}>
        {servicos.map((s) => (
          <button
            type="button"
            key={s.id}
            className={`${styles.opcao} ${servicoId === s.id ? styles.opcaoOn : ""}`}
            onClick={() => escolherServico(s.id)}
          >
            <span className={styles.opcaoNome}>{s.titulo}</span>
            <span className={styles.opcaoLinha}>
              <span className={styles.opcaoPreco}>{formatarEuros(s.preco)}</span>
              <span className={styles.opcaoMeta}>{formatarDuracao(s.duracaoMinutos)}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

const DIAS_POR_PAGINA = 10;

// Sem calendário nem scroll: as próximas datas livres em chips + as horas do dia escolhido.
// Tocar numa hora avança logo para o passo seguinte.
function PassoDiaHora({
  servico, diasDisponiveis, diaSelecionado, setDiaSelecionado, horasDisponiveis, escolherHora, loading, voltar,
}) {
  const [pagina, setPagina] = useState(0);

  const dias = useMemo(() => {
    const hoje = formatarDataOnly(new Date());
    return [...diasDisponiveis].filter((d) => d >= hoje).sort();
  }, [diasDisponiveis]);

  // Escolhe já o primeiro dia livre, para as horas aparecerem sem um toque extra.
  useEffect(() => {
    if (!diaSelecionado && dias.length) setDiaSelecionado(dias[0]);
  }, [dias, diaSelecionado, setDiaSelecionado]);

  const totalPaginas = Math.max(1, Math.ceil(dias.length / DIAS_POR_PAGINA));
  const visiveis = dias.slice(pagina * DIAS_POR_PAGINA, (pagina + 1) * DIAS_POR_PAGINA);

  return (
    <section>
      <h1 className={styles.soLeitor}>Dia e hora</h1>
      <div className={styles.linhaTopo}>
        <button type="button" className={styles.voltar} onClick={voltar}>← Voltar</button>
        <span className={styles.etiqueta}>{servico?.titulo}</span>
      </div>

      <div className={styles.diasCabecalho}>
        <span className={styles.grupoLabel}>Dia</span>
        {totalPaginas > 1 && (
          <span className={styles.diasPaginas}>
            <button type="button" className={styles.navBotao} disabled={pagina === 0} onClick={() => setPagina(pagina - 1)} aria-label="Datas anteriores">‹</button>
            <button type="button" className={styles.navBotao} disabled={pagina >= totalPaginas - 1} onClick={() => setPagina(pagina + 1)} aria-label="Mais datas">›</button>
          </span>
        )}
      </div>
      <div className={styles.diasGrid}>
        {visiveis.map((chave) => {
          const [y, m, d] = chave.split("-").map(Number);
          const dt = new Date(y, m - 1, d);
          const on = diaSelecionado === chave;
          return (
            <button
              type="button"
              key={chave}
              className={`${styles.diaChip} ${on ? styles.diaChipOn : ""}`}
              onClick={() => setDiaSelecionado(chave)}
              aria-pressed={on}
              aria-label={dt.toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" })}
            >
              <span className={styles.diaChipSemana}>{NOMES_DIA_SEMANA[dt.getDay()]}</span>
              <span className={styles.diaChipNum}>{d}</span>
              <span className={styles.diaChipMes}>{NOMES_MES[m - 1].slice(0, 3)}</span>
            </button>
          );
        })}
        {!loading && dias.length === 0 && <p className={styles.linhaMeta}>Sem datas disponíveis.</p>}
      </div>

      <div className={styles.grupoLabel}>Hora</div>
      {loading && <p className={styles.linhaMeta}>A carregar…</p>}
      {!loading && diaSelecionado && horasDisponiveis.length === 0 && (
        <p className={styles.linhaMeta}>Sem horas disponíveis nesse dia.</p>
      )}
      <div className={styles.horasGrid}>
        {horasDisponiveis.map((h) => (
          <button type="button" key={h} className={styles.horaBotao} onClick={() => escolherHora(h)}>
            {h}
          </button>
        ))}
      </div>
    </section>
  );
}

function PassoDados({
  servico, diaSelecionado, horaSelecionada, cliente, setCliente, aceitouTermos, setAceitouTermos,
  empresaSite, setEmpresaSite,
}) {
  return (
    <section>
      <p className={styles.etiqueta}>
        {servico?.titulo} · {formatarDiaLongo(diaSelecionado)} às {horaSelecionada}
      </p>
      <h1 className={styles.tituloPasso}>Os teus dados</h1>

      <div className={styles.formWrap}>
        <div className={styles.campo}>
          <label htmlFor="campo-nome">Nome</label>
          <input id="campo-nome" name="nome" autoComplete="name" value={cliente.nome} onChange={(e) => setCliente({ ...cliente, nome: e.target.value })} />
        </div>
        <div className={styles.campo}>
          <label htmlFor="campo-telefone">Telemóvel</label>
          <input id="campo-telefone" name="telefone" type="tel" autoComplete="tel" value={cliente.telefone} onChange={(e) => setCliente({ ...cliente, telefone: e.target.value })} placeholder="+351 9xx xxx xxx" />
        </div>
        <div className={styles.campo}>
          <label htmlFor="campo-email">Email (opcional)</label>
          <input id="campo-email" name="email" type="email" autoComplete="email" value={cliente.email} onChange={(e) => setCliente({ ...cliente, email: e.target.value })} />
        </div>
        <div className={styles.campo}>
          <label htmlFor="campo-observacoes">Observações (opcional)</label>
          <textarea id="campo-observacoes" name="observacoes" rows={3} value={cliente.observacoes} onChange={(e) => setCliente({ ...cliente, observacoes: e.target.value })} />
        </div>
        <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}>
          <label htmlFor="campo-empresa-site">Não preencher</label>
          <input id="campo-empresa-site" name="empresaSite" tabIndex={-1} autoComplete="off" value={empresaSite} onChange={(e) => setEmpresaSite(e.target.value)} />
        </div>
        <label className={styles.termos}>
          <input type="checkbox" checked={aceitouTermos} onChange={(e) => setAceitouTermos(e.target.checked)} />
          <span>
            Li e aceito os{" "}
            <Link href="/termos-condicoes" target="_blank" rel="noopener">Termos e Condições</Link> e a{" "}
            <Link href="/politica-privacidade" target="_blank" rel="noopener">Política de Privacidade</Link>.
          </span>
        </label>
      </div>
    </section>
  );
}

function PassoSucesso({ resultado, servico }) {
  return (
    <section className={styles.sucesso}>
      <p className={styles.etiqueta}>Marcação confirmada</p>
      <h1 className={styles.tituloPasso}>Até já!</h1>
      <p className={styles.sucessoLinha}>{servico?.titulo}</p>
      <p className={styles.sucessoLinha}>{formatarDiaLongo(resultado.data)} às {resultado.horaInicio}</p>
      <p className={styles.linhaMeta}>Studio XXVII · R. Prof. Eng. Joaquim Vieira Natividade, Alcobaça</p>
      <Link href="/" className={styles.botao}>Voltar ao início</Link>
    </section>
  );
}

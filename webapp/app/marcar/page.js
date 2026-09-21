"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "./marcar.module.css";
import LogoBadge from "../LogoBadge";

const NOMES_MES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const NOMES_DIA_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function formatarEuros(valor) {
  return valor.toLocaleString("pt-PT", { style: "currency", currency: "EUR" });
}

function formatarDataOnly(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function iniciais(nome) {
  return nome.trim().charAt(0).toUpperCase();
}

async function fetchJSON(url, options) {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Ocorreu um erro. Tenta novamente.");
  return data;
}

const TOTAL_PASSOS = 4;

export default function MarcarPage() {
  const [passo, setPasso] = useState(1);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const [servicos, setServicos] = useState([]);
  const [selecionadosIds, setSelecionadosIds] = useState([]);
  const [colaboradorPorServico, setColaboradorPorServico] = useState({});
  const [colaboradoresDisponiveis, setColaboradoresDisponiveis] = useState({});

  const [mesAtual, setMesAtual] = useState(() => {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  });
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
      .then((d) => setServicos(d.servicos))
      .catch((e) => setErro(e.message));
  }, []);

  const servicosSelecionados = useMemo(
    () => servicos.filter((s) => selecionadosIds.includes(s.id)),
    [servicos, selecionadosIds]
  );

  const total = useMemo(
    () => servicosSelecionados.reduce((acc, s) => acc + s.preco, 0),
    [servicosSelecionados]
  );

  const payloadServicos = useMemo(
    () =>
      servicosSelecionados.map((s) => ({
        servicoId: s.id,
        colaboradorId: colaboradorPorServico[s.id] || null,
      })),
    [servicosSelecionados, colaboradorPorServico]
  );

  function toggleServico(id) {
    setSelecionadosIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  useEffect(() => {
    if (passo !== 2) return;
    servicosSelecionados.forEach((s) => {
      if (colaboradoresDisponiveis[s.id]) return;
      fetchJSON(`/api/colaboradores?servicoId=${s.id}`)
        .then((d) => setColaboradoresDisponiveis((prev) => ({ ...prev, [s.id]: d.colaboradores })))
        .catch((e) => setErro(e.message));
    });
  }, [passo, servicosSelecionados, colaboradoresDisponiveis]);

  useEffect(() => {
    if (passo !== 3) return;
    setLoading(true);
    setErro("");
    const de = formatarDataOnly(mesAtual);
    const ateData = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0);
    const ate = formatarDataOnly(ateData);
    fetchJSON("/api/disponibilidade/dias", {
      method: "POST",
      body: JSON.stringify({ servicos: payloadServicos, de, ate }),
    })
      .then((d) => setDiasDisponiveis(new Set(d.dias)))
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false));
  }, [passo, mesAtual, payloadServicos]);

  useEffect(() => {
    if (passo !== 3 || !diaSelecionado) return;
    setLoading(true);
    setErro("");
    fetchJSON("/api/disponibilidade/horas", {
      method: "POST",
      body: JSON.stringify({ servicos: payloadServicos, data: diaSelecionado }),
    })
      .then((d) => setHorasDisponiveis(d.horas))
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false));
  }, [passo, diaSelecionado, payloadServicos]);

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
      setPasso(5);
    } catch (e) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  }

  function irPara(novoPasso) {
    setErro("");
    setPasso(novoPasso);
  }

  const podeContinuar = {
    1: selecionadosIds.length > 0,
    2: true,
    3: !!diaSelecionado && !!horaSelecionada,
    4: true,
  };

  return (
    <div className={styles.pagina}>
      <div className={styles.hero}>
        <Link href="/" className={styles.heroBadge} aria-label="Voltar à página inicial">
          <LogoBadge size={92} />
        </Link>
        <div className={styles.heroTitulo}>STUDIO XXVII</div>
        <div className={styles.heroSub}>R. Prof. Eng. Joaquim Vieira Natividade, Alcobaça · Terça a Sábado, 10h–19h</div>
      </div>

      <div className={styles.conteudo}>
        {passo <= TOTAL_PASSOS && (
          <div className={styles.passos}>
            {Array.from({ length: TOTAL_PASSOS }, (_, i) => i + 1).map((p) => (
              <span key={p} className={`${styles.passo} ${p <= passo ? styles.passoAtivo : ""}`} />
            ))}
          </div>
        )}

        {erro && <div className={styles.erro}>{erro}</div>}

        {passo <= TOTAL_PASSOS && (
          <div className={styles.cartaoPrincipal}>
            {passo === 1 && (
              <PassoServicos
                servicos={servicos}
                selecionadosIds={selecionadosIds}
                toggleServico={toggleServico}
              />
            )}

            {passo === 2 && (
              <PassoProfissionais
                servicosSelecionados={servicosSelecionados}
                colaboradorPorServico={colaboradorPorServico}
                setColaboradorPorServico={setColaboradorPorServico}
                colaboradoresDisponiveis={colaboradoresDisponiveis}
              />
            )}

            {passo === 3 && (
              <PassoDiaHora
                mesAtual={mesAtual}
                setMesAtual={setMesAtual}
                diasDisponiveis={diasDisponiveis}
                diaSelecionado={diaSelecionado}
                setDiaSelecionado={(d) => {
                  setDiaSelecionado(d);
                  setHoraSelecionada(null);
                }}
                horasDisponiveis={horasDisponiveis}
                horaSelecionada={horaSelecionada}
                setHoraSelecionada={setHoraSelecionada}
                loading={loading}
              />
            )}

            {passo === 4 && (
              <PassoConfirmacao
                servicosSelecionados={servicosSelecionados}
                colaboradorPorServico={colaboradorPorServico}
                colaboradoresDisponiveis={colaboradoresDisponiveis}
                diaSelecionado={diaSelecionado}
                horaSelecionada={horaSelecionada}
                total={total}
                cliente={cliente}
                setCliente={setCliente}
                aceitouTermos={aceitouTermos}
                setAceitouTermos={setAceitouTermos}
                empresaSite={empresaSite}
                setEmpresaSite={setEmpresaSite}
              />
            )}
          </div>
        )}

        {passo === 5 && resultado && <PassoSucesso resultado={resultado} />}
      </div>

      {passo <= TOTAL_PASSOS && (
        <BarraFixa
          passo={passo}
          irPara={irPara}
          loading={loading}
          confirmarMarcacao={confirmarMarcacao}
          total={total}
          podeContinuar={podeContinuar}
        />
      )}
    </div>
  );
}

function PassoServicos({ servicos, selecionadosIds, toggleServico }) {
  return (
    <div>
      <div className={styles.tituloPasso}>Escolhe os serviços</div>
      <div className={styles.linhas}>
        {servicos.map((s) => {
          const on = selecionadosIds.includes(s.id);
          return (
            <label key={s.id} className={styles.linha}>
              <input
                type="checkbox"
                className={styles.checkInput}
                checked={on}
                onChange={() => toggleServico(s.id)}
              />
              <div className={styles.linhaInfo}>
                <div className={styles.linhaTitulo}>{s.titulo}</div>
                <div className={styles.linhaMeta}>{s.duracaoMinutos} min · {formatarEuros(s.preco)}</div>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function PassoProfissionais({ servicosSelecionados, colaboradorPorServico, setColaboradorPorServico, colaboradoresDisponiveis }) {
  return (
    <div>
      <div className={styles.tituloPasso}>Escolhe o profissional</div>
      {servicosSelecionados.map((s) => {
        const opcoes = [{ id: null, nome: "Sem preferência" }, ...(colaboradoresDisponiveis[s.id] || [])];
        const atual = colaboradorPorServico[s.id] || null;
        return (
          <div key={s.id}>
            <div className={styles.grupoLabel}>{s.titulo}</div>
            <div className={styles.linhas}>
              {opcoes.map((c) => {
                const on = atual === c.id;
                return (
                  <label key={c.id ?? "sem-preferencia"} className={styles.linha}>
                    <span className={`${styles.avatar} ${c.id ? "" : styles.avatarVazio}`}>
                      {c.id ? iniciais(c.nome) : "?"}
                    </span>
                    <div className={styles.linhaInfo}>
                      <div className={styles.linhaTitulo}>{c.nome}</div>
                    </div>
                    <input
                      type="radio"
                      name={`profissional-${s.id}`}
                      className={styles.checkInput}
                      checked={on}
                      onChange={() => setColaboradorPorServico((prev) => ({ ...prev, [s.id]: c.id }))}
                    />
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PassoDiaHora({
  mesAtual, setMesAtual, diasDisponiveis, diaSelecionado, setDiaSelecionado,
  horasDisponiveis, horaSelecionada, setHoraSelecionada, loading,
}) {
  const ano = mesAtual.getFullYear();
  const mes = mesAtual.getMonth();
  const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
  const totalDias = new Date(ano, mes + 1, 0).getDate();
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const inicioMesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  const celulas = [];
  for (let i = 0; i < primeiroDiaSemana; i++) celulas.push(null);
  for (let dia = 1; dia <= totalDias; dia++) celulas.push(new Date(ano, mes, dia));

  const grupos = agruparHoras(horasDisponiveis);

  return (
    <div>
      <div className={styles.tituloPasso}>Escolhe o dia e a hora</div>
      <div className={styles.calendarioWrap}>
        <div className={styles.calendarioHeader}>
          <button
            type="button"
            className={styles.navBotao}
            disabled={mesAtual <= inicioMesAtual}
            onClick={() => setMesAtual(new Date(ano, mes - 1, 1))}
            aria-label="Mês anterior"
          >
            ‹
          </button>
          <span className={styles.calendarioMes}>{NOMES_MES[mes]} {ano}</span>
          <button
            type="button"
            className={styles.navBotao}
            onClick={() => setMesAtual(new Date(ano, mes + 1, 1))}
            aria-label="Mês seguinte"
          >
            ›
          </button>
        </div>
        <div className={styles.calendarioGrid}>
          {NOMES_DIA_SEMANA.map((d, i) => (
            <div key={i} className={styles.diaSemanaLabel}>{d}</div>
          ))}
          {celulas.map((data, i) => {
            if (!data) return <div key={i} className={styles.dia} />;
            const chave = formatarDataOnly(data);
            const disponivel = diasDisponiveis.has(chave) && data >= hoje;
            const selecionado = diaSelecionado === chave;
            return (
              <button
                type="button"
                key={i}
                disabled={!disponivel}
                className={`${styles.dia} ${disponivel ? styles.diaDisponivel : ""} ${selecionado ? styles.diaSelecionado : ""}`}
                onClick={() => setDiaSelecionado(chave)}
                aria-label={data.toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" })}
                aria-pressed={selecionado}
              >
                {data.getDate()}
              </button>
            );
          })}
        </div>
      </div>

      {diaSelecionado && (
        <div className={styles.horasWrap}>
          {loading && <div className={styles.linhaMeta}>A carregar horas…</div>}
          {!loading && horasDisponiveis.length === 0 && (
            <div className={styles.linhaMeta}>Sem horas disponíveis nesse dia.</div>
          )}
          {Object.entries(grupos).map(([nome, horas]) =>
            horas.length === 0 ? null : (
              <div key={nome}>
                <div className={styles.grupoLabel}>{nome}</div>
                <div className={styles.horasGrid}>
                  {horas.map((h) => (
                    <button
                      type="button"
                      key={h}
                      className={`${styles.horaBotao} ${horaSelecionada === h ? styles.horaBotaoSelecionada : ""}`}
                      onClick={() => setHoraSelecionada(h)}
                      aria-pressed={horaSelecionada === h}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

function agruparHoras(horas) {
  const grupos = { "Manhã": [], "Tarde": [], "Noite": [] };
  for (const h of horas) {
    const hora = Number(h.split(":")[0]);
    if (hora < 13) grupos["Manhã"].push(h);
    else if (hora < 19) grupos["Tarde"].push(h);
    else grupos["Noite"].push(h);
  }
  return grupos;
}

function PassoConfirmacao({
  servicosSelecionados, colaboradorPorServico, colaboradoresDisponiveis,
  diaSelecionado, horaSelecionada, total, cliente, setCliente, aceitouTermos, setAceitouTermos,
  empresaSite, setEmpresaSite,
}) {
  function nomeColaborador(servicoId) {
    const id = colaboradorPorServico[servicoId];
    if (!id) return "Sem preferência";
    const lista = colaboradoresDisponiveis[servicoId] || [];
    return lista.find((c) => c.id === id)?.nome || "—";
  }

  return (
    <div>
      <div className={styles.tituloPasso}>Confirma a marcação</div>
      <div className={styles.resumoWrap}>
        {servicosSelecionados.map((s) => (
          <div key={s.id} className={styles.resumoLinha}>
            <span>{s.titulo} · {nomeColaborador(s.id)}</span>
            <span>{formatarEuros(s.preco)}</span>
          </div>
        ))}
        <div className={styles.resumoLinha}>
          <span>{diaSelecionado} às {horaSelecionada}</span>
          <strong>{formatarEuros(total)}</strong>
        </div>
      </div>

      <div className={styles.formWrap}>
        <div className={styles.campo}>
          <label htmlFor="campo-nome">Nome</label>
          <input id="campo-nome" name="nome" autoComplete="name" value={cliente.nome} onChange={(e) => setCliente({ ...cliente, nome: e.target.value })} />
        </div>
        <div className={styles.campo}>
          <label htmlFor="campo-telefone">Telefone</label>
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
            <Link href="/politica-privacidade" target="_blank" rel="noopener">Política de Privacidade</Link>,
            que autoriza o uso dos meus dados para gerir esta marcação.
          </span>
        </label>
      </div>
    </div>
  );
}

function PassoSucesso({ resultado }) {
  return (
    <div className={styles.sucesso}>
      <div className={styles.sucessoTitulo}>Marcação confirmada!</div>
      <p>Dia {resultado.data} às {resultado.horaInicio}</p>
      <p>Total a pagar na barbearia: {formatarEuros(resultado.total)}</p>
      <p className={styles.linhaMeta}>Guarda esta confirmação. Até já!</p>
      <div className={styles.sucessoBotoes}>
        <Link href="/" className={styles.botao}>Voltar ao início</Link>
      </div>
    </div>
  );
}

function BarraFixa({ passo, irPara, loading, confirmarMarcacao, total, podeContinuar }) {
  return (
    <div className={styles.barraFixa}>
      <div>
        {passo > 1 ? (
          <button type="button" className={styles.botaoSecundario} onClick={() => irPara(passo - 1)}>
            Voltar
          </button>
        ) : (
          <Link href="/" className={styles.botaoSecundario}>
            Voltar
          </Link>
        )}
      </div>
      <div className={styles.total}>
        Total: <span className={styles.totalValor}>{formatarEuros(total)}</span>
      </div>
      {passo < TOTAL_PASSOS && (
        <button
          type="button"
          className={styles.botao}
          disabled={!podeContinuar[passo] || loading}
          onClick={() => irPara(passo + 1)}
        >
          Continuar
        </button>
      )}
      {passo === TOTAL_PASSOS && (
        <button type="button" className={styles.botao} disabled={loading} onClick={confirmarMarcacao}>
          {loading ? "A confirmar…" : "Confirmar marcação"}
        </button>
      )}
    </div>
  );
}

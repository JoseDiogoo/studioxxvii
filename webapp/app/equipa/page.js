"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import multiMonthPlugin from "@fullcalendar/multimonth";
import interactionPlugin from "@fullcalendar/interaction";
import ptLocale from "@fullcalendar/core/locales/pt";
import styles from "./equipa.module.css";
import EquipaShell from "./EquipaShell";

const PALETA = ["#c9a35f", "#7a8f6e", "#8a6fa8", "#c07a5f", "#5f8fa8"];
const PLUGINS = [dayGridPlugin, timeGridPlugin, multiMonthPlugin, interactionPlugin];
const LOCALES = [ptLocale];
const VISTAS = [
  { id: "timeGridDay", label: "Dia" },
  { id: "timeGridWeek", label: "Semana" },
  { id: "dayGridMonth", label: "Mês" },
  { id: "multiMonthYear", label: "Ano" },
];
const NOMES_MES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const NOMES_DIA_SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];

const METODOS = [
  { value: "", label: "—" },
  { value: "DINHEIRO", label: "Dinheiro" },
  { value: "MULTIBANCO", label: "Multibanco" },
  { value: "MBWAY", label: "MB Way" },
  { value: "CARTAO", label: "Cartão" },
  { value: "OUTRO", label: "Outro" },
];

function formatarDataOnly(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatarHora(date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

async function fetchJSON(url, options) {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Ocorreu um erro.");
  return data;
}

function corDoColaborador(colaboradorId, colaboradores) {
  const idx = colaboradores.findIndex((c) => c.id === colaboradorId);
  return PALETA[idx >= 0 ? idx % PALETA.length : 0];
}

function renderEvento(arg) {
  const a = arg.event.extendedProps;
  if (arg.view.type.startsWith("timeGrid")) {
    return (
      <div className={styles.eventoConteudo}>
        <div className={styles.eventoCliente}>{a.cliente.nome}</div>
        <div className={styles.eventoServico}>{a.servico.titulo}</div>
      </div>
    );
  }
  return (
    <div className={styles.eventoCompacto}>
      <span className={styles.eventoCompactoHora}>{a.horaInicio}</span> {a.cliente.nome}
    </div>
  );
}

function corresponde(agendamento, termo) {
  if (!termo) return true;
  const alvo = `${agendamento.cliente.nome} ${agendamento.servico.titulo}`.toLowerCase();
  return alvo.includes(termo.toLowerCase());
}

function segundaFeiraDaSemana(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diaSemana = d.getDay();
  const diff = diaSemana === 0 ? -6 : 1 - diaSemana;
  d.setDate(d.getDate() + diff);
  return d;
}

export default function AdminPage() {
  const { status } = useSession();
  const router = useRouter();
  const calendarRef = useRef(null);

  const [colaboradores, setColaboradores] = useState([]);
  const [filtroColaborador, setFiltroColaborador] = useState("");
  const [pesquisa, setPesquisa] = useState("");
  const [agendamentos, setAgendamentos] = useState([]);
  const [rangeAtual, setRangeAtual] = useState(null);
  const [selecionado, setSelecionado] = useState(null);
  const [erro, setErro] = useState("");
  const [vistaAtual, setVistaAtual] = useState("timeGridWeek");
  const [tituloCal, setTituloCal] = useState("");

  const hoje = useMemo(() => new Date(), []);
  const [miniCalMes, setMiniCalMes] = useState(() => new Date(hoje.getFullYear(), hoje.getMonth(), 1));
  const [diaSelecionado, setDiaSelecionado] = useState(() => formatarDataOnly(hoje));
  const [mesAgendamentos, setMesAgendamentos] = useState([]);

  const [mostrarDisp, setMostrarDisp] = useState(false);
  const [semanaDisp, setSemanaDisp] = useState(() => segundaFeiraDaSemana(hoje));
  const [dadosDisp, setDadosDisp] = useState(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/equipa/login");
  }, [status, router]);

  useEffect(() => {
    fetchJSON("/api/colaboradores").then((d) => setColaboradores(d.colaboradores)).catch(() => {});
  }, []);

  const recarregar = useCallback(() => {
    if (!rangeAtual) return;
    const params = new URLSearchParams({ inicio: rangeAtual.start, fim: rangeAtual.end });
    if (filtroColaborador) params.set("colaboradorId", filtroColaborador);
    fetchJSON(`/api/equipa/agendamentos?${params}`)
      .then((d) => setAgendamentos(d.agendamentos))
      .catch((e) => setErro(e.message));
  }, [rangeAtual, filtroColaborador]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  const recarregarMes = useCallback(() => {
    const inicio = new Date(miniCalMes.getFullYear(), miniCalMes.getMonth(), 1);
    const fim = new Date(miniCalMes.getFullYear(), miniCalMes.getMonth() + 1, 0, 23, 59, 59);
    const params = new URLSearchParams({ inicio: inicio.toISOString(), fim: fim.toISOString() });
    if (filtroColaborador) params.set("colaboradorId", filtroColaborador);
    fetchJSON(`/api/equipa/agendamentos?${params}`)
      .then((d) => setMesAgendamentos(d.agendamentos))
      .catch(() => {});
  }, [miniCalMes, filtroColaborador]);

  useEffect(() => {
    recarregarMes();
  }, [recarregarMes]);

  useEffect(() => {
    if (!mostrarDisp) return;
    const params = new URLSearchParams({ inicio: formatarDataOnly(semanaDisp) });
    if (filtroColaborador) params.set("colaboradorId", filtroColaborador);
    fetchJSON(`/api/equipa/disponibilidade-semana?${params}`)
      .then(setDadosDisp)
      .catch((e) => setErro(e.message));
  }, [mostrarDisp, semanaDisp, filtroColaborador]);

  function handleDatesSet(info) {
    // usar os objetos Date (não startStr/endStr) para evitar ambiguidade de fuso-horário
    setRangeAtual({ start: info.start.toISOString(), end: info.end.toISOString() });
    setVistaAtual(info.view.type);
    setTituloCal(info.view.title);
  }

  function irParaVista(id) {
    calendarRef.current?.getApi()?.changeView(id);
  }

  function calAnterior() {
    calendarRef.current?.getApi()?.prev();
  }

  function calSeguinte() {
    calendarRef.current?.getApi()?.next();
  }

  function calHoje() {
    calendarRef.current?.getApi()?.today();
  }

  const eventosFiltrados = useMemo(
    () => agendamentos.filter((a) => corresponde(a, pesquisa)),
    [agendamentos, pesquisa]
  );

  const eventos = useMemo(
    () =>
      eventosFiltrados.map((a) => ({
        id: a.id,
        title: `${a.servico.titulo} — ${a.cliente.nome}`,
        start: `${a.data.slice(0, 10)}T${a.horaInicio}`,
        end: `${a.data.slice(0, 10)}T${a.horaFim}`,
        backgroundColor: corDoColaborador(a.colaboradorId, colaboradores),
        borderColor: corDoColaborador(a.colaboradorId, colaboradores),
        extendedProps: a,
      })),
    [eventosFiltrados, colaboradores]
  );

  async function handleEventDrop(info) {
    const ev = info.event;
    try {
      await fetchJSON(`/api/equipa/agendamentos/${ev.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          data: formatarDataOnly(ev.start),
          horaInicio: formatarHora(ev.start),
          horaFim: formatarHora(ev.end),
        }),
      });
      recarregar();
      recarregarMes();
    } catch (e) {
      info.revert();
      setErro(e.message);
    }
  }

  function handleEventClick(info) {
    setSelecionado(info.event.extendedProps);
  }

  async function guardarDetalhe(patch) {
    if (!selecionado) return;
    try {
      const { agendamento } = await fetchJSON(`/api/equipa/agendamentos/${selecionado.id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      setSelecionado(agendamento);
      recarregar();
      recarregarMes();
    } catch (e) {
      setErro(e.message);
    }
  }

  function irParaDia(chave) {
    setDiaSelecionado(chave);
    calendarRef.current?.getApi()?.changeView("timeGridDay", chave);
  }

  const diasComEventos = useMemo(() => {
    const set = new Set();
    for (const a of mesAgendamentos) set.add(a.data.slice(0, 10));
    return set;
  }, [mesAgendamentos]);

  const agendaDoDia = useMemo(
    () =>
      mesAgendamentos
        .filter((a) => a.data.slice(0, 10) === diaSelecionado)
        .filter((a) => corresponde(a, pesquisa))
        .sort((a, b) => (a.horaInicio < b.horaInicio ? -1 : 1)),
    [mesAgendamentos, diaSelecionado, pesquisa]
  );

  if (status === "loading" || status === "unauthenticated") return null;

  return (
    <EquipaShell largura="1400px">
      {erro && <div className={styles.erro}>{erro}</div>}

      <div className={styles.paginaCabecalho}>
        <div>
          <div className={styles.paginaTitulo}>Calendário</div>
          <div className={styles.paginaSub}>Marcações da equipa, arrasta para reagendar.</div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            type="button"
            className={styles.calHojeBotao}
            onClick={() => setMostrarDisp((v) => !v)}
          >
            {mostrarDisp ? "Ocultar disponibilidade" : "Ver disponibilidade da semana"}
          </button>
          <select
            className={styles.select}
            style={{ width: "auto" }}
            value={filtroColaborador}
            onChange={(e) => setFiltroColaborador(e.target.value)}
          >
            <option value="">Todos os profissionais</option>
            {colaboradores.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>
      </div>

      {mostrarDisp && (
        <PainelDisponibilidade
          dados={dadosDisp}
          semana={semanaDisp}
          setSemana={setSemanaDisp}
          nomeFiltro={colaboradores.find((c) => c.id === filtroColaborador)?.nome}
        />
      )}

      <div className={styles.calTopo}>
        <div className={styles.calNavGrupo}>
          <button type="button" className={styles.calNavBotao} onClick={calAnterior} aria-label="Período anterior">‹</button>
          <button type="button" className={styles.calHojeBotao} onClick={calHoje}>Hoje</button>
          <button type="button" className={styles.calNavBotao} onClick={calSeguinte} aria-label="Período seguinte">›</button>
          <span className={styles.calTitulo}>{tituloCal}</span>
        </div>

        <div className={styles.calTopoDireita}>
          <div className={styles.pesquisaBarra}>
            <span className={styles.pesquisaIcone}>⌕</span>
            <input
              type="text"
              placeholder="Pesquisar cliente ou serviço…"
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
            />
          </div>
          <div className={styles.segmentado}>
            {VISTAS.map((v) => (
              <button
                key={v.id}
                type="button"
                className={`${styles.segmentoItem} ${vistaAtual === v.id ? styles.segmentoItemAtivo : ""}`}
                onClick={() => irParaVista(v.id)}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.calendarioLayout}>
        <div className={styles.calSidebar}>
          <MiniCalendario
            mes={miniCalMes}
            setMes={setMiniCalMes}
            diaSelecionado={diaSelecionado}
            onSelecionarDia={irParaDia}
            diasComEventos={diasComEventos}
          />

          <div className={styles.agendaPainel}>
            <div className={styles.agendaTitulo}>
              {formatarTituloAgenda(diaSelecionado)}
            </div>
            {agendaDoDia.length === 0 && <div className={styles.agendaVazio}>Sem marcações neste dia.</div>}
            {agendaDoDia.map((a) => (
              <div key={a.id} className={styles.agendaItem} onClick={() => setSelecionado(a)} style={{ cursor: "pointer" }}>
                <span className={styles.agendaCor} style={{ background: corDoColaborador(a.colaboradorId, colaboradores) }} />
                <div>
                  <div className={styles.agendaHora}>{a.horaInicio} – {a.horaFim}</div>
                  <div className={styles.agendaNome}>{a.cliente.nome}</div>
                  <div className={styles.agendaServico}>{a.servico.titulo}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.calendarioCard}>
          <FullCalendar
            ref={calendarRef}
            plugins={PLUGINS}
            initialView="timeGridWeek"
            headerToolbar={false}
            dayMaxEvents
            slotMinTime="08:00:00"
            slotMaxTime="21:00:00"
            firstDay={1}
            editable={true}
            events={eventos}
            eventDrop={handleEventDrop}
            eventClick={handleEventClick}
            datesSet={handleDatesSet}
            locales={LOCALES}
            locale="pt"
            height="auto"
            eventContent={renderEvento}
          />
        </div>
      </div>

      {selecionado && (
        <DetalheAgendamento
          agendamento={selecionado}
          colaboradores={colaboradores}
          onFechar={() => setSelecionado(null)}
          onGuardar={guardarDetalhe}
        />
      )}
    </EquipaShell>
  );
}

function formatarTituloAgenda(chave) {
  const hojeChave = formatarDataOnly(new Date());
  const amanha = new Date();
  amanha.setDate(amanha.getDate() + 1);
  if (chave === hojeChave) return "Hoje";
  if (chave === formatarDataOnly(amanha)) return "Amanhã";
  const [y, m, d] = chave.split("-").map(Number);
  const data = new Date(y, m - 1, d);
  return data.toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" });
}

function MiniCalendario({ mes, setMes, diaSelecionado, onSelecionarDia, diasComEventos }) {
  const ano = mes.getFullYear();
  const mesIdx = mes.getMonth();
  const primeiroDiaSemana = new Date(ano, mesIdx, 1).getDay();
  const totalDias = new Date(ano, mesIdx + 1, 0).getDate();
  const totalDiasMesAnterior = new Date(ano, mesIdx, 0).getDate();
  const hojeChave = formatarDataOnly(new Date());

  const celulas = [];
  for (let i = primeiroDiaSemana - 1; i >= 0; i--) {
    celulas.push({ dia: totalDiasMesAnterior - i, fora: true });
  }
  for (let dia = 1; dia <= totalDias; dia++) {
    celulas.push({ dia, fora: false, chave: formatarDataOnly(new Date(ano, mesIdx, dia)) });
  }
  while (celulas.length % 7 !== 0) {
    celulas.push({ dia: celulas.length, fora: true });
  }

  return (
    <div className={styles.miniCal}>
      <div className={styles.miniCalHeader}>
        <span className={styles.miniCalMes}>{NOMES_MES[mesIdx]} {ano}</span>
        <div className={styles.miniCalNav}>
          <button type="button" className={styles.miniCalNavBotao} onClick={() => setMes(new Date(ano, mesIdx - 1, 1))}>‹</button>
          <button type="button" className={styles.miniCalNavBotao} onClick={() => setMes(new Date(ano, mesIdx + 1, 1))}>›</button>
        </div>
      </div>
      <div className={styles.miniCalGrid}>
        {NOMES_DIA_SEMANA.map((d, i) => (
          <div key={i} className={styles.miniCalDiaSemana}>{d}</div>
        ))}
        {celulas.map((c, i) => {
          if (c.fora) return <div key={i} className={`${styles.miniCalDia} ${styles.miniCalDiaFora}`}>{c.dia}</div>;
          const ativo = c.chave === diaSelecionado;
          const ehHoje = c.chave === hojeChave;
          const temEventos = diasComEventos.has(c.chave);
          return (
            <button
              type="button"
              key={i}
              className={`${styles.miniCalDia} ${ativo ? styles.miniCalDiaAtivo : ""} ${ehHoje && !ativo ? styles.miniCalDiaHoje : ""} ${temEventos ? styles.miniCalDiaPonto : ""}`}
              onClick={() => onSelecionarDia(c.chave)}
            >
              {c.dia}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const NOMES_DIA_ABREV = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function formatarDataCurta(chave) {
  const [, m, d] = chave.split("-");
  return `${d}/${m}`;
}

function PainelDisponibilidade({ dados, semana, setSemana, nomeFiltro }) {
  const [copiado, setCopiado] = useState(false);
  const fimSemana = useMemo(() => {
    const d = new Date(semana);
    d.setDate(d.getDate() + 6);
    return d;
  }, [semana]);

  const horasUnicas = useMemo(() => {
    if (!dados) return [];
    const set = new Set();
    for (const dia of dados.dias) for (const s of dia.slots) set.add(s.hora);
    return [...set].sort();
  }, [dados]);

  const resumoTexto = useMemo(() => {
    if (!dados) return "";
    const linhas = ["Horários disponíveis esta semana 💈"];
    for (const dia of dados.dias) {
      if (!dia.aberto || dia.livres.length === 0) continue;
      const nome = NOMES_DIA_ABREV[dia.diaSemana];
      const intervalos = dia.livres.map((r) => `${r.inicio}–${r.fim}`).join(", ");
      linhas.push(`${nome} (${formatarDataCurta(dia.data)}): ${intervalos}`);
    }
    if (linhas.length === 1) linhas.push("Sem vagas nesta semana.");
    linhas.push("\nMarca já em studioxxvii.pt/marcar 📲");
    return linhas.join("\n");
  }, [dados]);

  function copiarResumo() {
    navigator.clipboard?.writeText(resumoTexto).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  }

  return (
    <div className={styles.painel} style={{ marginBottom: 24 }}>
      <div className={styles.dispCabecalho}>
        <div>
          <div className={styles.painelTitulo}>Disponibilidade da semana</div>
          <div className={styles.paginaSub}>
            {nomeFiltro || "Todos os profissionais"} — útil para veres de imediato o que ainda está livre e publicares no Instagram.
          </div>
        </div>
        <div className={styles.calNavGrupo}>
          <button
            type="button"
            className={styles.calNavBotao}
            onClick={() => setSemana((s) => { const d = new Date(s); d.setDate(d.getDate() - 7); return d; })}
          >
            ‹
          </button>
          <span className={styles.calTitulo} style={{ fontSize: "0.9rem" }}>
            {formatarDataCurta(formatarDataOnly(semana))} – {formatarDataCurta(formatarDataOnly(fimSemana))}
          </span>
          <button
            type="button"
            className={styles.calNavBotao}
            onClick={() => setSemana((s) => { const d = new Date(s); d.setDate(d.getDate() + 7); return d; })}
          >
            ›
          </button>
        </div>
      </div>

      {!dados ? (
        <div className={styles.vazioDashboard}>A carregar…</div>
      ) : (
        <>
          <div className={styles.dispTabelaWrap}>
            <table className={styles.dispTabela}>
              <thead>
                <tr>
                  <th></th>
                  {dados.dias.map((dia) => (
                    <th key={dia.data}>
                      {NOMES_DIA_ABREV[dia.diaSemana].slice(0, 3)}
                      <span>{formatarDataCurta(dia.data)}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {horasUnicas.map((hora) => (
                  <tr key={hora}>
                    <td className={styles.dispHoraLabel}>{hora}</td>
                    {dados.dias.map((dia) => {
                      const slot = dia.slots.find((s) => s.hora === hora);
                      const estado = !dia.aberto || !slot ? "fechado" : slot.estado;
                      return (
                        <td key={dia.data + hora}>
                          <span className={`${styles.dispCelula} ${styles["dispCelula_" + estado]}`} />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.dispLegenda}>
            <span><i className={`${styles.dispCelula} ${styles.dispCelula_livre}`} /> Livre</span>
            <span><i className={`${styles.dispCelula} ${styles.dispCelula_ocupado}`} /> Ocupado</span>
            <span><i className={`${styles.dispCelula} ${styles.dispCelula_fechado}`} /> Fechado</span>
          </div>

          <div className={styles.dispResumo}>
            <pre>{resumoTexto}</pre>
            <button type="button" className={styles.botaoOuroSm} onClick={copiarResumo}>
              {copiado ? "Copiado!" : "Copiar para o Instagram"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function DetalheAgendamento({ agendamento, colaboradores, onFechar, onGuardar }) {
  return (
    <div className={styles.detalhe}>
      <button className={styles.detalheFechar} onClick={onFechar}>✕</button>
      <div className={styles.detalheLinha}>
        <div className={styles.detalheLabel}>Cliente</div>
        <div className={styles.detalheValor}>{agendamento.cliente.nome}</div>
      </div>
      <div className={styles.detalheLinha}>
        <div className={styles.detalheLabel}>Telefone</div>
        <div className={styles.detalheValor}>{agendamento.cliente.telefone}</div>
      </div>
      <div className={styles.detalheLinha}>
        <div className={styles.detalheLabel}>Serviço</div>
        <div className={styles.detalheValor}>{agendamento.servico.titulo} — {agendamento.valor.toFixed(2)}€</div>
      </div>
      <div className={styles.detalheLinha}>
        <div className={styles.detalheLabel}>Hora</div>
        <div className={styles.detalheValor}>{agendamento.data.slice(0, 10)} · {agendamento.horaInicio}–{agendamento.horaFim}</div>
      </div>

      <div className={styles.detalheLinha}>
        <div className={styles.detalheLabel}>Profissional</div>
        <select
          className={styles.select}
          value={agendamento.colaboradorId}
          onChange={(e) => onGuardar({ colaboradorId: e.target.value })}
        >
          {colaboradores.map((c) => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>
      </div>

      <div className={styles.checkboxLinha}>
        <input
          type="checkbox"
          checked={agendamento.pago}
          onChange={(e) => onGuardar({ pago: e.target.checked })}
        />
        <span>Pago</span>
      </div>

      <div className={styles.detalheLinha}>
        <div className={styles.detalheLabel}>Método de pagamento</div>
        <select
          className={styles.select}
          value={agendamento.metodoPagamento || ""}
          onChange={(e) => onGuardar({ metodoPagamento: e.target.value || null })}
        >
          {METODOS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>

      <div className={styles.detalheLinha}>
        <div className={styles.detalheLabel}>Estado</div>
        <select
          className={styles.select}
          value={agendamento.status}
          onChange={(e) => onGuardar({ status: e.target.value })}
        >
          <option value="CONFIRMADO">Confirmado</option>
          <option value="CONCLUIDO">Concluído</option>
          <option value="CANCELADO">Cancelado</option>
        </select>
      </div>
    </div>
  );
}

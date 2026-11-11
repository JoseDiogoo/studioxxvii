"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import ptLocale from "@fullcalendar/core/locales/pt";
import styles from "./equipa.module.css";
import EquipaShell from "./EquipaShell";
import { formatarDuracao } from "../duracao";

const PLUGINS = [dayGridPlugin, timeGridPlugin, interactionPlugin];
const VISTAS = [
  { id: "dia", label: "Dia" },
  { id: "timeGridWeek", label: "Semana" },
  { id: "dayGridMonth", label: "Mês" },
];
const ABRE = 10 * 60; // 10:00
const FECHA = 19 * 60; // 19:00
const MIN_LIVRE = 30; // só mostra "livre" a partir de meia hora

const ESTADOS = {
  CONFIRMADO: { texto: "Por fazer", classe: "" },
  CONCLUIDO: { texto: "Concluída", classe: styles.verde },
  CANCELADO: { texto: "Cancelada", classe: styles.vermelho },
};

const chave = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const daChave = (k) => {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const somarDias = (k, n) => {
  const d = daChave(k);
  d.setDate(d.getDate() + n);
  return chave(d);
};
const minutos = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const hhmm = (min) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

async function pedir(url, opcoes) {
  const res = await fetch(url, {
    ...opcoes,
    headers: { "Content-Type": "application/json", ...(opcoes?.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Ocorreu um erro.");
  return data;
}

const intervalo = (de, ate) => pedir(`/api/equipa/agendamentos?inicio=${de}&fim=${ate}`).then((d) => d.agendamentos || []);

function paraEvento(m) {
  const dia = String(m.data).slice(0, 10);
  return {
    id: m.id,
    title: m.cliente?.nome || "Cliente",
    start: `${dia}T${m.horaInicio}:00`,
    end: `${dia}T${m.horaFim}:00`,
    classNames: [`ev-${m.status}`],
    extendedProps: { m },
  };
}

export default function AgendaPage() {
  const { status } = useSession();
  const router = useRouter();
  const calRef = useRef(null);
  const hoje = chave(new Date());

  const [vista, setVista] = useState("dia");
  const [foco, setFoco] = useState(hoje);
  const [tituloCal, setTituloCal] = useState("");
  const [doDia, setDoDia] = useState([]);
  const [contagens, setContagens] = useState({});
  const [mostrarCanc, setMostrarCanc] = useState(false);
  const mostrarCancRef = useRef(false);
  const [erro, setErro] = useState("");
  const [aberta, setAberta] = useState(null);
  const [aCancelar, setACancelar] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [agora, setAgora] = useState(() => new Date());

  useEffect(() => {
    if (status === "unauthenticated") router.push("/equipa/login");
  }, [status, router]);

  useEffect(() => {
    mostrarCancRef.current = mostrarCanc;
    calRef.current?.getApi().refetchEvents();
  }, [mostrarCanc]);

  // ----- vista Dia (lista) -----
  const carregarDia = useCallback(async () => {
    try {
      setDoDia(await intervalo(foco, foco));
      setErro("");
    } catch (e) {
      setErro(e.message);
    }
  }, [foco]);

  useEffect(() => {
    if (vista !== "dia") return;
    carregarDia();
  }, [vista, carregarDia]);

  // Atualiza sozinho: de 30 em 30 s volta a ler, e de minuto a minuto avança o "a seguir".
  useEffect(() => {
    const dados = setInterval(() => {
      if (document.hidden) return;
      if (vista === "dia") carregarDia();
      else calRef.current?.getApi().refetchEvents();
    }, 30000);
    const relogio = setInterval(() => setAgora(new Date()), 60000);
    return () => {
      clearInterval(dados);
      clearInterval(relogio);
    };
  }, [vista, carregarDia]);

  useEffect(() => {
    if (!aberta) return;
    const fechar = (e) => e.key === "Escape" && setAberta(null);
    window.addEventListener("keydown", fechar);
    return () => window.removeEventListener("keydown", fechar);
  }, [aberta]);

  // ----- vistas Semana/Mês (FullCalendar) -----
  const buscar = useCallback(async (info, ok, falhou) => {
    try {
      const fim = new Date(info.end);
      fim.setDate(fim.getDate() - 1); // info.end é exclusivo
      const lista = await intervalo(chave(info.start), chave(fim));
      const cont = {};
      for (const m of lista) {
        if (m.status === "CANCELADO") continue;
        const k = String(m.data).slice(0, 10);
        cont[k] = (cont[k] || 0) + 1;
      }
      setContagens(cont);
      setErro("");
      ok(lista.filter((m) => mostrarCancRef.current || m.status !== "CANCELADO").map(paraEvento));
    } catch (e) {
      setErro(e.message);
      falhou(e);
    }
  }, []);

  function mudarVista(nova) {
    // Leva a data que se estava a ver para a vista seguinte.
    const api = calRef.current?.getApi();
    if (api && vista !== "dia") setFoco(chave(api.getDate()));
    setVista(nova);
  }

  function navegar(dir) {
    if (vista === "dia") setFoco(somarDias(foco, dir));
    else if (dir < 0) calRef.current?.getApi().prev();
    else calRef.current?.getApi().next();
  }

  function irHoje() {
    setFoco(hoje);
    if (vista !== "dia") calRef.current?.getApi().today();
  }

  async function mudarEstado(novo) {
    setOcupado(true);
    try {
      await pedir(`/api/equipa/agendamentos/${aberta.id}`, { method: "PATCH", body: JSON.stringify({ status: novo }) });
      setAberta(null);
      setACancelar(false);
      if (vista === "dia") carregarDia();
      else calRef.current?.getApi().refetchEvents();
    } catch (e) {
      setErro(e.message);
    } finally {
      setOcupado(false);
    }
  }

  // ----- linha do tempo do dia: marcações + intervalos livres -----
  const linha = useMemo(() => {
    const ordenadas = [...doDia].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
    const ativas = ordenadas.filter((m) => m.status !== "CANCELADO");
    const canceladas = ordenadas.filter((m) => m.status === "CANCELADO");
    const itens = [];
    let cursor = ABRE;
    for (const m of ordenadas) {
      if (m.status === "CANCELADO") {
        if (mostrarCanc) itens.push({ tipo: "marcacao", m });
        continue;
      }
      const ini = minutos(m.horaInicio);
      if (ini - cursor >= MIN_LIVRE) itens.push({ tipo: "livre", de: cursor, ate: ini });
      itens.push({ tipo: "marcacao", m });
      cursor = Math.max(cursor, minutos(m.horaFim));
    }
    if (FECHA - cursor >= MIN_LIVRE) itens.push({ tipo: "livre", de: cursor, ate: FECHA });

    let proxima = null;
    if (foco === hoje) {
      const agoraMin = agora.getHours() * 60 + agora.getMinutes();
      proxima = ativas.find((m) => m.status === "CONFIRMADO" && minutos(m.horaFim) > agoraMin)?.id || null;
    }
    return {
      itens,
      total: ativas.length,
      feitos: ativas.filter((m) => m.status === "CONCLUIDO").length,
      canceladas: canceladas.length,
      proxima,
    };
  }, [doDia, mostrarCanc, foco, hoje, agora]);

  if (status === "loading" || status === "unauthenticated") return null;

  const d = daChave(foco);
  const tituloDia = foco === hoje ? "Hoje" : d.toLocaleDateString("pt-PT", { weekday: "long" });
  const subDia = d.toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: "numeric" });

  return (
    <EquipaShell largo>
      <div className={styles.calBarra}>
        <div className={styles.calNav}>
          <button className={styles.navBotao} onClick={() => navegar(-1)} aria-label="Anterior">‹</button>
          <button className={styles.hoje} onClick={irHoje}>Hoje</button>
          <button className={styles.navBotao} onClick={() => navegar(1)} aria-label="Seguinte">›</button>
        </div>
        <div className={styles.calTituloBloco}>
          <h1 className={styles.calTitulo}>{vista === "dia" ? tituloDia : tituloCal}</h1>
          {vista === "dia" && <span className={styles.calSub}>{subDia}</span>}
        </div>
        <div className={styles.vistas3} role="tablist" aria-label="Vista da agenda">
          {VISTAS.map((v) => (
            <button
              key={v.id}
              role="tab"
              aria-selected={vista === v.id}
              className={`${styles.vistaBotao} ${vista === v.id ? styles.vistaOn : ""}`}
              onClick={() => mudarVista(v.id)}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {erro && <div className={styles.erro} role="alert">{erro}</div>}

      {vista === "dia" ? (
        <section className={styles.diaColuna}>
          <p className={styles.resumo}>
            {linha.total === 0
              ? "Sem cortes marcados"
              : `${linha.total} ${linha.total === 1 ? "corte" : "cortes"}${foco === hoje ? ` · ${linha.feitos} feito${linha.feitos === 1 ? "" : "s"}` : ""}`}
          </p>

          {linha.total === 0 && !mostrarCanc ? (
            <div className={styles.vazio}>Dia livre. Quando alguém marcar, aparece aqui.</div>
          ) : (
            <div className={styles.timeline}>
              {linha.itens.map((it, i) =>
                it.tipo === "livre" ? (
                  <div key={`l${i}`} className={styles.livre}>
                    Livre {hhmm(it.de)} – {hhmm(it.ate)}
                  </div>
                ) : (
                  <Cartao
                    key={it.m.id}
                    m={it.m}
                    proxima={linha.proxima === it.m.id}
                    abrir={() => {
                      setACancelar(false);
                      setAberta(it.m);
                    }}
                  />
                )
              )}
            </div>
          )}
        </section>
      ) : (
        <div className={`${styles.calendario} ${vista === "dayGridMonth" ? styles.mes : styles.vistaSemana}`}>
          <FullCalendar
            key={vista}
            ref={calRef}
            plugins={PLUGINS}
            locales={[ptLocale]}
            locale="pt"
            initialView={vista}
            initialDate={foco}
            headerToolbar={false}
            firstDay={1}
            hiddenDays={[0, 1]} /* fechado ao domingo e à segunda */
            allDaySlot={false}
            nowIndicator
            slotMinTime="10:00:00"
            slotMaxTime="19:00:00"
            slotDuration="00:30:00"
            slotLabelInterval="01:00"
            slotLabelFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
            eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
            dayHeaderFormat={{ weekday: "short", day: "numeric" }}
            height="auto"
            expandRows
            events={buscar}
            datesSet={(arg) => setTituloCal(arg.view.title)}
            dateClick={(info) => {
              setFoco(chave(info.date));
              setVista("dia");
            }}
            eventClick={(info) => {
              setACancelar(false);
              setAberta(info.event.extendedProps.m);
            }}
            eventContent={(arg) => {
              const m = arg.event.extendedProps.m;
              return (
                <div className={styles.ev}>
                  <b>{arg.timeText.split(" ")[0]}</b> {m.cliente?.nome}
                </div>
              );
            }}
            dayCellContent={(arg) => {
              const n = contagens[chave(arg.date)] || 0;
              return (
                <span className={styles.diaMes}>
                  {arg.dayNumberText}
                  {n > 0 && <b className={styles.contagem}>{n}</b>}
                </span>
              );
            }}
          />
        </div>
      )}

      {linha.canceladas > 0 && vista === "dia" && (
        <button className={styles.linkCanc} onClick={() => setMostrarCanc((v) => !v)}>
          {mostrarCanc ? "Esconder canceladas" : `Mostrar ${linha.canceladas} cancelada${linha.canceladas === 1 ? "" : "s"}`}
        </button>
      )}

      {aberta && (
        <div className={styles.fundoModal} onClick={() => setAberta(null)}>
          <div className={styles.modal} role="dialog" aria-modal="true" aria-label="Marcação" onClick={(e) => e.stopPropagation()}>
            <button className={styles.fechar} onClick={() => setAberta(null)} aria-label="Fechar">×</button>
            <div className={styles.modalHora}>
              {aberta.horaInicio}–{aberta.horaFim}
              <span>
                {new Date(aberta.data).toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })}
              </span>
            </div>
            <div className={styles.cliente}>
              {aberta.cliente?.nome}
              <span className={`${styles.etiquetaEstado} ${(ESTADOS[aberta.status] || ESTADOS.CONFIRMADO).classe}`}>
                {(ESTADOS[aberta.status] || ESTADOS.CONFIRMADO).texto}
              </span>
            </div>
            <div className={styles.servicoNome}>{aberta.servico?.titulo}</div>
            {aberta.cliente?.telefone && !aberta.cliente.telefone.startsWith("sem-tel-") && (
              <a className={styles.telefone} href={`tel:${aberta.cliente.telefone.replace(/\s/g, "")}`}>
                {aberta.cliente.telefone}
              </a>
            )}
            {(aberta.observacoes || aberta.cliente?.observacoes) && (
              <div className={styles.nota}>{aberta.observacoes || aberta.cliente.observacoes}</div>
            )}

            {aberta.status !== "CANCELADO" && (
              <div className={styles.acoes}>
                {aberta.status === "CONCLUIDO" ? (
                  <button className={styles.acao} disabled={ocupado} onClick={() => mudarEstado("CONFIRMADO")}>Reabrir</button>
                ) : (
                  <button className={`${styles.acao} ${styles.acaoOuro}`} disabled={ocupado} onClick={() => mudarEstado("CONCLUIDO")}>Concluir</button>
                )}
                {aCancelar ? (
                  <button className={`${styles.acao} ${styles.acaoPerigo}`} disabled={ocupado} onClick={() => mudarEstado("CANCELADO")}>
                    Confirmar cancelamento
                  </button>
                ) : (
                  <button className={`${styles.acao} ${styles.acaoPerigo}`} onClick={() => setACancelar(true)}>Cancelar</button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </EquipaShell>
  );
}

// Um corte: hora, nome, serviço e telefone. O "a seguir" fica em destaque; os feitos ficam apagados.
function Cartao({ m, proxima, abrir }) {
  const cancelada = m.status === "CANCELADO";
  const feita = m.status === "CONCLUIDO";
  const duracao = minutos(m.horaFim) - minutos(m.horaInicio);
  return (
    <button
      type="button"
      onClick={abrir}
      className={`${styles.corte} ${proxima ? styles.corteProximo : ""} ${feita ? styles.corteFeito : ""} ${cancelada ? styles.corteCancelado : ""}`}
    >
      <span className={styles.corteHora}>
        {m.horaInicio}
        <small>{formatarDuracao(duracao)}</small>
      </span>
      <span className={styles.corteInfo}>
        {proxima && <em className={styles.aSeguir}>A seguir</em>}
        <strong>{m.cliente?.nome}</strong>
        <span className={styles.corteServico}>{m.servico?.titulo}</span>
        {(m.observacoes || m.cliente?.observacoes) && <span className={styles.corteNota}>Tem nota</span>}
      </span>
      <span className={styles.corteEstado}>
        {feita ? "✓" : cancelada ? "✕" : ""}
      </span>
    </button>
  );
}

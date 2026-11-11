"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "../equipa.module.css";
import EquipaShell from "../EquipaShell";
import { formatarDuracao } from "../../duracao";

const hojeChave = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

async function pedir(url, opcoes) {
  const res = await fetch(url, { ...opcoes, headers: { "Content-Type": "application/json" } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Ocorreu um erro.");
  return data;
}

const VAZIO = { nome: "", telefone: "", email: "", observacoes: "" };

export default function NovaMarcacaoPage() {
  const { status } = useSession();
  const router = useRouter();
  const [servicos, setServicos] = useState([]);
  const [escolhidos, setEscolhidos] = useState([]);
  const [data, setData] = useState(hojeChave());
  const [horas, setHoras] = useState(null); // null = a carregar
  const [hora, setHora] = useState("");
  const [cliente, setCliente] = useState(VAZIO);
  const [erro, setErro] = useState("");
  const [aGuardar, setAGuardar] = useState(false);
  const [feito, setFeito] = useState(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/equipa/login");
  }, [status, router]);

  useEffect(() => {
    fetch("/api/servicos")
      .then((r) => r.json())
      .then((d) => setServicos(d.servicos || []))
      .catch(() => setErro("Não foi possível carregar os serviços."));
  }, []);

  // Sempre que muda o serviço ou o dia, pede ao servidor as horas realmente livres (as mesmas que os clientes veem).
  useEffect(() => {
    setHora("");
    if (escolhidos.length === 0 || !data) {
      setHoras([]);
      return;
    }
    let cancelado = false;
    setHoras(null);
    pedir("/api/disponibilidade/horas", {
      method: "POST",
      body: JSON.stringify({ servicos: escolhidos.map((servicoId) => ({ servicoId })), data }),
    })
      .then((d) => !cancelado && setHoras(d.slots || []))
      .catch((e) => {
        if (cancelado) return;
        setHoras([]);
        setErro(e.message);
      });
    return () => {
      cancelado = true;
    };
  }, [escolhidos, data]);

  const total = useMemo(
    () => servicos.filter((s) => escolhidos.includes(s.id)).reduce((t, s) => t + Number(s.preco), 0),
    [servicos, escolhidos]
  );

  function alternar(id) {
    setErro("");
    setEscolhidos((atual) => (atual.includes(id) ? atual.filter((x) => x !== id) : atual.length >= 3 ? atual : [...atual, id]));
  }

  async function guardar(e) {
    e.preventDefault();
    setErro("");
    setAGuardar(true);
    try {
      const r = await pedir("/api/equipa/agendamentos", {
        method: "POST",
        body: JSON.stringify({
          cliente: { ...cliente, telefone: cliente.telefone.trim() },
          servicos: escolhidos.map((servicoId) => ({ servicoId })),
          data,
          horaInicio: hora,
        }),
      });
      setFeito({ data: r.data, hora: r.horaInicio, nome: cliente.nome });
    } catch (err) {
      setErro(err.message);
      // A hora pode ter sido ocupada entretanto: volta a pedir as livres.
      setHora("");
      setEscolhidos((a) => [...a]);
    } finally {
      setAGuardar(false);
    }
  }

  function outra() {
    setFeito(null);
    setCliente(VAZIO);
    setEscolhidos([]);
    setHora("");
    setHoras([]);
  }

  if (status === "loading" || status === "unauthenticated") return null;

  if (feito) {
    return (
      <EquipaShell>
        <div className={styles.novaFeito}>
          <div className={styles.novaFeitoIcone} aria-hidden="true">✓</div>
          <h1 className={styles.novaTitulo}>Hora ocupada</h1>
          <p className={styles.novaTexto}>
            <strong>{feito.nome}</strong> ficou marcado a {new Date(`${feito.data}T00:00:00`).toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" })} às {feito.hora}.
            Esta hora já não aparece aos clientes no site.
          </p>
          <div className={styles.acoes}>
            <button type="button" className={`${styles.acao} ${styles.acaoOuro}`} onClick={outra}>Marcar outro corte</button>
            <Link href="/equipa" className={styles.acao}>Ver agenda</Link>
          </div>
        </div>
      </EquipaShell>
    );
  }

  const pronto = escolhidos.length > 0 && hora && cliente.nome.trim().length >= 2;

  return (
    <EquipaShell>
      <h1 className={styles.novaTitulo}>Nova marcação</h1>
      <p className={styles.novaTexto}>
        Para cortes pedidos por Instagram ou WhatsApp. A hora fica ocupada e deixa de aparecer aos clientes no site.
      </p>

      {erro && <div className={styles.erro} role="alert">{erro}</div>}

      <form className={styles.novaForm} onSubmit={guardar}>
        <fieldset className={styles.novaBloco}>
          <legend>1. Serviço</legend>
          <div className={styles.novaServicos}>
            {servicos.map((s) => {
              const on = escolhidos.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={on}
                  className={`${styles.novaServico} ${on ? styles.novaServicoOn : ""}`}
                  onClick={() => alternar(s.id)}
                >
                  <span>{s.titulo}</span>
                  <small>{Number(s.preco)}€ · {formatarDuracao(s.duracaoMinutos)}</small>
                </button>
              );
            })}
          </div>
          {escolhidos.length > 0 && <p className={styles.novaTotal}>Total: {total}€</p>}
        </fieldset>

        <fieldset className={styles.novaBloco}>
          <legend>2. Dia e hora</legend>
          <div className={styles.campo}>
            <label htmlFor="nova-data">Dia</label>
            <input id="nova-data" type="date" min={hojeChave()} value={data} onChange={(e) => setData(e.target.value)} required />
          </div>
          {escolhidos.length === 0 ? (
            <p className={styles.novaDica}>Escolhe primeiro o serviço para ver as horas livres.</p>
          ) : horas === null ? (
            <p className={styles.novaDica}>A ver as horas livres…</p>
          ) : horas.length === 0 ? (
            <p className={styles.novaDica}>Sem horas livres neste dia (fechado ou tudo ocupado). Experimenta outro dia.</p>
          ) : (
            <div className={styles.novaHoras} role="group" aria-label="Horas livres">
              {horas.map((h) => (
                <button
                  key={h}
                  type="button"
                  aria-pressed={hora === h}
                  className={`${styles.novaHora} ${hora === h ? styles.novaHoraOn : ""}`}
                  onClick={() => setHora(h)}
                >
                  {h}
                </button>
              ))}
            </div>
          )}
        </fieldset>

        <fieldset className={styles.novaBloco}>
          <legend>3. Cliente</legend>
          <div className={styles.campo}>
            <label htmlFor="nova-nome">Nome</label>
            <input id="nova-nome" value={cliente.nome} onChange={(e) => setCliente({ ...cliente, nome: e.target.value })} required minLength={2} maxLength={120} autoComplete="off" />
          </div>
          <div className={styles.campo}>
            <label htmlFor="nova-tel">Telefone (opcional)</label>
            <input id="nova-tel" type="tel" inputMode="tel" value={cliente.telefone} onChange={(e) => setCliente({ ...cliente, telefone: e.target.value })} placeholder="912 345 678" autoComplete="off" />
          </div>
          <div className={styles.campo}>
            <label htmlFor="nova-email">Email (opcional, recebe confirmação)</label>
            <input id="nova-email" type="email" value={cliente.email} onChange={(e) => setCliente({ ...cliente, email: e.target.value })} autoComplete="off" />
          </div>
          <div className={styles.campo}>
            <label htmlFor="nova-obs">Nota (opcional)</label>
            <input id="nova-obs" value={cliente.observacoes} onChange={(e) => setCliente({ ...cliente, observacoes: e.target.value })} maxLength={500} placeholder="Ex.: marcou pelo Instagram" autoComplete="off" />
          </div>
        </fieldset>

        <button type="submit" className={styles.botao} disabled={!pronto || aGuardar}>
          {aGuardar ? "A guardar…" : "Ocupar esta hora"}
        </button>
      </form>
    </EquipaShell>
  );
}

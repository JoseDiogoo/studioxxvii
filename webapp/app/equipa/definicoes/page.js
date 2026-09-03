"use client";

import { Suspense, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "../equipa.module.css";
import EquipaShell from "../EquipaShell";

async function fetchJSON(url, options) {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Ocorreu um erro.");
  return data;
}

export default function DefinicoesPage() {
  return (
    <Suspense fallback={null}>
      <DefinicoesConteudo />
    </Suspense>
  );
}

function DefinicoesConteudo() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [perfil, setPerfil] = useState(null);
  const [erro, setErro] = useState("");
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/equipa/login");
  }, [status, router]);

  useEffect(() => {
    fetchJSON("/api/equipa/perfil").then(setPerfil).catch((e) => setErro(e.message));
  }, [searchParams]);

  async function desligarGoogle() {
    try {
      await fetchJSON("/api/equipa/perfil", { method: "DELETE" });
      setPerfil((p) => ({ ...p, googleConectado: false }));
    } catch (e) {
      setErro(e.message);
    }
  }

  function copiarLink() {
    if (!perfil?.icsUrl) return;
    navigator.clipboard?.writeText(perfil.icsUrl).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  }

  if (status === "loading" || status === "unauthenticated" || !perfil) return null;

  const avisoGoogle = searchParams.get("google");

  return (
    <EquipaShell largura="760px">
      <div className={styles.paginaCabecalho}>
        <div>
          <div className={styles.paginaTitulo}>Definições</div>
          <div className={styles.paginaSub}>Sincronização de calendário e integrações.</div>
        </div>
      </div>

      <div className={styles.painel}>
        {erro && <div className={styles.erro}>{erro}</div>}
        {avisoGoogle === "erro" && (
          <div className={styles.erro}>Não foi possível ligar à Google. Tenta novamente.</div>
        )}
        {avisoGoogle === "ligado" && (
          <div className={styles.detalheLinha} style={{ color: "#2f7a3f" }}>
            Conta Google ligada com sucesso.
          </div>
        )}

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: "1.05rem", marginBottom: 8 }}>Google Calendar</h2>
          <p className={styles.detalheValor} style={{ marginBottom: 12 }}>
            Liga a tua conta Google para as marcações aparecerem automaticamente no Google
            Calendar do teu telemóvel, em tempo real. A edição continua a ser sempre feita aqui;
            o Google Calendar é só espelho.
          </p>
          {perfil.googleDisponivel ? (
            perfil.googleConectado ? (
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <span style={{ color: "#2f7a3f", fontWeight: 600 }}>✓ Ligado</span>
                <button className={styles.sair} style={{ color: "#9b3232", borderColor: "#9b3232" }} onClick={desligarGoogle}>
                  Desligar
                </button>
              </div>
            ) : (
              <a href="/api/equipa/google/conectar" className={styles.botao} style={{ display: "inline-block", textDecoration: "none", width: "auto" }}>
                Ligar ao Google Calendar
              </a>
            )
          ) : (
            <p className={styles.detalheLabel}>Ainda não configurado pelo administrador do servidor.</p>
          )}
        </section>

        <section>
          <h2 style={{ fontSize: "1.05rem", marginBottom: 8 }}>Feed de calendário (alternativa sem login Google)</h2>
          <p className={styles.detalheValor} style={{ marginBottom: 12 }}>
            Podes também subscrever este link em qualquer app de calendário (Google, Apple,
            Outlook). Atualiza-se automaticamente, mas pode demorar algumas horas a refletir
            alterações — usa o Google Calendar acima para tempo real.
          </p>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <code style={{ background: "#eceef1", padding: "8px 10px", borderRadius: 8, fontSize: "0.8rem", wordBreak: "break-all" }}>
              {perfil.icsUrl}
            </code>
            <button className={styles.sair} onClick={copiarLink}>{copiado ? "Copiado!" : "Copiar"}</button>
          </div>
        </section>
      </div>
    </EquipaShell>
  );
}

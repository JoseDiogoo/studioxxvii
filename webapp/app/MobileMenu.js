"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./home.module.css";

const LINKS = [
  { href: "#sobre", label: "Sobre" },
  { href: "#servicos", label: "Serviços" },
  { href: "#galeria", label: "Galeria" },
  { href: "#localizacao", label: "Localização" },
  { href: "/faq", label: "Perguntas Frequentes" },
];

export default function MobileMenu() {
  const [aberto, setAberto] = useState(false);

  return (
    <div className={styles.mobileMenuWrap}>
      <button
        type="button"
        className={styles.mobileMenuBotao}
        aria-label={aberto ? "Fechar menu" : "Abrir menu"}
        aria-expanded={aberto}
        aria-controls="mobile-menu-painel"
        onClick={() => setAberto((v) => !v)}
      >
        <span className={aberto ? styles.iconeFechar : styles.iconeAbrir} />
      </button>

      {aberto && (
        <div id="mobile-menu-painel" className={styles.mobileMenuPainel}>
          <ul>
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} onClick={() => setAberto(false)}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/marcar" className={styles.botaoOuro} onClick={() => setAberto(false)}>
            Marcar horário
          </Link>
        </div>
      )}
    </div>
  );
}

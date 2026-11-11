"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./equipa.module.css";

const TABS = [
  { href: "/equipa", label: "Agenda", ativo: (p) => p === "/equipa" },
  { href: "/equipa/historico", label: "Histórico", ativo: (p) => p.startsWith("/equipa/historico") },
];

export default function EquipaShell({ children, largo = false }) {
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    <div className={`${styles.pagina} ${largo ? styles.paginaLarga : ""}`}>
      <header className={styles.topo}>
        <div className={styles.topoLinha}>
          <Link href="/equipa" className={styles.marca}>STUDIO <em>XXVII</em></Link>
          <div className={styles.utilizador}>
            <span>{session?.user?.name}</span>
            <button className={styles.sair} onClick={() => signOut({ callbackUrl: "/equipa/login" })}>
              Sair
            </button>
          </div>
        </div>
        <nav className={styles.tabs} aria-label="Área da equipa">
          {TABS.map((t) => (
            <Link key={t.href} href={t.href} className={`${styles.tab} ${t.ativo(pathname) ? styles.tabAtiva : ""}`}>
              {t.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className={`${styles.conteudo} ${largo ? styles.conteudoLargo : ""}`}>{children}</main>
    </div>
  );
}

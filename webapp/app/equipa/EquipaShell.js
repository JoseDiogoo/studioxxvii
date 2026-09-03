"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./equipa.module.css";
import LogoBadge from "../LogoBadge";

const NAV = [
  { href: "/equipa", label: "Calendário", icon: "📅", match: (p) => p === "/equipa" },
  { href: "/equipa/dashboard", label: "Dashboard", icon: "📊", match: (p) => p.startsWith("/equipa/dashboard") },
  { href: "/equipa/historico", label: "Histórico", icon: "🕘", match: (p) => p.startsWith("/equipa/historico") },
  { href: "/equipa/definicoes", label: "Definições", icon: "⚙️", match: (p) => p.startsWith("/equipa/definicoes") },
];

export default function EquipaShell({ children, largura }) {
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    <div className={styles.shellDash}>
      <aside className={styles.sidebar}>
        <Link href="/equipa" className={styles.sidebarMarca}>
          <LogoBadge size={36} />
          <span className={styles.sidebarMarcaTexto}>STUDIO XXVII</span>
        </Link>

        <nav className={styles.sidebarNav}>
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${item.match(pathname) ? styles.navItemAtivo : ""}`}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarRodape}>
          <div className={styles.sidebarUtilizador}>
            <span className={styles.sidebarUtilizadorAvatar}>
              {session?.user?.name?.charAt(0)?.toUpperCase() || "?"}
            </span>
            <span className={styles.sidebarUtilizadorNome}>{session?.user?.name}</span>
          </div>
          <button className={styles.sair} onClick={() => signOut({ callbackUrl: "/equipa/login" })}>
            Sair
          </button>
        </div>
      </aside>

      <main className={styles.main} style={largura ? { maxWidth: largura } : undefined}>
        {children}
      </main>
    </div>
  );
}

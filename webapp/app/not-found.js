import Link from "next/link";
import LogoBadge from "./LogoBadge";
import SiteFooter from "./SiteFooter";
import styles from "./not-found.module.css";

export const metadata = {
  title: "Página não encontrada",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className={styles.pagina}>
      <div className={styles.conteudo}>
        <div className={styles.badge}>
          <LogoBadge size={64} />
        </div>
        <h1 className={styles.titulo}>Página não encontrada</h1>
        <p className={styles.texto}>
          O link que seguiste pode estar errado ou a página foi movida.
        </p>
        <div className={styles.botoes}>
          <Link href="/" className={styles.botaoOuro}>Voltar ao início</Link>
          <Link href="/marcar" className={styles.botaoContorno}>Marcar horário</Link>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}

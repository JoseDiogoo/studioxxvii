import Link from "next/link";
import styles from "./home.module.css";

// Só o que a lei exige ao cliente: Livro de Reclamações Eletrónico (DL 156/2005) e informação RGPD (política de privacidade).
export default function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerLinks}>
        <a href="https://www.instagram.com/studio__xxvii/" target="_blank" rel="noreferrer">Instagram</a>
        <Link href="/politica-privacidade">Política de Privacidade</Link>
        <a href="https://www.livroreclamacoes.pt/Inicio/" target="_blank" rel="noreferrer">Livro de Reclamações</a>
      </div>
      <span>© {new Date().getFullYear()} Studio XXVII</span>
    </footer>
  );
}

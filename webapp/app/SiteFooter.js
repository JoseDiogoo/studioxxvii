import Link from "next/link";
import LogoBadge from "./LogoBadge";
import styles from "./home.module.css";

const MORADA = "R. Prof. Eng. Joaquim Vieira Natividade, Alcobaça";

export default function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerTopo}>
        <div>
          <div className={styles.footerMarca}>
            <LogoBadge size={40} />
            <span className={styles.footerMarcaTexto}>STUDIO XXVII</span>
          </div>
          <p className={styles.footerDesc}>
            Barbearia em Alcobaça. Cortes, barba e grooming de assinatura,
            numa experiência pensada ao pormenor.
          </p>
        </div>
        <div className={styles.footerColuna}>
          <h4>Navegação</h4>
          <ul>
            <li><Link href="/#sobre">Sobre</Link></li>
            <li><Link href="/#servicos">Serviços</Link></li>
            <li><Link href="/#galeria">Galeria</Link></li>
            <li><Link href="/marcar">Marcar horário</Link></li>
          </ul>
        </div>
        <div className={styles.footerColuna}>
          <h4>Contactos</h4>
          <ul>
            <li>{MORADA}</li>
            <li>Terça a Sábado · 10h–19h</li>
            <li><a href="https://www.instagram.com/studio__xxvii/" target="_blank" rel="noreferrer">Instagram</a></li>
          </ul>
        </div>
        <div className={styles.footerColuna}>
          <h4>Legal</h4>
          <ul>
            <li><Link href="/politica-privacidade">Política de Privacidade</Link></li>
            <li><Link href="/termos-condicoes">Termos e Condições</Link></li>
            <li>
              <a href="https://www.livroreclamacoes.pt/Inicio/" target="_blank" rel="noreferrer">
                Livro de Reclamações
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className={styles.footerBase}>
        <span>© {new Date().getFullYear()} Studio XXVII. Todos os direitos reservados.</span>
        <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <a
            href="https://www.livroreclamacoes.pt/Inicio/"
            target="_blank"
            rel="noreferrer"
            className={styles.selosLivro}
            title="Livro de Reclamações Eletrónico"
          >
            Livro de Reclamações Eletrónico
          </a>
          <Link href="/equipa/login">Área da equipa</Link>
        </div>
      </div>
    </footer>
  );
}

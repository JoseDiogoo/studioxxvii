import path from "node:path";
import { readdir } from "node:fs/promises";
import Image from "next/image";
import Link from "next/link";
import SiteFooter from "./SiteFooter";
import MobileMenu from "./MobileMenu";
import { postgresDb } from "@/infrastructure/database/postgres";
import styles from "./home.module.css";

// Preços e durações vêm da BD (fonte única). Se a BD falhar, o site continua a mostrar isto.
const SERVICOS_FALLBACK = [
  { titulo: "Rapar Cabelo", preco: 10, duracaoMinutos: 30 },
  { titulo: "Corte Criança", preco: 15, duracaoMinutos: 30 },
  { titulo: "Corte Cabelo", preco: 15, duracaoMinutos: 30 },
  { titulo: "Corte + Lavagem", preco: 18, duracaoMinutos: 40 },
  { titulo: "Corte + Barba", preco: 20, duracaoMinutos: 45 },
  { titulo: "Corte + Barba + Lavagem", preco: 23, duracaoMinutos: 55 },
  { titulo: "Black Mask", preco: 10, duracaoMinutos: 20 },
  { titulo: "Pack 27", preco: 30, duracaoMinutos: 75 },
];

// A faixa de fotos lê a pasta public/fotos/galeria: basta largar lá um ficheiro (jpg/png/webp) e ele passa a aparecer.
async function obterFotos() {
  try {
    const ficheiros = await readdir(path.join(process.cwd(), "public", "fotos", "galeria"));
    return ficheiros
      .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
      .sort()
      .map((f) => `/fotos/galeria/${f}`);
  } catch {
    return [];
  }
}

const HORARIO = [
  ["Segunda", null],
  ["Terça", "10h – 19h"],
  ["Quarta", "10h – 19h"],
  ["Quinta", "10h – 19h"],
  ["Sexta", "10h – 19h"],
  ["Sábado", "10h – 19h"],
  ["Domingo", null],
];

const MORADA = "R. Prof. Eng. Joaquim Vieira Natividade, Alcobaça";
const INSTAGRAM = "https://www.instagram.com/studio__xxvii/";
const MAPS_LINK = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(MORADA + ", Portugal")}`;
const MAPA_SRC = `https://www.google.com/maps?q=${encodeURIComponent(MORADA + ", Portugal")}&output=embed`;

export const revalidate = 300;

async function obterServicos() {
  try {
    const lista = await postgresDb.servico.findMany({
      where: { ativo: true },
      orderBy: [{ preco: "asc" }, { titulo: "asc" }],
      select: { titulo: true, preco: true, duracaoMinutos: true },
    });
    return lista.length ? lista.map((s) => ({ ...s, preco: Number(s.preco) })) : SERVICOS_FALLBACK;
  } catch {
    return SERVICOS_FALLBACK;
  }
}

function euros(valor) {
  return valor.toLocaleString("pt-PT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

export default async function Home() {
  const [servicos, fotos] = await Promise.all([obterServicos(), obterFotos()]);

  return (
    <div className={styles.pagina}>
      <header className={styles.header}>
        <Link href="/" className={styles.marca} aria-label="Studio XXVII — início">
          <span className={styles.marcaTexto}>STUDIO <em>XXVII</em></span>
        </Link>
        <nav className={styles.nav} aria-label="Principal">
          <a href="#servicos">Serviços</a>
          <a href="#galeria">Galeria</a>
          <a href="#local">Local</a>
          <a href={INSTAGRAM} target="_blank" rel="noreferrer">Instagram</a>
        </nav>
        <div className={styles.headerDireita}>
          <Link href="/marcar" className={styles.botaoOuro}>Marcar</Link>
          <MobileMenu />
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroQuadro}>
          <div className={styles.heroFoto}>
            <Image
              src="/fotos/jorge-estudio-hd.webp"
              alt="Jorge Fernandes no Studio XXVII"
              fill
              priority
              quality={92}
              sizes="100vw"
            />
          </div>
          <div className={styles.heroVeu} />
          <div className={styles.heroConteudo}>
            <h1 className={styles.heroTitulo}>
              STUDIO
              <span>XXVII</span>
            </h1>
            <div className={styles.heroBotoes}>
              <Link href="/marcar" className={styles.heroCta}>Marcar agora</Link>
              <a href={INSTAGRAM} target="_blank" rel="noreferrer" className={styles.heroVidro}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
                </svg>
                Instagram
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="servicos" className={styles.seccao}>
        <div className={styles.servicosCaixa}>
          <h2 className={styles.servicosTitulo}>Serviços</h2>
          <ul className={styles.servicos}>
            {servicos.map((s) => (
              <li key={s.titulo} className={styles.servico}>
                <span className={styles.servicoNome}>{s.titulo}</span>
                <span className={styles.servicoPreco}>{euros(s.preco)}</span>
              </li>
            ))}
          </ul>
          <Link href="/marcar" className={styles.botaoOuro}>Marcar horário</Link>
        </div>
      </section>

      {/* Velocidade: cada foto demora ~7s a passar (a faixa percorre 2 grupos por volta). */}
      {fotos.length > 0 && (
        <section id="galeria" className={styles.galeriaSeccao} aria-label="Cortes">
          <div className={styles.faixa} style={{ animationDuration: `${fotos.length * 2 * 7}s` }}>
            {[0, 1, 2, 3].map((copia) => (
              <div className={styles.faixaGrupo} key={copia} aria-hidden={copia > 0 ? "true" : undefined}>
                {fotos.map((src) => (
                  <div className={styles.faixaItem} key={src}>
                    <Image src={src} alt={copia === 0 ? "Trabalho do Studio XXVII" : ""} fill quality={90} sizes="(max-width: 700px) 280px, 420px" />
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className={styles.maisTrabalhos}>
            <p className={styles.maisTrabalhosTitulo}>Se quiseres ver mais alguns dos meus trabalhos</p>
            <a href={INSTAGRAM} target="_blank" rel="noreferrer" className={styles.maisTrabalhosBotao}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
              </svg>
              @studio__xxvii
            </a>
          </div>
        </section>
      )}

      <section id="local" className={styles.seccao}>
        <span className={styles.kicker}>Onde estamos</span>
        <h2 className={styles.titulo}>Alcobaça</h2>
        <div className={styles.local}>
          <div className={styles.localCartao}>
            <p className={styles.morada}>{MORADA}</p>
            <ul className={styles.horario}>
              {HORARIO.map(([dia, horas]) => (
                <li key={dia}>
                  <span>{dia}</span>
                  <span className={horas ? "" : styles.fechado}>{horas || "Fechado"}</span>
                </li>
              ))}
            </ul>
            <a href={MAPS_LINK} target="_blank" rel="noreferrer" className={styles.botaoContorno}>
              Abrir no Maps
            </a>
          </div>
          <div className={styles.mapa}>
            <iframe src={MAPA_SRC} loading="lazy" title="Localização do Studio XXVII" />
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

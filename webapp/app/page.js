import Image from "next/image";
import Link from "next/link";
import LogoBadge from "./LogoBadge";
import SiteFooter from "./SiteFooter";
import MobileMenu from "./MobileMenu";
import ToolsWheel from "./ToolsWheel";
import styles from "./home.module.css";

const SERVICOS = [
  { titulo: "Rapar Cabelo", preco: 10, duracaoMinutos: 20, categoria: "Cabelo" },
  { titulo: "Corte Criança", preco: 13, duracaoMinutos: 30, categoria: "Cabelo" },
  { titulo: "Corte Cabelo", preco: 15, duracaoMinutos: 30, categoria: "Cabelo" },
  { titulo: "Corte + Lavagem", preco: 17, duracaoMinutos: 40, categoria: "Combos" },
  { titulo: "Corte + Barba", preco: 22, duracaoMinutos: 45, categoria: "Combos" },
  { titulo: "Rapar + Barba", preco: 18, duracaoMinutos: 40, categoria: "Combos" },
  { titulo: "Corte + Barba + Lavagem", preco: 24, duracaoMinutos: 55, categoria: "Combos" },
  { titulo: "Corte + Sobrancelha", preco: 16, duracaoMinutos: 30, categoria: "Combos" },
];

const CATEGORIAS_SERVICOS = ["Cabelo", "Combos"];

function formatarEuros(valor) {
  return valor.toLocaleString("pt-PT", { style: "currency", currency: "EUR" });
}

const MORADA = "R. Prof. Eng. Joaquim Vieira Natividade, Alcobaça";
const MAPA_SRC = `https://www.google.com/maps?q=${encodeURIComponent(MORADA + ", Portugal")}&output=embed`;

export default function Home() {
  return (
    <div className={styles.pagina}>
      <Cabecalho />
      <Hero />
      <FaixaInfo />
      <Sobre />
      <Servicos />
      <Galeria />
      <Localizacao />
      <CtaFinal />
      <SiteFooter />
    </div>
  );
}

function Cabecalho() {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.marca}>
        <LogoBadge size={40} />
        <span className={styles.marcaTexto}>STUDIO XXVII</span>
      </Link>
      <ul className={styles.navLinks}>
        <li><a href="#sobre">Sobre</a></li>
        <li><a href="#servicos">Serviços</a></li>
        <li><a href="#galeria">Galeria</a></li>
        <li><a href="#localizacao">Localização</a></li>
      </ul>
      <div className={styles.headerDireita}>
        <Link href="/marcar" className={styles.botaoOuro}>Marcar horário</Link>
        <MobileMenu />
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.heroFundo}>
        <Image src="/fotos/interior-teto.png" alt="" fill priority sizes="100vw" />
      </div>
      <div className={styles.heroConteudo}>
        <div className={styles.heroBadge}>
          <ToolsWheel size={300}>
            <LogoBadge size={130} />
          </ToolsWheel>
        </div>
        <span className={styles.heroKicker}>Barbearia · Alcobaça</span>
        <h1 className={styles.heroTitulo}>
          Born to be <em>different</em>
        </h1>
        <p className={styles.heroSub}>
          Cortes de precisão, barba de assinatura e um ritual de grooming pensado
          ao pormenor. Bem-vindo ao teu novo lugar de confiança em Alcobaça.
        </p>
        <div className={styles.heroBotoes}>
          <Link href="/marcar" className={styles.botaoOuro}>Marcar horário</Link>
          <a href="#servicos" className={styles.botaoContorno}>Ver serviços</a>
        </div>
        <div className={styles.heroMeta}>
          <span><strong>Terça a Sábado</strong> · 10h–19h</span>
          <span>{MORADA}</span>
        </div>
      </div>
    </section>
  );
}

function FaixaInfo() {
  return (
    <div className={styles.faixa}>
      <div className={styles.faixaItem}>
        <span className={styles.faixaLabel}>Horário</span>
        <span className={styles.faixaValor}>Terça a Sábado, 10h–19h</span>
      </div>
      <div className={styles.faixaItem}>
        <span className={styles.faixaLabel}>Morada</span>
        <span className={styles.faixaValor}>Alcobaça</span>
      </div>
      <div className={styles.faixaItem}>
        <span className={styles.faixaLabel}>Marcações</span>
        <span className={styles.faixaValor}>100% online</span>
      </div>
    </div>
  );
}

function Sobre() {
  return (
    <section id="sobre" className={styles.seccao}>
      <div className={styles.sobre}>
        <div className={styles.sobreImagem}>
          <Image src="/fotos/interior-cadeira.png" alt="Interior do Studio XXVII" fill sizes="(max-width: 860px) 100vw, 45vw" />
          <div className={styles.sobreMoldura} />
        </div>
        <div className={styles.sobreTexto}>
          <span className={styles.kicker}>Sobre nós</span>
          <h2 className={styles.titulo}>Uma barbearia com identidade própria</h2>
          <p className={styles.sobreParagrafo}>
            O Studio XXVII nasceu em Alcobaça com um objetivo simples: elevar o
            momento do corte a uma experiência de verdade. Cada detalhe do
            espaço — da luz à cadeira — foi pensado para que te sintas em casa
            enquanto cuidamos da tua imagem.
          </p>
          <p className={styles.sobreParagrafo}>
            Trabalhamos com técnica apurada e atenção genuína a cada cliente,
            do primeiro corte de criança ao ritual completo de barba. Sem
            pressas, sem fórmulas — só o resultado que procuras.
          </p>
          <p className={styles.sobreAssinatura}>&ldquo;Criando identidades.&rdquo;</p>
          <a href="#galeria" className={styles.botaoContorno} style={{ borderColor: "#d8cfae", color: "#201c17" }}>
            Conhecer o espaço
          </a>
        </div>
      </div>
    </section>
  );
}

function Servicos() {
  return (
    <section id="servicos" className={`${styles.seccao} ${styles.servicos}`}>
      <div className={styles.seccaoCabecalho}>
        <span className={styles.kicker}>Preçário</span>
        <h2 className={styles.titulo}>Serviços</h2>
        <p className={styles.lead}>
          Preços claros, sem surpresas. Escolhe um ou combina vários serviços
          na tua marcação.
        </p>
      </div>
      <div className={styles.servicosGrupos}>
        {CATEGORIAS_SERVICOS.map((categoria) => (
          <div key={categoria} className={styles.servicoGrupo}>
            <span className={styles.servicoGrupoLabel}>{categoria}</span>
            <div className={styles.listaServicos}>
              {SERVICOS.filter((s) => s.categoria === categoria).map((s) => (
                <div key={s.titulo} className={styles.servicoLinha}>
                  <div className={styles.servicoInfo}>
                    <span className={styles.servicoNome}>{s.titulo}</span>
                    <span className={styles.servicoDuracao}>{s.duracaoMinutos} min</span>
                  </div>
                  <span className={styles.servicoPreco}>{formatarEuros(s.preco)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className={styles.servicosCta}>
        <Link href="/marcar" className={styles.botaoOuro}>Marcar horário</Link>
      </div>
    </section>
  );
}

function Galeria() {
  return (
    <section id="galeria" className={styles.seccao}>
      <div className={styles.seccaoCabecalho}>
        <span className={styles.kicker}>Galeria</span>
        <h2 className={styles.titulo}>O nosso espaço</h2>
        <p className={styles.lead}>Um vislumbre do Studio XXVII, tal como o vais encontrar.</p>
      </div>
      <div className={styles.galeriaGrid}>
        <div className={`${styles.galeriaItem} ${styles.galeriaGrande}`}>
          <Image src="/fotos/interior-cadeira.png" alt="Cadeira do Studio XXVII" fill sizes="(max-width: 760px) 100vw, 50vw" />
        </div>
        <div className={styles.galeriaItem}>
          <Image src="/fotos/servico-barba.png" alt="Serviço de barba no Studio XXVII" fill sizes="25vw" />
        </div>
        <div className={styles.galeriaItem}>
          <Image src="/fotos/exterior-loja.png" alt="Fachada do Studio XXVII" fill sizes="25vw" />
        </div>
        <div className={`${styles.galeriaItem} ${styles.galeriaMarca}`}>
          <LogoBadge size={64} />
          <span>&ldquo;Não é só sobre o corte.&rdquo;</span>
        </div>
        <div className={styles.galeriaItem}>
          <Image src="/fotos/interior-teto.png" alt="Interior do Studio XXVII" fill sizes="25vw" />
        </div>
      </div>
    </section>
  );
}

function Localizacao() {
  return (
    <section id="localizacao" className={styles.seccao}>
      <div className={styles.localizacao}>
        <div className={styles.localTexto}>
          <span className={styles.kicker}>Encontra-nos</span>
          <h2 className={styles.titulo}>Onde estamos</h2>

          <div className={styles.horarioTabela}>
            <div className={styles.horarioLinha}>
              <strong>Terça a Sábado</strong>
              <span>10h00 – 19h00</span>
            </div>
            <div className={styles.horarioLinha}>
              <strong>Domingo e Segunda</strong>
              <span className={styles.horarioFechado}>Encerrado</span>
            </div>
          </div>

          <div className={styles.contactosLista}>
            <div><strong>Morada</strong> — {MORADA}</div>
            <div><strong>Marcações</strong> — online, através deste site</div>
            <div><strong>Instagram</strong> — <a href="https://www.instagram.com/studio__xxvii/" target="_blank" rel="noreferrer">@studio__xxvii</a></div>
          </div>

          <Link href="/marcar" className={styles.botaoOuro} style={{ alignSelf: "flex-start" }}>
            Marcar horário
          </Link>
        </div>
        <div className={styles.mapaWrap}>
          <iframe src={MAPA_SRC} loading="lazy" title="Localização do Studio XXVII" />
        </div>
      </div>
    </section>
  );
}

function CtaFinal() {
  return (
    <section className={styles.ctaFinal}>
      <div className={styles.ctaFinalConteudo}>
        <h2 className={styles.titulo}>Pronto para o teu próximo corte?</h2>
        <p className={styles.lead}>
          Reserva o teu horário em menos de um minuto. Sem chamadas, sem espera.
        </p>
        <Link href="/marcar" className={styles.botaoOuro}>Marcar horário</Link>
      </div>
    </section>
  );
}


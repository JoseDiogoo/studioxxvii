import Link from "next/link";
import LegalHeader from "../legal/LegalHeader";
import SiteFooter from "../SiteFooter";
import styles from "../legal/legal.module.css";

export const metadata = {
  title: "Perguntas Frequentes",
  description: "Respostas às perguntas mais comuns sobre marcações, pagamento e horários no Studio XXVII, Alcobaça.",
  alternates: { canonical: "/faq" },
};

const PERGUNTAS = [
  {
    q: "Como faço uma marcação?",
    a: "Entra em /marcar, escolhe um ou mais serviços, o profissional (ou \"sem preferência\"), o dia e a hora disponíveis, confirma os teus dados de contacto e pronto — a marcação fica confirmada de imediato, sem qualquer pagamento nesse momento.",
  },
  {
    q: "Quando é que pago?",
    a: "Sempre na barbearia, no balcão, depois do serviço estar feito. Não pedimos nem cobramos nada no momento da marcação online.",
  },
  {
    q: "Posso pagar com MB Way, cartão ou dinheiro?",
    a: "Sim, aceitamos dinheiro, Multibanco, MB Way e cartão diretamente no balcão, após o serviço.",
  },
  {
    q: "Posso cancelar ou remarcar a minha marcação?",
    a: "Sim. Contacta-nos com a maior antecedência possível através dos meios indicados nos Contactos para cancelares ou pedires um novo horário.",
  },
  {
    q: "E se a barbearia precisar de alterar o meu horário?",
    a: "Avisamos-te assim que possível, tipicamente por WhatsApp, com uma proposta de novo horário.",
  },
  {
    q: "Não tenho preferência por nenhum profissional — o que faço?",
    a: "Ao marcares, escolhe a opção \"sem preferência\" para cada serviço e atribuímos-te automaticamente um profissional disponível nesse horário.",
  },
  {
    q: "Posso marcar mais do que um serviço na mesma visita?",
    a: "Sim — por exemplo, corte + barba na mesma marcação. Basta selecionares os vários serviços antes de escolheres o horário.",
  },
  {
    q: "Fazem corte a crianças?",
    a: "Sim, temos o serviço \"Corte Criança\". Pedimos que um encarregado de educação esteja presente ou contactável durante o serviço.",
  },
  {
    q: "Qual é o vosso horário?",
    a: "Terça a Sábado, das 10h às 19h. Encerramos ao Domingo e Segunda-feira.",
  },
  {
    q: "Onde fica o Studio XXVII?",
    a: "R. Prof. Eng. Joaquim Vieira Natividade, Alcobaça — vê o mapa na página inicial.",
  },
];

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: PERGUNTAS.map((p) => ({
    "@type": "Question",
    name: p.q,
    acceptedAnswer: { "@type": "Answer", text: p.a },
  })),
};

export default function FaqPage() {
  return (
    <div className={styles.pagina}>
      <LegalHeader />
      <div className={styles.conteudo}>
        <h1 className={styles.titulo}>Perguntas Frequentes</h1>
        <p className={styles.atualizado}>Tudo o que precisas de saber antes de marcares.</p>

        <article className={styles.artigo}>
          {PERGUNTAS.map((p) => (
            <div key={p.q}>
              <h2>{p.q}</h2>
              <p>{p.a}</p>
            </div>
          ))}

          <div className={styles.caixa}>
            <strong>Não encontraste a tua resposta?</strong>
            Contacta-nos pelo Instagram <a href="https://www.instagram.com/studio__xxvii/" target="_blank" rel="noreferrer">@studio__xxvii</a>{" "}
            ou passa por lá durante o horário de funcionamento.
          </div>

          <Link href="/marcar" className={styles.voltar} style={{ color: "var(--dourado-escuro)" }}>
            Marcar horário →
          </Link>
        </article>
      </div>
      <SiteFooter />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD).replace(/</g, "\\u003c") }}
      />
    </div>
  );
}

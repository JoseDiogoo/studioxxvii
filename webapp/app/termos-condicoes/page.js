import LegalHeader from "../legal/LegalHeader";
import SiteFooter from "../SiteFooter";
import styles from "../legal/legal.module.css";

export const metadata = {
  title: "Termos e Condições",
  description: "Termos e condições gerais de marcação e prestação de serviços do Studio XXVII.",
  alternates: { canonical: "/termos-condicoes" },
  robots: { index: true, follow: true },
};

export default function TermosCondicoesPage() {
  return (
    <div className={styles.pagina}>
      <LegalHeader />
      <div className={styles.conteudo}>
        <h1 className={styles.titulo}>Termos e Condições</h1>
        <p className={styles.atualizado}>Última atualização: agosto de 2026</p>

        <div className={styles.aviso}>
          Este documento não substitui aconselhamento jurídico. Descreve, em linguagem
          simples, as condições em que o Studio XXVII presta os seus serviços através deste
          site. Ao marcares um horário em <strong>/marcar</strong>, aceitas estas condições.
        </div>

        <div className={styles.indice}>
          <strong>Índice</strong>
          <ol>
            <li><a href="#geral">Disposições gerais</a></li>
            <li><a href="#marcacao">Como funciona a marcação</a></li>
            <li><a href="#precos">Preços e serviços</a></li>
            <li><a href="#pagamento">Pagamento</a></li>
            <li><a href="#cancelamento">Cancelamentos, reagendamento e faltas</a></li>
            <li><a href="#menores">Menores de idade</a></li>
            <li><a href="#responsabilidade">Responsabilidade</a></li>
            <li><a href="#dados">Dados pessoais</a></li>
            <li><a href="#lei">Lei aplicável e resolução de litígios</a></li>
            <li><a href="#contactos">Contactos</a></li>
          </ol>
        </div>

        <article className={styles.artigo}>
          <h2 id="geral">1. Disposições gerais</h2>
          <p>
            O Studio XXVII é uma barbearia com estabelecimento em R. Prof. Eng. Joaquim Vieira
            Natividade, Alcobaça, aberta ao público de Terça a Sábado, das 10h às 19h. Este site
            permite marcar serviços de barbearia online, através da página <strong>/marcar</strong>.
            Ao efetuares uma marcação confirmas que tens capacidade legal para o fazer e que os
            dados que forneces (nome, telefone e, opcionalmente, email) são verdadeiros e
            atualizados.
          </p>

          <h2 id="marcacao">2. Como funciona a marcação</h2>
          <p>O processo de marcação em <strong>/marcar</strong> segue estes passos:</p>
          <ol>
            <li>Escolhes um ou mais serviços;</li>
            <li>Escolhes o profissional (ou &ldquo;sem preferência&rdquo;);</li>
            <li>Escolhes o dia e a hora, de entre os horários disponíveis;</li>
            <li>Confirmas os teus dados de contacto e aceitas os termos;</li>
            <li>Recebes a confirmação imediata da marcação.</li>
          </ol>
          <p>
            A marcação fica associada ao número de telefone indicado. É esse número que
            usamos para te identificar e para te contactar sobre alterações ao horário
            marcado.
          </p>

          <h2 id="precos">3. Preços e serviços</h2>
          <p>
            Os preços apresentados em <strong>/marcar</strong> e na página principal do site
            incluem já os impostos aplicáveis e correspondem ao preçário em vigor no Studio
            XXVII à data da consulta. Reservamo-nos o direito de atualizar preços e a duração
            estimada de cada serviço sem aviso prévio; a marcação já confirmada mantém, no
            entanto, o preço acordado no momento da confirmação.
          </p>

          <h2 id="pagamento">4. Pagamento</h2>
          <p>
            O pagamento é sempre efetuado <strong>presencialmente, no balcão, depois de
            realizado o serviço</strong>. Não é pedido nem cobrado qualquer valor no momento da
            marcação online — esta serve apenas para reservar o teu horário.
          </p>

          <h2 id="cancelamento">5. Cancelamentos, reagendamento e faltas</h2>
          <p>
            Pedimos que avises com a maior antecedência possível caso não possas comparecer a
            uma marcação, para que possamos disponibilizar o horário a outro cliente. Podes
            fazê-lo através dos contactos indicados no final desta página.
          </p>
          <p>
            Se precisarmos de alterar ou cancelar a tua marcação (por exemplo, por
            indisponibilidade do profissional), avisamos-te assim que possível, tipicamente por
            WhatsApp, com o novo horário proposto.
          </p>
          <p>
            Faltas repetidas e não avisadas a marcações confirmadas podem levar-nos a pedir
            confirmação por telefone antes de aceitar marcações futuras do mesmo cliente.
          </p>

          <h2 id="menores">6. Menores de idade</h2>
          <p>
            Serviços prestados a menores de idade (por exemplo, o serviço &ldquo;Corte
            Criança&rdquo;) pressupõem o conhecimento e acompanhamento de um encarregado de
            educação, que deve estar presente ou contactável durante o serviço. A marcação de
            serviços para um menor deve ser feita por um adulto responsável por ele.
          </p>

          <h2 id="responsabilidade">7. Responsabilidade</h2>
          <p>
            Os nossos profissionais aplicam a sua melhor técnica e experiência em cada serviço,
            mas o resultado final pode variar consoante o tipo, densidade e condição do cabelo
            ou pele de cada cliente — imagens de referência partilhadas pelo cliente servem de
            inspiração, não de garantia de resultado idêntico. Pedimos que informes a equipa,
            antes do serviço, de qualquer alergia, sensibilidade cutânea ou condição relevante.
            O Studio XXVII não se responsabiliza por reações a produtos quando essa informação
            não tenha sido previamente comunicada.
          </p>
          <p>
            Não nos responsabilizamos por indisponibilidades do site alheias à nossa vontade
            (por exemplo, falhas de rede ou de fornecedores externos) que impeçam
            temporariamente a marcação online — nesses casos, podes sempre contactar-nos
            diretamente pelos meios habituais.
          </p>

          <h2 id="dados">8. Dados pessoais</h2>
          <p>
            O tratamento dos teus dados pessoais está descrito em detalhe na nossa{" "}
            <a href="/politica-privacidade">Política de Privacidade</a>, que faz parte
            integrante destes termos.
          </p>

          <h2 id="lei">9. Lei aplicável e resolução de litígios</h2>
          <p>
            Estes termos regem-se pela lei portuguesa. Em caso de litígio de consumo que não
            seja possível resolver diretamente connosco, podes recorrer a uma entidade de
            resolução alternativa de litígios de consumo (RAL). Informação atualizada sobre as
            entidades RAL disponíveis está no <a href="https://www.consumidor.gov.pt" target="_blank" rel="noreferrer">Portal do Consumidor</a>.
          </p>
          <p>
            Nos termos legalmente exigidos, disponibilizamos ainda acesso ao{" "}
            <a href="https://www.livroreclamacoes.pt/Inicio/" target="_blank" rel="noreferrer">
              Livro de Reclamações Eletrónico
            </a>, onde podes registar qualquer reclamação relativa à nossa atividade.
          </p>

          <h2 id="contactos">10. Contactos</h2>
          <div className={styles.caixa}>
            <strong>Studio XXVII</strong>
            R. Prof. Eng. Joaquim Vieira Natividade, Alcobaça<br />
            Instagram: <a href="https://www.instagram.com/studio__xxvii/" target="_blank" rel="noreferrer">@studio__xxvii</a><br />
            Terça a Sábado, 10h–19h.
          </div>
        </article>
      </div>
      <SiteFooter />
    </div>
  );
}

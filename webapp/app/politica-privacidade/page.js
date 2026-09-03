import LegalHeader from "../legal/LegalHeader";
import SiteFooter from "../SiteFooter";
import styles from "../legal/legal.module.css";

export const metadata = {
  title: "Política de Privacidade",
  description: "Política de privacidade e proteção de dados pessoais do Studio XXVII.",
  alternates: { canonical: "/politica-privacidade" },
  robots: { index: true, follow: true },
};

export default function PoliticaPrivacidadePage() {
  return (
    <div className={styles.pagina}>
      <LegalHeader />
      <div className={styles.conteudo}>
        <h1 className={styles.titulo}>Política de Privacidade</h1>
        <p className={styles.atualizado}>Última atualização: agosto de 2026</p>

        <div className={styles.indice}>
          <strong>Índice</strong>
          <ol>
            <li><a href="#responsavel">Quem é o responsável pelo tratamento</a></li>
            <li><a href="#dados">Que dados pessoais recolhemos</a></li>
            <li><a href="#finalidades">Para que usamos os teus dados</a></li>
            <li><a href="#fundamento">Fundamento legal</a></li>
            <li><a href="#partilha">Com quem partilhamos os dados</a></li>
            <li><a href="#retencao">Quanto tempo guardamos os dados</a></li>
            <li><a href="#direitos">Os teus direitos</a></li>
            <li><a href="#cookies">Cookies</a></li>
            <li><a href="#seguranca">Segurança</a></li>
            <li><a href="#alteracoes">Alterações a esta política</a></li>
            <li><a href="#contactos">Contactos</a></li>
          </ol>
        </div>

        <article className={styles.artigo}>
          <p>
            Esta política explica, de forma simples e transparente, que dados pessoais o
            Studio XXVII recolhe quando marcas um horário ou visitas este site, para que
            servem e que direitos tens sobre eles. Ao usares o site <strong>studioxxvii.pt</strong>{" "}
            e a página de marcações <strong>/marcar</strong>, aceitas os termos aqui descritos.
          </p>

          <h2 id="responsavel">1. Quem é o responsável pelo tratamento</h2>
          <p>
            O responsável pelo tratamento dos teus dados pessoais é o <strong>Studio XXVII</strong>,
            barbearia com estabelecimento em R. Prof. Eng. Joaquim Vieira Natividade, Alcobaça
            (dados fiscais completos disponíveis mediante pedido). Para qualquer questão
            relacionada com esta política, consulta a secção de <a href="#contactos">Contactos</a> no
            final desta página.
          </p>

          <h2 id="dados">2. Que dados pessoais recolhemos</h2>
          <p>Recolhemos apenas os dados necessários para gerir a tua marcação:</p>
          <ul>
            <li><strong>Nome</strong> — para identificar a marcação e tratar-te pelo nome.</li>
            <li><strong>Telefone</strong> — para confirmar a marcação e avisar de alterações de horário, incluindo por WhatsApp.</li>
            <li><strong>Email</strong> (opcional) — se o indicares, para enviar confirmações ou informação relacionada com a tua marcação.</li>
            <li><strong>Observações</strong> (opcional) — qualquer nota que decidas partilhar sobre o serviço pretendido.</li>
          </ul>
          <p>
            Se tens conta na área da equipa (colaboradores do Studio XXVII), guardamos também
            o teu email profissional e uma password encriptada (nunca em texto simples), para
            acesso à agenda interna.
          </p>

          <h2 id="finalidades">3. Para que usamos os teus dados</h2>
          <ul>
            <li>Criar, confirmar, reagendar ou cancelar a tua marcação;</li>
            <li>Enviar mensagens de confirmação ou aviso de alteração de horário (por WhatsApp ou email, quando aplicável);</li>
            <li>Manter um histórico de marcações para efeitos de gestão interna do negócio (ex.: estatísticas de serviços, faturação);</li>
            <li>Cumprir obrigações legais, nomeadamente fiscais e contabilísticas.</li>
          </ul>
          <p>Não usamos os teus dados para fins de marketing sem o teu consentimento explícito, e não vendemos os teus dados a terceiros.</p>

          <h2 id="fundamento">4. Fundamento legal</h2>
          <p>
            Tratamos os teus dados com base na <strong>execução de um contrato</strong> (a
            marcação que fazes connosco), no cumprimento de <strong>obrigações legais</strong> (por
            exemplo, fiscais) e, em casos pontuais, no nosso <strong>interesse legítimo</strong> em
            gerir e melhorar o serviço prestado — sempre de forma proporcional e sem prejudicar
            os teus direitos e liberdades fundamentais.
          </p>

          <h2 id="partilha">5. Com quem partilhamos os dados</h2>
          <p>
            Os teus dados não são vendidos nem cedidos a terceiros para fins comerciais. Podemos
            partilhar dados estritamente necessários com prestadores de serviços que nos ajudam a
            operar o site e a agenda, agindo em nosso nome e apenas com as instruções que lhes
            damos:
          </p>
          <ul>
            <li><strong>Twilio</strong> — envio de mensagens WhatsApp de confirmação, alteração ou cancelamento de marcações (partilhamos o teu número de telefone e o conteúdo da mensagem).</li>
            <li><strong>Google Calendar</strong> — cada colaborador pode ligar a sua conta Google para sincronizar a sua agenda; nesse caso, o nome do cliente e o serviço marcado ficam também visíveis no calendário Google desse colaborador.</li>
            <li>Fornecedores de alojamento e infraestrutura técnica do site.</li>
          </ul>
          <p>Podemos ainda divulgar dados quando exigido por lei ou por ordem de uma autoridade competente.</p>

          <h2 id="retencao">6. Quanto tempo guardamos os dados</h2>
          <p>
            Guardamos os dados da tua marcação enquanto for necessário para os fins descritos
            acima e, depois disso, pelo período exigido por lei (nomeadamente prazos de
            conservação fiscal e contabilística). Findo esse prazo, os dados são apagados ou
            anonimizados.
          </p>

          <h2 id="direitos">7. Os teus direitos</h2>
          <p>Nos termos do Regulamento Geral de Proteção de Dados (RGPD), tens o direito de:</p>
          <ul>
            <li><strong>Aceder</strong> aos dados pessoais que temos sobre ti;</li>
            <li><strong>Retificar</strong> dados incorretos ou incompletos;</li>
            <li><strong>Apagar</strong> os teus dados, quando deixarem de ser necessários ou não exista obrigação legal de os conservar;</li>
            <li><strong>Limitar</strong> ou <strong>opor-te</strong> ao tratamento em determinadas circunstâncias;</li>
            <li><strong>Portabilidade</strong> — receber os teus dados num formato estruturado e de uso comum;</li>
            <li><strong>Apresentar reclamação</strong> junto da <strong>Comissão Nacional de Proteção de Dados (CNPD)</strong> — Rua de São Bento, 148, 3.º, 1200-821 Lisboa, <a href="https://www.cnpd.pt" target="_blank" rel="noreferrer">www.cnpd.pt</a>.</li>
          </ul>
          <p>Para exercer qualquer um destes direitos, contacta-nos através dos meios indicados em <a href="#contactos">Contactos</a>.</p>

          <h2 id="cookies">8. Cookies</h2>
          <p>
            O site público (página principal e <strong>/marcar</strong>) não utiliza cookies de
            publicidade ou de rastreio de terceiros. Na área reservada da equipa
            (<strong>/equipa</strong>) usamos um cookie de sessão técnico e estritamente
            necessário, para manteres a sessão de login iniciada — este cookie é seguro
            (<em>httpOnly</em>, <em>secure</em>) e não é usado para qualquer outro fim.
          </p>

          <h2 id="seguranca">9. Segurança</h2>
          <p>
            Aplicamos medidas técnicas e organizativas adequadas para proteger os teus dados,
            incluindo passwords encriptadas (nunca guardadas em texto simples), ligação segura
            (HTTPS) e limitação de acesso à informação apenas à equipa que dela necessita para
            gerir as marcações. Ainda assim, nenhuma transmissão pela internet é 100% segura;
            trabalhamos continuamente para reduzir esse risco ao mínimo.
          </p>

          <h2 id="alteracoes">10. Alterações a esta política</h2>
          <p>
            Podemos atualizar esta política pontualmente, por exemplo quando adicionamos uma
            nova funcionalidade ao site. A data no topo desta página indica a versão mais
            recente. Recomendamos que a consultes de vez em quando.
          </p>

          <h2 id="contactos">11. Contactos</h2>
          <div className={styles.caixa}>
            <strong>Studio XXVII</strong>
            R. Prof. Eng. Joaquim Vieira Natividade, Alcobaça<br />
            Instagram: <a href="https://www.instagram.com/studio__xxvii/" target="_blank" rel="noreferrer">@studio__xxvii</a><br />
            Ou presencialmente, durante o horário de funcionamento (Terça a Sábado, 10h–19h).
          </div>
        </article>
      </div>
      <SiteFooter />
    </div>
  );
}

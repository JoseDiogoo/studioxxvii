import LegalHeader from "../legal/LegalHeader";
import SiteFooter from "../SiteFooter";
import styles from "../legal/legal.module.css";

export const metadata = {
  title: "Política de Privacidade",
  description: "Como o Studio XXVII trata os dados pessoais das marcações.",
  alternates: { canonical: "/politica-privacidade" },
};

// Estrutura segundo os artigos 13.º e 14.º do RGPD (Regulamento (UE) 2016/679) e a Lei n.º 58/2019.
export default function PoliticaPrivacidadePage() {
  return (
    <div className={styles.pagina}>
      <LegalHeader />
      <div className={styles.conteudo}>
        <h1 className={styles.titulo}>Política de Privacidade</h1>
        <p className={styles.atualizado}>Última atualização: novembro de 2026</p>

        <article className={styles.artigo}>
          <h2>1. Quem é o responsável</h2>
          <p>
            O responsável pelo tratamento dos teus dados é o <strong>Studio XXVII</strong>, barbearia
            na R. Prof. Eng. Joaquim Vieira Natividade, Alcobaça. Os contactos estão no ponto 8.
          </p>

          <h2>2. Que dados recolhemos e para quê</h2>
          <p>Quando marcas um horário, pedimos:</p>
          <ul>
            <li><strong>Nome e telemóvel</strong> — para registar a marcação e te contactar se for preciso alterá-la.</li>
            <li><strong>Email</strong> (opcional) — para te enviar a confirmação.</li>
            <li><strong>Observações</strong> (opcional) — uma nota sobre o corte. Não incluas dados de saúde ou outros dados sensíveis.</li>
          </ul>
          <p>
            Usamos estes dados apenas para gerir a tua marcação e o histórico de atendimentos.
            Não os usamos para marketing nem os vendemos.
          </p>

          <h2>3. Fundamento legal</h2>
          <p>
            O tratamento é necessário para <strong>executar a marcação</strong> que pediste
            (artigo 6.º, n.º 1, alínea b) do RGPD) e para <strong>cumprir obrigações legais</strong>,
            como as fiscais (alínea c). O email e as observações são fornecidos por ti, de forma voluntária.
          </p>

          <h2>4. Com quem partilhamos</h2>
          <p>
            Só partilhamos o necessário com o prestador que aloja o site e a base de dados, e apenas
            segundo as nossas instruções. Podemos ainda comunicar dados a autoridades quando a lei o exigir.
          </p>

          <h2>5. Quanto tempo guardamos</h2>
          <p>
            Guardamos os dados enquanto forem necessários para a marcação e para o histórico de
            atendimento, e pelo prazo que a lei exigir (por exemplo, o fiscal). Depois são apagados
            ou anonimizados. Podes pedir que os apaguemos antes, se a lei o permitir.
          </p>

          <h2>6. Os teus direitos</h2>
          <p>Tens direito de:</p>
          <ul>
            <li>aceder aos teus dados e pedir a sua retificação;</li>
            <li>pedir o apagamento, a limitação do tratamento ou opor-te a ele;</li>
            <li>receber os teus dados num formato de uso corrente (portabilidade);</li>
            <li>retirar a qualquer momento um consentimento que tenhas dado;</li>
            <li>
              apresentar reclamação à autoridade de controlo, a{" "}
              <a href="https://www.cnpd.pt" target="_blank" rel="noreferrer">Comissão Nacional de Proteção de Dados (CNPD)</a>.
            </li>
          </ul>
          <p>Para exercer estes direitos, usa os contactos do ponto 8.</p>

          <h2>7. Cookies e serviços de terceiros</h2>
          <p>
            O site não usa cookies de publicidade nem de análise. O mapa da página inicial é fornecido
            pela Google (Google Maps) e, ao carregar, a Google pode receber o teu endereço IP e definir
            cookies, segundo a sua própria política. Na área reservada à equipa usamos apenas um cookie
            técnico de sessão, indispensável para o login.
          </p>

          <h2>8. Contactos</h2>
          <div className={styles.caixa}>
            <strong>Studio XXVII</strong>
            R. Prof. Eng. Joaquim Vieira Natividade, Alcobaça<br />
            Instagram: <a href="https://www.instagram.com/studio__xxvii/" target="_blank" rel="noreferrer">@studio__xxvii</a><br />
            Presencialmente: terça a sábado, 10h–19h.
          </div>

          <p>
            Podemos atualizar esta política. A data no topo indica a versão em vigor.
          </p>
        </article>
      </div>
      <SiteFooter />
    </div>
  );
}

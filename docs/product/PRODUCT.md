# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two primary user groups, served by the active product in `webapp/`:

1. **Clientes finais (público)** — pessoas que querem marcar um corte de cabelo/barba na Studio XXVII. Antes deste sistema, a marcação era sempre feita por DM do Instagram; `/marcar` substitui esse fluxo por um percurso self-service (carrinho de serviços → escolher profissional → dia → hora → confirmação).
2. **Colaboradores da barbearia (equipa)** — os barbeiros, que fazem login em `/equipa` para ver e gerir a sua agenda num calendário estilo Google Calendar (arrastar marcações, marcar pago + método de pagamento).

## Product Purpose

Plataforma de marcação e gestão para a Studio XXVII, uma barbearia real em Alcobaça (Portugal). Substitui por completo a marcação manual por Instagram DM por uma marcação pública online, e dá à equipa uma área de administração com calendário arrastável para gerir os agendamentos do dia a dia. Sucesso = clientes conseguem marcar sozinhos em menos de um minuto, e a equipa gere a agenda real sem fricção nem chamadas.

## Positioning

Um sistema de marcação feito à medida do funcionamento real desta barbearia específica (horário, serviços, forma de pagamento), não uma SaaS genérica multi-tenant. `buk.pt` é a referência de estilo/UX para o fluxo público de `/marcar`, mas o produto não é construído para ser revendido a outros negócios.

## Operating Context

- Loja física em Alcobaça, aberta Terça a Sábado, 10h–19h; fechada Domingo e Segunda.
- Antes deste site, 100% das marcações eram por DM no Instagram (`@studio__xxvii`) — esse continua a ser o canal de presença social da marca.
- A equipa trabalha com um calendário estilo Google Calendar em `/equipa`, onde arrasta marcações para outro dia/hora.
- **Pagamento é sempre presencial, depois do corte feito** — nunca antecipado no ato da marcação. Isto foi uma decisão explícita do dono do negócio, que reverteu uma tentativa anterior de pagamento antecipado via MB Way (ifthenpay). Não reintroduzir cobrança antecipada sem pedido direto do dono.
- Integrações externas opcionais, sempre com fallback automático (o produto funciona normalmente sem elas configuradas): sincronização one-way com Google Calendar por colaborador (OAuth), e notificação por WhatsApp (via Twilio) ao cliente quando a equipa reagenda ou cancela uma marcação confirmada.
- Deploy em VPS própria com nginx + systemd (não serverless/Vercel), porque a base de dados PostgreSQL precisa de disco persistente e o dono quer poder abrir o DBeaver e ver/editar a BD diretamente.

## Capabilities and Constraints

- Stack (já decidida, não greenfield): Next.js App Router em JavaScript, Prisma + PostgreSQL, autenticação NextAuth (Credentials, password com bcrypt), FullCalendar para o calendário arrastável de `/equipa`.
- Salão único (Studio XXVII) por agora. O modelo de dados já prevê múltiplos salões no futuro, mas isso não é um requisito do produto atual.
- **Serviços e preços mostrados no site ainda são placeholder** (os da Barbearia Chamilli, ~8 serviços entre 10€ e 24€) — não são os preços reais da Studio XXVII. Substituir quando o dono fornecer a lista real; não tratar os valores atuais como facto definitivo do negócio.
- Nomes dos colaboradores no seed ainda são placeholder ("Barbeiro 1", "Barbeiro 2"); passwords iniciais por definir.
- Por decidir (facto do produto, não travar por isto): se cada colaborador vê só a própria agenda em `/equipa` ou a de toda a equipa.
- Segurança da área `/equipa`: middleware a proteger todas as rotas, cada API volta a validar sessão e permissão no servidor, rate limiting no login, cookies httpOnly/secure/sameSite, validação de input com zod, respostas de API nunca devolvem `passwordHash`.
- Fora do âmbito de design deste produto, mas presentes no mesmo repositório — não mexer sem confirmação explícita: `app/` (aplicação React Native, parada, "fora do plano por agora"); `web/` (site antigo em Create React App) e `ws/` (backend Express antigo), que serão substituídos por completo pelo `webapp/` assim que `/marcar` e `/equipa` estiverem validados, mas que o plano do projeto instrui a não apagar sem confirmação explícita nessa altura.

## Brand Commitments

- Nome: **Studio XXVII**. Morada: R. Prof. Eng. Joaquim Vieira Natividade, Alcobaça. Horário: Terça a Sábado, 10h–19h. Instagram: `@studio__xxvii`.
- Identidade visual confirmada e já em uso no código: preto/carvão + creme + dourado/âmbar (`#141210` preto, `#f5efe6` creme, `#c9a35f` dourado), logótipo circular em serifa — logótipo real já integrado (componente `LogoBadge`), substituindo o placeholder anterior.
- Fotos reais da loja já existem e estão em uso (`public/fotos/`: exterior, interior/cadeira, interior/teto, serviço de barba).
- Frases de marca já usadas no site: "Born to be different" (hero, em inglês), "Criando identidades.", "Não é só sobre o corte." — restante copy do site em português.

## Evidence on Hand

- Fotos reais da loja: `webapp/public/fotos/exterior-loja.png`, `interior-cadeira.png`, `interior-teto.png`, `servico-barba.png`.
- Logótipo real da marca, integrado via `LogoBadge`.
- Lista de serviços/preços no site é placeholder (ver Capabilities and Constraints) — não confundir com dados reais do negócio.
- Sem testemunhos, casos de estudo, imprensa ou métricas reais — não inventar nenhum destes.

## Product Principles

- Uma marcação deve demorar menos de um minuto, sem chamadas nem espera — é a razão de existir de `/marcar` e substitui por completo o fluxo por DM.
- Nunca pedir pagamento antecipado ao cliente — decisão explícita do dono, já revertida uma vez depois de implementada; não reintroduzir sem pedido direto dele.
- Falhas em integrações externas (Google Calendar, WhatsApp) nunca bloqueiam nem desfazem uma ação da equipa em `/equipa` — ficam só registadas em log.
- Segurança em primeiro lugar na área `/equipa`, por lidar com dados de clientes e a agenda de trabalho da equipa — nunca enfraquecer autenticação ou validação por conveniência.
- Fidelidade à identidade real da Studio XXVII (morada, horário, redes sociais, paleta preto/creme/dourado) em qualquer trabalho de design — não substituir por algo genérico de "barbearia".

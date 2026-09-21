# Página de marcações "Studio XXVII" — plano revisto (Next.js + SQLite)

> Revisto em 2026-08-25. Este plano **substitui** a versão anterior (que reaproveitava `ws`/Express + MongoDB + `web`/CRA). Decidido em conversa: caso mais simples, projeto único em Next.js com SQLite, que substitui `ws` e `web` por completo.

## Contexto

Construir um sistema completo (não só a página pública) para a barbearia real **Studio XXVII** (Alcobaça, atualmente só recebe marcações por DM do Instagram):

1. **Página pública `/marcar`**, estilo buk.pt: lista de serviços com seleção múltipla tipo carrinho → escolher profissional por serviço (ou "sem preferência") → escolher dia num calendário mensal (só dias com vaga clicáveis) → escolher hora (Manhã/Tarde/Noite) → confirmação com resumo + formulário de contacto (nome, telefone, email, observações, termos).
2. **Área admin `/admin`** (nova, não existia no plano original): cada colaborador faz login e vê um calendário estilo Google Calendar com as suas marcações — cliente, serviço, hora — pode **arrastar** uma marcação para outro horário/dia, e marcar **se já foi pago e com que método**.

Identidade visual do Studio XXVII (Instagram `instagram.com/studio__xxvii`): preto/carvão + creme + dourado/âmbar, logótipo circular em serifa, morada "R. Prof. Eng. Joaquim Vieira Natividade, Alcobaça", horário "Terça a Sábado, 10h–19h". Sem fotos/logótipo reais para reutilizar — hero preto/dourado original, com espaço para substituir depois.

Serviços/preços reais do Studio XXVII ainda não existem — continuam a usar-se os **da Barbearia Chamilli como placeholder** (~8 serviços, 10€–24€).

## Decisões tomadas nesta conversa

- **Base de dados: SQLite**, não MongoDB.
- **Projeto único em Next.js substitui `ws` (Express) e `web` (CRA) por completo.** `app/` (React Native) fica fora deste plano, intocado, por agora.
- **Área admin com calendário arrastável estilo Google Calendar**: colaborador vê cliente, tipo de corte, hora; pode mover a marcação; regista se pagou e o método de pagamento.
- **Login simples por colaborador** (email + password) — cada um entra na sua conta; a proteger `/admin/**`.

## Stack técnica

- **Next.js (App Router)**, JavaScript (a manter consistência com o resto do repo).
- **Prisma + SQLite** como ORM/BD (ficheiro local, ex. `prisma/dev.db`), com migrações e seed script.
- **NextAuth.js (Credentials provider)** para o login dos colaboradores; password guardada com `bcrypt`.
- **FullCalendar** (`@fullcalendar/react` + `dayGrid`/`timeGrid` + `interaction`) para o calendário admin arrastável — é o que mais se aproxima do estilo Google Calendar com drag-and-drop.

### ⚠️ Aviso importante sobre o deploy

SQLite grava num ficheiro local. Isso **não funciona bem em hosts serverless "stateless"** como a Vercel (o disco é efémero/só-leitura em produção — cada pedido pode correr numa instância diferente e perder as escritas). Para o `next build` ficar deployável a sério com escritas persistentes, é preciso um host com **disco persistente**: VPS próprio, Render, Fly.io, Railway, etc. Alternativa futura: trocar SQLite local por **libSQL/Turso** (SQLite "hospedado", compatível com Prisma) se quiseres continuar em serverless. **Por decidir onde vai ficar o deploy final** — mas o desenvolvimento local funciona sempre, independentemente disto.

## Segurança da área admin

- Password nunca em texto simples — hash com `bcrypt`.
- Sessão NextAuth com cookie `httpOnly` + `secure` (só HTTPS) + `sameSite`.
- **Rate limiting no login** (ex. 5 tentativas / poucos minutos por IP+conta, depois bloqueio temporário) contra força bruta.
- Middleware a proteger todas as rotas `/admin/**`; cada API route volta a verificar a sessão no servidor (nunca confiar só no frontend).
- Cada API que altera dados confirma no servidor que o colaborador tem permissão sobre aquele agendamento.
- Prisma com queries parametrizadas (sem SQL cru) — sem SQL injection.
- Validação de input em todas as rotas (`zod`).
- Segredos (`NEXTAUTH_SECRET`, caminho da BD) em variáveis de ambiente, nunca no git.
- Respostas da API nunca devolvem `passwordHash`.
- Headers de segurança no `next.config.js` (CSP, X-Frame-Options, etc.).
- HTTPS obrigatório no host final; `npm audit` às dependências.
- Correr `/security-review` sobre o código antes do deploy.

## Modelo de dados (Prisma schema — substitui os modelos Mongoose antigos)

- `Salao` — só Studio XXVII por agora, mas mantém-se a tabela para o futuro.
- `Servico` — `titulo, preco, duracaoMinutos, descricao, ativo`.
- `Colaborador` — `nome, email, passwordHash, ativo`.
- `ColaboradorServico` — relação m:n (que serviços cada colaborador sabe fazer).
- `Horario` — `diaSemana, inicio, fim, colaboradorId` (disponibilidade semanal por colaborador).
- `Cliente` — `nome, telefone, email, observacoes`.
- `Agendamento` — `clienteId, colaboradorId, servicoId, grupoId, data, horaInicio, horaFim, valor, pago (Boolean), metodoPagamento, observacoes, status`.

`grupoId` continua a ligar os vários `Agendamento`s de uma mesma visita/carrinho (ex. corte + barba marcados juntos).

## Plano de implementação

### 1. Setup do projeto
- Novo projeto Next.js numa pasta nova (ex. `webapp/`), para não misturar com `ws`/`web` enquanto não está validado.
- `prisma init`, `schema.prisma` com os modelos acima, primeira migração, script de seed.

### 2. Backend (API routes / server actions do Next.js)
- Público: listar serviços ativos, listar colaboradores qualificados por serviço, calcular disponibilidade (reescrever a lógica de slots sequenciais do `ws` antigo — `sliceMinutes`/`mergeDateTime`/`hourToMinutes` — em JS puro, sem Mongo), criar marcação (find-or-create de `Cliente`, cria um `Agendamento` por serviço com o mesmo `grupoId`).
- Admin (autenticado): listar agendamentos por colaborador/dia, mover agendamento (PATCH data/hora/colaborador), marcar pago + método, CRUD simples de serviços/colaboradores/horários.

### 3. Autenticação
- NextAuth Credentials, tabela `Colaborador` com `passwordHash` (bcrypt).
- Middleware a proteger todas as rotas `/admin/**`.

### 4. Frontend público — `/marcar`
- Os mesmos 5 passos do plano original (carrinho de serviços → profissional → dia → hora → confirmação), em componentes React do Next.js, CSS próprio, paleta preto `#141210` / creme `#f5efe6` / dourado `#c9a35f`.

### 5. Frontend admin — `/admin`
- Login.
- Calendário (FullCalendar) por colaborador, vista dia/semana, mostra cliente + serviço + hora.
- Arrastar um evento → atualiza hora/colaborador via API.
- Clicar num evento → painel lateral com detalhes + marcar pago/método de pagamento.
- Páginas simples de gestão: serviços, colaboradores, horários.

### 6. Seed de dados
- Mesmo conteúdo do plano original: `Salao` "Studio XXVII" (morada Alcobaça, horário do Instagram), ~8 `Servico` com nomes/preços da Barbearia Chamilli, 2 `Colaborador` placeholder ("Barbeiro 1", "Barbeiro 2", com password inicial a definir) e `Horario` Terça(2)–Sábado(6) 10:00–19:00.

### 7. Migração/remoção do código antigo
- Só depois de `/marcar` e `/admin` estarem validados a funcionar é que `ws/` e `web/` deixam de ser precisos.
- **Não apagar essas pastas sem confirmação explícita nessa altura** — ficam paradas mas presentes até decidirmos remover.

## Verificação
1. Correr o seed, confirmar os registos criados na SQLite.
2. `next dev`, abrir `/marcar`: selecionar 2 serviços → total a somar → escolher profissional/sem preferência → dia disponível → hora → dados de contacto → confirmar.
3. Login em `/admin` com um dos colaboradores placeholder, ver a marcação no calendário, arrastar para outra hora, marcar como paga + método.
4. `next build && next start` local, confirmar que continua tudo a funcionar (fora do modo dev).

## Por decidir
- Nomes reais dos colaboradores e as suas passwords iniciais.
- Se cada colaborador só vê o seu próprio calendário ou se todos veem o calendário de todos.
- Lista de serviços/preços reais do Studio XXVII, quando o dono a disponibilizar.
- Logótipo/fotos reais para substituir o hero placeholder.

## Base de dados: troca de SQLite para PostgreSQL (2026-09-03)

Decisão do dono do negócio: quer poder abrir o DBeaver e ver/editar a BD
diretamente (host/porta/user/password), o que o ficheiro SQLite não permite
bem em produção (é só um ficheiro na VPS, não um servidor a que se liga por
rede). Trocado `datasource db { provider = "sqlite" }` por `"postgresql"` no
`prisma/schema.prisma`; o Prisma mantém-se como ORM/migrações — só muda o
motor da BD por baixo, não a forma como o código a usa.

- Migrações antigas (geradas para SQLite) foram substituídas por uma única
  migração `init` gerada de raiz para PostgreSQL — não havia dados reais em
  produção, só seed, por isso não houve necessidade de migrar dados.
- **Localmente**: instalado PostgreSQL 17 na máquina de desenvolvimento
  (serviço Windows `postgresql-x64-17`, porta 5432), com um role e uma base de
  dados dedicados (`studioxxvii`), separados do superuser. `DATABASE_URL` no
  `.env` local aponta para aí.
- **Em produção**: o plano mantém-se — PostgreSQL corre na mesma VPS que a
  app (ver `webapp/deploy/DEPLOY.md`, secção 1). Continua a ser preciso um
  host com disco persistente (VPS própria), tal como acontecia com o SQLite —
  isto não muda com PostgreSQL self-hosted. O que muda é que, havendo um
  servidor de BD a sério, fica aberta a porta para no futuro usar Postgres
  gerido (ex. Neon/Supabase/Railway) e hospedar o Next.js em serverless
  (Vercel), se um dia fizer sentido crescer nessa direção.
- Acesso ao DBeaver em produção (raro — o dia a dia é sempre via `/equipa` no
  browser): túnel SSH para a VPS, nunca abrir a porta 5432 ao exterior.

## Google Calendar, pagamento antecipado, reagendamento e deploy (implementado em 2026-08-26)

Decisões tomadas e já implementadas no código (todas com fallback automático:
sem as credenciais externas configuradas, o comportamento fica igual ao de antes):

- **Deploy**: VPS + nginx como proxy reverso + systemd (não Vercel/serverless, por
  causa do SQLite). Ficheiros em `webapp/deploy/` (`nginx.conf`,
  `studioxxvii.service`, `DEPLOY.md` com o guia passo-a-passo, DNS incluído: dois
  registos A, `@` e `www`, para o IP da VPS).
- **Hetzner**: o plano de Webhosting partilhado (~2€/mês) **não serve** — só tem
  PHP, sem Node.js/SSH nos planos baratos. Recomendado **Hetzner Cloud CX22**
  (~4,50€/mês) ou equivalente, com acesso root.
- **Google Calendar**: sincronização **one-way** (app → Google), via OAuth por
  colaborador (`/equipa/definicoes`, botão "Ligar ao Google Calendar"). Cada
  agendamento fica também com um `googleEventId`; criar/mover/cancelar no
  `/equipa` atualiza o evento no Google quase em tempo real. Existe também um
  **feed `.ics`** alternativo (sem login Google, atualização mais lenta) na
  mesma página de definições, para quem preferir só subscrever um link.
  Variáveis: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`.
- **Reagendamento + notificação ao cliente**: mover/cancelar uma marcação
  confirmada em `/equipa` aplica a alteração de imediato e dispara
  automaticamente uma mensagem de WhatsApp (via Twilio) para o telefone do
  cliente com o novo horário. Falha a enviar a mensagem não desfaz a alteração
  (só fica registada em log). Variáveis: `TWILIO_ACCOUNT_SID`,
  `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`.
- ~~Pagamento antecipado (MB Way via ifthenpay)~~ — **revertido em 2026-09-03.**
  Decisão do dono do negócio: o cliente **nunca paga no ato da marcação**, só
  depois de ter o corte feito na barbearia. Removido do código: `lib/pagamentos.js`,
  a rota `/api/pagamentos/callback`, a rota de polling `/api/marcar/estado`, o
  estado `PENDENTE_PAGAMENTO` (removido do enum `StatusAgendamento` e do schema
  Prisma, com migração `remover_pagamento_antecipado`) e o campo
  `referenciaPagamento`. `/marcar` volta a confirmar a marcação de imediato,
  sempre, sem exigir nada do cliente além dos dados de contacto. O pagamento
  continua a ser registado manualmente pela equipa em `/equipa` (campo `pago` +
  `metodoPagamento`, que ainda inclui "MB Way" como opção — cobre o caso de o
  cliente pagar por MB Way à boca da caixa, não antecipado).

### Por fazer para ativar de vez as integrações que restam
1. Criar conta Twilio (ou WhatsApp Cloud API direta, mais barata a médio prazo),
   aprovar o número/templates de WhatsApp, copiar credenciais para o `.env`.
2. Criar credenciais OAuth Google (console.cloud.google.com/apis/credentials),
   com o redirect URI de produção autorizado.
3. Seguir `webapp/deploy/DEPLOY.md` para pôr o servidor e o domínio no ar.

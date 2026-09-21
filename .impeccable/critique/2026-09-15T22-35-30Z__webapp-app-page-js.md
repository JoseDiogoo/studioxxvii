---
target: homepage (webapp/app/page.js)
total_score: 22
max_score: 32
na_heuristics: 7,10
p0_count: 1
p1_count: 3
target_identity: "file:C:\\Users\\ADMIN\\OneDrive - IPLeiria\\Desktop\\barber-flow-main\\webapp\\app\\page.js"
target_fingerprint: "sha256:bb0b2917f3be153af55ec6ffa0c44a7e0f21774df3fdb0512d0525f8965409b6"
target_path: "C:\\Users\\ADMIN\\OneDrive - IPLeiria\\Desktop\\barber-flow-main\\webapp\\app\\page.js"
timestamp: 2026-09-15T22-35-30Z
slug: webapp-app-page-js
---
Method: dual-agent (A: design-review sub-agent · B: detector/browser-evidence sub-agent)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Sem indicador de secção ativa durante o scroll numa página longa de uma só página. |
| 2 | Match System / Real World | 2 | "Conhecer o espaço" promete exploração e entrega diretamente o passo 1 da marcação. |
| 3 | User Control and Freedom | 3 | Navegação standard, sem armadilhas; falta "voltar ao topo" num scroll longo. |
| 4 | Consistency and Standards | 2 | O botão "Conhecer o espaço" sobrepõe estilo inline ao `.botaoContorno`, saindo do sistema. |
| 5 | Error Prevention | 3 | Links externos corretos (`rel="noreferrer"`, nova aba); pouca superfície de erro na home. |
| 6 | Recognition Rather Than Recall | 3 | Horário/morada repetidos em 3 sítios; preço+duração sempre visíveis por serviço. |
| 7 | Flexibility and Efficiency | n/a | Página Persuade (marketing) — atalhos de utilizador avançado não aplicáveis. |
| 8 | Aesthetic and Minimalist Design | 3 | Disciplina de paleta forte, mas o bloco kicker+título+lead repete-se quase idêntico 4x. |
| 9 | Error Recovery | 3 | Sem estados de erro a testar nesta página estática. |
| 10 | Help and Documentation | n/a | Persuade — FAQ existe mas inconsistente entre desktop/mobile (ver observações). |
| **Total** | | **22/32** | **Aceitável (69%)** |

## Design Specificity Verdict

**Avaliação LLM (Assessment A):** Não é um template genérico com o nome trocado — o Logo Badge (medalhão circular "STUDIO"/traço/"XXVII") e a Tools Wheel (anel de ferramentas de barbeiro em rotação 3D contínua à volta do badge) são peças à medida que não poderiam ser transplantadas para outro negócio sem mais. A paleta noir/creme/dourado e a regra "serifa só em display" são seguidas com disciplina real. Mas a estrutura à volta desses dois elementos de assinatura — cabeçalho fixo → hero com dois CTAs → faixa de 3 estatísticas → sobre com foto → lista de preços plana → grelha de fotos → mapa+horário → CTA final → footer de 4 colunas — é o mesmo esqueleto usado por incontáveis salões, clínicas e ginásios, com o mesmo bloco "kicker / h2 serifa / lead centrado" repetido quase identicamente 4 vezes. Veredito: uma camada de identidade forte e específica montada sobre uma composição genérica.

**Scan determinístico (Assessment B):** `impeccable detect --json webapp/app` sobre o código-fonte estático devolveu **0 findings** — mas a mesma verificação injetada no **browser em runtime** (`/detect.js` na página renderizada em localhost:3001) encontrou **11 anti-padrões**, incluindo problemas que só existem depois do CSS ser calculado (tamanhos de fonte reais em px, contraste de cor real). Isto confirma que o scan estático sozinho não chega para este tipo de projeto — a evidência de browser é que apanhou os problemas reais.

**Overlays visuais:** a injeção funcionou (mutação confirmada, script injetado com sucesso). Os 11 anti-padrões, todos confirmados manualmente no código-fonte pela Assessment B (sem falsos positivos identificados):
- `undersized-ui-text` × 5 — texto "STUDIO"/"XXVII" do Logo Badge a **4,1px e 5px** (abaixo do piso de 11px, e mesmo do piso de 10px) no cabeçalho; etiquetas "Horário"/"Morada"/"Marcações" da faixa de info a 10,56px.
- `low-contrast` — 3,1:1 (precisa 4,5:1) no dourado-escuro sobre creme na assinatura "Criando identidades."
- `kicker-above-heading` × 4 — o mesmo padrão de intro de secção repetido em Sobre/Serviços/Galeria/Localização (convergente com a observação independente da Assessment A sobre repetição estrutural).
- `skipped-heading` — h2 final seguido de h4 "Navegação" no footer, sem h3 intermédio.
- `overused-font` — Inter em 57% do texto; `hero-eyebrow-chip`; `gpt-thin-border-wide-shadow` no mapa; `cream-palette` de fundo.

Nota: um subagente reportou ter visto uma barra de anotações residual "[Human] Impeccable Preflight Test" no browser a meio da sessão — resíduo mecânico de uma passagem de QA anterior, corretamente ignorado como conteúdo da página e não tratado como instrução.

## Overall Impression

O site tem uma identidade visual genuinamente de autor (medalhão + roda de ferramentas, paleta disciplinada) montada sobre um esqueleto de landing page de "barbearia/salão" comum, com dois problemas concretos de execução — um CTA que desaparece no telemóvel mais pequeno, e o próprio texto do logótipo ilegível no cabeçalho — que valem mais a pena corrigir primeiro do que qualquer redesign estrutural.

## What's Working

- **Logo Badge + Tools Wheel**: a peça de assinatura mais forte do site — tecnicamente cuidada (rotação 3D, `prefers-reduced-motion` respeitado) e impossível de copiar para um concorrente sem mais.
- **The Rare Gold Rule em ação**: o dourado nunca se torna fundo ou preenchimento — mantém o site com uma sensação editorial contida em vez do dourado excessivo típico de sites de barbearia.
- **Voz de copy consistente**: "Preços claros, sem surpresas", "Sem pressas, sem fórmulas — só o resultado que procuras", "Não é só sobre o corte" — soam escritas para esta marca, não preenchidas num template.

## Priority Issues

**[P0] O CTA principal do cabeçalho desaparece nos telemóveis mais pequenos.**
- **Porque importa:** `home.module.css:64-68` esconde `.botaoOuro` do cabeçalho abaixo de 500px de largura. Exatamente nos ecrãs mais estreitos — o público mais impaciente e mais provável de decidir em segundos — a ação de conversão desaparece do lugar mais visível, obrigando a abrir o menu hambúrguer primeiro.
- **Fix:** manter um CTA compacto visível em todas as larguras (ícone+texto reduzido, ou só ícone) em vez de esconder o botão por completo.
- **Comando sugerido:** `/impeccable harden`

**[P1] O texto do próprio logótipo é ilegível no cabeçalho e no footer.**
- **Porque importa:** `LogoBadge.js` calcula `fontSize: size/8`; usado a `size={40}` no cabeçalho/footer, o "STUDIO" e o "XXVII" renderizam a 4,1px e 5px — abaixo de qualquer piso de legibilidade, em todas as páginas, o tempo todo. É a marca a falhar em ler-se a si própria.
- **Fix:** definir um `fontSize` mínimo absoluto na fórmula de escala do Logo Badge (não puramente proporcional a `size`), ou aumentar o `size` mínimo usado no cabeçalho/footer.
- **Comando sugerido:** `/impeccable typeset`

**[P1] "Conhecer o espaço" promete uma coisa e entrega outra.**
- **Porque importa:** o botão da secção Sobre (`page.js:139-141`) liga a `/marcar`, confirmado ao vivo como sendo diretamente o passo 1 da marcação ("Escolhe os serviços"), não mais fotos ou contexto. Um visitante em modo de exploração de baixo compromisso é empurrado sem aviso para um fluxo transacional — um custo de confiança real logo a seguir à secção mais pessoal da página.
- **Fix:** apontar o botão para a Galeria/mais fotos, ou renomear para refletir o destino real ("Marcar horário").
- **Comando sugerido:** `/impeccable clarify`

**[P1] Secção de Serviços: 8 opções sem agrupamento no ponto de decisão mais importante da página.**
- **Porque importa:** `Servicos()` mostra os 8 serviços numa grelha plana de 2 colunas, sem categorias nem destaque de "mais popular" — o dobro do limite recomendado de opções visíveis num único ponto de decisão, exatamente antes do CTA "Marcar horário".
- **Fix:** agrupar em 2-3 categorias (Cabelo / Barba / Combos) ou destacar 3-4 serviços populares com expansão "ver todos".
- **Comando sugerido:** `/impeccable distill`

**[P2] Texto dourado com baixo contraste, incluindo uma etiqueta de estado.**
- **Porque importa:** `dourado-escuro` (#a9823f) sobre `creme` (#f6f1e7) mede 3,1:1 (precisa 4,5:1 para texto) na assinatura "Criando identidades." — e o mesmo tom aparece em `.horarioFechado`, que marca os dias em que a loja está **fechada**, ou seja, informação operacional, não só decorativa.
- **Fix:** escurecer o tom dourado usado em texto pequeno sobre creme até cumprir AA, mantendo o dourado mais claro só para elementos maiores/decorativos.
- **Comando sugerido:** `/impeccable harden`

## Persona Red Flags

**Jordan (visitante pela primeira vez, a mudar do DM do Instagram):**
- Clica em "Conhecer o espaço" à espera de fotos/contexto e cai diretamente em "Escolhe os serviços" — a troca de expectativa acima, no perfil mais propenso a desistir por isso.
- Enfrenta 8 nomes de serviço sem descrição ("Rapar Cabelo" vs. "Corte Cabelo", "Corte + Barba" vs. "Rapar + Barba") — sem ajuda a distinguir para além de preço/duração.
- O "Born to be different" em inglês destoa ligeiramente de um site 100% em português para um público local.

**Riley (testador metódico):**
- O `MobileMenu` é um componente `"use client"` — antes da hidratação (ligação lenta), combinado com o CTA do cabeçalho escondido <500px, deixa uma janela onde o cabeçalho mostra só o logótipo, sem forma de navegar ou marcar.
- O iframe do Google Maps não tem alternativa em texto simples ("abrir no Google Maps") se for bloqueado por um bloqueador de anúncios/privacidade.

**Casey (utilizador de telemóvel distraído):**
- O mesmo P0 acima: num telemóvel típico (<500px), a ação mais importante da página exige um toque extra (abrir hambúrguer → encontrar CTA).
- A lista de 8 serviços é um scroll longo a uma mão, sem sinal visual de "começa aqui" para quem só quer escolher depressa.

## Minor Observations

- Hierarquia de títulos quebrada: o último h2 da homepage é seguido do h4 "Navegação" no footer, sem h3 intermédio.
- Nenhum dos 5 CTAs "Marcar horário" reforça que o pagamento é sempre presencial (nunca antecipado) — o ponto de fricção mais relevante para quem vem do DM do Instagram para um formulário estruturado.
- O padrão "kicker + h2 serifa + lead centrado" repete-se quase identicamente 4 vezes (Sobre/Serviços/Galeria/Localização) — contribui para a leitura "templada" da Assessment A.
- Fonte Inter usada em 57% do texto total da página (métrica do detetor, não necessariamente um problema, mas vale monitorizar se a intenção é reforçar mais a serifa).
- `interior-cadeira.png` é reutilizada duas vezes no mesmo scroll (Sobre + peça grande da Galeria) — reduz a sensação de variedade fotográfica numa secção cujo objetivo é mostrar o espaço.
- FAQ acessível no menu mobile e no footer, mas ausente da navegação desktop — inconsistência de IA entre breakpoints.
- Texto do footer (`#9c9481`, `#7d7563`) sobre noir é pequeno e muito suave (0,78-0,88rem) — provavelmente intencional, mas no limite da leitura confortável.

## Questions to Consider

1. Se o dourado deve ser raro por regra do próprio sistema (<10% do ecrã), porque é que a mesma etiqueta dourada em maiúsculas se repete em todas as secções — o elemento mais contido do sistema tornou-se o seu tique mais previsível?
2. A Tools Wheel é o elemento mais trabalhado à mão de toda a página — porque aparece só uma vez, no hero, e nunca mais volta a reforçar a marca depois de o visitante fazer scroll?
3. Um cliente real hoje marca com um simples "amanhã de manhã?" por DM — encaminhá-lo para uma grelha rígida de 8 preços (ou um botão mal rotulado que o larga direto no passo 1 de um wizard) sente-se como um upgrade, ou como papelada a mais em comparação com a conversa a que está habituado?

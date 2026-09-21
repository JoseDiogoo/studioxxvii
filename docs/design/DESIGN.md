---
name: Studio XXVII
description: Barbearia em Alcobaça — noir, creme e dourado, precisão editorial com alma de bairro.
colors:
  noir: "#141210"
  noir-suave: "#1d1a15"
  creme: "#f6f1e7"
  creme-cartao: "#efe7d6"
  dourado: "#c9a35f"
  dourado-escuro: "#856526"
  texto: "#201c17"
  texto-suave: "#6b6255"
  linha: "#e4dbc8"
typography:
  display:
    fontFamily: "Playfair Display, Georgia, 'Times New Roman', serif"
    fontSize: "clamp(2.6rem, 7vw, 5.2rem)"
    fontWeight: 700
    lineHeight: 1.02
    letterSpacing: "0.01em"
  headline:
    fontFamily: "Playfair Display, Georgia, 'Times New Roman', serif"
    fontSize: "clamp(2rem, 4vw, 2.9rem)"
    fontWeight: 700
    lineHeight: 1.1
  body:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: "1.02rem"
    fontWeight: 400
    lineHeight: 1.7
  label:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: "0.72rem"
    fontWeight: 700
    letterSpacing: "0.2em"
rounded:
  pill: "999px"
  lg: "20px"
  md: "12px"
  sm: "4px"
  full: "50%"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "56px"
  section: "108px"
components:
  button-primary:
    backgroundColor: "{colors.dourado}"
    textColor: "{colors.noir}"
    rounded: "{rounded.pill}"
    padding: "11px 24px"
  button-primary-hover:
    backgroundColor: "#d9b46f"
    textColor: "{colors.noir}"
    rounded: "{rounded.pill}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.creme}"
    rounded: "{rounded.pill}"
    padding: "11px 24px"
  button-dark:
    backgroundColor: "{colors.noir}"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    padding: "13px 28px"
  card-primary:
    backgroundColor: "#ffffff"
    rounded: "{rounded.lg}"
    padding: "24px"
---

# Design System: Studio XXVII

## Overview

**Creative North Star: "O Selo XXVII" (The XXVII Seal)**

Studio XXVII lê-se como um selo cunhado, não como uma app: um medalhão circular a preto e dourado, sobreposto a superfícies em carvão profundo e creme quente, com o rigor de tipografia editorial (Playfair Display para tudo o que é declaração — títulos, preços, o próprio logótipo) e a neutralidade funcional do Inter para o que é interface e leitura corrida. A paleta é intencionalmente restrita — preto/carvão, creme e um único dourado — e o dourado é usado com disciplina: aparece para marcar o que importa (CTA, preço, estado selecionado, o brilho do "XXVII"), nunca como decoração de fundo. Este não é o dourado exuberante de um cassino; é o dourado discreto de um instrumento de barbeiro bem cuidado.

A composição mistura dois registos deliberadamente: elementos interativos são quase todos circulares ou em pílula (botões, avatares, dias do calendário, o próprio badge do logótipo) — convidam ao toque — enquanto a fotografia da loja é recortada quase a esquadria (4px de raio), como uma prova de contacto editorial. Essa tensão entre o redondo/macio da interface e o reto/nítido da imagem é uma escolha de sistema, não um acidente.

**Key Characteristics:**
- Tríade cromática restrita — noir / creme / dourado — sem cores secundárias.
- Serifa de declaração (Playfair Display) + sans neutro (Inter), nunca misturados dentro do mesmo papel.
- Interações redondas (pílulas, círculos) contra fotografia de cantos quase retos.
- Elevação suave e difusa, nunca dura — cartões "flutuam", não "batem".
- Dourado como pontuação rara, não como preenchimento.

## Colors

Tríade preto-carvão / creme / dourado, sem paleta secundária ou terciária — a disciplina da paleta é a identidade.

### Primary
- **Dourado** (`#c9a35f`): o único acento do sistema. CTAs principais (botão "Marcar horário"), preços, estados selecionados (dia/hora escolhidos), sublinhados de assinatura, ícones da roda 3D no hero. Hover mais claro (`#d9b46f`).
- **Dourado Escuro** (`#856526`): variante de texto do dourado, escurecida para cumprir contraste AA (≥4,5:1) sobre creme — kickers/etiquetas de secção, indicador "agora" no calendário FullCalendar, links de texto sobre fundo claro, estado "Encerrado" no horário.

### Neutral
- **Noir** (`#141210`): a superfície escura do sistema — cabeçalho, hero, secção de serviços, faixa de info, CTA final, footer, fundo do login da equipa. É "preto" mas nunca `#000`.
- **Noir Suave** (`#1d1a15`): variante do noir para gradientes radiais (hero, login), nunca usada como bloco sólido.
- **Creme** (`#f6f1e7`): fundo de página por omissão nas secções claras.
- **Creme Cartão** (`#efe7d6`): fundo de inputs, dias/horas por marcar, faixas neutras dentro dos cartões — um tom abaixo do creme de página, para dar profundidade sem sair da família quente.
- **Texto** (`#201c17`): texto principal sobre fundo claro.
- **Texto Suave** (`#6b6255`): texto secundário, legendas, metadados (duração de serviço, moradas).
- **Linha** (`#e4dbc8`): todas as divisórias e contornos sobre fundo claro.

### Named Rules
**The Rare Gold Rule.** O dourado nunca preenche uma área grande nem serve de fundo. Existe como traço, texto ou estado — CTA, preço, seleção — e cobre visivelmente menos de 10% de qualquer ecrã. Se um elemento "precisa" de mais dourado do que isso, o problema é hierarquia, não cor.

## Typography

**Display Font:** Playfair Display (com Georgia, "Times New Roman", serif como fallback)
**Body Font:** Inter (com a pilha de sistema -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif)

**Character:** Playfair Display carrega toda a voz de marca — títulos, preços, o logótipo, a assinatura itálica "Criando identidades." — enquanto o Inter faz o trabalho silencioso de interface: navegação, botões, formulários, texto corrido. A serifa nunca aparece em contexto funcional; o sans nunca aparece a fazer uma declaração.

### Hierarchy
- **Display** (700, `clamp(2.6rem, 7vw, 5.2rem)`, line-height 1.02): título do hero da homepage. O `<em>` dentro do título ("different") muda para dourado e itálico — é o único lugar onde a ênfase tipográfica e a cor de acento coincidem no mesmo elemento.
- **Headline** (700, `clamp(2rem, 4vw, 2.9rem)`, line-height 1.1): títulos de secção ("Serviços", "O nosso espaço", "Onde estamos").
- **Title** (700, ~1.35rem): títulos de passo dentro do cartão de marcação (`/marcar`), nomes de serviço, valores da faixa de info.
- **Body** (400, ~1.02rem, line-height 1.7–1.8): parágrafos "Sobre nós", texto de contacto. Sem limite de largura de coluna explícito no código, mas os blocos de texto observados rondam 45–55ch.
- **Label** (700, 0.66–0.72rem, letter-spacing 0.16–0.32em, maiúsculas): kickers de secção, etiquetas da faixa de info, cabeçalhos de coluna do calendário FullCalendar. Quanto mais pequena a etiqueta, maior o letter-spacing.

### Named Rules
**The One Display Rule.** Playfair Display só aparece em títulos, preços e no logótipo — nunca em corpo de texto, nunca em elementos de formulário ou navegação, por mais pequeno que seja o uso.

## Layout

Secções centradas em `max-width: 1160px`, com `padding: 108px 24px` verticalmente generoso entre blocos — é isto que dá ao site o ritmo "catálogo editorial" em vez de "landing page densa". Cabeçalhos de secção (`kicker` + título + lead) são centrados e limitados a `max-width: 620px`.

Grelhas de duas colunas (Sobre, Localização) usam proporções assimétricas (`0.9fr 1.1fr` / `1fr 1.15fr`, nunca 1fr 1fr) e colapsam para uma coluna única abaixo de 860px. A galeria usa uma grelha de 4 colunas com um mosaico irregular (uma peça a ocupar 2×2), colapsando para 2 colunas no mobile.

O fluxo de marcação (`/marcar`) é o único ecrã "aplicação" do sistema: um único cartão branco (`cartaoPrincipal`), centrado em `max-width: 640px`, sobreposto ao hero escuro por uma margem negativa (`margin-top: -40px`) — o cartão "aterra" por cima da faixa escura, como um bilhete físico pousado sobre uma superfície. Um indicador de passos por pontos (barras de 26×3px, douradas quando ativas) substitui breadcrumbs de texto. Uma barra fixa no fundo do ecrã (`backdrop-filter: blur`) mantém o total e a ação principal sempre visíveis durante o scroll — é o único uso de "chrome" fixo fora do cabeçalho.

Breakpoints observados: 500px (esconde CTA secundário do cabeçalho), 700px (faixa de info e lista de serviços passam a coluna única), 760px (navegação de topo colapsa para menu mobile, galeria passa a 2 colunas), 860px (Sobre/Localização colapsam para coluna única).

## Elevation & Depth

Sistema maioritariamente plano, com sombras difusas e suaves usadas apenas para "levantar" cartões físicos do fundo — nunca para dar peso a botões ou elementos de interface pequenos. A sombra é sempre larga, escura e com opacidade baixa (nunca um contorno duro).

### Shadow Vocabulary
- **Elevação de cartão** (`box-shadow: 0 20px 48px -20px rgba(20, 18, 16, 0.22)`, por vezes com uma segunda camada fina `0 1px 2px rgba(20, 18, 16, 0.06)`): cartão principal de marcação, cartão de login da equipa. O deslocamento vertical grande e o raio de desfoque largo dão sensação de objeto pousado, não colado à página.
- **Elevação de imagem** (`box-shadow: 0 30px 60px -20px rgba(20, 18, 16, 0.35)`): foto "Sobre nós", mapa de localização — mesma lógica, sombra ainda mais larga por serem elementos maiores.
- **Painel flutuante** (`box-shadow: 0 20px 48px -20px rgba(0, 0, 0, 0.6)`): menu mobile — a única sombra sobre fundo escuro, por isso mais opaca.

### Named Rules
**The Diffuse-Only Rule.** Nenhuma sombra no sistema é dura ou próxima (nada de `0 2px 4px` justo por baixo do elemento). Toda a elevação lê-se como luz ambiente a separar um objeto do fundo, nunca como um contorno técnico.

## Shapes

Duas linguagens de forma convivem de propósito: **interações são redondas** (botões em pílula `border-radius: 999px`; avatares, badges, dias do calendário e ícones de navegação em círculo perfeito `50%`) e **conteúdo/fotografia é quase reto** (`4px` de raio em imagens da galeria e da secção Sobre — mal percetível, só o suficiente para tirar a aresta viva). Cartões de contentor (o cartão de marcação, o cartão de login, o menu mobile, os campos de formulário) ficam num raio intermédio (`12–20px`) — nem pílula nem fotografia, um terceiro registo para "superfície que contém coisas".

## Components

### Buttons
- **Shape:** pílula total (`border-radius: 999px`) em todos os botões do sistema, sem exceção.
- **Primary (`botaoOuro`):** fundo dourado (`#c9a35f`), texto noir, peso 700; hover aclara para `#d9b46f` e sobe 1px (`translateY(-1px)`). É o único botão preenchido a cor de acento — reservado para a ação "Marcar horário" e confirmações de alto valor.
- **Dark (`botao`):** fundo noir sólido, texto branco; usado dentro do fluxo de marcação e da área de equipa para a ação de avançar/confirmar passo — mais neutro que o dourado, para não competir com ele quando ambos poderiam aparecer no mesmo ecrã.
- **Outline (`botaoContorno` / `botaoSecundario`):** fundo transparente, contorno em `linha` ou branco a 35% de opacidade consoante o fundo; hover muda só o contorno e o texto para dourado. Usado para ações secundárias ("Ver serviços", "Voltar").
- **Disabled:** opacidade 0.35, cursor `not-allowed`, sem outra alteração visual.

### Cards / Containers
- **Corner Style:** 20px (cartão principal de marcação, cartão de login), 14px (painel do menu mobile).
- **Background:** branco puro (`#ffffff`) sobre fundo creme — o único uso de branco puro no sistema, reservado a estas superfícies de "cartão físico".
- **Shadow Strategy:** ver Elevation & Depth — sombra de cartão.
- **Border:** contorno finíssimo quase invisível (`rgba(20,18,16,0.04)`) só no cartão principal, para separar o branco do creme sem linha visível.

### Inputs / Fields
- **Style:** fundo `creme-cartao`, contorno `linha` a 1px, raio 12px, etiqueta em maiúsculas pequenas por cima (Inter, 700, `texto-suave`).
- **Focus:** contorno muda para dourado e o fundo sobe a branco puro — o campo "acorda" visualmente ao ser tocado.
- **Seleção tipo rádio (`linha` em `/marcar`):** checkbox circular customizado (22px, contorno `#d8d0bd`), preenche a dourado com um "✓" branco quando marcado — usado para a lista de serviços tipo carrinho.

### Navigation
- **Cabeçalho público:** fixo (`position: sticky`), fundo noir a 92% de opacidade com `backdrop-filter: blur(6px)`, borda inferior dourada a 18% — nunca opaco a 100%, deixa sempre uma sugestão do conteúdo por trás.
- **Estados de link:** cinza-creme (`#cfc7b7`) por omissão, dourado no hover — nunca sublinhado.
- **Mobile:** hambúrguer de duas linhas que se transforma em X; painel dropdown noir com o mesmo tratamento de cartão flutuante do resto do sistema.

### Logo Badge (assinatura)
Medalhão circular — fundo creme, contorno preto 1.5px, "STUDIO" / traço horizontal / "XXVII" empilhados em Playfair Display a preto. Funciona como selo/cunho de casa de moeda, não como ícone de app; é usado sozinho (cabeçalho, footer) e como núcleo da Roda de Ferramentas no hero.

### Tools Wheel (assinatura)
Anel de ícones de barbeiro (tesoura, navalha, pente) a rodar em perspetiva 3D (`perspective: 900px`, `rotateY`, 36s linear infinite) à volta do Logo Badge, no hero da homepage. Cor dourada a 0.8 de opacidade, sombra suave por ícone. Respeita `prefers-reduced-motion` (animação desligada). É o único momento de movimento contínuo/ambiente do sistema — todo o resto é motion de resposta a interação (hover, focus).

## Do's and Don'ts

### Do:
- **Do** manter o dourado como pontuação — preço, CTA, seleção — nunca como preenchimento de fundo ou área grande (The Rare Gold Rule).
- **Do** reservar o Playfair Display para títulos, preços e o logótipo; tudo o resto em Inter (The One Display Rule).
- **Do** manter sombras difusas e largas nos cartões físicos (branco sobre creme); nunca sombras duras ou justas.
- **Do** manter os botões sempre em pílula total (999px) — é o único raio de canto usado em elementos de ação.
- **Do** manter a fotografia com cantos quase retos (4px) como contraponto deliberado às formas redondas da interface.

### Don't:
- **Don't** introduzir uma segunda cor de acento — o sistema depende da raridade do único dourado para funcionar.
- **Don't** usar preto puro (`#000`) — o noir do sistema é sempre `#141210` ou a sua variante `#1d1a15`.
- **Don't** aplicar sombras duras/próximas ou contornos técnicos de elevação — quebra a leitura "editorial/física" do sistema.
- **Don't** animar elementos fora do hero sem motivo funcional — a Roda de Ferramentas é a exceção deliberada, não o padrão; o resto do motion é sempre resposta a interação (hover, focus, transição de estado).
- **Don't** substituir a voz de marca ("Born to be different", "Criando identidades.") por linguagem genérica de barbearia.

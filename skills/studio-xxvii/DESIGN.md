# Studio XXVII — Design System Companion

Este documento é o guia de design legível para humanos e equipa de desenvolvimento, complementando as instruções de IA em `SKILL.md`.

---

## 🏛️ Filosofia Visual: "O Selo XXVII"

O design do **Studio XXVII** foi concebido como um selo editorial clássico:
- Superfícies escuras em **Noir Carvão (`#141210`)** transmitem sofisticação e masculinidade clássica.
- O **Creme Quente (`#f6f1e7`)** substitui o branco frio, dando uma sensação tátil de papel de catálogo.
- O **Dourado Nobre (`#c9a35f`)** atua como uma pontuação rara que atrai o olhar para o essencial: preços, ações principais e confirmações.

---

## 🎨 Especificação de Tokens

### Cores Principais
- **Noir:** `#141210` (Fundo primário escuro)
- **Creme:** `#f6f1e7` (Fundo primário claro)
- **Creme Cartão:** `#efe7d6` (Inputs e slots de horário)
- **Dourado:** `#c9a35f` (Acentos, botões primários, seleções)
- **Dourado Escuro:** `#856526` (Texto dourado sobre fundo claro com contraste acessível)
- **Texto:** `#201c17` (Texto principal escuro)
- **Linha:** `#e4dbc8` (Bordas e divisórias suaves)

### Tipografia
- **Títulos e Declarações:** `Playfair Display` (Serifa de alto impacto).
- **Interface e Leitura:** `Inter` (Sans-serif funcional e limpo).

### Geometria
- **Botões e Badges:** Pílula (`999px`) e Círculos (`50%`).
- **Cartões:** Arredondados (`16px–20px`).
- **Fotografia:** Cantos quase retos (`4px`), criando contraste intencional com os botões redondos.

---

## 📱 Mobile-First & Responsividade

O percurso de marcação pública (`/marcar`) foi desenhado para ser realizado com um polegar em ecrãs móveis:
- Cartões táteis com feedback visual instantâneo.
- Grelha de horas espaçada e fácil de clicar.
- Barra inferior fixa que mantém o total e o botão de continuar sempre ao alcance do utilizador.

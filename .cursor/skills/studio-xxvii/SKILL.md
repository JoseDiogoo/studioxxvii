---
name: Studio XXVII
description: Luxury Editorial Barbershop Design System — Noir, Warm Cream, and Accent Gold with bespoke typography and tactile interactions.
slug: studio-xxvii
version: 1.0.0
author: Studio XXVII Engineering
---

# Studio XXVII — AI Design System Skill

When writing UI code (HTML, CSS, Tailwind, CSS Modules, React, Next.js) for the **Studio XXVII** project, you MUST strictly adhere to the following brand identity, token system, component patterns, accessibility standards, and quality gates.

---

## 1. Brand & Mission

- **Brand Name:** Studio XXVII
- **Core Positioning:** Luxury editorial barbershop in Alcobaça (Portugal) — bespoke craftsmanship, precision grooming, timeless elegance.
- **Brand Taglines:**
  - *"Born to be different"* (Hero statement)
  - *"Criando identidades."* (Sub-statement, italic serif)
  - *"Não é só sobre o corte."* (Brand philosophy)
- **Visual North Star:** *"O Selo XXVII"* (The XXVII Seal) — A refined circular coin/seal aesthetic on charcoal and warm cream, with rare accents of gold.

---

## 2. Style Foundations

### 2.1 Color Palette & Semantic Tokens
The palette is strictly restricted to a Noir / Cream / Gold triad. **No secondary or neon colors allowed.**

| Token | Hex Value | Usage / Semantics |
| :--- | :--- | :--- |
| `color-noir` | `#141210` | Primary dark surface, hero background, footer, team dashboard surface. (Never `#000000`). |
| `color-noir-soft` | `#1d1a15` | Radial gradients, subtle dark overlays. |
| `color-cream` | `#f6f1e7` | Default light page background. |
| `color-cream-card` | `#efe7d6` | Form input backgrounds, unselected time slots, card depth. |
| `color-gold` | `#c9a35f` | **The Single Accent**: Primary CTAs, active selections, price tags, brand seal glow. |
| `color-gold-hover` | `#d9b46f` | Button hover state, focus rings. |
| `color-gold-dark` | `#856526` | High-contrast gold text on light cream backgrounds (WCAG AA ≥ 4.5:1). |
| `color-text` | `#201c17` | High-contrast body and heading text on cream surfaces. |
| `color-text-muted` | `#6b6255` | Secondary metadata (durations, address, helper text). |
| `color-border` | `#e4dbc8` | Dividers, card borders, subtle grid lines. |

#### ⚠️ The Rare Gold Rule
Gold covers **less than 10%** of any screen. It is used as punctuation (CTAs, prices, selected slots), **never as a full background fill for large sections or cards**.

---

### 2.2 Typography Scale
- **Display / Editorial Font:** `Playfair Display`, `Georgia`, serif
- **Interface / Body Font:** `Inter`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, sans-serif

| Level | Font Family | Weight | Size / Line-Height | Tracking | Context |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display** | Playfair Display | 700 | `clamp(2.6rem, 7vw, 5.2rem)` / 1.02 | 0.01em | Homepage Hero headline only |
| **Headline** | Playfair Display | 700 | `clamp(2.0rem, 4vw, 2.9rem)` / 1.10 | 0.00em | Section titles ("Serviços", "Onde estamos") |
| **Title** | Playfair Display | 700 | `1.35rem` / 1.25 | 0.00em | Booking step titles, service names, card headers |
| **Price** | Playfair Display | 700 | `1.25rem - 1.5rem` / 1.00 | 0.00em | Service price numbers (always in gold) |
| **Body** | Inter | 400 | `1.00rem - 1.05rem` / 1.70 | normal | Paragraphs, descriptions, instructions |
| **Label / Kicker** | Inter | 700 | `0.68rem - 0.75rem` / 1.00 | **0.20em - 0.30em** | Uppercase kickers, table headers, info chips |

#### ⚠️ The One Display Rule
`Playfair Display` is exclusively used for editorial statements (Headlines, Titles, Prices, Logo). **Never** use serif fonts for body text, form inputs, button labels, or microcopy.

---

### 2.3 Shapes & Geometry
- **Interactive Elements:** Full Pill (`border-radius: 999px`) for all action buttons; Perfect Circle (`50%`) for avatar badges, calendar days, checkboxes.
- **Card Containers:** Rounded (`border-radius: 16px - 20px`) for physical paper-like cards floating on cream.
- **Photography / Assets:** Sharp Editorial (`border-radius: 4px`) to create intentional contrast between soft tactile UI and crisp barbershop photography.

---

### 2.4 Shadows & Elevation
- **Card Elevation:** `box-shadow: 0 20px 48px -20px rgba(20, 18, 16, 0.22), 0 1px 2px rgba(20, 18, 16, 0.06);` (Diffuse, soft ambient light; never harsh or close).
- **Dark Floating Panel:** `box-shadow: 0 20px 48px -20px rgba(0, 0, 0, 0.60);`

---

## 3. Component Families & Patterns

### 3.1 Buttons
- **Primary CTA (`botaoOuro`):**
  - Background: `#c9a35f`, Text: `#141210`, Weight: 700, Radius: `999px`, Padding: `12px 28px`.
  - Hover: Background `#d9b46f`, Transform: `translateY(-1px)`.
- **Secondary / Step Action (`botao`):**
  - Background: `#141210`, Text: `#ffffff`, Weight: 600, Radius: `999px`.
- **Outline Button (`botaoContorno`):**
  - Background: `transparent`, Border: `1px solid var(--color-border)`, Text: `#201c17` (or `#f6f1e7` on dark).
  - Hover: Border `#c9a35f`, Text `#c9a35f`.

### 3.2 Service Selection Card (`/marcar`)
- Card surface: `#ffffff`, Border: `1px solid rgba(20,18,16,0.06)`, Radius: `16px`.
- Selected state: Border: `2px solid #c9a35f`, subtle background tint.
- Circular checkbox: `22px` diameter, gold checkmark when active.

### 3.3 Time Slot Grid & Date Picker
- Slots arranged in 3 to 4 column responsive grid.
- Available slot: `#efe7d6` background, `#201c17` text, `border-radius: 999px`.
- Selected slot: `#c9a35f` background, `#141210` bold text.
- Disabled/Past slot: Opacity `0.35`, line-through or cursor `not-allowed`.

### 3.4 Floating Bottom Bar (`BarraFixa`)
- `position: fixed; bottom: 0; left: 0; right: 0;`
- Background: `rgba(20, 18, 16, 0.92)` on dark or `rgba(246, 241, 231, 0.92)` with `backdrop-filter: blur(12px)`.
- Shows running total in bold gold and action button ("Continuar" / "Confirmar marcação").

---

## 4. Accessibility & UX Standards

- **WCAG 2.2 AA Compliance:**
  - Gold text on white/cream surfaces MUST use `color-gold-dark` (`#856526`) to achieve ≥ 4.5:1 contrast.
  - White or dark text on Gold buttons (`#c9a35f`) MUST use Noir `#141210` (achieves > 8:1 contrast).
- **Touch Targets:** All clickable interactive elements (buttons, slots, checkboxes) MUST be at least `44px x 44px`.
- **Keyboard Navigation:** Explicit `:focus-visible` styles with `outline: 2px solid #c9a35f` and `outline-offset: 2px`.
- **Motion Safety:** Respect `prefers-reduced-motion: reduce` on all rotating 3D animations and transitions.

---

## 5. Writing & Content Tone (Portuguese / PT)

- **Voice:** Confident, warm, premium, concise.
- **Language:** European Portuguese (PT-PT) with natural phrasing (e.g., *"Escolhe os serviços"*, *"Marcação confirmada"*, *"Até já!"*).
- **Clarity on Pricing:** State clearly that payments are made in-person: *"Total a pagar na barbearia"*. **Never mention online advance payments or card inputs.**

---

## 6. Do's & Don'ts

### ✅ DO:
1. **DO** maintain the Noir (`#141210`), Cream (`#f6f1e7`), and Gold (`#c9a35f`) triad strictly.
2. **DO** use `Playfair Display` for bold headlines, titles, and prices; `Inter` for all UI interactions and body text.
3. **DO** make all action buttons full pills (`border-radius: 999px`).
4. **DO** maintain subtle, diffuse shadows on physical white cards over cream backgrounds.
5. **DO** make the booking flow instant, self-service, and complete in under 60 seconds.

### ❌ DON'T:
1. **DON'T** introduce secondary colors (no blue, purple, green, or neon tones).
2. **DON'T** use pure black (`#000000`) — always use charcoal Noir (`#141210`).
3. **DON'T** fill large background areas with solid gold (The Rare Gold Rule).
4. **DON'T** introduce payment gateway inputs or online card charging in the public booking flow.
5. **DON'T** use harsh 1px black drop shadows or sharp square buttons.

---

## 7. Quality Gates for UI Code Review

Before finalizing any UI component:
- [ ] Are all color tokens sourced from the Noir/Cream/Gold triad?
- [ ] Is Playfair Display used only for titles/prices and Inter for UI/inputs?
- [ ] Do all interactive buttons have `border-radius: 999px`?
- [ ] Is touch target size ≥ 44px on mobile viewports?
- [ ] Does the contrast ratio pass WCAG 2.2 AA?
- [ ] Is copy in clean PT-PT without advance payment references?

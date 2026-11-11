# Studio XXVII — Barber Flow

Plataforma de marcações e gestão para a barbearia **Studio XXVII** (Alcobaça, Portugal), construída seguindo os princípios de **Clean Architecture** (Arquitetura Limpa).

---

## 🏛️ Arquitetura do Projeto

O projeto adota uma arquitetura em camadas concêntricas onde o Domínio é 100% puro e desacoplado:

- **`webapp/src/domain/`**: Entidades, Objetos de Valor, Interfaces de Repositório e Serviços de Domínio Puros (sem dependências de DB ou Frameworks).
- **`webapp/src/application/`**: Casos de Uso (*Use Cases*), DTOs e Portas para Gateways externos.
- **`webapp/src/infrastructure/`**: Persistência em PostgreSQL (Repositórios), Twilio WhatsApp, Bcrypt e utilitários.
- **`webapp/src/presentation/`**: Controllers e Validações Zod para a Web API.
- **`webapp/app/`**: Next.js 15 App Router com rotas finas de API e páginas UI (`/marcar`, `/equipa`).
- **`docs/`**: Documentação centralizada e organizada por áreas (Arquitetura, Produto, Design, Planeamento, Deploy, API).

---

## 📚 Documentação

Toda a documentação do projeto está organizada na pasta [`docs/`](./docs/README.md):

- [🏛️ Guia de Clean Architecture](./docs/architecture/CLEAN_ARCHITECTURE.md)
- [✂️ Visão e Regras do Produto](./docs/product/PRODUCT.md)
- [📅 Plano e Decisões de Desenvolvimento](./docs/planning/PLANO-MARCACAO-STUDIO-XXVII.md)
- [🎨 Guia de Design e Estilo](./docs/design/DESIGN.md)
- [🚀 Manual de Deploy em Produção](./docs/deployment/DEPLOY.md)

---

## 🚀 Como Executar o Projeto

```bash
cd webapp
npm install
npm run dev
```

Acede a:
- **Página Pública de Marcações**: `http://localhost:3000/marcar`
- **Área da Equipa (Admin)**: `http://localhost:3000/equipa`

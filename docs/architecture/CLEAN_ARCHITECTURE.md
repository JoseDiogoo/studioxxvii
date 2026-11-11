# Guia de Arquitetura Limpa (Clean Architecture) - Studio XXVII

Este documento descreve a arquitetura limpa implementada no projeto **Barber Flow / Studio XXVII**, detalhando as camadas, regras de dependência, padrões de design e o isolamento entre domínio de negócio e infraestrutura (PostgreSQL, gateways externos, UI).

---

## 1. Princípios Fundamentais

A **Clean Architecture** (Robert C. Martin) tem como objetivo primordial criar sistemas que sejam:
1. **Independentes de Frameworks**: A arquitetura não depende da existência de bibliotecas de software ou frameworks externos.
2. **Testáveis**: As regras de negócio podem ser testadas sem a UI, a base de dados, o servidor web ou qualquer elemento externo.
3. **Independentes da UI**: A interface gráfica pode mudar facilmente sem alterar o resto do sistema.
4. **Independentes da Base de Dados**: A base de dados (PostgreSQL) pode ser substituída sem afetar as regras de negócio.
5. **Independentes de Qualquer Agente Externo**: As regras de negócio desconhecem as interfaces com o mundo exterior (WhatsApp, etc.).

### A Regra de Dependência
> **As dependências do código-fonte só podem apontar para dentro, em direção às políticas de nível superior (Domínio).**

```text
┌────────────────────────────────────────────────────────┐
│  Web API & Presentation (Next.js Routes, UI, Pages)    │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Infrastructure (PostgreSQL, Gateways, Adapters) │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │  Application (Use Cases, DTOs, Ports)      │  │  │
│  │  │  ┌──────────────────────────────────────┐  │  │  │
│  │  │  │  Domain (Entities, VOs, Services)    │  │  │  │
│  │  │  └──────────────────────────────────────┘  │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

---

## 2. Camadas da Arquitetura

### 2.1 Camada de Domínio (`domain/`)
Contém a lógica de negócio essencial e os modelos centrais da barbearia. Esta camada **não tem dependências externas**.

- **Entities (`domain/entities/`)**:
  - `Agendamento`: Representa uma marcação de serviço associada a um cliente, colaborador, data, horário e valor.
  - `Cliente`: Representa um cliente da barbearia com nome, contacto telefónico e observações.
  - `Colaborador`: Representa um profissional/barbeiro, credenciais e integrações.
  - `Servico`: Representa um serviço oferecido (ex.: Corte, Barba, Combo), preço e duração.
  - `Horario`: Intervalo de disponibilidade de trabalho por dia da semana.
  - `Salao`: Dados do estabelecimento Studio XXVII.
- **Value Objects (`domain/value-objects/`)**:
  - `HorarioSlot`: Representa um bloco de tempo (ex.: `10:00 - 10:45`).
  - `Telefone`: Validação e normalização de números telefónicos (+351).
  - `StatusAgendamento`: Enumeração dos estados (`CONFIRMADO`, `CANCELADO`, `CONCLUIDO`).
- **Repository Interfaces / Ports (`domain/repositories/`)**:
  - `IAgendamentoRepository`
  - `IClienteRepository`
  - `IColaboradorRepository`
  - `IServicoRepository`
  - `IHorarioRepository`
  - `ISalaoRepository`
- **Domain Services (`domain/services/`)**:
  - `CalculadoraDisponibilidadeService`: Lógica pura em memória para cálculo de slots disponíveis, interseção de horários de colaboradores e marcações já existentes.
- **Domain Errors (`domain/errors/`)**:
  - `DomainError`, `SlotIndisponivelError`, `EntidadeNaoEncontradaError`, `RegraNegocioError`.

---

### 2.2 Camada de Aplicação (`application/`)
Orquestra o fluxo de dados entre o Domínio e os mecanismos de entrega/infraestrutura. Implementa os **Casos de Uso (Use Cases)**.

- **Use Cases (`application/use-cases/`)**:
  - **Agendamento**:
    - `CriarAgendamentoPublicoUseCase`: Orquestra a verificação de disponibilidade, criação do cliente (um cliente existente nunca é alterado), criação transacional do agendamento e notificação por WhatsApp.
    - `AtualizarAgendamentoEquipaUseCase`: Mover, trocar de profissional, cancelar/reativar, registar pagamento e observações; mover/reativar verifica conflitos com bloqueio e notifica o cliente.
  - **Disponibilidade**:
    - `ObterDiasDisponiveisUseCase`: Dias com horários livres para os serviços escolhidos.
    - `ObterHorasDisponiveisUseCase`: Slots horários livres num dia específico.
  - **Colaborador**:
    - `AutenticarColaboradorUseCase`: Validação de login com hash segura.
- **Ports (`application/ports/`)**:
  - `INotificationGateway`: Contrato para envio de SMS/WhatsApp.
  - `IPasswordHasher`: Contrato para hash e verificação de passwords.
- **DTOs (`application/dtos/`)**:
  - `CriarAgendamentoDTO`, `DisponibilidadeDTO`, `AgendamentoResponseDTO`.

---

### 2.3 Camada de Infraestrutura (`infrastructure/`)
Implementa as interfaces e contratos definidos pelo Domínio e Aplicação, conectando-se a tecnologias concretas.

- **Base de Dados (`infrastructure/database/`)**:
  - Conexão e cliente PostgreSQL (`postgres.js` / cliente prisma configurado para PostgreSQL).
  - **Repositórios PostgreSQL (`infrastructure/database/repositories/`)**:
    - `PostgresAgendamentoRepository`: Consultas, filtros por intervalo e transações em PostgreSQL.
    - `PostgresClienteRepository`: Busca e *upsert* de clientes por telefone e salão.
    - `PostgresColaboradorRepository`: Busca de profissionais ativos e credenciais.
    - `PostgresServicoRepository`: Listagem de serviços ativos.
    - `PostgresHorarioRepository`: Gestão de grelha de horários de trabalho.
    - `PostgresSalaoRepository`: Gestão dos dados da barbearia.
- **Gateways Externos (`infrastructure/gateways/`)**:
  - `TwilioWhatsAppGateway`: Implementação de `INotificationGateway` via API da Twilio.
  - `BcryptPasswordHasher`: Implementação de `IPasswordHasher` usando `bcryptjs`.
- **Segurança & Utilitários (`infrastructure/security/` & `infrastructure/utils/`)**:
  - `RateLimiter`: Proteção contra força bruta e spam em marcações.
  - `DateUtil` & `TimezoneUtil`: Manipulação segura de fusos horários (Europe/Lisbon).

---

### 2.4 Camada de Apresentação / Web API (`presentation/` & `app/api/`)
Recebe os pedidos HTTP externos, valida a entrada, executa os casos de uso e devolve a resposta no formato adequado.

- **Controllers (`presentation/controllers/`)**:
  - `AgendamentoController`
  - `DisponibilidadeController`
  - `ColaboradorController`
  - `ServicoController`
  - `SalaoController`
- **Validação (`presentation/validation/`)**:
  - Schemas Zod (`marcarSchema`, `loginSchema`, `reagendarSchema`, `perfilSchema`).
- **Rotas Next.js App Router (`app/api/**`)**:
  - Atuam como *Thin Route Handlers*, delegando a execução para os respetivos controllers.

---

## 3. Resumo da Organização de Documentação (`docs/`)

| Pasta | Conteúdo |
| :--- | :--- |
| `docs/architecture/` | Guia Clean Architecture, diagramas de classes e sequências (`UML.drawio`). |
| `docs/product/` | Especificação do produto Studio XXVII (`PRODUCT.md`), personas e fluxos. |
| `docs/planning/` | Plano de desenvolvimento e roadmap (`PLANO-MARCACAO-STUDIO-XXVII.md`). |
| `docs/design/` | Guia de identidade visual, cores, tipografia (`DESIGN.md`, `DESIGN.fig`). |
| `docs/api/` | Especificação e coleções de endpoints (`Insomnia.json`). |
| `docs/deployment/` | Instruções de deploy em VPS, Nginx, PostgreSQL e Systemd (`DEPLOY.md`). |
| `docs/legacy/` | Histórico dos módulos legados (Express, MongoDB, CRA, React Native). |

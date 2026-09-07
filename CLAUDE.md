# Ronas Desk

Sistema de chamados (service desk) com portal do cliente. Monorepo com dois
aplicativos independentes: `backend/` (API REST) e `frontend/` (SPA).

`AGENTS.md` é a fonte de regras de processo — forma de trabalho, segurança,
validação e Git. Este arquivo cobre a camada técnica e não repete aquilo.

## Stack

- **Backend** — Node.js (ESM) + Express 5, MySQL via `mysql2`, JWT
  (`jsonwebtoken`) + `bcryptjs`, `helmet`, `cors`, `express-rate-limit`,
  `multer` + Cloudinary para anexos
- **Frontend** — Vite + React 19 (JavaScript, sem TypeScript), `axios`,
  `lucide-react`, CSS puro com custom properties (sem Tailwind, sem UI kit)
- **Package manager** — npm, com `package.json` próprio em cada aplicativo
- **Lint/format** — `eslint` + `prettier` no backend, `oxlint` no frontend
- **Testes** — `node --test` no backend, `vitest` no frontend

## Estrutura

```
backend/src/    routes → controllers → services / models → database
backend/sql/    migrations numeradas (000_, 001_, ...)
backend/test/            testes unitários (npm test)
backend/test-integration/ integração com MySQL real (npm run test:integration)
frontend/src/   pages/ components/ context/ hooks/ services/ utils/
docs/adr/       decisões de arquitetura
docs/testing.md estratégia de testes
```

## Convenções do backend

- **Camadas.** A rota só declara caminho e middlewares; o controller valida
  entrada e monta a resposta HTTP; o service concentra regra de negócio; o
  model é o único lugar com SQL. Não pule camadas.
- **SQL sempre parametrizado** (`?`), nunca interpolado.
- **Toda função de model aceita `executor = pool`** como último parâmetro. É
  isso que permite reusá-la dentro de uma transação — quem abre a transação
  (`pool.getConnection()` + `beginTransaction()`) passa a conexão adiante.
  Gravações relacionadas precisam de transação.
- **Erro sempre responde `{ status: 'erro', message }`**, com `code` quando o
  frontend precisa distinguir o caso (ex.: `DEMO_READ_ONLY`).
- **`criarApp({ database, variaveis })`** é factory com injeção de dependência,
  e os middlewares seguem o mesmo padrão (`criarXMiddleware({ ... })`). É o que
  torna os testes possíveis sem subir banco — preserve esse formato.
- **Autorização é por middleware**, não por `if` dentro do controller:
  `authMiddleware`, `adminMiddleware`, `equipeMiddleware`,
  `portalClienteMiddleware`, `demoReadOnlyMiddleware`.

## Convenções do frontend

- **Nenhum componente fala com `axios` direto.** Tudo passa por
  `services/apiClient.js`, que injeta o token, trata 401 (limpa sessão e
  dispara `EVENTO_SESSAO_EXPIRADA`) e normaliza o erro num `Error` com
  `.status`. Os módulos `services/*Api.js` são funções finas nomeadas com
  sufixo `Api`.
- **Estado compartilhado vive em `context/`** (`AuthContext`,
  `CompanyBrandContext`), consumido pelos hooks de `hooks/`.
- **CSS é por componente/página**, um arquivo ao lado do `.jsx`. Não há
  utilitários globais além dos tokens.

## Design system

Os tokens ficam em `frontend/src/index.css`, no `:root`. **Use o token, não o
valor literal** — cor, raio, espaçamento, tipografia, sombra, foco e movimento
já têm escala definida.

- **Tipografia** — `--text-2xs` a `--text-3xl` (11 → 32px). Nove degraus, todos
  em pixel inteiro com raiz de 16px. Não introduza tamanho fora da escala.
- **Espaçamento** — `--space-1` a `--space-12`, base 4px.
- **Breakpoints** — apenas quatro: `600px` (conteúdo empilha), `900px` (a
  sidebar colapsa), `1200px`, `1440px`. O racional de cada um está comentado no
  `index.css`.
- **Foco** — `index.css` tem um piso global com `:where()` (especificidade
  zero) que dá anel de foco a todo elemento interativo. Componente pode
  sobrescrever, mas o anel precisa manter 3:1 de contraste (WCAG 2.4.11); use
  `--focus-outline-color` e, sobre fundo escuro, `--focus-outline-color-inverse`.
- Raios fora da escala (7/9/11/13/15/17/22px) ainda existem em telas legadas e
  devem migrar em passada de QA visual dedicada, não por substituição
  automática.

## Vocabulário do domínio

O código é escrito em português — arquivos, funções, variáveis e colunas.
Mantenha assim.

- **Cargos** — `Administrador`, `Atendente`, `Cliente` (Cliente entra no portal,
  não no painel)
- **Status de chamado** — `Novo`, `Em Atendimento`, `Aguardando Cliente`,
  `Resolvido`, `Fechado`, `Cancelado`
- **Prioridades** — `Crítica`, `Alta`, `Média`, `Baixa`
- **Categorias** — `Hardware`, `Software`, `Rede`, `Acesso`, `Outro`

## Regras inegociáveis

- **Migrations são aditivas e imutáveis.** Nunca edite nem reescreva um arquivo
  de `backend/sql/` já aplicado; crie o próximo número da sequência.
- **O prazo de SLA vem de `config/sla.js`**, derivado da prioridade. O cálculo
  por chamado é `slaService` (JavaScript); filtros e agregados são SQL, e os
  limites estão duplicados num `CASE` em `chamadoModel.js` — mudar um sem o
  outro faz a lista discordar do badge. Nunca recalcule prazo no frontend.
- **A conta de demonstração é somente leitura, e isso é garantido no servidor**
  (`demoReadOnlyMiddleware`). Esconder o botão no frontend não substitui a
  checagem.
- **Chamado resolvido tem histórico auditável** (ver ADR 0005); alterações de
  status passam pelo registro de histórico.
- **Nenhum segredo em código.** Tudo em `.env`, documentado em `.env.example`.
- A suíte de integração só roda contra banco descartável cujo `DB_NAME` termina
  em `_test` — ela dá `TRUNCATE` nas tabelas.

## Comandos

```bash
# backend
npm run dev --prefix backend          # nodemon
npm test --prefix backend             # node --test (unitários)
npm run test:integration --prefix backend  # exige MySQL descartável
npm run lint --prefix backend
npm run migrate --prefix backend

# frontend
npm run dev --prefix frontend
npm run build --prefix frontend
npm run test --prefix frontend        # vitest
npm run lint --prefix frontend        # oxlint
```

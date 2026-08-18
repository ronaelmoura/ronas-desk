# Security Audit — Ronas Desk

Auditoria de segurança básica realizada em 2026-08-18 no backend (Node.js/Express + MySQL, driver `mysql2`) e frontend (React/Vite) do projeto **Ronas Desk**, sistema de gestão de chamados em produção.

Nenhum risco **alto** foi encontrado. Dois pontos de risco **médio** foram identificados e devem ser tratados antes de expor mais o sistema.

## Resumo

| # | Item | Status |
|---|------|--------|
| 1 | Injeção SQL | ✅ OK |
| 2 | Autenticação e sessão | ✅ OK |
| 3 | Validação de entrada | 🟡 Médio |
| 4 | Controle de acesso | ✅ OK |
| 5 | Exposição de dados | ✅ OK |
| 6 | Headers de segurança | ✅ OK |
| 7 | CORS | ✅ OK |
| 8 | Dependências (`npm audit`) | 🟡 Médio |
| 9 | Variáveis de ambiente | ✅ OK |
| 10 | Rate limiting | 🟡 Médio |

## Detalhes

### 1. Injeção SQL — ✅ OK
Todas as queries usam `mysql2` com placeholders (`?`) e bind parameters. Trechos de string interpolados nas queries (ex: `usuarioModel.js:55`) são cláusulas fixas (`'WHERE nome LIKE ? OR email LIKE ?'`), nunca dados do usuário diretamente concatenados. Mesmo padrão em `clienteModel.js`, `relatorioModel.js`, `chamadoModel.js`.

### 2. Autenticação e sessão — ✅ OK
- Senhas com `bcryptjs`, custo 12 (`authController.js:296`).
- JWT assinado com `HS256`, segredo vindo de `JWT_SECRET` (env), expiração configurável via `JWT_EXPIRES_IN` (padrão 8h) (`authController.js:150`).
- Rate limiting de login: `loginRateLimitMiddleware.js`, aplicado em `/api/auth/login` e `/api/auth/demo` (`app.js:60-67`), padrão 5 tentativas/15min.

### 3. Validação de entrada — 🟡 Risco médio
Não há biblioteca de schema (zod/joi/express-validator); validação é manual (`typeof x === 'string'`, checagem de tamanho) em cada controller. Está consistente nos controllers analisados, mas não há uma camada obrigatória — uma rota nova pode facilmente esquecer a validação.

**Correção sugerida:** adotar `zod` com schemas por rota, aplicados via middleware genérico:

```js
// exemplo: middlewares/validate.js
import { z } from 'zod';

export const validate = (schema) => (req, res, next) => {
  const resultado = schema.safeParse(req.body);
  if (!resultado.success) {
    return res.status(400).json({ erro: resultado.error.flatten() });
  }
  req.body = resultado.data;
  next();
};

// uso na rota
const alterarSenhaSchema = z.object({
  senhaAtual: z.string().min(1),
  novaSenha: z.string().min(8),
});
router.put('/usuarios/senha', validate(alterarSenhaSchema), authController.alterarSenha);
```

### 4. Controle de acesso — ✅ OK
`authMiddleware` + `equipeMiddleware` protegem rotas de equipe (`/api/chamados`, `/api/clientes`, `/api/dashboard`, `/api/usuarios`, `/api/relatorios`, `/api/notificacoes`, `/api/avaliacoes`). `adminMiddleware` protege ações admin-only. Checagem de posse de dados existe no portal do cliente (`portalClienteController.js:204`): `chamado.cliente_id !== request.usuario.cliente_id`. Rotas públicas sem middleware (registro de visita, dados públicos da empresa) são intencionalmente públicas; suas contrapartes de escrita/admin são protegidas.

### 5. Exposição de dados — ✅ OK
Nenhum segredo hardcoded encontrado em arquivos versionados. `backend/src/config/database.js` usa apenas variáveis de ambiente. Scripts PowerShell de criação/reset de admin (`scripts/*.ps1`) usam `Read-Host -AsSecureString` ou geram segredos aleatórios, sem senhas fixas no código.

### 6. Headers de segurança — ✅ OK
`helmet` aplicado em `app.js:44` com CSP customizada (`config/security.js`), incluindo `upgradeInsecureRequests` em produção.

### 7. CORS — ✅ OK
Origem controlada via `CORS_ORIGIN` (env). Em produção, se não definida, o middleware CORS é desativado (same-origin apenas, já que o frontend é servido pelo mesmo Express). Sem wildcard `*`.

### 8. Dependências — 🟡 Risco médio
- Backend (`npm audit --omit=dev`): **0 vulnerabilidades**.
- Frontend (`npm audit --omit=dev`): **2 altas** — `react-router`/`react-router-dom` (7.12.0–7.18.1), advisory de bypass de CSRF (GHSA-qwww-vcr4-c8h2). Auditoria completa (incl. devDependencies) também aponta `nanoid` (alta) e `postcss` (moderada), ambas apenas em ferramentas de build, não distribuídas ao usuário final.

**Correção:** atualizar `react-router`/`react-router-dom` no frontend para uma versão corrigida:

```bash
cd frontend
npm audit fix
# ou, se necessário, atualizar manualmente:
npm install react-router-dom@latest
```

### 9. Variáveis de ambiente — ✅ OK
`.gitignore` inclui `.env` e `.env.*`, com exceções explícitas para `.env.example` e `.env.docker.example`. `git ls-files | grep -i env` confirma que nenhum `.env` real está versionado.

### 10. Rate limiting — 🟡 Risco médio
Existe rate limiting em rotas específicas: login (5/15min), assistente de IA (`assistenteIaRateLimitMiddleware`) e registro de visitas (30/min). Não há, porém, um limitador geral para o restante da API (`/api/chamados`, `/api/clientes`, `/api/usuarios`, etc.) — endpoints autenticados dependem apenas do JWT, sem limite de throughput.

**Correção sugerida:** adicionar um rate limiter global antes dos grupos de rotas autenticadas:

```js
// app.js
import rateLimit from 'express-rate-limit';

const limiteGeralApi = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300, // por IP
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiteGeralApi);
```

## O que foi verificado

Análise estática do código-fonte (backend e frontend), configuração de segurança (`helmet`, CORS, JWT, bcrypt), middlewares de autenticação/autorização e rate limiting, `.gitignore`/arquivos versionados, e `npm audit` em ambos os pacotes.

## O que foi corrigido nesta rodada

Nada foi alterado no código ainda — este documento lista os achados e as correções recomendadas, a serem aplicadas pelo mantenedor.

---
*Auditoria gerada com apoio de IA (Claude) em 2026-08-18. Recomenda-se revisão periódica e testes de penetração para validação adicional antes de expandir o escopo de produção.*

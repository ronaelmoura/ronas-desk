# Estratégia de testes

## Testes unitários

Os testes unitários cobrem serviços, models, middlewares e controllers de forma isolada quando o comportamento pode ser validado sem depender de infraestrutura externa. Essa abordagem permite verificar regras de negócio e respostas HTTP esperadas em cenários específicos, como autenticação, autorização, validação de payload e transições de status.

## Testes de componente / integração HTTP

Alguns testes sobem a aplicação Express real e fazem requisições HTTP usando `fetch` em uma porta aleatória. Esse padrão é usado para validar rotas protegidas, respostas de erro e a composição real da aplicação sem introduzir infraestrutura de banco em ambiente de testes.

O banco pode continuar substituído nesses testes; a intenção não é simular uma instância real de MySQL, mas provar o comportamento do app e das camadas de middleware/roteamento.

## Integração com banco real

Existe uma suíte de integração em `backend/test-integration/` que roda contra um MySQL real, aplicando as migrations de `backend/sql/` de verdade e batendo nos endpoints HTTP através da aplicação Express real (sem mocks de banco). Ela cobre:

- **Autenticação** (`auth.integration.js`): login com credenciais corretas, senha errada, usuário inativo e `GET /api/auth/me` com token real, validando o fluxo completo de bcrypt + consulta ao MySQL + emissão de JWT.
- **Autorização** (`permissoes.integration.js`): confirma contra o banco real que só Administrador cria usuário, que `/api/dashboard` é exclusivo da equipe, que o portal do cliente exige cadastro de cliente ativo vinculado, e que a conta de demonstração não pode alterar o próprio perfil.
- **SLA** (`sla.integration.js`): insere chamados com timestamps fixos e confirma que o `TIMESTAMPDIFF`/`CASE` calculado pelo MySQL real bate com os números esperados (SLA vencido, próximo do vencimento, tempo médio de resolução e de primeira resposta).

Essa suíte é **separada** dos testes unitários de propósito: fica em `backend/test-integration/` (fora de `backend/test/`) e só roda com `npm run test:integration`, nunca com `npm test`. Isso existe porque ela depende de infraestrutura externa (um MySQL disponível) que a maioria dos ambientes de desenvolvimento e o CI padrão não têm configurada, e porque testes de integração são mais lentos e não devem bloquear o ciclo rápido dos testes unitários.

Para rodar localmente, é preciso um MySQL acessível e as variáveis `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_PORT` e `DB_NAME` apontando para um **banco descartável**, nunca para produção ou para o banco do Aiven. Por segurança, `backend/test-integration/helpers.js` se recusa a rodar se `DB_NAME` não terminar em `_test` — isso reduz (mas não elimina) o risco de truncar dados reais por engano. Cada teste roda `TRUNCATE` nas tabelas da aplicação antes da próxima execução, então o banco de teste é sempre descartável e nunca deve conter dados que importam.

Essa suíte ainda não está integrada ao GitHub Actions (`.github/workflows/ci.yml`), porque isso exigiria subir um serviço MySQL no CI. É uma extensão natural, mas foi deixada de fora deliberadamente nesta etapa para não acoplar essa decisão de infraestrutura sem avaliação separada.

## Frontend

Ainda não existe suíte automatizada do frontend.

## E2E

Ainda não existe teste E2E/browser.

## Cobertura

Os comandos disponíveis são:

- `npm test`
- `npm run test:coverage`
- `npm run test:coverage:ci`
- `npm run test:integration` (requer um MySQL descartável configurado por variáveis de ambiente; veja "Integração com banco real" acima)

A medição real usa `c8` com `--all` para contabilizar todos os arquivos de `src`, inclusive aqueles não carregados diretamente pelos testes. Isso evita o problema de cobertura artificial em que o Node só mede arquivos importados durante a execução.

Cobertura medida com a configuração completa atual do backend (sem exclusões de produção):

- linhas: 79.02%
- branches: 79.56%
- funções: 83.27%
- statements: 79.02%

Os thresholds de qualidade da branch continuam sendo:

- linhas: 60%
- funções: 65%
- branches: 75%

A cobertura real atinge a meta nas três dimensões (`npm run test:coverage:ci` passa), mas o gate deve continuar sendo tratado como indicador de qualidade, e não como uma métrica de marketing. Os controllers que antes não tinham nenhum teste (`anexosController.js`, `avaliacoesController.js`, `chamadoInteracoesController.js`, `assistenteIaController.js`, `notificacoesController.js`) agora estão cobertos. Ainda há lacunas conhecidas: `portalClienteController.js` (32%), `dashboardController.js` (56%) e `authController.js` (63%) têm cobertura parcial, e os scripts de linha de comando em `src/scripts` (usados manualmente, não pela aplicação) continuam sem testes. A cobertura complementa, mas não substitui, testes de comportamento.

A estratégia continua explicitando que:

- a suíte de integração com MySQL real cobre autenticação, autorização e SLA, mas não cobre todos os fluxos (por exemplo anexos e relatórios ainda não têm testes de integração);
- ainda não existe suíte automatizada do frontend;
- ainda não existe teste E2E/browser.

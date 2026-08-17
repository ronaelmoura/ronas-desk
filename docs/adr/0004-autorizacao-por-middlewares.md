# ADR 0004: Autorização composta por middlewares e revalidação no banco

- Status: Aceito
- Tipo: ADR retrospectivo

## Contexto

A aplicação separa claramente autenticação e autorização. No domínio do backend, a autenticação é responsável por identificar quem está fazendo a requisição; a autorização, por verificar se essa pessoa pode executar a operação solicitada. Isso é implementado por uma cadeia de middlewares em `backend/src/app.js` e por validações específicas em `backend/src/middlewares/`.

O fluxo real começa com `authMiddleware.js`, que lê o cabeçalho `Authorization`, exige o esquema `Bearer`, valida o JWT com `HS256` e monta `request.usuario` com os dados do payload. Depois disso, rotas sensíveis acrescentam middlewares como `adminMiddleware`, `equipeMiddleware`, `portalClienteMiddleware` e `demoReadOnlyMiddleware` para revalidar a identidade e as permissões.

A estrutura do projeto não depende exclusivamente das claims antigas do JWT para todas as decisões sensíveis. O código reconsulta o usuário no banco com `usuarioModel.buscarPorId` e valida elementos como:

- conta ativa;
- cargo atual;
- perfil administrador;
- equipe de atendimento;
- usuário demo;
- vínculo do cliente.

Esse padrão era necessário porque a autenticação não deve assumir que um payload antigo ou stale do JWT representa o estado atual de permissão do usuário. A aplicação também usa `demoReadOnlyMiddleware` para impedir que a conta de demonstração execute alterações em operações que não sejam de leitura.

## Decisão

O Ronas Desk usa autorização por middlewares em vez de centralizar permissões exclusivamente em controllers ou em claims do JWT. A autenticação identifica a pessoa e monta o contexto da requisição; a autorização verifica o estado atual do usuário e o escopo da operação com revalidação no banco.

Em código, isso ocorre assim:

- `authMiddleware`: autentica o usuário e identifica a identidade.
- `adminMiddleware`: consulta o usuário ativo, exclui demo e exige cargo `Administrador`.
- `equipeMiddleware`: consulta o usuário ativo e permite apenas quem não é cliente.
- `portalClienteMiddleware`: valida que o usuário está ativo, é cliente e tem cadastro ativo de cliente vinculado.
- `demoReadOnlyMiddleware`: impede alterações em contas de demonstração após confirmar a conta ativa.

Essa decisão reforça a fonte de verdade da regra de autorização no banco, em vez de confiar apenas no conteúdo do token emitido.

## Alternativas consideradas

- Confiar exclusivamente nas claims do JWT: simples, mas frágil quando a conta muda de estado ou o cargo/role muda no banco. O código atual revalida esses dados para evitar permissões desatualizadas.
- Espalhar verificações pelos controllers: facilitaria a lógica por caso, mas dilui autorização no fluxo e torna o processo mais duplicado e difícil de rever.
- Adotar solução completa de RBAC/ABAC: uma abordagem mais formal e extensível, mas não reflete o comportamento atual do sistema, que usa middlewares específicos e consulta ativa no banco para decisões sensíveis.

## Consequências positivas

- A autorização fica mais segura porque a aplicação verifica o estado atual do usuário em vez de confiar apenas em dados antigos do token.
- O sistema pode bloquear contas inativas, clientes sem vínculo e demonstrações apenas de leitura sem depender de uma revisão manual de toda a autenticação.
- A separação por middleware deixa a política de acesso mais legível e alinhada ao fluxo HTTP da aplicação.

## Consequências negativas

- Existem consultas extras ao banco para cada rota protegida, o que aumenta custo de processamento e latência em operações relativamente simples.
- A autorização torna-se mais dependente do estado persistido e exige disciplina no esquema de usuários e cargos.
- O projeto ainda é um modelo de permissões explícitas e por middleware, não uma camada de autorização mais genérica ou dinâmica.

# ADR 0002: Autenticação stateless com JWT

- Status: Aceito
- Tipo: ADR retrospectivo

## Contexto

A autenticação do backend é implementada em `backend/src/controllers/authController.js` e `backend/src/middlewares/authMiddleware.js`. O login valida usuário e senha com `bcryptjs.compare`, gera um token com `jsonwebtoken` e retorna o payload público do usuário em JSON. A assinatura usa `HS256`, o valor do segredo vem de `JWT_SECRET` e o tempo de expiração é configurado por `JWT_EXPIRES_IN`, com fallback para `8h` quando não informado. A configuração do ambiente está em `.env.example` e no `compose.yaml`, onde `JWT_SECRET` e `JWT_EXPIRES_IN` são definidos como variáveis de ambiente do serviço backend.

A API não mantém sessão do lado do servidor. Em vez disso, a autenticação depende de um token enviado no cabeçalho `Authorization` no formato `Bearer <token>`, e o middleware valida a assinatura e o payload para reconstruir o usuário logado pela requisição. Isso é verificado em `authMiddleware.js`, que exige `Authorization: Bearer ...`, verifica `jwt.verify` com a chave `process.env.JWT_SECRET` e aceita apenas payloads que contenham um `id` inteiro positivo.

O projeto também usa `bcryptjs` para armazenar senhas, como verificado em `usuariosController.js` e nos scripts de criação de usuários, o que reforça a decisão de não tratar a senha como dado em texto puro.

## Decisão

O Ronas Desk usa autenticação stateless com JWT. Após o login, o backend emite um token assinado com `HS256` e `JWT_SECRET`; o cliente o envia em `Authorization: Bearer ...` em requisições autenticadas. O payload incluí campos públicos do usuário, como `id`, `nome`, `email`, `cargo` e `cliente_id` quando aplicável, e a expiração é controlada por `JWT_EXPIRES_IN` com padrão atual de `8h` no código e na configuração do ambiente.

A aplicação não implementa refresh token no momento. O fluxo atual é baseado em um token de acesso com vida útil definida e validação local por assinatura e expiração. A ausência de refresh token não é uma contradição do desenho atual; ela é uma limitação deliberada do sistema observado no código.

## Alternativas consideradas

- Sessão server-side: uma alternativa clássica para rastrear o usuário no servidor e permitir revogação centralizada. O projeto não usa esse padrão e, por isso, não mantém estado de sessão em banco ou em memória no backend.
- Access token + refresh token: uma evolução comum para reduzir o tempo de vida do access token e controlar renovação. Essa arquitetura não está implementada no código atual e não deve ser descrita como funcionalidade existente.
- Tokens opacos armazenados em banco ou Redis: uma abordagem útil para revogação centralizada, mas diferente do modelo atual, que depende de JWT assinado e validado localmente pela aplicação.

## Consequências positivas

- A autenticação é simples de operar em uma API distribuída e sem estado compartilhado, porque o token carrega as informações mínimas necessárias para identificar o usuário.
- O backend evita manter sessão server-side por requisição, reduzindo estado e simplificando a escala horizontal da aplicação.
- O uso de `bcryptjs` para senha e `HS256` para assinatura oferece uma base segura para a autenticação atual, com validação de expiração e dependência de um segredo configurado por ambiente.
- O padrão é compatível com a infraestrutura do projeto, que usa API Express e um backend sem dependência de armazenamento de sessão em memória ou Redis.

## Consequências negativas

- O token emitido continua criptograficamente válido até o momento de expiração, salvo validações adicionais feitas pela aplicação. Isso significa que, se a sessão for considerada inválida por outro motivo, a aplicação precisa aplicar regras de negócio ou revalidação de identidade e autorização na requisição.
- Como não há refresh token no modelo atual, o cliente precisa realizar novo login após expiração do token, e a experiência de sessão é menos flexível do que em modelos com renovação contínua.
- A ausência de revogação centralizada exige cuidado adicional em permissões e em validação de ativos do usuário, especialmente para casos em que a conta pode ser desativada ou a regra de acesso pode mudar após a emissão do token.
- O sistema depende diretamente de um segredo válido em ambiente, e a exposição ou perda desse segredo compromete a autenticidade dos tokens já emitidos.

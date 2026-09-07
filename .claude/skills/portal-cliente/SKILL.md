---
name: portal-cliente
description: Como funciona o portal do cliente do Ronas Desk — a cadeia de acesso do cargo Cliente, o escopo obrigatório por cliente_id, a exposição só de comentários públicos, a reabertura automática de chamado e a avaliação pós-atendimento. Use sempre que a tarefa envolver o portal, o cargo Cliente, avaliação ou nota de atendimento, ou qualquer endpoint sob /api/portal — e principalmente ao expor dado novo para o cliente, onde vazamento entre clientes é o risco real.
---

# Portal do cliente

O portal é a única parte do Ronas Desk usada por quem está **fora** da
empresa. Todo o resto do sistema pressupõe usuário interno de confiança; aqui
não. É por isso que as regras abaixo são mais duras que no painel.

## A cadeia de acesso

Uma requisição do portal só passa se **todas** estas condições valerem, e
`portalClienteMiddleware` verifica na ordem:

1. o usuário está `ativo`;
2. **não** é `is_demo` (a conta de demonstração não entra no portal);
3. o `cargo` é exatamente `Cliente`;
4. existe um registro em `clientes` vinculado pelo `cliente_id` do usuário.

Falhando qualquer uma, a resposta é 403. Só depois disso o middleware anexa
`request.usuario.cliente_id` e `request.cliente` — e é esse `cliente_id`, o do
banco, que todo controller deve usar. Nunca aceite `cliente_id` vindo do corpo
ou da query da requisição: quem está do outro lado controla esses valores.

`Cliente` é cargo de portal, não de painel. O `App.jsx` roteia por isso: quem
tem cargo `Cliente` cai em `PortalCliente`, nunca no `Dashboard`.

## Escopo: sempre por cliente_id, sempre 404

Toda leitura e escrita do portal é filtrada pelo cliente da sessão. O padrão é:

```js
const chamado = await chamadoModel.buscarPorIdParaAtualizacao(id, conexao)
if (!chamado || chamado.cliente_id !== request.usuario.cliente_id) {
  // 404, não 403
}
```

**Chamado de outro cliente responde 404, não 403.** A diferença importa: 403
confirma que aquele ID existe, e isso já é informação. Enumerando IDs, um
cliente descobriria quantos chamados a empresa tem e quando foram criados.
Mantenha o 404 mesmo quando parecer menos informativo para depurar.

Ao adicionar qualquer endpoint ao portal, o filtro por `cliente_id` é a
primeira coisa a escrever, não a última.

## Só comentário público

O portal expõe exclusivamente comentários com `tipo = 'PUBLICO'` — o filtro
está no `comentarioModel`. Comentário `INTERNO` é conversa da equipe sobre o
caso e pode conter diagnóstico, custo, avaliação do cliente. Ao montar
qualquer nova listagem que inclua comentários, confirme que o filtro está no
SQL, e não apenas escondido no componente React: esconder na tela deixa o dado
trafegando na resposta da API.

Mensagem do cliente: entre 1 e 2000 caracteres, já com `trim`.

## Resposta do cliente reabre o chamado

Quando o cliente comenta num chamado `Resolvido` ou `Fechado`, ele volta
sozinho para `Em Atendimento` e o SLA reinicia. Isso não é opcional nem é
regra de tela — roda dentro da transação do comentário, via
`reaberturaChamadoService.aoReceberRespostaCliente`, e registra histórico.

O motivo é operacional: um cliente que responde "não resolveu" num chamado
fechado ficaria sem atendimento e sem prazo até alguém reparar na mensagem.

## Avaliação

- Fica disponível **só depois** de `Resolvido` ou `Fechado`; antes disso a
  resposta é 409 com explicação, não 400.
- Nota inteira de 1 a 5; comentário opcional de até 1000 caracteres.
- Uma avaliação por chamado — índice único em `chamado_id`; a segunda
  tentativa responde 409, não sobrescreve a nota anterior.
- A leitura administrativa (`GET /api/avaliacoes`) é exclusiva de
  Administrador, via `adminMiddleware`.

## Onde as coisas ficam

| | |
|---|---|
| Rotas | `backend/src/routes/portalCliente.routes.js`, `avaliacoes.routes.js` |
| Controller | `portalClienteController.js`, `avaliacoesController.js` |
| Middleware | `portalClienteMiddleware.js` |
| Models | `clienteModel.js`, `avaliacaoModel.js`, `comentarioModel.js` |
| Frontend | `pages/PortalCliente/`, `services/portalClienteApi.js`, `avaliacoesApi.js` |

Atenção no frontend: `pages/PortalCliente/PortalCliente.css` está minificado
numa linha só. Ao mexer em estilo do portal, considere reformatá-lo antes, com
QA visual — edição cega nesse arquivo é como se introduz regressão.

## Ao terminar

`npm test --prefix backend`. A suíte de integração
(`permissoes.integration.js`) confere contra banco real que o portal exige
cliente ativo vinculado e que a conta de demonstração não passa — se você
mexeu na cadeia de acesso, é ela que prova que ainda está fechada.

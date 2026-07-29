# AGENTS.md — Ronas Desk

Este arquivo orienta agentes que trabalham neste repositório. Ele se aplica a toda a árvore do projeto. Instruções mais específicas, se adicionadas no futuro em subdiretórios, prevalecem dentro de seu escopo.

## Contexto do projeto

O Ronas Desk é uma aplicação de Help Desk full stack:

- `backend/`: API REST em Node.js, Express 5 e JavaScript ESM, com MySQL via `mysql2/promise`.
- `backend/src/routes/`: definição das rotas HTTP.
- `backend/src/middlewares/`: autenticação JWT e autorização administrativa.
- `backend/src/controllers/`: validação de entrada e orquestração dos casos de uso.
- `backend/src/models/`: consultas e persistência no MySQL.
- `backend/src/services/` e `backend/src/config/`: regras de negócio compartilhadas, incluindo SLA, resolução e auditoria.
- `backend/sql/`: migrations SQL numeradas e executadas em ordem.
- `backend/test/`: testes com o test runner nativo do Node.js.
- `frontend/`: aplicação React 19 construída com Vite.
- `frontend/src/pages/` e `frontend/src/components/`: telas e componentes de interface.
- `frontend/src/context/` e `frontend/src/hooks/`: sessão e estado compartilhado.
- `frontend/src/services/`: integração HTTP centralizada em `apiClient.js` e módulos por recurso.
- `frontend/src/utils/`: regras auxiliares de apresentação.

Backend e frontend têm `package.json` e `package-lock.json` independentes. Execute comandos no diretório correspondente.

## Minha forma de trabalhar

1. **Entenda antes de alterar.** Leia o pedido, a documentação relevante e os arquivos que participam do fluxo completo. Comece por `git status -sb` e preserve alterações existentes do usuário.
2. **Investigue o código real.** Siga a chamada da interface até o serviço HTTP, rota, middleware, controller, service/model e banco. Não suponha padrões que o repositório não usa.
3. **Apresente um plano curto.** Para mudanças não triviais, descreva de 2 a 5 passos verificáveis antes de editar. Atualize o plano se a investigação mudar o entendimento.
4. **Faça mudanças pequenas e revisáveis.** Altere apenas os arquivos necessários, mantenha o diff focado e evite refatorações oportunistas.
5. **Use a arquitetura existente.** Estenda os módulos atuais; não crie uma segunda camada de API, estado, persistência, validação ou componentes em paralelo.
6. **Valide e explique.** Revise o diff, execute as verificações aplicáveis e relate decisões, limitações e o que aprendeu durante a investigação.

Se o pedido for ambíguo e uma suposição puder alterar comportamento, contrato público, dados ou segurança, pare e peça esclarecimento.

## Regras de implementação

### Compatibilidade

- Preserve contratos existentes da API: rotas, métodos, status HTTP, formatos JSON e nomes de campos, salvo quando a mudança for explicitamente solicitada.
- Preserve os valores de domínio já compartilhados, como status e prioridades de chamados, e o comportamento de autenticação e expiração de sessão.
- Prefira alterações aditivas e retrocompatíveis. Quando uma quebra for inevitável, identifique os consumidores afetados e explique a migração necessária.
- Não atualize dependências, lockfiles, configuração ou formatação global sem necessidade direta e autorização compatível com o pedido.

### Backend e regras de negócio

- Mantenha rotas enxutas, controllers responsáveis pela orquestração, models responsáveis pela persistência e services/config responsáveis por regras de negócio reutilizáveis.
- Centralize regras de negócio. Antes de criar uma regra, procure implementação ou constante equivalente em `backend/src/services/`, `backend/src/config/` e nos utilitários do frontend.
- O backend é a fonte de verdade para autorização, transições de estado, SLA, auditoria e outras regras que protegem a integridade dos dados. O frontend pode apresentar essas regras, mas não deve ser o único lugar onde elas são aplicadas.
- Use consultas parametrizadas. Nunca monte SQL com entrada do usuário por concatenação.
- Não exponha detalhes internos, consultas, stack traces, credenciais ou tokens em respostas da API ou logs.
- Ao corrigir um defeito ou introduzir regra testável, adicione ou ajuste um teste focado em `backend/test/`.

### Transações

- Use transação quando uma operação lógica fizer duas ou mais gravações relacionadas, especialmente alterações de chamado acompanhadas de auditoria, comentários ou vínculos.
- Todas as consultas da mesma operação devem usar a mesma conexão transacional.
- Faça `commit` somente depois de todas as etapas terem sucesso; em erro, faça `rollback`; libere a conexão em `finally`.
- Não deixe efeitos parciais. Garanta que services e models chamados dentro da operação aceitem e respeitem a conexão recebida.
- Mantenha chamadas externas e trabalho não relacionado fora da transação para reduzir bloqueios.

### Frontend

- Reutilize `frontend/src/services/apiClient.js` e os módulos de `frontend/src/services/`; não espalhe chamadas Axios diretamente pelos componentes.
- Reutilize contextos, hooks, componentes de UI e utilitários existentes antes de criar novas abstrações.
- Mantenha componentes focados em interface e interação. Regras de domínio compartilhadas devem permanecer centralizadas.
- Preserve os estados de carregamento, vazio, erro, sucesso e sessão expirada ao alterar fluxos assíncronos.
- Mantenha acessibilidade básica: labels, foco, teclado, semântica e feedback visível.

## Banco de dados e migrations

- Crie uma nova migration versionada em `backend/sql/`, seguindo a sequência numérica e um nome descritivo. Não reescreva uma migration que possa já ter sido aplicada.
- Toda nova migration deve ser idempotente, reexecutável com segurança e não destrutiva.
- Prefira mudanças aditivas: novas tabelas, colunas anuláveis ou com default seguro, índices e constraints compatíveis.
- Consulte `information_schema` quando o MySQL não oferecer `IF NOT EXISTS` adequado para a alteração.
- Preserve dados existentes. Não use `DROP`, `TRUNCATE`, exclusão em massa, renomeação destrutiva, redução de tipo ou preenchimento irreversível sem autorização explícita e plano de recuperação.
- Separe mudança de estrutura de backfill arriscado. Se um backfill for necessário, torne-o limitado, verificável e seguro para repetição.
- Considere chaves estrangeiras, índices, defaults, valores legados e a ordem de implantação entre banco, backend e frontend.
- Use transações em operações de dados relacionadas quando o MySQL e o tipo de instrução permitirem; não presuma que DDL seja revertida por `rollback`.
- Documente pré-condições ou verificações manuais no próprio SQL quando forem relevantes.

## Segurança e ações proibidas

- **Nunca abra, leia, imprima, copie, pesquise ou exponha arquivos `.env`, senhas, tokens, chaves, cookies, credenciais ou outros segredos.**
- Não inclua segredos em código, exemplos, logs, testes, documentação, commits ou respostas. Trabalhe apenas com nomes de variáveis e valores fictícios claramente identificados quando indispensável.
- Não execute scripts de criação de administrador nem conecte a bancos reais sem autorização explícita.
- Não execute `git reset`, `git clean`, checkout destrutivo, remoções recursivas, exclusões de arquivos ou dados, rollback de migration ou comandos equivalentes sem autorização explícita.
- Não descarte nem sobrescreva mudanças do usuário. Se houver conflito com arquivos já alterados, pare e explique.
- Não faça commit, push, force-push, criação/atualização de branch ou Pull Request sem autorização explícita.

## Validação

Execute apenas as verificações aplicáveis ao escopo. Não use `lint:fix` nem `format`, pois alteram arquivos automaticamente.

### Backend

```bash
cd backend
npm test
npm run lint
npm run format:check
```

O backend não possui script de build. Não invente um comando equivalente.

### Frontend

```bash
cd frontend
npm run lint
npm run build
```

O frontend não possui script de testes configurado. Não declare testes de frontend como executados.

### Revisão final do repositório

```bash
git diff --check
git diff
git status -sb
```

- Revise cada linha do `git diff` e confirme que somente arquivos no escopo foram alterados.
- Para mudanças de contrato ou integração, valide os dois lados do fluxo.
- Não execute serviços dependentes de credenciais ou banco apenas para satisfazer uma lista de checks.
- Se um comando não existir, depender de infraestrutura indisponível ou falhar por problema anterior ao diff, registre isso claramente; não masque a falha.
- Ao concluir, informe arquivos alterados, verificações executadas e resultados, decisões relevantes, riscos restantes e verificações não executadas com o motivo.

## Critério de conclusão

Uma tarefa só está concluída quando o comportamento pedido foi implementado com o menor diff coerente, a compatibilidade foi considerada, regras não foram duplicadas, migrations necessárias são seguras, o diff foi revisado e as validações aplicáveis foram executadas. Nenhum commit, push ou Pull Request faz parte da conclusão sem autorização do usuário.

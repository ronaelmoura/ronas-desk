# AGENTS.md — Ronas Desk

Estas regras se aplicam a todo o repositório e são a fonte permanente de orientação para agentes.

## Forma de trabalho

- Entenda o pedido e confira o estado real do repositório antes de alterar arquivos.
- Preserve alterações locais que não pertencem à tarefa atual.
- Faça mudanças pequenas, focadas e compatíveis com a arquitetura existente.
- Para backend, mantenha rotas, controllers, services e models em suas responsabilidades atuais; use SQL parametrizado e transações para gravações relacionadas.
- Para frontend, reutilize os serviços HTTP, contextos, hooks e componentes existentes.
- Não crie nem reescreva migrations já aplicadas. Mudanças de banco devem ser aditivas, seguras e revisáveis.

## Segurança

- Nunca leia, imprima, copie ou exponha valores de `.env`, senhas, tokens, chaves, cookies ou outras credenciais.
- Nunca inclua segredos em código, documentação, testes, logs ou commits.
- Não descarte, sobrescreva ou apague alterações do usuário.
- Não execute ações destrutivas, force-push, rollback de migration, exclusão de dados, conexão com banco real ou alteração de produção sem autorização explícita.

## Validação

- Execute somente as verificações relevantes ao escopo e revise `git diff --check`, `git diff` e `git status -sb` antes de concluir.
- No backend, use `npm test` e `npm run lint`; no frontend, use `npm run lint` e `npm run build` quando aplicável.
- Registre claramente qualquer aviso ou verificação não executada.

## Entrega e Git

- Para mudanças rotineiras do Ronas Desk, o agente pode criar branch `codex/`, implementar, validar, criar commit, fazer push, abrir Pull Request e mesclar após uma revisão final, sem pedir confirmações intermediárias.
- Antes de mesclar, confirme que os checks aplicáveis passaram, que o diff está focado e que não há conflitos ou alterações locais da tarefa fora do escopo.
- Mantenha commits e Pull Requests focados: não misture alterações locais, ferramentas ou configurações sem relação com a tarefa.

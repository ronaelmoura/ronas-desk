# PROJECT_STATUS.md — Ronas Desk

Memória operacional do projeto. Este arquivo registra o ponto atual para facilitar a continuidade entre tarefas. O código, o histórico do Git e os serviços publicados continuam sendo as fontes de verdade.

## Última atualização

- Data: 12 de agosto de 2026
- Versão publicada: `1.0.0`
- Situação local: conta Demo segura implementada e aguardando publicação
- Produção: https://ronas-desk.onrender.com
- Repositório: `ronaelmoura/ronas-desk`

## Estado do produto

- Sprints 1 a 19 concluídas.
- Fluxos principais de login, clientes, usuários, chamados, comentários, histórico, anexos, dashboard e relatórios validados em produção.
- Deploy de demonstração no Render conectado ao MySQL do Aiven com TLS.
- Armazenamento de anexos integrado ao Cloudinary.
- Versão `1.0.0` documentada como estável no `README.md`.
- Correções posteriores da interface incluíram responsividade dos filtros e melhoria dos ícones e alinhamento do dashboard.
- Conta Demo somente leitura preparada no backend e no frontend; a conta real ainda não foi criada no Aiven.

## Decisões permanentes

- O diferencial do Ronas Desk deve ser a melhor experiência possível para o usuário, sem deixar de ser simples e funcional.
- Mudanças devem ser pequenas, revisáveis e compatíveis com a arquitetura existente.
- Backend é a fonte de verdade para autorização, SLA, auditoria e integridade dos dados.
- Nenhuma credencial ou dado secreto pode ser registrado neste arquivo.
- Branch, commit, push, Pull Request e merge exigem autorização explícita do usuário.

## Ponto atual do Git

- A implementação da Conta Demo está na branch `codex/conta-demo-segura`.
- O cenário demonstrativo pode ser preenchido com atendentes, clientes,
  chamados, comentários e histórico fictícios usando `npm run seed-demo`.
- A branch foi criada após a melhoria dos ícones, já mesclada pela PR #22.
- Antes da próxima alteração, confirmar novamente a branch e o estado real do repositório.

## Próximo passo sugerido

- Revisar e publicar a implementação da conta Demo.
- Depois do deploy, aplicar a migration e criar a conta Demo no Aiven com autorização separada.
- Atualizar a divulgação do projeto com o link direto para a demonstração.
- Antes de iniciar nova funcionalidade, registrar objetivo, escopo e critério de conclusão.

## Como manter esta memória

Atualizar este arquivo somente quando houver mudança relevante em versão, produção, sprint, decisão de arquitetura ou próximo passo. Manter o texto curto e verificar cada informação no projeto antes de utilizá-la.

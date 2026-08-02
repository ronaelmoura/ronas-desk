# Ronas Desk

## Sprint 1

### ✅ Concluído

- React
- Node
- Express
- MySQL
- CRUD
- MVC (GET)

### 🚧 Em andamento

- POST
- PUT
- DELETE

---

## Aprendizados

- O Model conversa com o banco.
- O Controller toma decisões.
- A Route recebe a requisição.

---

## Sprint 9.4

### ✅ Auditoria e timeline de chamados

- Migration `006_sprint_9_4_ticket_history.sql`
- Histórico estruturado com valores anteriores e novos em JSON
- Registro transacional na criação e atualização de chamados
- Eventos de resolução, fechamento e reabertura sem duplicidade
- Endpoint `GET /api/chamados/:id/history`
- Timeline reutilizável no modal de detalhes
- Testes unitários do `historyService`

---

## Sprint 9.5

### ✅ Anexos privados em chamados

- Migration `007_sprint_9_5_anexos.sql`
- Upload autenticado no Cloudinary
- Validação de formato, assinatura e limite de 10 MB
- Listagem, abertura por URL temporária e exclusão de anexos
- Registro de inclusão e remoção na timeline
- Aba de anexos no modal de detalhes

---

## Sprint 9.6

### ✅ Relatórios operacionais

- Filtro de chamados por período, com limite máximo de 366 dias
- Indicadores de volume, SLA e tempo médio de resolução
- Distribuições por status, prioridade, categoria e responsável
- Detalhamento dos 100 chamados mais recentes na tela
- Exportação completa e segura em CSV
- Endpoint autenticado `GET /api/relatorios/chamados`
- Testes unitários da consulta e das regras do relatório

---

## Sprint 10

### ✅ Docker

- Imagens separadas para backend e frontend
- Build em múltiplos estágios do frontend servido por Nginx
- Stack com frontend, backend e MySQL isolado
- Volume persistente para os dados do MySQL
- Healthchecks e ordem segura de inicialização
- Banco inicial reproduzível com migrations automáticas
- Credenciais aleatórias geradas localmente e fora do Git
- Assistentes seguros para criar o primeiro administrador e redefinir sua senha
- Login, reinício dos serviços e persistência do volume validados localmente

---

## Sprint 11

### ✅ Deploy gratuito com Render e Aiven

- Render configurado para servir frontend e backend em uma única imagem
- MySQL externo conectado ao Aiven com TLS e validação pelo certificado CA
- Migrations automáticas com histórico e proteção para bancos existentes
- Blueprint sem credenciais versionadas
- Assistente local com certificado CA para criar o administrador da demonstração
- Aplicação publicada em `https://ronas-desk.onrender.com`
- Login do primeiro administrador validado em produção
- Limitações de suspensão dos planos gratuitos documentadas

---

## Sprint 12

### ✅ Segurança e confiabilidade em produção

- Headers HTTP de segurança centralizados com Helmet
- Limite de cinco tentativas falhas de login a cada 15 minutos por IP
- Suporte seguro ao proxy reverso do Render
- Corpo JSON limitado explicitamente a 100 KB
- Healthcheck público mínimo, com `503` sem detalhes internos em falhas
- Aplicação Express separada da inicialização para permitir testes integrados
- Testes de headers, healthcheck e bloqueio de autenticação
- CI no GitHub Actions para testes, lint e build em cada PR e push na `main`

---

## Sprint 13

### ✅ Perfil do usuário e segurança da conta

- Perfil real carregado da sessão autenticada, sem dados fictícios no navegador
- Atualização protegida de nome e email no MySQL
- Cargo mantido como campo somente administrativo
- Bloqueio de email duplicado e validação de conta ativa
- Troca de senha com confirmação da senha atual e bcrypt com custo 12
- Formulários independentes com estados de envio, erro e sucesso
- Atualização imediata do nome e avatar exibidos no painel
- Limpeza automática do perfil legado salvo no `localStorage`
- Testes de contrato, validação, persistência parametrizada e senha

---

## Sprint 14

### ✅ Tempo real de primeira resposta

- Migration idempotente `008_sprint_14_first_response_at.sql`
- Backfill seguro a partir do primeiro comentário público existente
- Registro transacional da primeira resposta junto com comentário e histórico
- Comentários internos ignorados pelo indicador
- Preservação do horário original em respostas públicas posteriores
- Cálculo do tempo médio de primeira resposta no dashboard
- Tratamento de chamados sem resposta e de datas inconsistentes
- Testes da regra, da persistência parametrizada e do cálculo da média

---

## Sprint 15

### ✅ Navegação lateral mais clara e acessível

- Ícones do menu substituídos por componentes vetoriais do Lucide
- Tamanho, traço, cor e alinhamento padronizados em todos os itens
- Indicador lateral para destacar a página selecionada
- Feedback visual reforçado nos estados de foco, passagem do mouse e seleção
- Página atual informada a tecnologias assistivas com `aria-current`
- Comportamento responsivo do menu preservado

---

## Sprint 16

### ✅ Listagem profissional de chamados

- Correção da ordem visual das colunas Status e SLA
- Paginação dos chamados em grupos de dez registros
- Ordenação por data, prioridade e risco de SLA
- Retorno automático à primeira página após mudanças nos filtros
- Categorias do filtro geradas a partir dos dados disponíveis
- Contagem acessível do intervalo e do total de resultados
- Componente de paginação desacoplado da tela de usuários e reutilizado
- Reticências na paginação para evitar excesso de botões em listas extensas

---

## Sprint 17

### ✅ Feedback consistente e operações mais seguras

- Notificações de sucesso e erro padronizadas sem caixas nativas do navegador
- Confirmação reutilizável e acessível para ações destrutivas ou sensíveis
- Estados claros de carregamento, erro e lista vazia na gestão de clientes
- Bloqueio de envios repetidos ao criar, editar ou excluir registros
- Retorno visual durante abertura, atualização e exclusão de chamados
- Foco controlado, navegação por teclado e fechamento por `Escape` nos modais
- Estilos de toast, confirmação e skeleton desacoplados da página de usuários
- Correção da inclusão imediata de novos clientes na listagem

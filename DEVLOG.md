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

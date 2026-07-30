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

## Próxima Sprint

Cadastro de Clientes.

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

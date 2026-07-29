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

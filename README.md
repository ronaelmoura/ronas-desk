<div align="center">

# 🖥️ Ronas Desk

### Sistema Full Stack de gerenciamento de chamados técnicos

O Ronas Desk centraliza clientes, usuários, chamados e indicadores de atendimento em uma interface moderna de Help Desk.

![Status](https://img.shields.io/badge/Status-Em%20desenvolvimento-2563EB?style=for-the-badge)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?style=for-the-badge&logo=mysql&logoColor=white)

</div>

---

## 📖 Sobre o projeto

O **Ronas Desk** é uma aplicação de portfólio criada para simular a rotina de uma equipe de suporte técnico. O sistema possui frontend em React, API REST com Node.js e Express e persistência de dados em MySQL.

O projeto aplica separação de responsabilidades no backend, autenticação com JWT e rotas protegidas para oferecer uma base próxima de um produto real.

## ✨ Funcionalidades

- Autenticação de usuários com JWT
- Rotas protegidas no frontend e no backend
- Cadastro, consulta, edição e inativação de clientes
- Cadastro, consulta e atualização de chamados
- Associação de chamados a clientes e responsáveis
- Controle de categoria, prioridade e status
- Comentários, linha do tempo e auditoria por chamado
- Anexos privados de imagens e PDFs por chamado
- Dashboard com indicadores de atendimento
- Registro da data real de resolução ou fechamento
- Cálculo de SLA e tempo médio de resolução
- Exclusão lógica para preservação de dados

## 🛠️ Tecnologias

### Frontend

- React 19
- Vite
- JavaScript
- Axios
- React Router
- SweetAlert2
- Lucide React e React Icons

### Backend

- Node.js
- Express 5
- MySQL2
- JSON Web Token
- bcryptjs
- CORS
- dotenv
- Cloudinary
- Multer

### Banco de dados e ferramentas

- MySQL
- Git e GitHub
- ESLint e Prettier
- Node Test Runner

## 🏗️ Arquitetura

```text
React
  │
  ▼
API REST (Express)
  │
  ├── Rotas e middlewares
  ├── Controllers
  ├── Models ──────────────► MySQL
  └── Serviço de anexos ───► Cloudinary
```

## 📂 Estrutura do projeto

```text
ronas-desk/
├── backend/
│   ├── sql/
│   └── src/
│       ├── controllers/
│       ├── database/
│       ├── middlewares/
│       ├── models/
│       ├── routes/
│       └── scripts/
├── frontend/
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── components/
│       ├── hooks/
│       ├── pages/
│       └── services/
├── .env.example
└── README.md
```

## ⚙️ Como executar

### Pré-requisitos

- Node.js
- npm
- MySQL 8 ou superior

### 1. Clone o repositório

```bash
git clone https://github.com/ronaelmoura/ronas-desk.git
cd ronas-desk
```

### 2. Configure o ambiente

Copie o arquivo de exemplo para o backend e preencha as credenciais do MySQL e o segredo JWT:

```bash
cp .env.example backend/.env
```

Variáveis disponíveis:

```env
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=ronas_desk
DB_PORT=3306
PORT=3001
JWT_SECRET=uma_chave_secreta_forte
JWT_EXPIRES_IN=8h
CLOUDINARY_CLOUD_NAME=seu_cloud_name
CLOUDINARY_API_KEY=sua_api_key
CLOUDINARY_API_SECRET=seu_api_secret
```

Crie o banco `ronas_desk` e execute, em ordem, os scripts SQL disponíveis em `backend/sql`.

### 3. Inicie o backend

```bash
cd backend
npm install
npm run dev
```

A API será iniciada em `http://localhost:3001`.

### 4. Crie o usuário administrador

Com as variáveis de ambiente configuradas:

```bash
npm run create-admin
```

### 5. Inicie o frontend

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

Acesse `http://localhost:5173`.

## 📡 Principais rotas da API

| Método | Endpoint | Descrição |
| --- | --- | --- |
| `GET` | `/api/health` | Verifica a API e a conexão com o banco |
| `POST` | `/api/auth/login` | Autenticação |
| `GET` | `/api/auth/me` | Consulta da sessão autenticada |
| Vários | `/api/clientes` | Gerenciamento de clientes |
| Vários | `/api/chamados` | Gerenciamento de chamados |
| `GET` | `/api/dashboard` | Indicadores do dashboard |
| Vários | `/api/usuarios` | Gerenciamento de usuários |

> As rotas de clientes, chamados, dashboard e usuários exigem autenticação.

## 🕓 Histórico e auditoria de chamados

A Sprint 9.4 adiciona um histórico estruturado para acompanhar as
principais ações realizadas em cada chamado. A gravação do chamado e do evento
usa a mesma transação, evitando alterações parciais quando a auditoria falhar.

Eventos suportados:

- `CHAMADO_CRIADO`
- `CHAMADO_ATUALIZADO`
- `STATUS_ALTERADO`
- `PRIORIDADE_ALTERADA`
- `RESPONSAVEL_ALTERADO`
- `CLIENTE_ALTERADO`
- `CHAMADO_RESOLVIDO`
- `CHAMADO_FECHADO`
- `CHAMADO_REABERTO`
- `COMENTARIO_ADICIONADO`
- `ANEXO_ADICIONADO`
- `ANEXO_REMOVIDO`

O histórico cronológico está disponível em:

```http
GET /api/chamados/:id/history
```

Antes de iniciar a aplicação atualizada, execute no MySQL, depois das migrations
anteriores:

```text
backend/sql/006_sprint_9_4_ticket_history.sql
```

A migration cria `ticket_history` e importa de forma idempotente os eventos
legados da tabela `auditoria`.

## 📎 Anexos em chamados

A Sprint 9.5 permite enviar imagens JPG, PNG, WEBP e GIF ou documentos PDF de
até 10 MB. Os arquivos são armazenados como ativos autenticados no Cloudinary;
o MySQL mantém somente metadados e o backend gera links temporários de cinco
minutos após validar a sessão.

Rotas protegidas:

```http
GET    /api/chamados/:id/anexos
POST   /api/chamados/:id/anexos
GET    /api/chamados/:id/anexos/:anexoId/download
DELETE /api/chamados/:id/anexos/:anexoId
```

Antes de usar os anexos, execute no MySQL:

```text
backend/sql/007_sprint_9_5_anexos.sql
```

As credenciais do Cloudinary devem existir somente em `backend/.env`. Nunca
publique esse arquivo ou exponha `CLOUDINARY_API_SECRET` no frontend.

Comandos de validação:

```bash
cd backend
npm test
npm run lint

cd ../frontend
npm run lint
npm run build
```

## 🗺️ Roadmap

- [x] CRUD de clientes
- [x] CRUD de chamados
- [x] Relacionamento entre clientes e chamados
- [x] Comentários, linha do tempo e auditoria
- [x] Dashboard
- [x] Autenticação JWT
- [x] Controle de usuários
- [x] Indicadores de SLA e resolução
- [x] Anexos em chamados
- [ ] Relatórios
- [ ] Docker
- [ ] Deploy de demonstração

## 👨‍💻 Autor

**Ronael Moura** — Desenvolvedor Full Stack

- [GitHub](https://github.com/ronaelmoura)
- [LinkedIn](https://www.linkedin.com/in/ronael-moura)
- [Portfólio](https://ronaelmoura.github.io/portfolio-ronas-tech/)

---

<div align="center">

Se este projeto foi útil para você, deixe uma ⭐ no repositório.

Desenvolvido com dedicação por **Ronael Moura**.

</div>

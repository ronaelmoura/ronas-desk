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
- Docker Compose
- Nginx
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
├── compose.yaml
├── .env.docker.example
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

## 🐳 Como executar com Docker

O Docker inicia frontend, backend e um MySQL próprio e persistente. Esse banco é
isolado e não altera nem importa os dados do MySQL instalado no Windows.

### 1. Pré-requisito

Instale e inicie o Docker Desktop.

### 2. Configure o ambiente do Docker

No PowerShell, a partir da raiz do projeto:

```powershell
.\scripts\configure-docker-env.ps1
```

O assistente gera senhas aleatórias para o MySQL e uma chave JWT sem mostrá-las
no terminal. O arquivo `.env.docker` é ignorado pelo Git e não deve ser aberto,
copiado ou enviado. As credenciais do Cloudinary são opcionais e podem ser
configuradas separadamente quando os anexos forem necessários.

### 3. Inicie a aplicação

```powershell
docker compose --env-file .env.docker up --build -d
docker compose --env-file .env.docker ps
```

Na primeira inicialização de um banco vazio, os scripts de `backend/sql` são
executados automaticamente em ordem. Aguarde os três serviços ficarem
saudáveis e acesse `http://localhost:5173`.

### 4. Crie o primeiro administrador

Execute o assistente interativo:

```powershell
.\scripts\create-docker-admin.ps1
```

O assistente solicita nome e email, oculta a senha durante a digitação e remove
esses dados da memória do processo ao terminar. A senha do administrador não
fica armazenada em `.env.docker`.

Para redefinir a senha de um administrador ativo sem apagar dados:

```powershell
.\scripts\reset-docker-admin-password.ps1
```

Os dois assistentes pedem a confirmação da senha para evitar erros de digitação.

### 5. Encerre a aplicação

```powershell
docker compose --env-file .env.docker down
```

Esse comando mantém o volume do MySQL, portanto os dados estarão disponíveis na
próxima inicialização.

## 🌐 Deploy gratuito com Render e Aiven

O deploy de demonstração usa um único Web Service gratuito no Render para servir
o frontend e a API. O MySQL permanece em um serviço gratuito separado no Aiven,
e os anexos continuam no Cloudinary.

### 1. Crie o MySQL gratuito no Aiven

No Aiven Console, crie um serviço **MySQL Free** e aguarde o status `Running`.
Na tela de conexão, identifique host, porta, usuário, senha e o banco
`defaultdb`. Esses valores são privados e nunca devem ser enviados, colocados
no Git ou incluídos em capturas de tela.

### 2. Crie o Blueprint no Render

No Render Dashboard, crie um Blueprint conectado a este repositório. O arquivo
`render.yaml` configura o serviço `ronas-desk`, a imagem Docker de produção e o
healthcheck.

Informe diretamente no painel do Render:

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` e `DB_NAME`, usando os dados do
  Aiven;
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` e
  `CLOUDINARY_API_SECRET`, caso os anexos sejam utilizados.

O `JWT_SECRET` é gerado automaticamente pelo Render. O serviço executa as
migrations pendentes antes de iniciar a aplicação. A execução automática é
permitida somente em um banco vazio ou em um banco que já possua o histórico
`schema_migrations`.

### 3. Crie o administrador da demonstração

Depois que o deploy estiver saudável, execute na raiz do projeto:

```powershell
.\scripts\create-aiven-admin.ps1
```

O assistente solicita localmente os dados de conexão e do administrador, mascara
as senhas e remove os valores temporários ao terminar. Não envie essas
informações pelo chat.

### Limitações do plano gratuito

- O Web Service do Render entra em suspensão após 15 minutos sem tráfego. O
  primeiro acesso seguinte pode levar cerca de um minuto.
- O Aiven Free oferece 1 GB de armazenamento e pode suspender serviços sem
  atividade contínua, mediante aviso.
- Esse ambiente é indicado para demonstração e portfólio, não para operação
  crítica ou de alto tráfego.

## 📡 Principais rotas da API

| Método | Endpoint | Descrição |
| --- | --- | --- |
| `GET` | `/api/health` | Verifica a API e a conexão com o banco |
| `POST` | `/api/auth/login` | Autenticação |
| `GET` | `/api/auth/me` | Consulta da sessão autenticada |
| Vários | `/api/clientes` | Gerenciamento de clientes |
| Vários | `/api/chamados` | Gerenciamento de chamados |
| `GET` | `/api/dashboard` | Indicadores do dashboard |
| `GET` | `/api/relatorios/chamados` | Relatório de chamados por período |
| Vários | `/api/usuarios` | Gerenciamento de usuários |

> As rotas de clientes, chamados, dashboard, relatórios e usuários exigem
> autenticação.

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

## 📊 Relatórios operacionais

A Sprint 9.6 adiciona uma visão de chamados criados por período, com indicadores
de volume, cumprimento de SLA, tempo médio de resolução e distribuições por
status, prioridade, categoria e responsável.

O relatório inclui detalhamento dos chamados e exportação em CSV. O período
padrão é de 30 dias e o intervalo máximo permitido é de 366 dias.

Rota protegida:

```http
GET /api/relatorios/chamados?data_inicio=2026-07-01&data_fim=2026-07-30
```

Essa funcionalidade não exige uma nova migration.

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
- [x] Relatórios
- [x] Docker
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

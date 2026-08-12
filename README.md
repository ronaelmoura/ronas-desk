<div align="center">

# 🖥️ Ronas Desk

### Sistema Full Stack de gerenciamento de chamados técnicos

O Ronas Desk centraliza clientes, usuários, chamados e indicadores de atendimento em uma interface moderna de Help Desk.

![Status](https://img.shields.io/badge/Status-Est%C3%A1vel-16A34A?style=for-the-badge)
![Versão](https://img.shields.io/badge/Vers%C3%A3o-1.0.0-16A34A?style=for-the-badge)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?style=for-the-badge&logo=mysql&logoColor=white)

---

## 📖 Sobre o projeto

O **Ronas Desk** é uma aplicação de portfólio criada para simular a rotina de uma equipe de suporte técnico. O sistema possui frontend em React, API REST com Node.js e Express e persistência de dados em MySQL.

O projeto aplica separação de responsabilidades no backend, autenticação com JWT e rotas protegidas para oferecer uma base próxima de um produto real.

A versão `1.0.0` está concluída, publicada para demonstração e validada nos
principais fluxos públicos e autenticados em produção.

## ✨ Funcionalidades

- Autenticação de usuários com JWT
- Rotas protegidas no frontend e no backend
- Cadastro, consulta, edição e inativação de clientes
- Cadastro, consulta e atualização de chamados
- Associação de chamados a clientes e responsáveis
- Controle de categoria, prioridade e status
- Busca, filtros, ordenação e paginação de chamados
- Comentários, linha do tempo e auditoria por chamado
- Anexos privados de imagens e PDFs por chamado
- Dashboard com indicadores de atendimento, filtros por período e atalhos para os chamados relacionados
- Registro da data real de resolução ou fechamento
- Cálculo de SLA, tempo médio de resolução e primeira resposta
- Exclusão lógica para preservação de dados
- Feedback visual consistente, confirmações acessíveis e prevenção de ações duplicadas

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

Na mesma tela, baixe o **CA Certificate** como `ca.pem`. O certificado permite
que o cliente valide a identidade do banco em vez de apenas criptografar a
conexão.

### 2. Crie o Blueprint no Render

No Render Dashboard, crie um Blueprint conectado a este repositório. O arquivo
`render.yaml` configura o serviço `ronas-desk`, a imagem Docker de produção e o
healthcheck.

Informe diretamente no painel do Render:

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` e `DB_NAME`, usando os dados do
  Aiven;
- `DB_SSL_CA_BASE64`, usando o certificado `ca.pem` convertido para Base64;
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` e
  `CLOUDINARY_API_SECRET`, caso os anexos sejam utilizados.

No PowerShell, copie o certificado convertido diretamente para a área de
transferência sem imprimi-lo no terminal:

```powershell
$caBytes = [IO.File]::ReadAllBytes("$env:USERPROFILE\Downloads\ca.pem")
$caBase64 = [Convert]::ToBase64String($caBytes)
Set-Clipboard -Value $caBase64
$caBytes = $null
$caBase64 = $null
```

Cole o conteúdo no valor de `DB_SSL_CA_BASE64`. Em um Blueprint novo, o Render
solicita essa variável durante a criação. Em um serviço já existente, adicione-a
manualmente em **Environment**.

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
as senhas, carrega por padrão o certificado
`$env:USERPROFILE\Downloads\ca.pem` e remove os valores temporários ao terminar.
Não envie essas informações pelo chat.

O ambiente publicado pode ser acessado em
[ronas-desk.onrender.com](https://ronas-desk.onrender.com).

### Limitações do plano gratuito

- O Web Service do Render entra em suspensão após 15 minutos sem tráfego. O
  primeiro acesso seguinte pode levar cerca de um minuto.
- O Aiven Free oferece 1 GB de armazenamento e pode suspender serviços sem
  atividade contínua, mediante aviso.
- Esse ambiente é indicado para demonstração e portfólio, não para operação
  crítica ou de alto tráfego.

## 🛡️ Segurança e integração contínua

O backend aplica headers HTTP de segurança com Helmet, remove a identificação do
Express e limita o corpo JSON a 100 KB. O login aceita por padrão até cinco
tentativas falhas por IP em uma janela de 15 minutos; logins bem-sucedidos não
consomem o limite.

Os limites podem ser ajustados sem alterar o código:

```env
LOGIN_RATE_LIMIT_MAX=5
LOGIN_RATE_LIMIT_WINDOW_MS=900000
TRUST_PROXY_HOPS=1
```

Em produção, `TRUST_PROXY_HOPS` informa quantos proxies confiáveis existem entre
o cliente e a aplicação. O valor padrão é `1`, adequado ao Web Service atual do
Render. Em desenvolvimento, cabeçalhos enviados pelo cliente não são tratados
como proxy confiável.

O endpoint `GET /api/health` retorna somente o estado público necessário. Falhas
de banco produzem HTTP `503` e uma mensagem genérica; o código interno do erro
fica restrito ao log do servidor.

O workflow `.github/workflows/ci.yml` usa Node.js 22 e executa automaticamente:

- testes e lint do backend;
- lint e build do frontend.

O CI roda em Pull Requests e em pushes para `main`, sem acesso a credenciais de
produção. O `format:check` será incluído depois que a dívida de formatação antiga
for corrigida em uma mudança isolada.

## 🖥️ Conta de demonstração segura

A tela de login oferece acesso público à demonstração sem divulgar email ou
senha. O usuário Demo é identificado no banco e recebe uma sessão autenticada
somente para leitura.

O backend bloqueia centralmente qualquer tentativa de criar, editar, comentar,
enviar anexos, alterar senha ou excluir dados. A interface também identifica o
modo de demonstração e oculta as principais ações de alteração.

Depois de aplicar a migration `009_demo_read_only_user.sql`, a conta pode ser
criada com `npm run create-demo`. O script exige `DEMO_EMAIL`, aceita
`DEMO_NOME` e gera internamente uma senha aleatória que não é exibida nem
compartilhada.

Para apresentar uma empresa fictícia em funcionamento, execute no backend
`npm run seed-demo`. O comando cria quatro atendentes, seis clientes e quinze
chamados distribuídos entre diferentes responsáveis, categorias, prioridades,
status e datas. Ele também inclui comentários públicos, anotações internas e
eventos no histórico. Os dados usam identidades fictícias, o processo é
transacional e pode ser repetido sem duplicar o cenário existente.

## 👤 Perfil e segurança da conta

A área de configurações usa os dados reais do usuário autenticado. Nome e email
podem ser atualizados pelo próprio usuário e permanecem sincronizados com o
banco; o cargo é somente leitura e continua sob controle administrativo.

A troca de senha exige a senha atual, confirmação da nova senha e no mínimo oito
caracteres. O backend valida novamente a conta ativa, compara a senha atual com o
hash armazenado e grava a nova senha com bcrypt. Nenhum hash ou detalhe interno é
retornado pela API.

O perfil fictício que versões anteriores mantinham no `localStorage` deixa de
ser usado e é removido automaticamente ao validar a sessão.

## ⏱️ Tempo de primeira resposta

A primeira resposta de um chamado é registrada quando a equipe adiciona o
primeiro comentário público. Comentários internos não alteram esse indicador e
respostas posteriores preservam o horário original.

A migration `008_sprint_14_first_response_at.sql` adiciona o campo de forma
idempotente e preenche chamados existentes com a data do primeiro comentário
público já registrado. O dashboard calcula a média somente entre chamados que
possuem uma primeira resposta válida.

## 📡 Principais rotas da API

| Método | Endpoint | Descrição |
| --- | --- | --- |
| `GET` | `/api/health` | Verifica a API e a conexão com o banco |
| `POST` | `/api/auth/login` | Autenticação |
| `GET` | `/api/auth/me` | Consulta da sessão autenticada |
| `PATCH` | `/api/auth/me` | Atualiza nome e email da própria conta |
| `PATCH` | `/api/auth/me/password` | Altera a própria senha com confirmação |
| Vários | `/api/clientes` | Gerenciamento de clientes |
| Vários | `/api/chamados` | Gerenciamento de chamados |
| `GET` | `/api/dashboard` | Indicadores do dashboard |
| `GET` | `/api/relatorios/chamados` | Relatório de chamados por período |
| Vários | `/api/usuarios` | Gerenciamento de usuários |

> As rotas de perfil, clientes, chamados, dashboard, relatórios e usuários
> exigem autenticação.

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
- [x] Deploy de demonstração
- [x] Segurança HTTP e integração contínua
- [x] Perfil real e troca segura de senha
- [x] Tempo médio real de primeira resposta
- [x] Navegação lateral padronizada e acessível
- [x] Listagem de chamados com ordenação e paginação
- [x] Feedback consistente e operações mais seguras na interface
- [x] Dashboard com filtros por período e atalhos para a listagem
- [x] Validação automatizada do backend e build de produção do frontend
- [x] Validação manual final dos fluxos autenticados em produção

## ✅ Checklist da versão 1.0.0

- [x] Página pública e healthcheck disponíveis em produção
- [x] Layout público validado em computador e celular
- [x] Testes, lint, formatação e build aprovados
- [x] Login e sessão autenticada
- [x] Clientes e usuários
- [x] Chamados, comentários, histórico e anexos
- [x] Dashboard, filtros por período e relatórios

Todos os itens essenciais foram aprovados para a versão estável `1.0.0`.

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

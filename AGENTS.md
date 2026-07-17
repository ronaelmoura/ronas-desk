# Ronas Desk — Regras de desenvolvimento

## Objetivo do projeto

Sistema de gerenciamento de chamados desenvolvido para portfólio profissional.

## Tecnologias

### Frontend
- React
- Vite
- JavaScript

### Backend
- Node.js
- Express
- MySQL
- mysql2
- dotenv

## Arquitetura do backend

O backend segue MVC:

Route → Controller → Model → MySQL

- Routes recebem as requisições.
- Controllers validam dados e controlam a resposta.
- Models acessam o banco de dados.
- Controllers não devem executar SQL diretamente.
- Routes não devem conter regras de negócio.

## Regras obrigatórias

- Não alterar arquivos fora do escopo solicitado.
- Não apagar código sem explicar.
- Não modificar o banco sem apresentar o SQL.
- Não acessar ou revelar o arquivo .env.
- Não instalar dependências sem autorização.
- Não realizar commit automaticamente.
- Antes de editar, apresentar um plano curto.
- Depois de editar, listar os arquivos alterados.
- Sempre executar ou sugerir testes.
- Manter nomes de variáveis em português, seguindo o padrão existente.
- Preservar a estrutura MVC.

## Fluxo esperado

1. Analisar a tarefa.
2. Explicar o plano.
3. Alterar somente os arquivos necessários.
4. Executar testes ou validações.
5. Mostrar o resumo das mudanças.
6. Aguardar revisão humana antes do commit.
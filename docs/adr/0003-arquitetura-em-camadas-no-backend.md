# ADR 0003: Arquitetura em camadas no backend

- Status: Aceito
- Tipo: ADR retrospectivo

## Contexto

A organização do backend em `backend/src` segue uma estrutura por camadas, com separação entre rotas, middlewares, controllers, services, models, config e database. O `backend/src/app.js` monta a aplicação Express, define as rotas públicas e autenticadas e encadeia middlewares transversais antes de delegar a execução aos routers específicos. A documentação em `DEVLOG.md` registra a evolução do entendimento inicial do projeto: "O Model conversa com o banco. O Controller toma decisões. A Route recebe a requisição.", o que está alinhado com a estrutura atual.

Os módulos do backend refletem essa divisão:

- `backend/src/routes/`: definição dos endpoints e monta a interface HTTP.
- `backend/src/middlewares/`: regras transversais como autenticação, autorização e proteção de conta demo.
- `backend/src/controllers/`: entrada e saída HTTP, validação inicial e orquestração da requisição.
- `backend/src/services/`: regras de domínio reutilizáveis, como SLA, relatórios, auditoria e histórico.
- `backend/src/models/`: acesso ao banco e SQL de persistência.
- `backend/src/config/` e `backend/src/database/`: infraestrutura, configuração e pool do banco.

A estrutura não é uma Clean Architecture completa nem um conjunto de hexágonos isolados; ela é um padrão em camadas com responsabilidades distintas, mas com pontos de interação explícitos entre módulos.

## Decisão

O backend do Ronas Desk foi organizado como uma arquitetura em camadas, em fluxo aproximadamente:

HTTP
↓
Route
↓
Middleware
↓
Controller
↓
Service
↓
Model
↓
MySQL

As responsabilidades são distribuídas da seguinte forma:

- Routes: definem endpoints e conectam o HTTP ao fluxo de aplicação.
- Middlewares: resolvem preocupações transversais, como autenticação, autorização, proteção de rota e validação de contexto de usuário.
- Controllers: recebem a requisição, validam dados iniciais, orquestram chamadas e devolvem respostas.
- Services: centralizam regras de negócio e reutilização, especialmente em operações com múltiplas consultas ou regras internas complexas.
- Models: acessam o banco, executam SQL e encapsulam a persistência.
- Config/database: centralizam a infraestrutura e as propriedades de conexão do banco e de segurança do serviço.

Essa estrutura foi escolhida para manter o fluxo de entrada, o domínio e a persistência separados, sem exigir uma organização vertical por feature em todo o código. Ela também facilita a extensão gradual de regras de negócio sem espalhar lógica em rotas e controllers.

## Alternativas consideradas

- Lógica concentrada nos controllers: uma abordagem mais simples no início, porém mais difícil de manter e testar quando a regra de negócio cresce ou precisa ser reaproveitada em vários fluxos.
- Clean Architecture/Hexagonal completa: um desenho mais forte em termos de dependências e portas/adapters, mas não corresponde ao estado real do projeto, que ainda mantém acoplamentos diretos entre camadas e serviços específicos do Express/MySQL.
- Organização vertical por feature: uma alternativa natural para módulos mais coesos, mas o código atual mantém a separação por tipo de responsabilidade, e a estrutura existente já é a base de evolução do sistema.

## Consequências positivas

- Há uma separação clara entre interface HTTP, regras de negócio e persistência, o que facilita leitura do código e manutenção incremental.
- Regras repetidas podem ser centralizadas em services e middlewares, evitando duplicação de lógica em controllers.
- As camadas favorecem a testabilidade por unidade e integração, porque módulos de domínio e banco podem ser avaliados separadamente do transporte HTTP.
- A combinação com MySQL e SQL explícito é coerente com uma arquitetura em camadas, porque a camada de model permanece responsável por consultas e persistência.

## Consequências negativas

- O projeto ainda depende de alguns acoplamentos explícitos entre módulos, principalmente entre controllers, services, models e infraestrutura.
- Uma interface mais formal de ports/adapters não foi implementada, então a camada de domínio não é totalmente isolada da infraestrutura.
- Em fluxos mais complexos, o número de módulos pode aumentar, e a navegação entre camadas pode exigir mais leitura do código para entender a execução completa da requisição.

# ADR 0001: MySQL com SQL explícito e migrations versionadas

- Status: Aceito
- Tipo: ADR retrospectivo

## Contexto

O Ronas Desk mantém a persistência principal no MySQL e a configuração do banco é centralizada em `backend/src/config/database.js`, com `mysql2/promise` e um pool de conexões criado em `backend/src/database/db.js`. O projeto usa `mysql.createPool()` para reaproveitar conexões em vez de abrir uma conexão por operação, e a configuração define host, usuário, senha, banco, porta, limite de conexões, fila sem limite e SSL opcional para ambientes com TLS.

A aplicação modela dados de clientes, usuários, chamados, comentários, anexos, relatórios e histórico. Em vez de um ORM, os models do backend realizam consultas SQL explícitas com parâmetros, como é comum no código de `backend/src/models/`. Isso mantém a lógica de acesso ao banco próxima às consultas, mas exige disciplina de manutenção e revisão em cada mudança de schema ou consulta.

O ambiente local e a execução em container também refletem essa decisão: o `compose.yaml` levanta um serviço `mysql:8.4` com volume persistente e monta `backend/sql` em `/docker-entrypoint-initdb.d`, de forma que a base pode ser inicializada e reproduzida em um fluxo previsível. A aplicação também faz o controle de migrações via `backend/src/services/migrationService.js`, que consulta a tabela `schema_migrations`, impede execução em um banco já populado sem histórico de migração e registra cada migration aplicada.

Esse padrão foi adotado para manter a base de dados como fonte de verdade para operações transacionais e para preservar dados existentes em produção sem assumir que um banco novo ou legado sempre tenha um histórico confiável.

## Decisão

O projeto usa MySQL como banco principal, acessado via `mysql2/promise` e um pool de conexões compartilhado. As consultas em models e services são escritas em SQL explícito com parâmetros e não via um ORM. As alterações de schema são controladas por migrações SQL versionadas, armazenadas em `backend/sql/` e aplicadas em ordem numérica; cada migration bem-sucedida é registrada em `schema_migrations`.

O mecanismo de migração também tem uma regra de proteção: quando o banco já contém tabelas da aplicação sem histórico de migrations, a execução falha com `BancoExistenteSemHistoricoError` em vez de tentar assumir que o schema é seguro para continuar. Isso reduz o risco de migrar uma base existente sem rastreabilidade.

## Alternativas consideradas

- Prisma, Sequelize ou TypeORM: alternativas arquiteturais plausíveis para abstrair acesso a dados e reduzir SQL manual. O código atual, porém, foi construído com SQL direto e com convenções de migration manual, então a decisão foi manter o controle explícito da consulta e do schema.
- MongoDB: uma opção para dados semiestruturados, mas o domínio do Ronas Desk tem relações explícitas entre clientes, usuários, chamados, responsáveis, comentários, histórico e relatórios, além de operações transacionais e consultas específicas por tabela. A estrutura atual favorece um banco relacional.
- PostgreSQL: também é um banco relacional compatível com o mesmo padrão arquitetural, mas o projeto foi implementado com MySQL e a integração local e em produção já está alinhada a esse motor, inclusive em container e em ambiente de produção.

## Consequências positivas

- O controle sobre SQL fica expresso e audível no código, o que facilita análise de performance, correções de query e revisão de regras de negócio.
- A utilização de `mysql2/promise` e pool de conexões reduz a sobrecarga de abrir e fechar conexões em cada operação e mantém uma base estável para o backend.
- O uso de queries parametrizadas reduz risco de injeção e torna a execução mais previsível.
- A regra de `schema_migrations` e a proteção de banco existente torna a evolução do schema rastreável e mais segura em ambientes compartilhados e em produção.
- A separação entre SQL, migrations e execução de negócio reduz a chance de mudanças de estrutura serem feitas de forma ad hoc.

## Consequências negativas

- O código exige mais boilerplate em comparação a um ORM, porque toda consulta precisa ser escrita e revisada manualmente.
- O schema precisa ser mantido por disciplina de migração; uma mudança mal planejada pode acarretar regressão de compatibilidade ou backfill manual.
- O acoplamento ao MySQL implica pensar em recursos específicos do banco, índices e compatibilidade em operações de produção.
- O projeto depende da disciplina de equipe para não misturar alteração estruturural com lógica de aplicação, especialmente em um ambiente com histórico e dados reais.

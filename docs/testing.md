# Estratégia de testes

## Testes unitários

Os testes unitários cobrem serviços, models, middlewares e controllers de forma isolada quando o comportamento pode ser validado sem depender de infraestrutura externa. Essa abordagem permite verificar regras de negócio e respostas HTTP esperadas em cenários específicos, como autenticação, autorização, validação de payload e transições de status.

## Testes de componente / integração HTTP

Alguns testes sobem a aplicação Express real e fazem requisições HTTP usando `fetch` em uma porta aleatória. Esse padrão é usado para validar rotas protegidas, respostas de erro e a composição real da aplicação sem introduzir infraestrutura de banco em ambiente de testes.

O banco pode continuar substituído nesses testes; a intenção não é simular uma instância real de MySQL, mas provar o comportamento do app e das camadas de middleware/roteamento.

## Integração com banco real

Ainda não existe suíte automatizada utilizando uma instância real de MySQL.

## Frontend

Ainda não existe suíte automatizada do frontend.

## E2E

Ainda não existe teste E2E/browser.

## Cobertura

Os comandos disponíveis são:

- `npm test`
- `npm run test:coverage`
- `npm run test:coverage:ci`

Os thresholds adotados no quality gate do backend são:

- linhas: 60%
- funções: 65%
- branches: 75%

A cobertura é um indicador complementar e não substitui testes de comportamento. O objetivo principal é detectar regressões e blindar os caminhos mais críticos de autenticação, autorização e manutenção de dados.

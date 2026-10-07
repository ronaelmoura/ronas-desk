# Auditoria técnica do Ronas Desk — 5 de outubro de 2026

Base examinada: commit `3d12971`, branch `main`, inicialmente sem alterações locais. Esta entrega é uma avaliação: não corrige código, não aplica migrations e não altera dependências.

## Parecer

O sistema tem uma base de engenharia útil: separação de camadas, SQL parametrizado nos caminhos examinados, transações nos fluxos principais de chamados, validação de permissões no banco e testes automatizados. Contudo, não deve ser considerado pronto para operação com dados sensíveis apenas por compilar ou ter uma demonstração visual convincente. Há riscos de isolamento da demonstração, dependências com alertas conhecidos e falhas funcionais em indicadores, paginação e administração.

P1 significa correção prioritária antes de ampliar a exposição. P2 significa defeito relevante a corrigir no próximo ciclo. Condições de exploração são explicitadas: não foi demonstrada invasão nem exposição de dados reais.

## Verificações executadas

| Verificação | Resultado |
| --- | --- |
| Backend: `npm test` | 307 aprovados, zero falhas |
| Backend: `npm run lint` | Aprovado; aviso de `.eslintignore` não suportado na configuração atual |
| Frontend: `npm run lint` | Aprovado |
| Frontend: `npm run build` | Aprovado |
| Frontend: `npm test` | 59 aprovados, zero falhas |
| Dependências de produção: `npm audit --omit=dev --json` | Backend: 2 pacotes sinalizados; frontend: 1 |
| Reproduções locais com dados sintéticos | Cancelado contado como SLA vencido; autorrebaixamento de administrador aceito |
| `git diff --check` | Sem erro |

Os logs de testes do backend incluem falhas de banco simuladas deliberadamente; o resultado final é de aprovação. As reproduções adicionais bloquearam métodos de acesso ao pool para impedir conexão real.

Não executei os testes de integração: eles usam MySQL real e truncam tabelas. Não li arquivos de ambiente ou valores de credenciais. Não executei testes de carga, exploração de vulnerabilidades, restauração de backup ou chamadas reais a Cloudinary/Gemini. O estado de produção e os checks remotos não foram consultados. A inspeção visual anterior usou fixtures locais; esta auditoria não equivale a um novo teste visual completo de todas as telas.

## Achados prioritários

### 1. P1 — Demonstração não isola leituras dos dados operacionais

Evidência: `backend/src/controllers/authController.js:169`, `backend/src/middlewares/demoReadOnlyMiddleware.js:5`, `backend/src/middlewares/equipeMiddleware.js:8`, `backend/src/models/chamadoModel.js:133`, `backend/src/models/usuarioModel.js:40` e `backend/src/routes/chamados.routes.js:40`.

O login demo é público. O middleware demo libera GET/HEAD; o middleware de equipe permite conta demo ativa de cargo interno. As consultas de chamados/clientes/usuários não restringem os registros a um conjunto demonstrativo. A rota GET de download também pode emitir URLs temporárias de anexos.

Impacto: se dados reais e conta demo coexistirem no mesmo banco, um visitante poderá ler os dados expostos pelas rotas de equipe, inclusive obter downloads. O modo somente leitura impede alterações, mas não protege confidencialidade. Não confirmei coexistência de dados reais em produção.

Correção: usar ambiente/banco demonstrativo separado ou impor isolamento de dados em todas as consultas e downloads. Testar que o token demo nunca alcança um registro operacional conhecido. Não confiar em ocultar botões.

### 2. P1 — Multer instalado com alertas de negação de serviço

O inventário local contém `multer@2.2.0`, usado em `backend/src/middlewares/anexoUploadMiddleware.js:5`. O audit sinaliza o pacote como alta severidade, com correção disponível. Um dos avisos descreve queda do processo ao analisar nomes de campos multipart: [GHSA-wc9g-mqfw-jrwm](https://github.com/advisories/GHSA-wc9g-mqfw-jrwm).

No Ronas Desk, a rota passa por autenticação e bloqueio demo antes do upload; portanto, não classifiquei a exploração como pública e anônima neste aplicativo. O uso de memoryStorage reduz a relevância de avisos específicos de escrita em disco, mas não elimina problemas no parser de campos. Não enviei payload de exploração.

Também foram sinalizados `ip-address@10.4.0` (transitivo, moderado) e `axios@1.18.1` (alto no inventário). Os avisos Axios incluem caminhos exclusivos do Node; o uso examinado é no navegador, então não há evidência de que todos sejam exploráveis aqui. Exemplo dessa distinção: [aviso do parser data URI no Node](https://github.com/advisories/GHSA-c29m-xwm3-cm6r).

Correção: atualizar os pacotes e lockfiles para versões que eliminem os avisos atuais e repetir testes de upload, HTTP e audit. Não aplicar atualização forçada sem revisar mudanças.

### 3. P2 — Administrador pode retirar o próprio cargo e deixar o sistema sem administração

Evidência: `backend/src/controllers/usuariosController.js:216`. Há bloqueio contra autodesativação em outra operação, mas não contra autorrebaixamento na atualização de cargo.

Reprodução isolada: usuário autenticado com id 1 e cargo Administrador; atualização de seu próprio cadastro para Atendente; controller respondeu HTTP 200 com cargo Atendente. Modelos foram substituídos por funções locais, sem banco.

Impacto: se ele for o último administrador ativo, a recuperação dependerá de intervenção externa. Também não identifiquei garantia transacional de preservar pelo menos um administrador nas demais operações.

Correção: proteger o último administrador ativo em alteração de cargo, desativação e exclusão, considerando requisições concorrentes. Incluir teste de autorrebaixamento e de dois administradores alterados simultaneamente.

### 4. P2 — Exclusão de anexo pode deixar registro apontando para arquivo perdido

Evidência: `backend/src/controllers/anexosController.js:243`. A remoção no Cloudinary acontece antes de obter a conexão e iniciar a transação que exclui o registro e grava o histórico.

Se o armazenamento confirmar a remoção e o banco falhar depois, o rollback não recupera o arquivo. A interface pode continuar mostrando um anexo cujo conteúdo foi apagado.

Correção: registrar intenção de exclusão e processar remoção de forma recuperável/idempotente, com estado pendente e repetição controlada. Testar falha de banco imediatamente depois da remoção externa.

### 5. P2 — Chamados cancelados entram na fila de SLA vencido

Evidência: `backend/src/config/sla.js:17`, `backend/src/services/slaService.js` e `backend/src/models/dashboardModel.js:114`. Os finalizados são apenas Resolvido/Fechado; a consulta de atrasos inclui tudo que não está nesses dois estados.

Reprodução: um único chamado Cancelado, prioridade Alta, criado 48 horas antes, produziu `sla_vencidos: 1` no serviço. O SQL do dashboard tem a mesma condição.

Impacto: a fila de atenção aponta demanda cancelada como trabalho atrasado. O próprio portal considera Cancelado fora dos chamados abertos, reforçando a inconsistência entre telas.

Correção: definir separadamente estados ativos, resolvidos e cancelados, alinhando serviço, SQL, filtros e relatórios. Cancelado não deve ser contado como resolvido para melhorar artificialmente o tempo médio.

### 6. P2 — Resumo do portal mistura total global e contagens da página

Evidência: `frontend/src/pages/PortalCliente/PortalCliente.jsx:300`. Total vem de `paginacao.total`; Em acompanhamento e Resolvidos são calculados somente sobre os até dez registros carregados.

Com 25 chamados, o cartão Total pode mostrar 25 e os outros cartões mudam ao navegar entre páginas, embora a carteira do cliente seja a mesma.

Correção: retornar agregados do cliente no backend ou identificar expressamente os indicadores como relativos à página. Preferir agregados globais para o resumo principal.

### 7. P2 — Criação no portal deixa número de páginas desatualizado

Evidência: `frontend/src/pages/PortalCliente/PortalCliente.jsx:310`. A inclusão incrementa `total` e corta a lista para dez registros, mas não recalcula `total_paginas` nem recarrega quando já está na primeira página.

Cenário: dez chamados e uma página; criar o décimo primeiro mantém `total_paginas: 1`, escondendo o acesso ao registro que saiu da primeira página até atualizar a lista.

Correção: recarregar lista e paginação após criar ou atualizar ambos de maneira consistente. Testar passagem de 10 para 11 e de 20 para 21 registros.

### 8. P2 — Histórico do cliente calcula SLA com origem antiga após reabertura

Evidência: `backend/src/models/clienteModel.js:88` e `backend/src/controllers/clientesController.js`. `buscarChamados` seleciona `created_at` e `resolved_at`, mas omite `sla_started_at`; o controller passa o resultado ao enriquecimento de SLA.

Após reabrir, o SLA reinicia em `sla_started_at`. Nessa consulta ele volta a usar a criação original, podendo divergir da listagem principal. Também falta `first_response_at` nessa projeção.

Correção: padronizar os campos necessários ao enriquecimento e testar o mesmo chamado reaberto nas duas rotas.

### 9. P2 — Notificações oferecem operações proibidas na demonstração

Evidência: `frontend/src/pages/Notificacoes/Notificacoes.jsx:85` e `:112`; `backend/src/app.js:98`.

A tela não recebe nem consulta `somenteLeitura`. Se houver notificações não lidas, clicar nelas ou em Marcar todas chama endpoints de escrita que retornam 403 para demo.

Correção: apresentar leitura sem essas ações na conta demo, com explicação contextual. Testar o caminho com notificações existentes, não apenas com uma lista vazia.

### 10. P2 — Inicialização Docker não registra histórico de migrations

Evidência: `compose.yaml:17`, `backend/src/services/migrationService.js:65`. O MySQL inicializa executando os arquivos SQL diretamente. Nenhum desses arquivos registra `schema_migrations`; o executor de migrations recusa banco com tabelas existentes sem histórico.

Consequência: banco novo via Compose e atualizações posteriores via `npm run migrate` não seguem a mesma trilha. O comando de atualização pode parar com `BancoExistenteSemHistoricoError`. A proteção é correta, mas a combinação dos fluxos de instalação é inconsistente.

Correção: unificar bootstrap e migração versionada. Para bancos existentes, fazer baseline revisável, sem reaplicar cegamente scripts ou marcar migrations desconhecidas como executadas.

### 11. P2 — Integração SQL fora do CI e isolamento frágil da suíte

Evidência: `.github/workflows/ci.yml`, `backend/package.json:8`, `backend/test-integration/helpers.js:37`.

O CI executa unitários e build, mas não cria MySQL nem roda integração. Os arquivos de integração compartilham DB_NAME e limpam as mesmas tabelas; o comando não serializa os arquivos nem cria um schema por trabalhador. Além disso, `SET FOREIGN_KEY_CHECKS` e TRUNCATE usam o pool em chamadas separadas: a configuração pertence à conexão, não a todo o pool.

Impacto: a suíte pode ter interferência entre arquivos e limpeza não confiável, além de erros SQL não serem barrados pelo CI atual. Não executei essa suíte destrutiva.

Correção: banco descartável no CI; schema por trabalhador ou execução serial; reservar uma conexão para toda a limpeza e restaurar as verificações em finally.

### 12. P2 — Troca de senha não revoga sessões existentes

Evidência: `backend/src/controllers/authController.js` em `alterarSenha`, `backend/src/middlewares/authMiddleware.js` e atualização de senha no model.

A senha muda, mas JWTs emitidos antes continuam válidos até expirar. As permissões são reconsultadas no banco, o que protege mudanças de cargo/ativação, mas não distingue um token anterior à troca de senha. O prazo padrão de emissão é oito horas.

Impacto condicionado: quem já possui um token obtido indevidamente continua autenticado mesmo após o usuário trocar a senha. Não houve token real inspecionado ou usado.

Correção: incluir versão da sessão ou data de revogação no cadastro e validá-la a cada requisição; decidir se logout encerra uma ou todas as sessões. Documentar a política.

### 13. P2 — Busca de clientes aceita respostas fora de ordem

Evidência: `frontend/src/pages/Clientes/clientes.jsx:50`. A cada mudança da busca, `carregarClientes` inicia uma requisição e aplica o resultado sem cancelamento ou verificação de atualidade.

Cenário: a busca A demora; a busca AB termina primeiro; a resposta de A chega depois e substitui os resultados de AB. O campo mostra AB, mas a tabela exibe A. Também existe risco semelhante ao abrir históricos de clientes sucessivamente.

Correção: cancelar requisições anteriores ou usar identificador da requisição e descartar resultados obsoletos. Debounce reduz tráfego, mas não substitui proteção contra corrida.

## Outros pontos de melhoria

- `chamados_criticos` conta toda prioridade Crítica, inclusive resolvidos/fechados, mas é apresentado em “O que precisa de ação”. Ajustar o escopo ou o rótulo.
- O cliente HTTP não define timeout global; a interface pode ficar ocupada por tempo indefinido em uma conexão que não conclui. Definir limites por tipo de operação.
- O seed demo é criado com datas relativas à execução, mas não se renova automaticamente. Registros envelhecem e alteram a narrativa de SLA. Não alterar datas reais para esconder atrasos; manter cenário demonstrativo separado e renovável.
- A minimização de conteúdo antes de enviar ao assistente de IA usa regex limitada. Isso não garante remoção de toda informação pessoal ou credencial inserida em texto livre. Revisar a política de envio e testar padrões sintéticos variados.
- O servidor não apresenta fluxo explícito de encerramento gracioso e fechamento do pool. Verificar comportamento de deploy e requisições em andamento.
- Os estilos estão distribuídos em folhas base e camadas de sobrescrita. A demonstração agora tem outra camada visual; vale consolidar tokens e componentes para evitar divergência entre a demonstração e as contas de trabalho.
- Não foi gerada cobertura nova nesta rodada; contagem de testes não é percentual de cobertura nem prova de todos os fluxos.

## Pontos positivos verificados

- JWT limitado a HS256 e identificação validada; cargo/ativação reavaliados por middlewares em rotas internas.
- Portal restringe consultas por cliente e comentários públicos, e bloqueia conta demo.
- Operações principais de chamados usam transações e, nas atualizações examinadas, bloqueio para atualização.
- Anexos têm limite de tamanho, validação de extensão/MIME/assinatura e armazenamento autenticado com URL temporária.
- Configuração SSL do banco exige validação do certificado quando habilitada.
- Há filtros SQL parametrizados, ordenação por lista permitida e paginação.
- Frontend inclui tratamento de foco, redução de movimento e navegação por teclado em diversos componentes.

## Ordem recomendada de correção

1. Isolar dados da demonstração e atualizar dependências sinalizadas, com testes de regressão.
2. Proteger administração e tornar a exclusão de anexos recuperável.
3. Corrigir SLA, indicadores e paginação do portal, com casos reais representados por fixtures.
4. Unificar migrations/Compose e colocar integração confiável no CI.
5. Corrigir estados de demonstração, concorrência da busca e revogação de sessões.

Conclusão de escopo: 13 achados prioritizados, sendo 2 P1 e 11 P2. A ausência de falhas nos 366 testes executados não invalida esses achados; vários deles estão fora dos cenários testados hoje.

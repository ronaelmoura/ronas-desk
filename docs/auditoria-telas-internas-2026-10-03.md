# Revisão visual das telas internas — 3 de outubro de 2026

## Escopo e ambiente

Dashboard, Chamados, Clientes e Portal do Cliente inspecionados no navegador com dados fictícios servidos por uma prévia Vite isolada. A prévia substitui os contextos de usuário e marca e responde localmente às chamadas HTTP. Não usa credenciais, backend ou banco real. O servidor de inspeção fica fora do repositório.

## Melhorias

- Layout móvel: linhas explícitas na grade impedem espaço excessivo entre menu e conteúdo em páginas curtas.
- Chamados: grade de filtros fluida também acima de 1440px; filtros adicionais recolhíveis até 600px, com contador de opções ativas e indicação acessível de expansão.
- Chamados: estado vazio com ícone, orientação e ação para limpar filtros; botão de criação com ícone Lucide; cartão alinhado aos raios e sombras do painel.
- Tabelas: largura mínima para nomes de clientes e títulos de chamados; rolagem horizontal contida, acessível ao teclado e com indicação em telas menores.
- Clientes: texto digitado na busca com peso normal.
- Portal: tipografia explícita nas linhas, títulos longos com quebra, badges alinhados no celular, ícones dos indicadores com fundo suave, botão Atualizar com área de interação maior e criação em largura total no celular.

## Verificação

- Inspeção visual de desktop e celular nas quatro telas. Chamados também conferidos em 1536px.
- Abertura e fechamento dos filtros, seleção de prioridade, contador `Mais filtros (1)`, busca sem resultados e limpeza da busca conferidos no navegador.
- Chamados: documento com largura de 390px em viewport de 390px, mantendo a rolagem dentro da tabela.
- Clientes e Portal: documento sem transbordamento horizontal em 320px; Portal também verificado em 900px.
- Nenhum erro de execução reportado pelo navegador na conferência final.
- Lint e build aprovados; 57 testes existentes aprovados em 9 arquivos. Build repetido após o último ajuste de CSS.
- `git diff --check` aprovado; avisos de LF/CRLF são da configuração Git no Windows.

## Limites

As respostas de busca são simuladas para avaliar estados visuais. Não foram validados filtros SQL, autenticação, gravações, paginação real ou detalhes de chamados contra o backend. Não houve publicação em produção.

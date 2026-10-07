# Auditoria visual do Ronas Desk

Data: 07/10/2026

## Escopo e método

Foram inspecionadas no ambiente publicado as telas de login, visão geral, clientes, detalhe de cliente, chamados, detalhe de chamado, notificações, usuários e relatórios em 1440 px e 390 px. Também foram revisados no código o portal do cliente, avaliações, visitas, configurações, estados vazios, foco, movimento reduzido, imagens e iconografia. As telas que exigem uma conta operacional ou de cliente foram avaliadas pelo código, pois a demonstração não expõe esses perfis.

Evidências visuais estão em `docs/visual-audit/`.

## Avaliação geral

| Critério | Nota | Leitura |
| --- | ---: | --- |
| Hierarquia e composição | 8,2/10 | Boa leitura, títulos claros e blocos bem separados. |
| Consistência visual | 7,4/10 | Forte na demonstração, mas o tema verde e plano diverge das telas operacionais azuis. |
| Responsividade | 7,0/10 | Não há estouro global, porém tabelas, guia e relatórios exigem esforço excessivo no celular. |
| Tipografia e contraste | 6,6/10 | Escala organizada, mas vários textos auxiliares pequenos não atingem contraste adequado. |
| Ícones e imagens | 8,1/10 | Lucide está bem aplicado; há um emoji destoante e ativos antigos sem uso. |
| Clareza da demonstração | 7,1/10 | O roteiro explica o produto, mas ocupa espaço demais e o detalhe do chamado parece editável. |

Resultado geral: **7,4/10**. O produto já transmite seriedade e organização. Os maiores ganhos agora estão em reduzir ruído no celular, tornar a demonstração visualmente inequívoca e corrigir contraste e contratos visuais.

## Problemas prioritários

### P1 — Responsável do chamado desaparece no detalhe da demonstração

Na lista, o chamado `#002` mostra Bruno Costa. No modal, o campo Responsável mostra “Não atribuído”. O serviço sintético entrega usuários com cargo `Técnico`, enquanto o modal aceita somente `Administrador` e `Atendente`. Além de ser uma inconsistência funcional, ela derruba a confiança visual na demonstração.

Correção indicada: alinhar o cargo sintético ao domínio aceito ou ampliar o filtro do modal; adicionar um teste de interface que confirme o responsável exibido.

### P1 — Contraste insuficiente em textos pequenos

Há textos de 11–14 px usando cinzas como `#8995a6`, `#8793a5`, `#738197`, `#748197` e `#7e8a9c` sobre fundos brancos ou quase brancos. As relações medidas ficam entre 2,86:1 e 3,95:1; texto normal pede 4,5:1. O problema aparece em privacidade do login, descrições, metadados, tabelas e painéis de visitas.

Correção indicada: eliminar os cinzas mais claros para texto, usar no mínimo os tokens `--color-text-secondary` e `--color-text-muted`, e reservar `--color-text-faint` para elementos não textuais.

### P2 — Guia da demonstração domina o celular

O guia ocupa aproximadamente uma tela antes do conteúdo principal e é repetido em todas as áreas. Mesmo depois de completar 4 de 4 etapas, ele permanece aberto. Isso empurra títulos, filtros e indicadores para baixo e transforma tarefas simples em páginas muito longas.

Correção indicada: mostrar a versão completa apenas na primeira visita; depois, recolher automaticamente para uma barra compacta com progresso e botão “Continuar roteiro”. Ao concluir, manter somente uma confirmação discreta.

### P2 — Tabelas móveis escondem informação essencial

Clientes e chamados usam tabelas largas com rolagem horizontal. Existe uma instrução para deslizar, porém o primeiro enquadramento mostra apenas ID e nome/título. Status, SLA e a ação “Ver detalhes” ficam fora da tela. A rolagem horizontal em uma lista longa também compete com a rolagem vertical.

Correção indicada: abaixo de 600 px, usar cartões ou linhas em duas camadas. Em chamados, manter sempre visíveis título, status, prioridade, SLA e ação. Em clientes, exibir nome, empresa, status e acesso ao detalhe.

### P2 — Modal de chamado perde orientação em telas pequenas

As abas são roláveis horizontalmente, mas “Anexos” já aparece cortado e não existe indicação visual de que há mais conteúdo. O modal é alto, o título ocupa várias linhas e os campos da demonstração mantêm aparência de formulário editável, embora a conta seja somente leitura.

Correção indicada: cabeçalho e abas fixos dentro do modal, gradiente de continuidade nas abas e conteúdo em cartões de leitura na demonstração. Deixar formulários apenas para contas com permissão de edição.

### P2 — Relatórios ficam excessivamente longos no celular

A captura completa da tela de relatórios chega a cerca de 4.500 px. Cinco KPIs, quatro distribuições e toda a tabela são empilhados. A informação está correta, mas comparar dados exige muita rolagem e memória visual.

Correção indicada: KPIs em grade 2 × N, gráficos em abas ou acordeões e detalhamento recolhido inicialmente. Manter filtros e exportação próximos em uma barra compacta.

### P2 — Demonstração e produto operacional parecem temas distintos

A entrada usa azul escuro e azul vivo. A demonstração troca para verde escuro, superfícies planas e números com outra linguagem. A distinção ajuda a sinalizar o modo demo, mas hoje a mudança é grande o suficiente para parecer outro produto.

Correção indicada: preservar azul como cor de ação e usar verde somente como sinal de demonstração e sucesso. Manter a mesma escala de raios, elevação e componentes entre os modos.

## Problemas secundários

- A tela de notificações vazia usa uma grande área branca para pouca informação. Um atalho para chamados ou explicação de quais eventos geram alertas daria propósito ao estado vazio.
- O desktop repete o guia em uma área alta antes de todas as páginas. Mesmo em 1440 px, isso posterga o conteúdo real e cria excesso de linhas horizontais.
- Configurações usa o caractere `🔒` como ícone de segurança, enquanto todo o restante do produto usa Lucide. Trocar por `LockKeyhole` elimina a única quebra evidente da linguagem de ícones.
- O arquivo `frontend/public/logo-ronas-desk.png` ocupa cerca de 1,2 MB e não aparece no fluxo inspecionado. `frontend/src/assets/vite.svg` também parece remanescente do template. Remover ativos sem uso reduz ruído e risco de publicação acidental.
- O texto de privacidade no login móvel é longo e encerra a tela com baixa hierarquia. Pode ser resumido com link “Saiba como usamos dados anônimos”.
- A configuração atual ainda contém valores legados de raio, espaço e altura de controle fora dos tokens documentados. Isso aparece como pequenas diferenças entre cartões e campos das telas operacionais.
- O relatório detalhado em desktop é visualmente correto, porém denso; cabeçalho fixo e linhas alternadas sutis ajudariam em listas maiores.

## Pontos fortes confirmados

- Login desktop tem composição forte, boa proporção entre apresentação e formulário e CTA de demonstração claro.
- Sidebar e menu móvel são organizados, previsíveis e usam ícones coerentes com os rótulos.
- Hierarquia de títulos, subtítulos e números é consistente nas áreas principais.
- Estados, prioridades e SLA combinam cor, texto e forma; a leitura não depende apenas da cor.
- Não foram encontradas imagens quebradas, imagens sem atributo `alt` nem overflow horizontal no documento em 390 px.
- O sistema tem foco visível global, link para pular navegação e suporte a `prefers-reduced-motion`.
- O menu móvel expande em uma grade clara e mantém identidade e saída acessíveis.
- Os estados vazios têm texto explicativo e ícones simples, sem ilustrações genéricas ou imagens decorativas com aparência artificial.
- A escolha de evitar fotos de banco e ilustrações geradas é adequada para este produto; os dados, ícones e gráficos são o conteúdo visual principal.

## Ordem recomendada de melhoria

1. Corrigir responsável da demonstração e contrastes de texto.
2. Compactar o guia após a primeira etapa e ao concluir o roteiro.
3. Substituir tabelas por cartões responsivos em clientes, chamados e relatórios.
4. Criar apresentação somente leitura específica para o modal da demonstração.
5. Compactar relatórios móveis e alinhar o tema demo à identidade azul principal.
6. Padronizar o ícone de segurança e remover ativos sem uso.

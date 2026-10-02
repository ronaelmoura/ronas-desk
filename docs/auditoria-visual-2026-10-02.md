# Auditoria visual — 2 de outubro de 2026

Revisão do código de estilos, ícones e imagens do frontend, com inspeção do login no navegador em 1440 × 1000 e 390 × 844. As telas autenticadas foram revisadas pelo código; não houve conexão ao backend ou banco de dados.

## Achados e melhorias

| Achado | Melhoria aplicada |
| --- | --- |
| Logos personalizadas esticadas em caixas quadradas; prévia com recorte por `cover` | `object-fit: contain` nos pontos de exibição e prevenção de encolhimento em flex |
| Fallback de logo podia repetir a requisição se a própria imagem padrão falhasse | Verificação do endereço antes de substituir e reutilização da função no portal |
| Nomes de empresa longos sem proteção de quebra | Quebra de palavras nos blocos de identidade |
| Textos secundários com contraste discreto em fundos claros | Token compartilhado alterado de `#71819c` para `#596b85` |
| Ícones com peso visual variável | Base Lucide de 1,75, preservando regras específicas existentes |
| Fluxo de atendimento no login somente textual | Ícones de entrada, priorização e resolução, decorativos para leitores de tela |
| Seta diagonal sugeria saída para outro endereço | Seta horizontal na ação de entrar |
| Erros de login sem destaque nos campos | Borda vermelha e fundo suave associados ao `aria-invalid` existente |
| Estados vazios sem base compartilhada de respiro | Padding e entrelinha comuns com baixa especificidade |

## Validação

- `npm run lint`: aprovado.
- `npm run build`: aprovado.
- `npm test`: 57 testes aprovados em 9 arquivos.
- `git diff --check`: aprovado; Git apenas avisa sobre conversão LF/CRLF no Windows.
- Login inspecionado em desktop e celular, com marca padrão, sem cortes aparentes.
- Prévia isolada com API indisponível propositalmente; autenticação e telas com dados reais não foram verificadas no navegador.

## Limites e próximos pontos de atenção

- Cores personalizadas da empresa precisam de avaliação de contraste por combinação; a alteração do token não certifica todas as combinações.
- Logos horizontais permanecem inteiras, mas podem ficar pequenas no espaço compacto do menu.
- Arquivos de exemplo `react.svg`, `vite.svg` e `hero.png` existem em assets; não foram removidos nesta revisão.
- Não houve publicação em produção.

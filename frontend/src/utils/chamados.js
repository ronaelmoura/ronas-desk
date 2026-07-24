export const STATUS_CHAMADOS = [
  "Novo",
  "Em Atendimento",
  "Aguardando Cliente",
  "Resolvido",
  "Fechado",
  "Cancelado",
];

export const PRIORIDADES_CHAMADOS = ["Crítica", "Alta", "Média", "Baixa"];

export function classeChamado(prefixo, valor = "") {
  const sufixo = valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return `${prefixo}-${sufixo}`;
}

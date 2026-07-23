import { AlertCircle, CheckCircle2, Clock3, HelpCircle } from "lucide-react";

const configuracoes = {
  "Dentro do prazo": { classe: "dentro", Icone: CheckCircle2 },
  "Próximo do vencimento": { classe: "proximo", Icone: Clock3 },
  Vencido: { classe: "vencido", Icone: AlertCircle },
};

function SlaBadge({ status }) {
  const configuracao = configuracoes[status];
  const Icone = configuracao?.Icone || HelpCircle;

  return (
    <span className={`sla-badge ${configuracao?.classe || "indisponivel"}`}>
      <Icone size={14} aria-hidden="true" />
      {status || "SLA indisponível"}
    </span>
  );
}

export default SlaBadge;

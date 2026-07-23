import { CalendarClock, Timer } from "lucide-react";
import SlaBadge from "./SlaBadge";
import SlaProgress from "./SlaProgress";
import "./sla.css";

function formatarDuracao(minutos) {
  if (!Number.isFinite(minutos)) return "Ainda não disponível";

  const totalMinutos = Math.max(0, Math.round(Math.abs(minutos)));
  const dias = Math.floor(totalMinutos / 1440);
  const horas = Math.floor((totalMinutos % 1440) / 60);
  const minutosRestantes = totalMinutos % 60;

  if (dias) return `${dias}d ${horas}h`;
  if (horas) return `${horas}h ${minutosRestantes}min`;
  return `${minutosRestantes}min`;
}

function formatarData(valor) {
  if (!valor) return "Ainda não disponível";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "Ainda não disponível";
  return data.toLocaleString("pt-BR");
}

function SlaCard({ sla }) {
  if (!sla) {
    return (
      <section className="sla-card">
        <SlaBadge />
      </section>
    );
  }

  const textoRestante = sla.isOverdue
    ? `Vencido há ${formatarDuracao(sla.remainingMinutes)}`
    : `${formatarDuracao(sla.remainingMinutes)} restantes`;

  return (
    <section className="sla-card" aria-labelledby="sla-card-title">
      <header>
        <div>
          <span className="sla-card-eyebrow">Acordo de nível de serviço</span>
          <h3 id="sla-card-title">SLA do chamado</h3>
        </div>
        <SlaBadge status={sla.status} />
      </header>

      <SlaProgress
        percentage={sla.percentage}
        displayPercentage={sla.displayPercentage}
        status={sla.status}
      />

      <div className="sla-card-metrics">
        <div>
          <Timer size={18} aria-hidden="true" />
          <span>Tempo consumido</span>
          <strong>{formatarDuracao(sla.elapsedMinutes)}</strong>
        </div>
        <div>
          <CalendarClock size={18} aria-hidden="true" />
          <span>{sla.isResolved ? "Vencimento previsto" : "Tempo restante"}</span>
          <strong>
            {sla.isResolved ? formatarData(sla.dueAt) : textoRestante}
          </strong>
        </div>
      </div>
    </section>
  );
}

export default SlaCard;

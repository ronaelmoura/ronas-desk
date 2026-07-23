function SlaProgress({ percentage, displayPercentage, status }) {
  const percentual = Number.isFinite(percentage) ? percentage : 0;
  const progresso = Number.isFinite(displayPercentage)
    ? Math.min(100, Math.max(0, displayPercentage))
    : Math.min(100, Math.max(0, percentual));
  const classe =
    status === "Vencido"
      ? "vencido"
      : status === "Próximo do vencimento"
        ? "proximo"
        : "dentro";

  return (
    <div className="sla-progress-wrapper">
      <div className="sla-progress-label">
        <span>Consumo do prazo</span>
        <strong>{Math.round(percentual)}%</strong>
      </div>
      <div
        className="sla-progress"
        role="progressbar"
        aria-label={`${Math.round(percentual)}% do SLA consumido`}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={Math.round(progresso)}
      >
        <span className={classe} style={{ width: `${progresso}%` }} />
      </div>
    </div>
  );
}

export default SlaProgress;

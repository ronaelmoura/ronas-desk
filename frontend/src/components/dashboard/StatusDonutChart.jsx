import CountUp from "../ui/CountUp";

const RAIO = 40;
const CIRCUNFERENCIA = 2 * Math.PI * RAIO;

function StatusDonutChart({ segmentos, total, rotuloCentro = "chamados" }) {
  let percentualAcumulado = 0;

  return (
    <div className="status-donut">
      <svg
        viewBox="0 0 100 100"
        width="128"
        height="128"
        role="img"
        aria-label={`${total} ${rotuloCentro} distribuídos por status`}
      >
        <circle className="status-donut-track" cx="50" cy="50" r={RAIO} />
        <g transform="rotate(-90 50 50)">
          {segmentos.map((segmento) => {
            if (!segmento.total) return null;

            const fracao = total ? segmento.total / total : 0;
            const comprimento = fracao * CIRCUNFERENCIA;
            const offset = -percentualAcumulado * CIRCUNFERENCIA;
            percentualAcumulado += fracao;

            return (
              <circle
                key={segmento.status}
                className="status-donut-segment"
                cx="50"
                cy="50"
                r={RAIO}
                stroke={segmento.cor}
                strokeWidth="14"
                strokeDasharray={`${comprimento} ${CIRCUNFERENCIA}`}
                strokeDashoffset={offset}
              />
            );
          })}
        </g>
      </svg>
      <div className="status-donut-center">
        <strong>
          <CountUp value={total} />
        </strong>
        <span>{rotuloCentro}</span>
      </div>
    </div>
  );
}

export default StatusDonutChart;

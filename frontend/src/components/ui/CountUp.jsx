import useCountUp from "../../hooks/useCountUp";

const formatador = new Intl.NumberFormat("pt-BR");

function CountUp({ value, duration }) {
  const valorExibido = useCountUp(value, { duracao: duration });
  return formatador.format(valorExibido);
}

export default CountUp;

import apiClient from "./apiClient";

export async function buscarRelatorioChamadosApi(
  dataInicio,
  dataFim,
  pagina = 1,
  filtros = {},
) {
  const response = await apiClient.get("/relatorios/chamados", {
    params: {
      data_inicio: dataInicio,
      data_fim: dataFim,
      pagina,
      limite: 20,
      status: filtros.status || undefined,
      prioridade: filtros.prioridade || undefined,
      categoria: filtros.categoria || undefined,
    },
  });

  return response.data;
}

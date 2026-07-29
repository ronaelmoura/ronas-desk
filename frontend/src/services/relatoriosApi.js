import apiClient from "./apiClient";

export async function buscarRelatorioChamadosApi(dataInicio, dataFim) {
  const response = await apiClient.get("/relatorios/chamados", {
    params: {
      data_inicio: dataInicio,
      data_fim: dataFim,
    },
  });

  return response.data;
}

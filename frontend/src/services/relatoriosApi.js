import apiClient from "./apiClient";

export async function buscarRelatorioChamadosApi(dataInicio, dataFim, pagina = 1) {
  const response = await apiClient.get("/relatorios/chamados", {
    params: {
      data_inicio: dataInicio,
      data_fim: dataFim,
      pagina,
      limite: 20,
    },
  });

  return response.data;
}

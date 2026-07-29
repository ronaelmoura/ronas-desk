import apiClient from "./apiClient";

async function tratarResposta(promise) {
  const response = await promise;

  return response.data;
}

export function listarChamadosApi() {
  return tratarResposta(apiClient.get("/chamados"));
}

export function criarChamadoApi(dados) {
  return tratarResposta(apiClient.post("/chamados", dados));
}

export function atualizarChamadoApi(id, dados) {
  return tratarResposta(apiClient.put(`/chamados/${id}`, dados));
}

export function excluirChamadoApi(id) {
  return tratarResposta(apiClient.delete(`/chamados/${id}`));
}

export function buscarChamadoApi(id) {
  return tratarResposta(apiClient.get(`/chamados/${id}`));
}

export function listarTimelineChamadoApi(id) {
  return tratarResposta(apiClient.get(`/chamados/${id}/timeline`));
}

export function listarHistoricoChamadoApi(id) {
  return tratarResposta(apiClient.get(`/chamados/${id}/history`));
}

export function listarComentariosChamadoApi(id) {
  return tratarResposta(apiClient.get(`/chamados/${id}/comentarios`));
}

export function criarComentarioChamadoApi(id, conteudo, tipo) {
  return tratarResposta(
    apiClient.post(`/chamados/${id}/comentarios`, { conteudo, tipo }),
  );
}

export function listarAnexosChamadoApi(id) {
  return tratarResposta(apiClient.get(`/chamados/${id}/anexos`));
}

export function criarAnexoChamadoApi(id, arquivo) {
  const dados = new FormData();
  dados.append("arquivo", arquivo);

  return tratarResposta(apiClient.post(`/chamados/${id}/anexos`, dados));
}

export function gerarDownloadAnexoChamadoApi(chamadoId, anexoId) {
  return tratarResposta(
    apiClient.get(`/chamados/${chamadoId}/anexos/${anexoId}/download`),
  );
}

export function excluirAnexoChamadoApi(chamadoId, anexoId) {
  return tratarResposta(
    apiClient.delete(`/chamados/${chamadoId}/anexos/${anexoId}`),
  );
}

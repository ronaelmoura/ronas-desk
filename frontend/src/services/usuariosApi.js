import apiClient from "./apiClient";

export async function listarUsuariosApi() {
  const response = await apiClient.get("/usuarios");
  return response.data;
}

export async function buscarUsuarioApi(id) {
  const response = await apiClient.get(`/usuarios/${id}`);
  return response.data;
}

export async function criarUsuarioApi(dados) {
  const response = await apiClient.post("/usuarios", dados);
  return response.data;
}

export async function atualizarUsuarioApi(id, dados) {
  const response = await apiClient.put(`/usuarios/${id}`, dados);
  return response.data;
}

export async function alterarStatusUsuarioApi(id, ativo) {
  const response = await apiClient.patch(`/usuarios/${id}/status`, { ativo });
  return response.data;
}

export async function excluirUsuarioApi(id) {
  const response = await apiClient.delete(`/usuarios/${id}`);
  return response.data;
}

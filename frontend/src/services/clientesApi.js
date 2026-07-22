import apiClient from './apiClient'


async function tratarResposta(promise){

const response = await promise

return response.data

}



export function listarClientesApi(){

return tratarResposta(
apiClient.get('/clientes')
)

}



export function criarClienteApi(dados){

return tratarResposta(
apiClient.post('/clientes', dados)
)

}



export function atualizarClienteApi(id,dados){

return tratarResposta(
apiClient.put(`/clientes/${id}`,dados)
)

}



export function excluirClienteApi(id){

return tratarResposta(
apiClient.delete(`/clientes/${id}`)
)

}



export function listarChamadosClienteApi(id){

return tratarResposta(
apiClient.get(`/clientes/${id}/chamados`)
)

}

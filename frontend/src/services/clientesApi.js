import api from './api'


async function tratarResposta(promise){

try{

const response = await promise

return response.data


}catch(error){

console.error('ERRO API:', error)

throw new Error(
error.response?.data?.message ||
'Não foi possível concluir a operação.'
)

}

}



export function listarClientesApi(){

return tratarResposta(
api.get('/clientes')
)

}



export function criarClienteApi(dados){

return tratarResposta(
api.post('/clientes', dados)
)

}



export function atualizarClienteApi(id,dados){

return tratarResposta(
api.put(`/clientes/${id}`,dados)
)

}



export function excluirClienteApi(id){

return tratarResposta(
api.delete(`/clientes/${id}`)
)

}
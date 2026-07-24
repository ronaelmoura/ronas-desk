import { useEffect, useState } from 'react'
import {
  listarClientesApi,
  excluirClienteApi,
  listarChamadosClienteApi,
} from '../../services/clientesApi'
import { buscarChamadoApi } from '../../services/chamadosApi'
import './clientes.css'
import NovoClienteModal from './NovoClienteModal'


function Clientes({ onSelectTicket }){

const [clientes,setClientes] = useState([])
const [modalAberto,setModalAberto] = useState(false)
const [clienteSelecionado,setClienteSelecionado] = useState(null)
const [clienteEmDetalhes,setClienteEmDetalhes] = useState(null)
const [chamadosCliente,setChamadosCliente] = useState([])
const [carregandoHistorico,setCarregandoHistorico] = useState(false)
const [erroHistorico,setErroHistorico] = useState('')


async function abrirDetalhesCliente(cliente){

  setClienteEmDetalhes(cliente)
  setCarregandoHistorico(true)
  setErroHistorico('')

  try{

    const chamados = await listarChamadosClienteApi(cliente.id)
    setChamadosCliente(chamados)

  }catch(error){

    setChamadosCliente([])
    setErroHistorico(error.message)

  }finally{

    setCarregandoHistorico(false)

  }

}


async function abrirDetalhesChamado(id){

  try{

    const chamado = await buscarChamadoApi(id)
    onSelectTicket(chamado)

  }catch(error){

    alert(error.message)

  }

}


async function desativarCliente(id){

  const confirmar = window.confirm(
    'Deseja desativar este cliente?'
  )

  if(!confirmar){
    return
  }

  try{

    await excluirClienteApi(id)

    setClientes(clientes.map(cliente =>
      cliente.id === id
      ?
      {
        ...cliente,
        ativo:false
      }
      :
      cliente
    ))

  }catch(error){

    alert(error.message)

  }

}

useEffect(()=>{

listarClientesApi()
.then((dados)=>{

console.log('CLIENTES RECEBIDOS:', dados)

setClientes(dados)

})
.catch((erro)=>{

console.error('ERRO CLIENTES:', erro)

})

},[])


return (

<section className="clientes-page">

{clienteEmDetalhes ? (

<>

<button
  className="btn-voltar-clientes"
  type="button"
  onClick={() => setClienteEmDetalhes(null)}
>
  ← Voltar para clientes
</button>

<div className="cliente-detalhes-card">
  <div>
    <span>Cliente</span>
    <h1>{clienteEmDetalhes.nome}</h1>
    <p>{clienteEmDetalhes.email}</p>
  </div>

  <dl className="cliente-detalhes-dados">
    <div>
      <dt>Empresa</dt>
      <dd>{clienteEmDetalhes.empresa || 'Não informada'}</dd>
    </div>
    <div>
      <dt>Telefone</dt>
      <dd>{clienteEmDetalhes.telefone || 'Não informado'}</dd>
    </div>
  </dl>
</div>

<div className="clientes-card historico-card">
  <div className="historico-header">
    <div>
      <h2>Histórico de Chamados</h2>
      <p>Solicitações vinculadas a este cliente.</p>
    </div>
  </div>

  {carregandoHistorico ? (
    <p className="historico-mensagem">Carregando chamados...</p>
  ) : erroHistorico ? (
    <div className="historico-mensagem">
      <p>{erroHistorico}</p>
      <button
        type="button"
        className="btn-tentar-novamente"
        onClick={() => abrirDetalhesCliente(clienteEmDetalhes)}
      >
        Tentar novamente
      </button>
    </div>
  ) : chamadosCliente.length === 0 ? (
    <p className="historico-mensagem">
      Nenhum chamado registrado para este cliente.
    </p>
  ) : (
    <div className="historico-tabela-wrapper">
      <table className="clientes-table historico-table">
        <thead>
          <tr>
            <th>Título</th>
            <th>Categoria</th>
            <th>Prioridade</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {chamadosCliente.map((chamado) => (
            <tr
              key={chamado.id}
              className="historico-linha"
              onClick={() => abrirDetalhesChamado(chamado.id)}
            >
              <td className="historico-titulo">{chamado.titulo}</td>
              <td>{chamado.categoria}</td>
              <td>{chamado.prioridade}</td>
              <td>{chamado.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</div>

</>

) : (

<>

<div className="clientes-header">

<div>

<h1>Clientes</h1>

<p>
Gerenciamento de clientes do Ronas Desk
</p>

</div>


<button
  className="btn-novo-cliente"
  onClick={() => setModalAberto(true)}
>

+ Novo Cliente

</button>


</div>


<div className="clientes-card">

<table className="clientes-table">

<thead>

<tr>
<th>ID</th>
<th>Nome</th>
<th>Email</th>
<th>Telefone</th>
<th>Empresa</th>
<th>Status</th>
<th>Ações</th>
</tr>

</thead>


<tbody>

{
clientes.map(cliente=>(

<tr key={cliente.id}>

<td>{cliente.id}</td>
<td>
  <button
    className="cliente-link"
    type="button"
    onClick={() => abrirDetalhesCliente(cliente)}
  >
    {cliente.nome}
  </button>
</td>
<td>{cliente.email}</td>
<td>{cliente.telefone}</td>
<td>{cliente.empresa}</td>
<td>
  {cliente.ativo ? (
    <span className="status ativo">
      Ativo
    </span>
  ) : (
    <span className="status inativo">
      Inativo
    </span>
  )}
</td>
<td>

<button
 className="btn-editar"
 onClick={() => {
   setClienteSelecionado(cliente)
   setModalAberto(true)
 }}
>
✏️
</button>


<button
 className="btn-excluir"
 onClick={() => desativarCliente(cliente.id)}
>
🗑️
</button>

</td>
</tr>

))
}

</tbody>

</table>

</div>

</>

)}

{
modalAberto && (

<NovoClienteModal

cliente={clienteSelecionado}

fechar={()=>{
 setModalAberto(false)
 setClienteSelecionado(null)
}}

atualizar={(novo)=>{

setClientes(clientes.map(cliente =>
 cliente.id === novo.id
 ? novo
 : cliente
))

}}

/>

)
}

</section>

)

}


export default Clientes

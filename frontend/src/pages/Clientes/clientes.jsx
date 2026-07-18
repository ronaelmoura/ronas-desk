import { useEffect, useState } from 'react'
import {
  listarClientesApi,
  excluirClienteApi
} from '../../services/clientesApi'
import './clientes.css'
import NovoClienteModal from './NovoClienteModal'


function Clientes(){

const [clientes,setClientes] = useState([])
const [modalAberto,setModalAberto] = useState(false)
const [clienteSelecionado,setClienteSelecionado] = useState(null)


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
<td>{cliente.nome}</td>
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
import { useState } from 'react'
import {
  criarClienteApi,
  atualizarClienteApi
} from '../../services/clientesApi'
import './clientes.css'


function NovoClienteModal({ fechar, atualizar, cliente }) {


  const [formulario, setFormulario] = useState({

    nome: cliente?.nome || '',
    email: cliente?.email || '',
    telefone: cliente?.telefone || '',
    empresa: cliente?.empresa || ''

  })


  function alterar(e) {

    setFormulario({

      ...formulario,

      [e.target.name]: e.target.value

    })

  }



  async function salvar() {

    try {


      let resultado



      if (cliente) {


        resultado = await atualizarClienteApi(

          cliente.id,

          {
            ...formulario,
            ativo: true
          }

        )


      } else {


        resultado = await criarClienteApi(

          {
            ...formulario,
            ativo: true
          }

        )


      }



      atualizar(resultado)

      fechar()



    } catch (error) {


      alert(error.message)


    }

  }




  return (

    <div className="modal-overlay">

      <div className="modal">


        <h2>
          {cliente ? 'Editar Cliente' : 'Novo Cliente'}
        </h2>



        <input
          name="nome"
          placeholder="Nome"
          value={formulario.nome}
          onChange={alterar}
        />


        <input
          name="email"
          placeholder="Email"
          value={formulario.email}
          onChange={alterar}
        />


        <input
          name="telefone"
          placeholder="Telefone"
          value={formulario.telefone}
          onChange={alterar}
        />


        <input
          name="empresa"
          placeholder="Empresa"
          value={formulario.empresa}
          onChange={alterar}
        />



        <div>


          <button
            onClick={fechar}
          >
            Cancelar
          </button>



          <button
            onClick={salvar}
          >
            Salvar
          </button>


        </div>


      </div>


    </div>


  )

}


export default NovoClienteModal
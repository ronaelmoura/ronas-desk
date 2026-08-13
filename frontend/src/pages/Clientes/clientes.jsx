import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  ExternalLink,
  Pencil,
  UserMinus,
  UserPlus,
  UsersRound,
} from "lucide-react";
import {
  atualizarClienteApi,
  criarClienteApi,
  excluirClienteApi,
  listarChamadosClienteApi,
  listarClientesApi,
} from "../../services/clientesApi";
import { buscarChamadoApi } from "../../services/chamadosApi";
import ModalConfirmacao from "../../components/ui/ModalConfirmacao";
import TabelaSkeleton from "../../components/ui/TabelaSkeleton";
import Toast from "../../components/ui/Toast";
import Paginacao from "../../components/ui/Paginacao";
import NovoClienteModal from "./NovoClienteModal";
import "./clientes.css";

function Clientes({
  onSelectTicket,
  somenteLeitura = false,
  administrador = false,
}) {
  const [clientes, setClientes] = useState([]);
  const [carregandoClientes, setCarregandoClientes] = useState(true);
  const [erroClientes, setErroClientes] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [clienteParaDesativar, setClienteParaDesativar] = useState(null);
  const [clienteEmDetalhes, setClienteEmDetalhes] = useState(null);
  const [chamadosCliente, setChamadosCliente] = useState([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);
  const [erroHistorico, setErroHistorico] = useState("");
  const [abrindoChamadoId, setAbrindoChamadoId] = useState(null);
  const [processandoClienteId, setProcessandoClienteId] = useState(null);
  const [toast, setToast] = useState(null);
  const [busca, setBusca] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [paginacao, setPaginacao] = useState({ total: 0, total_paginas: 1 });
  const podeGerenciarClientes = administrador && !somenteLeitura;

  const fecharToast = useCallback(() => setToast(null), []);

  const carregarClientes = useCallback(async () => {
    setCarregandoClientes(true);
    setErroClientes("");

    try {
      const resultado = await listarClientesApi({
        pagina: paginaAtual,
        limite: 10,
        busca,
      });
      setClientes(resultado.dados);
      setPaginacao(resultado.paginacao);
    } catch (error) {
      setErroClientes(error.message);
    } finally {
      setCarregandoClientes(false);
    }
  }, [busca, paginaAtual]);

  useEffect(() => {
    carregarClientes();
  }, [carregarClientes]);

  useEffect(() => {
    setPaginaAtual(1);
  }, [busca]);

  async function abrirDetalhesCliente(cliente) {
    setClienteEmDetalhes(cliente);
    setCarregandoHistorico(true);
    setErroHistorico("");

    try {
      setChamadosCliente(await listarChamadosClienteApi(cliente.id));
    } catch (error) {
      setChamadosCliente([]);
      setErroHistorico(error.message);
    } finally {
      setCarregandoHistorico(false);
    }
  }

  function fecharDetalhesCliente() {
    setClienteEmDetalhes(null);
    setChamadosCliente([]);
    setErroHistorico("");
  }

  async function abrirDetalhesChamado(id) {
    setAbrindoChamadoId(id);

    try {
      onSelectTicket(await buscarChamadoApi(id));
    } catch (error) {
      setToast({ tipo: "erro", mensagem: error.message });
    } finally {
      setAbrindoChamadoId(null);
    }
  }

  function abrirCadastro() {
    setClienteSelecionado(null);
    setModalAberto(true);
  }

  function abrirEdicao(cliente) {
    setClienteSelecionado(cliente);
    setModalAberto(true);
  }

  const fecharModalCliente = useCallback(() => {
    setModalAberto(false);
    setClienteSelecionado(null);
  }, []);

  async function salvarCliente(dados) {
    const editando = Boolean(clienteSelecionado);

    await (editando
      ? await atualizarClienteApi(clienteSelecionado.id, {
          ...dados,
          ativo: true,
        })
      : criarClienteApi({ ...dados, ativo: true }));

    await carregarClientes();

    fecharModalCliente();
    setToast({
      tipo: "sucesso",
      mensagem: editando
        ? "Cliente atualizado com sucesso."
        : "Cliente criado com sucesso.",
    });
  }

  async function confirmarDesativacao() {
    if (!clienteParaDesativar) return;

    setProcessandoClienteId(clienteParaDesativar.id);

    try {
      await excluirClienteApi(clienteParaDesativar.id);
      await carregarClientes();
      setClienteParaDesativar(null);
      setToast({
        tipo: "sucesso",
        mensagem: "Cliente desativado com sucesso.",
      });
    } catch (error) {
      setToast({ tipo: "erro", mensagem: error.message });
    } finally {
      setProcessandoClienteId(null);
    }
  }

  return (
    <section className="clientes-page">
      {clienteEmDetalhes ? (
        <>
          <button
            className="btn-voltar-clientes"
            type="button"
            onClick={fecharDetalhesCliente}
          >
            <ArrowLeft size={18} aria-hidden="true" />
            Voltar para clientes
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
                <dd>{clienteEmDetalhes.empresa || "Não informada"}</dd>
              </div>
              <div>
                <dt>Telefone</dt>
                <dd>{clienteEmDetalhes.telefone || "Não informado"}</dd>
              </div>
            </dl>
          </div>

          <div className="clientes-card historico-card">
            <div className="historico-header">
              <div>
                <h2>Histórico de chamados</h2>
                <p>Solicitações vinculadas a este cliente.</p>
              </div>
            </div>

            {carregandoHistorico ? (
              <p className="historico-mensagem" role="status">
                Carregando chamados...
              </p>
            ) : erroHistorico ? (
              <div className="historico-mensagem clientes-feedback" role="alert">
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
              <div className="clientes-empty-state compacto">
                <UsersRound size={32} aria-hidden="true" />
                <strong>Nenhum chamado registrado</strong>
                <p>Este cliente ainda não possui solicitações.</p>
              </div>
            ) : (
              <div className="historico-tabela-wrapper">
                <table className="clientes-table historico-table">
                  <caption className="clientes-sr-only">
                    Histórico de chamados do cliente {clienteEmDetalhes.nome}
                  </caption>
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
                      <tr key={chamado.id}>
                        <td>
                          <button
                            className="historico-link"
                            type="button"
                            disabled={abrindoChamadoId === chamado.id}
                            onClick={() => abrirDetalhesChamado(chamado.id)}
                          >
                            {chamado.titulo}
                            <ExternalLink size={15} aria-hidden="true" />
                          </button>
                        </td>
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
          <header className="clientes-header">
            <div>
              <p>Relacionamento</p>
              <h1>Clientes</h1>
              <span>Gerencie clientes e acompanhe seus chamados.</span>
            </div>

            {podeGerenciarClientes && (
            <button
              className="btn-novo-cliente"
              type="button"
              onClick={abrirCadastro}
            >
              <UserPlus size={18} aria-hidden="true" />
              Novo cliente
            </button>
            )}
          </header>

          <div className="clientes-card">
            <label className="clientes-search">
              Buscar cliente
              <input
                type="search"
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Nome, e-mail ou empresa"
              />
            </label>
            {erroClientes ? (
              <div className="clientes-feedback" role="alert">
                <strong>Não foi possível carregar os clientes</strong>
                <p>{erroClientes}</p>
                <button type="button" onClick={carregarClientes}>
                  Tentar novamente
                </button>
              </div>
            ) : !carregandoClientes && clientes.length === 0 ? (
              <div className="clientes-empty-state">
                <UsersRound size={38} aria-hidden="true" />
                <strong>Nenhum cliente cadastrado</strong>
                <p>Cadastre o primeiro cliente para começar a abrir chamados.</p>
                {podeGerenciarClientes && (
                <button type="button" onClick={abrirCadastro}>
                  <UserPlus size={18} aria-hidden="true" />
                  Cadastrar cliente
                </button>
                )}
              </div>
            ) : (
              <div className="clientes-tabela-wrapper">
                <table
                  className="clientes-table"
                  aria-busy={carregandoClientes}
                >
                  <caption className="clientes-sr-only">
                    Clientes cadastrados no Ronas Desk
                  </caption>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nome</th>
                      <th>Email</th>
                      <th>Telefone</th>
                      <th>Empresa</th>
                      <th>Status</th>
                      {podeGerenciarClientes && <th>Ações</th>}
                    </tr>
                  </thead>

                  {carregandoClientes ? (
                    <TabelaSkeleton colunas={podeGerenciarClientes ? 7 : 6} linhas={5} />
                  ) : (
                    <tbody>
                      {clientes.map((cliente) => (
                        <tr key={cliente.id}>
                          <td>#{String(cliente.id).padStart(3, "0")}</td>
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
                          <td>{cliente.telefone || "—"}</td>
                          <td>{cliente.empresa || "—"}</td>
                          <td>
                            <span
                              className={`cliente-status ${cliente.ativo ? "ativo" : "inativo"}`}
                            >
                              {cliente.ativo ? "Ativo" : "Inativo"}
                            </span>
                          </td>
                          {podeGerenciarClientes && (
                            <td>
                              <div className="clientes-acoes">
                                <button
                                  className="btn-editar"
                                  type="button"
                                  aria-label={`Editar ${cliente.nome}`}
                                  title="Editar"
                                  onClick={() => abrirEdicao(cliente)}
                                >
                                  <Pencil size={16} aria-hidden="true" />
                                </button>
                                <button
                                  className="btn-desativar"
                                  type="button"
                                  aria-label={`Desativar ${cliente.nome}`}
                                  title={
                                    cliente.ativo
                                      ? "Desativar"
                                      : "Cliente já inativo"
                                  }
                                  disabled={
                                    !cliente.ativo ||
                                    processandoClienteId === cliente.id
                                  }
                                  onClick={() =>
                                    setClienteParaDesativar(cliente)
                                  }
                                >
                                  <UserMinus size={16} aria-hidden="true" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  )}
                </table>
              </div>
            )}
            {!carregandoClientes && !erroClientes && (
              <Paginacao
                paginaAtual={paginaAtual}
                totalPaginas={paginacao.total_paginas}
                onChange={setPaginaAtual}
                ariaLabel="Paginação da lista de clientes"
              />
            )}
          </div>
        </>
      )}

      {modalAberto && podeGerenciarClientes && (
        <NovoClienteModal
          cliente={clienteSelecionado}
          fechar={fecharModalCliente}
          onSave={salvarCliente}
        />
      )}

      <ModalConfirmacao
        aberto={podeGerenciarClientes && Boolean(clienteParaDesativar)}
        titulo="Desativar cliente?"
        mensagem={`${clienteParaDesativar?.nome ?? "Este cliente"} deixará de aparecer nas opções para novos chamados. O histórico será preservado.`}
        confirmando={processandoClienteId === clienteParaDesativar?.id}
        onCancel={() => setClienteParaDesativar(null)}
        onConfirm={confirmarDesativacao}
        rotuloConfirmar="Desativar cliente"
        confirmandoTexto="Desativando..."
      />

      <Toast toast={toast} onClose={fecharToast} />
    </section>
  );
}

export default Clientes;

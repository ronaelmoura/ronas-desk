import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pencil,
  Power,
  Search,
  SearchX,
  Trash2,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react";
import {
  alterarStatusUsuarioApi,
  atualizarUsuarioApi,
  criarUsuarioApi,
  excluirUsuarioApi,
  listarUsuariosApi,
} from "../../services/usuariosApi";
import ModalConfirmacao from "../../components/ui/ModalConfirmacao";
import Paginacao from "../../components/ui/Paginacao";
import TabelaSkeleton from "../../components/ui/TabelaSkeleton";
import Toast from "../../components/ui/Toast";
import UsuarioModal from "./UsuarioModal";
import "./usuarios.css";

const ITENS_POR_PAGINA = 6;

function obterIniciais(nome = "") {
  return (
    nome
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((parte) => parte[0])
      .join("")
      .toUpperCase() || "US"
  );
}

function Usuarios({ administrador }) {
  const [usuarios, setUsuarios] = useState([]);
  const [pesquisa, setPesquisa] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [carregando, setCarregando] = useState(true);
  const [processandoId, setProcessandoId] = useState(null);
  const [erro, setErro] = useState("");
  const [toast, setToast] = useState(null);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);
  const [usuarioParaExcluir, setUsuarioParaExcluir] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);

  const fecharToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const usuariosFiltrados = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();
    if (!termo) return usuarios;

    return usuarios.filter(
      (usuario) =>
        usuario.nome.toLowerCase().includes(termo) ||
        usuario.email.toLowerCase().includes(termo),
    );
  }, [pesquisa, usuarios]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(usuariosFiltrados.length / ITENS_POR_PAGINA),
  );
  const usuariosPaginados = usuariosFiltrados.slice(
    (paginaAtual - 1) * ITENS_POR_PAGINA,
    paginaAtual * ITENS_POR_PAGINA,
  );

  useEffect(() => {
    setPaginaAtual(1);
  }, [pesquisa]);

  useEffect(() => {
    if (paginaAtual > totalPaginas) setPaginaAtual(totalPaginas);
  }, [paginaAtual, totalPaginas]);

  async function carregarUsuarios() {
    setCarregando(true);
    setErro("");

    try {
      setUsuarios(await listarUsuariosApi());
    } catch (error) {
      setErro(error.message);
      setToast({ tipo: "erro", mensagem: error.message });
    } finally {
      setCarregando(false);
    }
  }

  function abrirCadastro() {
    setUsuarioSelecionado(null);
    setModalAberto(true);
  }

  function abrirEdicao(usuario) {
    setUsuarioSelecionado(usuario);
    setModalAberto(true);
  }

  async function salvarUsuario(dados) {
    try {
      const usuarioSalvo = usuarioSelecionado
        ? await atualizarUsuarioApi(usuarioSelecionado.id, dados)
        : await criarUsuarioApi(dados);

      setUsuarios((atuais) => {
        const existe = atuais.some((usuario) => usuario.id === usuarioSalvo.id);
        return existe
          ? atuais.map((usuario) =>
              usuario.id === usuarioSalvo.id ? usuarioSalvo : usuario,
            )
          : [...atuais, usuarioSalvo].sort((a, b) =>
              a.nome.localeCompare(b.nome),
            );
      });
      setModalAberto(false);
      setToast({
        tipo: "sucesso",
        mensagem: usuarioSelecionado
          ? "Usuário atualizado com sucesso."
          : "Usuário criado com sucesso.",
      });
    } catch (error) {
      setToast({ tipo: "erro", mensagem: error.message });
      throw error;
    }
  }

  async function alternarStatus(usuario) {
    setProcessandoId(usuario.id);
    setErro("");

    try {
      const atualizado = await alterarStatusUsuarioApi(
        usuario.id,
        !usuario.ativo,
      );
      setUsuarios((atuais) =>
        atuais.map((item) => (item.id === atualizado.id ? atualizado : item)),
      );
      setToast({
        tipo: "sucesso",
        mensagem: `Usuário ${atualizado.ativo ? "ativado" : "desativado"} com sucesso.`,
      });
    } catch (error) {
      setErro(error.message);
      setToast({ tipo: "erro", mensagem: error.message });
    } finally {
      setProcessandoId(null);
    }
  }

  async function confirmarExclusao() {
    if (!usuarioParaExcluir) return;

    setProcessandoId(usuarioParaExcluir.id);
    setErro("");

    try {
      await excluirUsuarioApi(usuarioParaExcluir.id);
      setUsuarios((atuais) =>
        atuais.filter((item) => item.id !== usuarioParaExcluir.id),
      );
      setUsuarioParaExcluir(null);
      setToast({ tipo: "sucesso", mensagem: "Usuário excluído com sucesso." });
    } catch (error) {
      setErro(error.message);
      setToast({ tipo: "erro", mensagem: error.message });
    } finally {
      setProcessandoId(null);
    }
  }

  return (
    <section className="usuarios-page">
      <header className="usuarios-header">
        <div>
          <p>Administração</p>
          <h1>Usuários</h1>
          <span>Gerencie acessos, cargos e status da equipe.</span>
        </div>

        {administrador && (
          <button
            type="button"
            className="botao-primario"
            onClick={abrirCadastro}
          >
            <UserPlus size={18} aria-hidden="true" />
            Novo Usuário
          </button>
        )}
      </header>

      <div className="usuarios-toolbar">
        <label className="usuarios-pesquisa">
          <span>Pesquisar por nome ou email</span>
          <div>
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              value={pesquisa}
              onChange={(event) => setPesquisa(event.target.value)}
              placeholder="Digite para pesquisar..."
              aria-label="Pesquisar usuários por nome ou email"
            />
            {pesquisa && (
              <button
                type="button"
                aria-label="Limpar pesquisa"
                onClick={() => setPesquisa("")}
              >
                <X size={17} aria-hidden="true" />
              </button>
            )}
          </div>
        </label>
        <strong>{usuariosFiltrados.length} usuário(s)</strong>
      </div>

      {erro && (
        <div className="usuarios-alerta erro" role="alert">
          <span>{erro}</span>
          <button type="button" onClick={carregarUsuarios}>
            Tentar novamente
          </button>
        </div>
      )}

      {carregando ? (
        <div className="usuarios-tabela-wrapper">
          <table className="usuarios-tabela" aria-busy="true">
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Cargo</th>
                <th>Status</th>
                {administrador && <th>Ações</th>}
              </tr>
            </thead>
            <TabelaSkeleton colunas={administrador ? 4 : 3} />
          </table>
          <span className="sr-only">Carregando usuários...</span>
        </div>
      ) : usuariosFiltrados.length === 0 ? (
        <div className="usuarios-empty-state">
          <div>
            {pesquisa ? <SearchX size={34} /> : <UsersRound size={34} />}
          </div>
          <h2>
            {pesquisa
              ? "Nenhum resultado encontrado"
              : "Nenhum usuário cadastrado"}
          </h2>
          <p>
            {pesquisa
              ? "Tente outro nome ou email para encontrar quem procura."
              : "Cadastre o primeiro usuário para começar a organizar sua equipe."}
          </p>
          {pesquisa ? (
            <button
              type="button"
              className="botao-secundario"
              onClick={() => setPesquisa("")}
            >
              Limpar pesquisa
            </button>
          ) : (
            administrador && (
              <button
                type="button"
                className="botao-primario"
                onClick={abrirCadastro}
              >
                <UserPlus size={18} aria-hidden="true" />
                Cadastrar usuário
              </button>
            )
          )}
        </div>
      ) : (
        <>
          <div className="usuarios-tabela-wrapper">
            <table className="usuarios-tabela">
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>Cargo</th>
                  <th>Status</th>
                  {administrador && <th>Ações</th>}
                </tr>
              </thead>
              <tbody>
                {usuariosPaginados.map((usuario) => (
                  <tr key={usuario.id}>
                    <td data-label="Usuário">
                      <div className="usuario-identidade">
                        <div className="usuario-avatar" aria-hidden="true">
                          {obterIniciais(usuario.nome)}
                        </div>
                        <div>
                          <strong>{usuario.nome}</strong>
                          <span>{usuario.email}</span>
                        </div>
                      </div>
                    </td>
                    <td data-label="Cargo">
                      <span
                        className={`usuario-cargo ${
                          usuario.cargo === "Administrador"
                            ? "administrador"
                            : "atendente"
                        }`}
                      >
                        {usuario.cargo}
                      </span>
                    </td>
                    <td data-label="Status">
                      <span
                        className={`usuario-status ${usuario.ativo ? "ativo" : "inativo"}`}
                      >
                        <i aria-hidden="true" />
                        {usuario.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    {administrador && (
                      <td data-label="Ações" className="usuarios-acoes">
                        <button
                          type="button"
                          aria-label={`Editar ${usuario.nome}`}
                          title="Editar"
                          onClick={() => abrirEdicao(usuario)}
                        >
                          <Pencil size={16} aria-hidden="true" />
                          <span>Editar</span>
                        </button>
                        <button
                          type="button"
                          aria-label={`${usuario.ativo ? "Desativar" : "Ativar"} ${usuario.nome}`}
                          title={usuario.ativo ? "Desativar" : "Ativar"}
                          disabled={processandoId === usuario.id}
                          onClick={() => alternarStatus(usuario)}
                        >
                          <Power size={16} aria-hidden="true" />
                          <span>{usuario.ativo ? "Desativar" : "Ativar"}</span>
                        </button>
                        <button
                          type="button"
                          className="perigo"
                          aria-label={`Excluir ${usuario.nome}`}
                          title="Excluir"
                          disabled={processandoId === usuario.id}
                          onClick={() => setUsuarioParaExcluir(usuario)}
                        >
                          <Trash2 size={16} aria-hidden="true" />
                          <span>Excluir</span>
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Paginacao
            paginaAtual={paginaAtual}
            totalPaginas={totalPaginas}
            onChange={setPaginaAtual}
            ariaLabel="Paginação da lista de usuários"
          />
        </>
      )}

      {modalAberto && (
        <UsuarioModal
          usuario={usuarioSelecionado}
          onClose={() => setModalAberto(false)}
          onSave={salvarUsuario}
        />
      )}

      <ModalConfirmacao
        aberto={Boolean(usuarioParaExcluir)}
        titulo="Excluir usuário?"
        mensagem={`Esta ação removerá permanentemente ${usuarioParaExcluir?.nome ?? "este usuário"}. Não será possível desfazê-la.`}
        confirmando={processandoId === usuarioParaExcluir?.id}
        onCancel={() => setUsuarioParaExcluir(null)}
        onConfirm={confirmarExclusao}
      />

      <Toast toast={toast} onClose={fecharToast} />
    </section>
  );
}

export default Usuarios;

import { useEffect, useMemo, useState } from "react";
import {
  alterarStatusUsuarioApi,
  atualizarUsuarioApi,
  criarUsuarioApi,
  excluirUsuarioApi,
  listarUsuariosApi,
} from "../../services/usuariosApi";
import UsuarioModal from "./UsuarioModal";
import "./usuarios.css";

function Usuarios({ administrador }) {
  const [usuarios, setUsuarios] = useState([]);
  const [pesquisa, setPesquisa] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [processandoId, setProcessandoId] = useState(null);
  const [erro, setErro] = useState("");
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);

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

  async function carregarUsuarios() {
    setCarregando(true);
    setErro("");

    try {
      setUsuarios(await listarUsuariosApi());
    } catch (error) {
      setErro(error.message);
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
    } catch (error) {
      setErro(error.message);
    } finally {
      setProcessandoId(null);
    }
  }

  async function excluirUsuario(usuario) {
    const confirmado = window.confirm(
      `Deseja excluir permanentemente o usuário ${usuario.nome}?`,
    );
    if (!confirmado) return;

    setProcessandoId(usuario.id);
    setErro("");

    try {
      await excluirUsuarioApi(usuario.id);
      setUsuarios((atuais) => atuais.filter((item) => item.id !== usuario.id));
    } catch (error) {
      setErro(error.message);
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
            + Novo Usuário
          </button>
        )}
      </header>

      <div className="usuarios-toolbar">
        <label>
          <span>Pesquisar por nome ou email</span>
          <input
            type="search"
            value={pesquisa}
            onChange={(event) => setPesquisa(event.target.value)}
            placeholder="Digite para pesquisar..."
          />
        </label>
        <strong>{usuariosFiltrados.length} usuário(s)</strong>
      </div>

      {erro && (
        <div className="usuarios-alerta erro">
          <span>{erro}</span>
          <button type="button" onClick={carregarUsuarios}>
            Tentar novamente
          </button>
        </div>
      )}

      {carregando ? (
        <div className="usuarios-estado">Carregando usuários...</div>
      ) : (
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
              {usuariosFiltrados.length ? (
                usuariosFiltrados.map((usuario) => (
                  <tr key={usuario.id}>
                    <td data-label="Usuário">
                      <strong>{usuario.nome}</strong>
                      <span>{usuario.email}</span>
                    </td>
                    <td data-label="Cargo">{usuario.cargo}</td>
                    <td data-label="Status">
                      <span
                        className={`usuario-status ${usuario.ativo ? "ativo" : "inativo"}`}
                      >
                        {usuario.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    {administrador && (
                      <td data-label="Ações" className="usuarios-acoes">
                        <button
                          type="button"
                          onClick={() => abrirEdicao(usuario)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          disabled={processandoId === usuario.id}
                          onClick={() => alternarStatus(usuario)}
                        >
                          {usuario.ativo ? "Desativar" : "Ativar"}
                        </button>
                        <button
                          type="button"
                          className="perigo"
                          disabled={processandoId === usuario.id}
                          onClick={() => excluirUsuario(usuario)}
                        >
                          Excluir
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={administrador ? 4 : 3}
                    className="usuarios-vazio"
                  >
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalAberto && (
        <UsuarioModal
          usuario={usuarioSelecionado}
          onClose={() => setModalAberto(false)}
          onSave={salvarUsuario}
        />
      )}
    </section>
  );
}

export default Usuarios;

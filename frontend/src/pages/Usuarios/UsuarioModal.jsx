import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { listarClientesApi } from "../../services/clientesApi";

const formularioInicial = {
  nome: "",
  email: "",
  cargo: "Atendente",
  cliente_id: "",
  senha: "",
};

function UsuarioModal({ usuario, onClose, onSave }) {
  const [formulario, setFormulario] = useState(formularioInicial);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [clientes, setClientes] = useState([]);
  const [carregandoClientes, setCarregandoClientes] = useState(false);

  useEffect(() => {
    if (usuario) {
      setFormulario({
        nome: usuario.nome,
        email: usuario.email,
        cargo: usuario.cargo,
        cliente_id: usuario.cliente_id ? String(usuario.cliente_id) : "",
        senha: "",
      });
    }
  }, [usuario]);

  useEffect(() => {
    if (formulario.cargo !== "Cliente") return;

    let ativo = true;
    setCarregandoClientes(true);
    listarClientesApi({ limite: 100 })
      .then((resultado) => {
        if (ativo) setClientes(resultado.dados.filter((cliente) => cliente.ativo));
      })
      .catch((error) => {
        if (ativo) setErro(error.message);
      })
      .finally(() => {
        if (ativo) setCarregandoClientes(false);
      });

    return () => {
      ativo = false;
    };
  }, [formulario.cargo]);

  useEffect(() => {
    function fecharComEscape(event) {
      if (event.key === "Escape" && !salvando) onClose();
    }

    document.addEventListener("keydown", fecharComEscape);
    return () => document.removeEventListener("keydown", fecharComEscape);
  }, [onClose, salvando]);

  function atualizarCampo(event) {
    const { name, value } = event.target;
    setFormulario((atual) => ({
      ...atual,
      [name]: value,
      ...(name === "cargo" && value !== "Cliente" ? { cliente_id: "" } : {}),
    }));
  }

  async function enviar(event) {
    event.preventDefault();
    setSalvando(true);
    setErro("");

    try {
      await onSave(formulario);
    } catch (error) {
      setErro(error.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div
      className="usuario-modal-overlay"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className="usuario-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="usuario-modal-titulo"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="usuario-modal-header">
          <div>
            <span>Gestão de usuários</span>
            <h2 id="usuario-modal-titulo">
              {usuario ? "Editar usuário" : "Novo usuário"}
            </h2>
          </div>

          <button type="button" aria-label="Fechar" onClick={onClose}>
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={enviar}>
          {erro && <div className="usuarios-alerta erro">{erro}</div>}

          <label>
            Nome
            <input
              name="nome"
              value={formulario.nome}
              onChange={atualizarCampo}
              maxLength="120"
              autoFocus
              required
            />
          </label>

          <label>
            Email
            <input
              type="email"
              name="email"
              value={formulario.email}
              onChange={atualizarCampo}
              maxLength="160"
              required
            />
          </label>

          <label>
            Cargo
            <select
              name="cargo"
              value={formulario.cargo}
              onChange={atualizarCampo}
            >
              <option value="Atendente">Atendente</option>
              <option value="Administrador">Administrador</option>
              <option value="Cliente">Cliente (Portal)</option>
            </select>
          </label>

          {formulario.cargo === "Cliente" && (
            <label>
              Cliente vinculado
              <select
                name="cliente_id"
                value={formulario.cliente_id}
                onChange={atualizarCampo}
                disabled={carregandoClientes}
                required
              >
                <option value="">
                  {carregandoClientes ? "Carregando clientes..." : "Selecione o cliente"}
                </option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nome}{cliente.empresa ? ` — ${cliente.empresa}` : ""}
                  </option>
                ))}
              </select>
              <small>
                Vincule esta conta ao cliente que poderÃ¡ acessar o portal. O
                e-mail da conta deve ser o mesmo do cadastro selecionado.
              </small>
            </label>
          )}

          <label>
            {usuario ? "Nova senha (opcional)" : "Senha"}
            <input
              type="password"
              name="senha"
              value={formulario.senha}
              onChange={atualizarCampo}
              minLength="8"
              maxLength="200"
              required={!usuario}
              autoComplete="new-password"
            />
          </label>

          <div className="usuario-modal-actions">
            <button
              type="button"
              className="botao-secundario"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="botao-primario"
              disabled={salvando}
            >
              {salvando ? "Salvando..." : "Salvar usuário"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default UsuarioModal;

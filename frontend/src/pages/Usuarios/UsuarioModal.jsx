import { useEffect, useState } from "react";

const formularioInicial = {
  nome: "",
  email: "",
  cargo: "Atendente",
  senha: "",
};

function UsuarioModal({ usuario, onClose, onSave }) {
  const [formulario, setFormulario] = useState(formularioInicial);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (usuario) {
      setFormulario({
        nome: usuario.nome,
        email: usuario.email,
        cargo: usuario.cargo,
        senha: "",
      });
    }
  }, [usuario]);

  function atualizarCampo(event) {
    const { name, value } = event.target;
    setFormulario((atual) => ({ ...atual, [name]: value }));
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
            ×
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
            </select>
          </label>

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

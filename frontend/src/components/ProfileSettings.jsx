import { useEffect, useState } from "react";
import useAuth from "../hooks/useAuth";
import useCompanyBrand from "../hooks/useCompanyBrand";
import CompanyBrandSettings from "./CompanyBrandSettings";
import { usarLogoPadrao } from "../utils/companyBrand";
import "./ProfileSettings.css";

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

function ProfileSettings() {
  const { usuario, atualizarPerfil, alterarSenha } = useAuth();
  const { configuracao } = useCompanyBrand();
  const [nome, setNome] = useState(usuario?.nome ?? "");
  const [email, setEmail] = useState(usuario?.email ?? "");
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [mensagemPerfil, setMensagemPerfil] = useState("");
  const [erroPerfil, setErroPerfil] = useState("");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState("");
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [mensagemSenha, setMensagemSenha] = useState("");
  const [erroSenha, setErroSenha] = useState("");

  useEffect(() => {
    setNome(usuario?.nome ?? "");
    setEmail(usuario?.email ?? "");
  }, [usuario]);

  async function handlePerfilSubmit(event) {
    event.preventDefault();
    setErroPerfil("");
    setMensagemPerfil("");

    if (!nome.trim() || !email.trim()) {
      setErroPerfil("Preencha nome e e-mail.");
      return;
    }

    setSalvandoPerfil(true);

    try {
      await atualizarPerfil({ nome: nome.trim(), email: email.trim() });
      setMensagemPerfil("Perfil atualizado com sucesso.");
    } catch (error) {
      setErroPerfil(error.message);
    } finally {
      setSalvandoPerfil(false);
    }
  }

  async function handleSenhaSubmit(event) {
    event.preventDefault();
    setErroSenha("");
    setMensagemSenha("");

    if (!senhaAtual || !novaSenha || !confirmarNovaSenha) {
      setErroSenha("Preencha os três campos de senha.");
      return;
    }

    if (novaSenha.length < 8) {
      setErroSenha("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (novaSenha !== confirmarNovaSenha) {
      setErroSenha("A confirmação da nova senha não confere.");
      return;
    }

    setSalvandoSenha(true);

    try {
      const resultado = await alterarSenha({
        senhaAtual,
        novaSenha,
        confirmarNovaSenha,
      });

      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarNovaSenha("");
      setMensagemSenha(resultado.message);
    } catch (error) {
      setErroSenha(error.message);
    } finally {
      setSalvandoSenha(false);
    }
  }

  return (
    <section className="settings-page">
      <header className="settings-header">
        <div>
          <p className="dashboard-eyebrow">Minha conta</p>
          <h1>Configurações</h1>
          <p>Atualize seus dados pessoais e proteja sua conta.</p>
        </div>
      </header>

      <div className="settings-grid">
        <div className="settings-forms">
          <form className="settings-card" onSubmit={handlePerfilSubmit}>
            <div className="settings-card-header">
              <div className="settings-avatar">{obterIniciais(nome)}</div>

              <div>
                <h2>Informações pessoais</h2>
                <p>Esses dados serão exibidos no painel.</p>
              </div>
            </div>

            <div className="settings-field">
              <label htmlFor="settings-name">Nome completo</label>
              <input
                id="settings-name"
                type="text"
                autoComplete="name"
                maxLength="120"
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                disabled={salvandoPerfil}
                required
              />
            </div>

            <div className="settings-field">
              <label htmlFor="settings-email">E-mail</label>
              <input
                id="settings-email"
                type="email"
                autoComplete="email"
                maxLength="160"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={salvandoPerfil}
                required
              />
            </div>

            <div className="settings-field">
              <label htmlFor="settings-role">Cargo</label>
              <input
                id="settings-role"
                type="text"
                value={usuario?.cargo ?? ""}
                readOnly
                aria-describedby="settings-role-help"
              />
              <small id="settings-role-help" className="settings-field-help">
                O cargo é administrado na área de usuários.
              </small>
            </div>

            {erroPerfil && (
              <p className="settings-message error" role="alert">
                {erroPerfil}
              </p>
            )}

            {mensagemPerfil && (
              <p className="settings-message success" role="status">
                {mensagemPerfil}
              </p>
            )}

            <button
              className="save-settings-button"
              type="submit"
              disabled={salvandoPerfil}
            >
              {salvandoPerfil ? "Salvando..." : "Salvar perfil"}
            </button>
          </form>

          {usuario?.cargo === "Administrador" && !usuario?.is_demo && (
            <CompanyBrandSettings />
          )}

          <form className="settings-card" onSubmit={handleSenhaSubmit}>
            <div className="settings-card-header">
              <div className="settings-security-icon" aria-hidden="true">
                🔒
              </div>

              <div>
                <h2>Segurança da conta</h2>
                <p>Confirme sua senha atual antes de criar uma nova.</p>
              </div>
            </div>

            <div className="settings-field">
              <label htmlFor="settings-current-password">Senha atual</label>
              <input
                id="settings-current-password"
                type="password"
                autoComplete="current-password"
                maxLength="200"
                value={senhaAtual}
                onChange={(event) => setSenhaAtual(event.target.value)}
                disabled={salvandoSenha}
                required
              />
            </div>

            <div className="settings-field">
              <label htmlFor="settings-new-password">Nova senha</label>
              <input
                id="settings-new-password"
                type="password"
                autoComplete="new-password"
                minLength="8"
                maxLength="200"
                value={novaSenha}
                onChange={(event) => setNovaSenha(event.target.value)}
                disabled={salvandoSenha}
                aria-describedby="settings-password-help"
                required
              />
              <small
                id="settings-password-help"
                className="settings-field-help"
              >
                Use pelo menos 8 caracteres e não repita a senha atual.
              </small>
            </div>

            <div className="settings-field">
              <label htmlFor="settings-confirm-password">
                Confirmar nova senha
              </label>
              <input
                id="settings-confirm-password"
                type="password"
                autoComplete="new-password"
                minLength="8"
                maxLength="200"
                value={confirmarNovaSenha}
                onChange={(event) => setConfirmarNovaSenha(event.target.value)}
                disabled={salvandoSenha}
                required
              />
            </div>

            {erroSenha && (
              <p className="settings-message error" role="alert">
                {erroSenha}
              </p>
            )}

            {mensagemSenha && (
              <p className="settings-message success" role="status">
                {mensagemSenha}
              </p>
            )}

            <button
              className="save-settings-button"
              type="submit"
              disabled={salvandoSenha}
            >
              {salvandoSenha ? "Atualizando..." : "Atualizar senha"}
            </button>
          </form>
        </div>

        <aside className="settings-info-card">
          <div className="settings-logo">
            <img
              src={configuracao.logo_url || "/brand-mark.svg"}
              alt={`Logo ${configuracao.nome_empresa}`}
              onError={usarLogoPadrao}
            />
          </div>

          <h2>{configuracao.nome_empresa}</h2>
          <p>Seus dados agora permanecem sincronizados com sua conta.</p>

          <div className="settings-info-item">
            <span>Perfil</span>
            <strong>Banco de dados</strong>
          </div>

          <div className="settings-info-item">
            <span>Senha</span>
            <strong>Hash protegido</strong>
          </div>

          <div className="settings-info-item">
            <span>Sessão</span>
            <strong>Autenticada</strong>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default ProfileSettings;

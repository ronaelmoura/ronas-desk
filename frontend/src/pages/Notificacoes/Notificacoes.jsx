import { useCallback, useEffect, useState } from 'react'
import { BellRing, CheckCheck, CircleAlert, Ticket } from 'lucide-react'
import {
  listarNotificacoesApi,
  marcarNotificacaoComoLidaApi,
  marcarTodasNotificacoesComoLidasApi,
} from '../../services/notificacoesApi'
import './notificacoes.css'

function formatarData(data) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(data))
}

function Notificacoes() {
  const [dados, setDados] = useState({ notificacoes: [], naoLidas: 0 })
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [atualizando, setAtualizando] = useState(false)

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro('')
    try {
      setDados(await listarNotificacoesApi())
    } catch (error) {
      setErro(error.message)
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function marcarComoLida(notificacao) {
    if (notificacao.lida_em) return

    try {
      await marcarNotificacaoComoLidaApi(notificacao.id)
      setDados((atual) => ({
        naoLidas: Math.max(0, atual.naoLidas - 1),
        notificacoes: atual.notificacoes.map((item) =>
          item.id === notificacao.id
            ? { ...item, lida_em: new Date().toISOString() }
            : item,
        ),
      }))
    } catch (error) {
      setErro(error.message)
    }
  }

  async function marcarTodas() {
    setAtualizando(true)
    setErro('')
    try {
      await marcarTodasNotificacoesComoLidasApi()
      setDados((atual) => ({
        naoLidas: 0,
        notificacoes: atual.notificacoes.map((item) => ({
          ...item,
          lida_em: item.lida_em || new Date().toISOString(),
        })),
      }))
    } catch (error) {
      setErro(error.message)
    } finally {
      setAtualizando(false)
    }
  }

  return (
    <section className="notifications-page">
      <header className="notifications-heading">
        <div>
          <p>ACOMPANHAMENTO</p>
          <h1>Notificações</h1>
          <span>Alertas automáticos sobre os chamados sob seus cuidados.</span>
        </div>
        {dados.naoLidas > 0 ? (
          <button type="button" onClick={marcarTodas} disabled={atualizando}>
            <CheckCheck size={17} />
            {atualizando ? 'Atualizando...' : 'Marcar todas como lidas'}
          </button>
        ) : null}
      </header>

      {erro ? (
        <div className="notifications-error" role="alert">
          <CircleAlert size={18} />
          <span>{erro}</span>
          <button type="button" onClick={carregar}>
            Tentar novamente
          </button>
        </div>
      ) : null}

      {carregando ? (
        <p className="notifications-empty">Carregando notificações...</p>
      ) : dados.notificacoes.length ? (
        <div className="notifications-list">
          {dados.notificacoes.map((notificacao) => (
            <button
              className={`notification-item ${
                notificacao.lida_em ? 'is-read' : 'is-unread'
              }`}
              key={notificacao.id}
              onClick={() => marcarComoLida(notificacao)}
              type="button"
            >
              <span className="notification-icon">
                {notificacao.chamado_id ? <Ticket size={19} /> : <BellRing size={19} />}
              </span>
              <span className="notification-copy">
                <strong>{notificacao.titulo}</strong>
                <span>{notificacao.mensagem}</span>
                <small>{formatarData(notificacao.created_at)}</small>
              </span>
              {!notificacao.lida_em ? <span className="notification-dot" /> : null}
            </button>
          ))}
        </div>
      ) : (
        <div className="notifications-empty">
          <BellRing size={34} />
          <strong>Tudo em dia</strong>
          <span>Você não tem notificações no momento.</span>
        </div>
      )}
    </section>
  )
}

export default Notificacoes

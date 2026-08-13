import { useCallback, useEffect, useMemo, useState } from 'react'
import { CirclePlus, MessageSquare, RefreshCw, TicketCheck, X } from 'lucide-react'
import useAuth from '../../hooks/useAuth'
import useCompanyBrand from '../../hooks/useCompanyBrand'
import {
  avaliarChamadoApi,
  buscarMinhaAvaliacaoApi,
  criarMeuChamadoApi,
  enviarMensagemChamadoApi,
  listarMensagensChamadoApi,
  listarMeusChamadosApi,
} from '../../services/portalClienteApi'
import { classeChamado } from '../../utils/chamados'
import Paginacao from '../../components/ui/Paginacao'
import './PortalCliente.css'
import './AvaliacaoPortal.css'

const CATEGORIAS = ['Hardware', 'Software', 'Rede', 'Acesso', 'Outro']
const PRIORIDADES = ['Crítica', 'Alta', 'Média', 'Baixa']
const STATUS_ENCERRADOS = new Set(['Resolvido', 'Fechado'])

function formatarData(data) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(data))
}

function ModalPortal({ children, onClose, tituloId }) {
  return (
    <div className="portal-modal-backdrop" onMouseDown={onClose}>
      <section
        aria-labelledby={tituloId}
        aria-modal="true"
        className="portal-modal"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        {children}
      </section>
    </div>
  )
}

function NovoChamadoPortal({ onClose, onCreated }) {
  const [formulario, setFormulario] = useState({
    titulo: '',
    descricao: '',
    categoria: '',
    prioridade: '',
  })
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  function atualizarCampo(event) {
    const { name, value } = event.target
    setFormulario((atual) => ({ ...atual, [name]: value }))
  }

  async function enviar(event) {
    event.preventDefault()
    setSalvando(true)
    setErro('')

    try {
      await onCreated(await criarMeuChamadoApi(formulario))
    } catch (error) {
      setErro(error.message)
      setSalvando(false)
    }
  }

  return (
    <ModalPortal onClose={onClose} tituloId="novo-chamado-portal">
      <header>
        <div>
          <p>NOVA SOLICITAÇÃO</p>
          <h2 id="novo-chamado-portal">Como podemos ajudar?</h2>
        </div>
        <button aria-label="Fechar" disabled={salvando} onClick={onClose} type="button">
          <X />
        </button>
      </header>
      <form onSubmit={enviar}>
        {erro ? <p className="portal-form-error" role="alert">{erro}</p> : null}
        <label>
          Título
          <input autoFocus maxLength="200" name="titulo" onChange={atualizarCampo} placeholder="Ex.: Não consigo acessar o sistema" required value={formulario.titulo} />
        </label>
        <div className="portal-form-grid">
          <label>
            Categoria
            <select name="categoria" onChange={atualizarCampo} required value={formulario.categoria}>
              <option value="">Selecione</option>
              {CATEGORIAS.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label>
            Prioridade
            <select name="prioridade" onChange={atualizarCampo} required value={formulario.prioridade}>
              <option value="">Selecione</option>
              {PRIORIDADES.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
        </div>
        <label>
          Descreva o problema
          <textarea maxLength="10000" name="descricao" onChange={atualizarCampo} placeholder="Conte o que aconteceu e, se possível, quando o problema começou." required rows="6" value={formulario.descricao} />
        </label>
        <footer>
          <button disabled={salvando} onClick={onClose} type="button">Cancelar</button>
          <button className="portal-primary-button" disabled={salvando} type="submit">{salvando ? 'Enviando...' : 'Abrir chamado'}</button>
        </footer>
      </form>
    </ModalPortal>
  )
}

function AvaliacaoChamado({ chamadoId, avaliacao, onAvaliada }) {
  const [nota, setNota] = useState(0)
  const [comentario, setComentario] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function enviarAvaliacao(event) {
    event.preventDefault()
    if (!nota) {
      setErro('Escolha uma nota de 1 a 5.')
      return
    }

    setEnviando(true)
    setErro('')
    try {
      onAvaliada(await avaliarChamadoApi(chamadoId, { nota, comentario }))
    } catch (error) {
      setErro(error.message)
    } finally {
      setEnviando(false)
    }
  }

  if (avaliacao) {
    return (
      <section className="portal-rating">
        <h3>Avaliação enviada</h3>
        <div aria-label={`${avaliacao.nota} de 5 estrelas`} className="portal-rating-stars readonly">
          {Array.from({ length: 5 }, (_, indice) => <span className={indice < avaliacao.nota ? 'selected' : ''} key={indice}>★</span>)}
        </div>
        <p>Obrigado por compartilhar sua experiência.</p>
      </section>
    )
  }

  return (
    <section className="portal-rating">
      <h3>Como foi seu atendimento?</h3>
      <p>Seu feedback ajuda nossa equipe a melhorar.</p>
      <form onSubmit={enviarAvaliacao}>
        {erro ? <p className="portal-form-error" role="alert">{erro}</p> : null}
        <div className="portal-rating-stars" role="group" aria-label="Nota do atendimento">
          {Array.from({ length: 5 }, (_, indice) => (
            <button className={indice < nota ? 'selected' : ''} key={indice} onClick={() => setNota(indice + 1)} type="button" aria-label={`${indice + 1} estrela${indice ? 's' : ''}`}>★</button>
          ))}
        </div>
        <label htmlFor="portal-rating-comment">Comentário opcional</label>
        <textarea id="portal-rating-comment" maxLength="1000" onChange={(event) => setComentario(event.target.value)} placeholder="Conte como foi sua experiência..." rows="3" value={comentario} />
        <footer>
          <small>{comentario.length}/1000</small>
          <button className="portal-primary-button" disabled={enviando} type="submit">{enviando ? 'Enviando...' : 'Enviar avaliação'}</button>
        </footer>
      </form>
    </section>
  )
}

function DetalhesChamadoPortal({ chamado, onChamadoAtualizado, onClose }) {
  const [mensagens, setMensagens] = useState([])
  const [avaliacao, setAvaliacao] = useState(undefined)
  const [carregando, setCarregando] = useState(true)
  const [novaMensagem, setNovaMensagem] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    let ativo = true
    const carregamentos = [listarMensagensChamadoApi(chamado.id)]
    if (STATUS_ENCERRADOS.has(chamado.status)) {
      carregamentos.push(buscarMinhaAvaliacaoApi(chamado.id))
    }

    Promise.all(carregamentos)
      .then(([mensagensCarregadas, avaliacaoCarregada]) => {
        if (!ativo) return
        setMensagens(mensagensCarregadas)
        if (STATUS_ENCERRADOS.has(chamado.status)) setAvaliacao(avaliacaoCarregada)
      })
      .catch((error) => {
        if (ativo) setErro(error.message)
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    return () => {
      ativo = false
    }
  }, [chamado.id, chamado.status])

  async function enviar(event) {
    event.preventDefault()
    const conteudo = novaMensagem.trim()
    if (!conteudo) return

    setEnviando(true)
    setErro('')
    try {
      const resposta = await enviarMensagemChamadoApi(chamado.id, conteudo)
      const { chamado: chamadoAtualizado, ...mensagem } = resposta
      setMensagens((atuais) => [...atuais, mensagem])
      if (chamadoAtualizado) onChamadoAtualizado(chamadoAtualizado)
      setNovaMensagem('')
    } catch (error) {
      setErro(error.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <ModalPortal onClose={onClose} tituloId="detalhe-chamado-portal">
      <header>
        <div>
          <p>#{String(chamado.id).padStart(3, '0')}</p>
          <h2 id="detalhe-chamado-portal">{chamado.titulo}</h2>
          <span>{chamado.categoria} · {formatarData(chamado.created_at)}</span>
        </div>
        <button aria-label="Fechar" onClick={onClose} type="button"><X /></button>
      </header>
      <div className="portal-ticket-info">
        <span className={`portal-status ${classeChamado('status', chamado.status)}`}>{chamado.status}</span>
        <p>{chamado.descricao}</p>
      </div>
      <section className="portal-messages">
        <h3>Mensagens da equipe</h3>
        {erro ? <p className="portal-form-error" role="alert">{erro}</p> : null}
        {carregando ? <p>Carregando mensagens...</p> : mensagens.length ? mensagens.map((mensagem) => (
          <article key={mensagem.id}>
            <strong>{mensagem.usuario_nome || 'Equipe de suporte'}</strong>
            <span>{formatarData(mensagem.created_at)}</span>
            <p>{mensagem.conteudo}</p>
          </article>
        )) : <p>Nenhuma mensagem pública ainda.</p>}
        <form onSubmit={enviar}>
          <label htmlFor="portal-message">Enviar mensagem para a equipe</label>
          <textarea id="portal-message" maxLength="2000" onChange={(event) => setNovaMensagem(event.target.value)} placeholder="Acrescente uma informação sobre o atendimento..." rows="4" value={novaMensagem} />
          <footer>
            <small>{novaMensagem.length}/2000</small>
            <button className="portal-primary-button" disabled={enviando || !novaMensagem.trim()} type="submit">{enviando ? 'Enviando...' : 'Enviar mensagem'}</button>
          </footer>
        </form>
      </section>
      {STATUS_ENCERRADOS.has(chamado.status) && avaliacao !== undefined ? <AvaliacaoChamado chamadoId={chamado.id} avaliacao={avaliacao} onAvaliada={setAvaliacao} /> : null}
    </ModalPortal>
  )
}

function PortalCliente() {
  const { usuario, logout } = useAuth()
  const { configuracao } = useCompanyBrand()
  const [chamados, setChamados] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [selecionado, setSelecionado] = useState(null)
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [paginacao, setPaginacao] = useState({ total: 0, total_paginas: 1 })

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro('')
    try {
      const resultado = await listarMeusChamadosApi({ pagina: paginaAtual, limite: 10 })
      setChamados(resultado.dados)
      setPaginacao(resultado.paginacao)
    } catch (error) {
      setErro(error.message)
    } finally {
      setCarregando(false)
    }
  }, [paginaAtual])

  useEffect(() => {
    carregar()
  }, [carregar])

  const resumo = useMemo(() => {
    let abertos = 0
    let resolvidos = 0
    for (const chamado of chamados) {
      if (!['Resolvido', 'Fechado', 'Cancelado'].includes(chamado.status)) abertos += 1
      if (chamado.status === 'Resolvido') resolvidos += 1
    }
    return { abertos, resolvidos }
  }, [chamados])

  async function criado(chamado) {
    setPaginaAtual(1)
    setChamados((atuais) => [chamado, ...atuais].slice(0, 10))
    setPaginacao((atual) => ({ ...atual, total: atual.total + 1 }))
    setModalAberto(false)
  }

  function atualizarChamado(chamadoAtualizado) {
    setChamados((atuais) =>
      atuais.map((chamado) =>
        chamado.id === chamadoAtualizado.id ? chamadoAtualizado : chamado,
      ),
    )
    setSelecionado(chamadoAtualizado)
  }

  return (
    <main className="portal-page">
      <header className="portal-header">
        <div className="portal-brand">
          <img alt="" onError={(event) => { event.currentTarget.src = '/brand-mark.svg' }} src={configuracao.logo_url || '/brand-mark.svg'} />
          <div><strong>{configuracao.nome_empresa}</strong><span>Portal do Cliente</span></div>
        </div>
        <div className="portal-user"><span>Olá, {usuario.nome.split(' ')[0]}</span><button onClick={logout} type="button">Sair</button></div>
      </header>
      <section className="portal-content">
        <header className="portal-intro">
          <div><p>ACOMPANHAMENTO</p><h1>Seus chamados de suporte</h1><span>Abra solicitações e acompanhe todas as atualizações da equipe.</span></div>
          <button className="portal-primary-button" onClick={() => setModalAberto(true)} type="button"><CirclePlus size={18} /> Novo chamado</button>
        </header>
        <div aria-label="Resumo dos chamados" className="portal-summary">
          <article><TicketCheck size={20} /><div><span>Total de chamados</span><strong>{paginacao.total}</strong></div></article>
          <article><RefreshCw size={20} /><div><span>Em acompanhamento</span><strong>{resumo.abertos}</strong></div></article>
          <article><MessageSquare size={20} /><div><span>Resolvidos</span><strong>{resumo.resolvidos}</strong></div></article>
        </div>
        {erro ? <div className="portal-alert" role="alert"><span>{erro}</span><button onClick={carregar} type="button">Tentar novamente</button></div> : null}
        <section aria-busy={carregando} className="portal-ticket-list">
          <header><div><h2>Chamados recentes</h2><span>{carregando ? 'Carregando...' : `${paginacao.total} registro(s)`}</span></div><button disabled={carregando} onClick={carregar} type="button"><RefreshCw size={17} /> Atualizar</button></header>
          {carregando ? <p className="portal-empty">Carregando seus chamados...</p> : chamados.length ? <div className="portal-ticket-table">{chamados.map((chamado) => <button className="portal-ticket-row" key={chamado.id} onClick={() => setSelecionado(chamado)} type="button"><span className="portal-ticket-id">#{String(chamado.id).padStart(3, '0')}</span><span><strong>{chamado.titulo}</strong><small>{chamado.categoria} · {formatarData(chamado.created_at)}</small></span><span className={`portal-status ${classeChamado('status', chamado.status)}`}>{chamado.status}</span><span className={`portal-priority ${classeChamado('priority', chamado.prioridade)}`}>{chamado.prioridade}</span></button>)}</div> : <div className="portal-empty"><TicketCheck size={32} /><strong>Nenhum chamado ainda</strong><p>Quando precisar de ajuda, abra sua primeira solicitação.</p><button className="portal-primary-button" onClick={() => setModalAberto(true)} type="button">Abrir chamado</button></div>}
          <Paginacao paginaAtual={paginaAtual} totalPaginas={paginacao.total_paginas} onChange={setPaginaAtual} ariaLabel="Paginação dos seus chamados" />
        </section>
      </section>
      {modalAberto ? <NovoChamadoPortal onClose={() => setModalAberto(false)} onCreated={criado} /> : null}
      {selecionado ? <DetalhesChamadoPortal chamado={selecionado} onChamadoAtualizado={atualizarChamado} onClose={() => setSelecionado(null)} /> : null}
    </main>
  )
}

export default PortalCliente

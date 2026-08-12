import { useCallback, useEffect, useMemo, useState } from 'react'
import { CirclePlus, MessageSquare, RefreshCw, TicketCheck, X } from 'lucide-react'
import useAuth from '../../hooks/useAuth'
import useCompanyBrand from '../../hooks/useCompanyBrand'
import {
  criarMeuChamadoApi,
  enviarMensagemChamadoApi,
  listarMensagensChamadoApi,
  listarMeusChamadosApi,
} from '../../services/portalClienteApi'
import { classeChamado } from '../../utils/chamados'
import './PortalCliente.css'

const CATEGORIAS = ['Hardware', 'Software', 'Rede', 'Acesso', 'Outro']
const PRIORIDADES = ['Crítica', 'Alta', 'Média', 'Baixa']

function formatarData(data) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(data))
}

function PortalCliente() {
  const { usuario, logout } = useAuth()
  const { configuracao } = useCompanyBrand()
  const [chamados, setChamados] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [selecionado, setSelecionado] = useState(null)

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro('')
    try {
      setChamados(await listarMeusChamadosApi())
    } catch (error) {
      setErro(error.message)
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  const resumo = useMemo(() => ({
    abertos: chamados.filter((chamado) => !['Resolvido', 'Fechado', 'Cancelado'].includes(chamado.status)).length,
    resolvidos: chamados.filter((chamado) => chamado.status === 'Resolvido').length,
  }), [chamados])

  async function criado(chamado) {
    setChamados((atuais) => [chamado, ...atuais])
    setModalAberto(false)
  }

  return (
    <main className="portal-page">
      <header className="portal-header">
        <div className="portal-brand">
          <img src={configuracao.logo_url || '/brand-mark.svg'} alt="" onError={(event) => { event.currentTarget.src = '/brand-mark.svg' }} />
          <div><strong>{configuracao.nome_empresa}</strong><span>Portal do Cliente</span></div>
        </div>
        <div className="portal-user"><span>Olá, {usuario.nome.split(' ')[0]}</span><button type="button" onClick={logout}>Sair</button></div>
      </header>

      <section className="portal-content">
        <header className="portal-intro">
          <div><p>ACOMPANHAMENTO</p><h1>Seus chamados de suporte</h1><span>Abra solicitações e acompanhe todas as atualizações da equipe.</span></div>
          <button className="portal-primary-button" type="button" onClick={() => setModalAberto(true)}><CirclePlus size={18} /> Novo chamado</button>
        </header>

        <div className="portal-summary" aria-label="Resumo dos chamados">
          <article><TicketCheck size={20} /><div><span>Total de chamados</span><strong>{chamados.length}</strong></div></article>
          <article><RefreshCw size={20} /><div><span>Em acompanhamento</span><strong>{resumo.abertos}</strong></div></article>
          <article><MessageSquare size={20} /><div><span>Resolvidos</span><strong>{resumo.resolvidos}</strong></div></article>
        </div>

        {erro ? <div className="portal-alert" role="alert"><span>{erro}</span><button type="button" onClick={carregar}>Tentar novamente</button></div> : null}
        <section className="portal-ticket-list" aria-busy={carregando}>
          <header><div><h2>Chamados recentes</h2><span>{carregando ? 'Carregando...' : `${chamados.length} registro(s)`}</span></div><button type="button" onClick={carregar} disabled={carregando}><RefreshCw size={17} /> Atualizar</button></header>
          {carregando ? <p className="portal-empty">Carregando seus chamados...</p> : chamados.length ? (
            <div className="portal-ticket-table">
              {chamados.map((chamado) => <button type="button" key={chamado.id} className="portal-ticket-row" onClick={() => setSelecionado(chamado)}>
                <span className="portal-ticket-id">#{String(chamado.id).padStart(3, '0')}</span><span><strong>{chamado.titulo}</strong><small>{chamado.categoria} · {formatarData(chamado.created_at)}</small></span><span className={`portal-status ${classeChamado('status', chamado.status)}`}>{chamado.status}</span><span className={`portal-priority ${classeChamado('priority', chamado.prioridade)}`}>{chamado.prioridade}</span>
              </button>)}
            </div>
          ) : <div className="portal-empty"><TicketCheck size={32} /><strong>Nenhum chamado ainda</strong><p>Quando precisar de ajuda, abra sua primeira solicitação.</p><button className="portal-primary-button" type="button" onClick={() => setModalAberto(true)}>Abrir chamado</button></div>}
        </section>
      </section>
      {modalAberto ? <NovoChamadoPortal onClose={() => setModalAberto(false)} onCreated={criado} /> : null}
      {selecionado ? <DetalhesChamadoPortal chamado={selecionado} onClose={() => setSelecionado(null)} /> : null}
    </main>
  )
}

function NovoChamadoPortal({ onClose, onCreated }) {
  const [formulario, setFormulario] = useState({ titulo: '', descricao: '', categoria: '', prioridade: '' })
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  async function enviar(event) {
    event.preventDefault(); setSalvando(true); setErro('')
    try { await onCreated(await criarMeuChamadoApi(formulario)) } catch (error) { setErro(error.message); setSalvando(false) }
  }
  return <div className="portal-modal-backdrop" onMouseDown={onClose}><section className="portal-modal" role="dialog" aria-modal="true" aria-labelledby="novo-chamado-portal" onMouseDown={(event) => event.stopPropagation()}><header><div><p>NOVA SOLICITAÇÃO</p><h2 id="novo-chamado-portal">Como podemos ajudar?</h2></div><button type="button" onClick={onClose} disabled={salvando} aria-label="Fechar"><X /></button></header><form onSubmit={enviar}>{erro ? <p className="portal-form-error" role="alert">{erro}</p> : null}<label>Título<input autoFocus maxLength="200" required value={formulario.titulo} onChange={(event) => setFormulario({ ...formulario, titulo: event.target.value })} placeholder="Ex.: Não consigo acessar o sistema" /></label><div className="portal-form-grid"><label>Categoria<select required value={formulario.categoria} onChange={(event) => setFormulario({ ...formulario, categoria: event.target.value })}><option value="">Selecione</option>{CATEGORIAS.map((item) => <option key={item}>{item}</option>)}</select></label><label>Prioridade<select required value={formulario.prioridade} onChange={(event) => setFormulario({ ...formulario, prioridade: event.target.value })}><option value="">Selecione</option>{PRIORIDADES.map((item) => <option key={item}>{item}</option>)}</select></label></div><label>Descreva o problema<textarea rows="6" maxLength="10000" required value={formulario.descricao} onChange={(event) => setFormulario({ ...formulario, descricao: event.target.value })} placeholder="Conte o que aconteceu e, se possível, quando o problema começou." /></label><footer><button type="button" onClick={onClose} disabled={salvando}>Cancelar</button><button className="portal-primary-button" type="submit" disabled={salvando}>{salvando ? 'Enviando...' : 'Abrir chamado'}</button></footer></form></section></div>
}

function DetalhesChamadoPortal({ chamado, onClose }) {
  const [mensagens, setMensagens] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [novaMensagem, setNovaMensagem] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  useEffect(() => { listarMensagensChamadoApi(chamado.id).then(setMensagens).catch((error) => setErro(error.message)).finally(() => setCarregando(false)) }, [chamado.id])
  async function enviar(event) { event.preventDefault(); if (!novaMensagem.trim()) return; setEnviando(true); setErro(''); try { const mensagem = await enviarMensagemChamadoApi(chamado.id, novaMensagem.trim()); setMensagens((atuais) => [...atuais, mensagem]); setNovaMensagem('') } catch (error) { setErro(error.message) } finally { setEnviando(false) } }
  return <div className="portal-modal-backdrop" onMouseDown={onClose}><section className="portal-modal portal-ticket-details" role="dialog" aria-modal="true" aria-labelledby="detalhe-chamado-portal" onMouseDown={(event) => event.stopPropagation()}><header><div><p>#{String(chamado.id).padStart(3, '0')}</p><h2 id="detalhe-chamado-portal">{chamado.titulo}</h2><span>{chamado.categoria} · {formatarData(chamado.created_at)}</span></div><button type="button" onClick={onClose} aria-label="Fechar"><X /></button></header><div className="portal-ticket-info"><span className={`portal-status ${classeChamado('status', chamado.status)}`}>{chamado.status}</span><p>{chamado.descricao}</p></div><section className="portal-messages"><h3>Mensagens da equipe</h3>{erro ? <p className="portal-form-error" role="alert">{erro}</p> : null}{carregando ? <p>Carregando mensagens...</p> : mensagens.length ? mensagens.map((mensagem) => <article key={mensagem.id}><strong>{mensagem.usuario_nome || 'Equipe de suporte'}</strong><span>{formatarData(mensagem.created_at)}</span><p>{mensagem.conteudo}</p></article>) : <p>Nenhuma mensagem pública ainda.</p>}<form onSubmit={enviar}><label htmlFor="portal-message">Enviar mensagem para a equipe</label><textarea id="portal-message" rows="4" maxLength="2000" value={novaMensagem} onChange={(event) => setNovaMensagem(event.target.value)} placeholder="Acrescente uma informação sobre o atendimento..." /><footer><small>{novaMensagem.length}/2000</small><button className="portal-primary-button" type="submit" disabled={enviando || !novaMensagem.trim()}>{enviando ? 'Enviando...' : 'Enviar mensagem'}</button></footer></form></section></section></div>
}

export default PortalCliente

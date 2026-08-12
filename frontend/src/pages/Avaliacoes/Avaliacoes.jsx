import { useCallback, useEffect, useState } from 'react'
import { MessageSquareHeart, Star } from 'lucide-react'
import { listarAvaliacoesApi } from '../../services/avaliacoesApi'
import './avaliacoes.css'

function Avaliacoes() {
  const [dados, setDados] = useState({ avaliacoes: [], resumo: { total: 0, media: null } })
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro('')
    try {
      setDados(await listarAvaliacoesApi())
    } catch (error) {
      setErro(error.message)
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  return (
    <section className="ratings-page">
      <header>
        <div>
          <p>QUALIDADE DO ATENDIMENTO</p>
          <h1>Avaliações</h1>
          <span>Ouça seus clientes e acompanhe a satisfação da operação.</span>
        </div>
      </header>
      {carregando ? <p className="ratings-empty">Carregando avaliações...</p> : null}
      {erro ? <div className="ratings-error"><span>{erro}</span><button type="button" onClick={carregar}>Tentar novamente</button></div> : null}
      {!carregando && !erro ? <>
        <div className="ratings-summary">
          <article><Star fill="currentColor" size={22} /><div><span>Nota média</span><strong>{dados.resumo.media === null ? '—' : dados.resumo.media.toFixed(1)}</strong><small>de 5 estrelas</small></div></article>
          <article><MessageSquareHeart size={22} /><div><span>Avaliações recebidas</span><strong>{dados.resumo.total}</strong><small>respostas dos clientes</small></div></article>
        </div>
        {dados.avaliacoes.length ? <div className="ratings-list">{dados.avaliacoes.map((avaliacao) => <article key={avaliacao.id}><header><div><strong>{avaliacao.cliente_nome}</strong><span>{avaliacao.cliente_empresa || 'Cliente'}</span></div><div className="rating-stars" aria-label={`${avaliacao.nota} de 5 estrelas`}>{Array.from({ length: 5 }, (_, indice) => <Star key={indice} size={16} fill={indice < avaliacao.nota ? 'currentColor' : 'none'} />)}</div></header><p>{avaliacao.comentario || 'O cliente não deixou comentário.'}</p><footer>#{String(avaliacao.chamado_id).padStart(3, '0')} · {avaliacao.chamado_titulo}</footer></article>)}</div> : <div className="ratings-empty"><MessageSquareHeart size={34} /><strong>Ainda não há avaliações</strong><span>As avaliações aparecerão quando clientes responderem após um chamado resolvido.</span></div>}
      </> : null}
    </section>
  )
}

export default Avaliacoes

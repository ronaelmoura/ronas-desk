import { useState } from 'react'
import { ArrowRight, Check, Compass, ShieldCheck } from 'lucide-react'
import './DemoGuide.css'

const etapas = [
  { pagina: 'visao-geral', titulo: 'Entenda a operação', descricao: 'Clique nos indicadores para abrir os chamados daquele grupo. Compare os períodos e acompanhe os prazos de SLA.' },
  { pagina: 'chamados', titulo: 'Explore um atendimento', descricao: 'Use a busca e os filtros. Abra “Ver detalhes” para conhecer as informações, o histórico e as interações do chamado.' },
  { pagina: 'clientes', titulo: 'Conheça os clientes', descricao: 'Selecione o nome de um cliente para consultar seus dados e os chamados vinculados.' },
  { pagina: 'relatorios', titulo: 'Analise os resultados', descricao: 'Compare indicadores e períodos para entender o volume e a evolução dos atendimentos.' },
]

export default function DemoGuide({ paginaAtiva, onNavigate }) {
  const [aberto, setAberto] = useState(() => !window.matchMedia?.('(max-width: 600px)').matches)
  const [visitadas, setVisitadas] = useState(() => new Set([paginaAtiva]))
  // Guarda apenas o progresso desta visita, sem gravar dados da conta demo.
  if (!visitadas.has(paginaAtiva)) {
    setVisitadas(new Set([...visitadas, paginaAtiva]))
  }
  const etapaAtual = etapas.find((etapa) => etapa.pagina === paginaAtiva)
  const total = etapas.filter((etapa) => visitadas.has(etapa.pagina)).length
  const proxima = etapas.find((etapa) => !visitadas.has(etapa.pagina))

  return (
    <section className="demo-guide" aria-label="Guia da demonstração">
      <header className="demo-guide-header">
        <div className="demo-guide-heading">
          <Compass size={22} aria-hidden="true" />
          <div><strong>Conheça o Ronas Desk na prática</strong><p>Dados fictícios · navegação livre · somente leitura</p></div>
        </div>
        <button type="button" aria-expanded={aberto} aria-controls="demo-guide-content" onClick={() => setAberto(!aberto)}>{aberto ? 'Recolher guia' : 'Mostrar guia'}</button>
      </header>
      {aberto && <div id="demo-guide-content">
        <div className="demo-guide-intro"><p>Um roteiro para explorar o suporte, do primeiro contato aos resultados.</p><span>{total} de {etapas.length} telas visitadas</span></div>
        <ol className="demo-guide-steps">
          {etapas.map((etapa, index) => <li key={etapa.pagina}>
            <button type="button" aria-current={paginaAtiva === etapa.pagina ? 'step' : undefined} onClick={() => onNavigate(etapa.pagina)}>
              <span className="demo-guide-number" aria-hidden="true">{visitadas.has(etapa.pagina) ? <Check size={16} /> : `0${index + 1}`}</span>
              <span>{etapa.titulo}<small>{paginaAtiva === etapa.pagina ? 'Você está aqui' : visitadas.has(etapa.pagina) ? 'Visitada' : 'Explorar'}</small></span>
            </button>
          </li>)}
        </ol>
        <div className="demo-guide-tip">
          <p>{etapaAtual?.descricao || 'Explore esta tela pelo menu. Seu progresso no roteiro continua disponível aqui.'}</p>
          {proxima ? <button type="button" onClick={() => onNavigate(proxima.pagina)}>Próxima: {proxima.titulo}<ArrowRight size={16} aria-hidden="true" /></button> : <strong>Roteiro percorrido. Continue explorando à vontade.</strong>}
        </div>
        <p className="demo-guide-safety"><ShieldCheck size={16} aria-hidden="true" />Você pode consultar e filtrar. Criar, editar e excluir ficam disponíveis nas contas de trabalho.</p>
      </div>}
    </section>
  )
}

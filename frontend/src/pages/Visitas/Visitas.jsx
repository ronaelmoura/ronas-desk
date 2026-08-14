import { useEffect, useState } from 'react'
import {
  CalendarDays,
  Globe2,
  MapPinned,
  MonitorSmartphone,
  MousePointerClick,
  Route,
  UsersRound,
} from 'lucide-react'
import { buscarResumoVisitasApi } from '../../services/visitasApi'
import './visitas.css'

function formatarDataInput(data) {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

function criarPeriodoInicial() {
  const fim = new Date()
  const inicio = new Date()
  inicio.setDate(inicio.getDate() - 29)
  return {
    dataInicio: formatarDataInput(inicio),
    dataFim: formatarDataInput(fim),
  }
}

const resumoInicial = {
  total_visitas: 0,
  visitantes_unicos: 0,
  por_dia: [],
  por_regiao: [],
  por_pagina: [],
  por_origem: [],
  por_dispositivo: [],
}

function localizacaoIndisponivel({ pais, regiao }) {
  return (
    !pais ||
    !regiao ||
    pais === 'Não identificado' ||
    regiao === 'Não identificada'
  )
}

function formatarRegiao({ pais, regiao }) {
  return localizacaoIndisponivel({ pais, regiao })
    ? 'Região indisponível'
    : `${regiao} — ${pais}`
}

function formatarDataVisita(data) {
  if (typeof data !== 'string') return 'Data indisponível'

  const correspondencia = /^(\d{4})-(\d{2})-(\d{2})/.exec(data)
  if (!correspondencia) return 'Data indisponível'

  const [, ano, mes, dia] = correspondencia
  const dataLocal = new Date(Number(ano), Number(mes) - 1, Number(dia))

  if (
    dataLocal.getFullYear() !== Number(ano) ||
    dataLocal.getMonth() !== Number(mes) - 1 ||
    dataLocal.getDate() !== Number(dia)
  ) {
    return 'Data indisponível'
  }

  return dataLocal.toLocaleDateString('pt-BR')
}

function Distribuicao({ titulo, icone: Icone, itens, obterRotulo }) {
  const maiorTotal = Math.max(...itens.map((item) => item.total), 0)

  return (
    <article className="visits-chart-card">
      <header>
        <Icone size={19} aria-hidden="true" />
        <h2>{titulo}</h2>
      </header>

      {itens.length ? (
        <ul className="visits-bars">
          {itens.map((item, indice) => {
            const rotulo = obterRotulo(item)
            const percentual = maiorTotal
              ? Math.max(4, (item.total / maiorTotal) * 100)
              : 0

            return (
              <li key={`${rotulo}-${indice}`}>
                <div>
                  <span>{rotulo}</span>
                  <strong>{item.total}</strong>
                </div>
                <span className="visits-bar-track" aria-hidden="true">
                  <span style={{ width: `${percentual}%` }} />
                </span>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="visits-empty">Nenhuma visita registrada no período.</p>
      )}
    </article>
  )
}

function Visitas() {
  const [filtros, setFiltros] = useState(criarPeriodoInicial)
  const [resumo, setResumo] = useState(resumoInicial)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  async function carregar(periodo = filtros) {
    setCarregando(true)
    setErro('')

    try {
      const dados = await buscarResumoVisitasApi(
        periodo.dataInicio,
        periodo.dataFim,
      )
      setResumo(dados)
    } catch (error) {
      setErro(error.message)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar(criarPeriodoInicial())
  }, [])

  function aplicarFiltros(event) {
    event.preventDefault()
    carregar()
  }

  return (
    <section className="visits-page">
      <header className="visits-header">
        <div>
          <p className="dashboard-eyebrow">Audiência da demonstração</p>
          <h1>Visitas</h1>
          <p>
            Acompanhe acessos anônimos e descubra como o Ronas Desk está sendo
            explorado.
          </p>
        </div>
      </header>

      <form className="visits-filters" onSubmit={aplicarFiltros}>
        <div>
          <label htmlFor="visits-start-date">Data inicial</label>
          <input
            id="visits-start-date"
            type="date"
            value={filtros.dataInicio}
            max={filtros.dataFim}
            required
            onChange={(event) =>
              setFiltros((atuais) => ({
                ...atuais,
                dataInicio: event.target.value,
              }))
            }
          />
        </div>
        <div>
          <label htmlFor="visits-end-date">Data final</label>
          <input
            id="visits-end-date"
            type="date"
            value={filtros.dataFim}
            min={filtros.dataInicio}
            required
            onChange={(event) =>
              setFiltros((atuais) => ({
                ...atuais,
                dataFim: event.target.value,
              }))
            }
          />
        </div>
        <button type="submit" disabled={carregando}>
          <CalendarDays size={17} aria-hidden="true" />
          Aplicar período
        </button>
      </form>

      {carregando ? (
        <div className="visits-feedback">Carregando estatísticas...</div>
      ) : erro ? (
        <div className="visits-feedback" role="alert">
          <strong>Não foi possível carregar as visitas.</strong>
          <p>{erro}</p>
          <button type="button" onClick={() => carregar()}>
            Tentar novamente
          </button>
        </div>
      ) : (
        <>
          <div className="visits-summary">
            <article>
              <MousePointerClick aria-hidden="true" />
              <div>
                <span>Páginas visitadas</span>
                <strong>{resumo.total_visitas}</strong>
                <small>Acessos únicos por página e sessão</small>
              </div>
            </article>
            <article>
              <UsersRound aria-hidden="true" />
              <div>
                <span>Visitantes</span>
                <strong>{resumo.visitantes_unicos}</strong>
                <small>Sessões anônimas no período</small>
              </div>
            </article>
            <article>
              <Globe2 aria-hidden="true" />
              <div>
                <span>Países</span>
                <strong>
                  {
                    new Set(
                      resumo.por_regiao
                        .filter((item) => !localizacaoIndisponivel(item))
                        .map((item) => item.pais)
                    ).size
                  }
                </strong>
                <small>Localização aproximada</small>
              </div>
            </article>
          </div>

          <div className="visits-charts">
            <Distribuicao
              titulo="Visitas por dia"
              icone={CalendarDays}
              itens={resumo.por_dia}
              obterRotulo={(item) => formatarDataVisita(item.data)}
            />
            <Distribuicao
              titulo="Regiões"
              icone={MapPinned}
              itens={resumo.por_regiao}
              obterRotulo={formatarRegiao}
            />
            <Distribuicao
              titulo="Páginas mais acessadas"
              icone={Route}
              itens={resumo.por_pagina}
              obterRotulo={(item) => item.rotulo.replaceAll('-', ' ')}
            />
            <Distribuicao
              titulo="Dispositivos"
              icone={MonitorSmartphone}
              itens={resumo.por_dispositivo}
              obterRotulo={(item) => item.rotulo}
            />
            <Distribuicao
              titulo="Origem dos acessos"
              icone={Globe2}
              itens={resumo.por_origem}
              obterRotulo={(item) => item.rotulo}
            />
          </div>

          <p className="visits-privacy-note">
            As estatísticas são anônimas e aproximadas. O Ronas Desk não
            armazena o endereço IP dos visitantes.
          </p>
        </>
      )}
    </section>
  )
}

export default Visitas

import { useEffect, useState } from "react";
import {
  CircleCheck,
  CirclePlus,
  Flag,
  FolderPen,
  History,
  LockKeyhole,
  MessageSquare,
  Paperclip,
  RefreshCw,
  RotateCcw,
  UserRound,
  UsersRound,
} from "lucide-react";
import { listarHistoricoChamadoApi } from "../services/chamadosApi";

const iconesEventos = {
  CHAMADO_CRIADO: CirclePlus,
  CHAMADO_ATUALIZADO: FolderPen,
  STATUS_ALTERADO: RefreshCw,
  PRIORIDADE_ALTERADA: Flag,
  RESPONSAVEL_ALTERADO: UserRound,
  CLIENTE_ALTERADO: UsersRound,
  CHAMADO_RESOLVIDO: CircleCheck,
  CHAMADO_FECHADO: LockKeyhole,
  CHAMADO_REABERTO: RotateCcw,
  COMENTARIO_ADICIONADO: MessageSquare,
  ANEXO_ADICIONADO: Paperclip,
  ANEXO_REMOVIDO: Paperclip,
};

const rotulosCampos = {
  titulo: "Título",
  descricao: "Descrição",
  categoria: "Categoria",
  prioridade: "Prioridade",
  status: "Status",
  responsavel: "Responsável",
  cliente: "Cliente",
};

function formatarDataHora(data) {
  const valor = new Date(data);
  return {
    data: valor.toLocaleDateString("pt-BR"),
    hora: valor.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

function formatarValor(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return "Não definido";
  }

  if (typeof valor === "boolean") return valor ? "Sim" : "Não";

  if (typeof valor === "object") {
    if (valor.nome) return valor.nome;
    if (valor.titulo) return valor.titulo;
    if (valor.id) return `#${valor.id}`;
    return "Não definido";
  }

  return String(valor);
}

export function HistoryValueChange({ oldValues, newValues }) {
  if (!oldValues || !newValues) return null;

  const campos = [
    ...new Set([...Object.keys(oldValues), ...Object.keys(newValues)]),
  ];

  return (
    <div className="timeline-changes">
      {campos.map((campo) => (
        <div className="timeline-change-group" key={campo}>
          <small>{rotulosCampos[campo] || "Informação"}</small>
          <p className="timeline-change">
            <span>{formatarValor(oldValues[campo])}</span>
            <b aria-label="alterado para">→</b>
            <span>{formatarValor(newValues[campo])}</span>
          </p>
        </div>
      ))}
    </div>
  );
}

export function TimelineItem({ evento }) {
  const Icone = iconesEventos[evento.event_type] || History;
  const dataHora = formatarDataHora(evento.created_at);
  const classeEvento = evento.event_type.toLowerCase();

  return (
    <li>
      <div className={`timeline-icon ${classeEvento}`}>
        <Icone size={17} aria-hidden="true" />
      </div>
      <div className="timeline-event">
        <header>
          <span>{dataHora.hora}</span>
          <small>{dataHora.data}</small>
        </header>
        <div>
          <strong>{evento.description}</strong>
          <span className="timeline-user">
            {evento.user_name || "Sistema"}
          </span>
          <HistoryValueChange
            oldValues={evento.old_values}
            newValues={evento.new_values}
          />
        </div>
      </div>
    </li>
  );
}

function TicketTimeline({ ticketId }) {
  const [eventos, setEventos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let ativo = true;

    async function carregarHistorico() {
      setCarregando(true);
      setErro("");

      try {
        const resultado = await listarHistoricoChamadoApi(ticketId);
        if (ativo) setEventos(resultado);
      } catch (error) {
        if (ativo) setErro(error.message);
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    carregarHistorico();
    return () => {
      ativo = false;
    };
  }, [ticketId, tentativa]);

  if (carregando) {
    return <div className="interaction-loading">Carregando histórico...</div>;
  }

  if (erro) {
    return (
      <div className="interaction-empty" role="alert">
        <History size={30} aria-hidden="true" />
        <strong>Não foi possível carregar o histórico</strong>
        <p>{erro}</p>
        <button type="button" onClick={() => setTentativa((valor) => valor + 1)}>
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!eventos.length) {
    return (
      <div className="interaction-empty">
        <History size={30} aria-hidden="true" />
        <strong>Nenhum evento registrado</strong>
        <p>As próximas alterações aparecerão nesta timeline.</p>
      </div>
    );
  }

  return (
    <ol className="timeline-list">
      {eventos.map((evento) => (
        <TimelineItem evento={evento} key={evento.id} />
      ))}
    </ol>
  );
}

export default TicketTimeline;

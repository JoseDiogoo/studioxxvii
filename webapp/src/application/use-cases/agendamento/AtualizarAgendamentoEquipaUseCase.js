import { EntidadeNaoEncontradaError, RegraNegocioError } from "@/domain/errors/DomainError";
import { DateUtil } from "@/infrastructure/utils/DateUtil";

/**
 * Atualização de uma marcação pela equipa: mover, trocar de profissional, cancelar/reativar,
 * pagamento e observações. Mover ou reativar ocupa uma hora, por isso passa pela verificação de conflito.
 */
export class AtualizarAgendamentoEquipaUseCase {
  constructor({ agendamentoRepository, notificationGateway }) {
    this.agendamentoRepository = agendamentoRepository;
    this.notificationGateway = notificationGateway;
  }

  async execute({ id, patch }) {
    const atual = await this.agendamentoRepository.findById(id);
    if (!atual) throw new EntidadeNaoEncontradaError("Agendamento", id);

    const novaData = patch.data ? new Date(patch.data) : atual.data;
    const novoInicio = patch.horaInicio ?? atual.horaInicio;
    const novoFim = patch.horaFim ?? atual.horaFim;
    const novoColaboradorId = patch.colaboradorId ?? atual.colaboradorId;

    const mudouHorarioOuColaborador =
      patch.data !== undefined ||
      patch.horaInicio !== undefined ||
      patch.horaFim !== undefined ||
      patch.colaboradorId !== undefined;

    // Voltar a confirmar uma marcação cancelada também ocupa a hora outra vez.
    const reativou = patch.status === "CONFIRMADO" && atual.status === "CANCELADO";

    if (novoFim <= novoInicio) {
      throw new RegraNegocioError("A hora de fim tem de ser depois da de início.");
    }

    const dados = {};
    if (patch.data !== undefined) dados.data = novaData;
    if (patch.horaInicio !== undefined) dados.horaInicio = patch.horaInicio;
    if (patch.horaFim !== undefined) dados.horaFim = patch.horaFim;
    if (patch.colaboradorId !== undefined) dados.colaboradorId = patch.colaboradorId;
    if (patch.pago !== undefined) dados.pago = patch.pago;
    if (patch.metodoPagamento !== undefined) dados.metodoPagamento = patch.metodoPagamento;
    if (patch.status !== undefined) dados.status = patch.status;
    if (patch.observacoes !== undefined) dados.observacoes = patch.observacoes;

    // Verificação de conflito e gravação acontecem juntas, com bloqueio.
    const atualizado = mudouHorarioOuColaborador || reativou
      ? await this.agendamentoRepository.atualizarSemConflito(id, dados, {
          colaboradorId: novoColaboradorId,
          data: novaData,
          horaInicio: novoInicio,
          horaFim: novoFim,
        })
      : await this.agendamentoRepository.update(id, dados);

    this._notificar({ atual, atualizado, patch, mudouHorarioOuColaborador });
    return atualizado;
  }

  _notificar({ atual, atualizado, patch, mudouHorarioOuColaborador }) {
    if (!this.notificationGateway || !atualizado.cliente) return;

    const base = {
      telefone: atualizado.cliente.telefone,
      nomeCliente: atualizado.cliente.nome,
      servicoTitulo: atualizado.servico?.titulo || "Serviço",
      dataStr: DateUtil.formatDateOnly(atualizado.data),
      horaInicio: atualizado.horaInicio,
    };

    if (patch.status === "CANCELADO" && atual.status !== "CANCELADO") {
      this.notificationGateway.enviarCancelamento(base).catch(() => {});
    } else if (mudouHorarioOuColaborador && atual.status === "CONFIRMADO") {
      this.notificationGateway.enviarReagendamento(base).catch(() => {});
    }
  }
}

import { StatusAgendamento } from "../value-objects/Enums";
import { HorarioSlot } from "../value-objects/HorarioSlot";

export class Agendamento {
  constructor({
    id,
    grupoId,
    clienteId,
    colaboradorId,
    servicoId,
    data,
    horaInicio,
    horaFim,
    valor,
    pago = false,
    metodoPagamento = null,
    observacoes = null,
    status = StatusAgendamento.CONFIRMADO,
    createdAt = new Date(),
    updatedAt = new Date(),
    cliente = null,
    colaborador = null,
    servico = null,
  }) {
    this.id = id;
    this.grupoId = grupoId;
    this.clienteId = clienteId;
    this.colaboradorId = colaboradorId;
    this.servicoId = servicoId;
    this.data = data instanceof Date ? data : new Date(data);
    this.horaInicio = horaInicio;
    this.horaFim = horaFim;
    this.valor = Number(valor);
    this.pago = Boolean(pago);
    this.metodoPagamento = metodoPagamento;
    this.observacoes = observacoes;
    this.status = status;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;

    // Relações carregadas opcionalmente
    this.cliente = cliente;
    this.colaborador = colaborador;
    this.servico = servico;
  }

  isAtivo() {
    return this.status !== StatusAgendamento.CANCELADO;
  }

  isConcluido() {
    return this.status === StatusAgendamento.CONCLUIDO;
  }

  isCancelado() {
    return this.status === StatusAgendamento.CANCELADO;
  }

  marcarComoPago(metodo) {
    this.pago = true;
    this.metodoPagamento = metodo;
    this.updatedAt = new Date();
  }

  reagendar({ novaData, novaHoraInicio, novaHoraFim, novoColaboradorId }) {
    if (novaData) this.data = novaData instanceof Date ? novaData : new Date(novaData);
    if (novaHoraInicio) this.horaInicio = novaHoraInicio;
    if (novaHoraFim) this.horaFim = novaHoraFim;
    if (novoColaboradorId) this.colaboradorId = novoColaboradorId;
    this.updatedAt = new Date();
  }

  cancelar() {
    this.status = StatusAgendamento.CANCELADO;
    this.updatedAt = new Date();
  }

  duracaoMinutos() {
    return HorarioSlot.timeToMinutes(this.horaFim) - HorarioSlot.timeToMinutes(this.horaInicio);
  }
}

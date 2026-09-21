import { EntidadeNaoEncontradaError } from "@/domain/errors/DomainError";

export class GerarFeedIcsUseCase {
  constructor({ colaboradorRepository, agendamentoRepository }) {
    this.colaboradorRepository = colaboradorRepository;
    this.agendamentoRepository = agendamentoRepository;
  }

  async execute({ colaboradorId, token }) {
    const colaborador = await this.colaboradorRepository.findById(colaboradorId);
    if (!colaborador || colaborador.icsToken !== token) {
      throw new EntidadeNaoEncontradaError("Feed de calendário inválido.");
    }

    // Carregar agendamentos dos últimos 30 dias até aos próximos 90 dias
    const inicio = new Date();
    inicio.setDate(inicio.getDate() - 30);
    const fim = new Date();
    fim.setDate(fim.getDate() + 90);

    const agendamentos = await this.agendamentoRepository.findParaEquipa({
      colaboradorId,
      dataInicio: inicio,
      dataFim: fim,
    });

    const linhas = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Studio XXVII//Agenda Barbearia//PT",
      `X-WR-CALNAME:Studio XXVII - ${colaborador.nome}`,
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
    ];

    for (const a of agendamentos) {
      if (a.status === "CANCELADO") continue;

      const dataStr = a.data.toISOString().slice(0, 10).replace(/-/g, "");
      const startStr = `${dataStr}T${a.horaInicio.replace(":", "")}00`;
      const endStr = `${dataStr}T${a.horaFim.replace(":", "")}00`;
      const uid = `${a.id}@studioxxvii.pt`;
      const summary = `${a.servico?.titulo || "Corte"} - ${a.cliente?.nome || "Cliente"}`;
      const description = `Cliente: ${a.cliente?.nome || ""}\\nTelefone: ${a.cliente?.telefone || ""}${a.observacoes ? `\\nObs: ${a.observacoes}` : ""}`;

      linhas.push(
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
        `DTSTART;TZID=Europe/Lisbon:${startStr}`,
        `DTEND;TZID=Europe/Lisbon:${endStr}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${description}`,
        "STATUS:CONFIRMED",
        "END:VEVENT"
      );
    }

    linhas.push("END:VCALENDAR");
    return linhas.join("\r\n");
  }
}

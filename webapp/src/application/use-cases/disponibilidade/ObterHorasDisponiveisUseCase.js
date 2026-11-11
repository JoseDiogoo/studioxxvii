import { TimezoneUtil } from "@/infrastructure/utils/TimezoneUtil";
import { CalculadoraDisponibilidadeService } from "@/domain/services/CalculadoraDisponibilidadeService";
import { RegraNegocioError } from "@/domain/errors/DomainError";

export class ObterHorasDisponiveisUseCase {
  constructor({ servicoRepository, colaboradorRepository, horarioRepository, agendamentoRepository }) {
    this.servicoRepository = servicoRepository;
    this.colaboradorRepository = colaboradorRepository;
    this.horarioRepository = horarioRepository;
    this.agendamentoRepository = agendamentoRepository;
  }

  async execute({ servicos, data }) {
    if (!Array.isArray(servicos) || servicos.length === 0) {
      throw new RegraNegocioError("É preciso escolher pelo menos um serviço.");
    }

    const servicoIds = servicos.map((s) => s.servicoId);
    const servicosDb = await this.servicoRepository.findByIds(servicoIds);
    const mapServicos = new Map(servicosDb.map((s) => [s.id, s]));

    const servicosPreparados = [];
    for (const s of servicos) {
      const sDb = mapServicos.get(s.servicoId);
      if (!sDb) throw new RegraNegocioError("Serviço inválido.");

      let elegiveis = [];
      if (s.colaboradorId) {
        elegiveis = [s.colaboradorId];
      } else {
        const colabs = await this.colaboradorRepository.findElegiveisPorServico(s.servicoId);
        elegiveis = colabs.map((c) => c.colaboradorId || c.id);
      }

      if (elegiveis.length === 0) {
        return { slots: [] };
      }

      servicosPreparados.push({
        servicoId: s.servicoId,
        elegiveis,
        duracaoMinutos: sDb.duracaoMinutos,
        preco: sDb.preco,
      });
    }

    const dataObj = typeof data === "string" ? new Date(`${data}T00:00:00.000Z`) : data;
    const diaSemana = dataObj.getUTCDay();
    const colaboradorIds = [...new Set(servicosPreparados.flatMap((s) => s.elegiveis))];

    const [horarios, agendamentos] = await Promise.all([
      this.horarioRepository.findByColaboradoresEDiaSemana(colaboradorIds, diaSemana),
      this.agendamentoRepository.findByColaboradoresEData(colaboradorIds, dataObj, dataObj),
    ]);

    // "Hoje" e a hora atual são os de Lisboa (o servidor corre em UTC), como na validação da marcação.
    const { dataStr: hojeStr, minutos: minutosAgora } = TimezoneUtil.agoraEmPortugal();
    const dataStr = dataObj.toISOString().slice(0, 10);
    const ehHoje = dataStr === hojeStr;

    const slotsValidos = CalculadoraDisponibilidadeService.calcularSlotsDisponiveis({
      servicosPreparados,
      horarios,
      agendamentos,
      ehHoje,
      minutosAgora,
    });

    return {
      slots: slotsValidos.map((s) => s.horaInicio),
    };
  }
}

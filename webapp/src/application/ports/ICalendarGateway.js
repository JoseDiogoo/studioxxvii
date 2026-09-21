/**
 * @interface ICalendarGateway
 */
export class ICalendarGateway {
  async sincronizarEvento(agendamento) {
    throw new Error("Método sincronizarEvento não implementado.");
  }

  async removerEvento(agendamento) {
    throw new Error("Método removerEvento não implementado.");
  }

  obterAuthUrl(state) {
    throw new Error("Método obterAuthUrl não implementado.");
  }

  async trocarCodigoPorRefreshToken(code) {
    throw new Error("Método trocarCodigoPorRefreshToken não implementado.");
  }
}

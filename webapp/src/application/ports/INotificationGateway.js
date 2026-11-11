/**
 * @interface INotificationGateway
 */
export class INotificationGateway {
  async enviarConfirmacao({ email, nomeCliente, servicoTitulo, dataStr, horaInicio }) {
    throw new Error("Método enviarConfirmacao não implementado.");
  }

  async enviarNovaMarcacaoBarbeiro({ nomeCliente, telefoneCliente, servicoTitulo, dataStr, horaInicio }) {
    throw new Error("Método enviarNovaMarcacaoBarbeiro não implementado.");
  }

  async enviarReagendamento({ email, nomeCliente, servicoTitulo, dataStr, horaInicio }) {
    throw new Error("Método enviarReagendamento não implementado.");
  }

  async enviarCancelamento({ email, nomeCliente, servicoTitulo, dataStr, horaInicio }) {
    throw new Error("Método enviarCancelamento não implementado.");
  }
}

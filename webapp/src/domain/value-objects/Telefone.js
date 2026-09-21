export class Telefone {
  static normalizarPT(telefone) {
    if (!telefone || typeof telefone !== "string") return "";
    const digitos = telefone.replace(/\D/g, "");
    if (digitos.startsWith("351") && digitos.length > 9) {
      return `+${digitos}`;
    }
    return `+351${digitos.slice(-9)}`;
  }

  static validarPT(telefone) {
    if (!telefone || typeof telefone !== "string") return false;
    const digitos = telefone.replace(/\D/g, "");
    const ultimos9 = digitos.slice(-9);
    return ultimos9.length === 9 && /^[92]\d{8}$/.test(ultimos9);
  }
}

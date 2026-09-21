/**
 * @interface IPasswordHasher
 */
export class IPasswordHasher {
  async hash(plainPassword) {
    throw new Error("Método hash não implementado.");
  }

  async compare(plainPassword, hashedPassword) {
    throw new Error("Método compare não implementado.");
  }
}

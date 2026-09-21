import bcrypt from "bcryptjs";
import { IPasswordHasher } from "@/application/ports/IPasswordHasher";

export class BcryptPasswordHasher extends IPasswordHasher {
  async hash(plainPassword) {
    return await bcrypt.hash(plainPassword, 10);
  }

  async compare(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

// Faz o Node resolver os imports do projeto como o Next faz: alias "@/" → src/ e ficheiros sem ".js".
import { pathToFileURL } from "node:url";
import path from "node:path";

const SRC = path.resolve(import.meta.dirname, "../src");

export async function resolve(specifier, context, next) {
  if (specifier.startsWith("@/")) {
    specifier = pathToFileURL(path.join(SRC, specifier.slice(2))).href;
  }
  try {
    return await next(specifier, context);
  } catch (err) {
    if (err.code === "ERR_MODULE_NOT_FOUND" || err.code === "ERR_UNSUPPORTED_DIR_IMPORT") {
      return await next(specifier + ".js", context);
    }
    throw err;
  }
}

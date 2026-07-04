// Prefixo de caminho para hospedagem em subdiretório (GitHub Pages project site).
// Definido em build via NEXT_PUBLIC_BASE_PATH (ex.: "/type-the-truth").
// Vazio = hospedado na raiz (domínio próprio ou user/org site).
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Prefixa um caminho absoluto do site com o basePath. */
export function withBase(path: string): string {
  return `${BASE_PATH}${path}`;
}

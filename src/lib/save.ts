// Exportar / importar o arquivo de save (backup do usuário).

import { exportAll, importAll, type SaveFile } from "./db";

export async function downloadSave(): Promise<void> {
  const data = await exportAll();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `type-the-truth-save-${date}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function importSaveFromFile(file: File): Promise<void> {
  const text = await file.text();
  let parsed: SaveFile;
  try {
    parsed = JSON.parse(text) as SaveFile;
  } catch {
    throw new Error("Arquivo inválido: não é um JSON válido.");
  }
  await importAll(parsed);
}

/** Lê um arquivo de imagem, redimensiona no navegador e devolve um data URL leve. */
export async function fileToDataUrl(
  file: File,
  maxSize = 256,
  quality = 0.82,
): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Arquivo não é uma imagem");
  if (file.size > 8 * 1024 * 1024) throw new Error("Imagem muito grande (máx. 8MB)");

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Falha ao ler a imagem"));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Imagem inválida"));
    el.src = dataUrl;
  });

  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}

/** Identificador anônimo estável por navegador (para o ranking de curtidas). */
export function getClientId(): string {
  if (typeof window === "undefined") return "server";
  const KEY = "floptv_client_id";
  let id = window.localStorage.getItem(KEY);
  if (!id) {
    id = `c_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    window.localStorage.setItem(KEY, id);
  }
  return id;
}
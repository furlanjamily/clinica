/** Captura um elemento DOM como imagem PNG em base64 (alta resolução). */
export async function captureElementAsImage(element: HTMLElement): Promise<string> {
  const { default: html2canvas } = await import("html2canvas")

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
  })

  return canvas.toDataURL("image/png")
}

/** Aguarda layout e pintura antes da captura. */
export function waitForChartPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(resolve, 120)
      })
    })
  })
}

/** Converte URL relativa do logo em data URL para uso no PDF. */
export async function fetchImageAsDataUrl(path: string): Promise<string> {
  const response = await fetch(path)
  if (!response.ok) throw new Error("Não foi possível carregar o logo da clínica.")

  const blob = await response.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result)
      else reject(new Error("Falha ao converter logo."))
    }
    reader.onerror = () => reject(new Error("Falha ao converter logo."))
    reader.readAsDataURL(blob)
  })
}

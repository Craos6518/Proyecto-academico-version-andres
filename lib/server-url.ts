export function getServerBaseUrl(h?: { get(name: string): string | null } | undefined): string {
  const host = h?.get("host") || process.env.HOST || "localhost:3000"
  let base = process.env.NEXT_PUBLIC_SITE_URL

  // Corrección automática del protocolo para evitar ERR_SSL_WRONG_VERSION_NUMBER en local
  if (!base || base.includes("https://localhost") || base.includes("https://127.0.0.1")) {
    base = `http://${host}`
  } else if (!base.startsWith("http")) {
    base = `http://${host}`
  }

  return base
}

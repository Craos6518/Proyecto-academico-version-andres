import { headers } from "next/headers"

/**
 * Construye una URL absoluta para llamadas server-side internas.
 * - Prefiere NEXT_PUBLIC_SITE_URL si está configurada.
 * - Si no, intenta derivar host y protocolo de headers (x-forwarded-host/x-forwarded-proto).
 * - Para hosts que contienen 'localhost' fuerza 'http' para evitar https://localhost:... que no sirve en dev.
 */
export function makeAbsolute(path: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "")
  if (siteUrl && siteUrl.length) return `${siteUrl}${path}`

  const hdrsLocal = headers()
  const host = hdrsLocal.get("x-forwarded-host") || hdrsLocal.get("host")
  const proto = hdrsLocal.get("x-forwarded-proto") || (host && host.includes("localhost") ? "http" : "https")
  if (host) return `${proto}://${host}${path}`

  return `http://localhost:3000${path}`
}

export default makeAbsolute

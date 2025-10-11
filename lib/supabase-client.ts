
"use server"

import { createClient } from "@supabase/supabase-js"

// Se esperan estas variables de entorno en Vercel/Next
// Usamos varios nombres posibles para adaptarnos a distintos archivos .env
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ""
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ""
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.NEXT_PRIVATE_SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE ||
  ""

if (!SUPABASE_URL) {
  console.warn("Supabase URL no configurado: NEXT_PUBLIC_SUPABASE_URL falta")
}

if (!SUPABASE_ANON_KEY) {
  console.warn("Supabase anon key no configurada: NEXT_PUBLIC_SUPABASE_ANON_KEY falta")
}

if (!SUPABASE_SERVICE_KEY) {
  console.warn(
    "Supabase service key no configurada: (buscando SUPABASE_SERVICE_KEY | NEXT_PRIVATE_SUPABASE_SERVICE_KEY | SUPABASE_SERVICE_ROLE_KEY). Añade la service_role key en .env.local",
  )
}

// Cliente para uso en navegador/cliente (anon key)
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Cliente con service role key para operaciones administrativas/server-side
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

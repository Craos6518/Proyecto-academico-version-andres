/* eslint-disable @typescript-eslint/no-explicit-any */
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

// Detect test environment (Vitest sets VITEST=true)
const IS_TEST = process.env.NODE_ENV === 'test' || !!process.env.VITEST

if (!IS_TEST && !SUPABASE_URL) {
  console.warn("Supabase URL no configurado: NEXT_PUBLIC_SUPABASE_URL falta")
}

if (!IS_TEST && !SUPABASE_ANON_KEY) {
  console.warn("Supabase anon key no configurada: NEXT_PUBLIC_SUPABASE_ANON_KEY falta")
}

if (!IS_TEST && !SUPABASE_SERVICE_KEY) {
  console.warn(
    "Supabase service key no configurada: (buscando SUPABASE_SERVICE_KEY | NEXT_PRIVATE_SUPABASE_SERVICE_KEY | SUPABASE_SERVICE_ROLE_KEY). Añade la service_role key en .env.local",
  )
}

// Helper: minimal chainable query used in tests
const makeQuery = () => {
  const query: any = {}
  const chainable = ["select", "eq", "order", "limit", "insert", "update", "delete", "in", "or", "single", "maybeSingle"]
  chainable.forEach((m) => {
    // ignore args in the stub
    query[m] = () => query
  })
  query.then = (onfulfilled: any, onrejected: any) => Promise.resolve({ data: [], error: null }).then(onfulfilled, onrejected)
  return query
}

// Cliente para uso en navegador/cliente (anon key)
export const supabase = IS_TEST ? makeQuery() : createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Cliente con service role key para operaciones administrativas/server-side
let _supabaseAdmin: any
if (IS_TEST) {
  // supabaseAdmin.from(table) signature expected elsewhere; the stub ignores the arg
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const from = (_table: string) => makeQuery()
  _supabaseAdmin = {
    from,
    auth: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      getUser: async (_token?: string) => ({ data: { user: { id: 1, email: 'test@example.com' } }, error: null }),
    },
  }
} else {
  _supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export const supabaseAdmin = _supabaseAdmin

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
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

// Helper: minimal, in-memory stub for tests. Keeps a tiny dataset that tests rely on.
const makeTestDb = () => {
  const testData: Record<string, any[]> = {
    users: [
      { id: 1, username: 'admin', email: 'admin@example.com', first_name: 'Admin', last_name: 'User', role_id: 1, role_name: 'Administrador', is_active: true, cedula: '12345678' },
    ],
    roles: [
      { id: 1, name: 'Administrador', description: 'Admin role' },
    ],
    enrollments: [],
    grades: [],
    assignments: [],
    subjects: [],
  }

  function matchFilters(row: Record<string, any>, filters: Record<string, any>) {
    for (const k of Object.keys(filters)) {
      if (row[k] != filters[k]) return false
    }
    return true
  }

  const from = (table: string) => {
    const ctx: any = { _table: table, _filters: {}, _limit: undefined }

    ctx.select = (..._args: any[]) => ctx
    ctx.eq = (col: string, val: any) => { ctx._filters[col] = val; return ctx }
    ctx.order = (_col: string, _opts?: any) => ctx
    ctx.limit = (n: number) => { ctx._limit = n; return ctx }
    ctx.in = (_col: string, vals: any[]) => { ctx._filters['_in'] = { col: _col, vals }; return ctx }
    ctx.or = (_expr: string) => { ctx._or = _expr; return ctx }

    ctx.maybeSingle = async () => {
      const rows = (testData[table] || []).filter((r: any) => matchFilters(r, ctx._filters))
      const row = rows.length > 0 ? rows[0] : null
      return { data: row, error: null }
    }

    ctx.single = async () => {
      const rows = (testData[table] || []).filter((r: any) => matchFilters(r, ctx._filters))
      const row = rows.length > 0 ? rows[0] : null
      return { data: row, error: null }
    }

    ctx.then = (onfulfilled: any, onrejected: any) => {
      const rows = (testData[table] || []).filter((r: any) => matchFilters(r, ctx._filters))
      const out = ctx._limit ? rows.slice(0, ctx._limit) : rows
      return Promise.resolve({ data: out, error: null }).then(onfulfilled, onrejected)
    }

    // Implement insert as a chainable call to better emulate supabase-js behavior
    ctx.insert = (payload: any) => {
      const chain = {
        _payload: Array.isArray(payload) ? payload[0] : payload,
        select: function () {
          // perform insertion now
          const rec = { ...(this._payload || {}) }
          if (!rec.id) {
            const maxId = (testData[table] || []).reduce((m, r) => Math.max(m, Number(r.id || 0)), 0)
            rec.id = maxId + 1
          }
          // Enforce some uniqueness constraints in the test stub to simulate DB behavior
          if (table === 'users') {
            testData[table] = testData[table] || []
            // check unique username/email/cedula
            const dup = (testData[table] || []).find((r: any) =>
              (rec.username && r.username === rec.username) ||
              (rec.email && r.email === rec.email) ||
              (rec.cedula && r.cedula === rec.cedula)
            )
            if (dup) {
              return {
                limit: () => ({ single: async () => ({ data: null, error: { code: '23505', message: 'duplicate key value violates unique constraint' } }) }),
              }
            }
            testData[table].push(rec)
            return { limit: () => ({ single: async () => ({ data: rec, error: null }) }) }
          }

          testData[table] = testData[table] || []
          testData[table].push(rec)
          return { limit: () => ({ single: async () => ({ data: rec, error: null }) }) }
        },
      }
      return chain
    }

    ctx.update = async (updates: any) => {
      const rows = (testData[table] || []).filter((r: any) => matchFilters(r, ctx._filters))
      if (rows.length === 0) return { data: null, error: null }
      const row = rows[0]
      Object.assign(row, updates)
      return { data: row, error: null }
    }

    ctx.delete = async () => {
      const rows = (testData[table] || []).filter((r: any) => matchFilters(r, ctx._filters))
      testData[table] = (testData[table] || []).filter((r: any) => !matchFilters(r, ctx._filters))
      return { data: rows, error: null }
    }

    return ctx
  }

  return { from }
}

// Test DB instance (only created in test mode)
const _testDb = IS_TEST ? makeTestDb() : undefined

// Cliente para uso en navegador/cliente (anon key)
export const supabase = IS_TEST ? (_testDb as any) : createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Cliente con service role key para operaciones administrativas/server-side
let _supabaseAdmin: any
if (IS_TEST) {
  // supabaseAdmin uses the same test DB stub
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const from = (_table: string) => (_testDb as any).from(_table)
  _supabaseAdmin = {
    from,
    // eslint-disable-next-line @typescript-eslint/no-unused_vars
    auth: { getUser: async (_token?: string) => ({ data: { user: { id: 1, email: 'test@example.com' } }, error: null }) },
  }
} else {
  _supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export const supabaseAdmin = _supabaseAdmin

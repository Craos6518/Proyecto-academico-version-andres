import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabase-client'
import { verifyJWT, normalizeRole } from '../../../lib/auth'

function extractToken(req: NextApiRequest): string | null {
  // Authorization: Bearer <token>
  const auth = req.headers.authorization || req.headers.Authorization
  if (typeof auth === 'string' && auth.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim()
  }

  // cookie: auth_token=...
  const cookieHeader = req.headers.cookie
  if (cookieHeader) {
    const match = cookieHeader.match(/auth_token=([^;\s]+)/)
    if (match) return match[1]
  }

  // query param
  const q = (req.query && (req.query.token || req.query.auth_token)) as string | undefined
  if (q) return q

  return null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' })

  const token = extractToken(req)
  if (!token) return res.status(401).json({ message: 'token not provided' })

  const payload = verifyJWT(token as string)
  if (!payload) return res.status(401).json({ message: 'invalid token' })

  try {
    // Buscar usuario en la tabla users por id o username
    const maybeId = Number(payload.id)
    let data: any = null
    let error: any = null
    if (!Number.isNaN(maybeId)) {
      const res = await supabaseAdmin.from('users').select('*').eq('id', maybeId).limit(1).maybeSingle()
      data = res.data
      error = res.error
    } else {
      const res = await supabaseAdmin.from('users').select('*').eq('username', payload.username).limit(1).maybeSingle()
      data = res.data
      error = res.error
    }
    if (error) {
      console.error('me endpoint db error:', error)
      return res.status(500).json({ message: 'db error' })
    }

    const user = (data as any) || null
    if (!user) return res.status(404).json({ message: 'user not found' })

    const rawRole = user.roleName ?? user.role ?? user.role_name ?? ""
    const roleKey = normalizeRole(rawRole)
    return res.status(200).json({
      id: user.id,
      username: user.username,
      roleName: rawRole,
      role: roleKey,
      email: user.email,
      firstName: user.first_name ?? user.firstName,
      lastName: user.last_name ?? user.lastName,
    })
  } catch (err) {
    console.error('me endpoint error:', err)
    return res.status(500).json({ message: 'internal error' })
  }
}

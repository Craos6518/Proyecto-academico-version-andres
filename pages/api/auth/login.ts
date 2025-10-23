import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabase-client'
import bcrypt from 'bcryptjs'
import { generateJWT, normalizeRole } from '../../../lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' })

  const { username, password } = req.body || {}
  console.log(`[auth/login] intento de login: user=${username} time=${new Date().toISOString()}`)

  if (!username || !password) return res.status(400).json({ message: 'username and password required' })

  try {
    const { data, error } = await supabaseAdmin.from('users').select('*').eq('username', username).limit(1).maybeSingle()
    if (error) {
      console.error('[auth/login] DB error:', error)
      return res.status(500).json({ message: 'error interno' })
    }

    const user = (data as any) || null
    if (!user) {
      console.log(`[auth/login] usuario no encontrado: ${username}`)
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos' })
    }

    const hash = user.password_hash || user.passwordHash || user.password
    if (!hash) {
      console.log(`[auth/login] usuario sin hash de contraseña: ${username}`)
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos' })
    }

    // Soportar contraseñas almacenadas en texto plano (seed actual) o bcrypt
    let match = false
    try {
      const isBcrypt = typeof hash === 'string' && hash.startsWith('$2')
      if (isBcrypt) {
        match = bcrypt.compareSync(String(password), String(hash))
      } else {
        // comparación directa si la contraseña está en claro (solo para entornos de desarrollo/seed)
        match = String(password) === String(hash)
      }
    } catch (e) {
      console.error('[auth/login] bcrypt/compare error:', e)
      match = false
    }

    if (!match) {
      console.log(`[auth/login] contraseña inválida para: ${username}`)
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos' })
    }

    console.log(`[auth/login] login exitoso: ${username}`)
  const token = generateJWT({ ...(user as any) } as any)
    const rawRole = user.roleName ?? user.role ?? user.role_name ?? ''
    const roleKey = normalizeRole(rawRole)

  // Set HttpOnly cookie with token (server-side session)
  const maxAge = 60 * 60 * 8 // 8h
  const secureFlag = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  res.setHeader('Set-Cookie', `academic_auth_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secureFlag}`)
    // Normalize name fields to make client display consistent
    const firstName = (user as any).first_name ?? (user as any).firstName ?? ""
    const lastName = (user as any).last_name ?? (user as any).lastName ?? ""
    const email = (user as any).email ?? ""
  const displayName = ((user as any).display_name ?? (user as any).displayName ?? (`${firstName} ${lastName}`.trim())) || undefined

    // For security, do not return the token in the JSON body. Clients should rely on the HttpOnly cookie.
    return res.status(200).json({
      ok: true,
      user: {
        id: user.id,
        username: user.username,
        firstName,
        lastName,
        displayName,
        email,
        roleName: rawRole,
        role: roleKey,
      },
    })
  } catch (err) {
    console.error('[auth/login] error:', err)
    return res.status(500).json({ message: 'error interno' })
  }
}

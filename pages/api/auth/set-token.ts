import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' })
  const { token } = req.body || {}
  if (!token) return res.status(400).json({ message: 'token required' })

  // Set cookie (not HttpOnly so client-side can still access if needed)
  const maxAge = 60 * 60 * 8 // 8 hours
  res.setHeader('Set-Cookie', `academic_auth_token=${token}; Path=/; Max-Age=${maxAge}; SameSite=Lax`)
  return res.status(200).json({ ok: true })
}

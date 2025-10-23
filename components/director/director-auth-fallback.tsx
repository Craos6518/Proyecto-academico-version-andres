"use client"

import { useEffect } from 'react'
import { authService } from '@/lib/auth'

export default function DirectorAuthFallback() {
  useEffect(() => {
    // Instead of posting a client-side token to set a cookie, rely on server-side cookie.
    // Check /api/auth/me using same-origin credentials. If server has the cookie, it will return the user.
    fetch('/api/auth/me', { method: 'GET', credentials: 'same-origin' })
      .then((r) => {
        if (!r.ok) throw new Error('no session')
        return r.json()
      })
      .then((data) => {
        if (data && data.user) {
          authService.setCurrentUser(data.user)
          window.location.reload()
        } else {
          window.location.href = '/'
        }
      })
      .catch(() => {
        window.location.href = '/'
      })
  }, [])

  return <div>Verificando sesión...</div>
}

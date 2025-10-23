"use client"

import { useEffect } from 'react'
import { authService } from '@/lib/auth'

export default function DirectorAuthFallback() {
  useEffect(() => {
    const token = authService.getCurrentUser()?.token
    if (!token) {
      // no token client-side -> redirect to home
      window.location.href = '/'
      return
    }

    // POST token to server to set cookie, then reload
    fetch('/api/auth/set-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(() => {
        window.location.reload()
      })
      .catch(() => {
        window.location.href = '/'
      })
  }, [])

  return <div>Estableciendo sesión...</div>
}
